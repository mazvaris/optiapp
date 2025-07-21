
import { PatientDemographicsForm } from "@/components/PatientDemographicsForm";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";

const PatientDemographicsTest = () => {
  const { toast } = useToast();

  const handleFormSubmit = (data: any) => {
    console.log("Patient demographics submitted:", data);
    toast({
      title: "Success!",
      description: "Patient demographics have been submitted successfully.",
    });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Demographics Form</h1>
          <p className="text-gray-600">Complete patient information for comprehensive care</p>
        </div>
        
        <PatientDemographicsForm 
          onSubmit={handleFormSubmit}
          initialData={{
            // You can pre-populate with enquiry data when integrating
          }}
        />
      </div>
    </Layout>
  );
};

export default PatientDemographicsTest;
