import AdminPage from '@/pages/admin/AdminPage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock user data that mirrors the backend DTO, but roles are lowercase as they come from the API
const mockUsers = [
  { id: 1, email: 'user1@example.com', role: 'registered' },
  { id: 2, email: 'admin2@example.com', role: 'admin' },
  { id: 3, email: 'user3@example.com', role: 'registered' },
];

// Helper function to render the component within a router
const renderComponent = () => {
  return render(
    <MemoryRouter>
      <AdminPage />
    </MemoryRouter>
  );
};

describe('AdminPage', () => {
  beforeEach(() => {
    // FIX 1: Mock browser APIs that don't exist in JSDOM
    // This prevents errors from UI libraries like Radix UI (used in shadcn)
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.HTMLElement.prototype.hasPointerCapture = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();

    // Mock localStorage to provide a fake token for API calls
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'token') {
        return 'fake-jwt-token';
      }
      return null;
    });

    // Mock window.confirm for the delete action
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    // Mock the global fetch function
    global.fetch = vi.fn();
  });

  afterEach(() => {
    // Restore all mocks after each test to ensure isolation
    vi.restoreAllMocks();
  });

  it('renders the loading state initially', () => {
    // Mock a fetch that never resolves to keep it in the loading state
    (fetch as vi.Mock).mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText(/Loading users.../i)).toBeInTheDocument();
  });

  it('renders users correctly after a successful fetch', async () => {
    // Mock a successful fetch response
    (fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUsers),
    });

    renderComponent();

    // Wait for the users to be rendered in the table
    expect(await screen.findByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('admin2@example.com')).toBeInTheDocument();
    expect(screen.getByText('user3@example.com')).toBeInTheDocument();

    // FIX 2: Check for uppercase roles, as rendered by the component
    expect(screen.getAllByText('REGISTERED')).toHaveLength(2);
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('displays an error message if the fetch fails', async () => {
    // Mock a failed fetch response
    (fetch as vi.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    renderComponent();

    // Wait for the error message to appear
    expect(await screen.findByText(/Failed to fetch users/i)).toBeInTheDocument();
  });

  it('opens the edit dialog and updates a user role', async () => {
    // Mock the initial GET request
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUsers),
    });

    renderComponent();

    // Wait for the table to load
    const editButtons = await screen.findAllByRole('button', { name: /edit user/i });
    fireEvent.click(editButtons[0]); // Click edit for 'user1@example.com'

    // Wait for the dialog to open and verify its content
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/Edit User Role/i)).toBeInTheDocument();
    expect(screen.getByText(/Change the role for user1@example.com/i)).toBeInTheDocument();

    // Mock the PUT request for the update
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      // The backend returns the updated user with the uppercase role
      json: () => Promise.resolve({ ...mockUsers[0], role: 'ADMIN' }),
    });

    // Change the role in the select dropdown
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    // The text in the dropdown is "Admin", not "ADMIN"
    const adminOption = await screen.findByText('Admin');
    fireEvent.click(adminOption);

    // Click the save button
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    // Wait for the dialog to close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // FIX 3: Verify the PUT request body sends the correct uppercase role value
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:8443/api/users/1', // user1 has id: 1
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-jwt-token',
        },
        // The SelectItem value is 'ADMIN', so this is what's sent
        body: JSON.stringify({ role: 'ADMIN' }),
      })
    );
  });

  it('deletes a user after confirmation', async () => {
    // Mock the initial GET request
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUsers),
    });

    renderComponent();

    const userToDeleteEmail = 'user1@example.com';

    // Ensure the user exists initially
    expect(await screen.findByText(userToDeleteEmail)).toBeInTheDocument();

    // Mock the DELETE request
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
    });

    // Find and click the delete button for the first user
    const deleteButtons = screen.getAllByRole('button', { name: /delete user/i });
    fireEvent.click(deleteButtons[0]);

    // Check that the confirmation dialog was shown
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this user?');

    // Wait for the user to be removed from the UI
    await waitFor(() => {
      expect(screen.queryByText(userToDeleteEmail)).not.toBeInTheDocument();
    });

    // Check that the fetch call for deletion was made
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:8443/api/users/1',
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });
});
