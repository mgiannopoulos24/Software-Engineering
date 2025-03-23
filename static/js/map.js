// Initialize map
var map = L.map('mapContainer').setView([20, 0], 3);

// Store markers in an array to access them later for resize
const markers = [];

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Ocean coordinates for icons (approximate locations of major seas/oceans)
const seaLocations = [
    { lat: 30, lng: -40 },      // North Atlantic - center point
    { lat: 40, lng: -50 },      // North Atlantic - spread out (10-20 units)
    { lat: 45, lng: -35 },      // North Atlantic - spread out
    { lat: 38, lng: -55 },      // North Atlantic - spread out
    { lat: 42, lng: -30 },      // North Atlantic - spread out
    { lat: 15, lng: -45 },      // North Atlantic - spread out
    { lat: 20, lng: -35 },      // North Atlantic - spread out
    { lat: 12, lng: -55 },      // North Atlantic - spread out
    { lat: 25, lng: -25 },      // North Atlantic - spread out
    { lat: 45, lng: -52 },      // North Atlantic - spread out
    { lat: 48, lng: -32 },      // North Atlantic - spread out
    { lat: 18, lng: -25 },      // North Atlantic - spread out
    { lat: 22, lng: -30 },      // North Atlantic - spread out
    { lat: 35, lng: -25 },      // North Atlantic - spread out
    { lat: 32, lng: -58 },      // North Atlantic - spread out
    { lat: 38, lng: -28 },      // North Atlantic - spread out
    { lat: 28, lng: -25 },      // North Atlantic - spread out
    { lat: 15, lng: -30 },      // North Atlantic - spread out
    { lat: 19, lng: -52 },      // North Atlantic - spread out
    { lat: 10, lng: -35 },      // North Atlantic - spread out
    { lat: 23, lng: -58 },      // North Atlantic - spread out
    { lat: -20, lng: -20 },     // South Atlantic
    { lat: 20, lng: 70 },       // Indian Ocean
    { lat: 35, lng: 140 },      // North Pacific
    { lat: -30, lng: -100 },    // South Pacific
    { lat: -29, lng: -99 },     // South Pacific
    { lat: -26, lng: -96 },     // South Pacific
    { lat: -24, lng: -94 },     // South Pacific
    { lat: -22, lng: -92 },     // South Pacific
    { lat: 60, lng: 0 },        // Norwegian Sea
    { lat: 35, lng: 20 },       // Mediterranean
    { lat: 1, lng: 97 },        // South China Sea
];

// Colors to cycle through
const colors = ['#00cc00', '#0066ff', '#ffcc00']; // green, blue, yellow

// Add circle overlay (red tinted)
const circleCenter = [45, -30];
const circleRadius = 500000; // radius in meters (250km)

// Create circle and add to map
const circle = L.circle(circleCenter, {
    radius: circleRadius,
    color: '#ff0000',
    weight: 2,
    fillColor: '#ff0000',
    fillOpacity: 0.2,
    className: 'circle-overlay'
}).addTo(map);

// Add popup to circle
circle.bindPopup("Restricted Zone");

// Create a custom icon for each location
seaLocations.forEach((location, index) => {
    // Determine color based on position in array
    const colorIndex = index % colors.length;
    const currentColor = colors[colorIndex];
    
    // Generate random rotation angle between 1 and 360 degrees
    const randomRotation = Math.floor(Math.random() * 360) + 1;
    
    // Size will be adjusted based on zoom level
    const createBoatIcon = (size) => {
        // Create a div element for the icon
        const iconDiv = document.createElement('div');
        
        // Using navigation icon with cycling colors and random rotation
        iconDiv.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${currentColor}" stroke="${currentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation" style="transform: rotate(${randomRotation}deg);">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
        `;
        
        // Create custom icon
        return L.divIcon({
            className: 'navigation-icon',
            html: iconDiv,
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
        });
    };
    
    // Initial size based on current zoom
    const initialZoom = map.getZoom();
    const initialSize = getIconSizeForZoom(initialZoom);
    
    // Add marker with custom icon
    const marker = L.marker([location.lat, location.lng], {
        icon: createBoatIcon(initialSize)
    }).addTo(map);
    
    // Store marker with its location and color info for later updates
    markers.push({
        marker: marker,
        location: location,
        color: currentColor,
        rotation: randomRotation
    });
});

// Function to determine icon size based on zoom level
function getIconSizeForZoom(zoom) {
    // Base size at zoom level 3
    const baseSize = 10;
    
    // Size increases by ~2px per zoom level
    if (zoom <= 3) return baseSize;
    if (zoom >= 10) return baseSize + 14; // Cap at maximum size
    
    return baseSize + (zoom - 3) * 2;
}

// Update icon sizes when zoom changes
map.on('zoomend', function() {
    const newZoom = map.getZoom();
    const newSize = getIconSizeForZoom(newZoom);
    
    markers.forEach(item => {
        const { marker, location, color, rotation } = item;
        
        // Create a div element for the icon
        const iconDiv = document.createElement('div');
        
        // Regenerate the icon with new size
        iconDiv.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${newSize}" height="${newSize}" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation" style="transform: rotate(${rotation}deg);">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
        `;
        
        // Update the marker with the new icon
        marker.setIcon(L.divIcon({
            className: 'navigation-icon',
            html: iconDiv,
            iconSize: [newSize, newSize],
            iconAnchor: [newSize/2, newSize/2]
        }));
    });
});

// Add mousemove event to track coordinates
const coordsDisplay = document.getElementById('coordinates');
map.on('mousemove', function(e) {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);
    coordsDisplay.innerHTML = `Latitude: ${lat} | Longitude: ${lng}`;
});

// Update display when mouse leaves the map
map.on('mouseout', function() {
    coordsDisplay.innerHTML = 'Hover over the map to display coordinates';
});