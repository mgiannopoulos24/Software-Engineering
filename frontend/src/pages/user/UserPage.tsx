import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { FilterValue, Vessel } from '@/types/types';
import {
  Constraint,
  CriticalSection,
  InterestZone,
  MAX_CRITICAL_SECTIONS,
  MAX_INTEREST_ZONES,
  ZoneType,
  drawInterestZone,
  enableZoneCreation,
} from '@/utils/mapUtils';
import L from 'leaflet';
import { Settings2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// Mock vessel data
const mockVessels = [
  {
    id: 1,
    name: 'Mediterranean Star',
    type: 'cargo',
    status: 'underway',
    lat: 37.9755,
    lng: 23.7348,
    speed: 14.2,
    heading: 45,
    destination: 'Piraeus Port',
  },
  {
    id: 2,
    name: 'Aegean Explorer',
    type: 'passenger',
    status: 'anchored',
    lat: 37.942,
    lng: 23.658,
    speed: 0.0,
    heading: 180,
    destination: 'Mykonos',
  },
  {
    id: 3,
    name: 'Blue Horizon',
    type: 'tanker',
    status: 'moored',
    lat: 37.9838,
    lng: 23.7275,
    speed: 0.0,
    heading: 270,
    destination: 'Rafina Port',
  },
  {
    id: 4,
    name: 'Ocean Navigator',
    type: 'cargo',
    status: 'underway',
    lat: 38.015,
    lng: 23.795,
    speed: 16.8,
    heading: 90,
    destination: 'Thessaloniki',
  },
  {
    id: 5,
    name: 'Sea Breeze',
    type: 'fishing',
    status: 'underway',
    lat: 37.89,
    lng: 23.62,
    speed: 8.5,
    heading: 315,
    destination: 'Fishing Grounds',
  },
  {
    id: 6,
    name: 'Golden Wave',
    type: 'passenger',
    status: 'underway',
    lat: 38.05,
    lng: 23.68,
    speed: 22.3,
    heading: 225,
    destination: 'Santorini',
  },
  {
    id: 7,
    name: 'Atlantic Express',
    type: 'cargo',
    status: 'anchored',
    lat: 37.92,
    lng: 23.81,
    speed: 0.0,
    heading: 0,
    destination: 'Waiting Area',
  },
  {
    id: 8,
    name: 'Coastal Guardian',
    type: 'other',
    status: 'unknown',
    lat: 38.08,
    lng: 23.72,
    speed: 5.2,
    heading: 135,
    destination: 'Unknown',
  },
  {
    id: 9,
    name: 'Sunset Voyager',
    type: 'tanker',
    status: 'underway',
    lat: 37.85,
    lng: 23.78,
    speed: 12.1,
    heading: 60,
    destination: 'Elefsina',
  },
  {
    id: 10,
    name: 'Island Hopper',
    type: 'passenger',
    status: 'moored',
    lat: 37.96,
    lng: 23.6,
    speed: 0.0,
    heading: 90,
    destination: 'Aegina Port',
  },
];

const UserPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [coordinates, setCoordinates] = useState('Hover over the map to display coordinates');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [filters, setFilters] = useState({
    vesselType: 'all',
    capacity: [50],
    vesselStatus: 'all',
  });

  // State for zones
  const [criticalSections, setCriticalSections] = useState<CriticalSection[]>([]);
  const [interestZones, setInterestZones] = useState<InterestZone[]>([]);
  const [activeZoneType, setActiveZoneType] = useState<ZoneType>('critical');
  const [isCreatingZone, setIsCreatingZone] = useState(false);

  // Refs for zone management
  const zoneCleanupRef = useRef<(() => void) | null>(null);
  const criticalSectionsCountRef = useRef<number>(0);
  const interestZonesCountRef = useRef<number>(0);
  const criticalSectionCirclesRef = useRef<Map<string, L.Circle>>(new Map());
  const interestZoneCirclesRef = useRef<Map<string, L.Circle>>(new Map());

  // Update the refs whenever zones change
  useEffect(() => {
    criticalSectionsCountRef.current = criticalSections.length;
  }, [criticalSections]);

  useEffect(() => {
    interestZonesCountRef.current = interestZones.length;
  }, [interestZones]);

  // Fetch user's existing zone of interest on component mount
  useEffect(() => {
    const fetchUserZone = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/zone/mine', {
          credentials: 'include',
        }); // Assumes proxy is set up in vite.config.ts
        if (response.ok) {
          const zoneData = await response.json();
          const interestZone: InterestZone = {
            id: zoneData.id.toString(),
            center: L.latLng(zoneData.centerLatitude, zoneData.centerLongitude),
            radius: zoneData.radiusInMeters / 1000, // Convert meters to km
            createdAt: new Date(), // createdAt is not sent from backend, using current time
            name: zoneData.name,
            constraints: zoneData.constraints.map((c: any) => ({
              type: c.type,
              value: c.value,
            })),
          };
          setInterestZones([interestZone]);
          if (mapInstanceRef.current) {
            const circle = drawInterestZone(
              mapInstanceRef.current,
              interestZone,
              handleRemoveZone,
              handleUpdateZone,
              false
            );
            interestZoneCirclesRef.current.set(interestZone.id, circle);
          }
        } else if (response.status !== 404) {
          toast({
            title: 'Error',
            description: 'Failed to fetch your zone of interest.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Failed to fetch zone of interest:', error);
        toast({
          title: 'Error',
          description: 'Could not connect to the server to fetch your zone.',
          variant: 'destructive',
        });
      }
    };

    // We need the map to be initialized before we can draw the zone
    const checkMapAndFetch = () => {
      if (mapInstanceRef.current) {
        fetchUserZone();
      } else {
        setTimeout(checkMapAndFetch, 100); // Retry after a short delay
      }
    };

    checkMapAndFetch();
  }, []);

  // Create vessel icon using Navigation2 from Lucide
  const getVesselIcon = (type: string, status: string, heading: number) => {
    const colors = {
      cargo: '#FF6B35',
      passenger: '#4ECDC4',
      tanker: '#45B7D1',
      fishing: '#96CEB4',
      other: '#FFEAA7',
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
      iconAnchor: [10, 10],
    });
  };

  const addVesselMarkers = (vessels: typeof mockVessels) => {
    vessels.forEach((vessel) => {
      const marker = L.marker([vessel.lat, vessel.lng], {
        icon: getVesselIcon(vessel.type, vessel.status, vessel.heading),
      }).addTo(mapInstanceRef.current!);

      // Add click event to select vessel
      marker.on('click', () => {
        setSelectedVessel(vessel);
      });

      // Add popup with vessel information
      marker.bindPopup(`
        <div class="min-w-[240px] rounded-lg border bg-card text-card-foreground font-sans shadow-md">
          <div class="flex flex-col space-y-1.5 p-4">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-muted-foreground">
                <polygon points="3,11 22,2 13,21 11,13 3,11"></polygon>
              </svg>
              <h3 class="text-lg font-semibold leading-none tracking-tight">${vessel.name}</h3>
            </div>
            <p class="text-sm text-muted-foreground">${vessel.type.charAt(0).toUpperCase() + vessel.type.slice(1)} Ship</p>
          </div>
          <div class="p-4 pt-0">
            <div class="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
              <strong class="font-medium text-muted-foreground">Status</strong>
              <span class="text-muted-foreground">${vessel.status.charAt(0).toUpperCase() + vessel.status.slice(1)}</span>

              <strong class="font-medium text-muted-foreground">Speed</strong>
              <span class="text-muted-foreground">${vessel.speed} knots</span>

              <strong class="font-medium text-muted-foreground">Heading</strong>
              <span class="text-muted-foreground">${vessel.heading}°</span>

              <strong class="font-medium text-muted-foreground">Destination</strong>
              <span class="text-muted-foreground">${vessel.destination}</span>
            </div>
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
        zoomControl: false,
      }).setView([37.9, 23.0], 7);

      // Add the OpenStreetMap tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
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
        markersRef.current.forEach((marker) => {
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

  const handleFilterChange = (key: string, value: FilterValue) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      vesselType: 'all',
      capacity: [50],
      vesselStatus: 'all',
    });
    setSelectedVessel(null);
  };

  const applyFilters = () => {
    console.log('Applying filters:', filters);

    // Filter vessels based on current filter settings
    const filteredVessels = mockVessels.filter((vessel) => {
      const typeMatch = filters.vesselType === 'all' || vessel.type === filters.vesselType;
      const statusMatch = filters.vesselStatus === 'all' || vessel.status === filters.vesselStatus;
      return typeMatch && statusMatch;
    });

    // Clear existing markers
    markersRef.current.forEach((marker) => {
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

  // Handle when a zone is created
  const handleZoneCreated = async (zone: CriticalSection | InterestZone, circle: L.Circle) => {
    if (zone.id.startsWith('cs-')) {
      // It's a critical section
      setCriticalSections((prev) => [...prev, zone as CriticalSection]);
      criticalSectionCirclesRef.current.set(zone.id, circle);
      // Show notification
      toast({
        title: `Critical Section Created`,
        description: `New critical section added at ${zone.center.lat.toFixed(5)}, ${zone.center.lng.toFixed(5)}`,
        className: 'z-[999]',
      });
    } else {
      // It's an interest zone - This is a temporary new zone.
      // It will be saved to the backend only when the user clicks "Save Changes" in its popup.
      setInterestZones((prev) => [...prev, zone as InterestZone]);
      interestZoneCirclesRef.current.set(zone.id, circle);
      toast({
        title: 'Interest Zone Created',
        description: 'Set a name, radius, and constraints, then click "Save Changes".',
      });
    }

    // Clean up the zone creation mode
    if (zoneCleanupRef.current) {
      zoneCleanupRef.current();
      zoneCleanupRef.current = null;
    }
    setIsCreatingZone(false);
  };

  // Handle when a zone is updated (radius, name, constraints)
  const handleUpdateZone = async (
    id: string,
    newRadius: number,
    newConstraints?: Constraint[],
    newName?: string
  ) => {
    if (id.startsWith('cs-')) {
      setCriticalSections((prev) =>
        prev.map((section) => (section.id === id ? { ...section, radius: newRadius } : section))
      );
      toast({
        title: 'Critical Section Updated',
        description: `Radius has been set to ${newRadius} km.`,
      });
    } else {
      // It's an interest zone, call the backend API
      let zoneToUpdate = interestZones.find((z) => z.id === id);

      // If the zone is not found, it might be a new temporary zone that hasn't been saved yet.
      // The `interestZones` state might not be updated yet when this is called for the first time.
      // We find the temporary zone by looking for one without a backend ID (i.e., not a number).
      if (!zoneToUpdate) {
        zoneToUpdate = interestZones.find((z) => isNaN(parseInt(z.id, 10)));
      }

      // If still not found, it's a new zone and the state hasn't updated.
      // We can get the center from the circle ref.
      if (!zoneToUpdate) {
        const circle = interestZoneCirclesRef.current.get(id);
        if (circle) {
          zoneToUpdate = {
            id: id,
            center: circle.getLatLng(),
            radius: circle.getRadius() / 1000,
            createdAt: new Date(),
          };
        }
      }

      if (!zoneToUpdate) {
        toast({
          title: 'Error',
          description: 'Could not find the zone to update. Please try recreating it.',
          variant: 'destructive',
        });
        return;
      }

      const payload = {
        name: newName,
        centerLatitude: zoneToUpdate.center.lat,
        centerLongitude: zoneToUpdate.center.lng,
        radiusInMeters: newRadius * 1000, // convert km to meters
        constraints: newConstraints?.map((c) => ({ type: c.type, value: c.value })),
      };

      console.log('Sending PUT request to /api/zone/mine with payload:', payload);

      try {
        const response = await fetch('http://localhost:8080/api/zone/mine', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to save the zone of interest.');
        }

        const updatedZoneData = await response.json();

        // Update local state with data from backend response
        setInterestZones((prev) =>
          prev.map((zone) =>
            zone.id === zoneToUpdate!.id // Use the found zone's ID for matching
              ? {
                  ...zone,
                  id: updatedZoneData.id.toString(), // The ID might change if it was a new zone
                  radius: updatedZoneData.radiusInMeters / 1000,
                  name: updatedZoneData.name,
                  constraints: updatedZoneData.constraints.map((c: any) => ({
                    type: c.type,
                    value: c.value,
                  })),
                }
              : zone
          )
        );

        // If the ID changed (from temporary to permanent), update the circle ref map
        if (id !== updatedZoneData.id.toString()) {
          const circle = interestZoneCirclesRef.current.get(id);
          if (circle) {
            interestZoneCirclesRef.current.delete(id);
            interestZoneCirclesRef.current.set(updatedZoneData.id.toString(), circle);
          }
        }

        toast({
          title: 'Interest Zone Saved',
          description: 'Your changes have been saved successfully.',
        });
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Could not save the interest zone. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  // Handle when a zone is removed
  const handleRemoveZone = async (id: string) => {
    if (id.startsWith('cs-')) {
      // Remove critical section
      setCriticalSections((prev) => prev.filter((section) => section.id !== id));
      const circle = criticalSectionCirclesRef.current.get(id);
      if (circle && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(circle);
        criticalSectionCirclesRef.current.delete(id);
      }
      toast({
        title: 'Critical Section Removed',
        description: 'The critical section has been removed.',
      });
    } else {
      // Remove interest zone via API
      console.log(`Sending DELETE request to /api/zone/mine for zone ID: ${id}`);
      try {
        const response = await fetch('http://localhost:8080/api/zone/mine', {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to delete the zone of interest.');
        }

        setInterestZones((prev) => prev.filter((zone) => zone.id !== id));
        const circle = interestZoneCirclesRef.current.get(id);
        if (circle && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(circle);
          interestZoneCirclesRef.current.delete(id);
        }
        toast({
          title: 'Interest Zone Removed',
          description: 'The interest zone has been successfully removed.',
        });
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Could not remove the interest zone. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  // Toggle zone creation mode
  const toggleZoneCreation = (zoneType: ZoneType) => {
    if (!mapInstanceRef.current) {
      console.error('Map instance not available');
      return;
    }

    if (isCreatingZone && activeZoneType === zoneType) {
      // Disable the current zone creation mode
      if (zoneCleanupRef.current) {
        zoneCleanupRef.current();
        zoneCleanupRef.current = null;
      }
      setIsCreatingZone(false);
    } else {
      // Disable any existing zone creation mode
      if (zoneCleanupRef.current) {
        zoneCleanupRef.current();
        zoneCleanupRef.current = null;
      }

      // Set the active zone type
      setActiveZoneType(zoneType);

      // Get current count for the selected zone type
      const currentCount =
        zoneType === 'critical' ? criticalSectionsCountRef.current : interestZonesCountRef.current;

      // Check if we've reached the limit
      const maxLimit = zoneType === 'critical' ? MAX_CRITICAL_SECTIONS : MAX_INTEREST_ZONES;
      if (currentCount >= maxLimit) {
        const zoneName = zoneType === 'critical' ? 'Critical Sections' : 'Interest Zones';
        toast({
          title: `Maximum ${zoneName} Reached`,
          description: `You can only create ${maxLimit} ${zoneName.toLowerCase()}. Remove one to add another.`,
          className: 'z-[999]',
        });
        return;
      }

      // Enable zone creation mode
      const cleanup = enableZoneCreation(
        mapInstanceRef.current,
        zoneType,
        handleZoneCreated,
        currentCount,
        handleRemoveZone,
        handleUpdateZone
      );

      zoneCleanupRef.current = cleanup;
      setIsCreatingZone(true);

      // Show toast with instruction message
      const zoneName = zoneType === 'critical' ? 'Critical Section' : 'Interest Zone';
      toast({
        title: `${zoneName} Mode Activated`,
        description: `Click on the map to mark a ${zoneName.toLowerCase()} (up to 3 total)`,
        className: 'z-[999]',
      });
    }
  };

  // Separate useEffect to handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Clean up critical section circles
      criticalSectionCirclesRef.current.forEach((circle) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(circle);
        }
      });
      criticalSectionCirclesRef.current.clear();

      // Clean up interest zone circles
      interestZoneCirclesRef.current.forEach((circle) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(circle);
        }
      });
      interestZoneCirclesRef.current.clear();

      // Clean up zone creation mode if active when component unmounts
      if (zoneCleanupRef.current) {
        zoneCleanupRef.current();
        zoneCleanupRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex w-screen">
      <div className="relative w-full flex-1">
        <div id="map" ref={mapRef} className="h-[89vh] w-full"></div>

        {/* Coordinates Display */}
        <div
          id="coordinates"
          className="w-240 absolute bottom-2.5 left-1/2 z-[999] -translate-x-1/2 transform whitespace-nowrap rounded border border-white/30 bg-black/60 px-2.5 text-center text-xs font-medium text-white shadow-md"
        >
          {coordinates}
        </div>

        {/* Zone Controls - Top Right */}
        <div className="absolute right-6 top-4 z-[999] flex flex-col items-end space-y-2">
          <div className="rounded-md bg-black/80 px-3 py-2">
            <Label className="text-sm font-medium text-white">Zone Creation</Label>
            <Select
              value={activeZoneType}
              onValueChange={(value: ZoneType) => {
                if (isCreatingZone) {
                  // If we are in creation mode, cancel it before switching type
                  if (zoneCleanupRef.current) {
                    zoneCleanupRef.current();
                    zoneCleanupRef.current = null;
                  }
                  setIsCreatingZone(false);
                }
                setActiveZoneType(value);
              }}
            >
              <SelectTrigger className="mt-1 w-[200px] border-gray-600 bg-gray-700 text-white">
                <SelectValue placeholder="Select Zone Type" />
              </SelectTrigger>
              <SelectContent className="z-[999]">
                <SelectItem value="critical">Critical Section</SelectItem>
                <SelectItem value="interest">Interest Zone</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => toggleZoneCreation(activeZoneType)}
              className={`mt-2 w-full ${
                isCreatingZone
                  ? 'bg-gray-500 hover:bg-gray-600'
                  : activeZoneType === 'critical'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isCreatingZone
                ? 'Cancel Creation'
                : `Add ${activeZoneType === 'critical' ? 'Critical Section' : 'Interest Zone'}`}
            </Button>
          </div>
        </div>

        {/* Zone Counters - Top Left */}
        <div className="absolute left-4 top-4 z-[999] space-y-2">
          <div className="rounded-md bg-black/80 px-3 py-2 text-sm text-white shadow-lg">
            Critical Sections: {criticalSections.length} / {MAX_CRITICAL_SECTIONS}
          </div>
          <div className="rounded-md bg-black/80 px-3 py-2 text-sm text-white shadow-lg">
            Interest Zones: {interestZones.length} / {MAX_INTEREST_ZONES}
          </div>
        </div>

        {/* Zone Creation Mode Indicator - Center */}
        {isCreatingZone && (
          <div className="absolute left-1/2 top-4 z-[999] -translate-x-1/2 transform text-center">
            <div
              className={`rounded-full px-4 py-2 text-white shadow-lg ${
                activeZoneType === 'critical' ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              {activeZoneType === 'critical' ? 'Critical Section Mode' : 'Interest Zone Mode'}
            </div>
          </div>
        )}

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
                <SelectContent className="z-[999]">
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
                <SelectContent className="z-[999]">
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
              <Button variant="outline" onClick={resetFilters} className="flex-1">
                Reset
              </Button>
              <Button onClick={applyFilters} className="flex-1">
                Apply
              </Button>
            </div>
          </div>
        )}

        {/* Click outside to close filters */}
        {isFiltersOpen && (
          <div className="fixed inset-0 z-[998]" onClick={() => setIsFiltersOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default UserPage;
