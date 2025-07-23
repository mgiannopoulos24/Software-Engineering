import { useAuth } from '@/contexts/AuthContext';
import SettingsPage from '@/pages/user/SettingsPage';
import { updateUserSettings } from '@/services/userService';
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogout = vi.fn();
const mockNavigate = vi.fn();
const mockUseAuth = useAuth as vi.Mock;
vi.mock('@/contexts/AuthContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/contexts/AuthContext')>();
  return { ...mod, useAuth: vi.fn() };
});

// Mocking the userService
vi.mock('@/services/userService', () => ({
  updateUserSettings: vi.fn(),
}));
const mockUpdateUserSettings = updateUserSettings as vi.Mock;

// Mocking react-router-dom for navigation
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...mod,
    useNavigate: () => mockNavigate,
  };
});

// Mocking sonner for toast notifications
vi.mock('sonner', async (importOriginal) => {
  const mod = await importOriginal<typeof import('sonner')>();
  return {
    ...mod,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  };
});

// --- Test Suite ---

describe('SettingsPage', () => {
  const user = userEvent.setup();

  const mockUser = {
    id: 1,
    email: 'user@example.com',
    role: 'REGISTERED',
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Set up the default mock implementation for useAuth
    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      logout: mockLogout,
      isAdmin: false,
    });
  });

  // --- Rendering and Initial State ---
  it('renders the settings form with user email pre-filled', () => {
    render(<SettingsPage />);

    expect(screen.getByRole('heading', { name: /account settings/i })).toBeInTheDocument();
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveValue(mockUser.email);
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('allows typing in all password fields', async () => {
    render(<SettingsPage />);

    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);

    await user.type(currentPasswordInput, 'currentPass');
    await user.type(newPasswordInput, 'newPass');

    expect(currentPasswordInput).toHaveValue('currentPass');
    expect(newPasswordInput).toHaveValue('newPass');
  });

  it('toggles password visibility for both password fields', async () => {
    render(<SettingsPage />);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);

    // Using `getAllByRole` as the eye icon might not have a specific accessible name
    const visibilityButtons = screen.getAllByRole('button', { hidden: true });

    // Assuming the first toggle is for current password, second for new password.
    const currentPasswordToggle = visibilityButtons[0];
    const newPasswordToggle = visibilityButtons[1];

    expect(currentPasswordInput).toHaveAttribute('type', 'password');
    await user.click(currentPasswordToggle);
    expect(currentPasswordInput).toHaveAttribute('type', 'text');

    expect(newPasswordInput).toHaveAttribute('type', 'password');
    await user.click(newPasswordToggle);
    expect(newPasswordInput).toHaveAttribute('type', 'text');
  });

  // --- Form Submission Scenarios ---
  it('shows an error toast if trying to set a new password without the current one', async () => {
    render(<SettingsPage />);

    await user.type(screen.getByLabelText(/new password/i), 'newPassword123');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(toast.error).toHaveBeenCalledWith('Current password is required to set a new password.');
    expect(mockUpdateUserSettings).not.toHaveBeenCalled();
  });

  it('successfully updates password and shows success toast', async () => {
    mockUpdateUserSettings.mockResolvedValue({});
    render(<SettingsPage />);

    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    await user.type(currentPasswordInput, 'oldPassword');
    await user.type(newPasswordInput, 'newPassword123');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateUserSettings).toHaveBeenCalledWith({
        email: mockUser.email,
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123',
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Your settings have been updated successfully!');
    // The input fields should be cleared
    expect(currentPasswordInput).toHaveValue('');
    expect(newPasswordInput).toHaveValue('');
  });

  it('successfully updates email, logs out, and redirects to login', async () => {
    const newEmail = 'new-email@example.com';
    mockUpdateUserSettings.mockResolvedValue({});
    render(<SettingsPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    await user.clear(emailInput);
    await user.type(emailInput, newEmail);
    await user.type(currentPasswordInput, 'myPassword');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateUserSettings).toHaveBeenCalledWith({
        email: newEmail,
        currentPassword: 'myPassword',
        newPassword: '', // newPassword is empty
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Your settings have been updated successfully!');
    expect(toast.info).toHaveBeenCalledWith('Your email has changed. Please log in again to continue.');
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows an error toast when the API call fails', async () => {
    const errorMessage = 'Incorrect password';
    mockUpdateUserSettings.mockRejectedValue(new Error(errorMessage));
    render(<SettingsPage />);

    await user.type(screen.getByLabelText(/current password/i), 'wrongPassword');
    await user.type(screen.getByLabelText(/new password/i), 'newPassword123');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Update Failed', {
        description: errorMessage,
      });
    });
  });
});