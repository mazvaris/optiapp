
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Trash2, Pencil, Calendar, List, Stethoscope } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { AppointmentsCalendar } from "@/components/AppointmentsCalendar";
import { useToast } from "@/hooks/use-toast";
import { EyeExamForm } from "@/components/EyeExamForm";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  appointment_other?: string;
  status: string;
  visited_before?: string;
  lenses?: string;
  symptoms?: string[];
  eye_health_notes?: string;
  cost_estimate?: string;
  additional_notes?: string;
  patients: {
    first_name: string;
    last_name: string;
    mobile_contact_number: string;
  };
}

export default function Appointments() {
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [eyeExamAppointment, setEyeExamAppointment] = useState<Appointment | null>(null);
  const [filter, setFilter] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Edit form state with all fields
  const [editForm, setEditForm] = useState({
    appointment_date: '',
    appointment_time: '',
    appointment_type: '',
    appointment_other: '',
    status: '',
    visited_before: '',
    lenses: '',
    symptoms: [] as string[],
    eye_health_notes: '',
    cost_estimate: '',
    additional_notes: ''
  });

  const symptomOptions = [
    "Blurry Vision",
    "Eye Strain", 
    "Headaches",
    "Dry or Irritated Eyes",
    "Flashes or Floaters",
    "None of the above"
  ];

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          appointment_type,
          appointment_other,
          status,
          visited_before,
          lenses,
          symptoms,
          eye_health_notes,
          cost_estimate,
          additional_notes,
          patients:patient_id (
            first_name,
            last_name,
            mobile_contact_number
          )
        `)
        .order('appointment_date', { ascending: true });
      
      if (error) throw error;
      return data as Appointment[];
    }
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      // Validate time restrictions before updating
      const selectedDate = new Date(updates.appointment_date);
      const dayOfWeek = selectedDate.getDay();
      const [hours, minutes] = updates.appointment_time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;

      // Check if it's Sunday (closed)
      if (dayOfWeek === 0) {
        throw new Error('We are closed on Sundays');
      }

      // Check time restrictions
      const minTime = 8 * 60; // 8:00 AM
      let maxTime = 17 * 60; // 5:00 PM

      // Saturday has different hours (8:00 AM - 2:00 PM)
      if (dayOfWeek === 6) {
        maxTime = 14 * 60; // 2:00 PM
      }

      if (timeInMinutes < minTime || timeInMinutes >= maxTime) {
        const maxTimeStr = dayOfWeek === 6 ? "2:00 PM" : "5:00 PM";
        throw new Error(`Please select a time between 8:00 AM and ${maxTimeStr}${dayOfWeek === 6 ? ' (Saturday hours)' : ' (Monday-Friday)'}`);
      }

      console.log('Updating appointment with ID:', id, 'Updates:', updates);

      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Successfully updated appointment:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Mutation successful:', data);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });
      setEditingAppointment(null);
      setSelectedSymptoms([]);
    },
    onError: (error: any) => {
      console.error('Update mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment",
        variant: "destructive",
      });
    }
  });

  const handleEditClick = (appointment: Appointment) => {
    console.log('Opening edit for appointment:', appointment);
    setEditingAppointment(appointment);
    const symptoms = appointment.symptoms || [];
    setSelectedSymptoms(symptoms);
    setEditForm({
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      appointment_type: appointment.appointment_type,
      appointment_other: appointment.appointment_other || '',
      status: appointment.status,
      visited_before: appointment.visited_before || '',
      lenses: appointment.lenses || '',
      symptoms: symptoms,
      eye_health_notes: appointment.eye_health_notes || '',
      cost_estimate: appointment.cost_estimate || '',
      additional_notes: appointment.additional_notes || ''
    });
  };

  const handleSymptomChange = (symptom: string, checked: boolean) => {
    let newSymptoms: string[];
    if (checked) {
      newSymptoms = [...selectedSymptoms, symptom];
    } else {
      newSymptoms = selectedSymptoms.filter(s => s !== symptom);
    }
    setSelectedSymptoms(newSymptoms);
    setEditForm({...editForm, symptoms: newSymptoms});
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) {
      console.error('No appointment selected for editing');
      return;
    }

    console.log('Submitting edit form:', editForm);
    console.log('Editing appointment ID:', editingAppointment.id);

    const updates = {
      ...editForm,
      symptoms: selectedSymptoms
    };

    updateAppointmentMutation.mutate({
      id: editingAppointment.id,
      updates: updates
    });
  };

  const getTimeRestrictions = (date: string) => {
    if (!date) return { min: "08:00", max: "17:00", disabled: false };
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    
    // Sunday - closed
    if (dayOfWeek === 0) {
      return { min: "", max: "", disabled: true };
    }
    
    // Saturday - 8:00 AM to 2:00 PM
    if (dayOfWeek === 6) {
      return { min: "08:00", max: "14:00", disabled: false };
    }
    
    // Monday-Friday - 8:00 AM to 5:00 PM
    return { min: "08:00", max: "17:00", disabled: false };
  };

  const filteredData = appointments.filter(
    (appointment) =>
      appointment.patients?.first_name.toLowerCase().includes(filter.toLowerCase()) ||
      appointment.patients?.last_name.toLowerCase().includes(filter.toLowerCase())
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Appointments</h1>
          <p>Loading appointments...</p>
        </div>
      </Layout>
    );
  }

  const timeRestrictions = getTimeRestrictions(editForm.appointment_date);

  return (
    <Layout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Appointments</h1>
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              List View
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              onClick={() => setViewMode('calendar')}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Calendar View
            </Button>
          </div>
        </div>
        
        {viewMode === 'calendar' ? (
          <AppointmentsCalendar />
        ) : (
          <>
            <div>
              <Input
                placeholder="Filter by patient name..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            
            <Card>
              <CardContent className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2">Patient Name</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Time</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((appointment) => (
                      <tr key={appointment.id} className="border-t">
                        <td className="p-2">
                          {appointment.patients ? 
                            `${appointment.patients.first_name} ${appointment.patients.last_name}` : 
                            'N/A'
                          }
                        </td>
                        <td className="p-2">{appointment.patients?.mobile_contact_number || 'N/A'}</td>
                        <td className="p-2">{format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}</td>
                        <td className="p-2">{appointment.appointment_time}</td>
                        <td className="p-2 capitalize">{appointment.appointment_type}</td>
                        <td className="p-2 capitalize">{appointment.status}</td>
                        <td className="p-2 space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelected(appointment)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Appointment Details</DialogTitle>
                                <DialogDescription>
                                  <div className="space-y-2">
                                    <p><strong>Patient:</strong> {selected?.patients ? `${selected.patients.first_name} ${selected.patients.last_name}` : 'N/A'}</p>
                                    <p><strong>Phone:</strong> {selected?.patients?.mobile_contact_number || 'N/A'}</p>
                                    <p><strong>Date:</strong> {selected ? format(new Date(selected.appointment_date), 'MMM dd, yyyy') : ''}</p>
                                    <p><strong>Time:</strong> {selected?.appointment_time}</p>
                                    <p><strong>Type:</strong> {selected?.appointment_type}</p>
                                    <p><strong>Status:</strong> {selected?.status}</p>
                                  </div>
                                </DialogDescription>
                              </DialogHeader>
                            </DialogContent>
                          </Dialog>

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEyeExamAppointment(appointment)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Start Eye Exam"
                          >
                            <Stethoscope className="w-4 h-4" />
                          </Button>
                          
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          
                          <Dialog open={!!editingAppointment && editingAppointment.id === appointment.id} onOpenChange={(open) => !open && setEditingAppointment(null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleEditClick(appointment)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit Appointment</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleEditSubmit} className="space-y-6">
                                {/* Basic Appointment Details */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">Appointment Details</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="date">Date</Label>
                                      <Input 
                                        id="date" 
                                        type="date"
                                        value={editForm.appointment_date}
                                        onChange={(e) => setEditForm({...editForm, appointment_date: e.target.value})}
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="time">Time</Label>
                                      <Input 
                                        id="time" 
                                        type="time"
                                        value={editForm.appointment_time}
                                        onChange={(e) => setEditForm({...editForm, appointment_time: e.target.value})}
                                        min={timeRestrictions.min}
                                        max={timeRestrictions.max}
                                        disabled={timeRestrictions.disabled}
                                        required
                                      />
                                      {timeRestrictions.disabled && (
                                        <p className="text-sm text-red-600 mt-1">We are closed on Sundays</p>
                                      )}
                                      {!timeRestrictions.disabled && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          Hours: {timeRestrictions.min} - {timeRestrictions.max}
                                          {editForm.appointment_date && new Date(editForm.appointment_date).getDay() === 6 && " (Saturday)"}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="type">Type of Appointment</Label>
                                    <Select 
                                      value={editForm.appointment_type} 
                                      onValueChange={(value) => setEditForm({...editForm, appointment_type: value})}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select appointment type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="routine">Routine Eye Exam</SelectItem>
                                        <SelectItem value="glasses">New Glasses or Contact Lenses</SelectItem>
                                        <SelectItem value="concern">Eye Health Concern</SelectItem>
                                        <SelectItem value="children">Children's Eye Exam</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  {editForm.appointment_type === 'other' && (
                                    <div>
                                      <Label htmlFor="appointment_other">Please specify</Label>
                                      <Input 
                                        id="appointment_other"
                                        value={editForm.appointment_other}
                                        onChange={(e) => setEditForm({...editForm, appointment_other: e.target.value})}
                                        placeholder="Please specify the appointment type"
                                      />
                                    </div>
                                  )}
                                  
                                  <div>
                                    <Label htmlFor="status">Status</Label>
                                    <Select 
                                      value={editForm.status} 
                                      onValueChange={(value) => setEditForm({...editForm, status: value})}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="no-show">No Show</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Patient History */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">Patient History</h3>
                                  <div>
                                    <Label>Have you visited us before?</Label>
                                    <Select 
                                      value={editForm.visited_before} 
                                      onValueChange={(value) => setEditForm({...editForm, visited_before: value})}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select an option" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="no">No</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Vision Information */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">Vision Information</h3>
                                  <div>
                                    <Label>Do you currently wear corrective lenses?</Label>
                                    <Select 
                                      value={editForm.lenses} 
                                      onValueChange={(value) => setEditForm({...editForm, lenses: value})}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select an option" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="glasses">Glasses</SelectItem>
                                        <SelectItem value="contacts">Contact Lenses</SelectItem>
                                        <SelectItem value="neither">Neither</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label>Are you experiencing any of the following?</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                      {symptomOptions.map(symptom => (
                                        <Label key={symptom} className="flex items-center gap-2 text-sm">
                                          <Checkbox 
                                            checked={selectedSymptoms.includes(symptom)}
                                            onCheckedChange={(checked) => handleSymptomChange(symptom, checked as boolean)}
                                          /> 
                                          {symptom}
                                        </Label>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <Label htmlFor="eye_health_notes">Any known eye conditions or health concerns?</Label>
                                    <Textarea 
                                      id="eye_health_notes"
                                      value={editForm.eye_health_notes}
                                      onChange={(e) => setEditForm({...editForm, eye_health_notes: e.target.value})}
                                      placeholder="Please describe any eye conditions or concerns..."
                                    />
                                  </div>
                                </div>

                                {/* Cost Information */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">Cost Information</h3>
                                  <div>
                                    <Label>Would you like a cost estimate before your visit?</Label>
                                    <Select 
                                      value={editForm.cost_estimate} 
                                      onValueChange={(value) => setEditForm({...editForm, cost_estimate: value})}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select an option" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="no">No</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Additional Information */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">Additional Information</h3>
                                  <div>
                                    <Label htmlFor="additional_notes">Additional Notes or Questions</Label>
                                    <Textarea 
                                      id="additional_notes"
                                      value={editForm.additional_notes}
                                      onChange={(e) => setEditForm({...editForm, additional_notes: e.target.value})}
                                      placeholder="Any additional information or specific requests..."
                                    />
                                  </div>
                                </div>

                                <div className="flex space-x-2 pt-4">
                                  <Button type="submit" disabled={updateAppointmentMutation.isPending}>
                                    {updateAppointmentMutation.isPending ? 'Saving...' : 'Save Changes'}
                                  </Button>
                                  <Button type="button" variant="outline" onClick={() => setEditingAppointment(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}

        {/* Eye Exam Form */}
        {eyeExamAppointment && (
          <EyeExamForm
            isOpen={!!eyeExamAppointment}
            onClose={() => setEyeExamAppointment(null)}
            patientName={eyeExamAppointment.patients ? 
              `${eyeExamAppointment.patients.first_name} ${eyeExamAppointment.patients.last_name}` : 
              'Unknown Patient'
            }
            appointmentId={eyeExamAppointment.id}
          />
        )}
      </div>
    </Layout>
  );
}
