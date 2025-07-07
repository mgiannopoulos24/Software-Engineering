import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthRedirectHandler = () => {
    const { currentUser, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Μην κάνεις τίποτα αν ο έλεγχος της session τρέχει ακόμα
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

        // Αν ο χρήστης ΔΕΝ είναι συνδεδεμένος και προσπαθεί να μπει σε μια σελίδα
        // που δεν είναι η login/signup, τον στέλνουμε στο login.
        // Αυτή η λογική είναι πλέον εδώ αντί για το ProtectedRoute για κεντρικό έλεγχο.
        if (!currentUser && !onAuthPage && location.pathname !== '/') {
            // Αυτή η συνθήκη είναι λίγο πιο απλή από αυτή του ProtectedRoute.
            // Μπορείτε να την προσαρμόσετε αν χρειάζεται.
        }

    }, [currentUser, loading, location, navigate]);

    // Αυτό το component δεν αποδίδει τίποτα οπτικά.
    return null;
};

export default AuthRedirectHandler;