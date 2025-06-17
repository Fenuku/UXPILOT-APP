// Payment Manager
class PaymentManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // This button should now trigger the payment flow
        const upgradeBtn = document.getElementById('upgrade-to-pro-btn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', this.initiatePayment.bind(this));
        }

        // Payment modal events are handled in app.js
    }

    async initiatePayment() {
        if (!window.uxpilotApp.currentUser) {
            window.uxpilotApp.showToast('You must be logged in to upgrade.', 'error');
            return;
        }

        try {
            const response = await window.uxpilotApp.apiCall('/api/payment/paystack/initialize', {
                method: 'POST',
                body: JSON.stringify({
                    email: window.uxpilotApp.currentUser.email,
                    amount: 29 // The amount in your base currency (e.g., USD)
                })
            });

            if (response.status && response.data.authorization_url) {
                this.showPaystackPopup(response.data);
            }
        } catch (error) {
            window.uxpilotApp.showToast(error.message || 'Failed to start payment process.', 'error');
        }
    }

    showPaystackPopup(data) {
        const handler = PaystackPop.setup({
            key: process.env.PAYSTACK_PUBLIC_KEY,
            email: window.uxpilotApp.currentUser.email,
            amount: data.amount,
            ref: data.reference,
            callback: function (response) {
                // Verification is handled by the webhook, but you can show a success message here
                window.uxpilotApp.showToast('Payment successful! Your account will be upgraded shortly.', 'success');
                window.uxpilotApp.hidePaymentModal();
                // Refresh page to show Pro features
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            },
            onClose: function () {
                window.uxpilotApp.showToast('Payment popup closed.', 'info');
            }
        });
        handler.openIframe();
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