import React from 'react';
import { NodeProps } from '@xyflow/react';
import { getLayerStyle } from './utils/layerUtils';

interface ExtendedNodeProps extends NodeProps {
  style?: React.CSSProperties;
}

const LayerGroupNode = ({ id, data, style, width, height }: ExtendedNodeProps) => {
  // Get layer type from data for dynamic styling
  const layerType = (data?.layer as string) || 'default';
  
  // Get appropriate style from our centralized layer configuration
  const layerStyle = getLayerStyle(layerType);

  
  
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