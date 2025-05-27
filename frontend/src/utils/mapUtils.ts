import L from 'leaflet';

/**
 * Earth radius in kilometers
 */
// const EARTH_RADIUS_KM = 6371;

/**
 * Maximum number of critical sections allowed
 */
export const MAX_CRITICAL_SECTIONS = 3;

/**
 * Interface for critical section data
 */
export interface CriticalSection {
  id: string;
  center: L.LatLng;
  radius: number; // in kilometers
  createdAt: Date;
  name?: string;
  description?: string;
}

/**
 * Convert kilometers to map units for circle radius
 * Note: This is a simplified conversion that works well enough for small areas
 * @param km - Radius in kilometers
 */
export const kmToMapUnits = (km: number): number => {
  return km * 1000; // For Leaflet, we can use meters directly
};

/**
 * Creates a critical section visualization on the map
 * @param map - Leaflet map instance
 * @param section - Critical section data
 * @param onRemove - Optional callback when the critical section is removed
 * @returns Leaflet circle object
 */
export const drawCriticalSection = (
  map: L.Map,
  section: CriticalSection,
  onRemove?: (id: string) => void
): L.Circle => {
  const circle = L.circle(section.center, {
    radius: kmToMapUnits(section.radius),
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.2,
    weight: 2,
  }).addTo(map);

  // Create popup content with delete button if onRemove is provided
  const popupContent = `
    <div class="critical-section-popup" style="min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
      <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;">Critical Section</h4>
      <div style="font-size: 12px; line-height: 1.5;">
        <div style="margin-bottom: 4px;"><strong>Center:</strong> ${section.center.lat.toFixed(5)}, ${section.center.lng.toFixed(5)}</div>
        <div style="margin-bottom: 4px;"><strong>Radius:</strong> ${section.radius} km</div>
        <div style="margin-bottom: 8px;"><strong>Created:</strong> ${section.createdAt.toLocaleString()}</div>
        ${
          onRemove
            ? `
          <button 
            id="delete-cs-${section.id}" 
            style="width: 100%; padding: 6px 12px; background-color: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;"
            onmouseover="this.style.backgroundColor='#b91c1c'"
            onmouseout="this.style.backgroundColor='#dc2626'"
          >
            Delete Critical Section
          </button>
        `
            : ''
        }
      </div>
    </div>
  `;

  const popup = L.popup().setContent(popupContent);
  circle.bindPopup(popup);

  // If onRemove is provided, attach click handler to delete button when popup opens
  if (onRemove) {
    circle.on('popupopen', () => {
      setTimeout(() => {
        const deleteBtn = document.getElementById(`delete-cs-${section.id}`);
        if (deleteBtn) {
          deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove the circle from map
            map.removeLayer(circle);
            // Call the onRemove callback
            onRemove(section.id);
            // Close popup
            map.closePopup();
          });
        }
      }, 100); // Small timeout to ensure DOM is ready
    });
  }

  return circle;
};

/**
 * Creates a critical section on the map
 * @param map - Leaflet map instance
 * @param onClick - Callback function when critical section is created
 * @param currentCount - Current number of critical sections
 * @param onRemove - Optional callback when a critical section is removed
 * @returns cleanup function to remove event listeners
 */
export const enableCriticalSectionCreation = (
  map: L.Map,
  onClick: (section: CriticalSection, circle: L.Circle) => void,
  currentCount: number,
  onRemove?: (id: string) => void
): (() => void) => {
  // Check if we've reached the limit
  const reachedLimit = currentCount >= MAX_CRITICAL_SECTIONS;

  // Visual feedback for user - change cursor
  map.getContainer().style.cursor = reachedLimit ? 'not-allowed' : 'crosshair';

  // Create tooltip for instructions
  const tooltipContent = reachedLimit
    ? `Maximum limit of ${MAX_CRITICAL_SECTIONS} critical sections reached. Remove one to add another.`
    : 'Click on the map to create a critical section';

  const tooltip = L.tooltip({
    permanent: true,
    direction: 'top',
    className: reachedLimit ? 'critical-section-tooltip error' : 'critical-section-tooltip',
  })
    .setLatLng(map.getCenter())
    .setContent(tooltipContent)
    .addTo(map);

  // Track current hover position to keep tooltip following cursor
  const onMouseMove = (e: L.LeafletMouseEvent) => {
    tooltip.setLatLng(e.latlng);
  };

  // Handle map click
  const onMapClick = (e: L.LeafletMouseEvent) => {
    console.log('Critical section map click detected', e.latlng);

    // Stop the event from propagating to other click handlers
    L.DomEvent.stopPropagation(e);

    // If we've reached the limit, don't create a new section
    if (reachedLimit) {
      console.log('Maximum critical sections limit reached, ignoring click');
      return false;
    }

    const center = e.latlng;
    const defaultRadius = 50; // 50 km default radius

    // Create the critical section object
    const criticalSection: CriticalSection = {
      id: `cs-${Date.now()}`,
      center,
      radius: defaultRadius,
      createdAt: new Date(),
    };

    // Draw circle on map with delete functionality
    const circle = drawCriticalSection(map, criticalSection, onRemove);

    // Make sure popup opens immediately to show the user what they created
    circle.openPopup();

    // Notify parent component with both section and circle
    onClick(criticalSection, circle);

    // Return false to prevent event propagation
    return false;
  };

  // Add event listeners
  map.on('click', onMapClick);
  map.on('mousemove', onMouseMove);

  // Cleanup function
  const disableCreation = () => {
    console.log('Cleaning up critical section mode');
    map.getContainer().style.cursor = '';
    map.off('click', onMapClick);
    map.off('mousemove', onMouseMove);
    if (tooltip) {
      map.removeLayer(tooltip);
    }
  };

  // Return cleanup function
  return disableCreation;
};
