// Index.tsx

import { RealTimeShipUpdateDTO } from '@/types/types';
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
  const vesselMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const stompClientRef = useRef<Client | null>(null);

  // #region Helper Functions
  // Helper to determine vessel type from AIS data. Now handles 'shiptype' and is case-insensitive.
  const getVesselTypeFromData = (vessel: RealTimeShipUpdateDTO): string => {
    const type = vessel.shiptype ? vessel.shiptype.toLowerCase() : 'unknown';
    switch (vessel.shiptype) {
      case 'anti-pollution':
        return 'anti-pollution';
      case 'cargo':
        return 'cargo';
      case 'cargo-hazarda(major)':
        return 'cargo-hazarda(major)';
      case 'cargo-hazardb':
        return 'cargo-hazardb';
      case 'cargo-hazardc(minor)':
        return 'cargo-hazardc(minor)';
      case 'cargo-hazardd(recognizable)':
        return 'cargo-hazardd(recognizable)';
      case 'divevessel':
        return 'divevessel';
      case 'dredger':
        return 'dredger';
      case 'fishing':
        return 'fishing';
      case 'high-speedcraft':
        return 'high-speedcraft';
      case 'lawenforce':
        return 'lawenforce';
      case 'localvessel':
        return 'localvessel';
      case 'militaryops':
        return 'militaryops';
      case 'other':
        return 'other';
      case 'passenger':
        return 'passenger';
      case 'pilotvessel':
        return 'pilotvessel';
      case 'pleasurecraft':
        return 'pleasurecraft';
      case 'sailingvessel':
        return 'sailingvessel';
      case 'sar':
        return 'sar';
      case 'specialcraft':
        return 'specialcraft';
      case 'tanker':
        return 'tanker';
      case 'tanker-hazarda(major)':
        return 'tanker-hazarda(major)';
      case 'tanker-hazardb':
        return 'tanker-hazardb';
      case 'tanker-hazardc(minor)':
        return 'tanker-hazardc(minor)';
      case 'tanker-hazardd(recognizable)':
        return 'tanker-hazardd(recognizable)';
      case 'tug':
        return 'tug';
      case 'wingingrnd':
        return 'wingingrnd';
      default:
        return 'unknown';
    }
  };

  // Helper to get the status code as a string, likely for the getVesselIcon function.
  const getVesselStatusCode = (vessel: RealTimeShipUpdateDTO): string => {
    return vessel.navigationalStatus?.toString() ?? 'unknown';
  };

  // New helper for user-friendly status text in popups.
  const getVesselStatusDescription = (vessel: RealTimeShipUpdateDTO): string => {
    switch (vessel.navigationalStatus) {
      case 0: return 'Under way using engine';
      case 1: return 'At anchor';
      case 2: return 'Not under command';
      case 3: return 'Restricted manoeuverability';
      case 4: return 'Constrained by her draught';
      case 5: return 'Moored';
      case 6: return 'Aground';
      case 7: return 'Engaged in Fishing';
      case 8: return 'Under way sailing';
      case 15: return 'Not defined'; // Standard AIS code for 15
      default: return `Unknown (${vessel.navigationalStatus ?? 'N/A'})`;
    }
  };

  // Refactored function to add or update a vessel marker, removing code duplication.
  const addOrUpdateVesselMarker = (vessel: RealTimeShipUpdateDTO) => {
    if (!mapInstanceRef.current || vessel.latitude == null || vessel.longitude == null) {
      return;
    }

    const vesselType = getVesselTypeFromData(vessel);
    const vesselStatusCode = getVesselStatusCode(vessel);
    const vesselStatusDescription = getVesselStatusDescription(vessel);
    const icon = getVesselIcon(vesselType, vesselStatusCode, vessel.trueHeading);
    
    // FIX: Convert epoch seconds to milliseconds for JavaScript's Date object.
    const lastUpdated = new Date(vessel.timestampEpoch * 1000).toLocaleString();

    const popupContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
        <h4 style="margin: 0 0 8px 0; color: #1f2937; display: flex; align-items: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3,11 22,2 13,21 11,13 3,11"></polygon>
          </svg>
          RealTimeShipUpdateDTO ${vessel.mmsi}
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
      // Update existing marker
      marker.setLatLng([vessel.latitude, vessel.longitude]);
      marker.setIcon(icon);
      marker.setPopupContent(popupContent); // Update popup content as well
    } else {
      // Create new marker
      marker = L.marker([vessel.latitude, vessel.longitude], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(popupContent);
      vesselMarkersRef.current.set(vessel.mmsi, marker);
    }
  };
  // #endregion

  useEffect(() => {
    // --- 1. Map Initialization ---
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
        maxBoundsViscosity: 1.0,
      }).setView([37.9, 23.0], 7);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);
      
      mapInstanceRef.current = map;

      map.on('mousemove', (e) => setCoordinates(`Latitude: ${e.latlng.lat.toFixed(6)}, Longitude: ${e.latlng.lng.toFixed(6)}`));
      map.on('mouseout', () => setCoordinates('Hover over the map to display coordinates'));
      map.invalidateSize();
    }

    // --- 2. Initial Data Fetch ---
    const fetchInitialVessels = async () => {
      try {
        const response = await fetch('https://localhost:8443/api/ship-data/active-ships');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const vessels: RealTimeShipUpdateDTO[] = await response.json();
        vessels.forEach(addOrUpdateVesselMarker);
      } catch (error) {
        console.error('Error fetching initial vessel data:', error);
      }
    };
    fetchInitialVessels();

    // --- 3. WebSocket Connection ---
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

    // --- 4. Cleanup Logic ---
    return () => {
      if (stompClientRef.current?.active) {
        stompClientRef.current.deactivate();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once.

  return (
    <div className="flex w-screen">
      <div className="relative w-full flex-1">
        <div id="map" ref={mapRef} className="h-[89vh] w-full"></div>
        <div
          id="coordinates"
          className="absolute bottom-2.5 left-1/2 z-[999] -translate-x-1/2 transform whitespace-nowrap rounded border border-white/30 bg-black/60 px-2.5 py-1 text-center text-xs font-medium text-white shadow-md"
        >
          {coordinates}
        </div>
      </div>
    </div>
  );
};

export default Index;