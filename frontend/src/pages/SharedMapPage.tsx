import { ZoneManagementDialog } from '@/components/map/ZoneManagementDialog';
import MapComponent, { MapComponentRef } from '@/components/map/MapComponent';
import FiltersPanel, { FilterState } from '@/components/map/FiltersPanel';
import ZoneControls from '@/components/map/ZoneControls';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFleet } from '@/contexts/FleetContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useZones } from '@/contexts/ZoneContext';
import {
    RealTimeShipUpdateDTO,
    ShipDetailsDTO,
    TrackPointDTO,
    ZoneOfInterestDTO,
    CollisionZoneDTO,
    ZoneDataWithType,
    CollisionNotificationDTO,
    ZoneViolationNotificationDTO // <-- ΝΕΑ ΕΙΣΑΓΩΓΗ
} from '@/types/types';
import { drawZone } from '@/utils/mapUtils';
import { Client } from '@stomp/stompjs';
import L from 'leaflet';
import { Settings2, History } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { toast } from 'sonner';

type ZoneType = 'interest' | 'collision';

const SharedMapPage: React.FC = () => {
    // --- CONTEXTS & AUTH ---
    const { currentUser, isRegistered, isAdmin } = useAuth();
    const { isShipInFleet, addShip, removeShip } = useFleet();
    const {
        interestZone, collisionZone,
        saveInterestZone, removeInterestZone,
        saveCollisionZone, removeCollisionZone
    } = useZones();
    const { addNotification } = useNotifications();
    const isAuthenticated = !!currentUser;

    // --- REFS ---
    const mapInstanceRef = useRef<L.Map | null>(null);
    const stompClientRef = useRef<Client | null>(null);
    const mapComponentRef = useRef<MapComponentRef>(null);
    const interestZoneLayerRef = useRef<L.Circle | null>(null);
    const collisionZoneLayerRef = useRef<L.Circle | null>(null);
    const mapClickHandlerRef = useRef<L.LeafletMouseEventHandlerFn | null>(null);

    // --- STATE ---
    const [allVessels, setAllVessels] = useState<Map<string, RealTimeShipUpdateDTO>>(new Map());
    const [filteredVessels, setFilteredVessels] = useState<RealTimeShipUpdateDTO[]>([]);
    const [coordinates, setCoordinates] = useState('Hover over the map');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [selectedVessel, setSelectedVessel] = useState<RealTimeShipUpdateDTO | null>(null);
    const [filters, setFilters] = useState<FilterState>({ vesselType: [], vesselStatus: [] });
    const [isCreatingZone, setIsCreatingZone] = useState(false);
    const [activeZoneType, setActiveZoneType] = useState<ZoneType>('interest');
    const [shipTrack, setShipTrack] = useState<TrackPointDTO[]>([]);
    const [currentTrackMmsi, setCurrentTrackMmsi] = useState<string | null>(null);
    const [isTrackLoading, setIsTrackLoading] = useState(false);
    
    // State for the Zone Management Dialog
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
    const [managedZone, setManagedZone] = useState<ZoneDataWithType | null>(null);

    const [searchParams, setSearchParams] = useSearchParams();

    // --- STABILIZED CALLBACK FOR ZONE CLICKS ---
    const handleZoneClick = useCallback((zone: ZoneDataWithType) => {
        setManagedZone(zone);
        setIsZoneModalOpen(true);
    }, []);

    // --- EFFECT FOR DRAWING ZONES ON MAP ---
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (interestZoneLayerRef.current) map.removeLayer(interestZoneLayerRef.current);
        if (interestZone) {
            interestZoneLayerRef.current = drawZone(map, { ...interestZone, type: 'interest' }, handleZoneClick);
        }

        if (collisionZoneLayerRef.current) map.removeLayer(collisionZoneLayerRef.current);
        if (collisionZone) {
            collisionZoneLayerRef.current = drawZone(map, { ...collisionZone, type: 'collision' }, handleZoneClick);
        }
    }, [interestZone, collisionZone, handleZoneClick]);
    
    // --- DIALOG HANDLERS ---
    const handleSaveManagedZone = async (data: ZoneDataWithType) => {
        const promise = data.type === 'interest'
            ? saveInterestZone(data as ZoneOfInterestDTO)
            : saveCollisionZone(data as CollisionZoneDTO);
        
        toast.promise(promise, {
            loading: 'Saving zone...',
            success: `Zone "${data.name}" saved successfully!`,
            error: (err: Error) => err.message || `Failed to save zone "${data.name}".`,
        });
    };
    
    const handleDeleteManagedZone = async () => {
        if (!managedZone) return;
        const promise = managedZone.type === 'interest'
            ? removeInterestZone()
            : removeCollisionZone();
        
        toast.promise(promise, {
            loading: `Deleting "${managedZone.name}"...`,
            success: 'Zone deleted successfully!',
            error: (err: Error) => err.message || 'Failed to delete zone.',
        });
    };

    // --- DATA & WEBSOCKETS ---
    const addOrUpdateVessel = useCallback((vesselUpdate: RealTimeShipUpdateDTO) => {
        setAllVessels(prevMap => new Map(prevMap).set(vesselUpdate.mmsi, vesselUpdate));
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const connectHeaders = isAuthenticated && token ? { Authorization: `Bearer ${token}` } : {};
        const client = new Client({
            webSocketFactory: () => new SockJS('/ws-ais'),
            connectHeaders, reconnectDelay: 5000, heartbeatIncoming: 10000, heartbeatOutgoing: 10000,
        });
        client.onConnect = () => {
            client.subscribe('/topic/ais-updates', (message) => addOrUpdateVessel(JSON.parse(message.body)));
            if (isAuthenticated) {

                // --- ZONE VIOLATION SUBSCRIPTION (ΕΝΗΜΕΡΩΜΕΝΟ) ---
                client.subscribe('/user/queue/notifications', (message) => {
                    // 1. Διαβάζουμε το μήνυμα με τον σωστό τύπο
                    const violation: ZoneViolationNotificationDTO = JSON.parse(message.body);
                    
                    // 2. Ο τίτλος της ειδοποίησης είναι πλέον πιο συγκεκριμένος
                    const title = `Violation in "${violation.zoneName}"`;

                    // 3. Η περιγραφή έρχεται έτοιμη από το backend
                    const description = violation.message;

                    // 4. Εμφανίζουμε το toast και προσθέτουμε την ειδοποίηση στο context
                    toast.info(title, { description: description, duration: 8000 });
                    addNotification({ type: 'violation', title: title, description: description });
                });

                // --- COLLISION ALERT SUBSCRIPTION (ΕΝΗΜΕΡΩΜΕΝΟ) ---
                client.subscribe('/user/queue/collision-alerts', (message) => {
                    const alert: CollisionNotificationDTO = JSON.parse(message.body);
                    const title = `⚠️ Collision Alert in "${alert.zoneName}"`;
                    const description = alert.message; // Η περιγραφή έρχεται έτοιμη από το backend
                    toast.error(title, { description: description, duration: 15000 });
                    addNotification({ type: 'collision', title: title, description: description });
                });
            }
        };
        client.activate();
        stompClientRef.current = client;
        return () => { stompClientRef.current?.deactivate(); };
    }, [isAuthenticated, addOrUpdateVessel, addNotification]);

    useEffect(() => {
        const vesselsArray = Array.from(allVessels.values());
        setFilteredVessels(vesselsArray.filter(vessel =>
            (filters.vesselType.length === 0 || filters.vesselType.includes(vessel.shiptype)) &&
            (filters.vesselStatus.length === 0 || filters.vesselStatus.includes(vessel.navigationalStatus?.toString() ?? '-1'))
        ));
    }, [allVessels, filters]);
    
    const handleShowTrackRequest = useCallback(async (mmsi: string) => {
        setIsTrackLoading(true);
        setCurrentTrackMmsi(mmsi);
        setShipTrack([]);
        try {
            const response = await fetch(`/api/ship-data/track/${mmsi}`);
            if (!response.ok) throw new Error(`Failed to fetch track for MMSI ${mmsi}`);
            const data: TrackPointDTO[] = await response.json();
            setShipTrack(data);
            if (data.length <= 0) {
              toast.info("No track data found for the last 12 hours.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Could not load ship track.");
            setCurrentTrackMmsi(null);
        } finally {
            setIsTrackLoading(false);
        }
    }, []);
    
    const handleHideTrackRequest = () => {
        setShipTrack([]);
        setCurrentTrackMmsi(null);
    };

    // --- MAP AND ZONE CREATION ---
    const fetchInitialData = useCallback(async () => {
        try {
            const response = await fetch('/api/ship-data/active-ships');
            if (!response.ok) throw new Error('Failed to fetch initial ship data');
            const vesselsDetails: ShipDetailsDTO[] = await response.json();
            const initialVesselMap = new Map<string, RealTimeShipUpdateDTO>();
            vesselsDetails.forEach(detail => {
                if (detail.mmsi && detail.latitude && detail.longitude) {
                    initialVesselMap.set(detail.mmsi.toString(), {
                        mmsi: detail.mmsi.toString(), shiptype: detail.shiptype || 'unknown',
                        navigationalStatus: detail.navigationalStatus, speedOverGround: detail.speedOverGround ?? 0,
                        courseOverGround: detail.courseOverGround ?? 0, trueHeading: detail.trueHeading ?? 511,
                        longitude: detail.longitude ?? 0, latitude: detail.latitude ?? 0,
                        timestampEpoch: detail.lastUpdateTimestampEpoch ?? 0,
                    });
                }
            });
            setAllVessels(initialVesselMap);
        } catch (error) {
            toast.error('Could not fetch initial vessel data.');
        }
    }, []);
    
    const handleMapReady = useCallback((map: L.Map) => {
        mapInstanceRef.current = map;
        map.on('mousemove', (e) => setCoordinates(`Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`));
        map.on('mouseout', () => setCoordinates('Hover over the map'));
        void fetchInitialData();
    }, [fetchInitialData]);

    const handleMapClickForZoneCreation = useCallback(async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const newZoneData = { 
            name: `My New ${activeZoneType === 'interest' ? 'Interest' : 'Collision'} Zone`, 
            centerLatitude: lat, 
            centerLongitude: lng, 
            radiusInMeters: 10000 
        };
        const promise = activeZoneType === 'interest'
            ? saveInterestZone({ ...newZoneData, constraints: [] })
            : saveCollisionZone(newZoneData);
        
        toast.promise(promise, {
            loading: 'Creating new zone...',
            success: 'New zone created!',
            error: (err: Error) => err.message || 'Failed to create zone.',
        });
        
        setIsCreatingZone(false);
        if (mapInstanceRef.current) mapInstanceRef.current.getContainer().style.cursor = '';
        if (mapClickHandlerRef.current) mapInstanceRef.current?.off('click', mapClickHandlerRef.current);
        mapClickHandlerRef.current = null;
    }, [activeZoneType, saveInterestZone, saveCollisionZone]);

    const handleToggleZoneCreation = () => {
        const map = mapInstanceRef.current;
        if (!map) return;
        
        const willBeCreating = !isCreatingZone;
        setIsCreatingZone(willBeCreating);
        
        if (willBeCreating) {
            if ((activeZoneType === 'interest' && interestZone) || (activeZoneType === 'collision' && collisionZone)) {
                toast.error(`A ${activeZoneType} zone already exists.`, { description: "You can only have one of each. Delete the existing one to create a new one." });
                setIsCreatingZone(false);
                return;
            }
            map.getContainer().style.cursor = 'crosshair';
            mapClickHandlerRef.current = (e) => handleMapClickForZoneCreation(e);
            map.on('click', mapClickHandlerRef.current);
        } else {
            map.getContainer().style.cursor = '';
            if (mapClickHandlerRef.current) {
                map.off('click', mapClickHandlerRef.current);
            }
            mapClickHandlerRef.current = null;
        }
    };

    // --- RENDER ---
    return (
        <div className="relative flex w-full flex-1">
            <MapComponent
                ref={mapComponentRef}
                vessels={filteredVessels}
                selectedVessel={selectedVessel}
                onMapReady={handleMapReady}
                onVesselClick={setSelectedVessel}
                trackData={shipTrack}
                currentTrackMmsi={currentTrackMmsi}
                onShowTrackRequest={handleShowTrackRequest}
                onHideTrackRequest={handleHideTrackRequest}
                isTrackLoading={isTrackLoading}
                isShipInFleet={isShipInFleet}
                onAddToFleet={addShip}
                onRemoveFromFleet={removeShip}
                isAuthenticated={isAuthenticated}
            />
            
            <div id="coordinates" className="absolute bottom-2.5 left-1/2 z-[20] -translate-x-1/2 rounded-md bg-slate-800 bg-opacity-70 px-3 py-1 text-xs text-white shadow-lg">
                {coordinates}
            </div>

            {(isRegistered || isAdmin) && (
                <ZoneControls
                    activeZoneType={activeZoneType}
                    isCreatingZone={isCreatingZone}
                    onZoneTypeChange={(value) => { if (isCreatingZone) handleToggleZoneCreation(); setActiveZoneType(value as ZoneType); }}
                    onToggleCreation={handleToggleZoneCreation}
                />
            )}
            
            {shipTrack.length > 0 && (
                <div className="absolute bottom-4 right-4 z-[19]">
                    <Button onClick={handleHideTrackRequest} variant="destructive" className="flex items-center space-x-2 shadow-lg">
                        <History size={18} /><span>Clear Track</span>
                    </Button>
                </div>
            )}

            <div className="absolute bottom-4 left-4 z-[19]">
                <Button onClick={() => setIsFiltersOpen(o => !o)} className="flex items-center space-x-2 shadow-lg">
                    <span>Filters</span><Settings2 size={18} />
                </Button>
            </div>

            <FiltersPanel
                isOpen={isFiltersOpen}
                filters={filters}
                onMultiSelectChange={(key, value) => setFilters(prev => ({ ...prev, [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value] }))}
                onReset={() => setFilters({ vesselType: [], vesselStatus: [] })}
                onClose={() => setIsFiltersOpen(false)}
            />
            
            {managedZone && (
                 <ZoneManagementDialog 
                    isOpen={isZoneModalOpen}
                    onClose={() => {
                        setIsZoneModalOpen(false);
                        setManagedZone(null);
                    }}
                    zone={managedZone}
                    onSave={handleSaveManagedZone}
                    onDelete={handleDeleteManagedZone}
                />
            )}
        </div>
    );
};

export default SharedMapPage;