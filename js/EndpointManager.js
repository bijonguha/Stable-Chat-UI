import { StorageManager } from './StorageManager.js';
import { Utils } from './Utils.js';

/**
 * EndpointManager Module
 * Manages API endpoints and their UI interactions
 */
export class EndpointManager {
    constructor() {
        this.endpoints = StorageManager.loadEndpoints();
        this.activeEndpoint = this.getActiveEndpoint();
        this.editingEndpoint = null;
        
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.endpointsList = document.getElementById('endpoints-list');
        this.addEndpointBtn = document.getElementById('add-endpoint-btn');
        this.endpointModal = document.getElementById('endpoint-modal');
        this.endpointForm = document.getElementById('endpoint-form');
        this.modalClose = document.getElementById('modal-close');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.modalTitle = document.getElementById('modal-title');
    }

    initEventListeners() {
        this.addEndpointBtn.addEventListener('click', () => this.openModal());
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.endpointForm.addEventListener('submit', (e) => this.saveEndpoint(e));
        
        // Auth toggle event listener
        document.getElementById('auth-toggle').addEventListener('change', (e) => {
            this.toggleAuthFields(e.target.checked);
        });
        
        this.endpointModal.addEventListener('click', (e) => {
            if (e.target === this.endpointModal) {
                this.closeModal();
            }
        });
    }

    getActiveEndpoint() {
        const activeId = StorageManager.getActiveEndpointId();
        return this.endpoints.find(e => e.id === activeId) || this.endpoints[0];
    }

    setActiveEndpoint(endpointId) {
        StorageManager.setActiveEndpointId(endpointId);
        this.activeEndpoint = this.endpoints.find(e => e.id === endpointId);
        this.render();
        return this.activeEndpoint;
    }

    openModal(endpoint = null) {
        this.editingEndpoint = endpoint;
        
        if (endpoint) {
            this.modalTitle.textContent = 'Edit Endpoint';
            this.populateForm(endpoint);
        } else {
            this.modalTitle.textContent = 'Add Endpoint';
            this.resetForm();
        }
        
        this.endpointModal.classList.add('show');
        document.getElementById('endpoint-name').focus();
    }

    closeModal() {
        this.endpointModal.classList.remove('show');
        this.editingEndpoint = null;
        this.endpointForm.reset();
        this.toggleAuthFields(false); // Hide auth fields on close
    }

    toggleAuthFields(show) {
        const authFields = document.getElementById('auth-fields');
        authFields.style.display = show ? 'block' : 'none';
    }

    populateForm(endpoint) {
        document.getElementById('endpoint-name').value = endpoint.name;
        document.getElementById('endpoint-url').value = endpoint.url;
        document.getElementById('endpoint-method').value = endpoint.method;
        document.getElementById('endpoint-headers').value = JSON.stringify(endpoint.headers, null, 2);
        document.getElementById('endpoint-model').value = endpoint.model || '';
        document.getElementById('streaming-toggle').checked = endpoint.isStreaming || false;
        
        // Populate authentication fields
        const auth = endpoint.auth || { enabled: false, token: '' };
        document.getElementById('auth-toggle').checked = auth.enabled || false;
        document.getElementById('auth-token').value = auth.token || '';
        
        // Show/hide auth fields based on state
        this.toggleAuthFields(auth.enabled || false);
    }

    resetForm() {
        this.endpointForm.reset();
        document.getElementById('endpoint-headers').value = '{\n  "Content-Type": "application/json"\n}';
        document.getElementById('endpoint-model').value = '';
        document.getElementById('streaming-toggle').checked = false;
        
        // Reset authentication fields
        document.getElementById('auth-toggle').checked = false;
        document.getElementById('auth-token').value = '';
        
        // Hide auth fields
        this.toggleAuthFields(false);
    }

    saveEndpoint(e) {
        e.preventDefault();
        
        try {
            const formData = this.getFormData();
            const endpoint = this.createEndpoint(formData);
            
            if (this.editingEndpoint) {
                this.updateEndpoint(endpoint);
            } else {
                this.addEndpoint(endpoint);
            }
            
            StorageManager.saveEndpoints(this.endpoints);
            this.render();
            
            // Notify ChatManager if the active endpoint was updated
            if (this.editingEndpoint && this.activeEndpoint?.id === this.editingEndpoint.id) {
                if (window.app && window.app.chatManager) {
                    window.app.chatManager.refreshEndpoint();
                }
            }
            
            this.closeModal();
        } catch (error) {
            alert(error.message);
        }
    }

