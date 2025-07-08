import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFleet } from '@/contexts/FleetContext';
import { getVesselStatusDescription } from '@/utils/vesselUtils';
import { Anchor, Compass, Gauge, Loader2, Navigation, Trash2, Wind } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const SavedVessels: React.FC = () => {
  const { fleet, loading, removeShip } = useFleet();

  if (loading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-lg text-slate-600">Loading your fleet...</p>
        </div>
      </div>
    );
  }

  const fleetArray = Array.from(fleet.values());

  return (
    <div className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Fleet</h1>
          <p className="mt-2 text-gray-600">Your saved vessels and their current status.</p>
        </div>

        {fleetArray.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {fleetArray.map((vessel) => (
              <div
                key={vessel.mmsi}
                className="flex flex-col rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center">
                      <Anchor className="mr-3 h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">MMSI: {vessel.mmsi}</h3>
                        <Badge variant="secondary" className="mt-1 capitalize">{vessel.shiptype?.replace(/-/g, ' ') ?? 'Unknown Type'}</Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-400 hover:bg-red-50 hover:text-red-600"
                      onClick={() => removeShip(vessel.mmsi)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-gray-500"><Navigation className="mr-2 h-4 w-4" />Status</span>
                      <span className="font-medium">{getVesselStatusDescription(vessel.navigationalStatus)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-gray-500"><Gauge className="mr-2 h-4 w-4" />Speed</span>
                      <span className="font-medium">{vessel.speedOverGround?.toFixed(1) ?? 'N/A'} kn</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-gray-500"><Wind className="mr-2 h-4 w-4" />Course</span>
                      <span className="font-medium">{vessel.courseOverGround?.toFixed(1) ?? 'N/A'} °</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-gray-500"><Compass className="mr-2 h-4 w-4" />Heading</span>
                      <span className="font-medium">{vessel.trueHeading !== 511 ? `${vessel.trueHeading} °` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-auto border-t bg-gray-50 p-4">
                  <Link
                    to={`/user?mmsi=${vessel.mmsi}`} // Example: link to map centered on vessel
                    className="w-full"
                  >
                    <Button className="w-full">
                      View on Map
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-24 text-center">
            <Anchor className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Your Fleet is Empty</h3>
            <p className="mt-2 text-gray-500">
              Go to the map and click on a vessel to add it to your fleet.
            </p>
            <Link to="/user" className="mt-6">
              <Button>Go to Map</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedVessels;