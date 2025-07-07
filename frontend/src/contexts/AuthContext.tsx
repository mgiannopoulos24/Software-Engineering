import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Τύποι που χρησιμοποιούνται στο context
type UserRole = 'admin' | 'registered' | null;

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

  // ΒΟΗΘΗΤΙΚΗ ΣΥΝΑΡΤΗΣΗ: Παίρνει τα πλήρη στοιχεία του χρήστη από το /api/users/me
  // χρησιμοποιώντας το token που μόλις λάβαμε.
  const fetchAndSetUser = async (token: string): Promise<UserProfile> => {
    const response = await fetch('/api/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Could not fetch user profile after login.');
    }
    const userProfile: UserProfile = await response.json();

    // Αποθήκευση του πλήρους προφίλ
    localStorage.setItem('user', JSON.stringify(userProfile));
    setCurrentUser(userProfile);

    return userProfile;
  };

  const login = async (email: string, password: string): Promise<UserProfile> => {
    // Βήμα 1: Κάνε login για να πάρεις το token
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.text(); // Χρησιμοποιούμε .text() για να δούμε τι ακριβώς επιστρέφει
      console.error('Login API error response:', errorData);
      throw new Error('Login failed. Please check your credentials.');
    }

    const data = await response.json();
    const token = data.token;

    if (!token) {
      throw new Error('No token received from login API.');
    }

    // Αποθηκεύουμε προσωρινά το token
    localStorage.setItem('token', token);

    // Βήμα 2: Χρησιμοποίησε το token για να πάρεις το πλήρες προφίλ
    try {
      const userProfile = await fetchAndSetUser(token);
      return userProfile;
    } catch (error) {
      // Αν αποτύχει η λήψη του προφίλ, καθαρίζουμε το token και κάνουμε logout
      logout();
      throw error;
    }
  };

  const signup = async (email: string, password: string): Promise<UserProfile> => {
    // Λογική παρόμοια με το login
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

  // ΒΕΛΤΙΩΜΕΝΟ useEffect ΓΙΑ ΕΛΕΓΧΟ ΤΗΣ SESSION ΚΑΤΑ ΤΗ ΦΟΡΤΩΣΗ
  useEffect(() => {
    const checkExistingSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Προσπαθούμε να πάρουμε το προφίλ με το αποθηκευμένο token.
        // Αυτόματα, αυτό επικυρώνει ότι το token είναι ακόμα έγκυρο.
        await fetchAndSetUser(token);
      } catch (error) {
        // Αν το token είναι άκυρο (π.χ. έληξε), το API θα επιστρέψει 401/403.
        // Σε αυτή την περίπτωση, καθαρίζουμε τα πάντα.
        console.error("Session check failed, logging out:", error);
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
    isAdmin: currentUser?.role === 'admin',
    isRegistered: currentUser?.role === 'registered',
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
