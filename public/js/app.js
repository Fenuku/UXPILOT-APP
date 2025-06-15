// Main Application Controller
class UXPilotApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'landing';
        this.isAuthenticated = false;
        
        this.init();
    }
    
    async init() {
        // Show loading screen
        this.showLoading();
        
        // Initialize components
        await this.initializeComponents();
        
        // Check authentication
        await this.checkAuth();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Handle URL parameters
        this.handleURLParams();
        
        // Hide loading screen
        this.hideLoading();
    }
    
    async initializeComponents() {
        // Initialize all app components
        if (typeof AuthManager !== 'undefined') {
            this.auth = new AuthManager();
        }
        
        if (typeof CanvasManager !== 'undefined') {
            this.canvas = new CanvasManager();
        }
        
        if (typeof AIManager !== 'undefined') {
            this.ai = new AIManager();
        }
        
        if (typeof ProjectManager !== 'undefined') {
            this.projects = new ProjectManager();
        }
        
        if (typeof JourneyMapManager !== 'undefined') {
            this.journeyMaps = new JourneyMapManager();
        }
        
        if (typeof AnalysisManager !== 'undefined') {
            this.analysis = new AnalysisManager();
        }
        
        if (typeof PrinciplesManager !== 'undefined') {
            this.principles = new PrinciplesManager();
        }
        
        if (typeof PaymentManager !== 'undefined') {
            this.payment = new PaymentManager();
        }
    }
    
    showLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }
    
    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 1500);
        }
    }
    
    async checkAuth() {
        const token = localStorage.getItem('uxpilot_token');
        if (token) {
            try {
                const response = await fetch('/api/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.setUser(data.user);
                    this.isAuthenticated = true;
                } else {
                    localStorage.removeItem('uxpilot_token');
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('uxpilot_token');
            }
        }
    }
    
    setUser(user) {
        this.currentUser = user;
        this.updateUserInterface();
    }
    
    updateUserInterface() {
        if (this.currentUser) {
            // Update navigation
            const loginBtn = document.getElementById('login-btn');
            const signupBtn = document.getElementById('signup-btn');
            const userMenuBtn = document.getElementById('user-menu-btn');
            const userAvatar = document.getElementById('user-avatar');
            const userName = document.getElementById('user-name');
            
            if (loginBtn) loginBtn.classList.add('hidden');
            if (signupBtn) signupBtn.classList.add('hidden');
            if (userMenuBtn) userMenuBtn.classList.remove('hidden');
            
            if (userAvatar && this.currentUser.avatar) {
                userAvatar.src = this.currentUser.avatar;
            }
            if (userName) {
                userName.textContent = this.currentUser.name;
            }
            
            // Update sidebar
            const sidebarAvatar = document.getElementById('sidebar-avatar');
            const sidebarUsername = document.getElementById('sidebar-username');
            const sidebarPlan = document.getElementById('sidebar-plan');
            
            if (sidebarAvatar && this.currentUser.avatar) {
                sidebarAvatar.src = this.currentUser.avatar;
            }
            if (sidebarUsername) {
                sidebarUsername.textContent = this.currentUser.name;
            }
            if (sidebarPlan) {
                sidebarPlan.textContent = this.currentUser.isPro ? 'Pro Plan' : 'Free Plan';
            }
        }
    }
    
    setupEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-page]')) {
                e.preventDefault();
                this.navigateTo(e.target.dataset.page);
            }
        });
        
        // Auth buttons
        const loginBtn = document.getElementById('login-btn');
        const signupBtn = document.getElementById('signup-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showAuthModal('login'));
        }
        
        if (signupBtn) {
            signupBtn.addEventListener('click', () => this.showAuthModal('signup'));
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Hero CTA
        const heroCTA = document.getElementById('hero-cta');
        if (heroCTA) {
            heroCTA.addEventListener('click', () => {
                if (this.isAuthenticated) {
                    this.navigateTo('dashboard');
                } else {
                    this.showAuthModal('signup');
                }
            });
        }
        
        // Upgrade buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('#upgrade-pro-btn, #upgrade-sidebar-btn')) {
                this.showPaymentModal();
            }
        });
        
        // Scroll effects
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', this.toggleMobileMenu.bind(this));
        }
    }
    
    handleURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            localStorage.setItem('uxpilot_token', token);
            this.navigateTo('dashboard');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    navigateTo(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Show target page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;
        }
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-page="${page}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        // Show/hide dashboard content
        if (page !== 'landing') {
            document.querySelectorAll('.dashboard-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const targetContent = document.getElementById(`${page}-content`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        }
    }
    
    showAuthModal(tab = 'login') {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.add('active');
            
            // Switch to correct tab
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            
            const targetTab = document.querySelector(`[data-tab="${tab}"]`);
            const targetForm = document.getElementById(`${tab}-form`);
            
            if (targetTab) targetTab.classList.add('active');
            if (targetForm) targetForm.classList.add('active');
        }
    }
    
    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    showPaymentModal() {
        const modal = document.getElementById('payment-modal');
        if (modal) {
            modal.classList.add('active');
            
            // Generate payment reference
            const reference = `UXP-${this.currentUser?.id || 'GUEST'}-${Date.now()}`;
            const referenceElement = document.getElementById('payment-reference');
            if (referenceElement) {
                referenceElement.textContent = reference;
            }
        }
    }
    
    hidePaymentModal() {
        const modal = document.getElementById('payment-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        localStorage.removeItem('uxpilot_token');
        this.currentUser = null;
        this.isAuthenticated = false;
        this.navigateTo('landing');
        this.updateUserInterface();
        this.showToast('Logged out successfully', 'success');
    }
    
    handleScroll() {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    }
    
    toggleMobileMenu() {
        const sidebar = document.querySelector('.dashboard-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide and remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }
    
    // API helper methods
    async apiCall(endpoint, options = {}) {
        const token = localStorage.getItem('uxpilot_token');
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        
        const response = await fetch(endpoint, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }
        
        return response.json();
    }
}

// Modal event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Auth modal close
    const authModalClose = document.getElementById('auth-modal-close');
    if (authModalClose) {
        authModalClose.addEventListener('click', () => {
            document.getElementById('auth-modal').classList.remove('active');
        });
    }
    
    // Payment modal close
    const paymentModalClose = document.getElementById('payment-modal-close');
    if (paymentModalClose) {
        paymentModalClose.addEventListener('click', () => {
            document.getElementById('payment-modal').classList.remove('active');
        });
    }
    
    // Auth tab switching
    document.addEventListener('click', (e) => {
        if (e.target.matches('.auth-tab')) {
            const tab = e.target.dataset.tab;
            
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            
            e.target.classList.add('active');
            document.getElementById(`${tab}-form`).classList.add('active');
        }
    });
    
    // Close modals on outside click
    document.addEventListener('click', (e) => {
        if (e.target.matches('.modal')) {
            e.target.classList.remove('active');
        }
    });
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.uxpilotApp = new UXPilotApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UXPilotApp;
}