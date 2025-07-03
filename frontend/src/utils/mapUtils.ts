import L from 'leaflet';

/**
 * Earth radius in kilometers
 */
// const EARTH_RADIUS_KM = 6371;

/**
 * Maximum number of critical sections and interest zones allowed
 */
export const MAX_CRITICAL_SECTIONS = 1;
export const MAX_INTEREST_ZONES = 1;

/**
 * Zone types
 */
export type ZoneType = 'critical' | 'interest';

/**
 * Enum for interest zone constraints
 */
export enum InterestZoneConstraint {
  SPEED_LIMIT_ABOVE = 'SPEED_LIMIT_ABOVE', // Alert if speed > value
  SPEED_LIMIT_BELOW = 'SPEED_LIMIT_BELOW', // Alert if speed < value
  ZONE_ENTRY = 'ZONE_ENTRY', // Alert when a ship enters the zone
  ZONE_EXIT = 'ZONE_EXIT', // Alert when a ship that was inside, leaves
  FORBIDDEN_SHIP_TYPE = 'FORBIDDEN_SHIP_TYPE', // Alert if a specific ship type is present
  UNWANTED_NAV_STATUS = 'UNWANTED_NAV_STATUS', // Alert if a ship has a specific navigational status
}

export const ALL_SHIP_TYPES = [
  'anti-pollution',
  'cargo',
  'cargo-hazarda(major)',
  'cargo-hazardb',
  'cargo-hazardc(minor)',
  'cargo-hazardd(recognizable)',
  'divevessel',
  'dredger',
  'fishing',
  'high-speedcraft',
  'lawenforce',
  'localvessel',
  'militaryops',
  'other',
  'passenger',
  'pilotvessel',
  'pleasurecraft',
  'sailingvessel',
  'sar',
  'specialcraft',
  'tanker',
  'tanker-hazarda(major)',
  'tanker-hazardb',
  'tanker-hazardc(minor)',
  'tanker-hazardd(recognizable)',
  'tug',
  'unknown',
  'wingingrnd',
];

export const ALL_NAV_STATUSES = [0, 1, 5, 15];

/**
 * Interface for a single constraint with its value
 */
export interface Constraint {
  type: InterestZoneConstraint;
  value?: any; // number for speed, string[] for ship type/nav status
}

/**
 * Interface for critical section data
 */
export interface CriticalSection {
  id: string;
  center: L.LatLng;
  radius: number; // in kilometers
  createdAt: Date;
  name?: string;
}

/**
 * Interface for interest zone data
 */
