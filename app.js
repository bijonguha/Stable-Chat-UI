// ====================================
// STABLE CHAT - MODULAR JAVASCRIPT
// ====================================

import { StableChatApp } from './js/StableChatApp.js';

/**
 * Application Initialization
 * Initialize the application when DOM is ready
 */
let app;
document.addEventListener('DOMContentLoaded', () => {
    // Make app globally accessible for inline event handlers
    window.app = new StableChatApp();
});