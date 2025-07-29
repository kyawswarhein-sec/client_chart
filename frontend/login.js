document.addEventListener('DOMContentLoaded', function() {
    // Check for login errors from session
    fetch('../backend/get_login_error.php')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                const errorDiv = document.getElementById('error-message');
                const errorText = document.getElementById('error-text');
                errorText.textContent = data.error;
                errorDiv.style.display = 'block';
            }
        })
        .catch(error => console.error('Error checking login status:', error));

    // Focus on username field when page loads
    const usernameField = document.querySelector('input[name="username"]');
    if (usernameField) {
        usernameField.focus();
    }

    // Handle form submission
    const loginForm = document.querySelector('form');
    const loginButton = document.querySelector('.btn-login');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            // Add loading state to button
            loginButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Signing In...';
            loginButton.disabled = true;
        });
    }

    // Handle input validation styling
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            } else {
                this.classList.remove('is-valid');
                this.classList.add('is-invalid');
            }
        });

        // Clear validation styling on focus
        input.addEventListener('focus', function() {
            this.classList.remove('is-invalid', 'is-valid');
        });
    });

    // Handle Enter key navigation
    const usernameInput = document.querySelector('input[name="username"]');
    const passwordInput = document.querySelector('input[name="password"]');
    
    if (usernameInput && passwordInput) {
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                passwordInput.focus();
            }
        });
        
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginForm.submit();
            }
        });
    }

    // Add some animations to error messages
    const errorAlert = document.querySelector('.alert-danger');
    if (errorAlert) {
        errorAlert.style.opacity = '0';
        errorAlert.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            errorAlert.style.transition = 'all 0.3s ease';
            errorAlert.style.opacity = '1';
            errorAlert.style.transform = 'translateY(0)';
        }, 100);
    }
}); 