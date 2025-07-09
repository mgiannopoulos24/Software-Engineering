import L from 'leaflet';
import { ZoneOfInterestDTO, ZoneDataWithType } from '@/types/types';

// Οι σταθερές παραμένουν χρήσιμες για το dialog
export const ALL_SHIP_TYPES_FOR_MAP = [
    'anti-pollution', 'cargo', 'cargo-hazarda(major)', 'cargo-hazardb',
    'cargo-hazardc(minor)', 'cargo-hazardd(recognizable)', 'divevessel',
    'dredger', 'fishing', 'high-speedcraft', 'lawenforce', 'localvessel',
    'militaryops', 'other', 'passenger', 'pilotvessel', 'pleasurecraft',
    'sailingvessel', 'sar', 'specialcraft', 'tanker', 'tanker-hazarda(major)',
    'tanker-hazardb', 'tanker-hazardc(minor)', 'tanker-hazardd(recognizable)',
    'tug', 'unknown', 'wingingrnd'
].sort();

export const ALL_NAV_STATUSES_FOR_MAP: { code: string; description: string }[] = [
    { code: 0, description: 'Under way using engine' },
    { code: 1, description: 'At anchor' },
    { code: 2, description: 'Not under command' },
    { code: 3, description: 'Restricted manoeuverability' },
    { code: 4, description: 'Constrained by her draught' },
    { code: 5, description: 'Moored' },
    { code: 6, description: 'Aground' },
    { code: 7, description: 'Engaged in Fishing' },
    { code: 8, description: 'Under way sailing' },
    { code: 9, description: 'reserved for future use' },
    { code: 10, description: 'reserved for future use' },
    { code: 11, description: 'reserved for future use' },
    { code: 12, description: 'reserved for future use' },
    { code: 13, description: 'reserved for future use' },
    { code: 14, description: 'reserved for future use' },
    { code: 15, description: 'Not defined' }
];

/**
 * Σχεδιάζει μια ζώνη στον χάρτη.
 * @param map - Το instance του Leaflet map.
 * @param zone - Τα δεδομένα της ζώνης (πρέπει να είναι τύπου ZoneDataWithType).
 * @param onClick - Callback που εκτελείται όταν ο χρήστης κάνει κλικ στη ζώνη.
 * @returns Το αντικείμενο L.Circle που σχεδιάστηκε.
 */
export const drawZone = (
    map: L.Map,
    zone: ZoneDataWithType,
    onClick: (zone: ZoneDataWithType) => void
): L.Circle => {
    const isInterest = zone.type === 'interest';
    const color = isInterest ? '#3b82f6' : '#dc2626'; // Μπλε για interest, Κόκκινο για collision
    const fillColor = isInterest ? '#60a5fa' : '#f87171';

    const circle = L.circle([zone.centerLatitude, zone.centerLongitude], {
        radius: zone.radiusInMeters,
        color,
        fillColor,
        fillOpacity: 0.2,
        weight: 2,
    }).addTo(map);

    // --- Tooltip on Hover ---
    const constraintsCount = (zone as ZoneOfInterestDTO).constraints?.length || 0;
    let tooltipContent = `<div style="text-align: center; font-family: sans-serif;"><b>${zone.name || 'Unnamed Zone'}</b>`;
    if (isInterest && constraintsCount > 0) {
        tooltipContent += `<br/><span style="font-size: 0.8rem;">${constraintsCount} constraint(s)</span>`;
    }
    tooltipContent += `<br/><span style="font-size: 0.75rem; color: #555;">Click to manage</span></div>`;
    circle.bindTooltip(tooltipContent);

    // --- Click Listener ---
    circle.on('click', (e) => {
        L.DomEvent.stopPropagation(e); // Αποτρέπει το click event από το να φτάσει στον χάρτη
        onClick(zone);
    });

    return circle;
};