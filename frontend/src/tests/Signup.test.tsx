import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Signup from '@/pages/Signup';

// --- Mocking External Dependencies ---

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSignup = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
  }),
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('Signup Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the signup form correctly', () => {
    renderWithRouter(<Signup />);
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
  });

  it('should call signup, show success toast, and navigate on successful submission', async () => {
    mockSignup.mockResolvedValue({ role: 'registered' });
    const user = userEvent.setup();
    renderWithRouter(<Signup />);

    await user.type(screen.getByLabelText(/email address/i), 'newuser@example.com');
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'strongPassword123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('newuser@example.com', 'strongPassword123');
      expect(toast.success).toHaveBeenCalledWith('Account created successfully!', expect.any(Object));
      expect(mockNavigate).toHaveBeenCalledWith('/user');
    });
  });

  it('should show an error toast and not navigate on failed submission', async () => {
    const errorMessage = 'An error occurred. Please try again.';
    mockSignup.mockRejectedValue(new Error('Email already exists'));
    const user = userEvent.setup();
    renderWithRouter(<Signup />);

    await user.type(screen.getByLabelText(/email address/i), 'existinguser@example.com');
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled();
  });

  it('should disable the button and show loading text while submitting', async () => {
    mockSignup.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderWithRouter(<Signup />);

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    const submitButton = screen.getByRole('button', { name: /creating account.../i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should toggle password visibility when the eye icon is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Signup />);

    const passwordInput = screen.getByLabelText(/password/i, { selector: 'input' });
    const showPasswordButton = screen.getByLabelText(/show password/i);

    expect(passwordInput).toHaveAttribute('type', 'password');
    await user.click(showPasswordButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/hide password/i)).toBeInTheDocument();
    await user.click(showPasswordButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/show password/i)).toBeInTheDocument();
  });
});