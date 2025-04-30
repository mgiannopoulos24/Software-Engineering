import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import Index from '@/pages/Index';
import L from 'leaflet';

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
      (handlers[event] || []).forEach(cb => cb(data));
    },
  };
  const leaflet = {
    map: vi.fn(() => mapMock),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn(),
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
  });

  it('renders navbar and map container', () => {
    render(<Index />);
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByText(/Hover over the map/)).toBeInTheDocument();
    expect(screen.getByText(/Hover over the map to display coordinates/)).toBeInTheDocument();
  });

  it('shows coordinates on mousemove and resets on mouseout', async () => {
    render(<Index />);
    // Simulate Leaflet map events
    const mapInstance = ((L.map as unknown) as Mock).mock.results[0].value;
    // Simulate mousemove
    mapInstance.fire('mousemove', { latlng: { lat: 12.345678, lng: 98.765432 } });
    expect(await screen.findByText('Latitude: 12.345678, Longitude: 98.765432')).toBeInTheDocument();
    // Simulate mouseout
    mapInstance.fire('mouseout');
    expect(await screen.findByText(/Hover over the map to display coordinates/)).toBeInTheDocument();
  });

  it('cleans up map instance on unmount', () => {
    const { unmount } = render(<Index />);
    const mapInstance = ((L.map as unknown) as Mock).mock.results[0].value;
    unmount();
    expect(mapInstance.remove).toHaveBeenCalled();
  });
});