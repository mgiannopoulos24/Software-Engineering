import { IndexNavbar } from '@/components/layout/IndexNavbar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';

const Index: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [coordinates, setCoordinates] = useState('Hover over the map to display coordinates');

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Initialize the map
      const map = L.map(mapRef.current).setView([37.9, 23.0], 7);

      // Add the OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        // attribution:
        //   '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col">
      <IndexNavbar />
      <div className="relative w-full flex-1">
        <div id="map" ref={mapRef} className="h-full w-full"></div>
        <div
          id="coordinates"
          className="w-240 absolute bottom-2.5 left-1/2 z-[999] -translate-x-1/2 transform overflow-hidden whitespace-nowrap rounded border border-white/30 bg-black/60 px-2.5 py-0.5 text-center text-xs font-medium text-white shadow-md"
        >
          {coordinates}
        </div>
      </div>
    </div>
  );
};

export default Index;
