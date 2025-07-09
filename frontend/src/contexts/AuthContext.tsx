import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type UserRole = 'ADMIN' | 'REGISTERED' | null;

interface UserProfile {
  id: number;
  email: string;
  role: UserRole;
  hasActiveInterestZone: boolean;
  hasActiveCollisionZone: boolean;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  userRole: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isRegistered: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  signup: (email: string, password: string) => Promise<UserProfile>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAndSetUser = async (token: string): Promise<UserProfile> => {
    const response = await fetch('/api/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Could not fetch user profile. The session may have expired.');
    }

    const userProfile: UserProfile = await response.json();

    if (userProfile.role) {
      userProfile.role = userProfile.role.toUpperCase() as UserRole;
    }

    localStorage.setItem('user', JSON.stringify(userProfile));
    setCurrentUser(userProfile);

    return userProfile;
  };

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Login API error response:', errorData);
      throw new Error('Login failed. Please check your credentials.');
    }

    const data = await response.json();
    const token = data.token;

    if (!token) {
      throw new Error('No token received from login API.');
    }

    localStorage.setItem('token', token);

    try {
      const userProfile = await fetchAndSetUser(token);
      return userProfile;
    } catch (error) {
      logout();
      throw error;
    }
  };

  const signup = async (email: string, password: string): Promise<UserProfile> => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    const data = await response.json();
    const token = data.token;

    if (!token) {
      throw new Error('No token received from register API.');
    }

    localStorage.setItem('token', token);

    const userProfile = await fetchAndSetUser(token);
    return userProfile;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  }, []);

  useEffect(() => {
    const checkExistingSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await fetchAndSetUser(token);
      } catch (error) {
        console.error('Session check failed, logging out:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, [logout]);

  const value = {
    currentUser,
    userRole: currentUser?.role ?? null,
    loading,
    isAdmin: currentUser?.role === 'ADMIN',
    isRegistered: currentUser?.role === 'REGISTERED',
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
