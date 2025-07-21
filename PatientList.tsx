import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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

const PatientList = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Patient>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch patients
  const { data: patients = [], isLoading, error } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Patient[];
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: "Success",
        description: "Patient deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive",
      });
      console.error('Delete error:', error);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Patient> }) => {
      const { error } = await supabase
        .from('patients')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setEditPatient(null);
      setEditFormData({});
      toast({
        title: "Success",
        description: "Patient updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update patient",
        variant: "destructive",
      });
      console.error('Update error:', error);
    }
  });

  const handleRowClick = (patient: Patient, event: React.MouseEvent) => {
    // Prevent navigation if clicking on action buttons
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="dialog"]')) {
      return;
    }
    navigate(`/patients/${patient.id}`);
  };

  const handleEdit = (patient: Patient) => {
    setEditPatient(patient);
    setEditFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      email_address: patient.email_address,
      mobile_contact_number: patient.mobile_contact_number,
      work_contact_number: patient.work_contact_number || '',
      gender: patient.gender,
      occupation: patient.occupation,
      ethnicity: patient.ethnicity,
      nationality: patient.nationality,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPatient) {
      updateMutation.mutate({ id: editPatient.id, data: editFormData });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFullName = (patient: Patient) => {
    return `${patient.first_name} ${patient.last_name}`;
  };

  if (isLoading) return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient List</h1>
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient List</h1>
          <p className="text-red-600">Error loading patients</p>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient List</h1>
          <p className="text-gray-600">View and manage all patient records ({patients.length} total)</p>
          <p className="text-sm text-blue-600 mt-2">Click on any patient row to view details and make appointments</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Patients</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">Occupation</th>
                  <th className="text-left p-3 font-medium">Date Added</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr 
                    key={patient.id} 
                    className="border-t hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={(e) => handleRowClick(patient, e)}
                  >
                    <td className="p-3">{getFullName(patient)}</td>
                    <td className="p-3">{patient.email_address}</td>
                    <td className="p-3">{patient.mobile_contact_number}</td>
                    <td className="p-3">{patient.occupation}</td>
                    <td className="p-3">{formatDate(patient.created_at)}</td>
                    <td className="p-3 space-x-2">
                      {/* View Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedPatient(patient)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Patient Details</DialogTitle>
                            <DialogDescription>
                              <div className="space-y-6 text-left">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
                                    <p><strong>Name:</strong> {selectedPatient ? getFullName(selectedPatient) : ''}</p>
                                    <p><strong>Email:</strong> {selectedPatient?.email_address}</p>
                                    <p><strong>Gender:</strong> {selectedPatient?.gender || 'N/A'}</p>
                                    <p><strong>Birth:</strong> {selectedPatient?.birth_month && selectedPatient?.birth_day && selectedPatient?.year_of_birth 
                                      ? `${selectedPatient.birth_month} ${selectedPatient.birth_day}, ${selectedPatient.year_of_birth}` 
                                      : 'N/A'}</p>
                                    <p><strong>Ethnicity:</strong> {selectedPatient?.ethnicity}</p>
                                    <p><strong>Nationality:</strong> {selectedPatient?.nationality}</p>
                                    <p><strong>ID Number:</strong> {selectedPatient?.identification_number}</p>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                                    <p><strong>Mobile:</strong> {selectedPatient?.mobile_contact_number}</p>
                                    <p><strong>Work Phone:</strong> {selectedPatient?.work_contact_number || 'N/A'}</p>
                                    <p><strong>Home Address:</strong> {selectedPatient?.home_address_line1}, {selectedPatient?.home_city_town}</p>
                                    <p><strong>Occupation:</strong> {selectedPatient?.occupation}</p>
                                    <p><strong>Created:</strong> {selectedPatient ? formatDate(selectedPatient.created_at) : ''}</p>
                                  </div>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 mb-2">Next of Kin Information</h3>
                                  {selectedPatient?.nok_first_name && selectedPatient?.nok_last_name ? (
                                    <>
                                      <p><strong>Name:</strong> {selectedPatient.nok_first_name} {selectedPatient.nok_last_name}</p>
                                      <p><strong>Relationship:</strong> {selectedPatient.nok_relationship || 'N/A'}</p>
                                      <p><strong>Contact 1:</strong> {selectedPatient.nok_contact_1 || 'N/A'}</p>
                                      {selectedPatient.nok_contact_2 && (
                                        <p><strong>Contact 2:</strong> {selectedPatient.nok_contact_2}</p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-gray-500">No next of kin information available</p>
                                  )}
                                  <p><strong>Payment Type:</strong> {selectedPatient?.insurance}</p>
                                </div>
                              </div>
                            </DialogDescription>
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>

                      {/* Delete Alert Dialog */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this patient record? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(patient.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      {/* Edit Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(patient)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Patient</DialogTitle>
                            <DialogDescription>
                              <form onSubmit={handleSaveEdit} className="space-y-4 text-left">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input 
                                      id="firstName" 
                                      value={editFormData.first_name || ''}
                                      onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input 
                                      id="lastName" 
                                      value={editFormData.last_name || ''}
                                      onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="email">Email Address</Label>
                                  <Input 
                                    id="email" 
                                    type="email"
                                    value={editFormData.email_address || ''}
                                    onChange={(e) => setEditFormData({...editFormData, email_address: e.target.value})}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="mobilePhone">Mobile Phone</Label>
                                    <Input 
                                      id="mobilePhone" 
                                      value={editFormData.mobile_contact_number || ''}
                                      onChange={(e) => setEditFormData({...editFormData, mobile_contact_number: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="workPhone">Work Phone</Label>
                                    <Input 
                                      id="workPhone" 
                                      value={editFormData.work_contact_number || ''}
                                      onChange={(e) => setEditFormData({...editFormData, work_contact_number: e.target.value})}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select value={editFormData.gender || ''} onValueChange={(value) => setEditFormData({...editFormData, gender: value})}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="occupation">Occupation</Label>
                                    <Input 
                                      id="occupation" 
                                      value={editFormData.occupation || ''}
                                      onChange={(e) => setEditFormData({...editFormData, occupation: e.target.value})}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="ethnicity">Ethnicity</Label>
                                    <Input 
                                      id="ethnicity" 
                                      value={editFormData.ethnicity || ''}
                                      onChange={(e) => setEditFormData({...editFormData, ethnicity: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="nationality">Nationality</Label>
                                    <Input 
                                      id="nationality" 
                                      value={editFormData.nationality || ''}
                                      onChange={(e) => setEditFormData({...editFormData, nationality: e.target.value})}
                                    />
                                  </div>
                                </div>
                                <Button type="submit" disabled={updateMutation.isPending}>
                                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                              </form>
                            </DialogDescription>
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {patients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No patients found. <a href="/patients/add" className="text-blue-600 hover:underline">Add your first patient</a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientList;
