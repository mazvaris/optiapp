
import { Layout } from "@/components/Layout";
import LensProductForm from "@/components/LensProductForm";

const LensCostings = () => {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lens Costings</h1>
          <p className="text-gray-600">Manage lens product information and pricing</p>
        </div>
        
        <LensProductForm />
      </div>
    </Layout>
  );
};

export default LensCostings;
