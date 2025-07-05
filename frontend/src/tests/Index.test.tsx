import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import Index from '@/pages/Index';
import { ShipDetailsDTO, RealTimeShipUpdateDTO } from '@/types/types';
import axios from 'axios';
import L from 'leaflet'; 

// --- Mocking External Dependencies ---

// 1. Mock axios
vi.mock('axios');
const mockedAxios = axios as vi.Mocked<typeof axios>;

// 2. Mock the vessel icon utility
vi.mock('@/utils/vesselIcon', () => ({
  getVesselIcon: vi.fn(() => ({})),
}));

// 3. Mock SockJS and StompJS
let mockStompClient: {
  active: boolean;
  onConnect: (frame: any) => void;
  activate: () => void;
  deactivate: () => void;
  subscribe: (destination: string, callback: (msg: any) => void) => void;
  _simulateMessage: (destination: string, payload: any) => void;
  _subscriptions: Record<string, (msg: any) => void>;
};

vi.mock('@stomp/stompjs', () => {
  const Client = vi.fn(() => {
    mockStompClient = {
      active: false,
      onConnect: () => {},
      activate: vi.fn(function (this: typeof mockStompClient) {
        this.active = true;
        setTimeout(() => this.onConnect({}), 0);
      }),
      deactivate: vi.fn(function (this: typeof mockStompClient) {
        this.active = false;
      }),
      subscribe: vi.fn((destination, callback) => {
        mockStompClient._subscriptions[destination] = callback;
      }),
      _subscriptions: {},
      _simulateMessage(destination, payload) {
        if (this._subscriptions[destination]) {
          this._subscriptions[destination]({ body: JSON.stringify(payload) });
        }
      },
    };
    return mockStompClient;
  });
  return { Client };
});

vi.mock('sockjs-client', () => ({ default: vi.fn() }));

const mockMapInstance = {
  setView: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  remove: vi.fn().mockReturnThis(),
  addLayer: vi.fn().mockReturnThis(),
  invalidateSize: vi.fn().mockReturnThis(),
  fitBounds: vi.fn().mockReturnThis(),
  
  options: {},
  _leaflet_id: 'mock_map_id',
  _container: document.createElement('div'),
};

const mockTileLayerInstance = {
  addTo: vi.fn().mockReturnThis(),
};

const mockMarkerInstance = {
  setLatLng: vi.fn().mockReturnThis(),
  setIcon: vi.fn().mockReturnThis(),
  setPopupContent: vi.fn().mockReturnThis(),
  addTo: vi.fn().mockReturnThis(),
  bindPopup: vi.fn().mockReturnThis(),
};

vi.spyOn(L, 'map').mockImplementation(() => mockMapInstance as any);
vi.spyOn(L, 'tileLayer').mockImplementation(() => mockTileLayerInstance as any);
vi.spyOn(L, 'marker').mockImplementation(() => mockMarkerInstance as any);
vi.spyOn(L.control, 'zoom').mockImplementation(() => ({ addTo: vi.fn() }) as any);


// --- The Test Suite ---

describe('Index Page (Anonymous Map View)', () => {
  const mockShipDetails: ShipDetailsDTO[] = [
    { mmsi: 111, shiptype: 'cargo', latitude: 49.1, longitude: 0.1, speedOverGround: 10.0, courseOverGround: 90.0, trueHeading: 90, lastUpdateTimestampEpoch: Date.now() / 1000 },
    { mmsi: 222, shiptype: 'tanker', latitude: 49.2, longitude: 0.2, speedOverGround: 12.0, courseOverGround: 180.0, trueHeading: 180, lastUpdateTimestampEpoch: Date.now() / 1000 },
  ];

  const mockWebSocketUpdate: RealTimeShipUpdateDTO = { mmsi: '333', shiptype: 'passenger', latitude: 49.3, longitude: 0.3, speedOverGround: 20.0, courseOverGround: 270.0, trueHeading: 270, timestampEpoch: Date.now() / 1000 };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: [] });
  });

  it('should render the map container on initial load', () => {
    render(<Index />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('should initialize the Leaflet map', () => {
    render(<Index />);
    expect(L.map).toHaveBeenCalledWith(expect.any(HTMLDivElement), expect.any(Object));
    expect(mockMapInstance.setView).toHaveBeenCalled();
    expect(L.tileLayer).toHaveBeenCalled();
    expect(mockTileLayerInstance.addTo).toHaveBeenCalledWith(mockMapInstance);
  });

  it('should fetch initial active ships and create markers for them', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockShipDetails });
    render(<Index />);
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('https://localhost:8443/api/ship-data/active-ships');
      expect(L.marker).toHaveBeenCalledTimes(2);
      expect(L.marker).toHaveBeenCalledWith([49.1, 0.1], expect.any(Object));
      expect(L.marker).toHaveBeenCalledWith([49.2, 0.2], expect.any(Object));
    });
  });

  it('should establish a WebSocket connection and subscribe to updates', async () => {
    render(<Index />);
    await waitFor(() => {
      expect(mockStompClient.activate).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockStompClient.subscribe).toHaveBeenCalledWith('/topic/ais-updates', expect.any(Function));
    });
  });

  it('should create a new marker when a WebSocket message is received for a new vessel', async () => {
    render(<Index />);
    await waitFor(() => {
      expect(mockStompClient.subscribe).toHaveBeenCalled();
    });
    act(() => {
      mockStompClient._simulateMessage('/topic/ais-updates', mockWebSocketUpdate);
    });
    await waitFor(() => {
      expect(L.marker).toHaveBeenCalledWith([49.3, 0.3], expect.any(Object));
    });
  });

  it('should update an existing marker when a WebSocket message is received for a known vessel', async () => {
    mockedAxios.get.mockResolvedValue({ data: [mockShipDetails[0]] });
    render(<Index />);
    await waitFor(() => {
      expect(L.marker).toHaveBeenCalledTimes(1);
    });
    vi.mocked(L.marker).mockClear(); 

    const updatedVesselData: RealTimeShipUpdateDTO = { ...mockShipDetails[0], mmsi: '111', latitude: 49.15, longitude: 0.15 };

    act(() => {
      mockStompClient._simulateMessage('/topic/ais-updates', updatedVesselData);
    });

    await waitFor(() => {
      expect(L.marker).not.toHaveBeenCalled();
      expect(mockMarkerInstance.setLatLng).toHaveBeenCalledWith([49.15, 0.15]);
    });
  });

  it('should perform cleanup on unmount', async () => {
    const { unmount } = render(<Index />);
    await waitFor(() => {
      expect(mockStompClient.activate).toHaveBeenCalled();
    });
    unmount();
    expect(mockStompClient.deactivate).toHaveBeenCalled();
    expect(mockMapInstance.remove).toHaveBeenCalled();
  });
});