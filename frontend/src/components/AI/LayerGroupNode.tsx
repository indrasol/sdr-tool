import React from 'react';
import { NodeProps } from '@xyflow/react';

interface ExtendedNodeProps extends NodeProps {
  style?: React.CSSProperties;
}

const LayerGroupNode = ({ id, data, style, width, height }: ExtendedNodeProps) => {
  // Get layer type from data for dynamic styling
  const layerType = (data?.layer as keyof typeof layerStyles) || 'default';
  
  // Define more visible layer styles based on layer type
  const layerStyles = {
    // security: { 
    //   bgColor: 'rgba(255, 59, 48, 0.15)', 
    //   borderColor: 'rgba(255, 59, 48, 0.5)',
    //   color: '#990000',
    //   label: 'Security Layer'
    // },
    application: { 
      bgColor: 'rgba(52, 199, 89, 0.15)', 
      borderColor: 'rgba(52, 199, 89, 0.5)',
      color: '#006600',
      label: 'Application Layer'
    },
    cloud: { 
      bgColor: 'rgba(255, 149, 0, 0.15)', 
      borderColor: 'rgba(255, 149, 0, 0.5)',
      color: '#cc6600',
      label: 'Cloud Infrastructure'
    },
    network: { 
      bgColor: 'rgba(255, 59, 48, 0.15)', 
      borderColor: 'rgba(255, 59, 48, 0.5)',
      color: '#990000',
      label: 'Network Layer'
    },
    default: { 
      bgColor: '', 
      borderColor: '',
      color: '',
      label: ''
    }
  };
  
  // Get appropriate style based on layer type
  const layerStyle = layerStyles[layerType] || layerStyles.default;
  
  return (
    <div
      style={{
        ...style,
        position: 'absolute',
        pointerEvents: 'none', // Allow click-through to nodes
        borderStyle: 'dashed', // More visible dashed border
        borderWidth: style?.borderWidth || 2, // Increased width
        borderColor: style?.borderColor || layerStyle.borderColor, // Use layer-specific color
        backgroundColor: style?.backgroundColor || layerStyle.bgColor, // Use layer-specific background
        width: width || style?.width || 200, // Explicit width
        height: height || style?.height || 200, // Explicit height
        borderRadius: style?.borderRadius || 10, // Slight rounding
        zIndex: -5, // Ensure it's behind other nodes but visible
        padding: '10px', // Space for child nodes
        boxShadow: '0 0 10px rgba(0,0,0,0.05)', // Subtle shadow to enhance visibility
      }}
      className="layer-container"
    >
      {/* Layer title */}
      <div
        className="layer-title absolute -top-6 left-4 px-3 py-1 text-xs font-semibold rounded"
        style={{
          backgroundColor: style?.backgroundColor || layerStyle.bgColor, // Match layer background
          color: style?.color || layerStyle.color, // Match layer text color
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: layerStyle.borderColor,
          opacity: 0.95,
          pointerEvents: 'all', // Make title clickable
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {typeof data?.label === 'string' ? data.label : layerStyle.label}
      </div>
    </div>
  );
};

export default LayerGroupNode;