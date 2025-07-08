import { useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';
import { vi } from 'vitest';

// --- Mocking Εξαρτήσεων ---
vi.mock('@/contexts/AuthContext');
const mockedUseAuth = useAuth as vi.Mock;

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/layout/AuthLayout', () => ({
  default: ({
    title,
    children,
    footer,
  }: {
    title: string;
    children: React.ReactNode;
    footer: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
      <footer>{footer}</footer>
    </div>
  ),
}));

// --- Το Test Suite ---
describe('Login Page', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      login: mockLogin,
    });
  });

  it('should render the login form correctly', () => {
    render(<Login />, { wrapper: MemoryRouter });

    expect(screen.getByLabelText(/^email address$/i)).toBeInTheDocument();
    // ΔΙΟΡΘΩΣΗ: Χρησιμοποιούμε ακριβή αντιστοίχιση (exact match) για το label
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account?/i)).toBeInTheDocument();
  });

  it('should allow user to type in email and password fields', () => {
    render(<Login />, { wrapper: MemoryRouter });

    const emailInput = screen.getByLabelText(/^email address$/i) as HTMLInputElement;
    // ΔΙΟΡΘΩΣΗ: Χρησιμοποιούμε ακριβή αντιστοίχιση
    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('should call login function and navigate to user page on successful login for registered user', async () => {
    mockLogin.mockResolvedValue({ role: 'registered' });
    render(<Login />, { wrapper: MemoryRouter });

    // ΔΙΟΡΘΩΣΗ: Χρησιμοποιούμε ακριβή αντιστοίχιση
    fireEvent.change(screen.getByLabelText(/^email address$/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'password');
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
      expect(mockNavigate).toHaveBeenCalledWith('/user');
    });
  });

  it('should navigate to admin page on successful login for admin user', async () => {
    mockLogin.mockResolvedValue({ role: 'admin' });
    render(<Login />, { wrapper: MemoryRouter });

    // ΔΙΟΡΘΩΣΗ: Χρησιμοποιούμε ακριβή αντιστοίχιση
    fireEvent.change(screen.getByLabelText(/^email address$/i), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'adminpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'adminpass');
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  it('should show an error toast on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Login failed'));
    render(<Login />, { wrapper: MemoryRouter });

    // ΔΙΟΡΘΩΣΗ: Χρησιμοποιούμε ακριβή αντιστοίχιση
    fireEvent.change(screen.getByLabelText(/^email address$/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Login failed'));
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('should toggle password visibility when eye icon is clicked', async () => {
    render(<Login />, { wrapper: MemoryRouter });

    // ΔΙΟΡΘΩΣΗ: Χρησιμοποιούμε ακριβή αντιστοίχιση
    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: /show password/i });

    expect(passwordInput.type).toBe('password');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(passwordInput.type).toBe('text');
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
    });

    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(passwordInput.type).toBe('password');
    });
  });

  it('should disable the submit button while loading', async () => {
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ role: 'registered' }), 100))
    );
    render(<Login />, { wrapper: MemoryRouter });

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    expect(signInButton).not.toBeDisabled();

    // ΔΙΟΡΘΩΣΗ: Βάζουμε κείμενο στα πεδία για να περάσει το validation της φόρμας
    fireEvent.change(screen.getByLabelText(/^email address$/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password' } });

    fireEvent.click(signInButton);

    expect(signInButton).toBeDisabled();
    expect(signInButton).toHaveTextContent(/signing in/i);

    await waitFor(() => {
      expect(signInButton).not.toBeDisabled();
    });
  });
});
