import Signup from '@/pages/Signup';
import { render } from '@/tests/test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ... (τα mocks παραμένουν ίδια) ...
const mockSignup = vi.fn();
vi.mock('@/contexts/AuthContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/contexts/AuthContext')>();
  return {
    ...mod,
    useAuth: () => ({
      signup: mockSignup,
      currentUser: null,
      loading: false,
      isAdmin: false,
      isRegistered: false,
      login: vi.fn(),
      logout: vi.fn(),
    }),
  };
});
vi.mock('sonner', async (importOriginal) => {
  const mod = await importOriginal<typeof import('sonner')>();
  return {
    ...mod,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe('Signup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the signup form correctly', () => {
    render(<Signup />);
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    // --- ΔΙΟΡΘΩΣΗ ΕΔΩ ---
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account?/i)).toBeInTheDocument();
  });

  it('should allow user to type in email and password fields', async () => {
    const user = userEvent.setup();
    render(<Signup />);

    const emailInput = screen.getByLabelText(/email address/i);
    // --- ΔΙΟΡΘΩΣΗ ΕΔΩ ---
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'newpassword123');

    expect(emailInput).toHaveValue('newuser@example.com');
    expect(passwordInput).toHaveValue('newpassword123');
  });

  it('should toggle password visibility on eye icon click', async () => {
    const user = userEvent.setup();
    render(<Signup />);

    // --- ΔΙΟΡΘΩΣΗ ΕΔΩ ---
    const passwordInput = screen.getByLabelText(/^password$/i);
    const visibilityToggle = screen.getByLabelText(/show password/i);

    expect(passwordInput).toHaveAttribute('type', 'password');
    await user.click(visibilityToggle);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(visibilityToggle);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // --- ΔΙΟΡΘΩΜΕΝΟ TEST CASE ---
  it('should call signup function and show success toast on successful submission', async () => {
    const user = userEvent.setup();
    mockSignup.mockResolvedValue({ role: 'REGISTERED' });

    render(<Signup />);

    await user.type(screen.getByLabelText(/email address/i), 'newuser@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'validpassword');

    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Κάνουμε κλικ και περιμένουμε να ολοκληρωθεί η συγχρονισμένη ροή
    await user.click(submitButton);

    // Τώρα μπορούμε να ελέγξουμε τις κλήσεις απευθείας, χωρίς waitFor
    expect(mockSignup).toHaveBeenCalledWith('newuser@test.com', 'validpassword');
    expect(toast.success).toHaveBeenCalledWith(
      'Account created successfully! You are now logged in.'
    );
  });

  // --- ΔΙΟΡΘΩΜΕΝΟ TEST CASE ---
  it('should show error toast on failed submission', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Email is already in use.';
    mockSignup.mockRejectedValue(new Error(errorMessage));

    render(<Signup />);

    await user.type(screen.getByLabelText(/email address/i), 'existing@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'anypassword');

    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Κάνουμε κλικ και περιμένουμε
    await user.click(submitButton);

    // Ελέγχουμε απευθείας
    expect(mockSignup).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Signup Failed', {
      description: errorMessage,
    });
  });
});
