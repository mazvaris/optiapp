
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthWrapper } from "@/components/AuthWrapper";
import { useUserRole } from "@/hooks/useUserRole";
import { PatientSelector } from "@/components/enquiry/PatientSelector";
import { PersonalInfoForm } from "@/components/enquiry/PersonalInfoForm";
import { ContactPreferencesForm } from "@/components/enquiry/ContactPreferencesForm";
import { EnquiryTypeSelector } from "@/components/enquiry/EnquiryTypeSelector";
import { EnquiryDetailsForm } from "@/components/enquiry/EnquiryDetailsForm";

interface EnquiryFormData {
  isExistingPatient: boolean;
  existingPatientId?: string;
  firstName: string;
  lastName: string;
  gender: string;
  mobilePhone: string;
  workPhone?: string;
  email: string;
  contactMethod: string[];
  enquiryType: string[];
  satisfied: string;
  details: string;
}

export default function NewEnquiry() {
  console.log("NewEnquiry component rendering");
  
  const { toast } = useToast();
  const { hasPermission, user } = useUserRole();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  console.log("User:", user);
  console.log("HasPermission:", hasPermission);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<EnquiryFormData>({
    defaultValues: {
      isExistingPatient: false,
      firstName: "",
      lastName: "",
      gender: "",
      mobilePhone: "",
      workPhone: "",
      email: "",
      contactMethod: [],
      enquiryType: [],
      satisfied: "",
      details: ""
    }
  });

  const isExistingPatient = watch("isExistingPatient");
  const enquiryType = watch("enquiryType");

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setValue("existingPatientId", patient.id);
    setValue("firstName", patient.first_name);
    setValue("lastName", patient.last_name);
    setValue("email", patient.email_address);
    setValue("mobilePhone", patient.mobile_contact_number);
  };

  const handleExistingPatientChange = (checked: boolean) => {
    setValue("isExistingPatient", checked);
    if (!checked) {
      setSelectedPatient(null);
      setValue("existingPatientId", "");
    }
  };

  const onSubmit = async (data: EnquiryFormData) => {
    console.log("Submitting enquiry:", data);
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit enquiries.",
        variant: "destructive",
      });
      return;
    }

    try {
      const enquiryData = {
        first_name: data.firstName,
        last_name: data.lastName,
        gender: data.gender || null,
        mobile_phone: data.mobilePhone || null,
        work_phone: data.workPhone || null,
        email: data.email,
        preferred_contact_methods: data.contactMethod,
        enquiry_types: data.enquiryType,
        satisfied_with_response: data.satisfied || null,
        details: data.details || null,
        created_by: user.id
      };

      const { error } = await supabase
        .from('patient_enquiries')
        .insert(enquiryData);

      if (error) {
        console.error('Error submitting enquiry:', error);
        toast({
          title: "Error",
          description: "Failed to submit enquiry. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Enquiry submitted successfully!",
        });
        reset();
        setSelectedPatient(null);
      }
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  console.log("About to render JSX");

  return (
    <AuthWrapper requiredPermission="create">
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">New Patient Enquiry</h1>
            <p className="text-gray-600 mt-2">Record and manage patient enquiries and contact details</p>
          </div>

          <Card className="shadow-sm border border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-xl text-gray-900">Enquiry Form</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!hasPermission('create') ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">You don't have permission to create enquiries.</p>
                  <p className="text-sm text-gray-500 mt-2">Contact your administrator if you need access.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <PatientSelector
                    isExistingPatient={isExistingPatient}
                    onExistingPatientChange={handleExistingPatientChange}
                    onPatientSelect={handlePatientSelect}
                    selectedPatient={selectedPatient}
                  />

                  <PersonalInfoForm
                    register={register}
                    errors={errors}
                    setValue={setValue}
                    isExistingPatient={isExistingPatient}
                    selectedPatient={selectedPatient}
                  />

                  <ContactPreferencesForm
                    watch={watch}
                    setValue={setValue}
                  />

                  <EnquiryTypeSelector
                    enquiryType={enquiryType}
                    setValue={setValue}
                  />

                  <EnquiryDetailsForm
                    register={register}
                    setValue={setValue}
                  />

                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Enquiry"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AuthWrapper>
  );
}
