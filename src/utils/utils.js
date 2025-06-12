/**
 * Utility functions
 */

export const Utils = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    validateJsonString(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            throw new Error('Invalid JSON format in headers!');
        }
    },

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
};

export default Utils;