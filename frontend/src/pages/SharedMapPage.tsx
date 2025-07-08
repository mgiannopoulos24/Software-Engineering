// src/pages/SharedMapPage.tsx

import MapComponent, { MapComponentRef } from '@/components/map/MapComponent';
import FiltersPanel, { FilterState } from '@/components/map/FiltersPanel';
import ZoneControls from '@/components/map/ZoneControls';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFleet } from '@/contexts/FleetContext';
import { RealTimeShipUpdateDTO, ShipDetailsDTO, TrackPointDTO } from '@/types/types';
import {
    enableZoneCreation,
    ZoneType,
} from '@/utils/mapUtils';
import { Client } from '@stomp/stompjs';
import L from 'leaflet';
import { Settings2, History } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { toast } from 'sonner';

const SharedMapPage: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const { currentUser, isRegistered, isAdmin } = useAuth();
    const { isShipInFleet, addShip, removeShip, updateShipInFleet } = useFleet();
    const isAuthenticated = !!currentUser;

    // Refs
    const mapInstanceRef = useRef<L.Map | null>(null);
    const stompClientRef = useRef<Client | null>(null);
    const zoneCleanupRef = useRef<(() => void) | null>(null);
    const mapComponentRef = useRef<MapComponentRef>(null);
    const currentTrackMmsiRef = useRef<string | null>(null);

    // State
    const [allVessels, setAllVessels] = useState<Map<string, RealTimeShipUpdateDTO>>(new Map());
    const [filteredVessels, setFilteredVessels] = useState<RealTimeShipUpdateDTO[]>([]);
    const [coordinates, setCoordinates] = useState('Hover over the map');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [selectedVessel, setSelectedVessel] = useState<RealTimeShipUpdateDTO | null>(null);
    const initialFilters: FilterState = { vesselType: [], vesselStatus: [] };
    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [isCreatingZone, setIsCreatingZone] = useState(false);
    const [activeZoneType, setActiveZoneType] = useState<ZoneType>('interest');
    
    // State για την πορεία
    const [shipTrack, setShipTrack] = useState<TrackPointDTO[]>([]);
    const [currentTrackMmsi, setCurrentTrackMmsi] = useState<string | null>(null);
    const [isTrackLoading, setIsTrackLoading] = useState(false);
    const [zoomRequest, setZoomRequest] = useState<number>(0);

    // --- CORE LOGIC (Callbacks & Effects) ---
    useEffect(() => {
        currentTrackMmsiRef.current = currentTrackMmsi;
    }, [currentTrackMmsi]);

    const handleShowTrackRequest = useCallback(async (mmsi: string, silent = false) => {
        if (!silent) setIsTrackLoading(true);
        setCurrentTrackMmsi(mmsi);
        setShipTrack([]);

        try {
            const response = await fetch(`/api/ship-data/track/${mmsi}`);
            if (!response.ok) throw new Error(`Failed to fetch track for MMSI ${mmsi}`);

            const data: TrackPointDTO[] = await response.json();
            setShipTrack(data);

            if (data.length === 0 && !silent) {
                toast.info("No track data found for the last 12 hours.");
            }

            if (!silent && data.length > 0) {
                setZoomRequest(prev => prev + 1);
            }

        } catch (error) {
            console.error(error);
            if (!silent) toast.error("Could not load ship track.");
            setCurrentTrackMmsi(null);
        } finally {
            if (!silent) setIsTrackLoading(false);
        }
    }, []);

    const addOrUpdateVessel = useCallback((vessel: RealTimeShipUpdateDTO) => {
        setAllVessels(prevMap => new Map(prevMap).set(vessel.mmsi, vessel));
        setSelectedVessel(prevSelected =>
            (prevSelected && prevSelected.mmsi === vessel.mmsi) ? vessel : prevSelected
        );
        if (vessel.mmsi && vessel.mmsi === currentTrackMmsiRef.current) {
            void handleShowTrackRequest(vessel.mmsi, true);
        }
    }, [handleShowTrackRequest]);

    useEffect(() => {
        if (zoomRequest > 0) {
            mapComponentRef.current?.zoomToTrack();
        }
    }, [zoomRequest]);

    useEffect(() => {
        const vesselsArray = Array.from(allVessels.values());
        const newFilteredVessels = vesselsArray.filter(vessel => {
            const typeMatch = filters.vesselType.length === 0 || filters.vesselType.includes(vessel.shiptype);
            const statusMatch = filters.vesselStatus.length === 0 || filters.vesselStatus.includes(vessel.navigationalStatus?.toString() ?? '-1');
            return typeMatch && statusMatch;
        });
        setFilteredVessels(newFilteredVessels);
    }, [allVessels, filters]);

    useEffect(() => {
        console.log('Attempting to connect WebSocket. Authenticated:', isAuthenticated);
        const token = localStorage.getItem('token');
        const connectHeaders = isAuthenticated && token ? { Authorization: `Bearer ${token}` } : {};

        const client = new Client({
            webSocketFactory: () => new SockJS('/ws-ais'),
            connectHeaders: connectHeaders,
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            debug: (str) => console.log('STOMP DEBUG:', str),
        });

        client.onConnect = () => {
            console.log('✅ WebSocket Connected!');
            client.subscribe('/topic/ais-updates', (message) => {
                const vessel: RealTimeShipUpdateDTO = JSON.parse(message.body);
                addOrUpdateVessel(vessel);
            });

            if (isAuthenticated) {
                console.log('User is authenticated, subscribing to private queues...');
                client.subscribe('/user/queue/fleet-updates', (message) => {
                    const vesselUpdate: RealTimeShipUpdateDTO = JSON.parse(message.body);
                    updateShipInFleet(vesselUpdate);
                });
                client.subscribe('/user/queue/notifications', (message) => {
                    const notification = JSON.parse(message.body);
                    toast.info(`Zone Violation: ${notification.zoneName}`, { description: notification.message });
                });
                client.subscribe('/user/queue/collision-alerts', (message) => {
                    const alert = JSON.parse(message.body);
                    toast.error('⚠️ COLLISION ALERT! ⚠️', { description: alert.message, duration: 10000 });
                });
            }
        };

        client.onStompError = (frame) => console.error('STOMP Error:', frame);
        client.onWebSocketError = (event) => console.error('WebSocket Error:', event);
        client.onWebSocketClose = () => console.log('WebSocket connection closed!');

        client.activate();
        stompClientRef.current = client;

        return () => {
            console.log('Deactivating WebSocket client...');
            stompClientRef.current?.deactivate();
        };
    }, [isAuthenticated, addOrUpdateVessel, updateShipInFleet]);

    const fetchInitialData = useCallback(async () => {
        try {
            const response = await fetch('/api/ship-data/active-ships');
            if (!response.ok) throw new Error('Failed to fetch initial ship data');

            const vesselsDetails: ShipDetailsDTO[] = await response.json();
            const initialVesselMap = new Map<string, RealTimeShipUpdateDTO>();

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
                    initialVesselMap.set(vesselUpdate.mmsi, vesselUpdate);
                }
            });
            setAllVessels(initialVesselMap);
            console.log(`Loaded ${initialVesselMap.size} initial vessels.`);
        } catch (error) {
            console.error('Error fetching initial vessel data:', error);
            toast.error('Could not fetch initial vessel data.');
        }
    }, []);

    const handleMapReady = useCallback((map: L.Map) => {
        mapInstanceRef.current = map;
        map.on('mousemove', (e) => setCoordinates(`Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`));
        map.on('mouseout', () => setCoordinates('Hover over the map'));
        void fetchInitialData();
    }, [fetchInitialData]);

    const handleHideTrackRequest = () => {
        setShipTrack([]);
        setCurrentTrackMmsi(null);
    };

    const handleVesselClick = (vessel: RealTimeShipUpdateDTO | null) => {
        setSelectedVessel(vessel);
    };

    const handleToggleZoneCreation = () => {
        if (!mapInstanceRef.current || !isAuthenticated) return;

        if (isCreatingZone) {
            if (zoneCleanupRef.current) zoneCleanupRef.current();
            zoneCleanupRef.current = null;
            setIsCreatingZone(false);
        } else {
            setIsCreatingZone(true);
        }
    };

    const handleMultiSelectChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => {
            const currentValues = prev[key];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [key]: newValues };
        });
    };

    return (
        <div className="relative flex w-full flex-1">
            <MapComponent
                ref={mapComponentRef}
                vessels={filteredVessels}
                selectedVessel={selectedVessel}
                onMapReady={handleMapReady}
                onVesselClick={handleVesselClick}
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

            <div id="coordinates" className="absolute bottom-2.5 left-1/2 z-[999] -translate-x-1/2 rounded-md bg-slate-800 bg-opacity-70 px-3 py-1 text-xs text-white shadow-lg">
                {coordinates}
            </div>

            {(isAdmin || isRegistered) && (
                <ZoneControls
                    activeZoneType={activeZoneType}
                    isCreatingZone={isCreatingZone}
                    onZoneTypeChange={(value) => {
                        if (isCreatingZone) handleToggleZoneCreation();
                        setActiveZoneType(value as ZoneType);
                    }}
                    onToggleCreation={handleToggleZoneCreation}
                />
            )}

            {shipTrack.length > 0 && (
                <div className="absolute bottom-4 right-4 z-[999]">
                    <Button onClick={handleHideTrackRequest} variant="destructive" className="flex items-center space-x-2 shadow-lg">
                        <History size={18} />
                        <span>Clear Track</span>
                    </Button>
                </div>
            )}

            <div className="absolute bottom-4 left-4 z-[999]">
                <Button onClick={() => setIsFiltersOpen(true)} className="flex items-center space-x-2 shadow-lg">
                    <span>Filters</span>
                    <Settings2 size={18} />
                </Button>
            </div>

            <FiltersPanel
                isOpen={isFiltersOpen}
                filters={filters}
                onMultiSelectChange={handleMultiSelectChange}
                onReset={() => setFilters(initialFilters)}
                onClose={() => setIsFiltersOpen(false)}
            />
        </div>
    );
};

export default SharedMapPage;