import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ACTIONS } from '../context/AppContext';
import useChatApi from '../hooks/useChatApi';

const ChatInput = () => {
    const { state, dispatch, addMessage, getActiveEndpoint } = useApp();
    const [inputValue, setInputValue] = useState('');
    const textareaRef = useRef(null);
    const { sendMessage, sendStreamingMessage } = useChatApi();

    const autoResizeInput = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
        }
    };

    useEffect(() => {
        autoResizeInput();
    }, [inputValue]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSendMessage = async () => {
        const message = inputValue.trim();
        if (!message || state.isTyping || state.isStreaming) return;

        // Add user message
        addMessage({
            text: message,
            role: 'user',
            timestamp: new Date().toISOString()
        });

        setInputValue('');

        // Send to API
        const endpoint = getActiveEndpoint();
        const useStreaming = endpoint && endpoint.isStreaming;

        try {
            if (useStreaming) {
                await sendStreamingMessage(message);
            } else {
                await sendMessage(message);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            addMessage({
                text: `Error: ${error.message}. Please check your endpoint configuration.`,
                role: 'assistant',
                timestamp: new Date().toISOString(),
                isError: true
            });
        }
    };

    const isDisabled = state.isTyping || state.isStreaming;
    const buttonText = state.isStreaming ? 'Streaming...' : state.isTyping ? 'Sending...' : 'Send';

    return (
        <div className="chat-input-area">
            <div className="input-wrapper">
                <textarea
                    ref={textareaRef}
                    className="chat-input"
                    placeholder="Type your message..."
                    rows="1"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isDisabled}
                />
                <button
                    className="send-btn"
                    onClick={handleSendMessage}
                    disabled={isDisabled || !inputValue.trim()}
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

export default ChatInput;