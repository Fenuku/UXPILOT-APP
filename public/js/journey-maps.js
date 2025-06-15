// Enhanced Journey Maps Manager
class JourneyMapManager {
    constructor() {
        this.currentJourney = null;
        this.journeyStages = ['awareness', 'consideration', 'decision', 'action', 'retention'];
        this.personas = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadPersonas();
    }
    
    setupEventListeners() {
        // New journey button
        const newJourneyBtn = document.getElementById('new-journey-btn');
        if (newJourneyBtn) {
            newJourneyBtn.addEventListener('click', this.showNewJourneyModal.bind(this));
        }
        
        // Generate journey button
        const generateBtn = document.getElementById('generate-journey-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', this.generateJourneyMap.bind(this));
        }
        
        // Stage selection
        document.addEventListener('click', (e) => {
            if (e.target.matches('.stage-item')) {
                this.selectStage(e.target.dataset.stage);
            }
        });
        
        // Persona management
        const personaName = document.getElementById('persona-name');
        const personaDescription = document.getElementById('persona-description');
        
        if (personaName) {
            personaName.addEventListener('change', this.updatePersona.bind(this));
        }
        if (personaDescription) {
            personaDescription.addEventListener('change', this.updatePersona.bind(this));
        }
    }
    
    async loadPersonas() {
        try {
            const response = await window.uxpilotApp.apiCall('/api/user/personas');
            if (response.success) {
                this.personas = response.personas;
                this.updatePersonaDropdown();
            }
        } catch (error) {
            console.log('No personas found, starting fresh');
        }
    }
    
    updatePersonaDropdown() {
        const personaSelect = document.getElementById('persona-select');
        if (!personaSelect) return;
        
        personaSelect.innerHTML = `
            <option value="">Create new persona...</option>
            ${this.personas.map(persona => 
                `<option value="${persona._id}">${persona.name}</option>`
            ).join('')}
        `;
    }
    
    selectStage(stage) {
        document.querySelectorAll('.stage-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-stage="${stage}"]`).classList.add('active');
        
        if (this.currentJourney) {
            this.showStageDetails(stage);
        }
    }
    
    showStageDetails(stage) {
        const stageData = this.currentJourney.stages.find(s => s.name === stage);
        if (!stageData) return;
        
        const detailsPanel = document.getElementById('stage-details');
        if (!detailsPanel) return;
        
        detailsPanel.innerHTML = `
            <div class="stage-details-content">
                <h3>${stage.charAt(0).toUpperCase() + stage.slice(1)} Stage</h3>
                
                <div class="stage-section">
                    <h4>Actions</h4>
                    <ul class="stage-list">
                        ${stageData.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="stage-section">
                    <h4>Thoughts</h4>
                    <ul class="stage-list">
                        ${stageData.thoughts.map(thought => `<li>${thought}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="stage-section">
                    <h4>Emotions</h4>
                    <ul class="stage-list emotions">
                        ${stageData.emotions.map(emotion => `<li class="emotion">${emotion}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="stage-section">
                    <h4>Touchpoints</h4>
                    <ul class="stage-list">
                        ${stageData.touchpoints.map(touchpoint => `<li>${touchpoint}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="stage-section">
                    <h4>Pain Points</h4>
                    <ul class="stage-list pain-points">
                        ${stageData.painPoints.map(pain => `<li class="pain-point">${pain}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="stage-section">
                    <h4>Opportunities</h4>
                    <ul class="stage-list opportunities">
                        ${stageData.opportunities.map(opp => `<li class="opportunity">${opp}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }
    
    async generateJourneyMap() {
        const personaName = document.getElementById('persona-name').value;
        const personaDescription = document.getElementById('persona-description').value;
        const journeyPrompt = document.getElementById('journey-prompt').value;
        
        if (!personaName || !journeyPrompt) {
            window.uxpilotApp.showToast('Please fill in persona name and journey scenario', 'warning');
            return;
        }
        
        try {
            const response = await window.uxpilotApp.apiCall('/api/ai/generate-journey', {
                method: 'POST',
                body: JSON.stringify({
                    persona: `${personaName}: ${personaDescription}`,
                    scenario: journeyPrompt,
                    stages: this.journeyStages
                })
            });
            
            if (response.success) {
                this.currentJourney = response.journeyMap.journeyMap;
                this.renderJourneyMap();
                this.showInsights(response.journeyMap.insights, response.journeyMap.recommendations);
                window.uxpilotApp.showToast('Journey map generated successfully!', 'success');
            }
        } catch (error) {
            window.uxpilotApp.showToast(error.message || 'Failed to generate journey map', 'error');
        }
    }
    
    renderJourneyMap() {
        const container = document.getElementById('journey-map-container');
        if (!container || !this.currentJourney) return;
        
        container.innerHTML = `
            <div class="journey-map">
                <div class="journey-header">
                    <div class="persona-info">
                        <h2>${this.currentJourney.persona.name}</h2>
                        <p>${this.currentJourney.persona.description}</p>
                        <div class="persona-goals">
                            <h4>Goals:</h4>
                            <ul>
                                ${this.currentJourney.persona.goals.map(goal => `<li>${goal}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="journey-stages-container">
                    ${this.currentJourney.stages.map((stage, index) => this.renderStage(stage, index)).join('')}
                </div>
                
                <div class="journey-actions">
                    <button class="btn btn-outline" onclick="journeyMapManager.exportJourney()">
                        Export Journey Map
                    </button>
                    <button class="btn btn-outline" onclick="journeyMapManager.shareJourney()">
                        Share Journey Map
                    </button>
                    <button class="btn btn-primary" onclick="journeyMapManager.saveJourney()">
                        Save Journey Map
                    </button>
                </div>
            </div>
        `;
    }
    
    renderStage(stage, index) {
        const stageColors = {
            'awareness': '#3b82f6',
            'consideration': '#8b5cf6',
            'decision': '#10b981',
            'action': '#f59e0b',
            'retention': '#ef4444'
        };
        
        const color = stageColors[stage.name] || '#6b7280';
        
        return `
            <div class="journey-stage" style="border-top-color: ${color}">
                <div class="stage-header">
                    <h3>${stage.name.charAt(0).toUpperCase() + stage.name.slice(1)}</h3>
                    <div class="stage-number">${index + 1}</div>
                </div>
                
                <div class="stage-content">
                    <div class="stage-row">
                        <div class="stage-column">
                            <h4>Actions</h4>
                            <ul class="stage-items">
                                ${stage.actions.map(action => `<li>${action}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div class="stage-column">
                            <h4>Thoughts</h4>
                            <ul class="stage-items thoughts">
                                ${stage.thoughts.map(thought => `<li>${thought}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    
                    <div class="stage-row">
                        <div class="stage-column">
                            <h4>Emotions</h4>
                            <div class="emotion-indicators">
                                ${stage.emotions.map(emotion => `
                                    <span class="emotion-tag ${this.getEmotionClass(emotion)}">${emotion}</span>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="stage-column">
                            <h4>Touchpoints</h4>
                            <ul class="stage-items touchpoints">
                                ${stage.touchpoints.map(touchpoint => `<li>${touchpoint}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    
                    <div class="stage-row">
                        <div class="stage-column">
                            <h4>Pain Points</h4>
                            <ul class="stage-items pain-points">
                                ${stage.painPoints.map(pain => `<li class="pain-point">${pain}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div class="stage-column">
                            <h4>Opportunities</h4>
                            <ul class="stage-items opportunities">
                                ${stage.opportunities.map(opp => `<li class="opportunity">${opp}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getEmotionClass(emotion) {
        const positiveEmotions = ['happy', 'excited', 'satisfied', 'confident', 'delighted'];
        const negativeEmotions = ['frustrated', 'confused', 'angry', 'disappointed', 'worried'];
        
        if (positiveEmotions.some(pos => emotion.toLowerCase().includes(pos))) {
            return 'positive';
        } else if (negativeEmotions.some(neg => emotion.toLowerCase().includes(neg))) {
            return 'negative';
        }
        return 'neutral';
    }
    
    showInsights(insights, recommendations) {
        const insightsContainer = document.getElementById('journey-insights');
        if (!insightsContainer) return;
        
        insightsContainer.innerHTML = `
            <div class="insights-panel">
                <div class="insights-section">
                    <h3>Key Insights</h3>
                    <ul class="insights-list">
                        ${insights.map(insight => `<li>${insight}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="recommendations-section">
                    <h3>Recommendations</h3>
                    <ul class="recommendations-list">
                        ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        
        insightsContainer.classList.remove('hidden');
    }
    
    showNewJourneyModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Create New Journey Map</h2>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <form id="new-journey-form">
                        <div class="form-group">
                            <label for="journey-title">Journey Map Title</label>
                            <input type="text" id="journey-title" required placeholder="e.g., Customer Onboarding Journey">
                        </div>
                        
                        <div class="form-group">
                            <label for="journey-persona-select">Select Persona</label>
                            <select id="journey-persona-select">
                                <option value="">Create new persona...</option>
                                ${this.personas.map(persona => 
                                    `<option value="${persona._id}">${persona.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group persona-details">
                            <label for="new-persona-name">Persona Name</label>
                            <input type="text" id="new-persona-name" placeholder="e.g., Sarah, Marketing Manager">
                        </div>
                        
                        <div class="form-group persona-details">
                            <label for="new-persona-description">Persona Description</label>
                            <textarea id="new-persona-description" rows="3" placeholder="Describe the persona's background, goals, and context..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="journey-scenario">Journey Scenario</label>
                            <textarea id="journey-scenario" rows="3" required placeholder="Describe the user's journey scenario..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Journey Stages</label>
                            <div class="stages-selection">
                                ${this.journeyStages.map(stage => `
                                    <label class="checkbox-label">
                                        <input type="checkbox" value="${stage}" checked>
                                        <span class="checkmark"></span>
                                        ${stage.charAt(0).toUpperCase() + stage.slice(1)}
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-ghost" onclick="this.closest('.modal').remove()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Create Journey Map</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup event listeners
        const form = modal.querySelector('#new-journey-form');
        const personaSelect = modal.querySelector('#journey-persona-select');
        const personaDetails = modal.querySelectorAll('.persona-details');
        
        personaSelect.addEventListener('change', () => {
            const showDetails = personaSelect.value === '';
            personaDetails.forEach(detail => {
                if (showDetails) {
                    detail.classList.remove('hidden');
                } else {
                    detail.classList.add('hidden');
                }
            });
        });
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createJourneyFromModal(form, modal);
        });
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    async createJourneyFromModal(form, modal) {
        const formData = new FormData(form);
        const selectedStages = Array.from(form.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        const journeyData = {
            title: formData.get('journey-title'),
            personaId: formData.get('journey-persona-select'),
            personaName: formData.get('new-persona-name'),
            personaDescription: formData.get('new-persona-description'),
            scenario: formData.get('journey-scenario'),
            stages: selectedStages
        };
        
        try {
            const response = await window.uxpilotApp.apiCall('/api/ai/generate-journey', {
                method: 'POST',
                body: JSON.stringify({
                    persona: journeyData.personaId ? 
                        this.personas.find(p => p._id === journeyData.personaId) :
                        `${journeyData.personaName}: ${journeyData.personaDescription}`,
                    scenario: journeyData.scenario,
                    stages: journeyData.stages,
                    title: journeyData.title
                })
            });
            
            if (response.success) {
                document.body.removeChild(modal);
                this.currentJourney = response.journeyMap.journeyMap;
                this.renderJourneyMap();
                window.uxpilotApp.showToast('Journey map created successfully!', 'success');
            }
        } catch (error) {
            window.uxpilotApp.showToast(error.message || 'Failed to create journey map', 'error');
        }
    }
    
    async saveJourney() {
        if (!this.currentJourney) return;
        
        try {
            const response = await window.uxpilotApp.apiCall('/api/user/projects', {
                method: 'POST',
                body: JSON.stringify({
                    title: `Journey Map: ${this.currentJourney.persona.name}`,
                    type: 'journey-map',
                    canvasData: this.currentJourney,
                    description: `User journey map for ${this.currentJourney.persona.name}`
                })
            });
            
            if (response.success) {
                window.uxpilotApp.showToast('Journey map saved successfully!', 'success');
            }
        } catch (error) {
            window.uxpilotApp.showToast('Failed to save journey map', 'error');
        }
    }
    
    exportJourney() {
        if (!this.currentJourney) return;
        
        const exportData = {
            journeyMap: this.currentJourney,
            exportedAt: new Date().toISOString(),
            format: 'json'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `journey-map-${this.currentJourney.persona.name.replace(/\s+/g, '-').toLowerCase()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.uxpilotApp.showToast('Journey map exported!', 'success');
    }
    
    shareJourney() {
        if (!this.currentJourney) return;
        
        // Implementation for sharing journey map
        window.uxpilotApp.showToast('Journey map sharing coming soon!', 'info');
    }
    
    updatePersona() {
        // Update persona information in real-time
        const name = document.getElementById('persona-name').value;
        const description = document.getElementById('persona-description').value;
        
        if (this.currentJourney && this.currentJourney.persona) {
            this.currentJourney.persona.name = name;
            this.currentJourney.persona.description = description;
        }
    }
}

// Initialize journey map manager
let journeyMapManager;
document.addEventListener('DOMContentLoaded', () => {
    journeyMapManager = new JourneyMapManager();
});

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JourneyMapManager;
}