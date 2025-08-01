
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquarePlus, List } from "lucide-react";
import { Link } from "react-router-dom";

const EnquiriesLanding = () => {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enquiries</h1>
          <p className="text-gray-600">Manage patient enquiries and communications</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/enquiries/new" className="group">
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-blue-500">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <MessageSquarePlus className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">New Enquiry</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">Create a new patient enquiry with comprehensive contact details and enquiry information</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/enquiries/list" className="group">
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-green-500">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <List className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">Enquiry List</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">View and manage all existing patient enquiries and their status</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default EnquiriesLanding;
