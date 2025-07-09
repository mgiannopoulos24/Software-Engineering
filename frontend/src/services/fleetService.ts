import { ShipDetailsDTO } from '@/types/types';

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// GET /api/fleet/mine
export const getMyFleet = async (): Promise<ShipDetailsDTO[]> => {
  const token = getToken();
  if (!token) throw new Error('Authentication token not found.');

  const response = await fetch('/api/fleet/mine', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user fleet.');
  }
  return response.json();
};

// POST /api/fleet/mine/ships/{mmsi}
export const addShipToFleet = async (mmsi: number): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error('Authentication token not found.');

  const response = await fetch(`/api/fleet/mine/ships/${mmsi}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to add ship with MMSI ${mmsi} to fleet.`);
  }
};

// DELETE /api/fleet/mine/ships/{mmsi}
export const removeShipFromFleet = async (mmsi: number): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error('Authentication token not found.');

  const response = await fetch(`/api/fleet/mine/ships/${mmsi}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to remove ship with MMSI ${mmsi} from fleet.`);
  }
};
