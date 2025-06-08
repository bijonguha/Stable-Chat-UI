/**
 * Utils Module
 * Shared utility functions across the application
 */
export class Utils {
    static copyCode(button, code) {
        // Decode the escaped code
        const decodedCode = code.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n');
        
        navigator.clipboard.writeText(decodedCode).then(() => {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy code:', err);
            button.textContent = 'Failed';
            setTimeout(() => {
                button.textContent = 'Copy';
            }, 1000);
        });
    }

    static formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    }

    static generateId() {
        return Date.now().toString();
    }

    static validateJsonString(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            throw new Error('Invalid JSON format');
        }
    }
}

export default Utils;