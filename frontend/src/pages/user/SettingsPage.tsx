import AuthLayout from '@/components/layout/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
// Βεβαιώσου ότι το import υπάρχει
import { updateUserSettings } from '@/services/userService';
import { Eye, EyeOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const SettingsPage: React.FC = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  const mapPath = isAdmin ? '/admin' : '/user';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Βασικός έλεγχος: Αν αλλάζει ο κωδικός, πρέπει να δοθεί ο τρέχων.
    if (newPassword && !currentPassword) {
      toast.error('Current password is required to set a new password.');
      return;
    }
    // Αν αλλάζει το email ή ο κωδικός, ο τρέχων κωδικός είναι απαραίτητος για ασφάλεια
    if ((newPassword || (currentUser && email !== currentUser.email)) && !currentPassword) {
      toast.error('Please enter your current password to make changes.');
      return;
    }

    setIsLoading(true);
    try {
      // Στέλνουμε μόνο τα πεδία που έχουν τιμή
      await updateUserSettings({
        email,
        currentPassword: currentPassword,
        newPassword: newPassword,
      });

      toast.success('Your settings have been updated successfully!');

      // Αν το email άλλαξε, ο χρήστης πρέπει να ξανασυνδεθεί.
      // Το παλιό JWT token είναι πλέον άκυρο (αφού βασίζεται στο παλιό email).
      if (currentUser && currentUser.email !== email) {
        toast.info('Your email has changed. Please log in again to continue.');
        logout(); // Κάνουμε logout
        navigate('/login'); // και τον στέλνουμε στη σελίδα login.
      } else {
        // Αν άλλαξε μόνο ο κωδικός, απλά καθαρίζουμε τα πεδία.
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (error: any) {
      toast.error('Update Failed', {
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Account Settings"
      footer={
        <p>
          Return to{' '}
          <Link to={mapPath} className="font-semibold text-sky-600 hover:text-sky-500">
            Map View
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900">
            Email address
          </label>
          <div className="mt-2">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-md border-0 px-4 py-2 text-base text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="current-password"
            className="block text-sm font-medium leading-6 text-slate-900"
          >
            Current Password
          </label>
          <div className="relative mt-2">
            <input
              id="current-password"
              name="current-password"
              type={showCurrentPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter to make changes"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="block w-full rounded-md border-0 px-4 py-2 text-base text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            >
              {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium leading-6 text-slate-900"
          >
            New Password (optional)
          </label>
          <div className="relative mt-2">
            <input
              id="new-password"
              name="new-password"
              type={showNewPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={5}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full rounded-md border-0 px-4 py-2 text-base text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            >
              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm transition-colors hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default SettingsPage;
