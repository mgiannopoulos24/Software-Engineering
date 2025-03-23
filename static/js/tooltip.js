document.addEventListener('DOMContentLoaded', function() {
    // Get the notification bell element
    const notificationBell = document.getElementById('notificationBell');
    
    // Initialize Bootstrap manually to ensure cross-browser compatibility
    if (notificationBell) {
        // Create a popover for the notification bell with a more compatible configuration
        const popoverOptions = {
            container: 'body',
            trigger: 'manual', // Use manual trigger for better control
            placement: 'bottom',
            html: true,
            customClass: 'notification-popover',
            content: createNotificationContent(),
            sanitize: false // Needed for HTML content in some browsers
        };
        
        const popover = new bootstrap.Popover(notificationBell, popoverOptions);
        
        // Toggle the popover on bell click
        notificationBell.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling up
            popover.toggle();
        });
        
        // Add tabindex to make the bell focusable in all browsers
        notificationBell.setAttribute('tabindex', '0');
        
        // Close popover when clicking anywhere else
        document.addEventListener('click', function(event) {
            // Make sure popover is initialized
            if (document.querySelector('.popover') && 
                !notificationBell.contains(event.target) && 
                !document.querySelector('.popover').contains(event.target)) {
                popover.hide();
            }
        });
        
        // Also handle Escape key to close (accessibility)
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                popover.hide();
            }
        });
    }
    
    function createNotificationContent() {
        // Create a div to hold the notification content
        const container = document.createElement('div');
        
        // Create the notification title
        const title = document.createElement('div');
        title.className = 'notification-title';
        title.textContent = 'Speed limits';
        
        // Create the notification message
        const message = document.createElement('div');
        message.className = 'notification-message';
        message.textContent = 'Vessel 1 has crossed your speed limits';
        
        // Add the elements to the container
        container.appendChild(title);
        container.appendChild(message);
        
        return container;
    }
});