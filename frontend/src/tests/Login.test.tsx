import Login from '@/pages/Login';
import { render } from '@/tests/test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Κάνουμε mock το AuthContext για να ελέγχουμε τη συμπεριφορά του
const mockLogin = vi.fn();
vi.mock('@/contexts/AuthContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/contexts/AuthContext')>();
  return {
    ...mod,
    useAuth: () => ({
      login: mockLogin,
      currentUser: null,
      loading: false,
      isAdmin: false,
      isRegistered: false,
      signup: vi.fn(),
      logout: vi.fn(),
    }),
  };
});

// -- ΔΙΟΡΘΩΣΗ ΕΔΩ --
// Κάνουμε μερικό mock το 'sonner' για να διατηρήσουμε το Toaster component
vi.mock('sonner', async (importOriginal) => {
  const mod = await importOriginal<typeof import('sonner')>();
  return {
    ...mod, // Κρατάμε όλα τα exports του αρχικού module (π.χ. το component Toaster)
    // και αντικαθιστούμε ΜΟΝΟ το toast object με το δικό μας mock.
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    },
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the login form correctly', () => {
    render(<Login />);
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument(); // Ακριβής αναζήτηση για "Password"
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account?/i)).toBeInTheDocument();
  });

  it('should allow user to type in email and password fields', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should toggle password visibility on eye icon click', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const visibilityToggle = screen.getByLabelText(/show password/i);

    expect(passwordInput).toHaveAttribute('type', 'password');
    await user.click(visibilityToggle);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(visibilityToggle);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should call login function and show success toast on successful submission', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ role: 'REGISTERED' });

    render(<Login />);

    await user.type(screen.getByLabelText(/email address/i), 'user@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'goodpassword');

    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // 1. Έλεγχος πριν το κλικ
    expect(submitButton).not.toBeDisabled();

    // 2. Πράξη
    await user.click(submitButton);

    // 3. Έλεγχος αποτελεσμάτων
    // Περιμένουμε το toast.success να κληθεί. Αυτό μας επιβεβαιώνει ότι
    // η Promise του login έχει γίνει resolve και η λογική έχει προχωρήσει.
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
    });

    // Επιβεβαιώνουμε ότι η συνάρτηση login κλήθηκε με τα σωστά δεδομένα
    expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'goodpassword');

    // Το κουμπί θα πρέπει να είναι ενεργό ξανά αφού ολοκληρωθεί η διαδικασία.
    expect(submitButton).not.toBeDisabled();
  });

  // --- ΔΙΟΡΘΩΜΕΝΟ TEST CASE ---
  it('should show error toast on failed submission', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials provided.';
    mockLogin.mockRejectedValue(new Error(errorMessage));

    render(<Login />);

    await user.type(screen.getByLabelText(/email address/i), 'user@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword');

    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // 1. Έλεγχος πριν το κλικ
    expect(submitButton).not.toBeDisabled();

    // 2. Πράξη
    await user.click(submitButton);

    // 3. Έλεγχος αποτελεσμάτων
    // Περιμένουμε να εμφανιστεί το toast.error
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Login failed. Please check your credentials.');
    });

    // Επιβεβαιώνουμε ότι η συνάρτηση login κλήθηκε
    expect(mockLogin).toHaveBeenCalledTimes(1);

    // Το κουμπί θα πρέπει να είναι ενεργό ξανά μετά το σφάλμα.
    expect(submitButton).not.toBeDisabled();
  });
});
