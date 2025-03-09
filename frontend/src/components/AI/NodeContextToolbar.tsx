
import React from 'react';
import { NodeToolbar, Position } from '@xyflow/react';

// Define the data structure
interface NodeData {
  label: string;
  description?: string;
  nodeType?: string;
}

interface NodeContextToolbarProps {
  id: string;
  selected: boolean;
  data: NodeData;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onInfoToggle: (id: string) => void;
}

const NodeContextToolbar: React.FC<NodeContextToolbarProps> = ({
  id,
  selected,
  data,
  onEdit,
  onDelete,
  onInfoToggle
}) => {
  return (
    <NodeToolbar 
      isVisible={selected} 
      position={Position.Top}
      className="bg-white shadow-md border border-gray-200 rounded-md flex p-1 gap-1"
    >
      <button
        className="p-1 rounded-md hover:bg-gray-100 text-gray-700"
        onClick={() => onEdit(id)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
      </button>

      <button
        className="p-1 rounded-md hover:bg-gray-100 text-gray-700"
        onClick={() => onDelete(id)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </button>

      <button
        className="p-1 rounded-md hover:bg-gray-100 text-gray-700"
        onClick={() => onInfoToggle(id)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      </button>
    </NodeToolbar>
  );
};

export default NodeContextToolbar;