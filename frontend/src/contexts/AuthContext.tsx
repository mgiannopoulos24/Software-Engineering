import React, { createContext, useContext, useEffect, useState } from 'react';

// Update UserRole to support both roles
type UserRole = 'admin' | 'registered' | null;

// Update UserProfile to match your backend response
interface UserProfile {
  id: number;
  email?: string;    // Optional, if your backend returns it
  role: UserRole;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  userRole: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isRegistered: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userRole: null,
  loading: true,
  isAdmin: false,
  isRegistered: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData: UserProfile = await response.json();
          setCurrentUser(userData);
          setUserRole(userData.role);
        } else {
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
    isRegistered: userRole === 'registered',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
