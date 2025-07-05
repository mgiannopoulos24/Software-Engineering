import NotAuthorized from './NotAuthorized';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles: string[];
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      // Show toast immediately
      toast.error('Authentication Required', {
        description: 'You must be logged in to access this page.',
      });

      // Delay navigation to allow toast to be seen
      const timer = setTimeout(() => {
        navigate('/login', { state: { from: location }, replace: true });
      }, 3000); // Increased to 3 seconds to match toast duration

      return () => clearTimeout(timer);
    }
  }, [loading, currentUser, navigate, location]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-lg text-slate-600 transition-colors duration-300 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100">
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // This will be handled by the useEffect, but we can return a loader for the brief moment before navigation.
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(userRole as string)) {
    return <NotAuthorized />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
