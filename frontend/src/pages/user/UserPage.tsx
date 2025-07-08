import MapComponent from '@/components/map/MapComponent';
import FiltersPanel from '@/components/map/FiltersPanel';
import ZoneControls from '@/components/map/ZoneControls';
import {Button} from '@/components/ui/button';
import {FilterValue, RealTimeShipUpdateDTO, ShipDetailsDTO} from '@/types/types';
import {
  Constraint,
  CriticalSection,
  enableZoneCreation,
  InterestZone,
  MAX_CRITICAL_SECTIONS,
  MAX_INTEREST_ZONES,
  ZoneType,
} from '@/utils/mapUtils';
import {Client} from '@stomp/stompjs';
import L from 'leaflet';
import {Settings2} from 'lucide-react';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import SockJS from 'sockjs-client';
import {toast} from 'sonner'; // ΑΛΛΑΓΗ: Εισαγωγή από τη sonner

const UserPage: React.FC = () => {
  // --- STATE MANAGEMENT ---
  // Refs για να κρατάμε instances που δεν προκαλούν re-render
  const mapInstanceRef = useRef<L.Map | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const zoneCleanupRef = useRef<(() => void) | null>(null);
  const criticalSectionCirclesRef = useRef<Map<string, L.Circle>>(new Map());
  const interestZoneCirclesRef = useRef<Map<string, L.Circle>>(new Map());

  // State για τα δεδομένα και το UI
  const [vessels, setVessels] = useState<Map<string, RealTimeShipUpdateDTO>>(new Map());
  const [coordinates, setCoordinates] = useState('Hover over the map to display coordinates');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<RealTimeShipUpdateDTO | null>(null);
  const [filters, setFilters] = useState({
    vesselType: 'all',
    capacity: [50],
    vesselStatus: 'all',
  });
  const [criticalSections, setCriticalSections] = useState<CriticalSection[]>([]);
  const [interestZones, setInterestZones] = useState<InterestZone[]>([]);
  const [activeZoneType, setActiveZoneType] = useState<ZoneType>('interest');
  const [isCreatingZone, setIsCreatingZone] = useState(false);

  // --- LOGIC / CALLBACKS ---

  const addOrUpdateVessel = useCallback((vessel: RealTimeShipUpdateDTO) => {
    setVessels(prevVessels => new Map(prevVessels).set(vessel.mmsi, vessel));
  }, []);

  const fetchInitialData = async () => {
    try {
      const response = await fetch('/api/ship-data/active-ships', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch initial ship data');

      const vesselsDetails: ShipDetailsDTO[] = await response.json();

      const initialVesselsMap = new Map<string, RealTimeShipUpdateDTO>();
      vesselsDetails.forEach(detail => {
        if (detail.mmsi && detail.latitude && detail.longitude) {
          const vesselUpdate: RealTimeShipUpdateDTO = {
            mmsi: detail.mmsi.toString(),
            shiptype: detail.shiptype || 'unknown',
            navigationalStatus: detail.navigationalStatus,
            speedOverGround: detail.speedOverGround ?? 0,
            courseOverGround: detail.courseOverGround ?? 0,
            trueHeading: detail.trueHeading ?? 511,
            longitude: detail.longitude ?? 0,
            latitude: detail.latitude ?? 0,
            timestampEpoch: detail.lastUpdateTimestampEpoch ?? 0,
          };
          initialVesselsMap.set(vesselUpdate.mmsi, vesselUpdate);
        }
      });
      setVessels(initialVesselsMap);

    } catch (error) {
      console.error('Error fetching initial vessel data:', error);
      toast.error('Could not fetch initial vessel data.');
    }
  };

  const connectWebSocket = useCallback(() => {
    if (stompClientRef.current?.active) return;

    const token = localStorage.getItem('token');
    const connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws-ais'),
      connectHeaders: connectHeaders,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: 5000,
      debug: (str) => {
          console.log(new Date(), str);
        },
    });

    client.onConnect = () => {
      toast.success('Real-time connection established.');
      // Public subscription
      client.subscribe('/topic/ais-updates', (message) => {
        const vessel: RealTimeShipUpdateDTO = JSON.parse(message.body);
        addOrUpdateVessel(vessel);
      });

      // Private subscriptions
      if (token) {
        client.subscribe('/user/queue/notifications', (message) => {
          const notification = JSON.parse(message.body);
          toast.info(`Zone Violation: ${notification.zoneName}`, {
            description: notification.message,
          });
        });
        client.subscribe('/user/queue/collision-alerts', (message) => {
          const alert = JSON.parse(message.body);
          toast.error('⚠️ COLLISION ALERT! ⚠️', {
            description: alert.message,
            duration: 10000, // Κράτα την ειδοποίηση για 10 δευτ.
          });
        });
      }
    };

    client.onStompError = (frame) => {
      console.error('STOMP Error: Broker reported error: ' + frame.headers['message']);
      toast.error('STOMP Protocol Error', { description: frame.headers['message'] });
    };

    client.onWebSocketClose = () => {
      console.error('WebSocket connection closed!');
      toast.error('Real-time connection lost.', { description: 'Attempting to reconnect...' });
    };

    client.activate();
    stompClientRef.current = client;
  }, [addOrUpdateVessel]);

  // Callback που θα εκτελεστεί από το MapComponent όταν ο χάρτης είναι έτοιμος.
  const handleMapReady = useCallback((map: L.Map) => {
    mapInstanceRef.current = map;

    map.on('mousemove', (e) => {
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      setCoordinates(`Latitude: ${lat}, Longitude: ${lng}`);
    });
    map.on('mouseout', () => {
      setCoordinates('Hover over the map to display coordinates');
    });

    void fetchInitialData();
    connectWebSocket();
    // void fetchUserZone(); // Αν έχεις λογική για φόρτωση ζωνών, θα μπει εδώ.
  }, [connectWebSocket]);

  // Handlers για φίλτρα και ζώνες
  const handleFilterChange = (key: string, value: FilterValue) => { /* ... */ };
  const applyFilters = () => { /* ... */ };
  const resetFilters = () => { /* ... */ };
  const handleZoneCreated = (zone: CriticalSection | InterestZone, circle: L.Circle) => { /* ... */ };
  const handleUpdateZone = (id: string, newRadius: number, newConstraints?: Constraint[], newName?: string) => { /* ... */ };
  const handleRemoveZone = (id: string) => { /* ... */ };

  const toggleZoneCreation = () => {
    if (!mapInstanceRef.current) return;

    if (isCreatingZone) {
      if (zoneCleanupRef.current) zoneCleanupRef.current();
      zoneCleanupRef.current = null;
      setIsCreatingZone(false);
    } else {
      const currentCount = activeZoneType === 'critical' ? criticalSections.length : interestZones.length;
      const maxLimit = activeZoneType === 'critical' ? MAX_CRITICAL_SECTIONS : MAX_INTEREST_ZONES;
      if (currentCount >= maxLimit) {
        toast.warning(`Maximum limit reached for ${activeZoneType} zones.`);
        return;
      }

      zoneCleanupRef.current = enableZoneCreation(mapInstanceRef.current, activeZoneType, handleZoneCreated, currentCount, handleRemoveZone, handleUpdateZone);
      setIsCreatingZone(true);
      toast.info(`${activeZoneType === 'critical' ? 'Critical Section' : 'Interest Zone'} Mode Activated`);
    }
  };

  useEffect(() => {
    // Cleanup WebSocket on component unmount
    return () => {
      stompClientRef.current?.deactivate();
    };
  }, []);

  // --- RENDER ---
  return (
      <div className="relative flex w-full flex-1">
        <MapComponent
            initialVessels={Array.from(vessels.values())}
            onMapReady={handleMapReady}
            onVesselClick={(vessel) => setSelectedVessel(vessel)}
        />

        <div
            id="coordinates"
            className="absolute bottom-2.5 left-1/2 z-[999] -translate-x-1/2 transform whitespace-nowrap rounded border border-white/30 bg-black/60 px-2.5 text-center text-xs font-medium text-white shadow-md"
        >
          {coordinates}
        </div>

        <ZoneControls
            activeZoneType={activeZoneType}
            isCreatingZone={isCreatingZone}
            onZoneTypeChange={(value) => {
              if (isCreatingZone) toggleZoneCreation(); // Cancel creation if type changes
              setActiveZoneType(value as ZoneType);
            }}
            onToggleCreation={toggleZoneCreation}
        />

        <div className="absolute left-4 top-4 z-[999] space-y-2">
          <div className="rounded-md bg-black/80 px-3 py-2 text-sm text-white shadow-lg">
            Critical Sections: {criticalSections.length} / {MAX_CRITICAL_SECTIONS}
          </div>
          <div className="rounded-md bg-black/80 px-3 py-2 text-sm text-white shadow-lg">
            Interest Zones: {interestZones.length} / {MAX_INTEREST_ZONES}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-[999]">
          <Button onClick={() => setIsFiltersOpen(true)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
            <span>Filters</span>
            <Settings2 size={18} />
          </Button>
        </div>

        <FiltersPanel
            isOpen={isFiltersOpen}
            filters={filters}
            selectedVessel={selectedVessel}
            onFilterChange={handleFilterChange}
            onReset={resetFilters}
            onApply={applyFilters}
            onClose={() => setIsFiltersOpen(false)}
        />
      </div>
  );
};

export default UserPage;