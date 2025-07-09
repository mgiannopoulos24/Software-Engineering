import { RealTimeShipUpdateDTO, TrackPointDTO } from '@/types/types';
import { getVesselIcon } from '@/utils/vesselIcon';
import { getVesselStatusDescription } from '@/utils/vesselUtils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Anchor,
  Bookmark,
  BookmarkX,
  Compass,
  Gauge,
  History,
  Loader2,
  MapPin,
  Ship as ShipIcon,
  Wind,
} from 'lucide-react';
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export interface MapComponentRef {
  zoomToTrack: () => void;
}

interface MapComponentProps {
  vessels: RealTimeShipUpdateDTO[];
  selectedVessel: RealTimeShipUpdateDTO | null;
  onMapReady: (map: L.Map) => void;
  onVesselClick: (vessel: RealTimeShipUpdateDTO | null) => void;
  trackData: TrackPointDTO[];
  currentTrackMmsi: string | null;
  isTrackLoading: boolean;
  onShowTrackRequest: (mmsi: string) => void;
  onHideTrackRequest: () => void;
  isShipInFleet: (mmsi: string) => boolean;
  onAddToFleet: (mmsi: number) => void;
  onRemoveFromFleet: (mmsi: number) => void;
  isAuthenticated: boolean;
}

const createPopupHtml = (
  vessel: RealTimeShipUpdateDTO,
  isTrackShown: boolean,
  isTrackLoading: boolean,
  isBookmarked: boolean,
  isAuthenticated: boolean
): string => {
  const iconToHtml = (icon: React.ReactElement) => renderToStaticMarkup(icon);

  const detailRow = (iconHtml: string, label: string, value: string | number) =>
    `<div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee;">
            <div style="display: flex; align-items: center; font-size: 13px; color: #555;">
                ${iconHtml}
                <span style="margin-left: 8px;">${label}</span>
            </div>
            <div style="font-size: 13px; font-weight: 600; color: #333;">${value}</div>
        </div>`;

  const vesselTypeHtml = `<span style="text-transform: capitalize;">${vessel.shiptype || 'Unknown'}</span>`;
  const speedHtml = `${vessel.speedOverGround?.toFixed(1) ?? 'N/A'} kn`;
  const courseHtml = `${vessel.courseOverGround?.toFixed(1) ?? 'N/A'} °`;
  const headingHtml = `${vessel.trueHeading !== 511 ? vessel.trueHeading + ' °' : 'N/A'}`;
  const statusHtml = getVesselStatusDescription(vessel.navigationalStatus);
  const lastUpdateHtml = new Date(vessel.timestampEpoch * 1000).toLocaleString();

  const positionHtml = `Lat: ${vessel.latitude?.toFixed(4) ?? 'N/A'}, Lon: ${vessel.longitude?.toFixed(4) ?? 'N/A'}`;

  let trackButtonHtml = '';
  if (isTrackLoading) {
    trackButtonHtml = `
            <button class="action-button loading" disabled>
                ${iconToHtml(<Loader2 size={16} className="animate-spin" />)}
                <span>Loading...</span>
            </button>`;
  } else if (isTrackShown) {
    trackButtonHtml = `
            <button id="hide-track-btn-${vessel.mmsi}" class="action-button hide">
                ${iconToHtml(<History size={16} />)}
                <span>Hide Track</span>
            </button>`;
  } else {
    trackButtonHtml = `
            <button id="show-track-btn-${vessel.mmsi}" class="action-button show">
                ${iconToHtml(<History size={16} />)}
                <span>Show 12h Track</span>
            </button>`;
  }

  let fleetButtonHtml = '';
  if (isAuthenticated) {
    if (isBookmarked) {
      fleetButtonHtml = `
                <button id="remove-fleet-btn-${vessel.mmsi}" class="action-button bookmark-remove">
                    ${iconToHtml(<BookmarkX size={16} />)}
                    <span>Remove from Fleet</span>
                </button>`;
    } else {
      fleetButtonHtml = `
                <button id="add-fleet-btn-${vessel.mmsi}" class="action-button bookmark-add">
                    ${iconToHtml(<Bookmark size={16} />)}
                    <span>Add to Fleet</span>
                </button>`;
    }
  }

  return `
      <style>
        .action-button { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 8px; margin-top: 8px; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background-color 0.2s; }
        .action-button.show { background-color: #2563eb; color: white; }
        .action-button.show:hover { background-color: #1d4ed8; }
        .action-button.hide { background-color: #e11d48; color: white; }
        .action-button.hide:hover { background-color: #be123c; }
        .action-button.loading { background-color: #64748b; color: white; cursor: not-allowed; }
        .action-button.bookmark-add { background-color: #059669; color: white; }
        .action-button.bookmark-add:hover { background-color: #047857; }
        .action-button.bookmark-remove { background-color: #f97316; color: white; }
        .action-button.bookmark-remove:hover { background-color: #ea580c; }
      </style>
      <div style="width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="background-color: #1e293b; color: white; padding: 12px; border-radius: 8px 8px 0 0;">
          <h4 style="margin: 0; font-size: 16px; font-weight: bold;">Vessel: ${vessel.mmsi}</h4>
        </div>
        <div style="padding: 8px 12px 12px 12px; background: white;">
            ${detailRow(iconToHtml(<MapPin size={16} />), 'Position', positionHtml)}
            ${detailRow(iconToHtml(<ShipIcon size={16} />), 'Type', vesselTypeHtml)}
            ${detailRow(iconToHtml(<Gauge size={16} />), 'Speed', speedHtml)}
            ${detailRow(iconToHtml(<Wind size={16} />), 'Course', courseHtml)}
            ${detailRow(iconToHtml(<Compass size={16} />), 'Heading', headingHtml)}
            ${detailRow(iconToHtml(<Anchor size={16} />), 'Status', statusHtml)}
            <div style="border-top: 1px solid #eee; margin-top: 8px; padding-top: 4px;">
              ${trackButtonHtml}
              ${fleetButtonHtml}
            </div>
            <div style="margin-top: 10px; text-align: center; font-size: 11px; color: #999;">Last Update: ${lastUpdateHtml}</div>
        </div>
      </div>
    `;
};

