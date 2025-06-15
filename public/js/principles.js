// Design Principles Manager
class PrinciplesManager {
    constructor() {
        this.currentPrinciples = null;
        this.savedPrinciples = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSavedPrinciples();
    }
    
    setupEventListeners() {
        const getPrinciplesBtn = document.getElementById('get-principles-btn');
        if (getPrinciplesBtn) {
            getPrinciplesBtn.addEventListener('click', this.generatePrinciples.bind(this));
        }
        
        // Project type change
        const projectTypeSelect = document.getElementById('project-type');
        if (projectTypeSelect) {
            projectTypeSelect.addEventListener('change', this.updateRecommendations.bind(this));
        }
    }
    
    async loadSavedPrinciples() {
        try {
            const response = await window.uxpilotApp.apiCall('/api/user/design-principles');
            if (response.success) {
                this.savedPrinciples = response.principles;
                this.updateSavedPrinciplesList();
            }
        } catch (error) {
            console.log('No saved principles found');
        }
    }
    
    async generatePrinciples() {
        const projectType = document.getElementById('project-type').value;
        const targetAudience = document.getElementById('target-audience').value;
        const projectGoals = document.getElementById('project-goals').value;
        
        if (!projectType || !targetAudience || !projectGoals) {
            window.uxpilotApp.showToast('Please fill in all fields', 'warning');
            return;
        }
        
        try {
            const response = await window.uxpilotApp.apiCall('/api/ai/generate-principles', {
                method: 'POST',
                body: JSON.stringify({
                    projectType,
                    targetAudience,
                    projectGoals
                })
            });
            
            if (response.success) {
                this.currentPrinciples = response.principles;
                this.displayPrinciples(response.principles);
                window.uxpilotApp.showToast('Design principles generated!', 'success');
            }
        } catch (error) {
            window.uxpilotApp.showToast(error.message || 'Failed to generate principles', 'error');
        }
    }
    
    displayPrinciples(principlesData) {
        const resultsContainer = document.getElementById('principles-results');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = `
            <div class="principles-content">
                <div class="principles-header">
                    <h2>Design Principles & Guidelines</h2>
                    <div class="principles-actions">
                        <button class="btn btn-outline" onclick="principlesManager.exportPrinciples()">Export</button>
                        <button class="btn btn-primary" onclick="principlesManager.savePrinciples()">Save</button>
                    </div>
                </div>
                
                <div class="principles-sections">
                    <div class="principles-section">
                        <h3>Core Principles</h3>
                        <div class="principles-grid">
                            ${principlesData.principles.map(principle => `
                                <div class="principle-card priority-${principle.priority}">
                                    <div class="principle-header">
                                        <h4>${principle.name}</h4>
                                        <span class="priority-badge">${principle.priority}</span>
                                    </div>
                                    <p class="principle-description">${principle.description}</p>
                                    <div class="principle-application">
                                        <strong>Application:</strong> ${principle.application}
                                    </div>
                                    <div class="principle-examples">
                                        <strong>Examples:</strong>
                                        <ul>
                                            ${principle.examples.map(example => `<li>${example}</li>`).join('')}
                                        </ul>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="principles-section">
                        <h3>UX Laws & Guidelines</h3>
                        <div class="ux-laws-grid">
                            ${principlesData.uxLaws.map(law => `
                                <div class="ux-law-card">
                                    <h4>${law.name}</h4>
                                    <p class="law-description">${law.description}</p>
                                    <div class="law-relevance">
                                        <strong>Relevance:</strong> ${law.relevance}
                                    </div>
                                    <div class="law-implementation">
                                        <strong>Implementation:</strong> ${law.implementation}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="principles-section">
                        <h3>Recommendations</h3>
                        <div class="recommendations-list">
                            ${principlesData.recommendations.map(rec => `
                                <div class="recommendation-item">
                                    <span class="recommendation-text">${rec}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        resultsContainer.querySelector('.principles-placeholder').style.display = 'none';
    }
    
    async savePrinciples() {
        if (!this.currentPrinciples) return;
        
        try {
            const response = await window.uxpilotApp.apiCall('/api/user/design-principles', {
                method: 'POST',
                body: JSON.stringify(this.currentPrinciples)
            });
            
            if (response.success) {
                window.uxpilotApp.showToast('Principles saved successfully!', 'success');
                this.loadSavedPrinciples();
            }
        } catch (error) {
            window.uxpilotApp.showToast('Failed to save principles', 'error');
        }
    }
    
    exportPrinciples() {
        if (!this.currentPrinciples) return;
        
        const exportData = {
            principles: this.currentPrinciples,
            exportedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'design-principles.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.uxpilotApp.showToast('Principles exported!', 'success');
    }
}

// Initialize principles manager
let principlesManager;
document.addEventListener('DOMContentLoaded', () => {
    principlesManager = new PrinciplesManager();
});

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrinciplesManager;
}
