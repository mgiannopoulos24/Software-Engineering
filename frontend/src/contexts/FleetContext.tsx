// src/contexts/FleetContext.tsx

import { getMyFleet, addShipToFleet, removeShipFromFleet } from '@/services/fleetService';
import { RealTimeShipUpdateDTO, ShipDetailsDTO } from '@/types/types';
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';

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
    const { client, isConnected } = useWebSocket();
    const [fleet, setFleet] = useState<Map<string, ShipDetailsDTO>>(new Map());
    const [loading, setLoading] = useState<boolean>(true);

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

    // Αρχική φόρτωση του στόλου
    useEffect(() => {
        void fetchFleet();
    }, [fetchFleet]);

    // Το useEffect αυτό διαχειρίζεται τον κύκλο ζωής της WebSocket σύνδεσης.
    useEffect(() => {
        // Αν δεν είμαστε συνδεδεμένοι ή δεν υπάρχει ο client, μην κάνεις τίποτα.
        if (!isConnected || !client || !currentUser) {
            return;
        }

        // Αυτή η συνάρτηση θα χειρίζεται την ενημέρωση του state του στόλου.
        const handleFleetUpdate = (vesselUpdate: RealTimeShipUpdateDTO) => {
            setFleet(prevFleet => {
                // Ελέγχουμε αν το πλοίο που ήρθε η ενημέρωση υπάρχει ήδη στον στόλο μας.
                if (prevFleet.has(vesselUpdate.mmsi)) {
                    // Δημιουργούμε ένα νέο Map για να μην μεταλλάξουμε το παλιό state (immutability).
                    const newFleet = new Map(prevFleet);
                    const existingShip = newFleet.get(vesselUpdate.mmsi)!;

                    // Δημιουργούμε το ενημερωμένο αντικείμενο του πλοίου,
                    // συνδυάζοντας τα παλιά του δεδομένα με τα νέα από το WebSocket.
                    const updatedShip: ShipDetailsDTO = {
                        ...existingShip,
                        speedOverGround: vesselUpdate.speedOverGround,
                        courseOverGround: vesselUpdate.courseOverGround,
                        longitude: vesselUpdate.longitude,
                        latitude: vesselUpdate.latitude,
                        navigationalStatus: vesselUpdate.navigationalStatus,
                        trueHeading: vesselUpdate.trueHeading,
                        lastUpdateTimestampEpoch: vesselUpdate.timestampEpoch,
                    };

                    // Ενημερώνουμε το νέο Map και το επιστρέφουμε για να γίνει το update του state.
                    newFleet.set(vesselUpdate.mmsi, updatedShip);
                    return newFleet;
                }
                // Αν το πλοίο δεν ήταν στον στόλο μας, απλά επιστρέφουμε το παλιό state.
                return prevFleet;
            });
        };

        // Κάνουμε subscribe στο private κανάλι για τις ενημερώσεις του στόλου.
        const subscription = client.subscribe('/user/queue/fleet-updates', (message) => {
            try {
                const vesselUpdate: RealTimeShipUpdateDTO = JSON.parse(message.body);
                handleFleetUpdate(vesselUpdate);
            } catch (error) {
                console.error("Failed to parse fleet update message:", error);
            }
        });

        console.log('✅ FleetContext: Subscribed to /user/queue/fleet-updates');

        // Η συνάρτηση cleanup που θα εκτελεστεί όταν το component αποσυνδεθεί.
        return () => {
            console.log('🔌 FleetContext: Unsubscribing from /user/queue/fleet-updates');
            subscription.unsubscribe();
        };

        // Προσθέστε το currentUser στο dependency array!
    }, [isConnected, client, currentUser]);

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