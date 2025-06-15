// Payment Manager
class PaymentManager {
    constructor() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Activate Pro button
        const activateProBtn = document.getElementById('activate-pro-btn');
        if (activateProBtn) {
            activateProBtn.addEventListener('click', this.activatePro.bind(this));
        }
        
        // Payment modal events are handled in app.js
    }
    
    async activatePro() {
        const referenceCode = document.getElementById('reference-code-input').value.trim();
        
        if (!referenceCode) {
            window.uxpilotApp.showToast('Please enter a reference code', 'warning');
            return;
        }
        
        try {
            const response = await window.uxpilotApp.apiCall('/api/payment/activate-pro', {
                method: 'POST',
                body: JSON.stringify({ referenceCode })
            });
            
            if (response.success) {
                window.uxpilotApp.showToast('Pro subscription activated!', 'success');
                window.uxpilotApp.hidePaymentModal();
                
                // Update user interface
                if (window.uxpilotApp.currentUser) {
                    window.uxpilotApp.currentUser.subscription = 'pro';
                    window.uxpilotApp.currentUser.isPro = true;
                    window.uxpilotApp.updateUserInterface();
                }
                
                // Refresh page to show Pro features
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            window.uxpilotApp.showToast(error.message || 'Failed to activate Pro subscription', 'error');
        }
    }
    
    async generatePaymentReference() {
        try {
            const response = await window.uxpilotApp.apiCall('/api/payment/generate-reference', {
                method: 'POST'
            });
            
            if (response.success) {
                return response.reference;
            }
        } catch (error) {
            console.error('Failed to generate payment reference:', error);
        }
        
        return null;
    }
}

// Initialize payment manager
let paymentManager;
document.addEventListener('DOMContentLoaded', () => {
    paymentManager = new PaymentManager();
});

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentManager;
}