const MapComponent = forwardRef<MapComponentRef, MapComponentProps>(
  (
    {
      vessels,
      selectedVessel,
      onMapReady,
      onVesselClick,
      trackData,
      currentTrackMmsi,
      onShowTrackRequest,
      onHideTrackRequest,
      isTrackLoading,
      isShipInFleet,
      onAddToFleet,
      onRemoveFromFleet,
      isAuthenticated,
    },
    ref
  ) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const vesselMarkersRef = useRef<Map<string, L.Marker>>(new Map());
    const trackLineRef = useRef<L.Polyline | null>(null);

    const zoomToTrack = () => {
      if (mapInstanceRef.current && trackLineRef.current) {
        mapInstanceRef.current.fitBounds(trackLineRef.current.getBounds().pad(0.1));
      }
    };

    useImperativeHandle(ref, () => ({
      zoomToTrack,
    }));

    useEffect(() => {
      if (!mapInstanceRef.current) return;

      const map = mapInstanceRef.current;
      const displayedVesselsMmsi = new Set(vessels.map((v) => v.mmsi));

      vesselMarkersRef.current.forEach((marker, mmsi) => {
        if (!displayedVesselsMmsi.has(mmsi)) {
          map.removeLayer(marker);
          vesselMarkersRef.current.delete(mmsi);
        }
      });

      vessels.forEach((vessel) => {
        if (vessel.latitude == null || vessel.longitude == null) return;

        const icon = getVesselIcon(
          vessel.shiptype?.toLowerCase() || 'unknown',
          vessel.navigationalStatus?.toString() ?? 'unknown',
          vessel.trueHeading
        );
        let marker = vesselMarkersRef.current.get(vessel.mmsi);

        if (marker) {
          marker.setLatLng([vessel.latitude, vessel.longitude]);
          marker.setIcon(icon);
        } else {
          marker = L.marker([vessel.latitude, vessel.longitude], { icon }).addTo(map);
          vesselMarkersRef.current.set(vessel.mmsi, marker);
        }
        marker.off('click').on('click', () => onVesselClick(vessel));
      });
    }, [vessels, onVesselClick]);

    useEffect(() => {
      if (mapRef.current && !mapInstanceRef.current) {
        const map = L.map(mapRef.current).setView([49.0, 0.0], 5);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap © CARTO',
        }).addTo(map);
        mapInstanceRef.current = map;
        onMapReady(map);
        map.on('popupclose', () => onVesselClick(null));
      }
    }, [onMapReady, onVesselClick]);

    useEffect(() => {
      if (!mapInstanceRef.current || !selectedVessel) {
        if (mapInstanceRef.current) mapInstanceRef.current.closePopup();
        return;
      }

      const marker = vesselMarkersRef.current.get(selectedVessel.mmsi);
      if (!marker) return;

      const isTrackShown = currentTrackMmsi === selectedVessel.mmsi && trackData.length > 0;
      const isLoadingThisTrack = isTrackLoading && currentTrackMmsi === selectedVessel.mmsi;
      const isBookmarked = isShipInFleet(selectedVessel.mmsi);
      const popupContent = createPopupHtml(
        selectedVessel,
        isTrackShown,
        isLoadingThisTrack,
        isBookmarked,
        isAuthenticated
      );

      if (marker.getPopup()) {
        marker.setPopupContent(popupContent);
      } else {
        marker.bindPopup(popupContent, { minWidth: 280, closeButton: true, autoPan: true });
      }

      if (!marker.isPopupOpen()) {
        marker.openPopup();
      }

      const setupPopupButtons = () => {
        const popupNode = marker.getPopup()?.getElement();
        if (!popupNode) return;

        const showBtn = popupNode.querySelector<HTMLButtonElement>(
          `#show-track-btn-${selectedVessel.mmsi}`
        );
        if (showBtn)
          L.DomEvent.on(showBtn, 'click', (e) => {
            L.DomEvent.stop(e);
            onShowTrackRequest(selectedVessel.mmsi);
          });

        const hideBtn = popupNode.querySelector<HTMLButtonElement>(
          `#hide-track-btn-${selectedVessel.mmsi}`
        );
        if (hideBtn)
          L.DomEvent.on(hideBtn, 'click', (e) => {
            L.DomEvent.stop(e);
            onHideTrackRequest();
          });

        const addBtn = popupNode.querySelector<HTMLButtonElement>(
          `#add-fleet-btn-${selectedVessel.mmsi}`
        );
        if (addBtn)
          L.DomEvent.on(addBtn, 'click', (e) => {
            L.DomEvent.stop(e);
            onAddToFleet(Number(selectedVessel.mmsi));
          });

        const removeBtn = popupNode.querySelector<HTMLButtonElement>(
          `#remove-fleet-btn-${selectedVessel.mmsi}`
        );
        if (removeBtn)
          L.DomEvent.on(removeBtn, 'click', (e) => {
            L.DomEvent.stop(e);
            onRemoveFromFleet(Number(selectedVessel.mmsi));
          });
      };

      marker.off('popupopen').on('popupopen', setupPopupButtons);

      if (marker.isPopupOpen()) {
        setupPopupButtons();
      }
    }, [
      selectedVessel,
      trackData,
      currentTrackMmsi,
      isTrackLoading,
      onShowTrackRequest,
      onHideTrackRequest,
      isShipInFleet,
      onAddToFleet,
      onRemoveFromFleet,
      isAuthenticated,
    ]);

    useEffect(() => {
      if (!mapInstanceRef.current) return;

      if (trackLineRef.current) {
        mapInstanceRef.current.removeLayer(trackLineRef.current);
        trackLineRef.current = null;
      }

      if (trackData && trackData.length > 1) {
        const latLngs = trackData.map((p) => [p.latitude, p.longitude] as L.LatLngExpression);
        trackLineRef.current = L.polyline(latLngs, {
          color: '#1d4ed8',
          weight: 3,
          opacity: 0.8,
        }).addTo(mapInstanceRef.current);
      }
    }, [trackData]);

    return <div ref={mapRef} className="z-10 h-full w-full" />;
  }
);

export default MapComponent;
