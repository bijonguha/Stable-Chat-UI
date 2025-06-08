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
    }

    populateForm(endpoint) {
        document.getElementById('endpoint-name').value = endpoint.name;
        document.getElementById('endpoint-url').value = endpoint.url;
        document.getElementById('endpoint-method').value = endpoint.method;
        document.getElementById('endpoint-headers').value = JSON.stringify(endpoint.headers, null, 2);
        document.getElementById('endpoint-model').value = endpoint.model || '';
        document.getElementById('streaming-toggle').checked = endpoint.isStreaming || false;
    }

    resetForm() {
        this.endpointForm.reset();
        document.getElementById('endpoint-headers').value = '{\n  "Content-Type": "application/json"\n}';
        document.getElementById('endpoint-model').value = '';
        document.getElementById('streaming-toggle').checked = false;
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
        
        if (!name || !url) {
            throw new Error('Name and URL are required!');
        }
        
        const headers = headersText ? Utils.validateJsonString(headersText) : {};
        
        return { name, url, method, headers, model, isStreaming };
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
        
        endpointElement.innerHTML = `
            <div class="endpoint-info">
                <h3>${endpoint.name}${streamingBadge}</h3>
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