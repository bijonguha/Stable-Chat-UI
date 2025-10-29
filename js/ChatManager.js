import { MarkdownParser } from './MarkdownParser.js';
import { Utils } from './Utils.js';
import { StorageManager } from './StorageManager.js';
import { VoiceManager } from './VoiceManager.js';

/**
 * ChatManager Module
 * Handles all chat functionality and UI interactions
 */
export class ChatManager {
    constructor(endpointManager) {
        this.endpointManager = endpointManager;
        this.threadId = null;
        this.isTyping = false;
        this.isChatOpen = false;
        this.isStreaming = false;
        
        // Voice input properties
        this.voiceManager = new VoiceManager();
        this.isVoiceRecording = false;
        
        this.initElements();
        this.initEventListeners();
        this.initVoiceInput();
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
        this.threadIdElement = document.getElementById('conversation-id');
        this.threadIdValueElement = document.getElementById('conversation-value');
        this.newChatBtn = document.getElementById('new-chat-btn');
        this.resizeHandle = document.getElementById('resize-handle');
        
        // Voice input elements
        this.voiceButton = document.getElementById('voice-btn');
        this.voiceStatus = document.getElementById('voice-status');
        this.voiceText = document.querySelector('.voice-text');
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

    initVoiceInput() {
        if (!this.voiceManager.isSupported) {
            console.warn('Voice input not supported');
            if (this.voiceButton) {
                this.voiceButton.disabled = true;
                this.voiceButton.title = 'Voice input not supported in this browser';
                this.voiceButton.style.opacity = '0.3';
            }
            return;
        }

        if (this.voiceButton) {
            this.voiceButton.addEventListener('click', () => this.toggleVoiceInput());
        }

        this.voiceManager.onStart = () => {
            this.isVoiceRecording = true;
            this.updateVoiceUI();
        };
        this.voiceManager.onResult = (result) => this.handleVoiceResult(result);
        this.voiceManager.onEnd = () => {
            this.isVoiceRecording = false;
            this.updateVoiceUI();
        };
        this.voiceManager.onError = (error) => {
            this.handleVoiceError(error);
            this.isVoiceRecording = false;
            this.updateVoiceUI();
        };
    }

    toggleVoiceInput() {
        if (!this.voiceManager.isSupported) return;
        this.isVoiceRecording ? this.stopVoiceInput() : this.startVoiceInput();
    }

    startVoiceInput() {
        if (this.isTyping || this.isStreaming) return;
        this.voiceManager.startListening();
    }

    stopVoiceInput() {
        this.voiceManager.stopListening();
    }

    handleVoiceResult(result) {
        this.chatInput.value = result.finalTranscript || result.interimTranscript;
        this.autoResizeInput();
        if (result.finalTranscript && this.shouldAutoSendVoiceMessage(result.finalTranscript)) {
            setTimeout(() => this.sendMessage(), 500);
        }
    }

    shouldAutoSendVoiceMessage(transcript) {
        const trimmed = transcript.trim();
        return /[.!?]$/.test(trimmed) && trimmed.length > 3;
    }

    handleVoiceError(error) {
        console.error('Voice input error:', error);
        let message = 'An unknown voice error occurred.';
        if (error.error === 'not-allowed') message = 'Microphone access denied.';
        else if (error.error === 'no-speech') message = 'No speech detected.';
        this.showVoiceError(message);
    }

    showVoiceError(message) {
        this.voiceText.textContent = message;
        this.voiceStatus.style.display = 'block';
        setTimeout(() => { this.voiceStatus.style.display = 'none'; }, 3000);
    }

    updateVoiceUI() {
        this.voiceButton.classList.toggle('recording', this.isVoiceRecording);
        this.voiceStatus.style.display = this.isVoiceRecording ? 'block' : 'none';
        this.sendButton.disabled = this.isVoiceRecording;
    }

    autoResizeInput() {
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = `${this.chatInput.scrollHeight}px`;
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    async checkConnection() {
        const endpoint = this.endpointManager.activeEndpoint;
        if (!endpoint) {
            this.statusText.textContent = 'Check Configuration';
            return;
        }
        this.statusText.textContent = `Connected to ${endpoint.name}`;
    }

    resetConnection() {
        this.threadId = null;
        this.updateThreadIdDisplay();
        this.checkConnection();
    }

    refreshEndpoint() {
        this.checkConnection();
    }

    updateThreadIdDisplay() {
        this.threadIdElement.style.display = this.threadId ? 'block' : 'none';
        this.threadIdValueElement.textContent = this.threadId;
    }

    openChat() {
        if (this.isChatOpen) return;
        this.isChatOpen = true;
        this.chatContainer.classList.add('open');
        this.chatToggle.style.display = 'none';
        if (this.messagesContainer.children.length === 0) {
            this.addWelcomeMessage();
        }
        this.chatInput.focus();
    }

    closeChat() {
        if (!this.isChatOpen) return;
        this.isChatOpen = false;
        this.chatContainer.classList.remove('open');
        this.chatToggle.style.display = 'block';
    }

    addWelcomeMessage() {
        this.addMessage({ text: "Hi! I'm your AI assistant. How can I help?", role: 'assistant' });
    }

    async sendMessage() {
        const messageText = this.chatInput.value.trim();
        if (!messageText || this.isTyping || this.isStreaming || this.isVoiceRecording) return;

        this.addMessage({ text: messageText, role: 'user' });
        this.clearInput();

        const endpoint = this.endpointManager.activeEndpoint;
        if (endpoint && endpoint.isStreaming) {
            const botMessageElement = this.createMessageElement({ role: 'assistant', timestamp: new Date().toISOString() });
            this.messagesContainer.appendChild(botMessageElement);
            this.scrollToBottom();
            await this.sendMessageAndStreamResponse(messageText, botMessageElement);
        } else {
            await this.sendRegularMessage(messageText);
        }
    }

    async sendMessageAndStreamResponse(query, messageElement) {
        this.isStreaming = true;
        this.sendButton.disabled = true;
        this.sendButton.textContent = 'Streaming...';
        const thinkingStepsContainer = messageElement.querySelector('.thinking-steps');
        const contentContainer = messageElement.querySelector('.content');
        let thinkingStepsShown = false;
        
        // Show typing indicator initially
        contentContainer.innerHTML = '<div class="stream-typing-indicator">🤖 Analyzing your request...</div>';

        try {
            const endpoint = this.endpointManager.activeEndpoint;
            const url = endpoint?.isStreaming ? 
                (endpoint?.url || '').replace(/\/$/, '') + '/stream' :
                endpoint?.url;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream', ...this.getAuthHeaders(endpoint) },
                body: JSON.stringify({ 
                    thread_id: this.threadId || "",
                    messages: { 
                        role: "user", 
                        text: query 
                    }
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                let eolIndex;
                while ((eolIndex = buffer.indexOf('\n')) >= 0) {
                    const line = buffer.slice(0, eolIndex).trim();
                    buffer = buffer.slice(eolIndex + 1);
                    thinkingStepsShown = this.processMyDiningSseLine(line, { thinkingStepsContainer, contentContainer }, thinkingStepsShown) || thinkingStepsShown;
                }
            }
        } catch (err) {
            contentContainer.innerHTML = "Error: Could not connect to the server.";
            console.error("Streaming fetch failed:", err);
        } finally {
            this.isStreaming = false;
            this.sendButton.disabled = false;
            this.sendButton.textContent = 'Send';
        }
    }

    processMyDiningSseLine(line, containers, thinkingStepsShown) {
        if (line.startsWith('event:')) {
            this.currentSseEvent = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();
            if (dataStr) {
                console.log("MyDining SSE Data Received:", dataStr);
                try {
                    const data = JSON.parse(dataStr);
                    
                    // Handle MyDining API format
                    if (data.type === 'id') {
                        // Message ID event - store for reference
                        this.currentMessageId = data.value;
                    } else if (data.type === 'done') {
                        // Completion event
                        if (data.thread_id) {
                            this.threadId = data.thread_id;
                            this.updateThreadIdDisplay();
                        }
                        // Finalize content with markdown parsing
                        const finalRawText = containers.contentContainer.getAttribute('data-raw-text') || containers.contentContainer.textContent;
                        containers.contentContainer.innerHTML = MarkdownParser.parseAndHighlight(finalRawText);
                        
                        // Fade out and remove thinking steps after completion
                        if (containers.thinkingStepsContainer.children.length > 0) {
                            setTimeout(() => {
                                containers.thinkingStepsContainer.style.transition = 'opacity 0.5s ease-out';
                                containers.thinkingStepsContainer.style.opacity = '0';
                                setTimeout(() => {
                                    containers.thinkingStepsContainer.innerHTML = '';
                                    containers.thinkingStepsContainer.style.opacity = '1';
                                }, 500);
                            }, 1000); // Wait 1 second before starting fade
                        }
                        
                        // Apply syntax highlighting
                        if (typeof Prism !== 'undefined') {
                            setTimeout(() => {
                                MarkdownParser.applySyntaxHighlighting(containers.contentContainer);
                            }, 10);
                        }
                    } else if (data.thread_id && data.role === 'assistant') {
                        // Handle response chunks
                        if (data.error) {
                            // Error response
                            containers.contentContainer.innerHTML = `<div class="error">${data.text}</div>`;
                            if (data.error.details) {
                                console.error('API Error Details:', data.error.details);
                            }
                        } else if (data.text) {
                            // Regular text chunk
                            if (data.text.includes('⚙️ *Executing') || data.text.includes('🔍') || data.text.includes('📈 *Generating insights*')) {
                                // Handle mixed content - extract thinking step and regular content
                                if (containers.contentContainer.innerHTML.includes('stream-typing-indicator')) {
                                    containers.contentContainer.innerHTML = '';
                                }
                                
                                // Extract thinking step part
                                const thinkingMatch = data.text.match(/(⚙️ \*[^*]+\*|🔍[^\\n]*|📈 \*[^*]+\*)/);
                                if (thinkingMatch) {
                                    containers.thinkingStepsContainer.innerHTML += `<div class="thinking-step">${thinkingMatch[1]}</div>`;
                                    thinkingStepsShown = true;
                                }
                                
                                // Continue with regular content processing (the rest of the text)
                                const currentText = containers.contentContainer.getAttribute('data-raw-text') || '';
                                const newText = currentText + data.text;
                                containers.contentContainer.setAttribute('data-raw-text', newText);
                                
                                // Show raw text during streaming (no markdown parsing yet)
                                const displayDiv = document.createElement('div');
                                displayDiv.style.whiteSpace = 'pre-wrap';
                                displayDiv.style.fontFamily = 'inherit';
                                displayDiv.style.lineHeight = '1.6';
                                displayDiv.style.overflowWrap = 'break-word';
                                displayDiv.className = 'streaming-content';
                                displayDiv.textContent = newText;
                                containers.contentContainer.innerHTML = '';
                                containers.contentContainer.appendChild(displayDiv);
                            } else {
                                // Regular content - accumulate raw text during streaming
                                const currentText = containers.contentContainer.getAttribute('data-raw-text') || '';
                                const newText = currentText + data.text;
                                containers.contentContainer.setAttribute('data-raw-text', newText);
                                
                                // Clear typing indicator on first content
                                if (!currentText) {
                                    containers.contentContainer.innerHTML = '';
                                }
                                
                                // Show raw text during streaming (no markdown parsing yet)
                                const displayDiv = document.createElement('div');
                                displayDiv.style.whiteSpace = 'pre-wrap';
                                displayDiv.style.fontFamily = 'inherit';
                                displayDiv.style.lineHeight = '1.6';
                                displayDiv.style.overflowWrap = 'break-word';
                                displayDiv.className = 'streaming-content';
                                displayDiv.textContent = newText;
                                containers.contentContainer.innerHTML = '';
                                containers.contentContainer.appendChild(displayDiv);
                            }
                        }
                        
                        // Update thread ID if provided
                        if (data.thread_id && !this.threadId) {
                            this.threadId = data.thread_id;
                            this.updateThreadIdDisplay();
                        }
                    }
                } catch (e) {
                    console.error('Error parsing MyDining SSE data:', e);
                }
            }
        } else if (line === '') {
            this.currentSseEvent = null;
        }
        return thinkingStepsShown;
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

    clearInput() {
        this.chatInput.value = '';
        this.autoResizeInput();
    }

    async makeApiRequest(message) {
        const endpoint = this.endpointManager.activeEndpoint;
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(endpoint?.headers || {}), ...this.getAuthHeaders(endpoint) },
            body: JSON.stringify({ 
                thread_id: this.threadId || "",
                messages: { 
                    role: "user", 
                    text: message 
                }
            })
        };
        const response = await fetch(endpoint.url, requestOptions);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return await response.json();
    }

    getAuthHeaders(endpoint) {
        const authHeaders = {};
        if (endpoint?.auth?.enabled && endpoint?.auth?.token) {
            authHeaders['Authorization'] = `Bearer ${endpoint.auth.token}`;
        }
        return authHeaders;
    }

    handleApiResponse(data) {
        if (data.thread_id) {
            this.threadId = data.thread_id;
            this.updateThreadIdDisplay();
        }
        
        if (data.error) {
            this.addMessage({ 
                text: data.text || 'An error occurred', 
                role: 'assistant', 
                isError: true,
                timestamp: data.time
            });
        } else {
            this.addMessage({ 
                text: data.text || 'No response', 
                role: 'assistant',
                timestamp: data.time
            });
        }
    }

    handleApiError(error) {
        console.error('API Error:', error);
        this.addMessage({ text: `Error: ${error.message}`, role: 'assistant', isError: true });
    }

    addMessage({ text, role, timestamp = new Date().toISOString(), isError = false }) {
        const messageElement = this.createMessageElement({ text, role, timestamp, isError });
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    createMessageElement({ text = '', role, timestamp, isError = false }) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}`;
        
        if (role === 'assistant') {
            messageElement.innerHTML = `
                <div class="thinking-steps"></div>
                <div class="content"></div>
            `;
            const contentEl = messageElement.querySelector('.content');
            if (isError) {
                contentEl.textContent = text;
                contentEl.classList.add('error');
            } else {
                contentEl.innerHTML = MarkdownParser.parseAndHighlight(text);
                // Apply syntax highlighting
                if (typeof Prism !== 'undefined') {
                    setTimeout(() => {
                        MarkdownParser.applySyntaxHighlighting(contentEl);
                    }, 10);
                }
            }
        } else {
            messageElement.innerHTML = `<div class="message-bubble">${text}</div>`;
        }

        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = Utils.formatTimestamp(timestamp);
        messageElement.appendChild(timeElement);

        return messageElement;
    }

    showTyping() {
        this.isTyping = true;
        this.sendButton.textContent = 'Sending...';
        this.sendButton.disabled = true;
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'typing-indicator';
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = `<span>AI is thinking</span><div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
        this.messagesContainer.appendChild(typingIndicator);
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        this.sendButton.textContent = 'Send';
        this.sendButton.disabled = false;
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) typingIndicator.remove();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    startNewChatSession() {
        this.threadId = null;
        this.updateThreadIdDisplay();
        this.messagesContainer.innerHTML = '';
        this.addWelcomeMessage();
        this.chatInput.focus();
    }

    initResizeHandling() {
        let isResizing = false;
        this.resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.userSelect = 'none';
            const startWidth = this.chatContainer.offsetWidth;
            const startHeight = this.chatContainer.offsetHeight;
            const startX = e.clientX;
            const startY = e.clientY;

            const doDrag = (e) => {
                if (!isResizing) return;
                const width = startWidth + (startX - e.clientX);
                const height = startHeight + (startY - e.clientY);
                this.chatContainer.style.width = `${Math.max(300, width)}px`;
                this.chatContainer.style.height = `${Math.max(400, height)}px`;
            };

            const stopDrag = () => {
                isResizing = false;
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', doDrag);
                document.removeEventListener('mouseup', stopDrag);
            };

            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', stopDrag);
        });
    }
}

export default ChatManager;