import { RealTimeShipUpdateDTO } from '@/types/types';
import { getVesselIcon } from '@/utils/vesselIcon';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';

interface MapComponentProps {
    initialVessels: RealTimeShipUpdateDTO[];
    onMapReady: (map: L.Map) => void;
    onVesselClick: (vessel: RealTimeShipUpdateDTO) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ initialVessels, onMapReady, onVesselClick }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const vesselMarkersRef = useRef<Map<string, L.Marker>>(new Map());

    // Συνάρτηση για προσθήκη/ενημέρωση marker (μεταφέρθηκε εδώ)
    const addOrUpdateVesselMarker = (vessel: RealTimeShipUpdateDTO) => {
        if (!mapInstanceRef.current || vessel.latitude == null || vessel.longitude == null) {
            return;
        }
        const vesselType = vessel.shiptype ? vessel.shiptype.toLowerCase() : 'unknown';
        const vesselStatusCode = vessel.navigationalStatus?.toString() ?? 'unknown';
        const icon = getVesselIcon(vesselType, vesselStatusCode, vessel.trueHeading);
        const lastUpdated = new Date(vessel.timestampEpoch * 1000).toLocaleString();

        const popupContent = `...`; // (Ο ίδιος popupContent που είχατε)

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

        marker.off('click').on('click', () => onVesselClick(vessel));
    };


    // Αρχικοποίηση χάρτη
    useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            const map = L.map(mapRef.current, {
                // ... map options ...
            }).setView([37.9, 23.0], 7);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
            }).addTo(map);

            mapInstanceRef.current = map;
            onMapReady(map); // Ενημέρωση του γονέα ότι ο χάρτης είναι έτοιμος
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        }
    }, [onMapReady]);

    // Ενημέρωση markers όταν αλλάζουν τα δεδομένα
    useEffect(() => {
        initialVessels.forEach(addOrUpdateVesselMarker);
    }, [initialVessels]);


    return <div ref={mapRef} className="h-full w-full z-10" />;
};

export default MapComponent;