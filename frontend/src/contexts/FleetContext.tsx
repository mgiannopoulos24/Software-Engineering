import { getMyFleet, addShipToFleet, removeShipFromFleet } from '@/services/fleetService';
import { RealTimeShipUpdateDTO, ShipDetailsDTO } from '@/types/types';
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface FleetContextType {
    fleet: Map<string, ShipDetailsDTO>;
    loading: boolean;
    isShipInFleet: (mmsi: string) => boolean;
    addShip: (mmsi: number) => Promise<void>;
    removeShip: (mmsi: number) => Promise<void>;
    updateShipInFleet: (vessel: RealTimeShipUpdateDTO) => void;
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
            await fetchFleet(); // Refresh the fleet from the server
        } catch (error) {
            console.error("Failed to add ship:", error);
            toast.error("Could not add vessel to your fleet.");
        }
    };

    const removeShip = async (mmsi: number) => {
        try {
            await removeShipFromFleet(mmsi);
            toast.info(`Vessel ${mmsi} removed from your fleet.`);
            // Optimistic update: remove from local state immediately
            setFleet(prevFleet => {
                const newFleet = new Map(prevFleet);
                newFleet.delete(mmsi.toString());
                return newFleet;
            });
            // Then, optionally, refetch for consistency
            // await fetchFleet();
        } catch (error) {
            console.error("Failed to remove ship:", error);
            toast.error("Could not remove vessel from your fleet.");
        }
    };

    const updateShipInFleet = (vesselUpdate: RealTimeShipUpdateDTO) => {
        setFleet(prevFleet => {
            if (prevFleet.has(vesselUpdate.mmsi)) {
                const newFleet = new Map(prevFleet);
                const existingShip = newFleet.get(vesselUpdate.mmsi)!;

                // Create a new updated ship object to ensure re-render
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

                newFleet.set(vesselUpdate.mmsi, updatedShip);
                return newFleet;
            }
            return prevFleet; // No change if the ship is not in the fleet
        });
    };

    const value = {
        fleet,
        loading,
        isShipInFleet,
        addShip,
        removeShip,
        updateShipInFleet,
    };

    return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
};