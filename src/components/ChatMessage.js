import React from 'react';
import { Utils } from '../utils/utils';
import { MarkdownParser } from '../utils/markdownParser';

const ChatMessage = ({ message }) => {
    const { text, role, timestamp, isError = false } = message;

    const renderContent = () => {
        if (role === 'assistant' && !isError) {
            return (
                <div 
                    dangerouslySetInnerHTML={{ 
                        __html: MarkdownParser.parse(text) 
                    }} 
                />
            );
        }
        return text;
    };

    const bubbleStyle = isError ? {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white'
    } : {};

    return (
        <div className={`message ${role}`}>
            <div className="message-bubble" style={bubbleStyle}>
                {renderContent()}
            </div>
            <div className="message-time">
                {Utils.formatTimestamp(timestamp)}
            </div>
        </div>
    );
};

export default ChatMessage;