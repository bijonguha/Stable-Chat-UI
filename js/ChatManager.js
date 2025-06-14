import { MarkdownParser } from './MarkdownParser.js';
import { Utils } from './Utils.js';
import { StorageManager } from './StorageManager.js';

/**
 * ChatManager Module
 * Handles all chat functionality and UI interactions
 */
export class ChatManager {
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
        this.chatCloseBtn = document.getElementById('chat-close-btn');
        this.conversationIdElement = document.getElementById('conversation-id');
        this.conversationValueElement = document.getElementById('conversation-value');
        this.newChatBtn = document.getElementById('new-chat-btn');
        this.resizeHandle = document.getElementById('resize-handle');
    }

    initEventListeners() {
        this.chatToggle.addEventListener('click', () => this.openChat());
        this.chatCloseBtn.addEventListener('click', () => this.closeChat());
        this.newChatBtn.addEventListener('click', () => this.startNewChatSession());
        
        this.chatInput.addEventListener('input', () => this.autoResizeInput());
        this.chatInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        this.initResizeHandling();
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
        this.updateConversationIdDisplay();
        this.checkConnection();
    }

    updateConversationIdDisplay() {
        if (this.conversationId) {
            this.conversationValueElement.textContent = this.conversationId;
            this.conversationIdElement.style.display = 'block';
        } else {
            this.conversationIdElement.style.display = 'none';
        }
    }

    openChat() {
        if (this.isChatOpen) return;
        
        this.isChatOpen = true;
        this.chatContainer.classList.add('open');
        this.chatToggle.style.display = 'none'; // Hide the chat toggle button
        
        if (this.messagesContainer.children.length === 0) {
            this.addWelcomeMessage();
        }
        
        setTimeout(() => this.chatInput.focus(), 300);
    }

    closeChat() {
        if (!this.isChatOpen) return;
        
        this.isChatOpen = false;
        this.chatContainer.classList.remove('open');
        this.chatToggle.style.display = 'block'; // Show the chat toggle button
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
        const startTime = performance.now();
        
        try {
            const response = await this.makeApiRequest(message);
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            // Record response time for the current endpoint
            const endpoint = this.endpointManager.activeEndpoint;
            if (endpoint && endpoint.id) {
                StorageManager.recordResponseTime(endpoint.id, responseTime);
                // Trigger endpoint UI update to show new average
                this.endpointManager.render();
            }
            
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
        
        // Track start time for streaming
        this.streamingStartTime = performance.now();
        this.streamingFirstResponseReceived = false;
        
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
        let requestUrl = endpoint?.url || 'http://localhost:8000/chat';
        
        // Ensure we're using HTTP for localhost
        if (requestUrl.startsWith('https://localhost')) {
            requestUrl = requestUrl.replace('https://', 'http://');
        }
        
        // For streaming, append /stream if not already in URL
        if (endpoint?.isStreaming && !requestUrl.includes('/stream')) {
            requestUrl = requestUrl + '/stream';
        } else if (!endpoint?.isStreaming && !requestUrl.includes('/chat')) {
            requestUrl = requestUrl.replace(/\/$/, '') + '/chat/stream';
        }
        
        
        const requestOptions = {
            method: endpoint?.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                ...(endpoint?.headers || {})
            },
            body: JSON.stringify({
                messages: [{ role: "user", text: message }],
                model: endpoint?.model || "custom-notset",
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
        
        // Record response time on first chunk received for streaming
        if (!this.streamingFirstResponseReceived && this.streamingStartTime) {
            const endTime = performance.now();
            const responseTime = endTime - this.streamingStartTime;
            
            const endpoint = this.endpointManager.activeEndpoint;
            if (endpoint && endpoint.id) {
                StorageManager.recordResponseTime(endpoint.id, responseTime);
                // Trigger endpoint UI update to show new average
                this.endpointManager.render();
            }
            
            this.streamingFirstResponseReceived = true;
        }
        
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
            this.updateConversationIdDisplay();
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
        let requestUrl = endpoint?.url || 'http://localhost:8000/chat';
        
        // Ensure we're using HTTP for localhost
        if (requestUrl.startsWith('https://localhost')) {
            requestUrl = requestUrl.replace('https://', 'http://');
        }
        
        const requestOptions = {
            method: endpoint?.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(endpoint?.headers || {})
            }
        };
        
        const requestBody = {
            messages: [{ role: "user", text: message }],
            model: endpoint?.model || "custom-notset",
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
            this.updateConversationIdDisplay();
        }
        
        this.addMessage({
            text: data.text || data.response || data.message || 'No response received',
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
        this.sendButton.textContent = 'Sending...';
        
        const existingTyping = document.getElementById('typing-indicator');
        if (existingTyping) {
            existingTyping.remove();
        }
        
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
        this.sendButton.textContent = 'Send';
        
        const typingElement = document.getElementById('typing-indicator');
        if (typingElement) {
            typingElement.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    startNewChatSession() {
        // Clear the conversation
        this.conversationId = null;
        this.updateConversationIdDisplay();
        
        // Clear all messages
        this.messagesContainer.innerHTML = '';
        
        // Add welcome message for new session
        this.addWelcomeMessage();
        
        // Reset any streaming state
        this.isStreaming = false;
        this.currentStreamingMessage = null;
        this.sendButton.disabled = false;
        this.sendButton.textContent = 'Send';
        
        // Focus on input
        this.chatInput.focus();
        
        console.log('🆕 New chat session started');
    }

    initResizeHandling() {
        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        this.resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(this.chatContainer).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(this.chatContainer).height, 10);
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            // Prevent text selection during resize
            document.body.style.userSelect = 'none';
            this.chatContainer.style.transition = 'none';
            
            e.preventDefault();
        });

        const handleMouseMove = (e) => {
            if (!isResizing) return;
            
            const width = startWidth + (startX - e.clientX);
            const height = startHeight + (startY - e.clientY);
            
            // Apply constraints
            const minWidth = 300;
            const maxWidth = 800;
            const minHeight = 400;
            const maxHeight = window.innerHeight * 0.9;
            
            const constrainedWidth = Math.min(Math.max(width, minWidth), maxWidth);
            const constrainedHeight = Math.min(Math.max(height, minHeight), maxHeight);
            
            this.chatContainer.style.width = constrainedWidth + 'px';
            this.chatContainer.style.height = constrainedHeight + 'px';
        };

        const handleMouseUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            // Restore text selection and transitions
            document.body.style.userSelect = '';
            this.chatContainer.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        };
    }
}

export default ChatManager;