
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthWrapper } from "@/components/AuthWrapper";
import { useUserRole } from "@/hooks/useUserRole";

interface EnquiryFormData {
  firstName: string;
  lastName: string;
  dob?: Date;
  birthMonth?: string;
  birthDay?: string;
  yob: string;
  gender: string;
  mobilePhone: string;
  workPhone?: string;
  email: string;
  contactMethod: string[];
  enquiryType: string[];
  satisfied: string;
  details: string;
}

const generateMonthOptions = () => {
  return [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ];
};

const generateDayOptions = () => {
  return Array.from({ length: 31 }, (_, i) => i + 1);
};

export default function Enquiries() {
  const { toast } = useToast();
  const { hasPermission, user } = useUserRole();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<EnquiryFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      yob: "",
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

  const [dob, setDob] = useState<Date | undefined>();
  const enquiryType = watch("enquiryType");

  const handleCheckboxChange = (item: string) => {
    const updated = enquiryType.includes(item)
      ? enquiryType.filter((i: string) => i !== item)
      : [...enquiryType, item];
    setValue("enquiryType", updated);
  };

  const handleContactMethodChange = (method: string, checked: boolean) => {
    const currentMethods = watch("contactMethod") || [];
    const updated = checked
      ? [...currentMethods, method]
      : currentMethods.filter((m: string) => m !== method);
    setValue("contactMethod", updated);
  };

  const onSubmit = async (data: EnquiryFormData) => {
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
        dob: dob ? dob.toISOString().split('T')[0] : null,
        birth_month: data.birthMonth || null,
        birth_day: data.birthDay || null,
        year_of_birth: data.yob ? parseInt(data.yob) : null,
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
        setDob(undefined);
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

  const enquiryOptions = [
    {
      category: "Appointment-Related Enquiries",
      items: ["Booking or rescheduling eye exams", "Cancellation of appointments"]
    },
    {
      category: "Vision and Eye Health Concerns",
      items: ["Blurry vision or changes in vision", "Eye pain, redness, or discharge", "Sensitivity to light", "Floaters or flashes of light", "Dry, itchy, or watery eyes", "Headaches related to eye strain"]
    },
    {
      category: "Glasses and Contact Lenses",
      items: ["Prescription updates", "Choosing the right type of lenses or frames", "Enquiries about progressive or bifocal lenses", "Fitting and adjustments", "Replacement of broken glasses", "Contact lens trials and fittings", "Reordering contact lenses", "Wearing schedule and hygiene advice"]
    },
    {
      category: "Eye Tests and Screenings",
      items: ["Children's eye exams", "Diabetic eye screening", "Glaucoma and cataract testing", "Visual field testing", "OCT (Optical Coherence Tomography) scans", "Driving vision tests (DVLA)"]
    },
    {
      category: "Insurance and Payment",
      items: ["What's covered under vision insurance", "Pricing for exams, lenses, or frames", "Methods of payment and financing options"]
    },
    {
      category: "Referrals and Medical Reports",
      items: ["GP or specialist referrals", "Requesting copies of prescriptions", "Reports for school or workplace"]
    },
    {
      category: "Products and Retail Enquiries",
      items: ["Availability of specific brands or frames", "Sunglasses and prescription sunglasses", "Lens coatings (anti-glare, blue light, UV)", "Accessories (cases, cleaning kits)", "Returns and warranties"]
    },
    {
      category: "Practice Services and Policies",
      items: ["Opening hours", "New patient registration"]
    }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 90 }, (_, i) => currentYear - i);

  return (
    <AuthWrapper requiredPermission="create">
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Patient Enquiries</h1>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First Name *
                      </Label>
                      <Input 
                        id="firstName" 
                        {...register("firstName", { required: true })}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      {errors.firstName && (
                        <span className="text-red-500 text-sm">This field is required</span>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last Name *
                      </Label>
                      <Input 
                        id="lastName" 
                        {...register("lastName", { required: true })}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      {errors.lastName && (
                        <span className="text-red-500 text-sm">This field is required</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Birth Month */}
                    <div className="space-y-2">
                      <Label htmlFor="birthMonth" className="text-sm font-medium text-gray-700">Birth Month</Label>
                      <select 
                        id="birthMonth" 
                        {...register("birthMonth")} 
                        className="w-full border border-gray-300 rounded-md p-2 focus:border-blue-500 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Select month</option>
                        {generateMonthOptions().map((month) => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Birth Day */}
                    <div className="space-y-2">
                      <Label htmlFor="birthDay" className="text-sm font-medium text-gray-700">Birth Day</Label>
                      <select 
                        id="birthDay" 
                        {...register("birthDay")} 
                        className="w-full border border-gray-300 rounded-md p-2 focus:border-blue-500 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Select day</option>
                        {generateDayOptions().map((day) => (
                          <option key={day} value={day.toString().padStart(2, '0')}>{day}</option>
                        ))}
                      </select>
                    </div>

                    {/* Year of Birth Dropdown */}
                    <div className="space-y-2">
                      <Label htmlFor="yob" className="text-sm font-medium text-gray-700">Year of Birth</Label>
                      <select 
                        id="yob" 
                        className="w-full border border-gray-300 rounded-md p-2 focus:border-blue-500 focus:ring-blue-500 bg-white" 
                        {...register("yob", { required: true })}
                      >
                        <option value="">Select year</option>
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      {errors.yob && <span className="text-red-500 text-sm">This field is required</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Gender */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Gender</Label>
                      <Select onValueChange={(value) => setValue("gender", value)}>
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Mobile Phone Number */}
                    <div className="space-y-2">
                      <Label htmlFor="mobilePhone" className="text-sm font-medium text-gray-700">
                        Mobile Phone Number *
                      </Label>
                      <Input 
                        id="mobilePhone" 
                        type="tel" 
                        {...register("mobilePhone", { required: true })}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      {errors.mobilePhone && (
                        <span className="text-red-500 text-sm">This field is required</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Work Phone Number */}
                    <div className="space-y-2">
                      <Label htmlFor="workPhone" className="text-sm font-medium text-gray-700">
                        Work Phone Number
                      </Label>
                      <Input 
                        id="workPhone" 
                        type="tel" 
                        {...register("workPhone")}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Email Address */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address *
                      </Label>
                      <Input 
                        id="email" 
                        type="email" 
                        {...register("email", { required: true })}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      {errors.email && (
                        <span className="text-red-500 text-sm">This field is required</span>
                      )}
                    </div>
                  </div>

                  {/* Preferred Contact Method */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Preferred Contact Method</Label>
                    <div className="flex flex-wrap gap-4">
                      {['Mobile Phone', 'Work Phone', 'Email', 'SMS'].map(method => (
                        <div key={method} className="flex items-center space-x-2">
                          <Checkbox 
                            id={method} 
                            onCheckedChange={(checked) => handleContactMethodChange(method, !!checked)}
                            className="border-gray-300"
                          />
                          <Label htmlFor={method} className="text-sm text-gray-700">{method}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enquiry Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Enquiry Type</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal border-gray-300 hover:bg-gray-50"
                        >
                          {enquiryType.length ? `${enquiryType.length} selected` : "Select Enquiry Types"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96 p-0 bg-white border border-gray-200 shadow-lg">
                        <div className="max-h-80 overflow-y-auto p-4">
                          <div className="space-y-4">
                            {enquiryOptions.map(group => (
                              <div key={group.category}>
                                <p className="font-semibold text-gray-900 mb-2">{group.category}</p>
                                <div className="space-y-2 ml-2">
                                  {group.items.map(item => (
                                    <div key={item} className="flex items-start space-x-2">
                                      <Checkbox
                                        id={item}
                                        checked={enquiryType.includes(item)}
                                        onCheckedChange={() => handleCheckboxChange(item)}
                                        className="border-gray-300 mt-0.5"
                                      />
                                      <Label htmlFor={item} className="text-sm text-gray-700 leading-tight">
                                        {item}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Satisfied with Response */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Was person satisfied with response given?
                    </Label>
                    <Select onValueChange={(value) => setValue("satisfied", value)}>
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Details Textarea */}
                  <div className="space-y-2">
                    <Label htmlFor="details" className="text-sm font-medium text-gray-700">
                      Additional Details
                    </Label>
                    <Textarea 
                      id="details" 
                      placeholder="Provide more information about the enquiry..." 
                      {...register("details")}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                    />
                  </div>

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
