// src/components/map/MapComponent.tsx

import {RealTimeShipUpdateDTO, TrackPointDTO} from '@/types/types';
import {getVesselIcon} from '@/utils/vesselIcon';
import {getVesselStatusDescription} from '@/utils/vesselUtils';
import {Anchor, Compass, Gauge, History, Loader2, Ship as ShipIcon, Wind} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

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
}

const createPopupHtml = (
    vessel: RealTimeShipUpdateDTO,
    isTrackShown: boolean,
    isTrackLoading: boolean
): string => {
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

    // --- Δυναμικό κουμπί για την πορεία ---
    let trackButtonHtml = '';
    if (isTrackLoading) {
        trackButtonHtml = `
            <button class="track-button loading" disabled>
                ${iconToHtml(<Loader2 size={16} className="animate-spin" />)}
                <span>Loading...</span>
            </button>`;
    } else if (isTrackShown) {
        trackButtonHtml = `
            <button id="hide-track-btn-${vessel.mmsi}" class="track-button hide">
                ${iconToHtml(<History size={16} />)}
                <span>Hide Track</span>
            </button>`;
    } else {
        trackButtonHtml = `
            <button id="show-track-btn-${vessel.mmsi}" class="track-button show">
                ${iconToHtml(<History size={16} />)}
                <span>Show 12h Track</span>
            </button>`;
    }

    return `
      <style>
        .track-button {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            width: 100%; padding: 8px; margin-top: 12px; border: none;
            border-radius: 6px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;
        }
        .track-button.show { background-color: #2563eb; color: white; }
        .track-button.show:hover { background-color: #1d4ed8; }
        .track-button.hide { background-color: #dc2626; color: white; }
        .track-button.hide:hover { background-color: #b91c1c; }
        .track-button.loading { background-color: #64748b; color: white; cursor: not-allowed; }
      </style>
      <div style="width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="background-color: #1e293b; color: white; padding: 12px; border-radius: 8px 8px 0 0;">
          <h4 style="margin: 0; font-size: 16px; font-weight: bold;">
            Vessel: ${vessel.mmsi}
          </h4>
        </div>
        <div style="padding: 8px 12px 12px 12px; background: white;">
            <!-- Τα detail rows παραμένουν ίδια -->
            ${detailRow(iconToHtml(<ShipIcon size={16} />), "Type", vesselTypeHtml)}
            ${detailRow(iconToHtml(<Gauge size={16} />), "Speed", speedHtml)}
            ${detailRow(iconToHtml(<Wind size={16} />), "Course", courseHtml)}
            ${detailRow(iconToHtml(<Compass size={16} />), "Heading", headingHtml)}
            ${detailRow(iconToHtml(<Anchor size={16} />), "Status", statusHtml)}


            ${trackButtonHtml}
            
            <div style="margin-top: 10px; text-align: center; font-size: 11px; color: #999;">
                Last Update: ${lastUpdateHtml}
            </div>
        </div>
      </div>
    `;
};


