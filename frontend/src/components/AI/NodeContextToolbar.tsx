import React from 'react';
import { NodeToolbar, Position } from '@xyflow/react';
import { Button } from '../ui/button';
import { Trash, Pencil, Copy, Eye, EyeOff, Lock, Unlock, RotateCw } from 'lucide-react';

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
  onInfoToggle?: (id: string) => void; // Made optional
  onDuplicate?: (id: string) => void;
  onLock?: (id: string) => void;
  onHide?: (id: string) => void;
  onRotate?: (id: string) => void;
}

const NodeContextToolbar: React.FC<NodeContextToolbarProps> = ({
  id,
  selected,
  data,
  onEdit,
  onDelete,
  onInfoToggle,
  onDuplicate,
  onLock,
  onHide,
  onRotate
}) => {
  return (
    <NodeToolbar 
      isVisible={selected} 
      position={Position.Top}
      className="shadow-md rounded-md flex p-1 gap-1"
      style={{
        background: 'linear-gradient(135deg, #f0ebff 0%, #e4e6fd 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 4px 12px rgba(124, 101, 246, 0.15)',
        border: 'none'
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-indigo-800 hover:bg-indigo-100/50"
        onClick={() => onEdit(id)}
        title="Edit node"
      >
        <Pencil size={16} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-indigo-800 hover:bg-indigo-100/50"
        onClick={() => onDelete(id)}
        title="Delete node"
      >
        <Trash size={16} />
      </Button>

      {onDuplicate && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-indigo-800 hover:bg-indigo-100/50"
          onClick={() => onDuplicate(id)}
          title="Duplicate node"
        >
          <Copy size={16} />
        </Button>
      )}

      {onLock && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-indigo-800 hover:bg-indigo-100/50"
          onClick={() => onLock(id)}
          title="Lock/Unlock node"
        >
          <Lock size={16} />
        </Button>
      )}

      {onHide && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-indigo-800 hover:bg-indigo-100/50"
          onClick={() => onHide(id)}
          title="Hide/Show node"
        >
          <Eye size={16} />
        </Button>
      )}

      {onRotate && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-indigo-800 hover:bg-indigo-100/50"
          onClick={() => onRotate(id)}
          title="Rotate node"
        >
          <RotateCw size={16} />
        </Button>
      )}

      {/* Info button removed as requested */}
    </NodeToolbar>
  );
};

export default NodeContextToolbar;