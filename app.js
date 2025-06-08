// ====================================
// STABLE CHAT - MODULAR JAVASCRIPT
// ====================================

/**
 * MarkdownParser Module
 * Handles all markdown parsing and rendering
 */
class MarkdownParser {
    static parse(text) {
        // Handle code blocks first to avoid processing markdown inside them
        text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            const lang = language || 'text';
            const escapedCode = this.escapeHtml(code.trim());
            return `<div class="code-block">
                <div class="code-header">
                    <span>${lang}</span>
                    <button class="copy-btn" onclick="Utils.copyCode(this, '${this.escapeForAttribute(code.trim())}')">Copy</button>
                </div>
                <pre><code>${escapedCode}</code></pre>
            </div>`;
        });

        // Handle inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Handle headers
        text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');

        // Handle bold and italic
        text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        text = text.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');
        text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

        // Handle links
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Handle blockquotes
        text = text.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');

        // Handle horizontal rules
        text = text.replace(/^---$/gm, '<hr>');
        text = text.replace(/^\*\*\*$/gm, '<hr>');

        // Handle unordered lists
        text = text.replace(/^[\*\-\+] (.*)$/gm, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

        // Handle ordered lists
        text = text.replace(/^\d+\. (.*)$/gm, '<li>$1</li>');

        // Handle line breaks and paragraphs
        text = text.replace(/\n\n/g, '</p><p>');
        text = text.replace(/\n/g, '<br>');

        // Wrap in paragraph tags if not already wrapped
        if (!text.startsWith('<')) {
            text = '<p>' + text + '</p>';
        }

        // Clean up empty paragraphs
        text = text.replace(/<p><\/p>/g, '');
        text = text.replace(/<p><br><\/p>/g, '');

        return text;
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static escapeForAttribute(text) {
        return text.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }
}

/**
 * Utils Module
 * Shared utility functions across the application
 */
class Utils {
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

/**
 * StorageManager Module
 * Handles all localStorage operations
 */
class StorageManager {
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

/**
 * EndpointManager Module
 * Manages API endpoints and their UI interactions
 */
class EndpointManager {
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
        document.getElementById('streaming-toggle').checked = endpoint.isStreaming || false;
    }

    resetForm() {
        this.endpointForm.reset();
        document.getElementById('endpoint-headers').value = '{\n  "Content-Type": "application/json"\n}';
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
        const isStreaming = document.getElementById('streaming-toggle').checked;
        
        if (!name || !url) {
            throw new Error('Name and URL are required!');
        }
        
        const headers = headersText ? Utils.validateJsonString(headersText) : {};
        
        return { name, url, method, headers, isStreaming };
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
            '<span class="streaming-badge">STREAMING</span>' : 
            '<span class="regular-badge">REGULAR</span>';
        
        endpointElement.innerHTML = `
            <div class="endpoint-info">
                <h3>${endpoint.name}${streamingBadge}</h3>
                <p>${endpoint.url}</p>
            </div>
            <div class="endpoint-actions">
                ${!isActive ? 
                    `<button class="action-btn primary" onclick="app.endpointManager.setActiveEndpoint('${endpoint.id}'); app.chatManager.resetConnection();">Use</button>` : 
                    '<span class="active-badge">Active</span>'
                }
                <button class="action-btn" onclick="app.endpointManager.openModal(app.endpointManager.endpoints.find(e => e.id === '${endpoint.id}'))">Edit</button>
                ${!endpoint.isDefault ? 
                    `<button class="action-btn danger" onclick="app.endpointManager.deleteEndpoint('${endpoint.id}')">Delete</button>` : 
                    ''
                }
            </div>
        `;
        return endpointElement;
    }
}

/**
 * ChatManager Module
 * Handles all chat functionality and UI interactions
 */
class ChatManager {
    constructor(endpointManager) {
        this.endpointManager = endpointManager;
        this.conversationId = null;
        this.isTyping = false;
        this.isChatOpen = false;
        this.isStreaming = false;
        this.currentStreamingMessage = null;
        
        this.initElements();
        this.initEventListeners();
        this.checkConnection();
    }

    initElements() {
        this.messagesContainer = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-btn');
        this.statusText = document.getElementById('status-text');
        this.chatContainer = document.getElementById('chat-container');
        this.chatToggle = document.getElementById('chat-toggle');
    }

    initEventListeners() {
        this.chatToggle.addEventListener('click', () => this.toggleChat());
        
        this.chatInput.addEventListener('input', () => this.autoResizeInput());
        this.chatInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.sendButton.addEventListener('click', () => this.sendMessage());
    }

