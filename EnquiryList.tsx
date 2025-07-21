
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

interface PatientEnquiry {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile_phone?: string;
  work_phone?: string;
  gender?: string;
  dob?: string;
  preferred_contact_methods?: string[];
  enquiry_types?: string[];
  satisfied_with_response?: string;
  details?: string;
  created_at: string;
}

const EnquiryList = () => {
  const [selectedEnquiry, setSelectedEnquiry] = useState<PatientEnquiry | null>(null);
  const [editEnquiry, setEditEnquiry] = useState<PatientEnquiry | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PatientEnquiry>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch enquiries
  const { data: enquiries = [], isLoading, error } = useQuery({
    queryKey: ['patient-enquiries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_enquiries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PatientEnquiry[];
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patient_enquiries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-enquiries'] });
      toast({
        title: "Success",
        description: "Enquiry deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete enquiry",
        variant: "destructive",
      });
      console.error('Delete error:', error);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PatientEnquiry> }) => {
      const { error } = await supabase
        .from('patient_enquiries')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-enquiries'] });
      setEditEnquiry(null);
      setEditFormData({});
      toast({
        title: "Success",
        description: "Enquiry updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update enquiry",
        variant: "destructive",
      });
      console.error('Update error:', error);
    }
  });

  const handleEdit = (enquiry: PatientEnquiry) => {
    setEditEnquiry(enquiry);
    setEditFormData({
      first_name: enquiry.first_name,
      last_name: enquiry.last_name,
      email: enquiry.email,
      mobile_phone: enquiry.mobile_phone || '',
      work_phone: enquiry.work_phone || '',
      gender: enquiry.gender,
      satisfied_with_response: enquiry.satisfied_with_response,
      details: enquiry.details || '',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editEnquiry) {
      updateMutation.mutate({ id: editEnquiry.id, data: editFormData });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enquiry List</h1>
          <p className="text-gray-600">Loading enquiries...</p>
        </div>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enquiry List</h1>
          <p className="text-red-600">Error loading enquiries</p>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enquiry List</h1>
          <p className="text-gray-600">View and manage all patient enquiries ({enquiries.length} total)</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Enquiries</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">Date Created</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{enquiry.first_name} {enquiry.last_name}</td>
                    <td className="p-3">{enquiry.email}</td>
                    <td className="p-3">{enquiry.mobile_phone || enquiry.work_phone || 'N/A'}</td>
                    <td className="p-3">{formatDate(enquiry.created_at)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        enquiry.satisfied_with_response === 'Yes' 
                          ? 'bg-green-100 text-green-800' 
                          : enquiry.satisfied_with_response === 'No'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {enquiry.satisfied_with_response || 'Pending'}
                      </span>
                    </td>
                    <td className="p-3 space-x-2">
                      {/* View Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedEnquiry(enquiry)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Enquiry Details</DialogTitle>
                            <DialogDescription>
                              <div className="space-y-4 text-left">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p><strong>Name:</strong> {selectedEnquiry?.first_name} {selectedEnquiry?.last_name}</p>
                                    <p><strong>Email:</strong> {selectedEnquiry?.email}</p>
                                    <p><strong>Gender:</strong> {selectedEnquiry?.gender || 'N/A'}</p>
                                    <p><strong>Date of Birth:</strong> {selectedEnquiry?.dob ? formatDate(selectedEnquiry.dob) : 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p><strong>Mobile Phone:</strong> {selectedEnquiry?.mobile_phone || 'N/A'}</p>
                                    <p><strong>Work Phone:</strong> {selectedEnquiry?.work_phone || 'N/A'}</p>
                                    <p><strong>Created:</strong> {selectedEnquiry ? formatDate(selectedEnquiry.created_at) : ''}</p>
                                    <p><strong>Satisfied:</strong> {selectedEnquiry?.satisfied_with_response || 'N/A'}</p>
                                  </div>
                                </div>
                                <div>
                                  <p><strong>Contact Methods:</strong> {selectedEnquiry?.preferred_contact_methods?.join(', ') || 'N/A'}</p>
                                  <p><strong>Enquiry Types:</strong> {selectedEnquiry?.enquiry_types?.join(', ') || 'N/A'}</p>
                                </div>
                                {selectedEnquiry?.details && (
                                  <div>
                                    <p><strong>Details:</strong></p>
                                    <p className="bg-gray-50 p-3 rounded mt-1">{selectedEnquiry.details}</p>
                                  </div>
                                )}
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
                            <AlertDialogTitle>Delete Enquiry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this enquiry? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(enquiry.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      {/* Edit Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(enquiry)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Enquiry</DialogTitle>
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
                                  <Label htmlFor="email">Email</Label>
                                  <Input 
                                    id="email" 
                                    type="email"
                                    value={editFormData.email || ''}
                                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="mobilePhone">Mobile Phone</Label>
                                    <Input 
                                      id="mobilePhone" 
                                      value={editFormData.mobile_phone || ''}
                                      onChange={(e) => setEditFormData({...editFormData, mobile_phone: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="workPhone">Work Phone</Label>
                                    <Input 
                                      id="workPhone" 
                                      value={editFormData.work_phone || ''}
                                      onChange={(e) => setEditFormData({...editFormData, work_phone: e.target.value})}
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
                                    <Label htmlFor="satisfied">Satisfied with Response</Label>
                                    <Select value={editFormData.satisfied_with_response || ''} onValueChange={(value) => setEditFormData({...editFormData, satisfied_with_response: value})}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select option" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Yes">Yes</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="details">Details</Label>
                                  <Textarea 
                                    id="details" 
                                    value={editFormData.details || ''}
                                    onChange={(e) => setEditFormData({...editFormData, details: e.target.value})}
                                    className="min-h-[100px]"
                                  />
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
            {enquiries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No enquiries found. <a href="/enquiries/new" className="text-blue-600 hover:underline">Create your first enquiry</a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EnquiryList;
