import React from 'react';

const TypingIndicator = () => {
    return (
        <div className="typing-indicator">
            <span>AI is thinking</span>
            <div className="typing-dots">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
            </div>
        </div>
    );
};

export default TypingIndicator;