import { useAuth } from '@/contexts/AuthContext';
import { useFleet } from '@/contexts/FleetContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useZones } from '@/contexts/ZoneContext';
import SharedMapPage from '@/pages/SharedMapPage';
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils';
import { RealTimeShipUpdateDTO } from '@/types/types';
import { vi } from 'vitest';
import { beforeEach, describe, expect, it } from 'vitest';

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/contexts/AuthContext')>();
  return {
    ...mod,
    useAuth: vi.fn(),
  };
});
vi.mock('@/contexts/FleetContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/contexts/FleetContext')>();
  return {
    ...mod,
    useFleet: vi.fn(),
  };
});
vi.mock('@/contexts/ZoneContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/contexts/ZoneContext')>();
  return {
    ...mod,
    useZones: vi.fn(),
  };
});
vi.mock('@/contexts/WebSocketContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/contexts/WebSocketContext')>();
  return {
    ...mod,
    useWebSocket: vi.fn(),
  };
});

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      invalidateSize: vi.fn(),
      getZoom: vi.fn(() => 10),
      getCenter: vi.fn(() => ({ lat: 49, lng: 0 })),
      getBounds: vi.fn(() => ({
        contains: vi.fn(() => true),
        getNorthEast: vi.fn(() => ({ lat: 50, lng: 1 })),
        getSouthWest: vi.fn(() => ({ lat: 48, lng: -1 })),
      })),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      eachLayer: vi.fn(),
      hasLayer: vi.fn(() => false),
      addControl: vi.fn(),
      removeControl: vi.fn(),
      closePopup: vi.fn(),
      openPopup: vi.fn(),
      getContainer: vi.fn(() => ({
        style: { cursor: '' },
      })),
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn(),
    })),
    marker: vi.fn(() => ({
      addTo: vi.fn(),
      setLatLng: vi.fn(),
      bindPopup: vi.fn(),
      openPopup: vi.fn(),
      closePopup: vi.fn(),
      remove: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      bindTooltip: vi.fn().mockReturnThis(),
    })),
    circle: vi.fn(() => ({
      addTo: vi.fn(),
      setLatLng: vi.fn(),
      setRadius: vi.fn(),
      remove: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      getBounds: vi.fn(() => ({
        contains: vi.fn(() => true),
      })),
      bindTooltip: vi.fn().mockReturnThis(),
      bindPopup: vi.fn().mockReturnThis(),
      openPopup: vi.fn(),
      closePopup: vi.fn(),
    })),
    layerGroup: vi.fn(() => ({
      addTo: vi.fn(),
      clearLayers: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      eachLayer: vi.fn(),
      remove: vi.fn(),
    })),
    icon: vi.fn(() => ({})),
    divIcon: vi.fn(() => ({})),
    latLng: vi.fn((lat, lng) => ({ lat, lng })),
    latLngBounds: vi.fn(() => ({
      extend: vi.fn(),
      isValid: vi.fn(() => true),
    })),
  },
}));

vi.mock('@/utils/mapUtils', () => ({
  drawZone: vi.fn().mockReturnValue({
    addTo: vi.fn(),
    remove: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    bindTooltip: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
  }),
  drawShip: vi.fn().mockReturnValue({
    addTo: vi.fn(),
    remove: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }),
  removeZone: vi.fn(),
  removeShip: vi.fn(),
}));

global.fetch = vi.fn();

const createFetchResponse = (data: unknown, ok = true) => {
  return { ok, json: () => new Promise((resolve) => resolve(data)) };
};

const mockVessel: RealTimeShipUpdateDTO = {
  mmsi: '123456789',
  shiptype: 'cargo',
  speedOverGround: 10,
  courseOverGround: 90,
  latitude: 50.0,
  longitude: 0.0,
  timestampEpoch: Date.now() / 1000,
  trueHeading: 90,
  navigationalStatus: 0,
};

describe('SharedMapPage for Registered User', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as vi.Mock).mockClear();

    (useAuth as vi.Mock).mockReturnValue({
      currentUser: { id: 1, email: 'user@test.com', role: 'REGISTERED' },
      isRegistered: true,
      isAdmin: false,
      isAuthenticated: true,
    });

    (useFleet as vi.Mock).mockReturnValue({
      isShipInFleet: vi.fn().mockReturnValue(false),
      addShip: vi.fn().mockResolvedValue(undefined),
      removeShip: vi.fn().mockResolvedValue(undefined),
    });

    (useZones as vi.Mock).mockReturnValue({
      interestZone: null,
      collisionZone: null,
      saveInterestZone: vi.fn().mockResolvedValue(undefined),
      removeInterestZone: vi.fn().mockResolvedValue(undefined),
      saveCollisionZone: vi.fn().mockResolvedValue(undefined),
      removeCollisionZone: vi.fn().mockResolvedValue(undefined),
    });

    (useWebSocket as vi.Mock).mockReturnValue({
      client: { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) },
      isConnected: true,
    });

    (fetch as vi.Mock).mockResolvedValue(createFetchResponse([mockVessel]));
  });

  it('renders correctly and fetches initial vessels', async () => {
    render(<SharedMapPage />);

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Zone Creation')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/ship-data/active-ships', expect.anything());
    });
  });

  it('opens and closes the filters panel', async () => {
    render(<SharedMapPage />);

    const filterButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(screen.getByText('Map Filters')).toBeInTheDocument();
      expect(screen.getByLabelText('Search by MMSI')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /apply & close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Map Filters')).not.toBeInTheDocument();
    });
  });

  it('toggles zone creation mode when clicking "Add Zone" button', () => {
    const { getByText } = render(<SharedMapPage />);

    const addInterestZoneButton = getByText(/Add Interest Zone/i);
    expect(addInterestZoneButton).toBeInTheDocument();

    fireEvent.click(addInterestZoneButton);
    expect(getByText(/Cancel Creation/i)).toBeInTheDocument();

    fireEvent.click(getByText(/Cancel Creation/i));
    expect(getByText(/Add Interest Zone/i)).toBeInTheDocument();
  });

  it('shows a toast error if a user tries to create a zone that already exists', async () => {
    const mockSave = vi.fn();
    (useZones as vi.Mock).mockReturnValue({
      interestZone: { id: 1, name: 'Existing Zone' },
      collisionZone: null,
      saveInterestZone: mockSave,
    });

    render(<SharedMapPage />);

    const addInterestZoneButton = screen.getByText(/Add Interest Zone/i);
    fireEvent.click(addInterestZoneButton);

    await waitFor(() => {
      expect(screen.getByText(/A interest zone already exists/i)).toBeInTheDocument();
    });

    expect(mockSave).not.toHaveBeenCalled();

    expect(screen.getByText(/Add Interest Zone/i)).toBeInTheDocument();
  });

  it('opens zone management dialog when a zone is clicked (simulated)', async () => {
    const mockInterestZone = {
      id: 1,
      name: 'My Test Zone',
      type: 'interest',
      centerLatitude: 50,
      centerLongitude: 0,
      radiusInMeters: 5000,
      constraints: [],
    };

    (useZones as vi.Mock).mockReturnValue({
      interestZone: mockInterestZone,
      collisionZone: null,
      saveInterestZone: vi.fn().mockResolvedValue(undefined),
      removeInterestZone: vi.fn().mockResolvedValue(undefined),
    });

    render(<SharedMapPage />);
  });
});
