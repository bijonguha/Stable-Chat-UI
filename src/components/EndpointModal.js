import React, { useState, useEffect } from 'react';
import { Utils } from '../utils/utils';

const EndpointModal = ({ endpoint, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        method: 'POST',
        headers: '{\n  "Content-Type": "application/json"\n}',
        model: '',
        isStreaming: false
    });

    useEffect(() => {
        if (endpoint) {
            setFormData({
                name: endpoint.name,
                url: endpoint.url,
                method: endpoint.method,
                headers: JSON.stringify(endpoint.headers, null, 2),
                model: endpoint.model || '',
                isStreaming: endpoint.isStreaming || false
            });
        }
    }, [endpoint]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        try {
            if (!formData.name.trim() || !formData.url.trim()) {
                throw new Error('Name and URL are required!');
            }

            const headers = formData.headers.trim() ? 
                Utils.validateJsonString(formData.headers) : {};

            const endpointData = {
                id: endpoint?.id || Utils.generateId(),
                name: formData.name.trim(),
                url: formData.url.trim(),
                method: formData.method,
                headers,
                model: formData.model.trim(),
                isStreaming: formData.isStreaming
            };

            onSave(endpointData);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleModalClick = (e) => {
        if (e.target.classList.contains('modal')) {
            onClose();
        }
    };

    return (
        <div className="modal show" onClick={handleModalClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">
                        {endpoint ? 'Edit Endpoint' : 'Add Endpoint'}
                    </h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="endpoint-name">Name</label>
                        <input
                            type="text"
                            className="form-input"
                            id="endpoint-name"
                            placeholder="e.g., GPT-4, Claude, Gemini"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="endpoint-url">URL</label>
                        <input
                            type="url"
                            className="form-input"
                            id="endpoint-url"
                            placeholder="https://api.provider.com/v1/chat"
                            value={formData.url}
                            onChange={(e) => handleChange('url', e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="endpoint-headers">Headers (JSON)</label>
                        <textarea
                            className="form-input"
                            id="endpoint-headers"
                            rows="3"
                            placeholder='{"Authorization": "Bearer your-key"}'
                            value={formData.headers}
                            onChange={(e) => handleChange('headers', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="endpoint-model">Model (Optional)</label>
                        <input
                            type="text"
                            className="form-input"
                            id="endpoint-model"
                            placeholder="e.g., custom-notset, gpt-4, claude-3"
                            value={formData.model}
                            onChange={(e) => handleChange('model', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="endpoint-method">Method</label>
                        <select
                            className="form-input"
                            id="endpoint-method"
                            value={formData.method}
                            onChange={(e) => handleChange('method', e.target.value)}
                        >
                            <option value="POST">POST</option>
                            <option value="GET">GET</option>
                            <option value="PUT">PUT</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <div className="streaming-toggle-container">
                            <label className="form-label">Response Type</label>
                            <div className="toggle-wrapper">
                                <input
                                    type="checkbox"
                                    id="streaming-toggle"
                                    className="toggle-input"
                                    checked={formData.isStreaming}
                                    onChange={(e) => handleChange('isStreaming', e.target.checked)}
                                />
                                <label htmlFor="streaming-toggle" className="toggle-label">
                                    <span className="toggle-slider"></span>
                                    <span className="toggle-text">Enable Streaming Responses</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EndpointModal;