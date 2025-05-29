// Updated edge styles configuration with enhanced arrow styling

export const edgeStyles = {
    // Default edge style (fallback)
    default: {
      stroke: '#000000', // Black for better visibility
      strokeWidth: 2,
      markerEnd: {
        type: 'arrowclosed',
        width: 25,
        height: 25,
        color: '#000000',
      },
    },
    
    // Data flow connections (API, services)
    dataFlow: {
      stroke: '#000000', // Black for better visibility
      strokeWidth: 2,
      animated: true,
      markerEnd: {
        type: 'arrowclosed',
        width: 25,
        height: 25,
        color: '#000000',
      },
    },
    
    // Network connections
    network: {
      stroke: '#000000', // Black for better visibility
      strokeWidth: 2,
      markerEnd: {
        type: 'arrowclosed',
        width: 25, 
        height: 25,
        color: '#000000',
      },
    },
    
    // Database connections
    database: {
      stroke: '#000000', // Black for better visibility
      strokeWidth: 2,
      animated: true,
      markerEnd: {
        type: 'arrowclosed',
        width: 25,
        height: 25, 
        color: '#000000',
      },
    },
    
    // Log and monitoring connections
    log: {
      stroke: '#000000', // Black for better visibility
      strokeWidth: 2,
      strokeDasharray: '5,5',
      markerEnd: {
        type: 'arrowclosed',
        width: 25,
        height: 25,
        color: '#000000',
      },
    },
    
    // Security-related connections
    security: {
      stroke: '#000000', // Black for better visibility
      strokeWidth: 2,
      markerEnd: {
        type: 'arrowclosed',
        width: 25,
        height: 25,
        color: '#000000',
      },
    },
    
    // Secure connections (SSL/TLS)
    'secure-connection': {
      stroke: '#000000', // Black for better visibility
      strokeWidth: 2,
      markerEnd: {
        type: 'arrowclosed',
        width: 25,
        height: 25,
        color: '#000000',
      },
    },
    
    // Vulnerable or insecure connections
    vulnerable: {
      stroke: '#000000', // Black for better visibility
      strokeWidth: 2,
      strokeDasharray: '3,3',
      markerEnd: {
        type: 'arrowclosed',
        width: 25,
        height: 25,
        color: '#000000',
      },
    }
  };
  
  // Helper function to determine edge type based on connected nodes
  export const determineEdgeType = (sourceId: string, targetId: string, nodes: any[] = []): string => {
    // Find the source and target nodes
    const sourceNode = nodes.find(n => n.id === sourceId);
    const targetNode = nodes.find(n => n.id === targetId);
    
    // Default to dataFlow if nodes not found
    if (!sourceNode || !targetNode) return 'dataFlow';
    
    // Extract node types from data
    const sourceType = (sourceNode.data?.nodeType || '').toLowerCase();
    const targetType = (targetNode.data?.nodeType || '').toLowerCase();
    
    // Database connections
    if (sourceType.includes('database') || targetType.includes('database') ||
        sourceType.includes('sql') || targetType.includes('sql') ||
        sourceType.includes('storage') || targetType.includes('storage')) {
      return 'database';
    }
    
    // Security/firewall connections
    if (sourceType.includes('security') || targetType.includes('security') ||
        sourceType.includes('firewall') || targetType.includes('firewall') ||
        sourceType.includes('waf') || targetType.includes('waf')) {
      return 'security';
    }
    
    // Monitoring/logging connections
    if (sourceType.includes('monitor') || targetType.includes('monitor') ||
        sourceType.includes('log') || targetType.includes('log')) {
      return 'log';
    }
    
    // Default to dataFlow for standard connections
    return 'dataFlow';
  };