    getFormData() {
        const name = document.getElementById('endpoint-name').value.trim();
        const url = document.getElementById('endpoint-url').value.trim();
        const method = document.getElementById('endpoint-method').value;
        const headersText = document.getElementById('endpoint-headers').value.trim();
        const model = document.getElementById('endpoint-model').value.trim();
        const isStreaming = document.getElementById('streaming-toggle').checked;
        
        // Authentication data
        const authEnabled = document.getElementById('auth-toggle').checked;
        const authToken = document.getElementById('auth-token').value.trim();
        
        if (!name || !url) {
            throw new Error('Name and URL are required!');
        }
        
        if (authEnabled && !authToken) {
            throw new Error('Authentication token is required when authentication is enabled!');
        }
        
        if (authEnabled && authToken) {
            // Basic JWT format validation
            const jwtParts = authToken.split('.');
            if (jwtParts.length !== 3) {
                throw new Error('Invalid JWT token format! Token must have 3 parts separated by dots.');
            }
        }
        
        const headers = headersText ? Utils.validateJsonString(headersText) : {};
        
        const auth = {
            enabled: authEnabled,
            token: authToken
        };
        
        return { name, url, method, headers, model, isStreaming, auth };
    }

    createEndpoint(formData) {
        return {
            id: this.editingEndpoint?.id || Utils.generateId(),
            ...formData
        };
    }

    updateEndpoint(endpoint) {
        const index = this.endpoints.findIndex(e => e.id === this.editingEndpoint.id);
        this.endpoints[index] = endpoint;
        
        // If the updated endpoint is the active one, refresh the active endpoint reference
        if (this.activeEndpoint?.id === endpoint.id) {
            this.activeEndpoint = endpoint;
        }
    }

    addEndpoint(endpoint) {
        this.endpoints.push(endpoint);
    }

    deleteEndpoint(endpointId) {
        if (this.endpoints.length <= 1) {
            alert('Cannot delete the last endpoint!');
            return;
        }
        
        if (confirm('Are you sure you want to delete this endpoint?')) {
            this.endpoints = this.endpoints.filter(e => e.id !== endpointId);
            
            if (this.activeEndpoint?.id === endpointId) {
                this.setActiveEndpoint(this.endpoints[0].id);
            }
            
            StorageManager.saveEndpoints(this.endpoints);
            this.render();
        }
    }

    render() {
        this.endpointsList.innerHTML = '';
        
        this.endpoints.forEach(endpoint => {
            const isActive = this.activeEndpoint?.id === endpoint.id;
            const endpointElement = this.createEndpointElement(endpoint, isActive);
            this.endpointsList.appendChild(endpointElement);
        });
    }

    createEndpointElement(endpoint, isActive) {
        const endpointElement = document.createElement('div');
        endpointElement.className = `endpoint-card ${isActive ? 'active' : ''}`;
        
        const streamingBadge = endpoint.isStreaming ?
            '<span class="streaming-badge"><span class="badge-icon">⚡</span>STREAMING</span>' :
            '<span class="regular-badge"><span class="badge-icon">✓</span>REGULAR</span>';
            
        const authBadge = (endpoint.auth && endpoint.auth.enabled) ?
            '<span class="auth-badge"><span class="badge-icon">🔐</span>AUTH</span>' : '';
        
        // Get average response time for this endpoint
        const avgResponseTime = StorageManager.getAverageResponseTime(endpoint.id);
        let responseTimeDisplay = '';
        
        if (avgResponseTime) {
            // Convert to seconds and format
            const responseTimeInSeconds = (avgResponseTime / 1000).toFixed(1);
            
            responseTimeDisplay = `<span class="response-time-display">${responseTimeInSeconds}s</span>`;
        }
        
        endpointElement.innerHTML = `
            <div class="endpoint-info">
                <h3>${endpoint.name}${streamingBadge}${authBadge}${responseTimeDisplay}</h3>
                <p>${endpoint.url}</p>
            </div>
            <div class="endpoint-actions">
                ${!isActive ? 
                    `<button class="action-btn primary" onclick="window.app.endpointManager.setActiveEndpoint('${endpoint.id}'); window.app.chatManager.resetConnection();">Use</button>` : 
                    '<span class="active-badge">Active</span>'
                }
                <button class="action-btn" onclick="window.app.endpointManager.openModal(window.app.endpointManager.endpoints.find(e => e.id === '${endpoint.id}'))">Edit</button>
                ${!endpoint.isDefault ? 
                    `<button class="action-btn danger" onclick="window.app.endpointManager.deleteEndpoint('${endpoint.id}')">Delete</button>` : 
                    ''
                }
            </div>
        `;
        return endpointElement;
    }
}

export default EndpointManager;