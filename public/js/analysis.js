// Analysis Manager - handles design analysis features
class AnalysisManager {
    constructor() {
        this.currentAnalysis = null;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Input tab switching is handled in ai.js
        // This manager focuses on analysis-specific features
        
        // Performance analysis
        const performanceBtn = document.getElementById('performance-analysis-btn');
        if (performanceBtn) {
            performanceBtn.addEventListener('click', this.runPerformanceAnalysis.bind(this));
        }
        
        // Competitive analysis
        const competitiveBtn = document.getElementById('competitive-analysis-btn');
        if (competitiveBtn) {
            competitiveBtn.addEventListener('click', this.showCompetitiveAnalysisModal.bind(this));
        }
        
        // Trend analysis
        const trendBtn = document.getElementById('trend-analysis-btn');
        if (trendBtn) {
            trendBtn.addEventListener('click', this.runTrendAnalysis.bind(this));
        }
    }
    
    async runPerformanceAnalysis() {
        if (!window.uxpilotApp.currentUser.isPro) {
            window.uxpilotApp.showToast('Performance analysis is a Pro feature', 'warning');
            window.uxpilotApp.showPaymentModal();
            return;
        }
        
        try {
            // Get user's recent projects for analysis
            const projectsResponse = await window.uxpilotApp.apiCall('/api/user/projects?limit=10');
            if (!projectsResponse.success || projectsResponse.projects.length === 0) {
                window.uxpilotApp.showToast('No projects found for analysis', 'warning');
                return;
            }
            
            const projectIds = projectsResponse.projects.map(p => p._id);
            
            const response = await window.uxpilotApp.apiCall('/api/analytics/performance-report', {
                method: 'POST',
                body: JSON.stringify({
                    projectIds,
                    metrics: ['accessibility', 'usability', 'consistency']
                })
            });
            
            if (response.success) {
                this.displayPerformanceReport(response.report);
            }
        } catch (error) {
            window.uxpilotApp.showToast(error.message || 'Performance analysis failed', 'error');
        }
    }
    
