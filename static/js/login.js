document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorToast = document.getElementById('errorToast');
    const toast = new bootstrap.Toast(errorToast);
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const emailOrPhone = document.getElementById('emailOrPhone').value.trim();
        const password = document.getElementById('password').value;
        
        // Simple login logic
        if (emailOrPhone === 'admin@ais.com') {
            // Redirect to admin page
            window.location.href = 'admin.html';
        } else if (emailOrPhone === 'user@ais.com') {
            // Redirect to user page
            window.location.href = 'user.html';
        } else {
            // Show error toast
            toast.show();
            
            // Redirect to signup page after a delay
            setTimeout(() => {
                window.location.href = 'signup.html';
            }, 3000);
        }
    });
});

// Credentials (yes very secure :) ):

// Admin:
// Email: admin@ais.com
// Password: whatever

// User:
// Email: user@ais.com
// Password: whatever