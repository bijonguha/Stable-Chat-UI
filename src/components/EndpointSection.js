import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ACTIONS } from '../context/AppContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import EndpointCard from './EndpointCard';
import EndpointModal from './EndpointModal';

const EndpointSection = () => {
    const { state, dispatch, getActiveEndpoint } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEndpoint, setEditingEndpoint] = useState(null);
    
    // Sync with localStorage
    const [storedEndpoints, setStoredEndpoints] = useLocalStorage('chatEndpoints', state.endpoints);
    const [storedActiveId, setStoredActiveId] = useLocalStorage('activeEndpoint', state.activeEndpointId);

    // Load from localStorage on mount
    useEffect(() => {
        if (storedEndpoints.length > 0) {
            dispatch({ type: ACTIONS.SET_ENDPOINTS, payload: storedEndpoints });
        }
        if (storedActiveId) {
            dispatch({ type: ACTIONS.SET_ACTIVE_ENDPOINT, payload: storedActiveId });
        }
    }, []);

    // Save to localStorage when state changes
    useEffect(() => {
        setStoredEndpoints(state.endpoints);
    }, [state.endpoints, setStoredEndpoints]);

    useEffect(() => {
        setStoredActiveId(state.activeEndpointId);
    }, [state.activeEndpointId, setStoredActiveId]);

    const openModal = (endpoint = null) => {
        setEditingEndpoint(endpoint);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEndpoint(null);
    };

    const handleSaveEndpoint = (endpointData) => {
        if (editingEndpoint) {
            dispatch({ 
                type: ACTIONS.UPDATE_ENDPOINT, 
                payload: { ...endpointData, id: editingEndpoint.id } 
            });
        } else {
            dispatch({ type: ACTIONS.ADD_ENDPOINT, payload: endpointData });
        }
        closeModal();
    };

    const handleDeleteEndpoint = (endpointId) => {
        if (state.endpoints.length <= 1) {
            alert('Cannot delete the last endpoint!');
            return;
        }
        
        if (window.confirm('Are you sure you want to delete this endpoint?')) {
            dispatch({ type: ACTIONS.DELETE_ENDPOINT, payload: endpointId });
        }
    };

    const handleSetActive = (endpointId) => {
        dispatch({ type: ACTIONS.SET_ACTIVE_ENDPOINT, payload: endpointId });
        dispatch({ type: ACTIONS.START_NEW_SESSION });
    };

    return (
        <div className="endpoints-section">
            <div className="section-header">
                <div className="section-title">API Endpoints</div>
                <button className="add-btn" onClick={() => openModal()}>
                    + Add Endpoint
                </button>
            </div>
            <div className="endpoints-list">
                {state.endpoints.map(endpoint => (
                    <EndpointCard
                        key={endpoint.id}
                        endpoint={endpoint}
                        isActive={endpoint.id === state.activeEndpointId}
                        onEdit={() => openModal(endpoint)}
                        onDelete={() => handleDeleteEndpoint(endpoint.id)}
                        onSetActive={() => handleSetActive(endpoint.id)}
                    />
                ))}
            </div>
            
            {isModalOpen && (
                <EndpointModal
                    endpoint={editingEndpoint}
                    onSave={handleSaveEndpoint}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

export default EndpointSection;