// Vessel data storage
const savedVessels = [
    {
        id: 1,
        name: "Vessel 1",
        percentage: 90,
        destination: "TR",
        speed: 13,
        draught: 4
    },
    {
        id: 2,
        name: "Vessel 2",
        percentage: 90,
        destination: "IT",
        speed: 15,
        draught: 5.2
    },
    {
        id: 3,
        name: "Vessel 3",
        percentage: 90,
        destination: "GR",
        speed: 11.5,
        draught: 3.8
    },
    {
        id: 4,
        name: "Vessel 4",
        percentage: 90,
        destination: "ES",
        speed: 17.2,
        draught: 4.5
    }
];

// Function to render saved vessels
function renderSavedVessels() {
    const container = document.getElementById('vessel-cards-container');
    
    // Clear existing content
    container.innerHTML = '';
    
    // Generate HTML for each vessel
    savedVessels.forEach(vessel => {
        const vesselCard = document.createElement('div');
        vesselCard.className = 'vessel-card p-4 bg-white mb-4';
        
        vesselCard.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="flex-grow-1">
                    <h5 class="vessel-title">${vessel.name}</h5>
                    <p class="mb-1">Destination: ${vessel.destination}</p>
                    <p class="mb-1">Speed/Course: ${vessel.speed} kn</p>
                    <p class="mb-0">Draught: ${vessel.draught}m</p>
                </div>
            </div>
        `;
        
        container.appendChild(vesselCard);
    });
}

// Initialize saved vessels when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Render vessels when bookmark icon is clicked
    const bookmarkIcon = document.getElementById('bookmarkIcon');
    const mapContainer = document.getElementById('mapContainer');
    const coordinates = document.getElementById('coordinates');
    const savedVesselsContainer = document.getElementById('savedVesselsContainer');
    
    if (bookmarkIcon) {
        bookmarkIcon.addEventListener('click', function() {
            if (mapContainer.style.display !== 'none') {
                // Hide map view, show saved vessels
                mapContainer.style.display = 'none';
                coordinates.style.display = 'none';
                savedVesselsContainer.style.display = 'block';
                // Fill bookmark icon to indicate we're in saved vessels view
                bookmarkIcon.querySelector('svg').setAttribute('fill', 'currentColor');
                // Render the vessels (now calling our function from vessels.js)
                setTimeout(renderSavedVessels, 10); // Small timeout to ensure DOM is ready
            } else {
                // Show map view, hide saved vessels
                mapContainer.style.display = 'block';
                coordinates.style.display = 'block';
                savedVesselsContainer.style.display = 'none';
                // Unfill bookmark icon
                bookmarkIcon.querySelector('svg').setAttribute('fill', 'none');
            }
        });
    }
});