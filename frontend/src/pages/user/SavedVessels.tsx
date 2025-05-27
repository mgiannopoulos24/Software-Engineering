import React from 'react';
import { Anchor, Navigation, Waves } from 'lucide-react';

interface Vessel {
  id: string;
  title: string;
  destination: string;
  speed: number;
  draught: number;
}

const SavedVessels: React.FC = () => {
  // Mock data for vessels
  const savedVessels: Vessel[] = [
    {
      id: '1',
      title: 'MV Mediterranean Star',
      destination: 'Piraeus, Greece',
      speed: 14.2,
      draught: 8.5
    },
    {
      id: '2',
      title: 'SS Atlantic Express',
      destination: 'Marseille, France',
      speed: 16.8,
      draught: 9.2
    },
    {
      id: '3',
      title: 'MV Aegean Explorer',
      destination: 'Istanbul, Turkey',
      speed: 12.5,
      draught: 7.8
    }
  ];

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Saved Vessels</h1>
          <p className="mt-2 text-gray-600">
            Your bookmarked vessels and their current status
          </p>
        </div>
      <div className="mx-auto max-w-6xl">
        

        {/* Vessels Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {savedVessels.map((vessel) => (
            <div
              key={vessel.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Vessel Title */}
              <div className="mb-4 flex items-center">
                <Anchor className="mr-3 h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {vessel.title}
                </h3>
              </div>

              {/* Vessel Details */}
              <div className="space-y-3">
                {/* Destination */}
                <div className="flex items-center">
                  <Navigation className="mr-3 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Destination</p>
                    <p className="text-sm text-gray-600">{vessel.destination}</p>
                  </div>
                </div>

                {/* Speed */}
                <div className="flex items-center">
                  <Waves className="mr-3 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Speed</p>
                    <p className="text-sm text-gray-600">{vessel.speed} knots</p>
                  </div>
                </div>

                {/* Draught */}
                <div className="flex items-center">
                  <div className="mr-3 flex h-5 w-5 items-center justify-center">
                    <div className="h-4 w-4 rounded bg-gray-400"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Draught</p>
                    <p className="text-sm text-gray-600">{vessel.draught} meters</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (if no vessels) */}
        {savedVessels.length === 0 && (
          <div className="text-center py-12">
            <Anchor className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No saved vessels</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by bookmarking vessels from the map view.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedVessels;