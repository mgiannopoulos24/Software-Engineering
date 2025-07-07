import AuthLayout from '@/components/layout/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ΒΗΜΑ 1: Καλούμε τη νέα συνάρτηση signup, η οποία επιστρέφει πλέον ολόκληρο το προφίλ του χρήστη.
      const userProfile = await signup(email, password);

      toast.success('Account created successfully!', {
        description: 'You are now being logged in.',
      });

      // ΒΗΜΑ 2: Κάνουμε την ανακατεύθυνση με βάση τον πραγματικό ρόλο από το backend.
      // Για νέες εγγραφές, ο ρόλος θα είναι πάντα 'registered', αλλά αυτή η λογική είναι πιο ανθεκτική σε μελλοντικές αλλαγές.
      navigate(userProfile.role === 'admin' ? '/admin' : '/user');

    } catch (error: any) {
      // Ο χειρισμός σφαλμάτων παραμένει ίδιος.
      const errorMessage = error.message || 'An error occurred. Please try again.';
      toast.error('Signup Failed', {
        description: errorMessage,
      });
      console.error('Signup failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <AuthLayout
          title="Create Your Account"
          footer={
            <>
              <span>Already have an account? </span>
              <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-500">
                Log in
              </Link>
            </>
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
                  className="block w-full rounded-md border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-slate-900">
              Password
            </label>
            <div className="relative mt-2">
              <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={5} // Προσθήκη βασικού validation για τον κωδικό
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-2 pr-10 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6"
              />
              <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm transition-colors hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </AuthLayout>
  );
};

export default Signup;