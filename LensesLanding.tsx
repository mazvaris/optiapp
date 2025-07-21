
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, Grid3X3, FileText, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

const LensesLanding = () => {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lenses Inventory</h1>
          <p className="text-gray-600">Manage lens stock, track inventory, and monitor transactions</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/inventory/lenses/add" className="group">
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-blue-500">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <Plus className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">Add Lenses</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm">Add new lens stock using the grid system for bulk entries</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/inventory/lenses/out" className="group">
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-red-500">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                  <Minus className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">Lens Out</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm">Record lens dispensing and stock reduction</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/inventory/lenses/grid" className="group">
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-green-500">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <Grid3X3 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">Lens Stock Grid</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm">View current stock levels in a visual grid format</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/inventory/lenses/ledger" className="group">
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-purple-500">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">Lens Ledger</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm">View transaction history and stock movements</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/inventory/lenses/costings" className="group">
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-orange-500">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <DollarSign className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">Lens Costings</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm">Manage lens product information and pricing</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default LensesLanding;
