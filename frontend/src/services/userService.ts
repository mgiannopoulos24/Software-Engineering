import { toast } from 'sonner';

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export interface UpdateSettingsPayload {
  email: string;
  currentPassword?: string;
  newPassword?: string;
}

/**
 * Ενημερώνει τις ρυθμίσεις του τρέχοντος συνδεδεμένου χρήστη.
 * @param payload Τα δεδομένα προς ενημέρωση.
 * @returns Το ενημερωμένο προφίλ του χρήστη από το backend.
 */
export const updateUserSettings = async (payload: UpdateSettingsPayload) => {
  const token = getToken();
  if (!token) {
    toast.error('Authentication Error', { description: 'You are not logged in.' });
    throw new Error('Authentication token not found.');
  }

  const response = await fetch('/api/users/me/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update settings. Please try again.');
    } catch {
      throw new Error('An unexpected error occurred while updating settings.');
    }
  }

  return response.json();
};
