import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps, NodeToolbar } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { SettingsIcon, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LayerNodeData {
  label?: string;
  layerIndex?: number;
  nodeType?: string;
  iconifyId?: string;
  description?: string;
  source?: string;
  nodeCount?: number;
  [key: string]: unknown;
}

/**
 * LayerGroupNode - A container node that represents a semantic layer in architecture diagrams
 * 
 * This component renders a translucent background with a header label for
 * a specific architecture layer (e.g., "Presentation Layer", "Service Layer")
 */
const LayerGroupNode = ({ id, data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const [showControls, setShowControls] = useState(false);
  const isDarkMode = theme === 'dark';
  
  // Layer color mapping with light/dark variations - more distinct colors for easier identification
  const layerColors: Record<number, { light: string, dark: string, border: string, label: string }> = {
    0: { 
      light: 'rgba(59, 130, 246, 0.15)', 
      dark: 'rgba(59, 130, 246, 0.25)',
      border: '#93c5fd',
      label: 'Client & Edge'
    },
    1: { 
      light: 'rgba(244, 63, 94, 0.15)', 
      dark: 'rgba(244, 63, 94, 0.25)',
      border: '#fda4af',
      label: 'Gateway & Security'
    },
    2: { 
      light: 'rgba(168, 85, 247, 0.15)', 
      dark: 'rgba(168, 85, 247, 0.25)',
      border: '#c4b5fd',
      label: 'Auth Services'
    },
    3: { 
      light: 'rgba(139, 92, 246, 0.15)', 
      dark: 'rgba(139, 92, 246, 0.25)',
      border: '#a5b4fc',
      label: 'Core Services'
    },
    4: { 
      light: 'rgba(16, 185, 129, 0.15)', 
      dark: 'rgba(16, 185, 129, 0.25)',
      border: '#6ee7b7',
      label: 'Messaging'
    },
    5: { 
      light: 'rgba(245, 158, 11, 0.15)', 
      dark: 'rgba(245, 158, 11, 0.25)',
      border: '#fcd34d',
      label: 'Processing'
    },
    6: { 
      light: 'rgba(249, 115, 22, 0.15)', 
      dark: 'rgba(249, 115, 22, 0.25)',
      border: '#fdba74',
      label: 'Data Stores'
    },
    7: { 
      light: 'rgba(124, 58, 237, 0.15)', 
      dark: 'rgba(124, 58, 237, 0.25)',
      border: '#c4b5fd',
      label: 'Monitoring'
    },
    8: { 
      light: 'rgba(100, 116, 139, 0.15)', 
      dark: 'rgba(100, 116, 139, 0.25)',
      border: '#cbd5e1',
      label: 'External Services'
    },
  };
  
  // Get layer index and name
  const nodeData = data as LayerNodeData;
  const layerIndex = typeof nodeData?.layerIndex === 'number' ? nodeData.layerIndex : 0;
  const nodeCount = nodeData?.nodeCount || 0;
  
  // Select appropriate layer name - first check predefined name, then custom label, then fall back to index
  const layerName = 
    layerColors[layerIndex]?.label || 
    nodeData?.label || 
    `Layer ${layerIndex}`;
  
  // Select color based on layer index and theme
  const colorKey = Math.min(layerIndex, Object.keys(layerColors).length - 1);
  const layerStyle = layerColors[colorKey] || layerColors[0];
  const bgColor = isDarkMode ? layerStyle.dark : layerStyle.light;
  
  // Border style based on selection state and layer
  const borderColor = layerStyle.border;
  const borderStyle = selected
    ? `2px solid ${borderColor}`
    : `1px dashed ${borderColor}`;

  return (
    <div
      className={cn(
        "layer-group-node relative rounded-xl overflow-hidden transition-shadow",
        selected ? "shadow-lg" : "shadow-md"
      )}
      style={{
        backgroundColor: bgColor,
        border: borderStyle,
        width: '100%',
        height: '100%',
        padding: '4px',
        minWidth: '200px',
        minHeight: '100px',
        // Add gradient overlay for better visual separation
        backgroundImage: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor.replace(')', ', 0.5)')} 100%)`,
        backdropFilter: 'blur(8px)',
        boxShadow: selected ? `0 0 0 2px ${borderColor}, 0 8px 20px rgba(0,0,0,0.1)` : `0 4px 12px rgba(0,0,0,0.05)`,
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Layer header with name and badge */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-between p-2"
        style={{
          backdropFilter: 'blur(6px)',
          background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
          borderBottom: `1px solid ${borderColor}40`,
          borderTopLeftRadius: '0.75rem',
          borderTopRightRadius: '0.75rem',
        }}
      >
        <Badge 
          variant="outline" 
          className="bg-background/70 backdrop-blur-sm text-xs font-medium flex items-center gap-1.5 px-2 py-1"
          style={{ borderColor: borderColor }}
        >
          <Layers size={12} style={{ color: borderColor }} />
          <span>{layerName}</span>
          {nodeCount > 0 && (
            <span className="ml-1 bg-gray-200/70 px-1.5 rounded-full text-gray-700 text-[10px]">
              {nodeCount}
            </span>
          )}
        </Badge>
        
        {/* Toolbar that appears on hover/select */}
        <NodeToolbar
          className="layer-group-toolbar"
          isVisible={Boolean(showControls || selected)}
          position={Position.Top}
        >
          <div className="flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-md p-1 shadow-sm">
            <SettingsIcon size={14} />
          </div>
        </NodeToolbar>
      </div>
      
      {/* Add subtle grid pattern for better visual */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          backgroundImage: isDarkMode 
            ? `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)` 
            : `linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          opacity: 0.6,
          zIndex: -1,
        }}
      />
      
      {/* Add invisible handles for potential connections */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ visibility: 'hidden' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ visibility: 'hidden' }}
      />
    </div>
  );
};

export default memo(LayerGroupNode);