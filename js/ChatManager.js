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
                    
                    if (data.type === 'id') {
                        this.currentMessageId = data.value;
                    } else if (data.type === 'done') {
                        if (data.thread_id) {
                            this.threadId = data.thread_id;
                            this.updateThreadIdDisplay();
                        }
                        const finalRawText = containers.contentContainer.getAttribute('data-raw-text') || containers.contentContainer.textContent;
                        containers.contentContainer.innerHTML = MarkdownParser.parseAndHighlight(finalRawText);
                        
                        if (containers.thinkingStepsContainer.children.length > 0) {
                            setTimeout(() => {
                                containers.thinkingStepsContainer.style.transition = 'opacity 0.5s ease-out';
                                containers.thinkingStepsContainer.style.opacity = '0';
                                setTimeout(() => {
                                    containers.thinkingStepsContainer.innerHTML = '';
                                    containers.thinkingStepsContainer.style.opacity = '1';
                                }, 500); 
                        }
                        
                        if (typeof Prism !== 'undefined') {
                            setTimeout(() => {
                                MarkdownParser.applySyntaxHighlighting(containers.contentContainer);
                            }, 10);
                        }
                    } else if (data.thread_id && data.role === 'assistant') {
                        if (data.error) {
                            containers.contentContainer.innerHTML = `<div class="error">${data.text}</div>`;
                            if (data.error.details) {
                                console.error('API Error Details:', data.error.details);
                            }
                        } else if (data.text) {
                            if (data.text.includes('⚙️ *Executing') || data.text.includes('🔍') || data.text.includes('📈 *Generating insights*')) {
                                if (containers.contentContainer.innerHTML.includes('stream-typing-indicator')) {
                                    containers.contentContainer.innerHTML = '';
                                }
                                
                                const thinkingMatch = data.text.match(/(⚙️ \*[^*]+\*|🔍[^\n]*|📈 \*[^*]+\*)/);
                                if (thinkingMatch) {
                                    containers.thinkingStepsContainer.innerHTML += `<div class="thinking-step">${thinkingMatch[1]}</div>`;
                                    thinkingStepsShown = true;
                                }
                                
                                const currentText = containers.contentContainer.getAttribute('data-raw-text') || '';
                                const newText = currentText + data.text;
                                containers.contentContainer.setAttribute('data-raw-text', newText);
                                
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
                                const currentText = containers.contentContainer.getAttribute('data-raw-text') || '';
                                const newText = currentText + data.text;
                                containers.contentContainer.setAttribute('data-raw-text', newText);
                                
                                if (!currentText) {
                                    containers.contentContainer.innerHTML = '';
                                }
                                
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

    async sendStreamingMessage(message) {
        this.isStreaming = true;
        this.sendButton.disabled = true;
        this.sendButton.textContent = 'Streaming...';
        
        this.currentStreamingMessage = this.createStreamingMessage();
        
        this.streamBuffer = '';
        
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
        
        if (requestUrl.startsWith('https://localhost')) {
            requestUrl = requestUrl.replace('https://', 'http://');
        }
        
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
                ...(endpoint?.headers || {}),
                ...this.getAuthHeaders(endpoint)
            },
            body: JSON.stringify({
                messages: { role: "user", text: message },
                model: endpoint?.model || "custom-notset",
                ...(this.conversationId && { thread_id: this.conversationId }),
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
                
                if (done) {
                    if (this.streamBuffer && this.streamBuffer.trim()) {
                        await this.processStreamChunk('\n'); 
                    }
                    break;
                }
                
                const chunk = decoder.decode(value, { stream: true });
                await this.processStreamChunk(chunk);
            }
        } finally {
            reader.releaseLock();
        }
    }

    async processStreamChunk(chunk) {
        if (!this.streamBuffer) {
            this.streamBuffer = '';
        }
        
        this.streamBuffer += chunk;
        
        const lines = this.streamBuffer.split('\n');
        
        this.streamBuffer = lines.pop() || '';
        
        for (const line of lines) {
            if (line.trim() === '') continue;
            
            try {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        return;
                    }
                    
                    const parsed = JSON.parse(data);
                    this.appendStreamContent(parsed);
                }
                else if (line.startsWith('event: ')) {
                    const eventType = line.slice(7);
                    this.lastSseEventType = eventType;
                    continue;
                }
                else if (line.trim().startsWith('{')) {
                    const parsed = JSON.parse(line);
                    this.appendStreamContent(parsed);
                }
                else {
                    this.appendStreamContent({ content: line });
                }
            } catch (error) {
                if (line.trim()) {
                    this.appendStreamContent({ content: line.trim() });
                }
            }
        }
        
        if (this.streamBuffer.length > 0 && !this.streamBuffer.includes('{') && !this.streamBuffer.startsWith('data:')) {
            clearTimeout(this.bufferTimeout);
            this.bufferTimeout = setTimeout(() => {
                if (this.streamBuffer.trim()) {
                    this.appendStreamContent({ content: this.streamBuffer });
                    this.streamBuffer = '';
                }
            }, 50); 
        }
    }

    appendStreamContent(data) {
        if (!this.currentStreamingMessage) {
            return;
        }

        this.updateThreadIdFromPayload(data, this.lastSseEventType);
        if (data && typeof data.content === 'string') {
            this.updateThreadIdFromPayload(data.content, this.lastSseEventType);
        }

        if (!this.streamingFirstResponseReceived && this.streamingStartTime) {
            const endTime = performance.now();
            const responseTime = endTime - this.streamingStartTime;
            
            const endpoint = this.endpointManager.activeEndpoint;
            if (endpoint && endpoint.id) {
                StorageManager.recordResponseTime(endpoint.id, responseTime);
                this.endpointManager.render();
            }
            
            this.streamingFirstResponseReceived = true;
        }
        
        let content = '';
        
        if (data.type === 'text_sql') {
            content = data.content || '';
        } else if (data.type === 'data') {
            content = data.content || '';
        } else if (data.type === 'error') {
            content = data.content || `Error: ${data.error || 'Unknown error'}`;
        }
        else if (data.stream_end) {
            return; 
        }
        else if (data.content) {
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
            
            this.updateStreamingDisplay();
        }
    }

    updateStreamingDisplay() {
        if (!this.currentStreamingMessage) return;
        
        const safeContent = this.escapeHtml(this.currentStreamingMessage.content);
        
        this.currentStreamingMessage.bubble.innerHTML = 
            safeContent.replace(/\n/g, '<br>') + '<span class="streaming-cursor">▊</span>';
        this.scrollToBottom();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    finishStreaming() {
        this.isStreaming = false;
        this.sendButton.disabled = false;
        this.sendButton.textContent = 'Send';
        
        if (this.bufferTimeout) {
            clearTimeout(this.bufferTimeout);
            this.bufferTimeout = null;
        }
        
        if (this.currentStreamingMessage) {
            const finalContent = MarkdownParser.parseAndHighlight(this.currentStreamingMessage.content, this.currentStreamingMessage.bubble);
            this.currentStreamingMessage.bubble.innerHTML = finalContent;
            this.currentStreamingMessage = null;
        }
        
        this.streamBuffer = '';
        
        this.scrollToBottom();
    }

    handleStreamingError(error) {
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

    updateThreadIdFromPayload(payload, eventType) {
        try {
            const id = this.extractThreadId(payload, eventType);
            if (id && this.conversationId !== id) {
                this.conversationId = id;
                this.updateConversationIdDisplay();
            }
        } catch (e) {
        }
    }

    extractThreadId(payload, eventType) {
        const isLikelyId = (val) => {
            if (typeof val !== 'string' || !val.trim()) return false;
            if (val.startsWith('thread_')) return true;
            if (/^[0-9a-fA-F-]{16,}$/.test(val)) return true; 
            if (val.length >= 12 && /[A-Za-z0-9_-]/.test(val)) return true;
            return false;
        };

        if (payload && typeof payload === 'object') {
            const candidates = [
                payload.thread_id,
                payload.conversation_id,
                payload?.thread?.id,
                payload?.thread?.thread_id,
                payload?.message?.thread_id,
                payload?.meta?.thread_id,
                payload?.meta?.conversation_id,
                payload?.data?.thread_id,
            ].filter(Boolean);
            const found = candidates.find(isLikelyId);
            if (found) return found;
        }

        if (typeof payload === 'string') {
            const m1 = payload.match(/\bthread[_ -]?id\b[\u00A0:=\-\\]*["']?([A-Za-z0-9_\-]{8,})["']?/i);
            if (m1 && isLikelyId(m1[1])) return m1[1];

            const m2 = payload.match(/\bconversation[_ -]?id\b[\u00A0:=\-\\]*["']?([A-Za-z0-9_\-]{8,})["']?/i);
            if (m2 && isLikelyId(m2[1])) return m2[1];

            const m3 = payload.match(/\bthread_[A-Za-z0-9_\-]{4,}\b/);
            if (m3 && isLikelyId(m3[0])) return m3[0];
        }

        if (eventType && typeof payload === 'object' && /thread/i.test(eventType) && isLikelyId(payload?.id)) {
            return payload.id;
        }

        return null;
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
        
        this.isStreaming = false;
        this.currentStreamingMessage = null;
        this.streamBuffer = '';
        this.sendButton.disabled = false;
        this.sendButton.textContent = 'Send';
        
        const activeEndpoint = this.endpointManager?.activeEndpoint;
        if (activeEndpoint && activeEndpoint.id) {
            StorageManager.clearResponseTimesForEndpoint(activeEndpoint.id);
            this.endpointManager.render();
        }
        
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