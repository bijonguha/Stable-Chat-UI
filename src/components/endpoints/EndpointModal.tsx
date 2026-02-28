import { useState, useEffect, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Endpoint, EndpointFormData } from '../../types/endpoint';
import { validateJson, validateJwtToken } from '../../utils/validators';

interface EndpointModalProps {
  isOpen: boolean;
  endpoint: Endpoint | null;
  onClose: () => void;
  onSave: (data: EndpointFormData) => void;
}

export function EndpointModal({ isOpen, endpoint, onClose, onSave }: EndpointModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('POST');
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [model, setModel] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (endpoint) {
      setName(endpoint.name);
      setUrl(endpoint.url);
      setMethod(endpoint.method);
      setHeaders(JSON.stringify(endpoint.headers, null, 2));
      setModel(endpoint.model || '');
      setIsStreaming(endpoint.isStreaming);
      setAuthEnabled(endpoint.auth?.enabled || false);
      setAuthToken(endpoint.auth?.token || '');
    } else {
      setName('');
      setUrl('');
      setMethod('POST');
      setHeaders('{\n  "Content-Type": "application/json"\n}');
      setModel('');
      setIsStreaming(false);
      setAuthEnabled(false);
      setAuthToken('');
    }
    setError('');
  }, [endpoint, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!name.trim() || !url.trim()) {
        throw new Error('Name and URL are required!');
      }

      if (authEnabled && !authToken.trim()) {
        throw new Error('Authentication token is required when authentication is enabled!');
      }

      if (authEnabled && authToken.trim()) {
        validateJwtToken(authToken.trim());
      }

      const parsedHeaders = headers.trim() ? validateJson(headers.trim()) : {};

      onSave({
        name: name.trim(),
        url: url.trim(),
        method,
        headers: parsedHeaders,
        model: model.trim() || undefined,
        isStreaming,
        auth: { enabled: authEnabled, token: authToken.trim() },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-modal rounded-2xl p-8 w-[90%] max-w-[480px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-dark-25">
            {endpoint ? 'Edit Endpoint' : 'Add Endpoint'}
          </h3>
          <button onClick={onClose} className="text-dark-200 hover:text-dark-50 cursor-pointer bg-transparent border-none text-xl p-1 rounded transition-all hover:bg-dark-400/30">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm text-dark-100 font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., GPT-4, Claude, Gemini"
              className="w-full p-3 glass-input rounded-lg text-dark-50 text-sm transition-all placeholder:text-dark-300"
              required
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm text-dark-100 font-medium">URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://api.provider.com/v1/chat"
              className="w-full p-3 glass-input rounded-lg text-dark-50 text-sm transition-all placeholder:text-dark-300"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm text-dark-100 font-medium">Headers (JSON)</label>
            <textarea
              value={headers}
              onChange={e => setHeaders(e.target.value)}
              placeholder='{"Authorization": "Bearer your-key"}'
              rows={3}
              className="w-full p-3 glass-input rounded-lg text-dark-50 text-sm transition-all placeholder:text-dark-300 font-mono resize-y"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm text-dark-100 font-medium">Model (Optional)</label>
            <input
              type="text"
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="e.g., custom-notset, gpt-4, claude-3"
              className="w-full p-3 glass-input rounded-lg text-dark-50 text-sm transition-all placeholder:text-dark-300"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm text-dark-100 font-medium">Method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="w-full p-3 glass-input rounded-lg text-dark-50 text-sm transition-all"
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
            </select>
          </div>

          {/* Streaming Toggle */}
          <div className="mb-4">
            <label className="block mb-2 text-sm text-dark-100 font-medium">Response Type</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isStreaming}
                  onChange={e => setIsStreaming(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-dark-400 rounded-full peer-checked:bg-purple-400 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm text-dark-100">Enable Streaming Responses</span>
            </label>
          </div>

          {/* Auth Toggle */}
          <div className="mb-4">
            <label className="block mb-2 text-sm text-dark-100 font-medium">Authentication</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={authEnabled}
                  onChange={e => setAuthEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-dark-400 rounded-full peer-checked:bg-purple-400 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm text-dark-100">Enable Authentication</span>
            </label>
          </div>

          {authEnabled && (
            <div className="mb-4">
              <label className="block mb-2 text-sm text-dark-100 font-medium">JWT Bearer Token</label>
              <textarea
                value={authToken}
                onChange={e => setAuthToken(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                rows={3}
                className="w-full p-3 glass-input rounded-lg text-dark-50 text-sm transition-all placeholder:text-dark-300 font-mono resize-y"
              />
              <small className="text-dark-300 text-xs mt-1 block">
                Paste your JWT token here. The token contains all required user information.
              </small>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-dark-400/80 border border-dark-400/50 text-dark-100 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-dark-300/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 btn-gradient-purple text-white rounded-lg text-sm font-medium cursor-pointer border-none transition-all hover:btn-gradient-purple hover:-translate-y-px"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
