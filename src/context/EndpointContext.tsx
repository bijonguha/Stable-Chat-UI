import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { Endpoint, EndpointFormData } from '../types/endpoint';
import { generateId } from '../utils/formatters';

const STORAGE_KEY_ENDPOINTS = 'chatEndpoints';
const STORAGE_KEY_ACTIVE = 'activeEndpoint';

function getDefaultEndpoint(): Endpoint {
  return {
    id: 'default',
    name: 'Local Chat Server',
    url: 'http://localhost:8000',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    isDefault: true,
    isStreaming: true,
    auth: { enabled: false, token: '' },
  };
}

function loadEndpoints(): Endpoint[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ENDPOINTS);
    const endpoints: Endpoint[] = stored ? JSON.parse(stored) : [];
    return endpoints.length > 0 ? endpoints : [getDefaultEndpoint()];
  } catch {
    return [getDefaultEndpoint()];
  }
}

function loadActiveId(): string | null {
  return localStorage.getItem(STORAGE_KEY_ACTIVE);
}

function saveEndpoints(endpoints: Endpoint[]) {
  localStorage.setItem(STORAGE_KEY_ENDPOINTS, JSON.stringify(endpoints));
}

function saveActiveId(id: string) {
  localStorage.setItem(STORAGE_KEY_ACTIVE, id);
}

// State
interface EndpointState {
  endpoints: Endpoint[];
  activeEndpointId: string;
}

type EndpointAction =
  | { type: 'SET_ACTIVE'; id: string }
  | { type: 'ADD'; endpoint: Endpoint }
  | { type: 'UPDATE'; endpoint: Endpoint }
  | { type: 'DELETE'; id: string }
  | { type: 'SET_ENDPOINTS'; endpoints: Endpoint[] };

function endpointReducer(state: EndpointState, action: EndpointAction): EndpointState {
  switch (action.type) {
    case 'SET_ACTIVE': {
      saveActiveId(action.id);
      return { ...state, activeEndpointId: action.id };
    }
    case 'ADD': {
      const endpoints = [...state.endpoints, action.endpoint];
      saveEndpoints(endpoints);
      return { ...state, endpoints };
    }
    case 'UPDATE': {
      const endpoints = state.endpoints.map(e =>
        e.id === action.endpoint.id ? action.endpoint : e
      );
      saveEndpoints(endpoints);
      return { ...state, endpoints };
    }
    case 'DELETE': {
      if (state.endpoints.length <= 1) return state;
      const endpoints = state.endpoints.filter(e => e.id !== action.id);
      saveEndpoints(endpoints);
      const activeEndpointId = state.activeEndpointId === action.id
        ? endpoints[0].id
        : state.activeEndpointId;
      if (state.activeEndpointId === action.id) saveActiveId(activeEndpointId);
      return { ...state, endpoints, activeEndpointId };
    }
    case 'SET_ENDPOINTS': {
      saveEndpoints(action.endpoints);
      return { ...state, endpoints: action.endpoints };
    }
    default:
      return state;
  }
}

// Context
interface EndpointContextValue {
  endpoints: Endpoint[];
  activeEndpoint: Endpoint | undefined;
  setActiveEndpoint: (id: string) => void;
  addEndpoint: (data: EndpointFormData) => void;
  updateEndpoint: (id: string, data: EndpointFormData) => void;
  deleteEndpoint: (id: string) => boolean;
}

const EndpointContext = createContext<EndpointContextValue | null>(null);

export function EndpointProvider({ children }: { children: ReactNode }) {
  const initialEndpoints = loadEndpoints();
  const initialActiveId = loadActiveId() || initialEndpoints[0]?.id || 'default';

  const [state, dispatch] = useReducer(endpointReducer, {
    endpoints: initialEndpoints,
    activeEndpointId: initialActiveId,
  });

  const activeEndpoint = state.endpoints.find(e => e.id === state.activeEndpointId) || state.endpoints[0];

  const setActiveEndpoint = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE', id });
  }, []);

  const addEndpoint = useCallback((data: EndpointFormData) => {
    dispatch({ type: 'ADD', endpoint: { id: generateId(), ...data } });
  }, []);

  const updateEndpoint = useCallback((id: string, data: EndpointFormData) => {
    dispatch({ type: 'UPDATE', endpoint: { id, ...data } });
  }, []);

  const deleteEndpoint = useCallback((id: string): boolean => {
    if (state.endpoints.length <= 1) return false;
    dispatch({ type: 'DELETE', id });
    return true;
  }, [state.endpoints.length]);

  return (
    <EndpointContext.Provider value={{
      endpoints: state.endpoints,
      activeEndpoint,
      setActiveEndpoint,
      addEndpoint,
      updateEndpoint,
      deleteEndpoint,
    }}>
      {children}
    </EndpointContext.Provider>
  );
}

export function useEndpoints() {
  const ctx = useContext(EndpointContext);
  if (!ctx) throw new Error('useEndpoints must be used within EndpointProvider');
  return ctx;
}
