// Enhanced Canvas Manager with Professional Features
class CanvasManager {
    constructor() {
        this.canvas = null;
        this.isCollaborating = false;
        this.collaborators = new Map();
        this.comments = [];
        this.selectedComponent = null;
        this.designSystem = null;
        this.versionHistory = [];
        this.currentVersion = 1;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupCollaboration();
        this.loadDesignSystem();
    }
    
    setupCanvas() {
        const canvasElement = document.getElementById('design-canvas');
        if (!canvasElement) return;
        
        this.canvas = new fabric.Canvas('design-canvas', {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff'
        });
        
        // Enable object controls
        this.canvas.on('selection:created', this.handleSelection.bind(this));
        this.canvas.on('selection:updated', this.handleSelection.bind(this));
        this.canvas.on('selection:cleared', this.handleSelectionCleared.bind(this));
        this.canvas.on('object:modified', this.handleObjectModified.bind(this));
        this.canvas.on('mouse:down', this.handleMouseDown.bind(this));
        
        // Auto-save functionality
        this.canvas.on('object:added', this.autoSave.bind(this));
        this.canvas.on('object:removed', this.autoSave.bind(this));
        this.canvas.on('object:modified', this.autoSave.bind(this));
    }
    
    setupEventListeners() {
        // Tool selection
        document.addEventListener('click', (e) => {
            if (e.target.matches('.tool-btn')) {
                this.selectTool(e.target.dataset.tool);
            }
        });
        
        // Component library
        document.addEventListener('click', (e) => {
            if (e.target.matches('.component-item')) {
                this.addComponent(e.target.dataset.component);
            }
        });
        
        // AI wireframe generation
        const generateBtn = document.getElementById('generate-wireframe-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', this.generateWireframe.bind(this));
        }
        
        // Save and export
        const saveBtn = document.getElementById('save-canvas-btn');
        const exportBtn = document.getElementById('export-canvas-btn');
        
        if (saveBtn) saveBtn.addEventListener('click', this.saveCanvas.bind(this));
        if (exportBtn) exportBtn.addEventListener('click', this.showExportModal.bind(this));
        
        // Undo/Redo
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        if (undoBtn) undoBtn.addEventListener('click', this.undo.bind(this));
        if (redoBtn) redoBtn.addEventListener('click', this.redo.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }
    
    setupCollaboration() {
        // Real-time collaboration setup (WebSocket would be implemented here)
        this.collaborationSocket = null;
        
        // Simulate real-time collaboration for demo
        if (window.uxpilotApp?.currentUser?.isPro) {
            this.enableCollaboration();
        }
    }
    