    autoResizeInput() {
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 100) + 'px';
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    async checkConnection() {
        try {
            const endpoint = this.endpointManager.activeEndpoint;
            if (endpoint && endpoint.url !== 'http://localhost:8000/chat') {
                this.statusText.textContent = `Connected to ${endpoint.name}`;
                return;
            }
            
            const response = await fetch('http://localhost:8000/chat/status');
            if (response.ok) {
                this.statusText.textContent = 'Service Available';
            }
        } catch (error) {
            this.statusText.textContent = 'Check Configuration';
        }
    }

    resetConnection() {
        this.conversationId = null;
        this.checkConnection();
    }

    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        
        if (this.isChatOpen) {
            this.openChat();
        } else {
            this.closeChat();
        }
    }

    openChat() {
        this.chatContainer.classList.add('open');
        this.chatToggle.innerHTML = '✕';
        this.chatToggle.classList.add('open');
        
        if (this.messagesContainer.children.length === 0) {
            this.addWelcomeMessage();
        }
        
        setTimeout(() => this.chatInput.focus(), 300);
    }

    closeChat() {
        this.chatContainer.classList.remove('open');
        this.chatToggle.innerHTML = '💬';
        this.chatToggle.classList.remove('open');
    }

    addWelcomeMessage() {
        this.addMessage({
            text: "Hi! I'm your AI assistant. How can I help you today?",
            role: 'assistant',
            timestamp: new Date().toISOString()
        });
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isTyping || this.isStreaming) return;
        
        this.addMessage({
            text: message,
            role: 'user',
            timestamp: new Date().toISOString()
        });
        
        this.clearInput();
        
        // Check if the current endpoint has streaming enabled
        const endpoint = this.endpointManager.activeEndpoint;
        const useStreaming = endpoint && endpoint.isStreaming;
        
