// Updated edge styles configuration with enhanced arrow styling and dark mode support
import { useTheme } from '@/contexts/ThemeContext';

// Create theme-aware edge styles
export const getEdgeStyles = (theme: 'light' | 'dark' = 'light') => {
  const strokeColor = theme === 'dark' ? '#e5e7eb' : '#000000'; // Light gray for dark mode, black for light mode
  
  return {
    // Default edge style (fallback)
    default: {
      stroke: strokeColor,
      strokeWidth: 2,
      markerEnd: {
        type: 'arrowclosed',
        width: 25,
        height: 25,
        color: strokeColor,
      },
    },
    
    // Data flow connections (API, services)
    dataFlow: {
      stroke: strokeColor,
      strokeWidth: 2,
      animated: true,
      markerEnd: {
        type: 'arrowclosed',
        width: 25,
        height: 25,
        color: strokeColor,
      },
    },
    
    // Network connections
    network: {
      stroke: strokeColor,
      strokeWidth: 2,
      markerEnd: {
        type: 'arrowclosed',
        width: 25, 
        height: 25,
        color: strokeColor,
      },
    },
    
    // Database connections
    database: {
      stroke: strokeColor,
      strokeWidth: 2,
      animated: true,
      markerEnd: {
        type: 'arrowclosed',
        width: 25,
        height: 25, 
        color: strokeColor,
      },
    },
    
    // Log and monitoring connections
    log: {
      stroke: strokeColor,
      strokeWidth: 2,
      strokeDasharray: '5,5',
      markerEnd: {
        type: 'arrowclosed',
        width: 25,
        height: 25,
        color: strokeColor,
      },
    },
    
    // Security-related connections
    security: {
      stroke: strokeColor,
      strokeWidth: 2,
      markerEnd: {
        type: 'arrowclosed',
        width: 25,
        height: 25,
        color: strokeColor,
      },
    },
    
    // Secure connections (SSL/TLS)
    'secure-connection': {
      stroke: strokeColor,
      strokeWidth: 2,
      markerEnd: {
        type: 'arrowclosed',
        width: 25,
        height: 25,
        color: strokeColor,
      },
    }
  };
};

// Legacy export for backward compatibility
export const edgeStyles = getEdgeStyles('light');
   
   // Helper function to determine edge type based on connected nodes
   export const getEdgeType = (sourceId: string, targetId: string): string => {
     // Check source and target node types to determine connection type
     if (sourceId.includes('database') || targetId.includes('database')) {
       return 'database';
     }
     
     if (sourceId.includes('log') || targetId.includes('log')) {
       return 'log';
     }
     
     if (sourceId.includes('security') || targetId.includes('security')) {
       return 'security';
     }
     
     if (sourceId.includes('network') || targetId.includes('network')) {
       return 'network';
     }
     
     // Default to data flow for service connections
     return 'dataFlow';
   };

// Backwards-compat alias used by legacy code (ModelWithAI v1/v2)
export const determineEdgeType = (
  sourceId: string,
  targetId: string,
  _nodes: any[] = [] // nodes parameter kept for signature compatibility, unused currently
): string => {
  return getEdgeType(sourceId, targetId);
};