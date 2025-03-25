
import React from 'react';
import { NodeToolbar, Position } from '@xyflow/react';
import { Button } from '../ui/button';
import { Trash, Pencil, Copy, Info, Link, ArrowUpDown, Eye, EyeOff, Lock, Unlock, RotateCw } from 'lucide-react';

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
      className="bg-white shadow-md border border-gray-200 rounded-md flex p-1 gap-1"
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-700"
        onClick={() => onEdit(id)}
        title="Edit node"
      >
        <Pencil size={16} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-700"
        onClick={() => onDelete(id)}
        title="Delete node"
      >
        <Trash size={16} />
      </Button>

      {onDuplicate && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-700"
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
          className="h-8 w-8 text-gray-700"
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
          className="h-8 w-8 text-gray-700"
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
          className="h-8 w-8 text-gray-700"
          onClick={() => onRotate(id)}
          title="Rotate node"
        >
          <RotateCw size={16} />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-700"
        onClick={() => onInfoToggle(id)}
        title="Show info"
      >
        <Info size={16} />
      </Button>
    </NodeToolbar>
  );
};

export default NodeContextToolbar;