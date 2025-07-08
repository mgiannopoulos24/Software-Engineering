// src/contexts/FleetContext.tsx

import { getMyFleet, addShipToFleet, removeShipFromFleet } from '@/services/fleetService';
import { RealTimeShipUpdateDTO, ShipDetailsDTO } from '@/types/types';
import { Client } from '@stomp/stompjs';
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import SockJS from 'sockjs-client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface FleetContextType {
    fleet: Map<string, ShipDetailsDTO>;
    loading: boolean;
    isShipInFleet: (mmsi: string) => boolean;
    addShip: (mmsi: number) => Promise<void>;
    removeShip: (mmsi: number) => Promise<void>;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const useFleet = (): FleetContextType => {
    const context = useContext(FleetContext);
    if (!context) {
        throw new Error('useFleet must be used within a FleetProvider');
    }
    return context;
};

export const FleetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [fleet, setFleet] = useState<Map<string, ShipDetailsDTO>>(new Map());
    const [loading, setLoading] = useState<boolean>(true);
    const stompClientRef = useRef<Client | null>(null);

    // Συνάρτηση για την ενημέρωση ενός πλοίου στο state του στόλου
    const updateShipInFleet = useCallback((vesselUpdate: RealTimeShipUpdateDTO) => {
        setFleet(prevFleet => {
            // Ελέγχουμε αν το πλοίο που ήρθε από το WebSocket υπάρχει ήδη στον στόλο μας.
            if (prevFleet.has(vesselUpdate.mmsi)) {
                // Δημιουργούμε ένα νέο Map για να μην μεταλλάξουμε το προηγούμενο state (immutability)
                const newFleet = new Map(prevFleet);
                const existingShip = newFleet.get(vesselUpdate.mmsi)!;

                // Δημιουργούμε ένα νέο, ενημερωμένο αντικείμενο πλοίου.
                // Χρησιμοποιούμε spread syntax για να κρατήσουμε τα στατικά δεδομένα
                // και να ενημερώσουμε μόνο τα δυναμικά.
                const updatedShip: ShipDetailsDTO = {
                    ...existingShip, // Κρατάει mmsi, shiptype, κτλ.
                    speedOverGround: vesselUpdate.speedOverGround,
                    courseOverGround: vesselUpdate.courseOverGround,
                    longitude: vesselUpdate.longitude,
                    latitude: vesselUpdate.latitude,
                    navigationalStatus: vesselUpdate.navigationalStatus,
                    trueHeading: vesselUpdate.trueHeading,
                    lastUpdateTimestampEpoch: vesselUpdate.timestampEpoch,
                };

                // Βάζουμε το ενημερωμένο πλοίο στο νέο Map
                newFleet.set(vesselUpdate.mmsi, updatedShip);
                return newFleet; // Επιστρέφουμε το νέο state
            }
            // Αν το πλοίο δεν ήταν στον στόλο, δεν κάνουμε τίποτα.
            return prevFleet;
        });
    }, []);

    const fetchFleet = useCallback(async () => {
        if (!currentUser) {
            setFleet(new Map());
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const fleetDetails = await getMyFleet();
            const fleetMap = new Map(fleetDetails.map(ship => [ship.mmsi.toString(), ship]));
            setFleet(fleetMap);
        } catch (error) {
            console.error("Failed to fetch fleet:", error);
            toast.error("Could not load your saved vessels.");
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    // Το useEffect αυτό διαχειρίζεται τον κύκλο ζωής της WebSocket σύνδεσης.
    useEffect(() => {
        // Αν δεν υπάρχει χρήστης, δεν κάνουμε τίποτα.
        if (!currentUser) {
            // Αν υπήρχε παλιά σύνδεση, την κλείνουμε.
            stompClientRef.current?.deactivate();
            stompClientRef.current = null;
            return;
        }

        // Παίρνουμε το token για την αυθεντικοποίηση στο WebSocket.
        const token = localStorage.getItem('token');
        if (!token) return;

        // Δημιουργούμε έναν νέο client. Η λογική είναι παρόμοια με του SharedMapPage.
        const client = new Client({
            webSocketFactory: () => new SockJS('/ws-ais'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
        });

        client.onConnect = () => {
            console.log('✅ FleetContext: WebSocket Connected!');
            // Κάνουμε subscribe στο private κανάλι για τις ενημερώσεις του στόλου.
            client.subscribe('/user/queue/fleet-updates', (message) => {
                const vesselUpdate: RealTimeShipUpdateDTO = JSON.parse(message.body);
                // Καλούμε τη συνάρτηση που ενημερώνει το state μας.
                updateShipInFleet(vesselUpdate);
            });
        };

        client.onStompError = (frame) => console.error('FleetContext STOMP Error:', frame);
        client.onWebSocketError = (event) => console.error('FleetContext WebSocket Error:', event);

        // Ενεργοποιούμε τον client.
        client.activate();
        stompClientRef.current = client;

        // Η συνάρτηση cleanup του useEffect. Είναι ΚΡΙΣΙΜΗ.
        // Εκτελείται όταν το component φεύγει από την οθόνη ή όταν αλλάζει το `currentUser`.
        // Εξασφαλίζει ότι η σύνδεση κλείνει σωστά.
        return () => {
            stompClientRef.current?.deactivate();
        };

    }, [currentUser, updateShipInFleet]); // Τρέχει ξανά αν αλλάξει ο χρήστης ή η συνάρτηση update.

    useEffect(() => {
        void fetchFleet();
    }, [fetchFleet]);

    const isShipInFleet = (mmsi: string): boolean => {
        return fleet.has(mmsi);
    };

    const addShip = async (mmsi: number) => {
        try {
            await addShipToFleet(mmsi);
            toast.success(`Vessel ${mmsi} added to your fleet!`);
            await fetchFleet(); // Ανανέωση του στόλου από τον server
        } catch (error) {
            console.error("Failed to add ship:", error);
            toast.error("Could not add vessel to your fleet.");
        }
    };

    const removeShip = async (mmsi: number) => {
        try {
            await removeShipFromFleet(mmsi);
            toast.info(`Vessel ${mmsi} removed from your fleet.`);
            // "Αισιόδοξη" ενημέρωση: αφαιρούμε από το τοπικό state αμέσως για καλύτερη εμπειρία χρήστη.
            setFleet(prevFleet => {
                const newFleet = new Map(prevFleet);
                newFleet.delete(mmsi.toString());
                return newFleet;
            });
        } catch (error) {
            console.error("Failed to remove ship:", error);
            toast.error("Could not remove vessel from your fleet.");
        }
    };

    const value = {
        fleet,
        loading,
        isShipInFleet,
        addShip,
        removeShip,
    };

    return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
};