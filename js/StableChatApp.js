import { EndpointManager } from './EndpointManager.js';
import { ChatManager } from './ChatManager.js';
import { MenuManager } from './MenuManager.js';
import { Utils } from './Utils.js';

/**
 * StableChatApp - Main Application Module
 * Orchestrates all modules and manages application lifecycle
 */
export class StableChatApp {
    constructor() {
        this.utils = Utils;
        this.endpointManager = new EndpointManager();
        this.chatManager = new ChatManager(this.endpointManager);
        this.menuManager = new MenuManager();
        
        this.init();
    }

    init() {
        this.endpointManager.render();
        console.log('🚀 Stable Chat UI initialized successfully');
    }
}

export default StableChatApp;