const MapComponent = forwardRef<MapComponentRef, MapComponentProps>(
    ({
         vessels,
         selectedVessel, onMapReady, onVesselClick,
         trackData, currentTrackMmsi, onShowTrackRequest, onHideTrackRequest, isTrackLoading
     }, ref) => {
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

        // Ένα useEffect που είναι υπεύθυνο για τον συγχρονισμό των markers με τα φιλτραρισμένα πλοία.
        useEffect(() => {
            if (!mapInstanceRef.current) return;

            const map = mapInstanceRef.current;
            const displayedVesselsMmsi = new Set(vessels.map(v => v.mmsi));

            // Αφαίρεση παλιών markers
            vesselMarkersRef.current.forEach((marker, mmsi) => {
                if (!displayedVesselsMmsi.has(mmsi)) {
                    map.removeLayer(marker);
                    vesselMarkersRef.current.delete(mmsi);
                }
            });

            // Προσθήκη ή ενημέρωση νέων markers
            vessels.forEach(vessel => {
                if (vessel.latitude == null || vessel.longitude == null) return;

                const icon = getVesselIcon(vessel.shiptype?.toLowerCase() || 'unknown', vessel.navigationalStatus?.toString() ?? 'unknown', vessel.trueHeading);
                let marker = vesselMarkersRef.current.get(vessel.mmsi);

                if (marker) { // Αν υπάρχει, ενημέρωσέ τον
                    marker.setLatLng([vessel.latitude, vessel.longitude]);
                    marker.setIcon(icon);
                } else { // Αν δεν υπάρχει, δημιούργησέ τον
                    marker = L.marker([vessel.latitude, vessel.longitude], { icon }).addTo(map);
                    vesselMarkersRef.current.set(vessel.mmsi, marker);
                }

                // Ενημέρωση του click handler
                marker.off('click').on('click', () => onVesselClick(vessel));
            });

        }, [vessels, onVesselClick]);

        // Αρχικοποίηση του χάρτη (τρέχει μόνο μία φορά)
        useEffect(() => {
            if (mapRef.current && !mapInstanceRef.current) {
                const map = L.map(mapRef.current).setView([49.0, 0.0], 5);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap © CARTO'
                }).addTo(map);
                mapInstanceRef.current = map;
                onMapReady(map);

                // Όταν ο χρήστης κλείνει ένα popup (π.χ. πατώντας το 'x' ή κλικάροντας έξω),
                // ενημερώνουμε το state ώστε να μην υπάρχει επιλεγμένο πλοίο.
                map.on('popupclose', () => onVesselClick(null));
            }
        }, [onMapReady, onVesselClick]);

        // Ξεχωριστό useEffect που είναι ΑΠΟΚΛΕΙΣΤΙΚΑ υπεύθυνο για τη διαχείριση του popup.
        useEffect(() => {
            if (!mapInstanceRef.current) return;

            // Αν δεν υπάρχει επιλεγμένο πλοίο, απλά κλείνουμε όποιο popup είναι ανοιχτό.
            if (!selectedVessel) {
                mapInstanceRef.current.closePopup();
                return;
            }

            const marker = vesselMarkersRef.current.get(selectedVessel.mmsi);
            // Αν για κάποιο λόγο ο marker δεν υπάρχει ακόμα, δεν κάνουμε τίποτα.
            if (!marker) return;

            const isTrackShown = currentTrackMmsi === selectedVessel.mmsi && trackData.length > 0;
            const isLoadingThisTrack = isTrackLoading && currentTrackMmsi === selectedVessel.mmsi;
            const popupContent = createPopupHtml(selectedVessel, isTrackShown, isLoadingThisTrack);

            // Δημιουργούμε ή ενημερώνουμε το περιεχόμενο του popup
            if (marker.getPopup()) {
                marker.setPopupContent(popupContent);
            } else {
                marker.bindPopup(popupContent, { minWidth: 280, closeButton: false, autoPan: true });
            }

            // Διασφαλίζουμε ότι το popup είναι ανοιχτό
            if (!marker.isPopupOpen()) {
                marker.openPopup();
            }

            // Προσθέτουμε τα click listeners στα κουμπιά μας ΜΕΤΑ το άνοιγμα του popup
            // χρησιμοποιώντας το L.DomEvent της Leaflet.
            const setupPopupButtons = () => {
                const popupNode = marker.getPopup()?.getElement();
                if (!popupNode) return;

                const showBtn = popupNode.querySelector<HTMLButtonElement>(`#show-track-btn-${selectedVessel.mmsi}`);
                if (showBtn) {
                    L.DomEvent.on(showBtn, 'click', (e) => {
                        L.DomEvent.stop(e);
                        onShowTrackRequest(selectedVessel.mmsi);
                    });
                }

                const hideBtn = popupNode.querySelector<HTMLButtonElement>(`#hide-track-btn-${selectedVessel.mmsi}`);
                if (hideBtn) {
                    L.DomEvent.on(hideBtn, 'click', (e) => {
                        L.DomEvent.stop(e);
                        onHideTrackRequest();
                    });
                }
            };

            // Βάζουμε ένα listener για το 'popupopen' event του marker.
            // Αυτό εξασφαλίζει ότι τα κουμπιά μας θα έχουν listeners ΜΟΝΟ όταν το popup είναι ανοιχτό.
            marker.off('popupopen').on('popupopen', setupPopupButtons);

            // Αν το popup είναι ήδη ανοιχτό (π.χ. από ένα re-render), ξανατρέχουμε τη setup για να είμαστε σίγουροι.
            if (marker.isPopupOpen()) {
                setupPopupButtons();
            }

        }, [selectedVessel, trackData, currentTrackMmsi, isTrackLoading, onShowTrackRequest, onHideTrackRequest]);

        // --- useEffect ΓΙΑ ΤΗ ΖΩΓΡΑΦΙΚΗ ΤΗΣ ΠΟΡΕΙΑΣ ---
        useEffect(() => {
            if (!mapInstanceRef.current) return;

            // 1. Καθαρίζουμε πάντα την παλιά γραμμή
            if (trackLineRef.current) {
                mapInstanceRef.current.removeLayer(trackLineRef.current);
                trackLineRef.current = null;
            }

            // 2. Αν υπάρχουν νέα δεδομένα, τα ζωγραφίζουμε
            if (trackData && trackData.length > 1) {
                const latLngs = trackData.map(p => [p.latitude, p.longitude] as L.LatLngExpression);
                trackLineRef.current = L.polyline(latLngs, {
                    color: '#1d4ed8', // Ένα ωραίο μπλε
                    weight: 3,
                    opacity: 0.8,
                }).addTo(mapInstanceRef.current);
            }
        }, [trackData]); // Αυτό το effect τρέχει μόνο όταν αλλάξει το trackData

        return <div ref={mapRef} className="h-full w-full z-10" />;
    });

export default MapComponent;