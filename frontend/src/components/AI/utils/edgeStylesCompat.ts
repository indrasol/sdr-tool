/**
 * Compatibility layer for the old edgeStyles API
 * This file provides backward compatibility for code that still uses the old edgeStyles export
 */

import { getEdgeStyle, getEdgeType } from './edgeStyles';

// Create a compatibility proxy that maps old style property access to new function calls
const createEdgeStylesCompat = () => {
  // Default edge styles for backward compatibility
  const defaultStyles = {
    default: {
      stroke: '#555',
      strokeWidth: 2,
      animated: false,
    },
    dataFlow: {
      stroke: '#0096fb',
      strokeWidth: 3,
      animated: true,
    },
    database: {
      stroke: '#6a4c93',
      strokeWidth: 2.5,
      animated: true,
    },
    network: {
      stroke: '#6c757d',
      strokeWidth: 2.5,
      animated: false,
    },
    security: {
      stroke: '#ff6b6b',
      strokeWidth: 2.5,
      animated: false,
    },
    log: {
      stroke: '#555',
      strokeWidth: 2,
      strokeDasharray: '5,5',
    },
    'secure-connection': {
      stroke: '#34A853',
      strokeWidth: 2,
    },
    vulnerable: {
      stroke: '#DC3545',
      strokeWidth: 2.5,
      strokeDasharray: '5,2',
    },
  };

  // Create a proxy that maps old property access to the new getEdgeStyle function
  return new Proxy(defaultStyles, {
    get: (target, prop) => {
      if (prop in target) {
        // For common properties, return the pre-defined style
        return target[prop];
      }
      
      // For unknown properties, try to get a style based on the property name
      const style = getEdgeStyle(String(prop), 'default');
      return {
        stroke: style.style.stroke,
        strokeWidth: style.style.strokeWidth,
      };
    }
  });
};

// Legacy edge type determination function for backward compatibility
export const determineEdgeType = (sourceId: string, targetId: string, nodes: any[] = []) => {
  // Find the source and target nodes
  const sourceNode = nodes.find(n => n.id === sourceId);
  const targetNode = nodes.find(n => n.id === targetId);
  
  // If either node is missing, default to 'default'
  if (!sourceNode || !targetNode) {
    return 'default';
  }
  
  // Extract node types, defaulting to empty string if not present
  const sourceType = ((sourceNode.data?.nodeType || sourceNode.type || '') as string).toLowerCase();
  const targetType = ((targetNode.data?.nodeType || targetNode.type || '') as string).toLowerCase();
  
  // Use the new getEdgeType function
  return getEdgeType(sourceType, targetType);
};

// Export the compatibility object
export const edgeStyles = createEdgeStylesCompat(); 