import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthRedirectHandler = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) {
      return;
    }

    // Αν ο χρήστης είναι συνδεδεμένος και βρίσκεται στις σελίδες login/signup,
    // τον στέλνουμε στο κατάλληλο dashboard.
    const onAuthPage = location.pathname === '/login' || location.pathname === '/signup';

    if (currentUser && onAuthPage) {
      const destination = currentUser.role === 'ADMIN' ? '/admin' : '/user';
      navigate(destination, { replace: true });
      return;
    }

    if (!currentUser && !onAuthPage && location.pathname !== '/') {
    }
  }, [currentUser, loading, location, navigate]);

  return null;
};

export default AuthRedirectHandler;
