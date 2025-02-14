import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cpu, Database, Cloud, Network, Server } from 'lucide-react';

const nodeTypes = {
  service: { icon: Cpu, color: '#FF6B6B' },
  database: { icon: Database, color: '#4CAF50' },
  cloud: { icon: Cloud, color: '#2196F3' },
  network: { icon: Network, color: '#9C27B0' },
  server: { icon: Server, color: '#FF9800' },
};

const baseStyles = {
  padding: '12px 16px',
  borderRadius: '12px',
  minWidth: '150px',
  minHeight: '60px',
  fontSize: '12px',
  transition: 'all 0.2s ease',
};

export const CustomNode = ({ data, selected }) => {
  const type = data.nodeType || 'service';
  const NodeIcon = nodeTypes[type]?.icon || Cpu;
  const color = nodeTypes[type]?.color || '#78909C';

  return (
    <div
      style={{
        ...baseStyles,
        border: `2px solid ${color}`,
        backgroundColor: selected ? `${color}22` : 'white',
        boxShadow: selected 
          ? `0 0 0 2px ${color}, 0 4px 8px rgba(0,0,0,0.1)`
          : '0 4px 8px rgba(0,0,0,0.1)',
      }}
      className="group"
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${color}22` }}
        >
          <NodeIcon size={20} style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="font-semibold" style={{ color }}>
            {data.label}
          </div>
          {data.description && (
            <div className="text-xs text-gray-500 mt-1">
              {data.description}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export const customNodeTypes = {
  service: CustomNode,
  database: CustomNode,
  cloud: CustomNode,
  network: CustomNode,
  server: CustomNode,
};