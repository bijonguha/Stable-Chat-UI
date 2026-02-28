import { useState } from 'react';
import { useEndpoints } from '../../context/EndpointContext';
import { EndpointCard } from './EndpointCard';
import { EndpointModal } from './EndpointModal';
import type { Endpoint, EndpointFormData } from '../../types/endpoint';

export function EndpointList() {
  const { endpoints, activeEndpoint, setActiveEndpoint, addEndpoint, updateEndpoint, deleteEndpoint } = useEndpoints();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);

  const handleEdit = (endpoint: Endpoint) => {
    setEditingEndpoint(endpoint);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingEndpoint(null);
    setModalOpen(true);
  };

  const handleSave = (data: EndpointFormData) => {
    if (editingEndpoint) {
      updateEndpoint(editingEndpoint.id, data);
    } else {
      addEndpoint(data);
    }
    setModalOpen(false);
    setEditingEndpoint(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this endpoint?')) {
      deleteEndpoint(id);
    }
  };

  return (
    <div className="w-full max-w-[600px]">
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-dark-200 font-medium">API Endpoints</div>
        <button
          onClick={handleAdd}
          className="btn-gradient-gray border border-dark-400 text-dark-50 px-4 py-2 rounded-lg text-xs cursor-pointer transition-all backdrop-blur-sm hover:-translate-y-px hover:shadow-lg"
        >
          + Add Endpoint
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {endpoints.map(endpoint => (
          <EndpointCard
            key={endpoint.id}
            endpoint={endpoint}
            isActive={activeEndpoint?.id === endpoint.id}
            onActivate={() => setActiveEndpoint(endpoint.id)}
            onEdit={() => handleEdit(endpoint)}
            onDelete={() => handleDelete(endpoint.id)}
          />
        ))}
      </div>

      <EndpointModal
        isOpen={modalOpen}
        endpoint={editingEndpoint}
        onClose={() => { setModalOpen(false); setEditingEndpoint(null); }}
        onSave={handleSave}
      />
    </div>
  );
}
