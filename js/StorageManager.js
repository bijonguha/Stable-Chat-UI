/**
 * StorageManager Module
 * Handles all localStorage operations
 */
export class StorageManager {
    static KEYS = {
        ENDPOINTS: 'chatEndpoints',
        ACTIVE_ENDPOINT: 'activeEndpoint',
        RESPONSE_TIMES: 'responseTimeStats'
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
            model: 'custom-notset',
            isDefault: true,
            isStreaming: false
        };
    }

    static loadResponseTimeStats() {
        const stored = localStorage.getItem(this.KEYS.RESPONSE_TIMES);
        return stored ? JSON.parse(stored) : {};
    }

    static saveResponseTimeStats(stats) {
        localStorage.setItem(this.KEYS.RESPONSE_TIMES, JSON.stringify(stats));
    }

    static recordResponseTime(endpointId, responseTime) {
        const stats = this.loadResponseTimeStats();
        
        if (!stats[endpointId]) {
            stats[endpointId] = {
                times: [],
                total: 0,
                count: 0
            };
        }
        
        // Keep only the last 50 response times to avoid memory issues
        if (stats[endpointId].times.length >= 50) {
            stats[endpointId].times.shift();
        }
        
        stats[endpointId].times.push(responseTime);
        stats[endpointId].total += responseTime;
        stats[endpointId].count++;
        
        this.saveResponseTimeStats(stats);
    }

    static getAverageResponseTime(endpointId) {
        const stats = this.loadResponseTimeStats();
        if (!stats[endpointId] || stats[endpointId].times.length === 0) {
            return null;
        }
        
        // Calculate average from recent times for more accurate current performance
        const recentTimes = stats[endpointId].times;
        const sum = recentTimes.reduce((acc, time) => acc + time, 0);
        return Math.round(sum / recentTimes.length);
    }
}

export default StorageManager;