
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

interface FormData {
  lensType: string;
  otherLensType?: string;
  lensUse: string;
  lensThickness: string;
  lensColour: string;
  lensDiameter: string;
  lensCoating: string;
  supplierCode: string;
  costPrice: string;
  sellingPrice: string;
  notes: string;
}

export default function LensProductForm() {
  const { handleSubmit, setValue, register, reset, watch } = useForm<FormData>();
  const [lensType, setLensType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hasPermission } = useUserRole();

  const canCreate = hasPermission('create');

  const onSubmit = async (data: FormData) => {
    console.log('Form submission started with data:', data);
    
    if (!canCreate) {
      toast.error("You don't have permission to create lens costings");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare the data for insertion
      const insertData = {
        lens_type: data.lensType === 'Other' ? data.otherLensType || data.lensType : data.lensType,
        lens_use: data.lensUse,
        lens_thickness: data.lensThickness || null,
        lens_colour: data.lensColour || null,
        lens_diameter: data.lensDiameter || null,
        lens_coating: data.lensCoating || null,
        cost_price: data.costPrice ? parseFloat(data.costPrice) : null,
        selling_price: data.sellingPrice ? parseFloat(data.sellingPrice) : null,
        supplier: data.supplierCode || null,
        notes: data.notes || null
      };

      console.log('Inserting data:', insertData);

      const { data: result, error } = await supabase
        .from('lens_costing')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        toast.error(`Failed to save lens costing: ${error.message}`);
      } else {
        console.log('Successfully saved:', result);
        toast.success("Lens costing saved successfully!");
        reset();
        setLensType("");
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("An unexpected error occurred while saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">
              You don't have permission to create lens costings. Please contact an administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="max-w-3xl mx-auto p-6">
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Lens Type *</Label>
            <Select
              onValueChange={(value) => {
                setValue("lensType", value);
                setLensType(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select lens type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CR39">CR39</SelectItem>
                <SelectItem value="Polycarbonate">Polycarbonate</SelectItem>
                <SelectItem value="Aspheric">Aspheric</SelectItem>
                <SelectItem value="Trivex">Trivex</SelectItem>
                <SelectItem value="Photochromic">Photochromic</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {lensType === "Other" && (
            <div className="col-span-2">
              <Label>Other Lens Type *</Label>
              <Input {...register("otherLensType")} placeholder="Specify other lens type" />
            </div>
          )}

          <div className="col-span-2">
            <Label>Lens Use *</Label>
            <Select onValueChange={(value) => setValue("lensUse", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select lens use" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single Vision">Single Vision</SelectItem>
                <SelectItem value="Bifocal">Bifocal</SelectItem>
                <SelectItem value="Progressive">Progressive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Lens Thickness</Label>
            <Select onValueChange={(value) => setValue("lensThickness", value)}>
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
          </div>

          <div>
            <Label>Lens Colour</Label>
            <Select onValueChange={(value) => setValue("lensColour", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select colour" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">Clear</SelectItem>
                <SelectItem value="grey">Grey</SelectItem>
                <SelectItem value="brown">Brown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Lens Diameter</Label>
            <Select onValueChange={(value) => setValue("lensDiameter", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select diameter (MM)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="65">65</SelectItem>
                <SelectItem value="70">70</SelectItem>
                <SelectItem value="75">75</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label>Lens Coating</Label>
            <Select onValueChange={(value) => setValue("lensCoating", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select coating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UC">UC</SelectItem>
                <SelectItem value="HC">HC</SelectItem>
                <SelectItem value="HMC">HMC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-3xl mx-auto p-6">
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <h2 className="text-lg font-semibold mb-2">Costings</h2>
          </div>

          <div>
            <Label>Supplier Code</Label>
            <Input {...register("supplierCode")} placeholder="Enter supplier code" />
          </div>

          <div>
            <Label>Cost Price</Label>
            <Input {...register("costPrice")} placeholder="Enter cost price" type="number" step="0.01" />
          </div>

          <div>
            <Label>Selling Price</Label>
            <Input {...register("sellingPrice")} placeholder="Enter selling price" type="number" step="0.01" />
          </div>

          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea {...register("notes")} placeholder="Additional notes (optional)" rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="max-w-3xl mx-auto px-6 pb-6">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Lens Costing"}
        </Button>
      </div>
    </form>
  );
}
