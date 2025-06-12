import React from 'react';
import { useApp } from '../context/AppContext';
import { ACTIONS } from '../context/AppContext';

const ChatHeader = () => {
    const { state, dispatch, getActiveEndpoint, startNewSession } = useApp();
    const activeEndpoint = getActiveEndpoint();

    const handleCloseChat = () => {
        dispatch({ type: ACTIONS.SET_CHAT_OPEN, payload: false });
    };

    const handleNewChat = () => {
        startNewSession();
        console.log('🆕 New chat session started');
    };

    const getStatusText = () => {
        if (activeEndpoint && activeEndpoint.url !== 'http://localhost:8000/chat') {
            return `Connected to ${activeEndpoint.name}`;
        }
        return 'Ready';
    };

    return (
        <div className="chat-header">
            <h2 className="chat-title">AI Chat</h2>
            <div className="chat-status">
                <div className="status-dot"></div>
                <span>{getStatusText()}</span>
            </div>
            {state.conversationId && (
                <div className="conversation-id">
                    <span className="conversation-label">ID:</span>
                    <span className="conversation-value">{state.conversationId}</span>
                </div>
            )}
            <button 
                className="new-chat-btn" 
                onClick={handleNewChat}
                title="Start New Chat Session"
            >
                <span className="btn-icon">+</span>
                <span className="btn-text">New</span>
            </button>
            <button className="chat-toggle repositioned" onClick={handleCloseChat}>
                ✕
            </button>
        </div>
    );
};

export default ChatHeader;