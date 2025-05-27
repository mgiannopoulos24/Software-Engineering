import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  enableCriticalSectionCreation, 
  CriticalSection, 
  drawCriticalSection,
  MAX_CRITICAL_SECTIONS
} from '@/utils/mapUtils';
import { Button } from "@/components/ui/button";
import { toast } from '@/hooks/use-toast'; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2 } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// Mock vessel data
const mockVessels = [
  {
    id: 1,
    name: "Mediterranean Star",
    type: "cargo",
    status: "underway",
    lat: 37.9755,
    lng: 23.7348,
    speed: 14.2,
    heading: 45,
    destination: "Piraeus Port"
  },
  {
    id: 2,
    name: "Aegean Explorer",
    type: "passenger",
    status: "anchored",
    lat: 37.9420,
    lng: 23.6580,
    speed: 0.0,
    heading: 180,
    destination: "Mykonos"
  },
  {
    id: 3,
    name: "Blue Horizon",
    type: "tanker",
    status: "moored",
    lat: 37.9838,
    lng: 23.7275,
    speed: 0.0,
    heading: 270,
    destination: "Rafina Port"
  },
  {
    id: 4,
    name: "Ocean Navigator",
    type: "cargo",
    status: "underway",
    lat: 38.0150,
    lng: 23.7950,
    speed: 16.8,
    heading: 90,
    destination: "Thessaloniki"
  },
  {
    id: 5,
    name: "Sea Breeze",
    type: "fishing",
    status: "underway",
    lat: 37.8900,
    lng: 23.6200,
    speed: 8.5,
    heading: 315,
    destination: "Fishing Grounds"
  },
  {
    id: 6,
    name: "Golden Wave",
    type: "passenger",
    status: "underway",
    lat: 38.0500,
    lng: 23.6800,
    speed: 22.3,
    heading: 225,
    destination: "Santorini"
  },
  {
    id: 7,
    name: "Atlantic Express",
    type: "cargo",
    status: "anchored",
    lat: 37.9200,
    lng: 23.8100,
    speed: 0.0,
    heading: 0,
    destination: "Waiting Area"
  },
  {
    id: 8,
    name: "Coastal Guardian",
    type: "other",
    status: "unknown",
    lat: 38.0800,
    lng: 23.7200,
    speed: 5.2,
    heading: 135,
    destination: "Unknown"
  },
  {
    id: 9,
    name: "Sunset Voyager",
    type: "tanker",
    status: "underway",
    lat: 37.8500,
    lng: 23.7800,
    speed: 12.1,
    heading: 60,
    destination: "Elefsina"
  },
  {
    id: 10,
    name: "Island Hopper",
    type: "passenger",
    status: "moored",
    lat: 37.9600,
    lng: 23.6000,
    speed: 0.0,
    heading: 90,
    destination: "Aegina Port"
  }
];

const UserPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [coordinates, setCoordinates] = useState('Hover over the map to display coordinates');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<any>(null);
  const [filters, setFilters] = useState({
    vesselType: 'all',
    capacity: [50],
    vesselStatus: 'all',
  });
  const [criticalSections, setCriticalSections] = useState<CriticalSection[]>([]);
  const [isCreatingCriticalSection, setIsCreatingCriticalSection] = useState(false);
  const criticalSectionCleanupRef = useRef<(() => void) | null>(null);

  // Create vessel icon using Navigation2 from Lucide
  const getVesselIcon = (type: string, status: string, heading: number) => {
    const colors = {
      cargo: '#FF6B35',
      passenger: '#4ECDC4',
      tanker: '#45B7D1',
      fishing: '#96CEB4',
      other: '#FFEAA7'
    };

    const color = colors[type as keyof typeof colors] || colors.other;
    const pulseAnimation = status === 'underway' ? 'animation: pulse 2s infinite;' : '';
    
    return L.divIcon({
      html: `
        <div style="
          color: ${color};
          transform: rotate(${heading}deg);
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          ${pulseAnimation}
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3,11 22,2 13,21 11,13 3,11"></polygon>
          </svg>
        </div>
        <style>
          @keyframes pulse {
            0% { transform: rotate(${heading}deg) scale(1); opacity: 1; }
            50% { transform: rotate(${heading}deg) scale(1.2); opacity: 0.8; }
            100% { transform: rotate(${heading}deg) scale(1); opacity: 1; }
          }
        </style>
      `,
      className: 'vessel-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  const addVesselMarkers = (vessels: typeof mockVessels) => {
    vessels.forEach(vessel => {
      const marker = L.marker([vessel.lat, vessel.lng], {
        icon: getVesselIcon(vessel.type, vessel.status, vessel.heading)
      }).addTo(mapInstanceRef.current!);

      // Add click event to select vessel
      marker.on('click', () => {
        setSelectedVessel(vessel);
      });

      // Add popup with vessel information
      marker.bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #1f2937; display: flex; items-center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3,11 22,2 13,21 11,13 3,11"></polygon>
            </svg>
            ${vessel.name}
          </h4>
          <div style="font-size: 12px; line-height: 1.4; color: #374151;">
            <div style="margin-bottom: 4px;"><strong>Type:</strong> ${vessel.type.charAt(0).toUpperCase() + vessel.type.slice(1)}</div>
            <div style="margin-bottom: 4px;"><strong>Status:</strong> ${vessel.status.charAt(0).toUpperCase() + vessel.status.slice(1)}</div>
            <div style="margin-bottom: 4px;"><strong>Speed:</strong> ${vessel.speed} knots</div>
            <div style="margin-bottom: 4px;"><strong>Heading:</strong> ${vessel.heading}°</div>
            <div><strong>Destination:</strong> ${vessel.destination}</div>
          </div>
        </div>
      `);

      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Initialize the map with bounds
      const map = L.map(mapRef.current, {
        maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
        maxBoundsViscosity: 1.0,
      }).setView([37.9, 23.0], 7);

      // Add the OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Store the map instance for cleanup
      mapInstanceRef.current = map;

      // Add coordinate tracking
      map.on('mousemove', (e) => {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        setCoordinates(`Latitude: ${lat}, Longitude: ${lng}`);
      });

      // Update display when mouse leaves the map
      map.on('mouseout', () => {
        setCoordinates('Hover over the map to display coordinates');
      });

      // Add vessel markers
      addVesselMarkers(mockVessels);

      // Ensure map takes up full container size
      map.invalidateSize();
    }

    return () => {
      if (mapInstanceRef.current) {
        // Clear markers
        markersRef.current.forEach(marker => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(marker);
          }
        });
        markersRef.current = [];
        
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const toggleFilters = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      vesselType: 'all',
      capacity: [50],
      vesselStatus: 'all',
    });
    setSelectedVessel(null); // Add this line to clear the selected vessel
  };

  const applyFilters = () => {
    console.log('Applying filters:', filters);
    
    // Filter vessels based on current filter settings
    const filteredVessels = mockVessels.filter(vessel => {
      const typeMatch = filters.vesselType === 'all' || vessel.type === filters.vesselType;
      const statusMatch = filters.vesselStatus === 'all' || vessel.status === filters.vesselStatus;
      return typeMatch && statusMatch;
    });

    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];

    // Add filtered markers
    if (mapInstanceRef.current) {
      addVesselMarkers(filteredVessels);
    }

    setIsFiltersOpen(false);
  };

  // Add this new function to handle critical section creation
  const handleCriticalSectionCreated = (section: CriticalSection) => {
    setCriticalSections(prev => {
      const updated = [...prev, section];
      setIsCreatingCriticalSection(false);
      return updated;
    });
    
    // Show notification
    toast({
      title: "Critical Section Created",
      description: `New critical section added at ${section.center.lat.toFixed(5)}, ${section.center.lng.toFixed(5)}`,
    });
  };
  
  const handleRemoveCriticalSection = (id: string) => {
    setCriticalSections(prev => prev.filter(section => section.id !== id));
    
    // Show notification
    toast({
      title: "Critical Section Removed",
      description: "The critical section has been removed.",
    });
  };

  // Update the useEffect that handles the toggle event
  useEffect(() => {
    const handleToggleCriticalSectionMode = () => {
      console.log('Toggle critical section mode event received');
      
      if (mapInstanceRef.current) {
        if (isCreatingCriticalSection) {
          console.log('Disabling critical section mode');
          // Disable critical section mode
          if (criticalSectionCleanupRef.current) {
            criticalSectionCleanupRef.current();
            criticalSectionCleanupRef.current = null;
          }
          setIsCreatingCriticalSection(false);
        } else {
          console.log('Enabling critical section mode');
          
          // Check if we've reached the limit
          if (criticalSections.length >= MAX_CRITICAL_SECTIONS) {
            toast({
              title: "Maximum Limit Reached",
              description: `You can only have ${MAX_CRITICAL_SECTIONS} critical sections at a time. Remove one to add another.`,
              variant: "destructive"
            });
            return; // Don't enable if limit reached
          }
          
          // Show toast with instruction message
          toast({
            title: "Critical Section Mode",
            description: "Click on the map to mark a critical section",
          });
          
          // Enable critical section mode (the function will handle the limit internally)
          const cleanup = enableCriticalSectionCreation(
            mapInstanceRef.current,
            handleCriticalSectionCreated,
            criticalSections.length
          );
          criticalSectionCleanupRef.current = cleanup;
          setIsCreatingCriticalSection(true);
        }
      } else {
        console.error('Map instance not available');
      }
    };
    
    console.log('Adding event listener for toggle-critical-section-mode');
    window.addEventListener('toggle-critical-section-mode', handleToggleCriticalSectionMode);
    document.addEventListener('toggle-critical-section-mode', handleToggleCriticalSectionMode);
    
    return () => {
      console.log('Removing event listener for toggle-critical-section-mode');
      window.removeEventListener('toggle-critical-section-mode', handleToggleCriticalSectionMode);
      document.removeEventListener('toggle-critical-section-mode', handleToggleCriticalSectionMode);
      // Clean up critical section mode if active
      if (criticalSectionCleanupRef.current) {
        criticalSectionCleanupRef.current();
      }
    };
  }, [isCreatingCriticalSection, criticalSections.length]);
  
  // Add this to render existing critical sections when map loads
  useEffect(() => {
    if (mapInstanceRef.current && criticalSections.length > 0) {
      criticalSections.forEach(section => {
        drawCriticalSection(mapInstanceRef.current!, section, handleRemoveCriticalSection);
      });
    }
  }, [criticalSections]);

  return (
    <div className="relative flex h-screen w-screen flex-col">
      {/* Map Container */}
      <div id="map" ref={mapRef} className="h-full w-full"></div>
      
      {/* Coordinates Display */}
      <div
        id="coordinates"
        className="absolute bottom-2.5 left-1/2 z-[999] -translate-x-1/2 transform overflow-hidden whitespace-nowrap rounded border border-white/30 bg-black/60 px-2.5 py-0.5 text-center text-xs font-medium text-white shadow-md"
      >
        {coordinates}
      </div>
      
      {/* Critical Section Mode Indicator - Center */}
      {isCreatingCriticalSection && (
        <div className="absolute left-1/2 top-4 z-[999] -translate-x-1/2 transform text-center">
          <div className="rounded-full bg-red-600 px-4 py-2 text-white shadow-lg">
            {criticalSections.length >= MAX_CRITICAL_SECTIONS ? (
              <>Maximum limit reached</>
            ) : (
              <>Click on the map to mark a critical section</>
            )}
          </div>
        </div>
      )}
      
      {/* Critical Sections Counter and Done Button - Top Right */}
      <div className="absolute right-6 top-4 z-[999] text-right justify-center">
        <div className="rounded-md bg-black/80 px-3 py-2 text-sm text-white shadow-lg">
          Critical Sections: {criticalSections.length} / {MAX_CRITICAL_SECTIONS}
        </div>
        
        {/* Done Button - Only show when in critical section creation mode */}
        {isCreatingCriticalSection && (
          <Button 
            onClick={() => {
              if (criticalSectionCleanupRef.current) {
                criticalSectionCleanupRef.current();
                criticalSectionCleanupRef.current = null;
              }
              setIsCreatingCriticalSection(false);
              toast({
                title: "Critical Section Mode",
                description: "Exited critical section creation mode",
              });
            }}
            variant="secondary"
            className="mt-2 bg-white text-red-600 hover:bg-gray-100"
            size="sm"
          >
            Done
          </Button>
        )}
      </div>

      {/* Filters Button */}
      <div className="absolute bottom-4 left-4 z-[999]">
        <Button
          onClick={toggleFilters}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
        >
          <span>Filters</span>
          <Settings2 size={18} />
        </Button>
      </div>

      {/* Filters Panel */}
      {isFiltersOpen && (
        <div className="absolute bottom-16 left-4 z-[999] w-80 rounded-lg border bg-card p-6 shadow-xl">
          <h5 className="mb-4 text-lg font-semibold">Map Filters</h5>
          
          {/* Vessel Type Filter */}
          <div className="mb-4 space-y-2">
            <Label htmlFor="vesselType">Type</Label>
            <Select
              value={filters.vesselType}
              onValueChange={(value) => handleFilterChange('vesselType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className='z-[999]'>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cargo">Cargo</SelectItem>
                <SelectItem value="passenger">Passenger</SelectItem>
                <SelectItem value="tanker">Tanker</SelectItem>
                <SelectItem value="fishing">Fishing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Capacity Filter */}
          <div className="mb-4 space-y-3">
            <Label>Capacity</Label>
            <div className="space-y-2">
              <Slider
                value={filters.capacity}
                onValueChange={(value) => handleFilterChange('capacity', value)}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0 tons</span>
                <span className="font-medium">{filters.capacity[0]} tons</span>
                <span>100 tons</span>
              </div>
            </div>
          </div>

          {/* Vessel Status Filter */}
          <div className="mb-4 space-y-2">
            <Label htmlFor="vesselStatus">Current Status</Label>
            <Select
              value={filters.vesselStatus}
              onValueChange={(value) => handleFilterChange('vesselStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className='z-[999]'>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="underway">Underway</SelectItem>
                <SelectItem value="anchored">Anchored</SelectItem>
                <SelectItem value="moored">Moored</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Last Position Display */}
          <div className="mb-4">
            <Label className="mb-2 block text-sm font-medium">Last position received</Label>
            {selectedVessel ? (
              <div className="rounded-md bg-muted p-3">
                <div className="mb-2 text-xs font-medium text-foreground">
                  {selectedVessel.name}
                </div>
                <pre className="text-xs">
{`{
  "latitude": ${selectedVessel.lat},
  "longitude": ${selectedVessel.lng},
  "timestamp": "2025-05-27T${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}:${new Date().getSeconds().toString().padStart(2, '0')}Z"
}`}
                </pre>
              </div>
            ) : (
              <div className="rounded-md bg-muted p-3 text-center">
                <div className="text-xs text-muted-foreground">
                  Click on a vessel to view its last position
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between space-x-3">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              onClick={applyFilters}
              className="flex-1"
            >
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* Click outside to close filters */}
      {isFiltersOpen && (
        <div 
          className="fixed inset-0 z-[998]" 
          onClick={() => setIsFiltersOpen(false)}
        />
      )}
    </div>
  );
};

export default UserPage;
