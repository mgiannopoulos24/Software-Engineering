import NotAuthorized from './NotAuthorized';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import React from 'react';

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles: string[];
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-lg text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (!allowedRoles.includes(userRole as string)) {
    return <NotAuthorized />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
