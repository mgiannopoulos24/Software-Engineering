import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const NotAuthorized: React.FC = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full rounded-lg border bg-white p-8 shadow-md">
        <div className="flex flex-col items-center justify-center">
          <ShieldAlert className="h-16 w-16 text-red-600" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-center text-gray-600">
            You don't have permission to access this page. Please log in with an account that has
            the required permissions.
          </p>
          <Link to="/login" className="mt-6 w-full">
            <Button className="w-full">Return to Login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotAuthorized;
