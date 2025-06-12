import React from 'react';
import { useApp } from '../context/AppContext';
import { ACTIONS } from '../context/AppContext';

const ChatToggle = () => {
    const { state, dispatch } = useApp();

    const handleToggleChat = () => {
        dispatch({ type: ACTIONS.SET_CHAT_OPEN, payload: !state.isChatOpen });
    };

    return (
        <button 
            className="chat-toggle" 
            onClick={handleToggleChat}
            style={{ display: state.isChatOpen ? 'none' : 'block' }}
        >
            💬
        </button>
    );
};

export default ChatToggle;