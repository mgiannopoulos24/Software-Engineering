import { Button } from '@/components/ui/button';
import { useFleet } from '@/contexts/FleetContext';
import { ShipDetailsDTO } from '@/types/types';
import { getVesselStatusDescription } from '@/utils/vesselUtils';
import { Anchor, Compass, Gauge, Loader2, MapPin, Navigation, Trash2 } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';


const VesselCard: React.FC<{
  vessel: ShipDetailsDTO;
  onRemove: (mmsi: number) => void;
  onViewOnMap: (mmsi: number) => void;
}> = ({ vessel, onRemove, onViewOnMap }) => {
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* Vessel Title */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Anchor className="mr-3 h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{vessel.mmsi}</h3>
            <p className="text-xs capitalize text-gray-500">
              {vessel.shiptype?.replace(/-/g, ' ')}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onRemove(vessel.mmsi)} title="Remove from Fleet">
          <Trash2 className="h-5 w-5 text-red-500" />
        </Button>
      </div>

      {/* Vessel Details */}
      <div className="flex-grow space-y-3">
        <div className="flex items-center text-sm">
          <MapPin className="mr-3 h-5 w-5 text-gray-400" />
          <span>
            Lat: {vessel.latitude?.toFixed(4) ?? 'N/A'}, Lon:{' '}
            {vessel.longitude?.toFixed(4) ?? 'N/A'}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <Gauge className="mr-3 h-5 w-5 text-gray-400" />
          <span>Speed: {vessel.speedOverGround?.toFixed(1) ?? 'N/A'} kn</span>
        </div>
        <div className="flex items-center text-sm">
          <Compass className="mr-3 h-5 w-5 text-gray-400" />
          <span>Course: {vessel.courseOverGround?.toFixed(1) ?? 'N/A'}°</span>
        </div>
        <div className="flex items-center text-sm">
          <Anchor className="mr-3 h-5 w-5 text-gray-400" />
          <span>Status: {getVesselStatusDescription(vessel.navigationalStatus)}</span>
        </div>
      </div>

      <div className="mt-6">
        <Button className="w-full" onClick={() => onViewOnMap(vessel.mmsi)}>
          <Navigation className="mr-2 h-4 w-4" />
          View on Map
        </Button>
      </div>
    </div>
  );
};

const SavedVessels: React.FC = () => {
  const { fleet, loading, removeShip } = useFleet();
  const navigate = useNavigate();

  const fleetArray = Array.from(fleet.values());

  const handleViewOnMap = (mmsi: number) => {
    // Χρησιμοποιούμε query parameter για να περάσουμε το MMSI στον χάρτη
    navigate(`/user?focus_mmsi=${mmsi}`);
  };

  if (loading) {
    return (
      <div className="flex h-[89vh] w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-lg text-slate-600">Loading your fleet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-auto min-h-[89vh] w-full flex-col bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Saved Vessels</h1>
          <p className="mt-2 text-gray-600">
            Your bookmarked vessels and their current status ({fleetArray.length} total).
          </p>
        </div>

        {fleetArray.length === 0 ? (
          <div className="mt-16 text-center">
            <Anchor className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-xl font-medium text-gray-900">No saved vessels</h3>
            <p className="mt-2 text-base text-gray-500">
              Start by bookmarking vessels from the map view.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {fleetArray.map((vessel) => (
              <VesselCard
                key={vessel.mmsi}
                vessel={vessel}
                onRemove={removeShip}
                onViewOnMap={handleViewOnMap}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedVessels;