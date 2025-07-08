// src/components/map/MapComponent.tsx

import { RealTimeShipUpdateDTO } from '@/types/types';
import { getVesselIcon } from '@/utils/vesselIcon';
import { getVesselStatusDescription } from '@/utils/vesselUtils';
import { Anchor, Compass, Gauge, Ship as ShipIcon, Wind } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export interface MapComponentRef {
    addOrUpdateVessel: (vessel: RealTimeShipUpdateDTO) => void;
}

interface MapComponentProps {
    selectedVessel: RealTimeShipUpdateDTO | null;
    onMapReady: (map: L.Map) => void;
    onVesselClick: (vessel: RealTimeShipUpdateDTO | null) => void;
}

const createPopupHtml = (vessel: RealTimeShipUpdateDTO): string => {
    // Helper function που παίρνει ένα JSX icon και το μετατρέπει σε HTML string.
    const iconToHtml = (icon: React.ReactElement) => renderToStaticMarkup(icon);

    const detailRow = (iconHtml: string, label: string, value: string | number) => (
        `<div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee;">
            <div style="display: flex; align-items: center; font-size: 13px; color: #555;">
                ${iconHtml}
                <span style="margin-left: 8px;">${label}</span>
            </div>
            <div style="font-size: 13px; font-weight: 600; color: #333;">${value}</div>
        </div>`
    );

    const vesselTypeHtml = `<span style="text-transform: capitalize;">${vessel.shiptype || 'Unknown'}</span>`;
    const speedHtml = `${vessel.speedOverGround?.toFixed(1) ?? 'N/A'} kn`;
    const courseHtml = `${vessel.courseOverGround?.toFixed(1) ?? 'N/A'} °`;
    const headingHtml = `${vessel.trueHeading !== 511 ? vessel.trueHeading + ' °' : 'N/A'}`;
    const statusHtml = getVesselStatusDescription(vessel.navigationalStatus);
    const lastUpdateHtml = new Date(vessel.timestampEpoch * 1000).toLocaleString();

    return `
      <div style="width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="background-color: #1e293b; color: white; padding: 12px; border-radius: 8px 8px 0 0;">
          <h4 style="margin: 0; font-size: 16px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            Vessel: ${vessel.mmsi}
          </h4>
        </div>
        <div style="padding: 8px 12px 12px 12px; background: white;">
          ${detailRow(iconToHtml(<ShipIcon size={16} />), "Type", vesselTypeHtml)}
          ${detailRow(iconToHtml(<Gauge size={16} />), "Speed", speedHtml)}
          ${detailRow(iconToHtml(<Wind size={16} />), "Course", courseHtml)}
          ${detailRow(iconToHtml(<Compass size={16} />), "Heading", headingHtml)}
          ${detailRow(iconToHtml(<Anchor size={16} />), "Status", statusHtml)}
          <div style="margin-top: 10px; text-align: center; font-size: 11px; color: #999;">
            Last Update: ${lastUpdateHtml}
          </div>
        </div>
      </div>
    `;
};


const MapComponent = forwardRef<MapComponentRef, MapComponentProps>(
    ({ selectedVessel, onMapReady, onVesselClick }, ref) => {
        const mapRef = useRef<HTMLDivElement>(null);
        const mapInstanceRef = useRef<L.Map | null>(null);
        const vesselMarkersRef = useRef<Map<string, L.Marker>>(new Map());

        const addOrUpdateVesselMarker = (vessel: RealTimeShipUpdateDTO) => {
            if (!mapInstanceRef.current || vessel.latitude == null || vessel.longitude == null) return;

            const icon = getVesselIcon(vessel.shiptype?.toLowerCase() || 'unknown', vessel.navigationalStatus?.toString() ?? 'unknown', vessel.trueHeading);
            const popupContent = createPopupHtml(vessel);
            let marker = vesselMarkersRef.current.get(vessel.mmsi);

            if (marker) {
                marker.setLatLng([vessel.latitude, vessel.longitude]);
                marker.setIcon(icon);
                marker.setPopupContent(popupContent);
            } else {
                marker = L.marker([vessel.latitude, vessel.longitude], { icon })
                    .addTo(mapInstanceRef.current)
                    .bindPopup(popupContent, { minWidth: 280 });
                vesselMarkersRef.current.set(vessel.mmsi, marker);
            }
            marker.off('click').on('click', () => onVesselClick(vessel));
        };

        useImperativeHandle(ref, () => ({
            addOrUpdateVessel(vessel: RealTimeShipUpdateDTO) {
                addOrUpdateVesselMarker(vessel);
            }
        }));

        useEffect(() => {
            if (mapRef.current && !mapInstanceRef.current) {
                const map = L.map(mapRef.current).setView([49.0, 0.0], 5);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap © CARTO'
                }).addTo(map);
                mapInstanceRef.current = map;
                onMapReady(map);
                map.on('popupclose', () => onVesselClick(null));
            }
        }, [onMapReady, onVesselClick]);

        useEffect(() => {
            if (!mapInstanceRef.current || !selectedVessel) {
                mapInstanceRef.current?.closePopup();
                return;
            }
            const marker = vesselMarkersRef.current.get(selectedVessel.mmsi);
            if (marker) marker.openPopup();
        }, [selectedVessel]);

        return <div ref={mapRef} className="h-full w-full z-10" />;
    });

export default MapComponent;