import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

const ChatMessages = () => {
    const { state } = useApp();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [state.messages, state.isTyping]);

    return (
        <div className="chat-messages">
            {state.messages.map((message, index) => (
                <ChatMessage 
                    key={`${message.timestamp}-${index}`} 
                    message={message} 
                />
            ))}
            {state.isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatMessages;