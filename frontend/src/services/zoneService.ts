import { CollisionZoneDTO, ZoneOfInterestDTO } from '@/types/types';

// Βοηθητική συνάρτηση για τη λήψη του token
const getToken = (): string | null => {
    return localStorage.getItem('token');
};

// ===================================
//      ZONE OF INTEREST API CALLS
// ===================================

/** GET /api/zone/mine - Fetches the user's current Zone of Interest */
export const getInterestZone = async (): Promise<ZoneOfInterestDTO | null> => {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');

    const response = await fetch('/api/zone/mine', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 404) {
        return null; // No zone found, which is a valid case
    }
    if (!response.ok) {
        throw new Error('Failed to fetch zone of interest.');
    }
    return response.json();
};

/** PUT /api/zone/mine - Creates or updates the user's Zone of Interest */
export const createOrUpdateInterestZone = async (zoneData: ZoneOfInterestDTO): Promise<ZoneOfInterestDTO> => {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');

    const response = await fetch('/api/zone/mine', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(zoneData),
    });

    if (!response.ok) {
        throw new Error('Failed to save zone of interest.');
    }
    return response.json();
};

/** DELETE /api/zone/mine - Deletes the user's Zone of Interest */
export const deleteInterestZone = async (): Promise<void> => {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');

    const response = await fetch('/api/zone/mine', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error('Failed to delete zone of interest.');
    }
};


// ===================================
//      COLLISION ZONE API CALLS
// ===================================

/** GET /api/collision-zone/mine - Fetches the user's current Collision Zone */
export const getCollisionZone = async (): Promise<CollisionZoneDTO | null> => {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');

    const response = await fetch('/api/collision-zone/mine', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        throw new Error('Failed to fetch collision zone.');
    }
    return response.json();
};

/** PUT /api/collision-zone/mine - Creates or updates the user's Collision Zone */
export const createOrUpdateCollisionZone = async (zoneData: CollisionZoneDTO): Promise<CollisionZoneDTO> => {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');

    const response = await fetch('/api/collision-zone/mine', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(zoneData),
    });

    if (!response.ok) {
        throw new Error('Failed to save collision zone.');
    }
    return response.json();
};

/** DELETE /api/collision-zone/mine - Deletes the user's Collision Zone */
export const deleteCollisionZone = async (): Promise<void> => {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');

    const response = await fetch('/api/collision-zone/mine', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error('Failed to delete collision zone.');
    }
};