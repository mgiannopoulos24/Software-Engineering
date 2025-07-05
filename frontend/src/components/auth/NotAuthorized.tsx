import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotAuthorized: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToDashboard = () => {
    const destination = isAdmin ? '/admin' : '/user';
    navigate(destination);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <ShieldAlert className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-2 text-gray-600">
          You do not have the necessary permissions to view this page.
        </p>
        <div className="mt-8 flex flex-col space-y-3 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0">
          <Button onClick={handleGoBack} variant="outline" className="w-full sm:w-auto">
            Go Back
          </Button>
          <Button onClick={handleGoToDashboard} className="w-full sm:w-auto">
            Go to My Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotAuthorized;