document.addEventListener('DOMContentLoaded', function() {
    const initialView = document.getElementById('initial-view');
    const signupForm = document.getElementById('signup-form');
    const showFormBtn = document.getElementById('show-form-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    
    showFormBtn.addEventListener('click', function() {
        initialView.style.display = 'none';
        signupForm.style.display = 'block';
    });
    
    cancelBtn.addEventListener('click', function(e) {
        e.preventDefault();
        signupForm.style.display = 'none';
        initialView.style.display = 'block';
    });
});