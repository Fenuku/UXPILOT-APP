// Enhanced Project Manager with Professional Features
class ProjectManager {
    constructor() {
        this.projects = [];
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.collaborationEnabled = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadProjects();
    }
    
    setupEventListeners() {
        // New project button
        const newProjectBtn = document.getElementById('new-project-btn');
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', this.showNewProjectModal.bind(this));
        }
        
        // Filter tabs
        document.addEventListener('click', (e) => {
            if (e.target.matches('.filter-tab')) {
                this.setFilter(e.target.dataset.filter);
            }
        });
        
        // Search functionality
        const searchInput = document.getElementById('projects-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearch.bind(this));
        }
        
        // Project actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('.project-open-btn')) {
                this.openProject(e.target.dataset.projectId);
            } else if (e.target.matches('.project-share-btn')) {
                this.shareProject(e.target.dataset.projectId);
            } else if (e.target.matches('.project-duplicate-btn')) {
                this.duplicateProject(e.target.dataset.projectId);
            } else if (e.target.matches('.project-delete-btn')) {
                this.deleteProject(e.target.dataset.projectId);
            } else if (e.target.matches('.project-export-btn')) {
                this.exportProject(e.target.dataset.projectId);
            }
        });
    }
    
    async loadProjects() {
        try {
            const response = await window.uxpilotApp.apiCall('/api/user/projects');
            if (response.success) {
                this.projects = response.projects;
                this.renderProjects();
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
            window.uxpilotApp.showToast('Failed to load projects', 'error');
        }
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderProjects();
    }
    
    handleSearch(e) {
        this.currentSearch = e.target.value.toLowerCase();
        this.renderProjects();
    }
    
    renderProjects() {
        const projectsGrid = document.getElementById('projects-grid');
        const emptyState = document.getElementById('projects-empty');
        
        if (!projectsGrid) return;
        
        // Filter projects
        let filteredProjects = this.projects;
        
        if (this.currentFilter !== 'all') {
            filteredProjects = filteredProjects.filter(project => 
                project.type === this.currentFilter
            );
        }
        
        if (this.currentSearch) {
            filteredProjects = filteredProjects.filter(project =>
                project.title.toLowerCase().includes(this.currentSearch) ||
                project.description.toLowerCase().includes(this.currentSearch) ||
                project.tags.some(tag => tag.toLowerCase().includes(this.currentSearch))
            );
        }
        
        if (filteredProjects.length === 0) {
            projectsGrid.classList.add('hidden');
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        
        projectsGrid.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        
        projectsGrid.innerHTML = filteredProjects.map(project => this.renderProjectCard(project)).join('');
    }
    
    renderProjectCard(project) {
        const typeIcons = {
            'wireframe': '🖼️',
            'journey-map': '🗺️',
            'component': '🧩',
            'analysis': '📊'
        };
        
        const lastModified = new Date(project.updatedAt).toLocaleDateString();
        const isShared = project.isPublic || (project.collaborators && project.collaborators.length > 0);
        
        return `
            <div class="project-card" data-project-id="${project._id}">
                <div class="project-preview">
                    ${project.thumbnail ? 
                        `<img src="${project.thumbnail}" alt="${project.title}">` :
                        `<div class="project-placeholder">
                            <span class="project-type-icon">${typeIcons[project.type] || '📄'}</span>
                        </div>`
                    }
                    ${isShared ? '<div class="project-shared-badge">Shared</div>' : ''}
                </div>
                
                <div class="project-info">
                    <div class="project-header">
                        <h3 class="project-title">${project.title}</h3>
                        <div class="project-type">${project.type.replace('-', ' ')}</div>
                    </div>
                    
                    <p class="project-description">${project.description || 'No description'}</p>
                    
                    <div class="project-tags">
                        ${project.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
                    </div>
                    
                    <div class="project-meta">
                        <span class="project-date">Modified ${lastModified}</span>
                        ${project.accessibilityScore ? 
                            `<span class="accessibility-badge score-${this.getScoreClass(project.accessibilityScore)}">
                                A11y: ${project.accessibilityScore}%
                            </span>` : ''
                        }
                    </div>
                    
                    <div class="project-actions">
                        <button class="btn btn-primary btn-small project-open-btn" data-project-id="${project._id}">
                            Open
                        </button>
                        <div class="project-menu">
                            <button class="btn btn-ghost btn-small project-menu-btn">⋯</button>
                            <div class="project-menu-dropdown">
                                <button class="project-share-btn" data-project-id="${project._id}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                                        <polyline points="16,6 12,2 8,6"/>
                                        <line x1="12" y1="2" x2="12" y2="15"/>
                                    </svg>
                                    Share
                                </button>
                                <button class="project-duplicate-btn" data-project-id="${project._id}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                                    </svg>
                                    Duplicate
                                </button>
                                <button class="project-export-btn" data-project-id="${project._id}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                        <polyline points="7 10l5-5 5 5"/>
                                        <line x1="12" y1="15" x2="12" y2="4"/>
                                    </svg>
                                    Export
                                </button>
                                <button class="project-delete-btn" data-project-id="${project._id}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3,6 5,6 21,6"/>
                                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getScoreClass(score) {
        if (score >= 80) return 'good';
        if (score >= 60) return 'medium';
        return 'poor';
    }
    
    showNewProjectModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Create New Project</h2>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <form id="new-project-form">
                        <div class="form-group">
                            <label for="project-title">Project Title</label>
                            <input type="text" id="project-title" required placeholder="Enter project title">
                        </div>
                        
                        <div class="form-group">
                            <label for="project-description">Description</label>
                            <textarea id="project-description" rows="3" placeholder="Describe your project..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="project-type">Project Type</label>
                            <select id="project-type" required>
                                <option value="wireframe">Wireframe</option>
                                <option value="journey-map">User Journey Map</option>
                                <option value="component">Component Design</option>
                                <option value="analysis">Design Analysis</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="project-tags">Tags (comma-separated)</label>
                            <input type="text" id="project-tags" placeholder="web, mobile, dashboard">
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="project-template">
                                <span class="checkmark"></span>
                                Start with AI-generated template
                            </label>
                        </div>
                        
                        <div class="form-group template-prompt hidden">
                            <label for="template-prompt">Describe what you want to create</label>
                            <textarea id="template-prompt" rows="2" placeholder="e.g., A dashboard for project management with charts and task lists"></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-ghost" onclick="this.closest('.modal').remove()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Create Project</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup event listeners
        const form = modal.querySelector('#new-project-form');
        const templateCheckbox = modal.querySelector('#project-template');
        const templatePrompt = modal.querySelector('.template-prompt');
        
        templateCheckbox.addEventListener('change', () => {
            if (templateCheckbox.checked) {
                templatePrompt.classList.remove('hidden');
            } else {
                templatePrompt.classList.add('hidden');
            }
        });
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createProject(form, modal);
        });
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    async createProject(form, modal) {
        const formData = new FormData(form);
        const projectData = {
            title: formData.get('project-title') || document.getElementById('project-title').value,
            description: formData.get('project-description') || document.getElementById('project-description').value,
            type: formData.get('project-type') || document.getElementById('project-type').value,
            tags: (formData.get('project-tags') || document.getElementById('project-tags').value)
                .split(',').map(tag => tag.trim()).filter(tag => tag),
            useTemplate: document.getElementById('project-template').checked,
            templatePrompt: document.getElementById('template-prompt').value
        };
        
        try {
            let response;
            
            if (projectData.useTemplate && projectData.templatePrompt) {
                // Create project with AI template
                response = await window.uxpilotApp.apiCall('/api/ai/generate-wireframe', {
                    method: 'POST',
                    body: JSON.stringify({
                        prompt: projectData.templatePrompt,
                        projectType: projectData.type,
                        title: projectData.title,
                        description: projectData.description,
                        tags: projectData.tags
                    })
                });
            } else {
                // Create empty project
                response = await window.uxpilotApp.apiCall('/api/user/projects', {
                    method: 'POST',
                    body: JSON.stringify(projectData)
                });
            }
            
            if (response.success) {
                document.body.removeChild(modal);
                window.uxpilotApp.showToast('Project created successfully!', 'success');
                this.loadProjects();
                
                // Open the new project
                if (response.project) {
                    this.openProject(response.project._id);
                }
            }
        } catch (error) {
            window.uxpilotApp.showToast(error.message || 'Failed to create project', 'error');
        }
    }
    
    openProject(projectId) {
        // Navigate to canvas with project loaded
        window.uxpilotApp.navigateTo('canvas');
        
        // Load project data into canvas
        if (window.canvasManager) {
            window.canvasManager.loadProject(projectId);
        }
    }
    
    async shareProject(projectId) {
        const project = this.projects.find(p => p._id === projectId);
        if (!project) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Share Project</h2>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="share-options">
                        <div class="share-option">
                            <h3>Public Link</h3>
                            <p>Anyone with the link can view this project</p>
                            <div class="share-link-container">
                                <input type="text" id="share-link" value="${window.location.origin}/shared/${projectId}" readonly>
                                <button class="btn btn-outline" onclick="projectManager.copyShareLink()">Copy</button>
                            </div>
                            <label class="checkbox-label">
                                <input type="checkbox" id="make-public" ${project.isPublic ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Make project publicly accessible
                            </label>
                        </div>
                        
                        <div class="share-option">
                            <h3>Invite Collaborators</h3>
                            <p>Invite team members to collaborate on this project</p>
                            <div class="collaborator-invite">
                                <input type="email" id="collaborator-email" placeholder="Enter email address">
                                <select id="collaborator-role">
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <button class="btn btn-primary" onclick="projectManager.inviteCollaborator('${projectId}')">Invite</button>
                            </div>
                        </div>
                        
                        <div class="share-option">
                            <h3>Export Options</h3>
                            <p>Share your project in different formats</p>
                            <div class="export-buttons">
                                <button class="btn btn-outline" onclick="projectManager.exportProject('${projectId}', 'pdf')">
                                    Export as PDF
                                </button>
                                <button class="btn btn-outline" onclick="projectManager.exportProject('${projectId}', 'figma')">
                                    Export to Figma
                                </button>
                                <button class="btn btn-outline" onclick="projectManager.exportProject('${projectId}', 'notion')">
                                    Export to Notion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Handle public toggle
        modal.querySelector('#make-public').addEventListener('change', async (e) => {
            try {
                await window.uxpilotApp.apiCall(`/api/user/projects/${projectId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ isPublic: e.target.checked })
                });
                
                window.uxpilotApp.showToast(
                    e.target.checked ? 'Project is now public' : 'Project is now private',
                    'success'
                );
            } catch (error) {
                window.uxpilotApp.showToast('Failed to update project visibility', 'error');
                e.target.checked = !e.target.checked; // Revert
            }
        });
    }
    
    copyShareLink() {
        const linkInput = document.getElementById('share-link');
        linkInput.select();
        navigator.clipboard.writeText(linkInput.value);
        window.uxpilotApp.showToast('Share link copied to clipboard!', 'success');
    }
    
    async inviteCollaborator(projectId) {
        const email = document.getElementById('collaborator-email').value;
        const role = document.getElementById('collaborator-role').value;
        
        if (!email) {
            window.uxpilotApp.showToast('Please enter an email address', 'warning');
            return;
        }
        
        try {
            const response = await window.uxpilotApp.apiCall(`/api/projects/${projectId}/collaborators`, {
                method: 'POST',
                body: JSON.stringify({ email, role })
            });
            
            if (response.success) {
                window.uxpilotApp.showToast('Collaborator invited successfully!', 'success');
                document.getElementById('collaborator-email').value = '';
            }
        } catch (error) {
            window.uxpilotApp.showToast(error.message || 'Failed to invite collaborator', 'error');
        }
    }
    
    async duplicateProject(projectId) {
        try {
            const response = await window.uxpilotApp.apiCall(`/api/user/projects/${projectId}/duplicate`, {
                method: 'POST'
            });
            
            if (response.success) {
                window.uxpilotApp.showToast('Project duplicated successfully!', 'success');
                this.loadProjects();
            }
        } catch (error) {
            window.uxpilotApp.showToast('Failed to duplicate project', 'error');
        }
    }
    
    async deleteProject(projectId) {
        const project = this.projects.find(p => p._id === projectId);
        if (!project) return;
        
        if (!confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            const response = await window.uxpilotApp.apiCall(`/api/user/projects/${projectId}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                window.uxpilotApp.showToast('Project deleted successfully', 'success');
                this.loadProjects();
            }
        } catch (error) {
            window.uxpilotApp.showToast('Failed to delete project', 'error');
        }
    }
    
    async exportProject(projectId, format) {
        try {
            const response = await window.uxpilotApp.apiCall(`/api/design/export/${projectId}`, {
                method: 'POST',
                body: JSON.stringify({ format })
            });
            
            if (response.success) {
                if (format === 'pdf' && response.export.downloadUrl) {
                    window.open(response.export.downloadUrl, '_blank');
                } else if (format === 'figma' && response.export.figmaUrl) {
                    window.open(response.export.figmaUrl, '_blank');
                } else if (format === 'notion' && response.export.notionBlocks) {
                    this.showNotionExport(response.export.notionBlocks);
                }
                
                window.uxpilotApp.showToast(response.message, 'success');
            }
        } catch (error) {
            window.uxpilotApp.showToast(error.message || 'Export failed', 'error');
        }
    }
    
    showNotionExport(notionBlocks) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>Notion Export</h2>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <p>Copy the following blocks and paste them into your Notion page:</p>
                    <div class="notion-blocks">
                        <pre><code>${JSON.stringify(notionBlocks, null, 2)}</code></pre>
                    </div>
                    <div class="export-actions">
                        <button class="btn btn-primary" onclick="projectManager.copyNotionBlocks()">
                            Copy to Clipboard
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        this.currentNotionBlocks = notionBlocks;
    }
    
    copyNotionBlocks() {
        if (this.currentNotionBlocks) {
            navigator.clipboard.writeText(JSON.stringify(this.currentNotionBlocks, null, 2));
            window.uxpilotApp.showToast('Notion blocks copied to clipboard!', 'success');
        }
    }
}

// Initialize project manager
let projectManager;
document.addEventListener('DOMContentLoaded', () => {
    projectManager = new ProjectManager();
});

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectManager;
}
