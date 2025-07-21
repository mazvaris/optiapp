
import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { XCircle, MinusCircle, Filter, Plus } from 'lucide-react';
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from '@tanstack/react-query';

interface Lens {
  id: string;
  sph: number;
  cyl: number;
  quantity: number;
  lens_type: string | null;
  lens_thickness: string | null;
  lens_colour: string | null;
  lens_diameter: string | null;
  lens_coating: string | null;
}

type FormValues = {
  grid: Record<string, number>;
  removalReason: string;
  removalDetails: string;
  filterLensType: string;
  filterLensThickness: string;
  filterLensColour: string;
  filterLensCoating: string;
  quickSelectSph: string;
  quickSelectCyl: string;
  quickSelectQuantity: string;
};

const cylSteps = Array.from({ length: 17 }, (_, i) => (i * 0.25).toFixed(2));
const sphSteps = Array.from({ length: 33 }, (_, i) => ((i * 0.5) - 6).toFixed(2));

export default function LensOut() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: lenses = [], isLoading, error, refetch } = useQuery({
    queryKey: ['lenses'],
    queryFn: async () => {
      console.log('Fetching lenses for removal...');
      const { data, error } = await supabase
        .from('lenses')
        .select('*')
        .order('sph')
        .order('cyl');
      
      if (error) {
        console.error('Error fetching lenses:', error);
        throw error;
      }
      
      console.log('Fetched lenses:', data);
      return data as Lens[];
    }
  });

  const { control, handleSubmit, reset, setValue, watch, getValues } = useForm<FormValues>({
    defaultValues: {
      grid: {},
      removalReason: '',
      removalDetails: '',
      filterLensType: '',
      filterLensThickness: '',
      filterLensColour: '',
      filterLensCoating: '',
      quickSelectSph: '',
      quickSelectCyl: '',
      quickSelectQuantity: ''
    }
  });

  const gridValues = watch('grid');
  const filters = watch(['filterLensType', 'filterLensThickness', 'filterLensColour', 'filterLensCoating']);

  // Get unique filter values
  const uniqueValues = useMemo(() => {
    return {
      types: [...new Set(lenses.map(l => l.lens_type).filter(Boolean))],
      thicknesses: [...new Set(lenses.map(l => l.lens_thickness).filter(Boolean))],
      colours: [...new Set(lenses.map(l => l.lens_colour).filter(Boolean))],
      coatings: [...new Set(lenses.map(l => l.lens_coating).filter(Boolean))]
    };
  }, [lenses]);

  // Filter lenses based on selected filters
  const filteredLenses = useMemo(() => {
    return lenses.filter(lens => {
      const [filterType, filterThickness, filterColour, filterCoating] = filters;
      return (!filterType || lens.lens_type === filterType) &&
             (!filterThickness || lens.lens_thickness === filterThickness) &&
             (!filterColour || lens.lens_colour === filterColour) &&
             (!filterCoating || lens.lens_coating === filterCoating);
    });
  }, [lenses, filters]);

  // Create grid data structure with filtered lenses
  const gridData = useMemo(() => {
    const grid: Record<string, Lens[]> = {};
    
    filteredLenses.forEach(lens => {
      const key = `cell__${lens.sph.toFixed(2)}__${lens.cyl.toFixed(2)}`;
      if (!grid[key]) {
        grid[key] = [];
      }
      grid[key].push(lens);
    });
    
    return grid;
  }, [filteredLenses]);

  const handleQuickSelect = () => {
    const sph = watch('quickSelectSph');
    const cyl = watch('quickSelectCyl');
    const quantity = watch('quickSelectQuantity');

    if (!sph || !cyl || !quantity) {
      toast({
        title: "Missing Information",
        description: "Please fill in SPH, CYL, and quantity for quick select.",
        variant: "destructive",
      });
      return;
    }

    const key = `cell__${parseFloat(sph).toFixed(2)}__${parseFloat(cyl).toFixed(2)}`;
    const currentValue = gridValues[key] || 0;
    const newValue = currentValue + parseInt(quantity);
    
    setValue(`grid.${key}`, newValue);
    
    // Reset quick select fields
    setValue('quickSelectSph', '');
    setValue('quickSelectCyl', '');
    setValue('quickSelectQuantity', '');

    toast({
      title: "Added to Selection",
      description: `Added ${quantity} lenses for SPH ${sph}, CYL ${cyl}`,
    });
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      console.log('Processing lens removal data...');
      console.log('Grid data:', data.grid);
      
      // Prepare lens removals from grid data
      const removalEntries = [];
      
      for (const [key, quantity] of Object.entries(data.grid)) {
        const qty = parseInt(quantity?.toString() || '0');
        console.log(`Processing ${key}: ${quantity} -> ${qty}`);
        if (qty > 0) {
          // Extract sph and cyl from key format: cell__sph__cyl
          const [, sph, cyl] = key.split('__');
          const cellLenses = gridData[key] || [];
          
          if (cellLenses.length === 0) {
            toast({
              title: "No Stock Available",
              description: `No lenses available for SPH ${sph}, CYL ${cyl}`,
              variant: "destructive",
            });
            continue;
          }

          // Calculate total available quantity for this cell
          const totalAvailable = cellLenses.reduce((sum, lens) => sum + lens.quantity, 0);
          
          if (qty > totalAvailable) {
            toast({
              title: "Insufficient Stock",
              description: `Only ${totalAvailable} lenses available for SPH ${sph}, CYL ${cyl}. Requested: ${qty}`,
              variant: "destructive",
            });
            continue;
          }

          removalEntries.push({
            sph: parseFloat(sph),
            cyl: parseFloat(cyl),
            quantityToRemove: qty,
            cellLenses
          });
        }
      }

      console.log('Lens removal entries to process:', removalEntries);

      if (removalEntries.length === 0) {
        toast({
          title: "No Data",
          description: "Please specify quantities to remove before submitting.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Process removals
      for (const entry of removalEntries) {
        let remainingToRemove = entry.quantityToRemove;
        
        // Sort lenses by quantity ascending to remove from smallest stocks first
        const sortedLenses = [...entry.cellLenses].sort((a, b) => a.quantity - b.quantity);
        
        for (const lens of sortedLenses) {
          if (remainingToRemove <= 0) break;
          
          const toRemoveFromThisLens = Math.min(remainingToRemove, lens.quantity);
          const newQuantity = lens.quantity - toRemoveFromThisLens;
          
          // Update the lens quantity
          const { error: updateError } = await supabase
            .from('lenses')
            .update({
              quantity: newQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', lens.id);

          if (updateError) {
            console.error('Error updating lens:', updateError);
            throw updateError;
          }

          remainingToRemove -= toRemoveFromThisLens;
          console.log(`Removed ${toRemoveFromThisLens} from lens ${lens.id}, new quantity: ${newQuantity}`);
        }
      }
      
      toast({
        title: "Success",
        description: `Successfully removed lenses from stock.`,
      });
      
      // Reset form and refetch data
      reset({
        grid: {},
        removalReason: '',
        removalDetails: '',
        filterLensType: '',
        filterLensThickness: '',
        filterLensColour: '',
        filterLensCoating: '',
        quickSelectSph: '',
        quickSelectCyl: '',
        quickSelectQuantity: ''
      });
      refetch();
    } catch (error) {
      console.error('Error removing lens stock:', error);
      toast({
        title: "Error",
        description: "Failed to remove lens stock. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetGrid = () => {
    reset({
      grid: {},
      removalReason: '',
      removalDetails: '',
      filterLensType: '',
      filterLensThickness: '',
      filterLensColour: '',
      filterLensCoating: '',
      quickSelectSph: '',
      quickSelectCyl: '',
      quickSelectQuantity: ''
    });
  };

  const getTotalQuantity = (lenses: Lens[]): number => {
    return lenses.reduce((sum, lens) => sum + lens.quantity, 0);
  };

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <p className="text-red-600">Error loading lens stock: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Remove Lens Stock</h1>
          <p className="text-gray-600">Use the grid system to remove lens inventory</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lens Stock Removal Grid</CardTitle>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetGrid}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reset Grid
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Filters Section */}
              {showFilters && (
                <div className="border-b pb-6 space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Lens Filters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Lens Type</Label>
                      <Controller
                        name="filterLensType"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Types</SelectItem>
                              {uniqueValues.types.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <Label>Thickness</Label>
                      <Controller
                        name="filterLensThickness"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Thicknesses" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Thicknesses</SelectItem>
                              {uniqueValues.thicknesses.map(thickness => (
                                <SelectItem key={thickness} value={thickness}>{thickness}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <Label>Colour</Label>
                      <Controller
                        name="filterLensColour"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Colours" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Colours</SelectItem>
                              {uniqueValues.colours.map(colour => (
                                <SelectItem key={colour} value={colour}>{colour}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <Label>Coating</Label>
                      <Controller
                        name="filterLensCoating"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Coatings" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Coatings</SelectItem>
                              {uniqueValues.coatings.map(coating => (
                                <SelectItem key={coating} value={coating}>{coating}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Select Section */}
              <div className="border-b pb-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Quick Select</h3>
                <p className="text-sm text-gray-600">Quickly add specific SPH/CYL combinations to your removal selection</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <Label>SPH</Label>
                    <Controller
                      name="quickSelectSph"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select SPH" />
                          </SelectTrigger>
                          <SelectContent>
                            {sphSteps.map(sph => (
                              <SelectItem key={sph} value={sph}>{sph}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label>CYL</Label>
                    <Controller
                      name="quickSelectCyl"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select CYL" />
                          </SelectTrigger>
                          <SelectContent>
                            {cylSteps.map(cyl => (
                              <SelectItem key={cyl} value={cyl}>{cyl}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Controller
                      name="quickSelectQuantity"
                      control={control}
                      render={({ field }) => (
                        <Input 
                          {...field} 
                          type="number" 
                          min="1" 
                          placeholder="Quantity"
                        />
                      )}
                    />
                  </div>
                  <Button type="button" onClick={handleQuickSelect}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Grid
                  </Button>
                </div>
              </div>

              {/* Removal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Removal Information</h3>
                <p className="text-sm text-gray-600">This information will be recorded for the lens removal transaction.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Removal Reason</Label>
                    <Controller
                      name="removalReason"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dispensed">Dispensed</SelectItem>
                            <SelectItem value="Damaged">Damaged</SelectItem>
                            <SelectItem value="Lost">Lost</SelectItem>
                            <SelectItem value="Correction">Stock Correction</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label>Details</Label>
                    <Controller
                      name="removalDetails"
                      control={control}
                      render={({ field }) => (
                        <Textarea 
                          {...field} 
                          placeholder="Provide additional information..."
                          className="min-h-[80px]"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Grid Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Lens Removal Grid</h3>
                <p className="text-sm text-gray-600">Enter quantities to remove for each SPH/CYL combination. Current stock is shown in each cell.</p>
                
                {isLoading ? (
                  <div className="text-center py-8">
                    <p>Loading lens stock...</p>
                  </div>
                ) : (
                  <div className="overflow-auto border rounded-lg">
                    <table className="min-w-full table-auto text-center">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 font-medium sticky left-0 bg-gray-100 z-10">Sph \ Cyl</th>
                          {cylSteps.map(cyl => (
                            <th key={cyl} className="p-3 font-medium">{cyl}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sphSteps.map(sph => (
                          <tr key={sph} className="border-t">
                            <td className="p-3 bg-gray-50 font-medium sticky left-0 z-10">{sph}</td>
                            {cylSteps.map(cyl => {
                              const key = `cell__${sph}__${cyl}`;
                              const cellLenses = gridData[key] || [];
                              const totalQuantity = getTotalQuantity(cellLenses);
                              const removalValue = parseInt(gridValues[key]?.toString() || '0');
                              
                              let bgColor = '';
                              if (totalQuantity === 0) {
                                bgColor = 'bg-gray-100';
                              } else if (removalValue > totalQuantity) {
                                bgColor = 'bg-red-100';
                              } else if (removalValue > 0) {
                                bgColor = 'bg-yellow-100';
                              } else {
                                bgColor = 'bg-white';
                              }

                              return (
                                <td key={cyl} className={`p-1 ${bgColor} relative group`}>
                                  <div className="space-y-1">
                                    <div className="text-xs text-gray-600">
                                      Stock: {totalQuantity}
                                    </div>
                                    <Controller
                                      name={`grid.${key}` as any}
                                      control={control}
                                      render={({ field }) => (
                                        <Input 
                                          {...field}
                                          type="number" 
                                          min="0" 
                                          max={totalQuantity}
                                          className="w-16 h-8 text-xs text-center p-1" 
                                          placeholder="0"
                                          disabled={totalQuantity === 0}
                                          value={field.value || ''}
                                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        />
                                      )}
                                    />
                                  </div>
                                  
                                  {/* Tooltip */}
                                  {cellLenses.length > 0 && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-black text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 min-w-48">
                                      <div className="font-semibold mb-1">SPH: {sph}, CYL: {cyl}</div>
                                      {cellLenses.map((lens, idx) => (
                                        <div key={lens.id} className="mb-1 last:mb-0">
                                          <div>Stock: {lens.quantity}</div>
                                          {lens.lens_type && <div>Type: {lens.lens_type}</div>}
                                          {lens.lens_coating && <div>Coating: {lens.lens_coating}</div>}
                                          {lens.lens_diameter && <div>⌀: {lens.lens_diameter}mm</div>}
                                          {idx < cellLenses.length - 1 && <hr className="my-1 border-gray-600" />}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full md:w-auto bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
              >
                <MinusCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? "Removing Stock..." : "Remove Stock"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-100 border rounded"></div>
                <span className="text-sm">No Stock Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-white border rounded"></div>
                <span className="text-sm">Stock Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-100 border rounded"></div>
                <span className="text-sm">Quantity to Remove</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 border rounded"></div>
                <span className="text-sm">Exceeds Available Stock</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
