import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'user';
}

const ProtectedRoute = ({ children, requiredRole = 'user' }: ProtectedRouteProps) => {
  // Mock authentication - replace with your actual auth logic
  const mockUser = {
    isAuthenticated: true,
    role: 'admin', // Change this to test different scenarios
    email: 'admin@ais.com',
  };

  // Check if user is authenticated
  if (!mockUser.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (requiredRole === 'admin' && mockUser.role !== 'admin') {
    return <Navigate to="/user" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
