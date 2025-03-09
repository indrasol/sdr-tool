
import React from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import NodeContextToolbar from './NodeContextToolbar';
import { NodeProps } from './types/diagramTypes';

const CustomNode = ({ 
  id, 
  data, 
  selected 
}: NodeProps) => {
  // Ensure data is always defined with default values
  const nodeData = data || { label: 'Node' };
  
  // Type assertion to work with the data
  const safeData = nodeData as {
    label: string;
    description?: string;
    nodeType?: string;
    onEdit?: (id: string, label: string) => void;
    onDelete?: (id: string) => void;
  };
  
  // Extract values with fallbacks
  const label = safeData.label || 'Node';
  const description = safeData.description || '';
  const nodeType = safeData.nodeType || 'Component';

  const handleEdit = (nodeId: string) => {
    if (safeData.onEdit) {
      safeData.onEdit(nodeId, label);
    }
  };

  const handleDelete = (nodeId: string) => {
    if (safeData.onDelete) {
      safeData.onDelete(nodeId);
    }
  };

  // Create a handleInfoToggle function for NodeContextToolbar
  const handleInfoToggle = (nodeId: string) => {
    // This is just a placeholder function to satisfy the prop requirements
    console.log(`Info toggle for node ${nodeId}`);
  };

  return (
    <>
      {/* Add the NodeResizer component that appears when the node is selected */}
      {selected && (
        <NodeResizer 
          minWidth={100}
          minHeight={50}
          isVisible={!!selected}
          lineClassName="border-securetrack-purple"
          handleClassName="h-3 w-3 bg-white border-2 border-securetrack-purple rounded"
        />
      )}
      
      <NodeContextToolbar
        id={id}
        selected={!!selected}
        data={{
          label,
          description,
          nodeType
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onInfoToggle={handleInfoToggle}
      />

      <div className="custom-node flex items-center justify-center w-full h-full bg-white rounded-lg border border-gray-200 p-2 shadow-sm">
        <div className="font-medium text-center">
          {label}
        </div>
      </div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </>
  );
};

export default CustomNode;