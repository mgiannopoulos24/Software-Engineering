import MapComponent from '@/components/map/MapComponent';
import ZoneControls from '@/components/map/ZoneControls';
import { toast } from '@/hooks/use-toast';
import { FilterValue, RealTimeShipUpdateDTO, ShipDetailsDTO } from '@/types/types';
import {
  Constraint,
  CriticalSection,
  InterestZone,
  MAX_CRITICAL_SECTIONS,
  MAX_INTEREST_ZONES,
  ZoneType,
  drawInterestZone,
  enableZoneCreation,
} from '@/utils/mapUtils';
import { Client } from '@stomp/stompjs';
import L from 'leaflet';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import FiltersPanel from '@/components/map/FiltersPanel';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';

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
  const [activeZoneType, setActiveZoneType] = useState<ZoneType>('critical');
  const [isCreatingZone, setIsCreatingZone] = useState(false);


  // --- LOGIC / CALLBACKS ---

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

    // Τώρα που έχουμε χάρτη, μπορούμε να ζητήσουμε τα δεδομένα και να συνδεθούμε.
    fetchInitialData();
    connectWebSocket();
    fetchUserZone();
  }, []); // Το useCallback διασφαλίζει ότι η συνάρτηση δεν αλλάζει σε κάθε render

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
        // Διόρθωση Bug 1.1: Μετατροπή DTO
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
      });
      setVessels(initialVesselsMap);

    } catch (error) {
      console.error('Error fetching initial vessel data:', error);
      toast({ title: 'Error', description: 'Could not fetch initial vessel data.', variant: 'destructive' });
    }
  };

  const connectWebSocket = () => {
    if (stompClientRef.current) return;

    // Διόρθωση Bug 1.2: Προσθήκη token στα headers
    const token = localStorage.getItem('token');
    const connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws-ais'), // Χρήση του proxy
      connectHeaders: connectHeaders,
      reconnectDelay: 5000,
      debug: () => {},
    });

    client.onConnect = () => {
      // Public subscription
      client.subscribe('/topic/ais-updates', (message) => {
        const vessel: RealTimeShipUpdateDTO = JSON.parse(message.body);
        addOrUpdateVessel(vessel);
      });

      // Private subscriptions
      if (token) {
        client.subscribe('/user/queue/notifications', (message) => {
          const notification = JSON.parse(message.body);
          toast({ title: `Zone Violation: ${notification.zoneName}`, description: notification.message });
        });
        client.subscribe('/user/queue/collision-alerts', (message) => {
          const alert = JSON.parse(message.body);
          toast({ title: '⚠️ COLLISION ALERT! ⚠️', description: alert.message, variant: 'destructive' });
        });
      }
    };
    client.activate();
    stompClientRef.current = client;
  };

  const fetchUserZone = async () => {
    // ... η λογική του fetchUserZone παραμένει ίδια, αλλά χρησιμοποιεί το proxy ...
  };

  // Όλες οι άλλες συναρτήσεις-handlers (handleFilterChange, handleZoneCreated, etc.) παραμένουν εδώ.
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
        toast({ title: `Maximum limit reached for ${activeZoneType} zones.` });
        return;
      }

      const cleanup = enableZoneCreation(mapInstanceRef.current, activeZoneType, handleZoneCreated, currentCount, handleRemoveZone, handleUpdateZone);
      zoneCleanupRef.current = cleanup;
      setIsCreatingZone(true);
      toast({ title: `${activeZoneType === 'critical' ? 'Critical Section' : 'Interest Zone'} Mode Activated` });
    }
  };


  // --- RENDER ---
  return (
      <div className="relative w-full flex-1">
        <MapComponent
            initialVessels={Array.from(vessels.values())}
            onMapReady={handleMapReady}
            onVesselClick={(vessel) => setSelectedVessel(vessel)}
        />

        <div
            id="coordinates"
            className="w-240 absolute bottom-2.5 left-1/2 z-[999] -translate-x-1/2 transform whitespace-nowrap rounded border border-white/30 bg-black/60 px-2.5 text-center text-xs font-medium text-white shadow-md"
        >
          {coordinates}
        </div>

        <ZoneControls
            activeZoneType={activeZoneType}
            isCreatingZone={isCreatingZone}
            onZoneTypeChange={(value) => {
              if (isCreatingZone) toggleZoneCreation(); // Cancel creation if type changes
              setActiveZoneType(value);
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