import React from 'react';
import { NodeProps } from '@xyflow/react';
import { getLayerStyle } from './utils/layerUtils';

interface ExtendedNodeProps extends NodeProps {
  style?: React.CSSProperties;
}

// Get opacity based on hierarchy level
const getHierarchicalOpacity = (level: number): number => {
  // Higher level (child) layers are more opaque
  // Level 0 (top-level) layers are most transparent
  const baseOpacity = 0.15;
  const opacityIncrement = 0.05;
  return Math.min(baseOpacity + (level * opacityIncrement), 0.4); // Cap at 0.4
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
    // Extract the base color from the layerStyle
    const baseColor = layerStyle.bgColor;
    
    // If it's already in rgba format, modify the opacity
    if (baseColor.startsWith('rgba(')) {
      return baseColor.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, 
        (_, r, g, b) => `rgba(${r},${g},${b},${bgOpacity})`);
    }
    
    // Otherwise return the original color
    return baseColor;
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
        borderWidth: style?.borderWidth || 2, 
        borderColor: style?.borderColor || layerStyle.borderColor,
        backgroundColor: style?.backgroundColor || getBackgroundColor(),
        width: width || style?.width || 200,
        height: height || style?.height || 200,
        borderRadius: style?.borderRadius || 10,
        zIndex: getZIndex(), // Use function to calculate safe z-index
        padding: '10px',
        boxShadow: '0 0 10px rgba(0,0,0,0.05)',
      }}
      className="layer-container"
    >
      {/* Layer title */}
      <div
        className="layer-title absolute -top-6 left-4 px-3 py-1 text-xs font-semibold rounded"
        style={{
          backgroundColor: style?.backgroundColor || getBackgroundColor(),
          color: style?.color || layerStyle.color,
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