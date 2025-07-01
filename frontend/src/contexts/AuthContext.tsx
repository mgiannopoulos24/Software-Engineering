import React, { createContext, useContext, useEffect, useState } from 'react';

// Define the user role type to match your backend's roles.
// Simplified to only 'admin' for now as requested.
type UserRole = 'admin' | null;

// Define a user profile structure based on your backend's User model.
// Adjust the properties to match what your API returns.
interface UserProfile {
  username: string; // This could be email or another unique identifier
  role: UserRole;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  userRole: UserRole;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userRole: null,
  loading: true,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        // This endpoint should be protected by your Spring Boot security.
        // It returns the logged-in user's data if the session is valid.
        // You may need to adjust the endpoint URL.
        const response = await fetch('/api/auth/me');

        if (response.ok) {
          const userData: UserProfile = await response.json();
          setCurrentUser(userData);
          setUserRole(userData.role);
        } else {
          // Handles cases where the user is not logged in or the session is invalid.
          setCurrentUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
        setCurrentUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSession();
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    isAdmin: userRole === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
