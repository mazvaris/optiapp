
import { Layout } from "@/components/Layout";
import { PatientDemographicsForm } from "@/components/PatientDemographicsForm";
import { usePatients } from "@/hooks/usePatients";
import { useNavigate } from "react-router-dom";

const AddPatient = () => {
  const { createPatient, loading } = usePatients();
  const navigate = useNavigate();

  const handleFormSubmit = async (data: any) => {
    console.log("Patient demographics submitted:", data);
    
    try {
      await createPatient(data);
      // Navigate to patients list after successful creation
      navigate('/patients');
    } catch (error) {
      // Error is handled in the hook
      console.error('Failed to create patient:', error);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Patient</h1>
          <p className="text-gray-600">Complete patient demographics and medical information</p>
        </div>
        
        <PatientDemographicsForm 
          onSubmit={handleFormSubmit}
          loading={loading}
        />
      </div>
    </Layout>
  );
};

export default AddPatient;
