// src/pages/SharedMapPage.tsx

import MapComponent, { MapComponentRef } from '@/components/map/MapComponent';
import FiltersPanel from '@/components/map/FiltersPanel';
import ZoneControls from '@/components/map/ZoneControls';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { RealTimeShipUpdateDTO, ShipDetailsDTO } from '@/types/types';
import {
    enableZoneCreation,
    ZoneType,
    // Εδώ θα προσθέσετε αργότερα τα imports για τις ζώνες
} from '@/utils/mapUtils';
import { Client } from '@stomp/stompjs';
import L from 'leaflet';
import { Settings2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { toast } from 'sonner';

const SharedMapPage: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const { currentUser, isRegistered, isAdmin } = useAuth();
    const isAuthenticated = !!currentUser;

    // Refs
    const mapInstanceRef = useRef<L.Map | null>(null);
    const stompClientRef = useRef<Client | null>(null);
    const zoneCleanupRef = useRef<(() => void) | null>(null);
    const mapComponentRef = useRef<MapComponentRef>(null);

    // State
    const [coordinates, setCoordinates] = useState('Hover over the map');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [selectedVessel, setSelectedVessel] = useState<RealTimeShipUpdateDTO | null>(null);
    const [filters, setFilters] = useState({
        vesselType: 'all',
        capacity: [50],
        vesselStatus: 'all',
    });
    const [isCreatingZone, setIsCreatingZone] = useState(false);
    const [activeZoneType, setActiveZoneType] = useState<ZoneType>('interest');
    // TODO: Προσθέστε state για τις λίστες των ζωνών (π.χ. interestZones, collisionZones)

    // --- CORE LOGIC (Callbacks & Effects) ---

    // Το useCallback εδώ εξασφαλίζει ότι η συνάρτηση δεν δημιουργείται εκ νέου σε κάθε render,
    // εκτός αν αλλάξουν οι εξαρτήσεις της. Η χρήση functional update (`setSelectedVessel(prev => ...)`)
    // το καθιστά πιο ασφαλές και αφαιρεί την άμεση εξάρτηση από το `selectedVessel`.
    const addOrUpdateVessel = useCallback((vessel: RealTimeShipUpdateDTO) => {
        mapComponentRef.current?.addOrUpdateVessel(vessel);
        setSelectedVessel(prevSelected =>
            (prevSelected && prevSelected.mmsi === vessel.mmsi) ? vessel : prevSelected
        );
    }, []); // Το dependency array είναι πλέον άδειο.

    // Τρέχει μία φορά όταν το component φορτώνει, και ξανά μόνο αν αλλάξει η κατάσταση αυθεντικοποίησης.
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
                client.subscribe('/user/queue/notifications', (message) => {
                    const notification = JSON.parse(message.body);
                    toast.info(`Zone Violation: ${notification.zoneName}`, { description: notification.message });
                });
                client.subscribe('/user/queue/collision-alerts', (message) => {
                    const alert = JSON.parse(message.body);
                    toast.error('⚠️ COLLISION ALERT! ⚠️', { description: alert.message, duration: 10000 });
                });
                // TODO: Προσθήκη subscription για fleet updates
            }
        };

        client.onStompError = (frame) => {
            console.error('STOMP Error:', frame);
        };

        client.onWebSocketError = (event) => {
            console.error('WebSocket Error:', event);
        };

        client.onWebSocketClose = () => {
            console.log('WebSocket connection closed!');
        };

        client.activate();
        stompClientRef.current = client;

        // REASON FOR CHANGE:
        // Η cleanup function του useEffect είναι το πιο σημαντικό μέρος.
        // Εξασφαλίζει ότι όταν το component φεύγει από την οθόνη (unmount)
        // ή όταν αλλάζει το `isAuthenticated` (προκαλώντας re-run του effect),
        // η παλιά σύνδεση του WebSocket κλείνει ΠΑΝΤΑ σωστά.
        return () => {
            console.log('Deactivating WebSocket client...');
            stompClientRef.current?.deactivate();
        };
    }, [isAuthenticated, addOrUpdateVessel]); // Εξάρτηση από το `isAuthenticated` για να επανασυνδεθεί μετά το login/logout.

    const fetchInitialData = useCallback(async () => {
        try {
            const response = await fetch('/api/ship-data/active-ships');
            if (!response.ok) throw new Error('Failed to fetch initial ship data');

            const vesselsDetails: ShipDetailsDTO[] = await response.json();
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
                    mapComponentRef.current?.addOrUpdateVessel(vesselUpdate);
                }
            });
            console.log(`Loaded ${vesselsDetails.length} initial vessels.`);
        } catch (error) {
            console.error('Error fetching initial vessel data:', error);
            toast.error('Could not fetch initial vessel data.');
        }
    }, []);

    // Η `handleMapReady` είναι τώρα πιο απλή. Ο μόνος της ρόλος είναι να
    // αρχικοποιήσει τον χάρτη και να φορτώσει τα αρχικά δεδομένα.
    // Δεν ασχολείται πλέον με το WebSocket.
    const handleMapReady = useCallback((map: L.Map) => {
        mapInstanceRef.current = map;
        map.on('mousemove', (e) => setCoordinates(`Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`));
        map.on('mouseout', () => setCoordinates('Hover over the map'));

        void fetchInitialData();
    }, [fetchInitialData]);

    const handleToggleZoneCreation = () => {
        if (!mapInstanceRef.current || !isAuthenticated) return;

        if (isCreatingZone) {
            if (zoneCleanupRef.current) zoneCleanupRef.current();
            zoneCleanupRef.current = null;
            setIsCreatingZone(false);
        } else {
            // TODO: Εδώ θα μπει η λογική για έλεγχο ορίου ζωνών και η κλήση του enableZoneCreation
            // const currentCount = ...
            // if (currentCount >= MAX_ZONES) { toast.warning(...); return; }

            // const handleZoneCreated = (...) => { ... }
            // zoneCleanupRef.current = enableZoneCreation(mapInstanceRef.current, activeZoneType, handleZoneCreated, ...);

            setIsCreatingZone(true);
        }
    };

    return (
        <div className="relative flex w-full flex-1">
            <MapComponent
                ref={mapComponentRef}
                selectedVessel={selectedVessel}
                onMapReady={handleMapReady}
                onVesselClick={(vessel) => setSelectedVessel(vessel)}
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

            <div className="absolute bottom-4 left-4 z-[999]">
                <Button onClick={() => setIsFiltersOpen(true)} className="flex items-center space-x-2 shadow-lg">
                    <span>Filters</span>
                    <Settings2 size={18} />
                </Button>
            </div>

            <FiltersPanel
                isOpen={isFiltersOpen}
                filters={filters}
                selectedVessel={selectedVessel}
                onFilterChange={(key, value) => setFilters(prev => ({...prev, [key]: value}))}
                onReset={() => setFilters({ vesselType: 'all', capacity: [50], vesselStatus: 'all' })}
                onApply={() => { /* TODO: Apply filter logic */ }}
                onClose={() => setIsFiltersOpen(false)}
            />
        </div>
    );
};

export default SharedMapPage;