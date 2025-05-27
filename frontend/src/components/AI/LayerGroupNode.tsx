import React from 'react';
import { NodeProps } from '@xyflow/react';
import { getLayerStyle } from './utils/layerUtils';

interface ExtendedNodeProps extends NodeProps {
  style?: React.CSSProperties;
}

// Get opacity based on hierarchy level
const getHierarchicalOpacity = (level: number): number => {
  // Make all backgrounds fully transparent
  return 0;
};

const LayerGroupNode = ({ id, data, style, width, height }: ExtendedNodeProps) => {
  // Get layer type and hierarchy level from data
  const layerType = (data?.layer as string) || 'default';
  const hierarchyLevel = typeof data?.hierarchyLevel === 'number' ? data.hierarchyLevel : 0; 
  
  // Get appropriate style from our centralized layer configuration
  const layerStyle = getLayerStyle(layerType);

  // Adjust border style based on hierarchy level
  const getBorderStyle = (level: number): string => {
    // Top-level containers use dashed border
    // Child containers use dotted borders
    return level === 0 ? 'dashed' : 'dotted';
  };
  
  // Get background opacity based on hierarchy level
  const bgOpacity = getHierarchicalOpacity(hierarchyLevel);
  
  // Dynamically adjust background color based on layer type and level
  const getBackgroundColor = (): string => {
    return 'transparent'; // Always use transparent background
  };
  
  // Calculate z-index based on level - ensure parent layers are behind child layers
  const getZIndex = (): number => {
    return hierarchyLevel === 0 ? -10 : -5;
  };
  
  return (
    <div
      style={{
        ...style,
        position: 'absolute',
        pointerEvents: 'none', // Allow click-through to nodes
        borderStyle: getBorderStyle(hierarchyLevel), // Style based on level
        borderWidth: style?.borderWidth || 3, // Increased from 2 to 3 for bolder borders
        borderColor: style?.borderColor || layerStyle.borderColor,
        backgroundColor: 'transparent', // Always transparent
        width: width || style?.width || 200,
        height: height || style?.height || 200,
        borderRadius: style?.borderRadius || 10,
        zIndex: getZIndex(), // Use function to calculate safe z-index
        padding: '10px',
        boxShadow: 'none', // Remove box shadow for cleaner look
      }}
      className="layer-container"
    >
      {/* Layer title */}
      <div
        className="layer-title absolute -top-6 left-4 px-3 py-1 text-xs font-semibold rounded"
        style={{
          backgroundColor: style?.backgroundColor || '#fff', // White background for label
          color: style?.color || layerStyle.color,
          borderWidth: 1.5, // Slightly thicker border
          borderStyle: 'solid',
          borderColor: layerStyle.borderColor,
          opacity: 1, // Full opacity for better visibility
          pointerEvents: 'all', // Make title clickable
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          fontWeight: 700, // Bolder text
          fontSize: '0.8rem', // Slightly larger font
        }}
      >
        {typeof data?.label === 'string' ? data.label : layerStyle.label}
      </div>
    </div>
  );
};

export default LayerGroupNode;