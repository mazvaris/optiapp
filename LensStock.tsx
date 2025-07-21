
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

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
  restock_reason: string | null;
  restock_details: string | null;
  created_at: string;
  updated_at: string;
}

const cylSteps = Array.from({ length: 17 }, (_, i) => (i * 0.25).toFixed(2));
const sphSteps = Array.from({ length: 33 }, (_, i) => ((i * 0.5) - 6).toFixed(2));

export default function LensStock() {
  const [filters, setFilters] = useState({
    lensType: 'all',
    lensThickness: 'all',
    lensColour: 'all',
    lensDiameter: 'all',
    lensCoating: 'all'
  });

  const { data: lenses = [], isLoading, error, refetch } = useQuery({
    queryKey: ['lenses'],
    queryFn: async () => {
      console.log('Fetching lenses...');
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

  // Get unique filter values from the data
  const filterOptions = useMemo(() => {
    const types = new Set<string>();
    const thicknesses = new Set<string>();
    const colours = new Set<string>();
    const diameters = new Set<string>();
    const coatings = new Set<string>();

    lenses.forEach(lens => {
      if (lens.lens_type) types.add(lens.lens_type);
      if (lens.lens_thickness) thicknesses.add(lens.lens_thickness);
      if (lens.lens_colour) colours.add(lens.lens_colour);
      if (lens.lens_diameter) diameters.add(lens.lens_diameter);
      if (lens.lens_coating) coatings.add(lens.lens_coating);
    });

    return {
      types: Array.from(types).sort(),
      thicknesses: Array.from(thicknesses).sort(),
      colours: Array.from(colours).sort(),
      diameters: Array.from(diameters).sort(),
      coatings: Array.from(coatings).sort()
    };
  }, [lenses]);

  // Filter lenses based on current filters
  const filteredLenses = useMemo(() => {
    return lenses.filter(lens => {
      if (filters.lensType !== 'all' && lens.lens_type !== filters.lensType) return false;
      if (filters.lensThickness !== 'all' && lens.lens_thickness !== filters.lensThickness) return false;
      if (filters.lensColour !== 'all' && lens.lens_colour !== filters.lensColour) return false;
      if (filters.lensDiameter !== 'all' && lens.lens_diameter !== filters.lensDiameter) return false;
      if (filters.lensCoating !== 'all' && lens.lens_coating !== filters.lensCoating) return false;
      return true;
    });
  }, [lenses, filters]);

  // Create grid data structure
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

  const clearFilters = () => {
    setFilters({
      lensType: 'all',
      lensThickness: 'all',
      lensColour: 'all',
      lensDiameter: 'all',
      lensCoating: 'all'
    });
  };

  const getTotalQuantity = (lenses: Lens[]): number => {
    return lenses.reduce((sum, lens) => sum + lens.quantity, 0);
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== 'all');

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <p className="text-red-600">Error loading lens stock: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lens Stock Overview</h1>
            <p className="text-gray-600">View current lens inventory using the grid system</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Filters</CardTitle>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <Label>Lens Type</Label>
                <Select value={filters.lensType} onValueChange={(value) => setFilters(prev => ({ ...prev, lensType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {filterOptions.types.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Thickness</Label>
                <Select value={filters.lensThickness} onValueChange={(value) => setFilters(prev => ({ ...prev, lensThickness: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Thicknesses</SelectItem>
                    {filterOptions.thicknesses.map(thickness => (
                      <SelectItem key={thickness} value={thickness}>{thickness}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Colour</Label>
                <Select value={filters.lensColour} onValueChange={(value) => setFilters(prev => ({ ...prev, lensColour: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Colours</SelectItem>
                    {filterOptions.colours.map(colour => (
                      <SelectItem key={colour} value={colour}>{colour}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Diameter</Label>
                <Select value={filters.lensDiameter} onValueChange={(value) => setFilters(prev => ({ ...prev, lensDiameter: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Diameters</SelectItem>
                    {filterOptions.diameters.map(diameter => (
                      <SelectItem key={diameter} value={diameter}>{diameter}mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Coating</Label>
                <Select value={filters.lensCoating} onValueChange={(value) => setFilters(prev => ({ ...prev, lensCoating: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Coatings</SelectItem>
                    {filterOptions.coatings.map(coating => (
                      <SelectItem key={coating} value={coating}>{coating}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filteredLenses.length}</div>
              <p className="text-xs text-muted-foreground">Unique SKUs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {filteredLenses.reduce((sum, lens) => sum + lens.quantity, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total Lenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {filteredLenses.filter(lens => lens.quantity === 0).length}
              </div>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Lens Stock Grid</CardTitle>
            <p className="text-sm text-gray-600">
              Each cell shows the total quantity for that SPH/CYL combination. 
              {hasActiveFilters && " Filtered results are shown."}
            </p>
          </CardHeader>
          <CardContent>
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
                          
                          let bgColor = '';
                          if (totalQuantity === 0) {
                            bgColor = 'bg-red-50';
                          } else if (totalQuantity <= 5) {
                            bgColor = 'bg-yellow-50';
                          } else if (totalQuantity <= 20) {
                            bgColor = 'bg-blue-50';
                          } else {
                            bgColor = 'bg-green-50';
                          }

                          return (
                            <td key={cyl} className={`p-1 ${bgColor} relative group cursor-pointer`}>
                              <div className="w-16 h-8 flex items-center justify-center text-xs font-medium">
                                {totalQuantity > 0 ? totalQuantity : ''}
                              </div>
                              
                              {/* Tooltip */}
                              {cellLenses.length > 0 && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-black text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 min-w-48">
                                  <div className="font-semibold mb-1">SPH: {sph}, CYL: {cyl}</div>
                                  {cellLenses.map((lens, idx) => (
                                    <div key={lens.id} className="mb-1 last:mb-0">
                                      <div>Qty: {lens.quantity}</div>
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
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-50 border rounded"></div>
                <span className="text-sm">Out of Stock (0)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-50 border rounded"></div>
                <span className="text-sm">Low Stock (1-5)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-50 border rounded"></div>
                <span className="text-sm">Medium Stock (6-20)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-50 border rounded"></div>
                <span className="text-sm">High Stock (21+)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