        if (useStreaming) {
            await this.sendStreamingMessage(message);
        } else {
            await this.sendRegularMessage(message);
        }
    }

    checkStreamingSupport(endpoint) {
        // Now we use the endpoint's isStreaming property instead of auto-detection
        return endpoint && endpoint.isStreaming === true;
    }

    async sendRegularMessage(message) {
        this.showTyping();
        
        try {
            const response = await this.makeApiRequest(message);
            this.handleApiResponse(response);
        } catch (error) {
            this.handleApiError(error);
        } finally {
            this.hideTyping();
        }
    }

    async sendStreamingMessage(message) {
        this.isStreaming = true;
        this.sendButton.disabled = true;
        this.sendButton.textContent = 'Streaming...';
        
        // Create the streaming message container
        this.currentStreamingMessage = this.createStreamingMessage();
        
        try {
            await this.makeStreamingRequest(message);
        } catch (error) {
            this.handleStreamingError(error);
        } finally {
            this.finishStreaming();
        }
    }

    createStreamingMessage() {
        const messageElement = document.createElement('div');
        messageElement.className = 'message assistant';
        
        const bubbleElement = document.createElement('div');
        bubbleElement.className = 'message-bubble';
        bubbleElement.innerHTML = '<span class="streaming-cursor">▊</span>';
        
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = Utils.formatTimestamp(new Date().toISOString());
        
        messageElement.appendChild(bubbleElement);
        messageElement.appendChild(timeElement);
        
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
        
        return { element: messageElement, bubble: bubbleElement, content: '' };
    }

    async makeStreamingRequest(message) {
        const endpoint = this.endpointManager.activeEndpoint;
        const requestUrl = endpoint?.url || 'http://localhost:8000/chat/stream';
        
        const requestOptions = {
            method: endpoint?.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                ...(endpoint?.headers || {})
            },
            body: JSON.stringify({
                messages: [{ text: message }],
                conversation_id: this.conversationId,
                stream: true
            })
        };

        const response = await fetch(requestUrl, requestOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                await this.processStreamChunk(chunk);
            }
        } finally {
            reader.releaseLock();
        }
    }

    async processStreamChunk(chunk) {
        // Handle different streaming formats
        const lines = chunk.split('\n');
        
        for (const line of lines) {
            if (line.trim() === '') continue;
            
            try {
                // Handle Server-Sent Events format
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        return;
                    }
                    
                    const parsed = JSON.parse(data);
                    this.appendStreamContent(parsed);
                }
                // Handle plain JSON streaming
                else if (line.trim().startsWith('{')) {
                    const parsed = JSON.parse(line);
                    this.appendStreamContent(parsed);
                }
                // Handle plain text streaming
                else {
                    this.appendStreamContent({ content: line });
                }
            } catch (error) {
                // If JSON parsing fails, treat as plain text
                if (line.trim()) {
                    this.appendStreamContent({ content: line });
                }
            }
        }
    }

    appendStreamContent(data) {
        if (!this.currentStreamingMessage) return;
        
        // Extract content from different response formats
        let content = '';
        if (data.content) {
            content = data.content;
        } else if (data.response) {
            content = data.response;
        } else if (data.text) {
            content = data.text;
        } else if (data.delta && data.delta.content) {
            content = data.delta.content;
        } else if (typeof data === 'string') {
            content = data;
        }
        
        if (content) {
            this.currentStreamingMessage.content += content;
            
            // Update the message bubble with markdown parsing
            const parsedContent = MarkdownParser.parse(this.currentStreamingMessage.content);
            this.currentStreamingMessage.bubble.innerHTML = parsedContent + '<span class="streaming-cursor">▊</span>';
            
            this.scrollToBottom();
        }
        
        // Update conversation ID if provided
        if (data.conversation_id && !this.conversationId) {
            this.conversationId = data.conversation_id;
        }
    }

    finishStreaming() {
        this.isStreaming = false;
        this.sendButton.disabled = false;
        this.sendButton.textContent = 'Send';
        
        if (this.currentStreamingMessage) {
            // Remove the cursor and finalize the message
            const finalContent = MarkdownParser.parse(this.currentStreamingMessage.content);
            this.currentStreamingMessage.bubble.innerHTML = finalContent;
            this.currentStreamingMessage = null;
        }
        
        this.scrollToBottom();
    }

    handleStreamingError(error) {
        console.error('Streaming error:', error);
        
        if (this.currentStreamingMessage) {
            this.currentStreamingMessage.bubble.innerHTML = `
                <span style="color: #ef4444;">
                    Streaming error: ${error.message}. Please check your endpoint configuration.
                </span>
            `;
            this.currentStreamingMessage.bubble.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            this.currentStreamingMessage.bubble.style.color = 'white';
        }
    }

    clearInput() {
        this.chatInput.value = '';
        this.chatInput.style.height = 'auto';
    }

    async makeApiRequest(message) {
        const endpoint = this.endpointManager.activeEndpoint;
        const requestUrl = endpoint?.url || 'http://localhost:8000/chat';
        const requestOptions = {
            method: endpoint?.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(endpoint?.headers || {})
            }
        };
        
        const requestBody = {
            messages: [{ text: message }],
            conversation_id: this.conversationId
        };
        
        if (requestOptions.method !== 'GET') {
            requestOptions.body = JSON.stringify(requestBody);
        }
        
        const response = await fetch(requestUrl, requestOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    }

    handleApiResponse(data) {
        if (!this.conversationId && data.conversation_id) {
            this.conversationId = data.conversation_id;
        }
        
        this.addMessage({
            text: data.response || data.text || data.message || 'No response received',
            role: 'assistant',
            timestamp: data.timestamp || new Date().toISOString()
        });
    }

    handleApiError(error) {
        console.error('Error sending message:', error);
        this.addMessage({
            text: `Error: ${error.message}. Please check your endpoint configuration.`,
            role: 'assistant',
            timestamp: new Date().toISOString(),
            isError: true
        });
    }

    addMessage({ text, role, timestamp, isError = false }) {
        const messageElement = this.createMessageElement(text, role, timestamp, isError);
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    createMessageElement(text, role, timestamp, isError) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}`;
        
        const bubbleElement = document.createElement('div');
        bubbleElement.className = 'message-bubble';
        
        // Parse markdown for assistant messages, keep plain text for user messages
        if (role === 'assistant' && !isError) {
            bubbleElement.innerHTML = MarkdownParser.parse(text);
        } else {
            bubbleElement.textContent = text;
        }
        
        if (isError) {
            bubbleElement.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            bubbleElement.style.color = 'white';
        }
        
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = Utils.formatTimestamp(timestamp);
        
        messageElement.appendChild(bubbleElement);
        messageElement.appendChild(timeElement);
        
        return messageElement;
    }

    showTyping() {
        this.isTyping = true;
        this.sendButton.disabled = true;
        
        const typingElement = document.createElement('div');
        typingElement.id = 'typing-indicator';
        typingElement.className = 'typing-indicator';
        typingElement.innerHTML = `
            <span>AI is thinking</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        this.messagesContainer.appendChild(typingElement);
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        this.sendButton.disabled = false;
        
        const typingElement = document.getElementById('typing-indicator');
        if (typingElement) {
            typingElement.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

/**
 * StableChatApp - Main Application Module
 * Orchestrates all modules and manages application lifecycle
 */
class StableChatApp {
    constructor() {
        this.endpointManager = new EndpointManager();
        this.chatManager = new ChatManager(this.endpointManager);
        
        this.init();
    }

    init() {
        this.endpointManager.render();
        console.log('🚀 Stable Chat UI initialized successfully');
    }
}

/**
 * Application Initialization
 * Initialize the application when DOM is ready
 */
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new StableChatApp();
});