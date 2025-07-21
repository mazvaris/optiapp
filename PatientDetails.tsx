
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, CreditCard, User, Glasses } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  mobile_contact_number: string;
  work_contact_number?: string;
  gender?: string;
  birth_month?: string;
  birth_day?: string;
  year_of_birth?: number;
  ethnicity: string;
  nationality: string;
  identification_number: string;
  occupation: string;
  home_address_line1: string;
  home_city_town: string;
  insurance: string;
  created_at: string;
  nok_first_name?: string;
  nok_last_name?: string;
  nok_relationship?: string;
  nok_contact_1?: string;
  nok_contact_2?: string;
}

const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      if (!id) throw new Error('Patient ID is required');
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Patient;
    },
    enabled: !!id
  });

  const handleMakeAppointment = () => {
    navigate(`/appointments/schedule/${id}`);
  };

  const handleBuyGlasses = () => {
    navigate(`/patients/${id}/glasses`);
  };

  const handleViewEyeExams = () => {
    toast({
      title: "Eye Exams",
      description: "Eye exam history feature will be implemented soon.",
    });
  };

  const handleViewPrescriptions = () => {
    toast({
      title: "Prescriptions",
      description: "Prescription history feature will be implemented soon.",
    });
  };

  const handleViewBilling = () => {
    toast({
      title: "Billing",
      description: "Billing information feature will be implemented soon.",
    });
  };

  const getFullName = (patient: Patient) => {
    return `${patient.first_name} ${patient.last_name}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Details</h1>
          <p className="text-gray-600">Loading patient information...</p>
        </div>
      </div>
    </Layout>
  );

  if (error || !patient) return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Details</h1>
          <p className="text-red-600">Error loading patient information</p>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{getFullName(patient)}</h1>
          <p className="text-gray-600">Patient ID: {patient.id}</p>
        </div>

        {/* Patient Information Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Personal Details</h3>
                  <p><strong>Name:</strong> {getFullName(patient)}</p>
                  <p><strong>Email:</strong> {patient.email_address}</p>
                  <p><strong>Mobile:</strong> {patient.mobile_contact_number}</p>
                  {patient.work_contact_number && (
                    <p><strong>Work Phone:</strong> {patient.work_contact_number}</p>
                  )}
                  <p><strong>Gender:</strong> {patient.gender || 'N/A'}</p>
                  <p><strong>Birth:</strong> {patient.birth_month && patient.birth_day && patient.year_of_birth 
                    ? `${patient.birth_month} ${patient.birth_day}, ${patient.year_of_birth}` 
                    : 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Additional Information</h3>
                  <p><strong>Ethnicity:</strong> {patient.ethnicity}</p>
                  <p><strong>Nationality:</strong> {patient.nationality}</p>
                  <p><strong>ID Number:</strong> {patient.identification_number}</p>
                  <p><strong>Occupation:</strong> {patient.occupation}</p>
                  <p><strong>Address:</strong> {patient.home_address_line1}, {patient.home_city_town}</p>
                  <p><strong>Insurance:</strong> {patient.insurance}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next of Kin Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {patient.nok_first_name && patient.nok_last_name ? (
                  <>
                    <p><strong>Name:</strong> {patient.nok_first_name} {patient.nok_last_name}</p>
                    <p><strong>Relationship:</strong> {patient.nok_relationship || 'N/A'}</p>
                    <p><strong>Contact 1:</strong> {patient.nok_contact_1 || 'N/A'}</p>
                    {patient.nok_contact_2 && (
                      <p><strong>Contact 2:</strong> {patient.nok_contact_2}</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500">No next of kin information available</p>
                )}
                <p><strong>Patient Since:</strong> {formatDate(patient.created_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleMakeAppointment}>
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Make Appointment</h3>
              <p className="text-gray-600 text-sm">Schedule a new appointment for this patient</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleBuyGlasses}>
            <CardContent className="p-6 text-center">
              <Glasses className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Buy Glasses</h3>
              <p className="text-gray-600 text-sm">Order new glasses for this patient</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleViewEyeExams}>
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Eye Exams</h3>
              <p className="text-gray-600 text-sm">View past eye examination records</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleViewPrescriptions}>
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Prescriptions</h3>
              <p className="text-gray-600 text-sm">Review prescription history</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleViewBilling}>
            <CardContent className="p-6 text-center">
              <CreditCard className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Billing</h3>
              <p className="text-gray-600 text-sm">View billing information and invoices</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PatientDetails;
