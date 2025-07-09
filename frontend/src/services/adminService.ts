import { ShipDetailsDTO } from '@/types/types';

const getToken = (): string | null => {
    return localStorage.getItem('token');
};

/**
 * Fetches all ships from the admin endpoint.
 * @returns A promise that resolves to an array of ShipDetailsDTO.
 */
export const getAllShips = async (): Promise<ShipDetailsDTO[]> => {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');

    const response = await fetch('/api/admin/ships', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch all ships for admin.');
    }
    return response.json();
};

/**
 * Updates the type of a specific ship.
 * @param mmsi The MMSI of the ship to update.
 * @param shiptype The new ship type.
 * @returns A promise that resolves to the updated ShipDetailsDTO.
 */
export const updateShipType = async (mmsi: number, shiptype: string): Promise<ShipDetailsDTO> => {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');

    const response = await fetch(`/api/admin/ships/${mmsi}/type`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shiptype }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update ship type.');
    }
    return response.json();
};

/**
 * Fetches the current simulation speed factor from the server.
 * @returns A promise that resolves to an object containing the speed factor.
 */
export const getSimulationSpeed = async (): Promise<{ speedFactor: number }> => {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');

    const response = await fetch('/api/admin/simulation/speed', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch simulation speed.');
    }
    return response.json();
};

/**
 * Updates the simulation speed factor on the server.
 * @param speed The new speed factor.
 * @returns A promise that resolves on success.
 */
export const updateSimulationSpeed = async (speed: number): Promise<void> => {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');

    const response = await fetch('/api/admin/simulation/speed', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newSpeedFactor: speed }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update simulation speed.');
    }
};