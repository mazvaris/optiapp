import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/Layout";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const steps = [
  "Employee Profile",
  "Employment Details",
  "Emergency Contacts",
  "Notes & Submit"
];

const allFields = [
  "first_name", "last_name", "contact", "photo", "address_line_1", "address_line_2", "city", "phone", "dob", "status",
  "role", "employment_type", "start_date", "end_date", "contract_details", "allergies",
  "emergency_first_name_1", "emergency_last_name_1", "emergency_relation_1", "emergency_phone_1",
  "emergency_first_name_2", "emergency_last_name_2", "emergency_relation_2", "emergency_phone_2",
  "notes"
];

const AddUserProfile = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm();

  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const watchedFields = watch();

  useEffect(() => {
    const filledFields = allFields.filter((field) => {
      const value = watchedFields[field];
      return value !== undefined && value !== "" && value !== null && !(value instanceof FileList && value.length === 0);
    });
    setProgress(Math.round((filledFields.length / allFields.length) * 100));
  }, [watchedFields]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Convert date strings to proper format
      const formattedData = {
        ...data,
        dob: data.dob || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        user_id: null // Will be set when user authentication is implemented
      };

      const { error } = await supabase
        .from('staff_profiles')
        .insert([formattedData]);

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Staff profile has been created successfully.",
      });

      // Reset form
      reset();
      setStep(0);
      setProgress(0);

    } catch (error) {
      console.error('Error creating staff profile:', error);
      toast({
        title: "Error",
        description: "Failed to create staff profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));
  const goToStep = (stepIndex: number) => setStep(stepIndex);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add User Profile</h1>
          <p className="text-gray-600">Create a new staff member profile for Lighthouse Opticians</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step Navigation */}
          <div className="mb-8">
            <div className="flex justify-between mb-4">
              {steps.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => goToStep(index)}
                  className={cn(
                    "text-sm font-medium transition-colors cursor-pointer hover:text-blue-500",
                    index === step ? "text-blue-600" : "text-gray-400"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full">
              <div
                className="absolute top-0 left-0 h-2 bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-right text-sm text-gray-600 mt-2">{progress}% complete</p>
          </div>

          {/* Step Cards */}
          {step === 0 && (
            <Card className="shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">{steps[step]}</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">First Name</Label>
                    <Input {...register("first_name")} className="w-full" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Last Name</Label>
                    <Input {...register("last_name")} className="w-full" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Contact Number</Label>
                    <Input {...register("contact")} className="w-full" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Photo</Label>
                    <Input type="file" accept="image/*" {...register("photo")} className="w-full" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Address Line 1</Label>
                    <Input {...register("address_line_1")} className="w-full" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Address Line 2</Label>
                    <Input {...register("address_line_2")} className="w-full" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">City/Town</Label>
                    <Input {...register("city")} className="w-full" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Phone</Label>
                    <Input {...register("phone")} className="w-full" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Date of Birth</Label>
                    <Input type="date" {...register("dob")} className="w-full" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
                    <select {...register("status", { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Terminated">Terminated</option>
                      <option value="Retired">Retired</option>
                    </select>
                    {errors.status && <p className="text-red-500 text-sm mt-1">Status is required</p>}
                  </div>
                </div>
                <div className="flex justify-end mt-8">
                  <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card className="shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">{steps[step]}</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Role/Position</Label>
                    <select {...register("role")} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select position</option>
                      <option value="Optometrist">Optometrist</option>
                      <option value="Dispensing Optician">Dispensing Optician</option>
                      <option value="Technician">Technician</option>
                      <option value="Receptionist">Receptionist</option>
                      <option value="Practice Manager">Practice Manager</option>
                      <option value="System Administrator">System Administrator</option>
                      <option value="Student">Student</option>
                      <option value="Inspector">Inspector</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Employment Type</Label>
                    <select {...register("employment_type")} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contractor">Contractor</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Start Date</Label>
                    <Input type="date" {...register("start_date")} className="w-full" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">End Date</Label>
                    <Input type="date" {...register("end_date")} className="w-full" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Contract Details</Label>
                    <Textarea {...register("contract_details")} className="w-full min-h-[100px]" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Allergies</Label>
                    <Textarea {...register("allergies")} className="w-full min-h-[100px]" />
                  </div>
                </div>
                <div className="flex justify-between mt-8">
                  <Button type="button" onClick={prevStep} variant="outline">
                    Back
                  </Button>
                  <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">{steps[step]}</h2>
                
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact 1</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">First Name</Label>
                      <Input {...register("emergency_first_name_1")} className="w-full" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Last Name</Label>
                      <Input {...register("emergency_last_name_1")} className="w-full" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Relation</Label>
                      <Input {...register("emergency_relation_1")} className="w-full" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Phone</Label>
                      <Input {...register("emergency_phone_1")} className="w-full" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact 2</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">First Name</Label>
                      <Input {...register("emergency_first_name_2")} className="w-full" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Last Name</Label>
                      <Input {...register("emergency_last_name_2")} className="w-full" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Relation</Label>
                      <Input {...register("emergency_relation_2")} className="w-full" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Phone</Label>
                      <Input {...register("emergency_phone_2")} className="w-full" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <Button type="button" onClick={prevStep} variant="outline">
                    Back
                  </Button>
                  <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">{steps[step]}</h2>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Notes</Label>
                  <Textarea {...register("notes")} className="w-full min-h-[150px]" placeholder="Add any additional notes about this staff member..." />
                </div>
                <div className="flex justify-between mt-8">
                  <Button type="button" onClick={prevStep} variant="outline">
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Profile"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </Layout>
  );
};

export default AddUserProfile;
