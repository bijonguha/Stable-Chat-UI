import React from 'react';

const EndpointCard = ({ endpoint, isActive, onEdit, onDelete, onSetActive }) => {
    const streamingBadge = endpoint.isStreaming ? (
        <span className="streaming-badge">
            <span className="badge-icon">⚡</span>STREAMING
        </span>
    ) : (
        <span className="regular-badge">
            <span className="badge-icon">✓</span>REGULAR
        </span>
    );

    return (
        <div className={`endpoint-card ${isActive ? 'active' : ''}`}>
            <div className="endpoint-info">
                <h3>
                    {endpoint.name}
                    {streamingBadge}
                </h3>
                <p>{endpoint.url}</p>
            </div>
            <div className="endpoint-actions">
                {!isActive ? (
                    <button className="action-btn primary" onClick={onSetActive}>
                        Use
                    </button>
                ) : (
                    <span className="active-badge">Active</span>
                )}
                <button className="action-btn" onClick={onEdit}>
                    Edit
                </button>
                {!endpoint.isDefault && (
                    <button className="action-btn danger" onClick={onDelete}>
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
};

export default EndpointCard;