// Initialize AI manager
let aiManager;
document.addEventListener('DOMContentLoaded', () => {
    aiManager = new AIManager();
});

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIManager;
}