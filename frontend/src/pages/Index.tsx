import {RealTimeShipUpdateDTO, ShipDetailsDTO} from '@/types/types';
import { getVesselIcon } from '@/utils/vesselIcon';
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';

const Index: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [coordinates, setCoordinates] = useState('Hover over the map for coordinates');
  const vesselMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const stompClientRef = useRef<Client | null>(null);

  // #region Helper Functions (No changes needed to internal logic)
  const getVesselTypeFromData = (vessel: RealTimeShipUpdateDTO): string => {
    return vessel.shiptype ? vessel.shiptype.toLowerCase() : 'unknown';
  };
  const getVesselStatusCode = (vessel: RealTimeShipUpdateDTO): string => {
    return vessel.navigationalStatus?.toString() ?? 'unknown';
  };
  // const getVesselStatusDescription = (vessel: RealTimeShipUpdateDTO): string => {
  //   switch (vessel.navigationalStatus) {
  //     case 0:
  //       return 'Under way using engine';
  //     case 1:
  //       return 'At anchor';
  //     case 2:
  //       return 'Not under command';
  //     case 3:
  //       return 'Restricted manoeuverability';
  //     case 4:
  //       return 'Constrained by her draught';
  //     case 5:
  //       return 'Moored';
  //     case 6:
  //       return 'Aground';
  //     case 7:
  //       return 'Engaged in Fishing';
  //     case 8:
  //       return 'Under way sailing';
  //     case 15:
  //       return 'Not defined'; // Standard AIS code for 15
  //     default:
  //       return `Unknown (${vessel.navigationalStatus ?? 'N/A'})`;
  //   }
  // };
  // #endregion

  const addOrUpdateVesselMarker = (vessel: RealTimeShipUpdateDTO) => {
    if (!mapInstanceRef.current || vessel.latitude == null || vessel.longitude == null) {
      return;
    }

    const vesselType = getVesselTypeFromData(vessel);
    const vesselStatusCode = getVesselStatusCode(vessel);
    // const vesselStatusDescription = getVesselStatusDescription(vessel);
    const icon = getVesselIcon(vesselType, vesselStatusCode, vessel.trueHeading);

    const lastUpdated = new Date(vessel.timestampEpoch * 1000).toLocaleString();

    // The vessel's name or MMSI if name is not available
    const vesselName = `Vessel ${vessel.mmsi}`;

    // The popup is now styled with Tailwind CSS classes for a modern look
    const popupContent = `
      <div class="font-sans w-64 -m-1">
        <div class="bg-slate-700 text-white p-3 rounded-t-lg">
          <h4 class="font-bold text-lg truncate">${vesselName}</h4>
          <p class="text-xs text-slate-300">MMSI: ${vessel.mmsi}</p>
        </div>
        <div class="p-3 bg-white rounded-b-lg text-sm text-slate-800 grid grid-cols-2 gap-x-4 gap-y-2">
            

            <strong class="text-slate-500">Speed:</strong>
            <span>${vessel.speedOverGround.toFixed(1)} kn</span>

            <strong class="text-slate-500">Heading:</strong>
            <span>${vessel.trueHeading !== 511 ? vessel.trueHeading + '°' : 'N/A'}</span>

            <strong class="text-slate-500">Course:</strong>
            <span>${vessel.courseOverGround.toFixed(1)}°</span>

            <strong class="text-slate-500">Type:</strong>
            <span class="capitalize truncate">${vesselType}</span>
            
            <div class="col-span-2 mt-2 pt-2 border-t border-slate-200 text-xs text-slate-400">
              Last update: ${lastUpdated}
            </div>
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
        .bindPopup(popupContent, { offset: [0, -10] }); // Adjust offset for better pointer position
      vesselMarkersRef.current.set(vessel.mmsi, marker);
    }
  };

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
        maxBoundsViscosity: 1.0,
        zoomControl: false, // We can add a custom styled one if needed
      }).setView([49.0, 0.0], 7);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;

      map.on('mousemove', (e) =>
        setCoordinates(`Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`)
      );
      map.on('mouseout', () => setCoordinates('Hover over the map for coordinates'));
      map.invalidateSize();
    }

    const fetchInitialVessels = async () => {
      try {
        // Use the correct DTO for the initial fetch
        const response = await axios.get<ShipDetailsDTO[]>('/api/ship-data/active-ships');

        // Now, you need to handle the fact that you're getting ShipDetailsDTO
        // and your marker function might expect RealTimeShipUpdateDTO.
        // The best way is to convert or "map" it.

        response.data.forEach(shipDetail => {
          // Convert ShipDetailsDTO to the format your marker function expects
          const vesselUpdate: RealTimeShipUpdateDTO = {
            mmsi: shipDetail.mmsi.toString(), // Convert number to string
            shiptype: shipDetail.shiptype,
            navigationalStatus: shipDetail.navigationalStatus,
            speedOverGround: shipDetail.speedOverGround,
            courseOverGround: shipDetail.courseOverGround,
            trueHeading: shipDetail.trueHeading,
            longitude: shipDetail.longitude,
            latitude: shipDetail.latitude,
            timestampEpoch: shipDetail.lastUpdateTimestampEpoch
          };

          // Now call your existing function with the correctly formatted object
          addOrUpdateVesselMarker(vesselUpdate);
        });

      } catch (error) {
        console.error('Error fetching initial vessel data:', error);
      }
    };
    fetchInitialVessels();

    if (!stompClientRef.current) {
      const client = new Client({
        webSocketFactory: () => new SockJS('/ws-ais'),
        reconnectDelay: 5000,
        debug: () => {},
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
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative flex flex-1">
      <div ref={mapRef} data-testid="map-container" className="h-full w-full z-[10]" />
      <div
        id="coordinates"
        className="absolute bottom-4 left-1/2 z-[999] -translate-x-1/2 transform whitespace-nowrap rounded-md bg-slate-800/80 px-3 py-1.5 text-center font-mono text-xs text-white shadow-lg backdrop-blur-sm"
      >
        {coordinates}
      </div>
    </div>
  );
};

export default Index;