    enableCollaboration() {
        this.isCollaborating = true;
        
        // Add collaboration indicators
        const collaborationIndicator = document.createElement('div');
        collaborationIndicator.className = 'collaboration-indicator';
        collaborationIndicator.innerHTML = `
            <div class="collaborator-avatars">
                <div class="collaborator-avatar">
                    <img src="${window.uxpilotApp.currentUser.avatar}" alt="You">
                    <span class="status online"></span>
                </div>
            </div>
            <span class="collaboration-status">Live collaboration enabled</span>
        `;
        
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer) {
            canvasContainer.appendChild(collaborationIndicator);
        }
    }
    
    async loadDesignSystem() {
        try {
            // Load team design system if available
            const response = await window.uxpilotApp.apiCall('/api/team/design-system');
            if (response.success) {
                this.designSystem = response.designSystem;
                this.updateComponentLibrary();
            }
        } catch (error) {
            console.log('No design system found, using defaults');
        }
    }
    
    updateComponentLibrary() {
        if (!this.designSystem) return;
        
        const componentGrid = document.querySelector('.component-grid');
        if (!componentGrid) return;
        
        // Add design system components
        this.designSystem.components.forEach(component => {
            const componentItem = document.createElement('div');
            componentItem.className = 'component-item';
            componentItem.dataset.component = component._id;
            componentItem.innerHTML = `
                <div class="component-preview">
                    <img src="${component.designData.preview}" alt="${component.name}">
                </div>
                <span>${component.name}</span>
            `;
            componentGrid.appendChild(componentItem);
        });
    }
    
    selectTool(tool) {
        // Remove active class from all tools
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected tool
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
        
        this.currentTool = tool;
        this.canvas.defaultCursor = tool === 'select' ? 'default' : 'crosshair';
    }
    
    addComponent(componentType) {
        let component;
        
        switch (componentType) {
            case 'button':
                component = new fabric.Rect({
                    left: 100,
                    top: 100,
                    width: 120,
                    height: 40,
                    fill: '#6366f1',
                    rx: 6,
                    ry: 6
                });
                
                const buttonText = new fabric.Text('Button', {
                    left: 160,
                    top: 120,
                    fontSize: 14,
                    fill: '#ffffff',
                    fontFamily: 'Inter',
                    originX: 'center',
                    originY: 'center'
                });
                
                const buttonGroup = new fabric.Group([component, buttonText], {
                    left: 100,
                    top: 100,
                    componentType: 'button'
                });
                
                this.canvas.add(buttonGroup);
                break;
                
            case 'input':
                component = new fabric.Rect({
                    left: 100,
                    top: 100,
                    width: 200,
                    height: 40,
                    fill: '#ffffff',
                    stroke: '#d1d5db',
                    strokeWidth: 1,
                    rx: 4,
                    ry: 4,
                    componentType: 'input'
                });
                this.canvas.add(component);
                break;
                
            case 'card':
                component = new fabric.Rect({
                    left: 100,
                    top: 100,
                    width: 300,
                    height: 200,
                    fill: '#ffffff',
                    stroke: '#e5e7eb',
                    strokeWidth: 1,
                    rx: 8,
                    ry: 8,
                    shadow: new fabric.Shadow({
                        color: 'rgba(0, 0, 0, 0.1)',
                        blur: 10,
                        offsetX: 0,
                        offsetY: 4
                    }),
                    componentType: 'card'
                });
                this.canvas.add(component);
                break;
                
            case 'navigation':
                const navBar = new fabric.Rect({
                    left: 50,
                    top: 50,
                    width: 700,
                    height: 60,
                    fill: '#1f2937',
                    componentType: 'navigation'
                });
                this.canvas.add(navBar);
                break;
        }
        
        this.canvas.renderAll();
        this.saveVersion();
    }
    
    async generateWireframe() {
        const promptInput = document.getElementById('ai-prompt-input');
        const prompt = promptInput?.value.trim();
        
        if (!prompt) {
            window.uxpilotApp.showToast('Please enter a design prompt', 'warning');
            return;
        }
        
        const loadingElement = document.getElementById('canvas-loading');
        if (loadingElement) {
            loadingElement.classList.remove('hidden');
        }
        
        try {
            const response = await window.uxpilotApp.apiCall('/api/ai/generate-wireframe', {
                method: 'POST',
                body: JSON.stringify({ prompt })
            });
            
            if (response.success) {
                this.loadWireframeData(response.wireframe);
                this.showAISuggestions(response.wireframe.suggestions);
                window.uxpilotApp.showToast('Wireframe generated successfully!', 'success');
            }
        } catch (error) {
            console.error('Wireframe generation error:', error);
            window.uxpilotApp.showToast(error.message || 'Failed to generate wireframe', 'error');
        } finally {
            if (loadingElement) {
                loadingElement.classList.add('hidden');
            }
        }
    }
    
    loadWireframeData(wireframeData) {
        // Clear existing canvas
        this.canvas.clear();
        
        // Add elements from AI response
        wireframeData.elements.forEach(element => {
            let fabricObject;
            
            switch (element.type) {
                case 'rectangle':
                    fabricObject = new fabric.Rect({
                        left: element.x,
                        top: element.y,
                        width: element.width,
                        height: element.height,
                        fill: element.style?.fill || '#f3f4f6',
                        stroke: element.style?.stroke || '#d1d5db',
                        strokeWidth: element.style?.strokeWidth || 1
                    });
                    break;
                    
                case 'circle':
                    fabricObject = new fabric.Circle({
                        left: element.x,
                        top: element.y,
                        radius: element.width / 2,
                        fill: element.style?.fill || '#f3f4f6',
                        stroke: element.style?.stroke || '#d1d5db',
                        strokeWidth: element.style?.strokeWidth || 1
                    });
                    break;
                    
                case 'text':
                    fabricObject = new fabric.Text(element.text || 'Text', {
                        left: element.x,
                        top: element.y,
                        fontSize: 16,
                        fontFamily: 'Inter',
                        fill: '#1f2937'
                    });
                    break;
            }
            
            if (fabricObject) {
                this.canvas.add(fabricObject);
            }
        });
        
        this.canvas.renderAll();
        this.saveVersion();
    }
    
    showAISuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('ai-suggestions');
        const suggestionsList = document.getElementById('suggestions-list');
        
        if (!suggestionsContainer || !suggestionsList) return;
        
        suggestionsList.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.innerHTML = `
                <div class="suggestion-content">
                    <span class="suggestion-text">${suggestion}</span>
                    <button class="suggestion-apply-btn" data-suggestion="${suggestion}">
                        Apply
                    </button>
                </div>
            `;
            suggestionsList.appendChild(suggestionItem);
        });
        
        suggestionsContainer.classList.remove('hidden');
    }
    
    handleSelection(e) {
        const selectedObject = e.selected[0];
        this.selectedComponent = selectedObject;
        this.updatePropertiesPanel(selectedObject);
    }
    
    handleSelectionCleared() {
        this.selectedComponent = null;
        this.clearPropertiesPanel();
    }
    
    handleObjectModified(e) {
        this.saveVersion();
        
        // Broadcast changes to collaborators
        if (this.isCollaborating) {
            this.broadcastChange({
                type: 'object:modified',
                object: e.target.toObject(),
                timestamp: Date.now()
            });
        }
    }
    
    handleMouseDown(e) {
        if (e.e.detail === 2) { // Double click
            this.addComment(e.pointer);
        }
    }
    
    updatePropertiesPanel(object) {
        const propertiesContent = document.getElementById('properties-content');
        if (!propertiesContent) return;
        
        propertiesContent.innerHTML = `
            <div class="property-group">
                <h4>Position</h4>
                <div class="property-row">
                    <label>X:</label>
                    <input type="number" id="prop-x" value="${Math.round(object.left)}" min="0">
                </div>
                <div class="property-row">
                    <label>Y:</label>
                    <input type="number" id="prop-y" value="${Math.round(object.top)}" min="0">
                </div>
            </div>
            
            <div class="property-group">
                <h4>Size</h4>
                <div class="property-row">
                    <label>Width:</label>
                    <input type="number" id="prop-width" value="${Math.round(object.width * object.scaleX)}" min="1">
                </div>
                <div class="property-row">
                    <label>Height:</label>
                    <input type="number" id="prop-height" value="${Math.round(object.height * object.scaleY)}" min="1">
                </div>
            </div>
            
            <div class="property-group">
                <h4>Appearance</h4>
                <div class="property-row">
                    <label>Fill:</label>
                    <input type="color" id="prop-fill" value="${object.fill || '#ffffff'}">
                </div>
                <div class="property-row">
                    <label>Stroke:</label>
                    <input type="color" id="prop-stroke" value="${object.stroke || '#000000'}">
                </div>
                <div class="property-row">
                    <label>Stroke Width:</label>
                    <input type="number" id="prop-stroke-width" value="${object.strokeWidth || 0}" min="0">
                </div>
            </div>
            
            <div class="property-group">
                <h4>Actions</h4>
                <button class="btn btn-outline btn-small" onclick="canvasManager.duplicateObject()">Duplicate</button>
                <button class="btn btn-outline btn-small" onclick="canvasManager.deleteObject()">Delete</button>
                <button class="btn btn-outline btn-small" onclick="canvasManager.addToLibrary()">Add to Library</button>
            </div>
        `;
        
        // Add event listeners for property changes
        this.setupPropertyListeners();
    }
    
    setupPropertyListeners() {
        const properties = ['x', 'y', 'width', 'height', 'fill', 'stroke', 'stroke-width'];
        
        properties.forEach(prop => {
            const input = document.getElementById(`prop-${prop}`);
            if (input) {
                input.addEventListener('change', () => {
                    this.updateObjectProperty(prop, input.value);
                });
            }
        });
    }
    
    updateObjectProperty(property, value) {
        if (!this.selectedComponent) return;
        
        switch (property) {
            case 'x':
                this.selectedComponent.set('left', parseInt(value));
                break;
            case 'y':
                this.selectedComponent.set('top', parseInt(value));
                break;
            case 'width':
                this.selectedComponent.set('scaleX', parseInt(value) / this.selectedComponent.width);
                break;
            case 'height':
                this.selectedComponent.set('scaleY', parseInt(value) / this.selectedComponent.height);
                break;
            case 'fill':
                this.selectedComponent.set('fill', value);
                break;
            case 'stroke':
                this.selectedComponent.set('stroke', value);
                break;
            case 'stroke-width':
                this.selectedComponent.set('strokeWidth', parseInt(value));
                break;
        }
        
        this.canvas.renderAll();
        this.saveVersion();
    }
    
    clearPropertiesPanel() {
        const propertiesContent = document.getElementById('properties-content');
        if (propertiesContent) {
            propertiesContent.innerHTML = '<p class="no-selection">Select an object to edit properties</p>';
        }
    }
    
    duplicateObject() {
        if (!this.selectedComponent) return;
        
        this.selectedComponent.clone((cloned) => {
            cloned.set({
                left: cloned.left + 20,
                top: cloned.top + 20
            });
            this.canvas.add(cloned);
            this.canvas.setActiveObject(cloned);
            this.canvas.renderAll();
        });
    }
    
    deleteObject() {
        if (!this.selectedComponent) return;
        
        this.canvas.remove(this.selectedComponent);
        this.selectedComponent = null;
        this.clearPropertiesPanel();
    }
    
    async addToLibrary() {
        if (!this.selectedComponent) return;
        
        try {
            const componentData = {
                name: prompt('Enter component name:') || 'Custom Component',
                category: 'custom',
                designData: {
                    fabricObject: this.selectedComponent.toObject(),
                    preview: this.generatePreview(this.selectedComponent)
                }
            };
            
            const response = await window.uxpilotApp.apiCall('/api/team/components', {
                method: 'POST',
                body: JSON.stringify(componentData)
            });
            
            if (response.success) {
                window.uxpilotApp.showToast('Component added to library!', 'success');
                this.updateComponentLibrary();
            }
        } catch (error) {
            window.uxpilotApp.showToast('Failed to add component to library', 'error');
        }
    }
    
    generatePreview(object) {
        // Create a temporary canvas for preview generation
        const tempCanvas = new fabric.Canvas(document.createElement('canvas'), {
            width: 100,
            height: 100
        });
        
        object.clone((cloned) => {
            // Scale and center the object for preview
            const scale = Math.min(80 / cloned.width, 80 / cloned.height);
            cloned.set({
                left: 50,
                top: 50,
                scaleX: scale,
                scaleY: scale,
                originX: 'center',
                originY: 'center'
            });
            
            tempCanvas.add(cloned);
            tempCanvas.renderAll();
        });
        
        return tempCanvas.toDataURL();
    }
    
    addComment(position) {
        const content = prompt('Add a comment:');
        if (!content) return;
        
        const comment = {
            content,
            position: {
                x: position.x,
                y: position.y
            },
            author: window.uxpilotApp.currentUser,
            timestamp: new Date(),
            id: Date.now()
        };
        
        this.comments.push(comment);
        this.renderComment(comment);
    }
    
    renderComment(comment) {
        const commentMarker = document.createElement('div');
        commentMarker.className = 'comment-marker';
        commentMarker.style.left = `${comment.position.x}px`;
        commentMarker.style.top = `${comment.position.y}px`;
        commentMarker.innerHTML = `
            <div class="comment-bubble">
                <div class="comment-author">${comment.author.name}</div>
                <div class="comment-content">${comment.content}</div>
                <div class="comment-time">${new Date(comment.timestamp).toLocaleTimeString()}</div>
            </div>
        `;
        
        const canvasContainer = document.querySelector('.canvas-area');
        if (canvasContainer) {
            canvasContainer.appendChild(commentMarker);
        }
    }
    
    saveVersion() {
        const canvasData = this.canvas.toJSON();
        this.versionHistory.push({
            version: this.currentVersion++,
            data: canvasData,
            timestamp: new Date(),
            author: window.uxpilotApp.currentUser?.name || 'Unknown'
        });
        
        // Keep only last 50 versions
        if (this.versionHistory.length > 50) {
            this.versionHistory.shift();
        }
    }
    
    undo() {
        if (this.versionHistory.length > 1) {
            this.versionHistory.pop(); // Remove current version
            const previousVersion = this.versionHistory[this.versionHistory.length - 1];
            this.canvas.loadFromJSON(previousVersion.data, () => {
                this.canvas.renderAll();
            });
        }
    }
    
    redo() {
        // Redo functionality would require a separate redo stack
        window.uxpilotApp.showToast('Redo functionality coming soon!', 'info');
    }
    
    autoSave() {
        // Debounced auto-save
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveCanvas(true);
        }, 2000);
    }
    
    async saveCanvas(isAutoSave = false) {
        try {
            const canvasData = this.canvas.toJSON();
            const title = document.getElementById('project-title')?.value || 'Untitled Canvas';
            
            const response = await window.uxpilotApp.apiCall('/api/design/save-canvas', {
                method: 'POST',
                body: JSON.stringify({
                    canvasData,
                    title,
                    projectId: this.currentProjectId
                })
            });
            
            if (response.success) {
                this.currentProjectId = response.project._id;
                if (!isAutoSave) {
                    window.uxpilotApp.showToast('Canvas saved successfully!', 'success');
                }
            }
        } catch (error) {
            if (!isAutoSave) {
                window.uxpilotApp.showToast('Failed to save canvas', 'error');
            }
        }
    }
    
    showExportModal() {
        // Create export modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Export Canvas</h2>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="export-options">
                        <div class="export-option" data-format="png">
                            <h3>PNG Image</h3>
                            <p>High-quality image export</p>
                        </div>
                        <div class="export-option" data-format="svg">
                            <h3>SVG Vector</h3>
                            <p>Scalable vector graphics</p>
                        </div>
                        <div class="export-option" data-format="pdf">
                            <h3>PDF Document</h3>
                            <p>Professional document format</p>
                        </div>
                        <div class="export-option" data-format="html">
                            <h3>HTML/CSS Code</h3>
                            <p>Generate frontend code</p>
                        </div>
                        <div class="export-option" data-format="figma">
                            <h3>Figma Import</h3>
                            <p>Import into Figma</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelectorAll('.export-option').forEach(option => {
            option.addEventListener('click', () => {
                this.exportCanvas(option.dataset.format);
                document.body.removeChild(modal);
            });
        });
    }
    
    async exportCanvas(format) {
        try {
            switch (format) {
                case 'png':
                    const dataURL = this.canvas.toDataURL('image/png');
                    this.downloadFile(dataURL, 'canvas.png');
                    break;
                    
                case 'svg':
                    const svgData = this.canvas.toSVG();
                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
                    const svgURL = URL.createObjectURL(svgBlob);
                    this.downloadFile(svgURL, 'canvas.svg');
                    break;
                    
                case 'html':
                    if (!window.uxpilotApp.currentUser.isPro) {
                        window.uxpilotApp.showToast('Code generation is a Pro feature', 'warning');
                        return;
                    }
                    
                    const response = await window.uxpilotApp.apiCall(`/api/codegen/generate-html/${this.currentProjectId}`, {
                        method: 'POST',
                        body: JSON.stringify({ framework: 'html', responsive: true })
                    });
                    
                    if (response.success) {
                        this.showCodeModal(response.code);
                    }
                    break;
                    
                default:
                    window.uxpilotApp.showToast(`${format.toUpperCase()} export coming soon!`, 'info');
            }
        } catch (error) {
            window.uxpilotApp.showToast('Export failed', 'error');
        }
    }
    
    downloadFile(dataURL, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    showCodeModal(code) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>Generated Code</h2>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="code-tabs">
                        <button class="code-tab active" data-lang="html">HTML</button>
                        <button class="code-tab" data-lang="css">CSS</button>
                        ${code.js ? '<button class="code-tab" data-lang="js">JavaScript</button>' : ''}
                    </div>
                    <div class="code-content">
                        <pre id="code-html" class="code-block active"><code>${this.escapeHtml(code.html)}</code></pre>
                        <pre id="code-css" class="code-block"><code>${this.escapeHtml(code.css)}</code></pre>
                        ${code.js ? `<pre id="code-js" class="code-block"><code>${this.escapeHtml(code.js)}</code></pre>` : ''}
                    </div>
                    <div class="code-actions">
                        <button class="btn btn-primary" onclick="canvasManager.copyCode()">Copy All</button>
                        <button class="btn btn-outline" onclick="canvasManager.downloadCode()">Download</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelectorAll('.code-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                modal.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
                modal.querySelectorAll('.code-block').forEach(b => b.classList.remove('active'));
                
                tab.classList.add('active');
                modal.querySelector(`#code-${tab.dataset.lang}`).classList.add('active');
            });
        });
        
        this.currentCode = code;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    copyCode() {
        const activeCodeBlock = document.querySelector('.code-block.active code');
        if (activeCodeBlock) {
            navigator.clipboard.writeText(activeCodeBlock.textContent);
            window.uxpilotApp.showToast('Code copied to clipboard!', 'success');
        }
    }
    
    downloadCode() {
        if (!this.currentCode) return;
        
        const zip = new JSZip();
        zip.file('index.html', this.currentCode.html);
        zip.file('styles.css', this.currentCode.css);
        if (this.currentCode.js) {
            zip.file('script.js', this.currentCode.js);
        }
        
        zip.generateAsync({ type: 'blob' }).then(content => {
            const url = URL.createObjectURL(content);
            this.downloadFile(url, 'generated-code.zip');
        });
    }
    
    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'z':
                    e.preventDefault();
                    this.undo();
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveCanvas();
                    break;
                case 'd':
                    e.preventDefault();
                    this.duplicateObject();
                    break;
            }
        }
        
        if (e.key === 'Delete' && this.selectedComponent) {
            this.deleteObject();
        }
    }
    
    broadcastChange(change) {
        // In a real implementation, this would send changes via WebSocket
        console.log('Broadcasting change:', change);
    }
}

// Initialize canvas manager
let canvasManager;
document.addEventListener('DOMContentLoaded', () => {
    canvasManager = new CanvasManager();
});

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasManager;
}
