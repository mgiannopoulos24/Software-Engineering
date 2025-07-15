import { useFleet } from '@/contexts/FleetContext';
import SavedVessels from '@/pages/user/SavedVessels';
import { render, screen, waitFor } from '@/tests/test-utils';
import { ShipDetailsDTO } from '@/types/types';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRemoveShip = vi.fn();
const mockIsShipInFleet = vi.fn();
const mockFleetMap = new Map<string, ShipDetailsDTO>();

vi.mock('@/contexts/FleetContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/contexts/FleetContext')>();
  return {
    ...mod,
    useFleet: vi.fn(),
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...mod,
    useNavigate: () => mockNavigate,
  };
});

const mockVessel1: ShipDetailsDTO = {
  mmsi: 123456789,
  shiptype: 'cargo',
  speedOverGround: 10.5,
  courseOverGround: 90.0,
  latitude: 34.1234,
  longitude: -118.5678,
  navigationalStatus: 0,
  trueHeading: 88,
  lastUpdateTimestampEpoch: Date.now() / 1000 - 3600,
};

const mockVessel2: ShipDetailsDTO = {
  mmsi: 987654321,
  shiptype: 'passenger',
  speedOverGround: 18.2,
  courseOverGround: 270.0,
  latitude: 51.2345,
  longitude: 4.5678,
  navigationalStatus: 1,
  trueHeading: 275,
  lastUpdateTimestampEpoch: Date.now() / 1000 - 7200,
};

describe('SavedVessels Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFleetMap.clear();

    (useFleet as vi.Mock).mockReturnValue({
      fleet: mockFleetMap,
      loading: true,
      isShipInFleet: mockIsShipInFleet,
      addShip: vi.fn(),
      removeShip: mockRemoveShip,
    });
  });

  it('should display a loading state initially', () => {
    render(<SavedVessels />);
    expect(screen.getByText('Loading your fleet...')).toBeInTheDocument();
  });

  it('should display "No saved vessels" message when fleet is empty and not loading', async () => {
    (useFleet as vi.Mock).mockReturnValue({
      fleet: new Map(),
      loading: false,
      isShipInFleet: mockIsShipInFleet,
      addShip: vi.fn(),
      removeShip: mockRemoveShip,
    });

    render(<SavedVessels />);

    await waitFor(() => {
      expect(screen.getByText('No saved vessels')).toBeInTheDocument();
      expect(
        screen.getByText('Start by bookmarking vessels from the map view.')
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('Loading your fleet...')).not.toBeInTheDocument();
  });

  it('should display saved vessels when fleet data is available', async () => {
    mockFleetMap.set(mockVessel1.mmsi.toString(), mockVessel1);
    mockFleetMap.set(mockVessel2.mmsi.toString(), mockVessel2);

    (useFleet as vi.Mock).mockReturnValue({
      fleet: mockFleetMap,
      loading: false,
      isShipInFleet: mockIsShipInFleet,
      addShip: vi.fn(),
      removeShip: mockRemoveShip,
    });

    render(<SavedVessels />);

    await waitFor(() => {
      const vessel1Card = screen.getByText(mockVessel1.mmsi.toString()).closest('.flex.flex-col');
      expect(vessel1Card).toBeInTheDocument();

      expect(vessel1Card).toHaveTextContent(/cargo/i);
      expect(vessel1Card).toHaveTextContent(/Speed: 10.5 kn/i);
      expect(vessel1Card).toHaveTextContent(/Lat: 34.1234, Lon: -118.5678/i);
      expect(vessel1Card).toHaveTextContent(/Status: Under way using engine/i);

      const vessel2Card = screen.getByText(mockVessel2.mmsi.toString()).closest('.flex.flex-col');
      expect(vessel2Card).toBeInTheDocument();
      expect(vessel2Card).toHaveTextContent(/passenger/i);
      expect(vessel2Card).toHaveTextContent(/Speed: 18.2 kn/i);
      expect(vessel2Card).toHaveTextContent(/Lat: 51.2345, Lon: 4.5678/i);
      expect(vessel2Card).toHaveTextContent(/Status: At anchor/i);
    });
  });

  it('should call removeShip when "Remove from Fleet" button is clicked', async () => {
    const user = userEvent.setup();
    mockFleetMap.set(mockVessel1.mmsi.toString(), mockVessel1);
    mockRemoveShip.mockResolvedValue(undefined);

    (useFleet as vi.Mock).mockReturnValue({
      fleet: mockFleetMap,
      loading: false, // Not loading
      isShipInFleet: mockIsShipInFleet,
      addShip: vi.fn(),
      removeShip: mockRemoveShip,
    });

    render(<SavedVessels />);

    const vesselCard = screen.getByText(mockVessel1.mmsi.toString()).closest('.flex.flex-col');
    if (!vesselCard) throw new Error('Vessel card not found');
    const removeButton = screen.getByRole('button', {
      name: `Remove from Fleet`,
    });

    await user.click(removeButton);

    expect(mockRemoveShip).toHaveBeenCalledWith(mockVessel1.mmsi);
  });

  it('should call navigate with correct query param when "View on Map" is clicked', async () => {
    const user = userEvent.setup();
    mockFleetMap.set(mockVessel1.mmsi.toString(), mockVessel1);

    (useFleet as vi.Mock).mockReturnValue({
      fleet: mockFleetMap,
      loading: false,
      isShipInFleet: mockIsShipInFleet,
      addShip: vi.fn(),
      removeShip: mockRemoveShip,
    });

    render(<SavedVessels />);

    const viewOnMapButton = await screen.findByRole('button', {
      name: /view on map/i,
    });

    await user.click(viewOnMapButton);

    expect(mockNavigate).toHaveBeenCalledWith(`/user?focus_mmsi=${mockVessel1.mmsi}`);
  });
});
