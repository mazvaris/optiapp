import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function FeedbackForm() {
  const { register, handleSubmit, watch } = useForm();
  const onSubmit = (data: any) => console.log(data);

  const isPatient = watch("isPatient");
  const feedbackType = watch("feedbackType");

  return (
    <Card className="max-w-2xl mx-auto p-6 mt-10 rounded-2xl shadow-lg">
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Complaints & Compliments Form</h2>

          <div className="space-y-2">
            <Label htmlFor="isPatient">Is the person a patient?</Label>
            <select {...register("isPatient")} id="isPatient" className="w-full border border-gray-300 rounded-xl p-3">
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {isPatient === "yes" && (
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID</Label>
              <Input id="patientId" {...register("patientId")} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register("firstName", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register("lastName", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone/Mobile Number</Label>
              <Input id="phone" {...register("phone", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" {...register("email", { required: true })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="visitDate">Date of Visit</Label>
              <Input id="visitDate" type="date" {...register("visitDate", { required: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedbackType">Type of Feedback</Label>
            <select {...register("feedbackType")} id="feedbackType" className="w-full border border-gray-300 rounded-xl p-3">
              <option value="">Select</option>
              <option value="Compliment">Compliment</option>
              <option value="Complaint">Complaint</option>
              <option value="Suggestion">Suggestion</option>
            </select>
          </div>

          {feedbackType === "Complaint" && (
            <div className="space-y-2">
              <Label htmlFor="complaintCategory">Complaint Category</Label>
              <select {...register("complaintCategory")} id="complaintCategory" className="w-full border border-gray-300 rounded-xl p-3">
                <option value="">Select</option>
                <option value="Long wait times or delayed appointments">Long wait times or delayed appointments</option>
                <option value="Incorrect prescription or vision issues after exam">Incorrect prescription or vision issues after exam</option>
                <option value="Rude or unprofessional staff behavior">Rude or unprofessional staff behavior</option>
                <option value="Poor communication or lack of explanation">Poor communication or lack of explanation</option>
                <option value="Problems with glasses or contact lenses">Problems with glasses or contact lenses</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="experienceDescription">Please describe your experience</Label>
            <Textarea id="experienceDescription" {...register("experienceDescription", { required: true })} rows={5} placeholder="Provide as much detail as possible, including what happened, when, and who was involved." />
          </div>

          {feedbackType === "Complaint" && (
            <div className="space-y-2">
              <Label htmlFor="desiredOutcome">Desired Outcome</Label>
              <Textarea id="desiredOutcome" {...register("desiredOutcome")} rows={3} placeholder="How would you like us to resolve the issue?" />
            </div>
          )}

          <div className="text-center">
            <Button type="submit" className="px-6 py-3 rounded-2xl shadow-md">Submit Feedback</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

