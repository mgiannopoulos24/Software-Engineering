import React, { createContext, useContext, useEffect, useState } from 'react';

type UserRole = 'admin' | 'registered' | null;

interface UserProfile {
  id: number;
  email?: string;
  role: UserRole;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  userRole: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isRegistered: boolean;
  login: (email: string, password: string) => Promise<{ role: UserRole }>;
  signup: (email: string, password: string) => Promise<{ role: UserRole }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userRole: null,
  loading: true,
  isAdmin: false,
  isRegistered: false,
  login: async () => ({ role: null }),
  signup: async () => ({ role: null }),
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string): Promise<{ role: UserRole }> => {
    try {
      const response = await fetch('https://localhost:8443/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store token if provided
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Create user profile from login response
      const userProfile: UserProfile = {
        id: data.id || data.user?.id,
        email: email,
        role: data.role || data.user?.role
      };

      setCurrentUser(userProfile);
      setUserRole(userProfile.role);

      return { role: userProfile.role };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string): Promise<{ role: UserRole }> => {
    try {
      const response = await fetch('https://localhost:8443/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      
      // Store token if provided
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Create user profile from login response
      const userProfile: UserProfile = {
        id: data.id || data.user?.id,
        email: email,
        role: data.role || data.user?.role
      };

      setCurrentUser(userProfile);
      setUserRole(userProfile.role);

      return { role: userProfile.role };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setUserRole(null);
  };

  useEffect(() => {
    const checkExistingSession = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setCurrentUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      // Since you don't have a profile endpoint, we can't verify the token
      // You might want to store user data in localStorage as well
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData: UserProfile = JSON.parse(storedUser);
          setCurrentUser(userData);
          setUserRole(userData.role);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        // Token exists but no user data, clear token
        localStorage.removeItem('token');
      }
      
      setLoading(false);
    };

    checkExistingSession();
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    isAdmin: userRole === 'admin',
    isRegistered: userRole === 'registered',
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
