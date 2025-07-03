import { Vessel } from '@/types/types';
import { getVesselIcon } from '@/utils/vesselIcon';
import { Client } from '@stomp/stompjs';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';

const Index: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [coordinates, setCoordinates] = useState('Hover over the map to display coordinates');
  const vesselMarkersRef = useRef<Map<string, L.Marker>>(new Map()); // Changed to use MMSI as key
  const stompClientRef = useRef<Client | null>(null); // Ref to hold the client instance

  // WebSocket connection and vessel state
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
        maxBoundsViscosity: 1.0,
      }).setView([37.9, 23.0], 7);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      map.on('mousemove', (e) => {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        setCoordinates(`Latitude: ${lat}, Longitude: ${lng}`);
      });

      map.on('mouseout', () => {
        setCoordinates('Hover over the map to display coordinates');
      });

      map.invalidateSize();
    }

    // Initialize and activate the STOMP client
    if (!stompClientRef.current) {
      stompClientRef.current = new Client({
        webSocketFactory: () => new SockJS('https://localhost:8443/ws-ais'),
        reconnectDelay: 5000,
        debug: () => {},
      });

      stompClientRef.current.onConnect = () => {
        // Subscribe to the topic where backend broadcasts vessel updates
        stompClientRef.current?.subscribe('/topic/ais-updates', (message) => {
          const vessel: Vessel = JSON.parse(message.body);

          // Determine vessel type and status from navigationalStatus
          const vesselType = getVesselTypeFromData(vessel);
          const vesselStatus = getVesselStatusFromData(vessel);

          // Add or update marker
          if (mapInstanceRef.current) {
            let marker = vesselMarkersRef.current.get(vessel.mmsi);
            if (marker) {
              marker.setLatLng([vessel.latitude, vessel.longitude]);
              marker.setIcon(getVesselIcon(vesselType, vesselStatus, vessel.trueHeading));
            } else {
              marker = L.marker([vessel.latitude, vessel.longitude], {
                icon: getVesselIcon(vesselType, vesselStatus, vessel.trueHeading),
              }).addTo(mapInstanceRef.current);
              marker.bindPopup(`
                <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
                  <h4 style="margin: 0 0 8px 0; color: #1f2937; display: flex; items-center; gap: 8px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="3,11 22,2 13,21 11,13 3,11"></polygon>
                    </svg>
                    Vessel ${vessel.mmsi}
                  </h4>
                  <div style="font-size: 12px; line-height: 1.4; color: #374151;">
                    <div style="margin-bottom: 4px;"><strong>MMSI:</strong> ${vessel.mmsi}</div>
                    <div style="margin-bottom: 4px;"><strong>Status:</strong> ${vesselStatus}</div>
                    <div style="margin-bottom: 4px;"><strong>Speed:</strong> ${vessel.speedOverGround.toFixed(1)} knots</div>
                    <div style="margin-bottom: 4px;"><strong>Heading:</strong> ${vessel.trueHeading !== 511 ? vessel.trueHeading + '°' : 'N/A'}</div>
                    <div style="margin-bottom: 4px;"><strong>Course:</strong> ${vessel.courseOverGround.toFixed(1)}°</div>
                    <div><strong>Last Updated:</strong> ${new Date(vessel.timestampEpoch).toLocaleString()}</div>
                  </div>
                </div>
              `);
              vesselMarkersRef.current.set(vessel.mmsi, marker);
            }
          }
        });
      };

      stompClientRef.current.activate();
    }

    return () => {
      // Deactivate the client on component unmount
      if (stompClientRef.current?.active) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }

      // Cleanup markers and map
      vesselMarkersRef.current.forEach((marker) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(marker);
        }
      });
      vesselMarkersRef.current.clear();

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Helper function to determine vessel type from AIS data
  const getVesselTypeFromData = (vessel: Vessel): string => {
    // This is a placeholder - you'll need to implement actual logic based on your needs
    // if (vessel.mmsi == '2115') {
    //   return 'fishing'; // Example for a specific MMSI prefix
    // }

    return 'cargo'; // Default type
  };

  // Helper function to determine vessel status from navigationalStatus code
  const getVesselStatusFromData = (vessel: Vessel): string => {
    // Based on AIS navigational status codes
    switch (vessel.navigationalStatus) {
      case 0:
        return 'underway';
      case 1:
        return 'at anchor';
      case 2:
        return 'not under command';
      case 3:
        return 'restricted maneuverability';
      case 4:
        return 'constrained by draft';
      case 5:
        return 'moored';
      case 6:
        return 'aground';
      case 7:
        return 'fishing';
      case 8:
        return 'sailing';
      default:
        return 'unknown';
    }
  };

  return (
    <div className="flex w-screen">
      <div className="relative w-full flex-1">
        <div id="map" ref={mapRef} className="h-[89vh] w-full"></div>
        <div
          id="coordinates"
          className="w-240 absolute bottom-2.5 left-1/2 z-[999] -translate-x-1/2 transform whitespace-nowrap rounded border border-white/30 bg-black/60 px-2.5 text-center text-xs font-medium text-white shadow-md"
        >
          {coordinates}
        </div>
      </div>
    </div>
  );
};

export default Index;
