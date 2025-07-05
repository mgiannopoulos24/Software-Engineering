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
import { FilterValue, RealTimeShipUpdateDTO } from '@/types/types';
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
import { getVesselIcon } from '@/utils/vesselIcon';
import { Client } from '@stomp/stompjs';
import L from 'leaflet';
import { Settings2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';

const UserPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vesselMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const stompClientRef = useRef<Client | null>(null);
  const [coordinates, setCoordinates] = useState('Hover over the map to display coordinates');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<RealTimeShipUpdateDTO | null>(null);
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

  // #region Helper Functions
  const getVesselTypeFromData = (vessel: RealTimeShipUpdateDTO): string => {
    return vessel.shiptype ? vessel.shiptype.toLowerCase() : 'unknown';
  };

  const getVesselStatusCode = (vessel: RealTimeShipUpdateDTO): string => {
    return vessel.navigationalStatus?.toString() ?? 'unknown';
  };

  const getVesselStatusDescription = (vessel: RealTimeShipUpdateDTO): string => {
    switch (vessel.navigationalStatus) {
      case 0:
        return 'Under way using engine';
      case 1:
        return 'At anchor';
      case 2:
        return 'Not under command';
      case 3:
        return 'Restricted manoeuverability';
      case 4:
        return 'Constrained by her draught';
      case 5:
        return 'Moored';
      case 6:
        return 'Aground';
      case 7:
        return 'Engaged in Fishing';
      case 8:
        return 'Under way sailing';
      case 15:
        return 'Not defined';
      default:
        return `Unknown (${vessel.navigationalStatus ?? 'N/A'})`;
    }
  };

  const addOrUpdateVesselMarker = (vessel: RealTimeShipUpdateDTO) => {
    if (!mapInstanceRef.current || vessel.latitude == null || vessel.longitude == null) {
      return;
    }

    const vesselType = getVesselTypeFromData(vessel);
    const vesselStatusCode = getVesselStatusCode(vessel);
    const vesselStatusDescription = getVesselStatusDescription(vessel);
    const icon = getVesselIcon(vesselType, vesselStatusCode, vessel.trueHeading);

    const lastUpdated = new Date(vessel.timestampEpoch * 1000).toLocaleString();

    const popupContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
        <h4 style="margin: 0 0 8px 0; color: #1f2937; display: flex; align-items: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3,11 22,2 13,21 11,13 3,11"></polygon>
          </svg>
          ${`Vessel ${vessel.mmsi}`}
        </h4>
        <div style="font-size: 12px; line-height: 1.4; color: #374151;">
          <div style="margin-bottom: 4px;"><strong>MMSI:</strong> ${vessel.mmsi}</div>
          <div style="margin-bottom: 4px;"><strong>Status:</strong> ${vesselStatusDescription}</div>
          <div style="margin-bottom: 4px;"><strong>Speed:</strong> ${vessel.speedOverGround.toFixed(1)} knots</div>
          <div style="margin-bottom: 4px;"><strong>Heading:</strong> ${vessel.trueHeading !== 511 ? vessel.trueHeading + '°' : 'N/A'}</div>
          <div style="margin-bottom: 4px;"><strong>Course:</strong> ${vessel.courseOverGround.toFixed(1)}°</div>
          <div><strong>Last Updated:</strong> ${lastUpdated}</div>
        </div>
      </div>
    `;

    let marker = vesselMarkersRef.current.get(vessel.mmsi);

    if (marker) {
      marker.setLatLng([vessel.latitude, vessel.longitude]);
      marker.setIcon(icon);
      marker.setPopupContent(popupContent);
    } else {
      marker = L.marker([vessel.latitude, vessel.longitude], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(popupContent);
      vesselMarkersRef.current.set(vessel.mmsi, marker);
    }

    marker.off('click').on('click', () => {
      setSelectedVessel(vessel);
    });
  };
  // #endregion

  // Fetch user's existing zone of interest on component mount
  useEffect(() => {
    const fetchUserZone = async () => {
      try {
        const response = await fetch('https://localhost:8443/api/zone/mine', {
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

      // Ensure map takes up full container size
      map.invalidateSize();
    }

    // --- Initial Data Fetch ---
    const fetchInitialVessels = async () => {
      try {
        const response = await fetch('https://localhost:8443/api/ship-data/active-ships');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const vessels: RealTimeShipUpdateDTO[] = await response.json();
        vessels.forEach(addOrUpdateVesselMarker);
      } catch (error) {
        console.error('Error fetching initial vessel data:', error);
        toast({
          title: 'Error',
          description: 'Could not fetch initial vessel data.',
          variant: 'destructive',
        });
      }
    };

    // We need the map to be initialized before we can draw the vessels
    const checkMapAndFetchVessels = () => {
      if (mapInstanceRef.current) {
        fetchInitialVessels();
      } else {
        setTimeout(checkMapAndFetchVessels, 100); // Retry after a short delay
      }
    };

    checkMapAndFetchVessels();

    // --- WebSocket Connection ---
    if (!stompClientRef.current) {
      const client = new Client({
        webSocketFactory: () => new SockJS('https://localhost:8443/ws-ais'),
        reconnectDelay: 5000,
        debug: () => {}, // Disable console logging for STOMP
      });

      client.onConnect = () => {
        client.subscribe('/topic/ais-updates', (message) => {
          try {
            const vessel: RealTimeShipUpdateDTO = JSON.parse(message.body);
            addOrUpdateVesselMarker(vessel);
          } catch (e) {
            console.error('Failed to parse vessel update from WebSocket:', e);
          }
        });
      };

      client.activate();
      stompClientRef.current = client;
    }

    return () => {
      if (stompClientRef.current?.active) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      // The map instance is cleaned up in a separate useEffect to avoid conflicts
    };
  }, []);

  useEffect(() => {
    // This separate useEffect handles the map instance cleanup.
    return () => {
      if (mapInstanceRef.current) {
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

    // This function will need to be adapted to work with the live data
    // For now, it will not do anything as mockVessels is removed.
    toast({
      title: 'Filter Not Implemented',
      description: 'Filtering live data is not yet implemented.',
    });

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
        const response = await fetch('https://localhost:8443/api/zone/mine', {
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
        const response = await fetch('https://localhost:8443/api/zone/mine', {
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
    // <div className="flex f">
      <div className="relative w-full flex-1">
        <div id="map" ref={mapRef} className="h-full w-full z-10"></div>

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
                    {`Vessel ${selectedVessel.mmsi}`}
                  </div>
                  <pre className="text-xs">
                    {`{
  "latitude": ${selectedVessel.latitude?.toFixed(6)},
  "longitude": ${selectedVessel.longitude?.toFixed(6)},
  "timestamp": "${new Date(selectedVessel.timestampEpoch * 1000).toISOString()}"
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
    // </div>
  );
};

export default UserPage;
