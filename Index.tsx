
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from "@/components/Layout";
import { DashboardContent } from "@/components/DashboardContent";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If not loading and no user, redirect to auth page
    if (!loading && !user) {
      console.log('No authenticated user found, redirecting to auth page');
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render anything if no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <Layout>
      <DashboardContent />
    </Layout>
  );
}
