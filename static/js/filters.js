document.addEventListener('DOMContentLoaded', function() {
    const filterButton = document.getElementById('mapActionButton');
    const filtersPanel = document.getElementById('filtersPanel');
    const capacityRange = document.getElementById('capacityRange');
    const capacityValue = document.getElementById('capacityValue');
    const resetButton = document.getElementById('resetFiltersBtn');
    const applyButton = document.getElementById('applyFiltersBtn');
    
    let filtersPanelVisible = false;
    
    // Toggle filters panel
    filterButton.addEventListener('click', function() {
        filtersPanelVisible = !filtersPanelVisible;
        
        if (filtersPanelVisible) {
            filtersPanel.style.display = 'block';
        } else {
            filtersPanel.style.display = 'none';
        }
    });
    
    // Update capacity value text
    capacityRange.addEventListener('input', function() {
        capacityValue.textContent = `0-${capacityRange.value} tons`;
    });
    
    // Close panel when clicking outside
    document.addEventListener('click', function(event) {
        if (filtersPanelVisible && 
            !filtersPanel.contains(event.target) && 
            !filterButton.contains(event.target)) {
            filtersPanel.style.display = 'none';
            filtersPanelVisible = false;
        }
    });
    
    // Prevent map panning/zooming when interacting with the filters
    filtersPanel.addEventListener('mousedown', function(e) {
        e.stopPropagation();
    });
    
    filtersPanel.addEventListener('touchstart', function(e) {
        e.stopPropagation();
    });
    
    filtersPanel.addEventListener('wheel', function(e) {
        e.stopPropagation();
    }, { passive: false });
    
    // Reset filters
    resetButton.addEventListener('click', function() {
        document.getElementById('vesselType').value = '';
        document.getElementById('vesselStatus').value = '';
        capacityRange.value = 100;
        capacityValue.textContent = '0-100 tons';
    });
    
    // Apply filters (placeholder for actual filter implementation)
    applyButton.addEventListener('click', function() {
        filtersPanel.style.display = 'none';
        filtersPanelVisible = false;
        
        // Here you would implement the actual filtering logic
        console.log({
            type: document.getElementById('vesselType').value,
            capacity: capacityRange.value,
            status: document.getElementById('vesselStatus').value
        });
    });
});