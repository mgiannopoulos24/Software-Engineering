import { toast } from 'sonner';

// Βοηθητική συνάρτηση για τη λήψη του token
const getToken = (): string | null => {
    return localStorage.getItem('token');
};

// Interface για το payload που θα στέλνουμε στο backend
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

    // Προσωρινό endpoint, όπως ζήτησες.
    const response = await fetch('/api/users/me/settings', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        try {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update settings. Please try again.');
        } catch (e) {
            throw new Error('An unexpected error occurred while updating settings.');
        }
    }

    // Επιστρέφουμε το JSON αν το backend στείλει πίσω το ενημερωμένο προφίλ χρήστη
    return response.json();
};