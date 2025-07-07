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

  // Αφαιρούμε εντελώς το useEffect.
  // Η ανακατεύθυνση των μη συνδεδεμένων χρηστών γίνεται πλέον
  // κεντρικά από το AuthRedirectHandler.

  // 1. Περίπτωση Loading: Ο έλεγχος της session δεν έχει ολοκληρωθεί.
  //    Δείχνουμε πάντα έναν spinner.
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

  // 2. Περίπτωση Μη Αυθεντικοποιημένου Χρήστη:
  //    Ο έλεγχος ολοκληρώθηκε, αλλά δεν υπάρχει χρήστης.
  if (!currentUser) {
    // Ο AuthRedirectHandler θα χειριστεί την ανακατεύθυνση στη σελίδα login.
    // Επιστρέφουμε null για να μην εμφανιστεί τίποτα προσωρινά.
    return null;
  }

  // 3. Περίπτωση Έλλειψης Δικαιωμάτων (Authorization):
  //    Υπάρχει χρήστης, αλλά ο ρόλος του δεν ταιριάζει.
  if (!allowedRoles.includes(userRole as string)) {
    return <NotAuthorized />;
  }

  // 4. "Happy Path": Ο χρήστης είναι συνδεδεμένος και έχει τα σωστά δικαιώματα.
  //    Εμφανίζουμε την προστατευμένη σελίδα.
  return <>{children}</>;
};

export default ProtectedRoute;