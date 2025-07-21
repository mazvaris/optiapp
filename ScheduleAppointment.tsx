
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { AppointmentForm } from "@/components/AppointmentForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

const ScheduleAppointment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      if (!id) throw new Error('Patient ID is required');
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Patient;
    },
    enabled: !!id
  });

  const getFullName = (patient: Patient) => {
    return `${patient.first_name} ${patient.last_name}`;
  };

  const handleBack = () => {
    navigate(`/patients/${id}`);
  };

  if (isLoading) return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Appointment</h1>
          <p className="text-gray-600">Loading patient information...</p>
        </div>
      </div>
    </Layout>
  );

  if (error || !patient) return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Appointment</h1>
          <p className="text-red-600">Error loading patient information</p>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-4 p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patient Details
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Appointment</h1>
          <p className="text-gray-600">Patient: {getFullName(patient)}</p>
        </div>

        <AppointmentForm 
          patientId={patient.id}
          patientName={getFullName(patient)}
        />
      </div>
    </Layout>
  );
};

export default ScheduleAppointment;
