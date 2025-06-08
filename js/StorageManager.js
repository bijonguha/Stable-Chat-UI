/**
 * StorageManager Module
 * Handles all localStorage operations
 */
export class StorageManager {
    static KEYS = {
        ENDPOINTS: 'chatEndpoints',
        ACTIVE_ENDPOINT: 'activeEndpoint'
    };

    static loadEndpoints() {
        const stored = localStorage.getItem(this.KEYS.ENDPOINTS);
        const endpoints = stored ? JSON.parse(stored) : [];
        
        if (endpoints.length === 0) {
            endpoints.push(this.getDefaultEndpoint());
        }
        
        return endpoints;
    }

    static saveEndpoints(endpoints) {
        localStorage.setItem(this.KEYS.ENDPOINTS, JSON.stringify(endpoints));
    }

    static getActiveEndpointId() {
        return localStorage.getItem(this.KEYS.ACTIVE_ENDPOINT);
    }

    static setActiveEndpointId(endpointId) {
        localStorage.setItem(this.KEYS.ACTIVE_ENDPOINT, endpointId);
    }

    static getDefaultEndpoint() {
        return {
            id: 'default',
            name: 'Local Server',
            url: 'http://localhost:8000/chat',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            isDefault: true,
            isStreaming: false
        };
    }
}

export default StorageManager;