    displayPerformanceReport(report) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>Performance Analysis Report</h2>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="performance-report">
                        <div class="report-summary">
                            <h3>Summary</h3>
                            <div class="summary-stats">
                                <div class="stat-card">
                                    <div class="stat-value">${report.projectCount}</div>
                                    <div class="stat-label">Projects Analyzed</div>
                                </div>
                                ${report.metrics.accessibility ? `
                                    <div class="stat-card">
                                        <div class="stat-value">${Math.round(report.metrics.accessibility.average)}%</div>
                                        <div class="stat-label">Avg Accessibility</div>
                                    </div>
                                ` : ''}
                                ${report.metrics.usability ? `
                                    <div class="stat-card">
                                        <div class="stat-value">${Math.round(report.metrics.usability.average)}%</div>
                                        <div class="stat-label">Avg Usability</div>
                                    </div>
                                ` : ''}
                                ${report.metrics.consistency ? `
                                    <div class="stat-card">
                                        <div class="stat-value">${Math.round(report.metrics.consistency.consistencyScore)}%</div>
                                        <div class="stat-label">Consistency Score</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${report.metrics.accessibility ? `
                            <div class="report-section">
                                <h3>Accessibility Analysis</h3>
                                <div class="accessibility-breakdown">
                                    <div class="score-distribution">
                                        <div class="distribution-item excellent">
                                            <span class="count">${report.metrics.accessibility.distribution.excellent}</span>
                                            <span class="label">Excellent (90%+)</span>
                                        </div>
                                        <div class="distribution-item good">
                                            <span class="count">${report.metrics.accessibility.distribution.good}</span>
                                            <span class="label">Good (70-89%)</span>
                                        </div>
                                        <div class="distribution-item needs-improvement">
                                            <span class="count">${report.metrics.accessibility.distribution.needsImprovement}</span>
                                            <span class="label">Needs Improvement (<70%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="report-section">
                            <h3>Recommendations</h3>
                            <div class="recommendations-list">
                                ${report.recommendations.map(rec => `
                                    <div class="recommendation-item priority-${rec.priority}">
                                        <div class="recommendation-header">
                                            <span class="recommendation-type">${rec.type}</span>
                                            <span class="recommendation-priority">${rec.priority} priority</span>
                                        </div>
                                        <div class="recommendation-message">${rec.message}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="report-actions">
                            <button class="btn btn-outline" onclick="analysisManager.exportReport()">
                                Export Report
                            </button>
                            <button class="btn btn-primary" onclick="analysisManager.scheduleFollowUp()">
                                Schedule Follow-up
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        this.currentReport = report;
    }
    
    showCompetitiveAnalysisModal() {
        if (!window.uxpilotApp.currentUser.isPro) {
            window.uxpilotApp.showToast('Competitive analysis is a Pro feature', 'warning');
            window.uxpilotApp.showPaymentModal();
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Competitive Analysis</h2>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <form id="competitive-analysis-form">
                        <div class="form-group">
                            <label>Competitors to Analyze</label>
                            <div class="competitors-input">
                                <input type="text" id="competitor-1" placeholder="Competitor 1 (e.g., Figma)">
                                <input type="text" id="competitor-2" placeholder="Competitor 2 (e.g., Sketch)">
                                <input type="text" id="competitor-3" placeholder="Competitor 3 (e.g., Adobe XD)">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="analysis-focus">Analysis Focus</label>
                            <select id="analysis-focus">
                                <option value="features">Feature Comparison</option>
                                <option value="usability">Usability Analysis</option>
                                <option value="design">Design Quality</option>
                                <option value="pricing">Pricing Strategy</option>
                                <option value="overall">Overall Comparison</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="industry-context">Industry Context</label>
                            <textarea id="industry-context" rows="3" placeholder="Describe your industry and target market..."></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-ghost" onclick="this.closest('.modal').remove()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Run Analysis</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#competitive-analysis-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const competitors = [
                document.getElementById('competitor-1').value,
                document.getElementById('competitor-2').value,
                document.getElementById('competitor-3').value
            ].filter(comp => comp.trim());
            
            if (competitors.length === 0) {
                window.uxpilotApp.showToast('Please enter at least one competitor', 'warning');
                return;
            }
            
            document.body.removeChild(modal);
            await this.runCompetitiveAnalysis(competitors);
        });
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    async runCompetitiveAnalysis(competitors) {
        try {
            // Simulate competitive analysis (in real app, this would call AI service)
            const analysisData = {
                competitors: competitors.map(comp => ({
                    name: comp,
                    strengths: [
                        'Strong user interface',
                        'Good performance',
                        'Active community'
                    ],
                    weaknesses: [
                        'Limited features',
                        'Pricing concerns',
                        'Learning curve'
                    ],
                    score: Math.floor(Math.random() * 3) + 7 // 7-10
                })),
                insights: [
                    'Market is highly competitive with focus on collaboration',
                    'Users value ease of use over advanced features',
                    'Integration capabilities are becoming key differentiators'
                ],
                recommendations: [
                    'Focus on unique AI-powered features',
                    'Improve onboarding experience',
                    'Develop strategic partnerships'
                ]
            };
            
            if (window.aiManager) {
                window.aiManager.displayCompetitiveAnalysis(analysisData);
            }
        } catch (error) {
            window.uxpilotApp.showToast('Competitive analysis failed', 'error');
        }
    }
    
    async runTrendAnalysis() {
        if (!window.uxpilotApp.currentUser.isPro) {
            window.uxpilotApp.showToast('Trend analysis is a Pro feature', 'warning');
            window.uxpilotApp.showPaymentModal();
            return;
        }
        
        try {
            // Simulate trend analysis
            const trendsData = [
                {
                    name: 'Neumorphism',
                    popularity: 'Medium',
                    description: 'Soft, extruded plastic look that creates subtle depth',
                    examples: ['Soft shadows', 'Subtle highlights', 'Minimal contrast'],
                    recommendation: 'Use sparingly for key interactive elements'
                },
                {
                    name: 'Dark Mode',
                    popularity: 'High',
                    description: 'Dark color schemes that reduce eye strain',
                    examples: ['System preference detection', 'Toggle switches', 'Proper contrast ratios'],
                    recommendation: 'Essential for modern applications'
                },
                {
                    name: 'Micro-interactions',
                    popularity: 'High',
                    description: 'Small animations that provide feedback',
                    examples: ['Button hover states', 'Loading animations', 'Form validation'],
                    recommendation: 'Implement thoughtfully to enhance UX'
                }
            ];
            
            if (window.aiManager) {
                window.aiManager.displayTrendAnalysis(trendsData);
            }
        } catch (error) {
            window.uxpilotApp.showToast('Trend analysis failed', 'error');
        }
    }
    
    exportReport() {
        if (!this.currentReport) return;
        
        const reportData = {
            ...this.currentReport,
            exportedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `performance-report-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.uxpilotApp.showToast('Report exported!', 'success');
    }
    
    scheduleFollowUp() {
        window.uxpilotApp.showToast('Follow-up scheduled! We\'ll remind you in 30 days.', 'success');
    }
}

// Initialize analysis manager
let analysisManager;
document.addEventListener('DOMContentLoaded', () => {
    analysisManager = new AnalysisManager();
});

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalysisManager;
}