// src/pages/SharedMapPage.tsx

import MapComponent, { MapComponentRef } from '@/components/map/MapComponent';
import FiltersPanel, { FilterState } from '@/components/map/FiltersPanel';
import ZoneControls from '@/components/map/ZoneControls';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { RealTimeShipUpdateDTO, ShipDetailsDTO, TrackPointDTO } from '@/types/types';
import {
    enableZoneCreation,
    ZoneType,
    // Εδώ θα προσθέσετε αργότερα τα imports για τις ζώνες
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
    const isAuthenticated = !!currentUser;

    // Refs
    const mapInstanceRef = useRef<L.Map | null>(null);
    const stompClientRef = useRef<Client | null>(null);
    const zoneCleanupRef = useRef<(() => void) | null>(null);
    const mapComponentRef = useRef<MapComponentRef>(null);
    const currentTrackMmsiRef = useRef<string | null>(null);

    // State
    // Χρησιμοποιούμε Map για γρήγορη πρόσβαση και ενημέρωση (O(1)).
    const [allVessels, setAllVessels] = useState<Map<string, RealTimeShipUpdateDTO>>(new Map());

    // State για τα φιλτραρισμένα πλοία που θα εμφανιστούν στον χάρτη.
    const [filteredVessels, setFilteredVessels] = useState<RealTimeShipUpdateDTO[]>([]);

    const [coordinates, setCoordinates] = useState('Hover over the map');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [selectedVessel, setSelectedVessel] = useState<RealTimeShipUpdateDTO | null>(null);
    const initialFilters: FilterState = {
        vesselType: [],
        vesselStatus: [],
    };
    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [isCreatingZone, setIsCreatingZone] = useState(false);
    const [activeZoneType, setActiveZoneType] = useState<ZoneType>('interest');
    // TODO: Προσθέστε state για τις λίστες των ζωνών (π.χ. interestZones, collisionZones)

    // --- STATE ΓΙΑ ΤΗΝ ΠΟΡΕΙΑ ---
    const [shipTrack, setShipTrack] = useState<TrackPointDTO[]>([]);
    const [currentTrackMmsi, setCurrentTrackMmsi] = useState<string | null>(null);
    const [isTrackLoading, setIsTrackLoading] = useState(false);

    const [zoomRequest, setZoomRequest] = useState<number>(0);

    // --- CORE LOGIC (Callbacks & Effects) ---
    useEffect(() => {
        currentTrackMmsiRef.current = currentTrackMmsi;
    }, [currentTrackMmsi]);

    const handleShowTrackRequest = useCallback(async (mmsi: string, silent = false) => {
        if (!silent) {
            setIsTrackLoading(true);
        }
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

            // Αν η κλήση ΔΕΝ είναι silent και βρέθηκαν δεδομένα,
            // τότε αυξάνουμε τον μετρητή του zoomRequest για να πυροδοτήσουμε το zoom.
            if (!silent && data.length > 0) {
                setZoomRequest(prev => prev + 1);
            }

        } catch (error) {
            console.error(error);
            if (!silent) toast.error("Could not load ship track.");
            setCurrentTrackMmsi(null);
        } finally {
            if (!silent) {
                setIsTrackLoading(false);
            }
        }
    }, []);

    const addOrUpdateVessel = useCallback((vessel: RealTimeShipUpdateDTO) => {
        setAllVessels(prevMap => new Map(prevMap).set(vessel.mmsi, vessel));

        // Ενημερώνουμε και το selectedVessel αν είναι το ίδιο, για να ανανεωθεί το popup.
        setSelectedVessel(prevSelected =>
            (prevSelected && prevSelected.mmsi === vessel.mmsi) ? vessel : prevSelected
        );

        // --- Έλεγχος για αυτόματη ανανέωση της πορείας ---
        if (vessel.mmsi && vessel.mmsi === currentTrackMmsiRef.current) {
            console.log(`Refreshing track for currently viewed vessel: ${vessel.mmsi}`);
            // Καλούμε την ανανέωση "αθόρυβα" (silent=true) για να μην δείχνει loading indicator
            void handleShowTrackRequest(vessel.mmsi, true);
        }
        // -------------------------------------------------------------
    }, [handleShowTrackRequest]);

    // Αυτό το useEffect είναι ΑΠΟΚΛΕΙΣΤΙΚΑ υπεύθυνο για το ζουμ
    // και εκτελείται ΜΟΝΟ όταν το zoomRequest αλλάξει.
    useEffect(() => {
        // Ο έλεγχος zoomRequest > 0 είναι για να μην τρέξει στην αρχική φόρτωση.
        if (zoomRequest > 0) {
            mapComponentRef.current?.zoomToTrack();
        }
    }, [zoomRequest]);

    // Αυτό τρέχει κάθε φορά που αλλάζει η λίστα με όλα τα πλοία ή οι ρυθμίσεις των φίλτρων.
    useEffect(() => {
        const vesselsArray = Array.from(allVessels.values());

        const newFilteredVessels = vesselsArray.filter(vessel => {
            // Αν δεν έχουν επιλεγεί φίλτρα τύπου, το πλοίο περνάει. Αλλιώς, ελέγχουμε αν ο τύπος του περιλαμβάνεται στα επιλεγμένα.
            const typeMatch = filters.vesselType.length === 0 || filters.vesselType.includes(vessel.shiptype);

            // Το ίδιο για την κατάσταση.
            const statusMatch = filters.vesselStatus.length === 0 || filters.vesselStatus.includes(vessel.navigationalStatus?.toString() ?? '-1');

            return typeMatch && statusMatch;
        });

        setFilteredVessels(newFilteredVessels);
    }, [allVessels, filters]); // Εξαρτήσεις: η κεντρική λίστα πλοίων και τα φίλτρα

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
            setAllVessels(initialVesselMap); // Θέτουμε το αρχικό state
            console.log(`Loaded ${initialVesselMap.size} initial vessels.`);
        } catch (error) {
            console.error('Error fetching initial vessel data:', error);
            toast.error('Could not fetch initial vessel data.');
        }
    }, []);

    // Ο μόνος της ρόλος είναι να
    // αρχικοποιήσει τον χάρτη και να φορτώσει τα αρχικά δεδομένα.
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
            // TODO: Εδώ θα μπει η λογική για έλεγχο ορίου ζωνών και η κλήση του enableZoneCreation
            // const currentCount = ...
            // if (currentCount >= MAX_ZONES) { toast.warning(...); return; }

            // const handleZoneCreated = (...) => { ... }
            // zoneCleanupRef.current = enableZoneCreation(mapInstanceRef.current, activeZoneType, handleZoneCreated, ...);

            setIsCreatingZone(true);
        }
    };

    const handleMultiSelectChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => {
            const currentValues = prev[key];
            // Ελέγχουμε αν η τιμή υπάρχει ήδη στον πίνακα.
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value) // Αν υπάρχει, την αφαιρούμε
                : [...currentValues, value];             // Αν δεν υπάρχει, την προσθέτουμε

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
                onMultiSelectChange={handleMultiSelectChange} // Χρήση του νέου handler
                onReset={() => setFilters(initialFilters)}
                onClose={() => setIsFiltersOpen(false)}
            />
        </div>
    );
};

export default SharedMapPage;