import Index from '@/pages/Index';
import { render, screen } from '@testing-library/react';
import L from 'leaflet';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock IndexNavbar
vi.mock('@/components/layout/IndexNavbar', () => ({
  IndexNavbar: () => <nav data-testid="navbar" />,
}));

// Mock leaflet
vi.mock('leaflet', () => {
  const handlers: Record<string, Array<(...args: unknown[]) => void>> = {};
  const mapMock = {
    setView: vi.fn().mockReturnThis(),
    on: vi.fn(function (event: string, cb: (...args: unknown[]) => void) {
      handlers[event] = handlers[event] || [];
      handlers[event].push(cb);
      return this;
    }),
    invalidateSize: vi.fn(),
    remove: vi.fn(),
    _handlers: handlers,
    fire: (event: string, data?: unknown) => {
      (handlers[event] || []).forEach((cb) => cb(data));
    },
  };
  const leaflet = {
    map: vi.fn(() => mapMock),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn(),
    })),
    // Add mocks for L.latLng and L.latLngBounds
    latLng: vi.fn((lat, lng) => ({ lat, lng })), // Simple mock returning an object
    latLngBounds: vi.fn((corner1, corner2) => ({
      // Simple mock
      corner1,
      corner2,
    })),
  };

  return {
    ...leaflet,
    default: leaflet,
  };
});

describe('Index Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset map instance mock results if needed
    (L.map as unknown as Mock).mockClear();
    (L.tileLayer as unknown as Mock).mockClear();
    (L.latLng as unknown as Mock).mockClear();
    (L.latLngBounds as unknown as Mock).mockClear();
  });

  it('renders navbar and map container', () => {
    render(<Index />);
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByText(/Hover over the map/)).toBeInTheDocument();
    expect(screen.getByText(/Hover over the map to display coordinates/)).toBeInTheDocument();
    // Check if L.map was called
    expect(L.map).toHaveBeenCalled();
    // Check if L.tileLayer was called
    expect(L.tileLayer).toHaveBeenCalled();
  });

  it('initializes map with correct options', () => {
    render(<Index />);
    expect(L.map).toHaveBeenCalledWith(
      expect.any(HTMLDivElement), // The map container ref
      expect.objectContaining({
        // Check for specific options
        // worldCopyJump: true, // Add this if you added it in the component
        maxBounds: expect.anything(), // Check if maxBounds is passed
        maxBoundsViscosity: 1.0,
      })
    );
    // Verify latLng and latLngBounds were called for maxBounds
    expect(L.latLng).toHaveBeenCalledWith(-90, -180);
    expect(L.latLng).toHaveBeenCalledWith(90, 180);
    expect(L.latLngBounds).toHaveBeenCalled();
  });

  it('shows coordinates on mousemove and resets on mouseout', async () => {
    render(<Index />);
    // Ensure map instance is available before firing events
    expect(L.map).toHaveBeenCalled();
    const mapInstance = (L.map as unknown as Mock).mock.results[0].value;

    // Simulate mousemove
    mapInstance.fire('mousemove', { latlng: { lat: 12.345678, lng: 98.765432 } });
    // Use findByText for asynchronous updates
    expect(
      await screen.findByText(/Latitude: 12\.345678, Longitude: 98\.765432/)
    ).toBeInTheDocument();

    // Simulate mouseout
    mapInstance.fire('mouseout');
    expect(
      await screen.findByText(/Hover over the map to display coordinates/)
    ).toBeInTheDocument();
  });

  it('cleans up map instance on unmount', () => {
    const { unmount } = render(<Index />);
    expect(L.map).toHaveBeenCalled(); // Ensure map was created
    const mapInstance = (L.map as unknown as Mock).mock.results[0].value;

    unmount();
    expect(mapInstance.remove).toHaveBeenCalledTimes(1); // Check if remove was called
  });
});
