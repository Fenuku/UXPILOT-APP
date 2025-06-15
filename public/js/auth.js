// Authentication Manager
class AuthManager {
    constructor() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form-element');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        
        // Signup form
        const signupForm = document.getElementById('signup-form-element');
        if (signupForm) {
            signupForm.addEventListener('submit', this.handleSignup.bind(this));
        }
        
        // Social auth buttons
        const googleLoginBtn = document.getElementById('google-login-btn');
        const googleSignupBtn = document.getElementById('google-signup-btn');
        const githubLoginBtn = document.getElementById('github-login-btn');
        const githubSignupBtn = document.getElementById('github-signup-btn');
        
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => this.handleSocialAuth('google'));
        }
        if (googleSignupBtn) {
            googleSignupBtn.addEventListener('click', () => this.handleSocialAuth('google'));
        }
        if (githubLoginBtn) {
            githubLoginBtn.addEventListener('click', () => this.handleSocialAuth('github'));
        }
        if (githubSignupBtn) {
            githubSignupBtn.addEventListener('click', () => this.handleSocialAuth('github'));
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('uxpilot_token', data.token);
                window.uxpilotApp.setUser(data.user);
                window.uxpilotApp.isAuthenticated = true;
                window.uxpilotApp.hideAuthModal();
                window.uxpilotApp.navigateTo('dashboard');
                window.uxpilotApp.showToast('Login successful!', 'success');
            } else {
                window.uxpilotApp.showToast(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            window.uxpilotApp.showToast('Login failed. Please try again.', 'error');
        }
    }
    
    async handleSignup(e) {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const termsAccepted = document.getElementById('terms-checkbox').checked;
        
        if (!termsAccepted) {
            window.uxpilotApp.showToast('Please accept the terms and conditions', 'warning');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('uxpilot_token', data.token);
                window.uxpilotApp.setUser(data.user);
                window.uxpilotApp.isAuthenticated = true;
                window.uxpilotApp.hideAuthModal();
                window.uxpilotApp.navigateTo('dashboard');
                window.uxpilotApp.showToast('Account created successfully!', 'success');
            } else {
                window.uxpilotApp.showToast(data.message || 'Signup failed', 'error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            window.uxpilotApp.showToast('Signup failed. Please try again.', 'error');
        }
    }
    
    handleSocialAuth(provider) {
        window.location.href = `/api/auth/${provider}`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
