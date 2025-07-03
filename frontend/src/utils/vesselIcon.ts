import L from 'leaflet';

export const getVesselIcon = (type: string, status: string, heading: number) => {
  // Enhanced color palette to match your ShipType enum
  const colors = {
    'anti-pollution': '#4CAF50', // Green
    cargo: '#FF6B35', // Orange
    'cargo-hazarda(major)': '#E53935', // Red
    'cargo-hazardb': '#EF5350', // Lighter red
    'cargo-hazardc(minor)': '#FFAB00', // Amber
    'cargo-hazardd(recognizable)': '#FFC107', // Yellow
    divevessel: '#00BCD4', // Cyan
    dredger: '#795548', // Brown
    fishing: '#96CEB4', // Light green
    'high-speedcraft': '#448AFF', // Light blue
    lawenforce: '#3F51B5', // Indigo
    localvessel: '#9E9E9E', // Grey
    militaryops: '#616161', // Dark grey
    other: '#FFEAA7', // Light yellow
    passenger: '#4ECDC4', // Teal
    pilotvessel: '#7986CB', // Light indigo
    pleasurecraft: '#BA68C8', // Purple
    sailingvessel: '#81D4FA', // Light blue
    sar: '#F44336', // Red
    specialcraft: '#FF9800', // Orange
    tanker: '#45B7D1', // Blue
    'tanker-hazarda(major)': '#D32F2F', // Dark red
    'tanker-hazardb': '#F44336', // Red
    'tanker-hazardc(minor)': '#FF9800', // Orange
    'tanker-hazardd(recognizable)': '#FFC107', // Yellow
    tug: '#8D6E63', // Brown
    unknown: '#9E9E9E', // Grey
    wingingrnd: '#78909C', // Blue grey
  };

  const color = colors[type as keyof typeof colors] || colors.unknown;
  const pulseAnimation = status === 'underway' ? 'animation: pulse 2s infinite;' : '';

  // Use 0 degrees as default rotation when heading is not available (511)
  const rotationHeading = heading === 511 ? 0 : heading;

  return L.divIcon({
    html: `
      <div style="
        color: ${color};
        transform: rotate(${rotationHeading}deg);
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        ${pulseAnimation}
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="3,11 22,2 13,21 11,13 3,11"></polygon>
        </svg>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: rotate(${rotationHeading}deg) scale(1); opacity: 1; }
          50% { transform: rotate(${rotationHeading}deg) scale(1.2); opacity: 0.8; }
          100% { transform: rotate(${rotationHeading}deg) scale(1); opacity: 1; }
        }
      </style>
    `,
    className: 'vessel-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};
