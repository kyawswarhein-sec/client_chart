document.addEventListener('DOMContentLoaded', function() {
    // Check for login errors from session
    fetch('../backend/get_login_error.php')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
            }
        })
        .catch(error => console.error('Error checking login status:', error));

    // Get form elements
    const loginForm = document.getElementById('login-form');
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const loginButton = document.getElementById('login-btn');
    const errorDiv = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    // Focus on username field when page loads
    if (usernameField) {
        usernameField.focus();
    }

    // Handle form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Clear previous errors
            clearErrors();
            
            // Validate form
            if (validateForm()) {
                // Add loading state to button
                setLoadingState(true);
                
                // Submit form
                loginForm.submit();
            }
        });
    }

    // Real-time validation
    if (usernameField) {
        usernameField.addEventListener('input', function() {
            validateField(this, 'Username is required');
        });

        usernameField.addEventListener('blur', function() {
            validateField(this, 'Username is required');
        });
    }

    if (passwordField) {
        passwordField.addEventListener('input', function() {
            validateField(this, 'Password is required');
        });

        passwordField.addEventListener('blur', function() {
            validateField(this, 'Password is required');
        });
    }

    // Handle Enter key navigation
    if (usernameField && passwordField) {
        usernameField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                passwordField.focus();
            }
        });
        
        passwordField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                loginForm.submit();
            }
        });
    }

    // Form validation functions
    function validateForm() {
        let isValid = true;
        
        // Validate username
        if (!validateField(usernameField, 'Username is required')) {
            isValid = false;
        }
        
        // Validate password
        if (!validateField(passwordField, 'Password is required')) {
            isValid = false;
        }
        
        return isValid;
    }

    function validateField(field, errorMessage) {
        const value = field.value.trim();
        const formGroup = field.closest('.input-group');
        
        // Remove previous validation states
        field.classList.remove('is-valid', 'is-invalid');
        formGroup.classList.remove('has-error', 'has-success');
        
        // Remove previous error messages
        const existingError = formGroup.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        if (!value) {
            // Show error
            field.classList.add('is-invalid');
            formGroup.classList.add('has-error');
            showFieldError(formGroup, errorMessage);
            return false;
        } else {
            // Show success
            field.classList.add('is-valid');
            formGroup.classList.add('has-success');
            return true;
        }
    }

    function showFieldError(formGroup, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #dc3545;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: flex;
            align-items: center;
        `;
        
        // Add error icon
        const errorIcon = document.createElement('i');
        errorIcon.className = 'fas fa-exclamation-circle';
        errorIcon.style.marginRight = '0.5rem';
        errorDiv.prepend(errorIcon);
        
        formGroup.appendChild(errorDiv);
    }

    function clearErrors() {
        // Clear field errors
        const fieldErrors = document.querySelectorAll('.field-error');
        fieldErrors.forEach(error => error.remove());
        
        // Clear field validation states
        const fields = document.querySelectorAll('.form-control');
        fields.forEach(field => {
            field.classList.remove('is-valid', 'is-invalid');
        });
        
        const formGroups = document.querySelectorAll('.input-group');
        formGroups.forEach(group => {
            group.classList.remove('has-error', 'has-success');
        });
        
        // Clear main error message
        hideError();
    }

    function showError(message) {
        errorText.textContent = message;
        errorDiv.style.display = 'block';
        
        // Add animation
        errorDiv.style.opacity = '0';
        errorDiv.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            errorDiv.style.transition = 'all 0.3s ease';
            errorDiv.style.opacity = '1';
            errorDiv.style.transform = 'translateY(0)';
        }, 100);
        
        // Focus on first field for accessibility
        if (usernameField) {
            usernameField.focus();
        }
    }

    function hideError() {
        errorDiv.style.display = 'none';
    }

    function setLoadingState(loading) {
        if (loading) {
            loginButton.disabled = true;
            loginButton.classList.add('loading');
            loginButton.querySelector('span').textContent = 'Signing In...';
        } else {
            loginButton.disabled = false;
            loginButton.classList.remove('loading');
            loginButton.querySelector('span').textContent = 'Sign In';
        }
    }

    // Add some visual feedback for form interactions
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });

    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        // Escape key to clear form
        if (e.key === 'Escape') {
            clearErrors();
            if (usernameField) {
                usernameField.focus();
            }
        }
    });

    // Add visual feedback for successful validation
    const validFields = document.querySelectorAll('.form-control.is-valid');
    validFields.forEach(field => {
        const formGroup = field.closest('.input-group');
        if (formGroup) {
            formGroup.classList.add('has-success');
        }
    });
}); 