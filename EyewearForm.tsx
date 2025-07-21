
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EyewearFormInputs {
  frame: string;
  prescription: string;
  usage: string;
  lensPackage: string;
  lensType: string;
}

interface Frame {
  id: string;
  code: number;
  brand: string;
  selling_price: number | null;
}

interface LensCosting {
  id: string;
  lens_type: string;
  lens_thickness: string | null;
  lens_coating: string | null;
  selling_price: number | null;
}

const lensTypePrices: Record<string, number> = {
  clear: 0,
  blue: 20,
  photochromic: 40,
  sunglasses: 25,
};

export default function EyewearForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch } = useForm<EyewearFormInputs>();
  const [total, setTotal] = useState(0);
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [selectedLensPackage, setSelectedLensPackage] = useState<LensCosting | null>(null);

  const frame = watch("frame");
  const usage = watch("usage");
  const lensPackage = watch("lensPackage");
  const lensType = watch("lensType");

  // Fetch frames from database
  const { data: frames, isLoading: framesLoading } = useQuery({
    queryKey: ['frames'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('frames')
        .select('id, code, brand, selling_price')
        .gt('quantity', 0)
        .order('code');
      
      if (error) throw error;
      return data as Frame[];
    }
  });

  // Fetch lens packages based on usage
  const { data: lensPackages, isLoading: lensPackagesLoading } = useQuery({
    queryKey: ['lensPackages', usage],
    queryFn: async () => {
      if (!usage) return [];
      
      let lensUse = '';
      if (usage === 'Single Vision - Distance' || usage === 'Near Vision - Reading' || usage === 'Non-prescription - Fashion') {
        lensUse = 'Single Vision';
      } else if (usage === 'Bifocal - Distance & Reading') {
        lensUse = 'Bifocal';
      } else if (usage === 'Progressive - Distance & Reading') {
        lensUse = 'Progressive';
      }

      if (!lensUse) return [];

      const { data, error } = await supabase
        .from('lens_costing')
        .select('id, lens_type, lens_thickness, lens_coating, selling_price')
        .eq('lens_use', lensUse)
        .not('selling_price', 'is', null)
        .order('lens_type');
      
      if (error) throw error;
      return data as LensCosting[];
    },
    enabled: !!usage
  });

  const updateTotal = (framePrice: number, lensPackagePrice: number, typeCost: number) => {
    setTotal(framePrice + lensPackagePrice + typeCost);
  };

  const handleFrameChange = (value: string) => {
    setValue("frame", value);
    const selectedFrameData = frames?.find(f => f.code.toString() === value);
    setSelectedFrame(selectedFrameData || null);
    const framePrice = selectedFrameData?.selling_price || 0;
    const lensPackagePrice = selectedLensPackage?.selling_price || 0;
    const typeCost = lensTypePrices[lensType] || 0;
    updateTotal(framePrice, lensPackagePrice, typeCost);
  };

  const handleUsageChange = (value: string) => {
    setValue("usage", value);
    setValue("lensPackage", ""); // Reset lens package when usage changes
    setSelectedLensPackage(null);
    const framePrice = selectedFrame?.selling_price || 0;
    const typeCost = lensTypePrices[lensType] || 0;
    updateTotal(framePrice, 0, typeCost);
  };

  const handleLensPackageChange = (value: string) => {
    setValue("lensPackage", value);
    const selectedPackage = lensPackages?.find(p => p.id === value);
    setSelectedLensPackage(selectedPackage || null);
    const framePrice = selectedFrame?.selling_price || 0;
    const lensPackagePrice = selectedPackage?.selling_price || 0;
    const typeCost = lensTypePrices[lensType] || 0;
    updateTotal(framePrice, lensPackagePrice, typeCost);
  };

  const handleLensTypeChange = (value: string) => {
    setValue("lensType", value);
    const framePrice = selectedFrame?.selling_price || 0;
    const lensPackagePrice = selectedLensPackage?.selling_price || 0;
    const typeCost = lensTypePrices[value] || 0;
    updateTotal(framePrice, lensPackagePrice, typeCost);
  };

  const formatLensPackageOption = (lensPackage: LensCosting) => {
    const parts = [lensPackage.lens_type];
    if (lensPackage.lens_thickness) parts.push(lensPackage.lens_thickness);
    if (lensPackage.lens_coating) parts.push(lensPackage.lens_coating);
    return `${parts.join(' ')} ($${lensPackage.selling_price || 0})`;
  };

  const onSubmit = (data: EyewearFormInputs) => {
    console.log("Eyewear order data:", data);
    console.log("Patient ID:", id);
    console.log("Total cost:", total);
    console.log("Selected frame:", selectedFrame);
    console.log("Selected lens package:", selectedLensPackage);
    // TODO: Implement order submission logic
  };

  const handleBack = () => {
    navigate(`/patients/${id}`);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patient
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Glasses</h1>
          <p className="text-gray-600">Configure glasses order for patient</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Glasses Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Frame</Label>
                <Select onValueChange={handleFrameChange} disabled={framesLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={framesLoading ? "Loading frames..." : "Select Frame"} />
                  </SelectTrigger>
                  <SelectContent>
                    {frames?.map((frame) => (
                      <SelectItem key={frame.id} value={frame.code.toString()}>
                        Code {frame.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFrame && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium">Brand: {selectedFrame.brand}</p>
                    <p className="text-sm text-gray-600">
                      Price: ${selectedFrame.selling_price || 0}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label>Prescription</Label>
                <Select onValueChange={(value) => setValue("prescription", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Load recent Rx" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent Rx</SelectItem>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>What do you use your glasses for?</Label>
                <Select onValueChange={handleUsageChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Usage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Non-prescription - Fashion">Non-prescription - Fashion</SelectItem>
                    <SelectItem value="Single Vision - Distance">Single Vision - Distance</SelectItem>
                    <SelectItem value="Near Vision - Reading">Near Vision - Reading</SelectItem>
                    <SelectItem value="Progressive - Distance & Reading">Progressive - Distance & Reading</SelectItem>
                    <SelectItem value="Bifocal - Distance & Reading">Bifocal - Distance & Reading</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Choose lens package</Label>
                <Select 
                  onValueChange={handleLensPackageChange} 
                  disabled={!usage || lensPackagesLoading}
                  value={lensPackage}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !usage ? "Select usage first" :
                      lensPackagesLoading ? "Loading packages..." : 
                      "Select Lens Package"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {lensPackages?.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {formatLensPackageOption(pkg)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedLensPackage && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      Package Price: ${selectedLensPackage.selling_price || 0}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label>Lens type</Label>
                <Select onValueChange={handleLensTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Lens Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear">Clear ($0)</SelectItem>
                    <SelectItem value="blue">Blue Light ($20)</SelectItem>
                    <SelectItem value="photochromic">Photochromic ($40)</SelectItem>
                    <SelectItem value="sunglasses">Sunglasses Tint ($25)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <div className="text-2xl font-bold text-gray-900 mb-4">
                  Total: ${total}
                </div>
                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Place Order
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </Layout>
  );
}
