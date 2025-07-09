import { useAuth } from './AuthContext';
import {
  createOrUpdateCollisionZone,
  createOrUpdateInterestZone,
  deleteCollisionZone,
  deleteInterestZone,
  getCollisionZone,
  getInterestZone,
} from '@/services/zoneService';
import { CollisionZoneDTO, ZoneOfInterestDTO } from '@/types/types';
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { toast } from 'sonner';

interface ZoneContextType {
  interestZone: ZoneOfInterestDTO | null;
  collisionZone: CollisionZoneDTO | null;
  loading: boolean;
  loadZones: () => Promise<void>;
  saveInterestZone: (zoneData: ZoneOfInterestDTO) => Promise<void>;
  removeInterestZone: () => Promise<void>;
  saveCollisionZone: (zoneData: CollisionZoneDTO) => Promise<void>;
  removeCollisionZone: () => Promise<void>;
}

const ZoneContext = createContext<ZoneContextType | undefined>(undefined);

export const useZones = (): ZoneContextType => {
  const context = useContext(ZoneContext);
  if (!context) {
    throw new Error('useZones must be used within a ZoneProvider');
  }
  return context;
};

export const ZoneProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [interestZone, setInterestZone] = useState<ZoneOfInterestDTO | null>(null);
  const [collisionZone, setCollisionZone] = useState<CollisionZoneDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadZones = useCallback(async () => {
    if (!currentUser) {
      setInterestZone(null);
      setCollisionZone(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [interestResult, collisionResult] = await Promise.all([
        getInterestZone(),
        getCollisionZone(),
      ]);
      setInterestZone(interestResult);
      setCollisionZone(collisionResult);
    } catch (error) {
      console.error('Failed to load zones:', error);
      toast.error('Could not load your custom zones from the server.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void loadZones();
  }, [loadZones]);

  const saveInterestZone = async (zoneData: ZoneOfInterestDTO) => {
    try {
      const savedZone = await createOrUpdateInterestZone(zoneData);
      setInterestZone(savedZone);
      toast.success(`Zone of Interest "${savedZone.name}" saved successfully!`);
    } catch (error) {
      console.error('Failed to save interest zone:', error);
      toast.error('Could not save the Zone of Interest.');
      throw error;
    }
  };

  const removeInterestZone = async () => {
    try {
      await deleteInterestZone();
      setInterestZone(null);
      toast.info('Zone of Interest has been removed.');
    } catch (error) {
      console.error('Failed to remove interest zone:', error);
      toast.error('Could not remove the Zone of Interest.');
    }
  };

  const saveCollisionZone = async (zoneData: CollisionZoneDTO) => {
    try {
      const savedZone = await createOrUpdateCollisionZone(zoneData);
      setCollisionZone(savedZone);
      toast.success(`Collision Zone "${savedZone.name}" saved successfully!`);
    } catch (error) {
      console.error('Failed to save collision zone:', error);
      toast.error('Could not save the Collision Zone.');
      throw error;
    }
  };

  const removeCollisionZone = async () => {
    try {
      await deleteCollisionZone();
      setCollisionZone(null);
      toast.info('Collision Zone has been removed.');
    } catch (error) {
      console.error('Failed to remove collision zone:', error);
      toast.error('Could not remove the Collision Zone.');
    }
  };

  const value = {
    interestZone,
    collisionZone,
    loading,
    loadZones,
    saveInterestZone,
    removeInterestZone,
    saveCollisionZone,
    removeCollisionZone,
  };

  return <ZoneContext.Provider value={value}>{children}</ZoneContext.Provider>;
};