export interface InterestZone {
  id: string;
  center: L.LatLng;
  radius: number; // in kilometers
  createdAt: Date;
  name?: string;
  description?: string;
  constraints?: Constraint[];
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
 * @param onUpdate - Optional callback when the critical section radius is updated
 * @returns Leaflet circle object
 */
export const drawCriticalSection = (
  map: L.Map,
  section: CriticalSection,
  onRemove?: (id: string) => void,
  onUpdate?: (id: string, newRadius: number, newName?: string) => void,
  isNew = false
): L.Circle => {
  const circle = L.circle(section.center, {
    radius: kmToMapUnits(section.radius),
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.2,
    weight: 2,
  }).addTo(map);

  // Function to generate popup content
  const getPopupContent = (currentSection: CriticalSection) => `
    <div class="critical-section-popup" style="min-width: 260px; font-family: system-ui, -apple-system, sans-serif;">
      <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;">Critical Section</h4>
      <div id="static-name-${currentSection.id}" style="font-weight: bold; margin-bottom: 8px; display: ${currentSection.name ? 'block' : 'none'};">Name: ${currentSection.name}</div>
      <div style="font-size: 12px; line-height: 1.5;">
        <div style="margin-bottom: 4px;"><strong>Center:</strong> ${currentSection.center.lat.toFixed(5)}, ${currentSection.center.lng.toFixed(5)}</div>
        <div style="margin-bottom: 4px;"><strong>Radius:</strong> <span id="static-radius-${currentSection.id}">${currentSection.radius}</span> km</div>
        <div style="margin-bottom: 8px;"><strong>Created:</strong> ${currentSection.createdAt.toLocaleString()}</div>
        
        <div id="edit-controls-${currentSection.id}" style="display: ${isNew ? 'block' : 'none'}; margin-top: 8px; margin-bottom: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <div style="margin-bottom: 8px;">
            <label for="name-input-${currentSection.id}" style="display: block; font-weight: 500; margin-bottom: 4px;">Section Name</label>
            <input type="text" id="name-input-${currentSection.id}" value="${currentSection.name ?? ''}" placeholder="e.g., No-Go Zone" style="width: calc(100% - 10px); padding: 4px; font-size: 12px; border: 1px solid #ccc; border-radius: 3px;">
          </div>
          <label for="radius-slider-${currentSection.id}" style="display: block; font-weight: 500; margin-bottom: 4px;">Adjust Radius: <span id="radius-display-${currentSection.id}">${currentSection.radius}</span> km</label>
          <input type="range" id="radius-slider-${currentSection.id}" min="1" max="200" value="${currentSection.radius}" step="1" style="width: 100%;">
          <button 
            id="save-btn-${currentSection.id}" 
            style="width: 100%; padding: 6px 12px; background-color: #16a34a; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500; margin-top: 8px;"
            onmouseover="this.style.backgroundColor='#15803d'"
            onmouseout="this.style.backgroundColor='#16a34a'"
          >
            Save Changes
          </button>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 8px;">
          ${
            onUpdate
              ? `
            <button 
              id="edit-btn-${section.id}" 
              style="flex: 1; padding: 6px 12px; background-color: #f97316; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500; display: ${isNew ? 'none' : 'flex'};"
              onmouseover="this.style.backgroundColor='#ea580c'"
              onmouseout="this.style.backgroundColor='#f97316'"
            >
              Edit
            </button>
          `
              : ''
          }
          ${
            onRemove
              ? `
            <button 
              id="delete-cs-${section.id}" 
              style="flex: 1; padding: 6px 12px; background-color: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;"
              onmouseover="this.style.backgroundColor='#b91c1c'"
              onmouseout="this.style.backgroundColor='#dc2626'"
            >
              Delete
            </button>
          `
              : ''
          }
        </div>
      </div>
    </div>
  `;

  const popup = L.popup().setContent(getPopupContent(section));
  circle.bindPopup(popup);

  // Attach event handlers when popup opens
  circle.on('popupopen', () => {
    setTimeout(() => {
      // Delete button
      if (onRemove) {
        const deleteBtn = document.getElementById(`delete-cs-${section.id}`);
        if (deleteBtn) {
          deleteBtn.onclick = (e) => {
            e.preventDefault();
            map.removeLayer(circle);
            onRemove(section.id);
            map.closePopup();
          };
        }
      }

      // Edit functionality
      if (onUpdate) {
        const editBtn = document.getElementById(`edit-btn-${section.id}`);
        const editControls = document.getElementById(`edit-controls-${section.id}`);
        const radiusSlider = document.getElementById(
          `radius-slider-${section.id}`
        ) as HTMLInputElement;
        const radiusDisplay = document.getElementById(`radius-display-${section.id}`);
        const saveBtn = document.getElementById(`save-btn-${section.id}`);
        const staticRadiusDisplay = document.getElementById(`static-radius-${section.id}`);
        const nameInput = document.getElementById(`name-input-${section.id}`) as HTMLInputElement;
        const staticNameDisplay = document.getElementById(`static-name-${section.id}`);

        if (
          editBtn &&
          editControls &&
          radiusSlider &&
          radiusDisplay &&
          saveBtn &&
          staticRadiusDisplay &&
          nameInput &&
          staticNameDisplay
        ) {
          editBtn.onclick = () => {
            const isEditing = editControls.style.display === 'block';
            editControls.style.display = isEditing ? 'none' : 'block';
            editBtn.textContent = isEditing ? 'Edit' : 'Cancel';
          };

          radiusSlider.oninput = () => {
            const newRadius = parseFloat(radiusSlider.value);
            circle.setRadius(kmToMapUnits(newRadius));
            radiusDisplay.textContent = `${newRadius}`;
          };

          saveBtn.onclick = () => {
            const newRadius = parseFloat(radiusSlider.value);
            const newName = nameInput.value;
            onUpdate(section.id, newRadius, newName);

            staticRadiusDisplay.textContent = `${newRadius}`;
            if (newName) {
              staticNameDisplay.textContent = `Name: ${newName}`;
              staticNameDisplay.style.display = 'block';
            } else {
              staticNameDisplay.style.display = 'none';
            }

            editControls.style.display = 'none';
            editBtn.textContent = 'Edit';
            if (isNew) {
              editBtn.style.display = 'flex';
            }
          };
        }
      }
    }, 100);
  });

  return circle;
};

/**
 * Creates an interest zone visualization on the map
 * @param map - Leaflet map instance
 * @param zone - Interest zone data
 * @param onRemove - Optional callback when the interest zone is removed
 * @param onUpdate - Optional callback when the interest zone radius is updated
 * @returns Leaflet circle object
 */
export const drawInterestZone = (
  map: L.Map,
  zone: InterestZone,
  onRemove?: (id: string) => void,
  onUpdate?: (
    id: string,
    newRadius: number,
    newConstraints?: Constraint[],
    newName?: string
  ) => void,
  isNew = false
): L.Circle => {
  const circle = L.circle(zone.center, {
    radius: kmToMapUnits(zone.radius),
    color: '#3b82f6', // Blue color
    fillColor: '#60a5fa', // Light blue
    fillOpacity: 0.2,
    weight: 2,
  }).addTo(map);

  // Function to generate popup content
  const getPopupContent = (currentZone: InterestZone) => {
    const displayConstraints = (constraints?: Constraint[]) => {
      if (!constraints || constraints.length === 0) return '<span>None</span>';
      return `<ul style="margin: 0; padding-left: 18px;">${constraints
        .map((c) => {
          let valueText = '';
          if (c.value) {
            if (Array.isArray(c.value) && c.value.length > 0) {
              valueText = `: ${c.value.join(', ')}`;
            } else if (!Array.isArray(c.value)) {
              valueText = `: ${c.value}`;
            }
          }
          return `<li style="margin-bottom: 2px;">${c.type.replace(/_/g, ' ')}${valueText}</li>`;
        })
        .join('')}</ul>`;
    };

    const getConstraintValue = (type: InterestZoneConstraint) => {
      return (currentZone.constraints ?? []).find((c) => c.type === type)?.value;
    };

    const editConstraintsHTML = Object.values(InterestZoneConstraint)
      .map((constraint) => {
        const hasValue = [
          InterestZoneConstraint.SPEED_LIMIT_ABOVE,
          InterestZoneConstraint.SPEED_LIMIT_BELOW,
          InterestZoneConstraint.FORBIDDEN_SHIP_TYPE,
          InterestZoneConstraint.UNWANTED_NAV_STATUS,
        ].includes(constraint);

        const isChecked = (currentZone.constraints ?? []).some((c) => c.type === constraint);

        let valueInputHTML = '';
        if (hasValue) {
          const value = getConstraintValue(constraint);
          switch (constraint) {
            case InterestZoneConstraint.SPEED_LIMIT_ABOVE:
            case InterestZoneConstraint.SPEED_LIMIT_BELOW:
              valueInputHTML = `<input type="number" min="0" max="100" value="${value ?? 10}" id="value-${currentZone.id}-${constraint}" style="width: 60px; font-size: 11px; padding: 2px; margin-left: 8px; display: ${isChecked ? 'inline-block' : 'none'};"><span style="margin-left: 4px;">knots</span>`;
              break;
            case InterestZoneConstraint.FORBIDDEN_SHIP_TYPE:
              valueInputHTML = `<select multiple id="value-${currentZone.id}-${constraint}" style="width: 100%; font-size: 11px; margin-top: 4px; display: ${isChecked ? 'block' : 'none'};">
              ${ALL_SHIP_TYPES.map((st) => `<option value="${st}" ${((value as string[] | undefined) ?? []).includes(st) ? 'selected' : ''}>${st}</option>`).join('')}
            </select>`;
              break;
            case InterestZoneConstraint.UNWANTED_NAV_STATUS:
              valueInputHTML = `<select multiple id="value-${currentZone.id}-${constraint}" style="width: 100%; font-size: 11px; margin-top: 4px; display: ${isChecked ? 'block' : 'none'};">
              ${ALL_NAV_STATUSES.map((ns) => `<option value="${ns}" ${((value as string[] | undefined) ?? []).includes(ns) ? 'selected' : ''}>${ns}</option>`).join('')}
            </select>`;
              break;
          }
        }

        return `
      <div style="margin-bottom: 6px;">
        <div style="display: flex; align-items: center;">
          <input type="checkbox" id="constraint-${currentZone.id}-${constraint}" name="constraints" value="${constraint}" ${isChecked ? 'checked' : ''} style="margin-right: 6px; transform: scale(0.9);">
          <label for="constraint-${currentZone.id}-${constraint}" style="font-size: 11px;">${constraint.replace(/_/g, ' ')}</label>
          ${valueInputHTML.includes('knots') ? valueInputHTML : ''}
        </div>
        ${!valueInputHTML.includes('knots') ? valueInputHTML : ''}
      </div>`;
      })
      .join('');

    return `
    <div class="interest-zone-popup" style="min-width: 260px; max-height: 400px; overflow-y: auto; font-family: system-ui, -apple-system, sans-serif;">
      <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;">Interest Zone</h4>
      <div id="static-name-${currentZone.id}" style="font-weight: bold; margin-bottom: 8px; display: ${currentZone.name ? 'block' : 'none'};">Name: ${currentZone.name}</div>
      <div style="font-size: 12px; line-height: 1.5;">
        <div style="margin-bottom: 4px;"><strong>Center:</strong> ${currentZone.center.lat.toFixed(5)}, ${currentZone.center.lng.toFixed(5)}</div>
        <div style="margin-bottom: 4px;"><strong>Radius:</strong> <span id="static-radius-${currentZone.id}">${currentZone.radius}</span> km</div>
        <div style="margin-bottom: 8px;"><strong>Created:</strong> ${currentZone.createdAt.toLocaleString()}</div>
        <div style="margin-bottom: 8px;">
          <strong style="display: block; margin-bottom: 4px;">Constraints:</strong>
          <div id="static-constraints-${currentZone.id}">${displayConstraints(currentZone.constraints)}</div>
        </div>
        
        <div id="edit-controls-${currentZone.id}" style="display: ${isNew ? 'block' : 'none'}; margin-top: 8px; margin-bottom: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <div style="margin-bottom: 8px;">
            <label for="name-input-${currentZone.id}" style="display: block; font-weight: 500; margin-bottom: 4px;">Zone Name</label>
            <input type="text" id="name-input-${currentZone.id}" value="${currentZone.name ?? ''}" placeholder="e.g., High Traffic Area" style="width: calc(100% - 10px); padding: 4px; font-size: 12px; border: 1px solid #ccc; border-radius: 3px;">
          </div>
          <label for="radius-slider-${currentZone.id}" style="display: block; font-weight: 500; margin-bottom: 4px;">Adjust Radius: <span id="radius-display-${currentZone.id}">${currentZone.radius}</span> km</label>
          <input type="range" id="radius-slider-${currentZone.id}" min="1" max="200" value="${currentZone.radius}" step="1" style="width: 100%; margin-bottom: 8px;">
          
          <div>
            <label style="display: block; font-weight: 500; margin-bottom: 4px;">Edit Constraints:</label>
            <div id="constraints-checkboxes-${currentZone.id}">${editConstraintsHTML}</div>
          </div>

          <button 
            id="save-btn-${currentZone.id}" 
            style="width: 100%; padding: 6px 12px; background-color: #16a34a; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500; margin-top: 8px;"
            onmouseover="this.style.backgroundColor='#15803d'"
            onmouseout="this.style.backgroundColor='#16a34a'"
          >
            Save Changes
          </button>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 8px;">
          ${
            onUpdate
              ? `
            <button 
              id="edit-btn-${zone.id}" 
              style="flex: 1; padding: 6px 12px; background-color: #f97316; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500; display: ${isNew ? 'none' : 'flex'};"
              onmouseover="this.style.backgroundColor='#ea580c'"
              onmouseout="this.style.backgroundColor='#f97316'"
            >
              Edit
            </button>
          `
              : ''
          }
          ${
            onRemove
              ? `
            <button 
              id="delete-iz-${zone.id}" 
              style="flex: 1; padding: 6px 12px; background-color: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;"
              onmouseover="this.style.backgroundColor='#b91c1c'"
              onmouseout="this.style.backgroundColor='#dc2626'"
            >
              Delete
            </button>
          `
              : ''
          }
        </div>
      </div>
    </div>
  `;
  };

  const popup = L.popup().setContent(getPopupContent(zone));
  circle.bindPopup(popup);

  // Attach event handlers when popup opens
  circle.on('popupopen', () => {
    setTimeout(() => {
      // Delete button
      if (onRemove) {
        const deleteBtn = document.getElementById(`delete-iz-${zone.id}`);
        if (deleteBtn) {
          deleteBtn.onclick = (e) => {
            e.preventDefault();
            map.removeLayer(circle);
            onRemove(zone.id);
            map.closePopup();
          };
        }
      }

      // Edit functionality
      if (onUpdate) {
        const editBtn = document.getElementById(`edit-btn-${zone.id}`);
        const editControls = document.getElementById(`edit-controls-${zone.id}`);
        const radiusSlider = document.getElementById(
          `radius-slider-${zone.id}`
        ) as HTMLInputElement;
        const radiusDisplay = document.getElementById(`radius-display-${zone.id}`);
        const saveBtn = document.getElementById(`save-btn-${zone.id}`);
        const staticRadiusDisplay = document.getElementById(`static-radius-${zone.id}`);
        const staticConstraintsDisplay = document.getElementById(`static-constraints-${zone.id}`);
        const checkboxContainer = document.getElementById(`constraints-checkboxes-${zone.id}`);
        const nameInput = document.getElementById(`name-input-${zone.id}`) as HTMLInputElement;
        const staticNameDisplay = document.getElementById(`static-name-${zone.id}`);

        if (
          editBtn &&
          editControls &&
          radiusSlider &&
          radiusDisplay &&
          saveBtn &&
          staticRadiusDisplay &&
          staticConstraintsDisplay &&
          checkboxContainer &&
          nameInput &&
          staticNameDisplay
        ) {
          // Add event listeners to checkboxes to show/hide value inputs
          checkboxContainer
            .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
            .forEach((cb) => {
              cb.onchange = () => {
                const constraintType = cb.value as InterestZoneConstraint;
                const valueInput = document.getElementById(`value-${zone.id}-${constraintType}`);
                if (valueInput) {
                  valueInput.style.display = cb.checked
                    ? valueInput.tagName === 'SELECT'
                      ? 'block'
                      : 'inline-block'
                    : 'none';
                }
              };
            });

          editBtn.onclick = () => {
            const isEditing = editControls.style.display === 'block';
            editControls.style.display = isEditing ? 'none' : 'block';
            editBtn.textContent = isEditing ? 'Edit' : 'Cancel';
          };

          radiusSlider.oninput = () => {
            const newRadius = parseFloat(radiusSlider.value);
            circle.setRadius(kmToMapUnits(newRadius));
            radiusDisplay.textContent = `${newRadius}`;
          };

          saveBtn.onclick = () => {
            const newRadius = parseFloat(radiusSlider.value);
            const newName = nameInput.value;
            const newConstraints: Constraint[] = [];

            checkboxContainer
              .querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked')
              .forEach((cb) => {
                const type = cb.value as InterestZoneConstraint;
                const constraint: Constraint = { type };
                const valueInput = document.getElementById(`value-${zone.id}-${type}`);

                if (valueInput) {
                  if (valueInput.tagName === 'INPUT') {
                    constraint.value = parseFloat((valueInput as HTMLInputElement).value);
                  } else if (valueInput.tagName === 'SELECT') {
                    constraint.value = Array.from(
                      (valueInput as HTMLSelectElement).selectedOptions
                    ).map((opt) => opt.value);
                  }
                }
                newConstraints.push(constraint);
              });

            onUpdate(zone.id, newRadius, newConstraints, newName);

            // Update the static display
            staticRadiusDisplay.textContent = `${newRadius}`;
            if (newName) {
              staticNameDisplay.textContent = `Name: ${newName}`;
              staticNameDisplay.style.display = 'block';
            } else {
              staticNameDisplay.style.display = 'none';
            }
            const displayConstraints = (constraints?: Constraint[]) => {
              if (!constraints || constraints.length === 0) return '<span>None</span>';
              return `<ul style="margin: 0; padding-left: 18px;">${constraints
                .map((c) => {
                  let valueText = '';
                  if (c.value) {
                    if (Array.isArray(c.value) && c.value.length > 0) {
                      valueText = `: ${c.value.join(', ')}`;
                    } else if (!Array.isArray(c.value)) {
                      valueText = `: ${c.value}`;
                    }
                  }
                  return `<li style="margin-bottom: 2px;">${c.type.replace(/_/g, ' ')}${valueText}</li>`;
                })
                .join('')}</ul>`;
            };
            staticConstraintsDisplay.innerHTML = displayConstraints(newConstraints);

            // Hide controls and reset button text
            editControls.style.display = 'none';
            editBtn.textContent = 'Edit';
            if (isNew) {
              editBtn.style.display = 'flex';
            }
          };
        }
      }
    }, 100);
  });

  return circle;
};

/**
 * Creates a zone on the map (either critical section or interest zone)
 * @param map - Leaflet map instance
 * @param zoneType - Type of zone to create ('critical' or 'interest')
 * @param onClick - Callback function when zone is created
 * @param currentCount - Current number of zones of this type
 * @param onRemove - Optional callback when a zone is removed
 * @param onUpdate - Optional callback when a zone's radius is updated
 * @returns cleanup function to remove event listeners
 */
export const enableZoneCreation = (
  map: L.Map,
  zoneType: ZoneType,
  onClick: (zone: CriticalSection | InterestZone, circle: L.Circle) => void,
  currentCount: number,
  onRemove?: (id: string) => void,
  onUpdate?: (
    id: string,
    newRadius: number,
    newConstraints?: Constraint[],
    newName?: string
  ) => void
): (() => void) => {
  // Set max limit based on zone type
  const maxLimit = zoneType === 'critical' ? MAX_CRITICAL_SECTIONS : MAX_INTEREST_ZONES;

  // Check if we've reached the limit
  const reachedLimit = currentCount >= maxLimit;

  // Visual feedback for user - change cursor
  map.getContainer().style.cursor = reachedLimit ? 'not-allowed' : 'crosshair';

  // Set zone-specific properties
  const zoneName = zoneType === 'critical' ? 'Critical Section' : 'Interest Zone';
  const tooltipClass =
    zoneType === 'critical' ? 'critical-section-tooltip' : 'interest-zone-tooltip';

  // Create tooltip for instructions
  const tooltipContent = reachedLimit
    ? `Maximum limit of ${maxLimit} ${zoneName}s reached. Remove one to add another.`
    : `Click on the map to create a ${zoneName.toLowerCase()}`;

  const tooltip = L.tooltip({
    permanent: true,
    direction: 'top',
    className: reachedLimit ? `${tooltipClass} error` : tooltipClass,
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
    console.log(`${zoneName} map click detected`, e.latlng);

    // Stop the event from propagating to other click handlers
    L.DomEvent.stopPropagation(e);

    // If we've reached the limit, don't create a new zone
    if (reachedLimit) {
      console.log(`Maximum ${zoneName}s limit reached, ignoring click`);
      return false;
    }

    const center = e.latlng;
    const defaultRadius = 50; // 50 km default radius

    // Create the zone object with the appropriate type
    const zoneId = zoneType === 'critical' ? `cs-${Date.now()}` : `iz-${Date.now()}`;
    const zone: CriticalSection | InterestZone = {
      id: zoneId,
      center,
      radius: defaultRadius,
      createdAt: new Date(),
      ...(zoneType === 'interest' && { constraints: [] }), // Start with no constraints for new interest zones
    };

    // Draw circle on map with delete functionality based on zone type
    const circle =
      zoneType === 'critical'
        ? drawCriticalSection(map, zone as CriticalSection, onRemove, onUpdate, true)
        : drawInterestZone(map, zone as InterestZone, onRemove, onUpdate, true);

    // Make sure popup opens immediately to show the user what they created
    circle.openPopup();

    // Notify parent component with both zone and circle
    onClick(zone as any, circle);

    // Return false to prevent event propagation
    return false;
  };

  // Add event listeners
  map.on('click', onMapClick);
  map.on('mousemove', onMouseMove);

  // Cleanup function
  const disableCreation = () => {
    console.log(`Cleaning up ${zoneName.toLowerCase()} mode`);
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

// Keep the original enableCriticalSectionCreation for backwards compatibility
export const enableCriticalSectionCreation = (
  map: L.Map,
  onClick: (section: CriticalSection, circle: L.Circle) => void,
  currentCount: number,
  onRemove?: (id: string) => void,
  onUpdate?: (id: string, newRadius: number, newName?: string) => void
): (() => void) => {
  return enableZoneCreation(map, 'critical', onClick, currentCount, onRemove, onUpdate);
};
