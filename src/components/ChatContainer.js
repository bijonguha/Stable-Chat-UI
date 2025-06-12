import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ACTIONS } from '../context/AppContext';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import useResizeHandler from '../hooks/useResizeHandler';

const ChatContainer = () => {
    const { state, dispatch, addMessage } = useApp();
    const containerRef = useRef(null);
    
    // Initialize resize handling
    useResizeHandler(containerRef);

    useEffect(() => {
        if (state.isChatOpen && state.messages.length === 0) {
            // Add welcome message when chat opens for the first time
            addMessage({
                text: "Hi! I'm your AI assistant. How can I help you today?",
                role: 'assistant',
                timestamp: new Date().toISOString()
            });
        }
    }, [state.isChatOpen, state.messages.length, addMessage]);

    return (
        <div 
            ref={containerRef}
            className={`chat-container ${state.isChatOpen ? 'open' : ''}`}
        >
            <ChatHeader />
            <ChatMessages />
            <ChatInput />
            <div className="resize-handle"></div>
        </div>
    );
};

export default ChatContainer;