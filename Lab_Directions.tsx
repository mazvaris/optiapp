import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LabDirectionsForm() {
  const { register, handleSubmit, setValue } = useForm();

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-4">
          <h2 className="text-xl font-semibold">Lab Directions</h2>

          {/* Frame Dropdown */}
          <div>
            <Label className="block mb-2">Frame:</Label>
            <Select onValueChange={(value) => setValue("frame", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Frame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sendWithOrder">Send frame with order</SelectItem>
                <SelectItem value="labSupplies">Lab supplies frame</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lens Type Dropdown */}
          <div>
            <Label className="block mb-2">Lens Type:</Label>
            <Select onValueChange={(value) => setValue("lensType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Lens Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="rimless">Rimless</SelectItem>
                <SelectItem value="drill">Drill</SelectItem>
                <SelectItem value="groove">Groove</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Checkbox for Lab To Edge and Assemble */}
          <div className="flex items-center gap-4">
            <Label className="flex items-center gap-2">
              <Checkbox {...register("labToEdgeAndAssemble")} /> Lab To Edge and Assemble
            </Label>
          </div>

          <Button type="submit" className="mt-4">Submit</Button>
        </CardContent>
      </Card>
    </form>
  );
}
