import React, { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { XCircle, PlusCircle, Trash2 } from 'lucide-react';
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type BulkEntry = {
  startSph: string;
  endSph: string;
  startCyl: string;
  endCyl: string;
  quantity: string;
  quantityUnit: 'pair' | 'single';
};

type FormValues = {
  grid: Record<string, string>;
  bulk: BulkEntry[];
  lensType: string;
  lensThickness: string;
  lensColour: string;
  lensDiameter: string;
  lensCoating: string;
  restockReason: string;
  restockDetails: string;
};

const cylSteps = Array.from({ length: 17 }, (_, i) => (i * 0.25).toFixed(2));
const sphSteps = Array.from({ length: 33 }, (_, i) => ((i * 0.5) - 6).toFixed(2));

export default function AddLenses() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, setValue, watch, getValues } = useForm<FormValues>({
    defaultValues: {
      grid: {},
      bulk: [
        {
          startSph: '',
          endSph: '',
          startCyl: '',
          endCyl: '',
          quantity: '',
          quantityUnit: 'pair'
        }
      ],
      lensType: '',
      lensThickness: '',
      lensColour: '',
      lensDiameter: '',
      lensCoating: '',
      restockReason: '',
      restockDetails: ''
    }
  });

  const { fields, append, remove } = useFieldArray({ name: 'bulk', control });
  const bulkValues = watch('bulk');
  const gridValues = watch('grid');

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      console.log('Processing lens stock data...');
      console.log('Grid data:', data.grid);
      
      // Prepare lens entries from grid data
      const lensEntries = [];
      
      for (const [key, quantity] of Object.entries(data.grid)) {
        const qtyString = String(quantity || '').trim();
        const qty = parseInt(qtyString);
        console.log(`Processing ${key}: "${quantity}" (${typeof quantity}) -> "${qtyString}" -> ${qty}`);
        
        if (!isNaN(qty) && qty > 0) {
          const [, sph, cyl] = key.split('__');
          if (sph && cyl) {
            lensEntries.push({
              sph: parseFloat(sph),
              cyl: parseFloat(cyl),
              quantity: qty,
              lens_type: data.lensType || null,
              lens_thickness: data.lensThickness || null,
              lens_colour: data.lensColour || null,
              lens_diameter: data.lensDiameter || null,
              lens_coating: data.lensCoating || null,
              restock_reason: data.restockReason || null,
              restock_details: data.restockDetails || null
            });
          }
        }
      }

      console.log('Lens entries to process:', lensEntries);

      if (lensEntries.length === 0) {
        toast({
          title: "No Data",
          description: "Please add some lens quantities before submitting.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Process each lens entry individually
      let successCount = 0;
      let errorCount = 0;

      for (const entry of lensEntries) {
        try {
          console.log(`Processing lens entry: sph=${entry.sph}, cyl=${entry.cyl}, qty=${entry.quantity}`);
          
          // First check if lens already exists
          const { data: existingLens, error: checkError } = await supabase
            .from('lenses')
            .select('id, quantity')
            .eq('sph', entry.sph)
            .eq('cyl', entry.cyl)
            .maybeSingle();

          if (checkError) {
            console.error('Error checking existing lens:', checkError);
            errorCount++;
            continue;
          }

          if (existingLens) {
            // Update existing lens
            const newQuantity = existingLens.quantity + entry.quantity;
            const { error: updateError } = await supabase
              .from('lenses')
              .update({
                quantity: newQuantity,
                lens_type: entry.lens_type,
                lens_thickness: entry.lens_thickness,
                lens_colour: entry.lens_colour,
                lens_diameter: entry.lens_diameter,
                lens_coating: entry.lens_coating,
                restock_reason: entry.restock_reason,
                restock_details: entry.restock_details,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingLens.id);

            if (updateError) {
              console.error('Error updating lens:', updateError);
              errorCount++;
            } else {
              console.log(`Updated existing lens (${entry.sph}, ${entry.cyl}) - new quantity: ${newQuantity}`);
              successCount++;
            }
          } else {
            // Insert new lens
            const { error: insertError } = await supabase
              .from('lenses')
              .insert([{
                sph: entry.sph,
                cyl: entry.cyl,
                quantity: entry.quantity,
                lens_type: entry.lens_type,
                lens_thickness: entry.lens_thickness,
                lens_colour: entry.lens_colour,
                lens_diameter: entry.lens_diameter,
                lens_coating: entry.lens_coating,
                restock_reason: entry.restock_reason,
                restock_details: entry.restock_details
              }]);

            if (insertError) {
              console.error('Error inserting lens:', insertError);
              errorCount++;
            } else {
              console.log(`Inserted new lens (${entry.sph}, ${entry.cyl}) with quantity ${entry.quantity}`);
              successCount++;
            }
          }
        } catch (entryError) {
          console.error(`Error processing lens entry (${entry.sph}, ${entry.cyl}):`, entryError);
          errorCount++;
        }
      }
      
      // Show results
      if (successCount > 0 && errorCount === 0) {
        toast({
          title: "Success",
          description: `Successfully processed ${successCount} lens entries.`,
        });
        
        // Reset form
        reset({
          grid: {},
          bulk: [
            {
              startSph: '',
              endSph: '',
              startCyl: '',
              endCyl: '',
              quantity: '',
              quantityUnit: 'pair'
            }
          ],
          lensType: '',
          lensThickness: '',
          lensColour: '',
          lensDiameter: '',
          lensCoating: '',
          restockReason: '',
          restockDetails: ''
        });
      } else if (successCount > 0 && errorCount > 0) {
        toast({
          title: "Partial Success",
          description: `Processed ${successCount} entries successfully, ${errorCount} failed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to process ${errorCount} entries. Please check the console for details.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding lens stock:', error);
      toast({
        title: "Error",
        description: "Failed to add lens stock. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyBulk = (entry: BulkEntry) => {
    const startSph = parseFloat(entry.startSph);
    const startCyl = parseFloat(entry.startCyl);
    const qty = parseInt(entry.quantity);
    const quantityPerCell = entry.quantityUnit === 'pair' ? qty * 2 : qty;

    const endSph = entry.endSph ? parseFloat(entry.endSph) : startSph;
    const endCyl = entry.endCyl ? parseFloat(entry.endCyl) : startCyl;

    // Get current grid values
    const currentGrid = getValues('grid');
    const updatedGrid = { ...currentGrid };

    sphSteps.forEach(sph => {
      cylSteps.forEach(cyl => {
        const s = parseFloat(sph);
        const c = parseFloat(cyl);
        if (s >= startSph && s <= endSph && c >= startCyl && c <= endCyl) {
          const key = `cell__${sph}__${cyl}`;
          updatedGrid[key] = quantityPerCell.toString();
        }
      });
    });

    // Update the entire grid object at once
    setValue('grid', updatedGrid);
  };

  const resetGrid = () => {
    reset({
      grid: {},
      bulk: [
        {
          startSph: '',
          endSph: '',
          startCyl: '',
          endCyl: '',
          quantity: '',
          quantityUnit: 'pair'
        }
      ],
      lensType: '',
      lensThickness: '',
      lensColour: '',
      lensDiameter: '',
      lensCoating: '',
      restockReason: '',
      restockDetails: ''
    });
  };

  // Helper function to handle grid cell changes
  const handleGridCellChange = (key: string, value: string) => {
    setValue(`grid.${key}` as any, value);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Lens Stock</h1>
          <p className="text-gray-600">Use the grid system to add lens inventory in bulk</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lens Stock Grid</CardTitle>
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
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Restock Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Restock Information</h3>
                <p className="text-sm text-gray-600">This information will be applied to all lens entries created from the grid below.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Restock Reason</Label>
                    <Controller
                      name="restockReason"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New Stock">New Stock</SelectItem>
                            <SelectItem value="Correction">Correction</SelectItem>
                            <SelectItem value="Return">Return</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Restock Details</Label>
                    <Controller
                      name="restockDetails"
                      control={control}
                      render={({ field }) => (
                        <Textarea 
                          {...field} 
                          placeholder="Provide additional information about this restock..."
                          className="min-h-[80px]"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Lens Product Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Lens Product Information</h3>
                <p className="text-sm text-gray-600">These specifications will be applied to all lens entries created from the grid below.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Lens Type</Label>
                    <Controller
                      name="lensType"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select lens type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CR39">CR39</SelectItem>
                            <SelectItem value="Polycarbonate">Polycarbonate</SelectItem>
                            <SelectItem value="Aspheric">Aspheric</SelectItem>
                            <SelectItem value="Trivex">Trivex</SelectItem>
                            <SelectItem value="Photochromic">Photochromic</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <Label>Lens Thickness</Label>
                    <Controller
                      name="lensThickness"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select thickness" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1.50">1.50</SelectItem>
                            <SelectItem value="1.53">1.53</SelectItem>
                            <SelectItem value="1.56">1.56</SelectItem>
                            <SelectItem value="1.59">1.59</SelectItem>
                            <SelectItem value="1.60">1.60</SelectItem>
                            <SelectItem value="1.67">1.67</SelectItem>
                            <SelectItem value="1.70">1.70</SelectItem>
                            <SelectItem value="1.80">1.80</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <Label>Lens Colour</Label>
                    <Controller
                      name="lensColour"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select colour" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Clear">Clear</SelectItem>
                            <SelectItem value="Grey">Grey</SelectItem>
                            <SelectItem value="Brown">Brown</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <Label>Lens Diameter</Label>
                    <Controller
                      name="lensDiameter"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select diameter (MM)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="65">65</SelectItem>
                            <SelectItem value="70">70</SelectItem>
                            <SelectItem value="75">75</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Lens Coating</Label>
                    <Controller
                      name="lensCoating"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select coating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UC">UC</SelectItem>
                            <SelectItem value="HC">HC</SelectItem>
                            <SelectItem value="HMC">HMC</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Bulk Entry Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Bulk Entry Helper</h3>
                <p className="text-sm text-gray-600">Use this section to quickly populate the grid below. This is just a helper tool - the actual data comes from the individual grid cells.</p>
                
                {fields.map((field, index) => {
                  const effectiveQuantity = (parseInt(bulkValues[index]?.quantity) || 0) * (bulkValues[index]?.quantityUnit === 'pair' ? 2 : 1);
                  return (
                    <Card key={field.id} className="bg-gray-50">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">Bulk Entry #{index + 1}</CardTitle>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => remove(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Start Sph</Label>
                            <Controller 
                              name={`bulk.${index}.startSph`} 
                              control={control} 
                              render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Start Sph" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sphSteps.map(val => (
                                      <SelectItem key={val} value={val}>{val}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )} 
                            />
                          </div>
                          <div>
                            <Label>End Sph</Label>
                            <Controller 
                              name={`bulk.${index}.endSph`} 
                              control={control} 
                              render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="End Sph" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sphSteps.map(val => (
                                      <SelectItem key={val} value={val}>{val}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )} 
                            />
                          </div>
                          <div>
                            <Label>Start Cyl</Label>
                            <Controller 
                              name={`bulk.${index}.startCyl`} 
                              control={control} 
                              render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Start Cyl" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {cylSteps.map(val => (
                                      <SelectItem key={val} value={val}>{val}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )} 
                            />
                          </div>
                          <div>
                            <Label>End Cyl</Label>
                            <Controller 
                              name={`bulk.${index}.endCyl`} 
                              control={control} 
                              render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="End Cyl" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {cylSteps.map(val => (
                                      <SelectItem key={val} value={val}>{val}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )} 
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-end">
                          <div>
                            <Label>Quantity</Label>
                            <Controller 
                              name={`bulk.${index}.quantity`} 
                              control={control} 
                              render={({ field }) => (
                                <Input {...field} type="number" min="0" />
                              )} 
                            />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Controller 
                              name={`bulk.${index}.quantityUnit`} 
                              control={control} 
                              render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pair">Pairs</SelectItem>
                                    <SelectItem value="single">Single</SelectItem>
                                  </SelectContent>
                                </Select>
                              )} 
                            />
                          </div>
                          <div>
                            <Button 
                              type="button" 
                              onClick={() => applyBulk(bulkValues[index])}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Apply to Grid
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          Effective Quantity: <span className="font-medium">{effectiveQuantity}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => append({ startSph: '', endSph: '', startCyl: '', endCyl: '', quantity: '', quantityUnit: 'pair' })}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Bulk Entry
                </Button>
              </div>

              {/* Grid Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Lens Quantity Grid</h3>
                <p className="text-sm text-gray-600">Enter quantities for each SPH/CYL combination. Each cell represents individual lenses to be added to inventory.</p>
                
                <div className="overflow-auto border rounded-lg">
                  <table className="min-w-full table-auto text-center">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 font-medium">Sph \ Cyl</th>
                        {cylSteps.map(cyl => (
                          <th key={cyl} className="p-3 font-medium">{cyl}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sphSteps.map(sph => (
                        <tr key={sph} className="border-t">
                          <td className="p-3 bg-gray-50 font-medium">{sph}</td>
                          {cylSteps.map(cyl => {
                            const key = `cell__${sph}__${cyl}`;
                            const cellValue = gridValues[key] || '';
                            const value = parseInt(String(cellValue)) || 0;
                            const highlight = value > 0 ? 'bg-green-100' : '';
                            return (
                              <td key={cyl} className={`p-1 ${highlight}`}>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  className="w-16 h-8 text-xs text-center p-1"
                                  value={String(cellValue)}
                                  onChange={(e) => handleGridCellChange(key, e.target.value)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full md:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding Stock..." : "Submit Stock"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
