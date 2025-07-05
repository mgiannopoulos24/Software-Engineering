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

  // Αυτό το useEffect παραμένει ίδιο. Χειρίζεται ΜΟΝΟ τους ανώνυμους χρήστες
  // και τους ανακατευθύνει στο login.
  useEffect(() => {
    if (!loading && !currentUser) {
      toast.error('Authentication Required', {
        description: 'You must be logged in to access this page.',
        duration: 3000,
      });

      const timer = setTimeout(() => {
        navigate('/login', { state: { from: location }, replace: true });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [loading, currentUser, navigate, location]);

  // --- ΝΕΑ, ΠΙΟ ΣΑΦΗΣ ΛΟΓΙΚΗ ΑΠΟΔΟΣΗΣ (RENDER LOGIC) ---

  // Περίπτωση 1: Ο έλεγχος αυθεντικοποίησης δεν έχει ολοκληρωθεί ακόμα.
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

  // Περίπτωση 2: Ο έλεγχος ολοκληρώθηκε, αλλά ΔΕΝ βρέθηκε χρήστης.
  // Σε αυτή την περίπτωση, το παραπάνω useEffect θα ενεργοποιηθεί.
  // Εμφανίζουμε ένα loader για να καλύψουμε τον χρόνο μέχρι την ανακατεύθυνση.
  if (!currentUser) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-lg text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Περίπτωση 3: Υπάρχει χρήστης, αλλά ο ρόλος του ΔΕΝ επιτρέπεται.
  // Εμφανίζουμε ΑΜΕΣΩΣ τη σελίδα "NotAuthorized". Δεν υπάρχει λόγος για loader εδώ.
  if (!allowedRoles.includes(userRole as string)) {
    return <NotAuthorized />;
  }

  // Περίπτωση 4: Όλα είναι εντάξει. Ο χρήστης είναι συνδεδεμένος και έχει τον σωστό ρόλο.
  // Εμφανίζουμε την προστατευμένη σελίδα.
  return <>{children}</>;
};

export default ProtectedRoute;