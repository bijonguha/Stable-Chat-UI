import React, { createContext, useContext, useReducer } from 'react';
import { Utils } from '../utils/utils';

const AppContext = createContext();

// Default endpoint
const getDefaultEndpoint = () => ({
    id: 'default',
    name: 'Local Server',
    url: 'http://localhost:8000/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    model: 'custom-notset',
    isDefault: true,
    isStreaming: false
});

// Initial state
const initialState = {
    endpoints: [getDefaultEndpoint()],
    activeEndpointId: 'default',
    conversationId: null,
    messages: [],
    isTyping: false,
    isStreaming: false,
    isChatOpen: false
};

// Action types
export const ACTIONS = {
    SET_ENDPOINTS: 'SET_ENDPOINTS',
    ADD_ENDPOINT: 'ADD_ENDPOINT',
    UPDATE_ENDPOINT: 'UPDATE_ENDPOINT',
    DELETE_ENDPOINT: 'DELETE_ENDPOINT',
    SET_ACTIVE_ENDPOINT: 'SET_ACTIVE_ENDPOINT',
    SET_CONVERSATION_ID: 'SET_CONVERSATION_ID',
    ADD_MESSAGE: 'ADD_MESSAGE',
    CLEAR_MESSAGES: 'CLEAR_MESSAGES',
    SET_TYPING: 'SET_TYPING',
    SET_STREAMING: 'SET_STREAMING',
    SET_CHAT_OPEN: 'SET_CHAT_OPEN',
    START_NEW_SESSION: 'START_NEW_SESSION',
    UPDATE_STREAMING_MESSAGE: 'UPDATE_STREAMING_MESSAGE',
    FINALIZE_STREAMING_MESSAGE: 'FINALIZE_STREAMING_MESSAGE'
};

// Reducer
const appReducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.SET_ENDPOINTS:
            return { ...state, endpoints: action.payload };
        
        case ACTIONS.ADD_ENDPOINT:
            return { ...state, endpoints: [...state.endpoints, action.payload] };
        
        case ACTIONS.UPDATE_ENDPOINT:
            return {
                ...state,
                endpoints: state.endpoints.map(ep => 
                    ep.id === action.payload.id ? action.payload : ep
                )
            };
        
        case ACTIONS.DELETE_ENDPOINT:
            const filteredEndpoints = state.endpoints.filter(ep => ep.id !== action.payload);
            const newActiveId = state.activeEndpointId === action.payload 
                ? filteredEndpoints[0]?.id 
                : state.activeEndpointId;
            return { 
                ...state, 
                endpoints: filteredEndpoints,
                activeEndpointId: newActiveId
            };
        
        case ACTIONS.SET_ACTIVE_ENDPOINT:
            return { ...state, activeEndpointId: action.payload };
        
        case ACTIONS.SET_CONVERSATION_ID:
            return { ...state, conversationId: action.payload };
        
        case ACTIONS.ADD_MESSAGE:
            return { ...state, messages: [...state.messages, action.payload] };
        
        case ACTIONS.CLEAR_MESSAGES:
            return { ...state, messages: [] };
        
        case ACTIONS.SET_TYPING:
            return { ...state, isTyping: action.payload };
        
        case ACTIONS.SET_STREAMING:
            return { ...state, isStreaming: action.payload };
        
        case ACTIONS.SET_CHAT_OPEN:
            return { ...state, isChatOpen: action.payload };
        
        case ACTIONS.START_NEW_SESSION:
            return { 
                ...state, 
                conversationId: null, 
                messages: [],
                isTyping: false,
                isStreaming: false
            };
        
        case ACTIONS.UPDATE_STREAMING_MESSAGE:
            return {
                ...state,
                messages: state.messages.map(msg => 
                    msg.id === action.payload.id 
                        ? { ...msg, text: action.payload.content }
                        : msg
                )
            };
        
        case ACTIONS.FINALIZE_STREAMING_MESSAGE:
            return {
                ...state,
                messages: state.messages.map(msg => 
                    msg.id === action.payload.id 
                        ? { ...msg, text: action.payload.content, isStreaming: false }
                        : msg
                )
            };
        
        default:
            return state;
    }
};

// Provider component
export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    const value = {
        state,
        dispatch,
        // Helper functions
        getActiveEndpoint: () => state.endpoints.find(ep => ep.id === state.activeEndpointId),
        addMessage: (message) => dispatch({ type: ACTIONS.ADD_MESSAGE, payload: message }),
        clearMessages: () => dispatch({ type: ACTIONS.CLEAR_MESSAGES }),
        startNewSession: () => dispatch({ type: ACTIONS.START_NEW_SESSION })
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

// Custom hook to use the context
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export default AppContext;