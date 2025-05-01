// Simplified and improved edge styles configuration
// This should replace your current edgeStyles.js file

export const edgeStyles = {
    // Default edge style (fallback)
    default: {
      stroke: '#999999',
      strokeWidth: 1.5,
    },
    
    // Data flow connections (API, services)
    dataFlow: {
      stroke: '#AAAAAA',
      strokeWidth: 1.5,
    },
    
    // Network connections
    network: {
      stroke: '#B0B0B0',
      strokeWidth: 1.5,
    },
    
    // Database connections
    database: {
      stroke: '#A5A5A5',
      strokeWidth: 1.5,
      animated: true,
    },
    
    // Log and monitoring connections
    log: {
      stroke: '#ACACAC',
      strokeWidth: 1.5,
      strokeDasharray: '5,5',
    },
    
    // Security-related connections
    security: {
      stroke: '#989898',
      strokeWidth: 1.5,
    },
    
    // Secure connections (SSL/TLS)
    'secure-connection': {
      stroke: '#A0A0A0',
      strokeWidth: 1.5,
    },
    
    // Vulnerable or insecure connections
    vulnerable: {
      stroke: '#B8B8B8',
      strokeWidth: 1.5,
      strokeDasharray: '3,3',
    }
  };
  
  // Centralized function to determine edge type based on connected nodes
  export const determineEdgeType = (sourceId, targetId, nodes = []) => {
    // Find the source and target nodes
    const sourceNode = nodes.find(n => n.id === sourceId);
    const targetNode = nodes.find(n => n.id === targetId);
    
    // If either node is missing, default to 'dataFlow'
    if (!sourceNode || !targetNode) {
      return 'dataFlow';
    }
    
    // Extract node types, defaulting to empty string if not present
    const sourceType = (sourceNode.data?.nodeType || sourceNode.type || '').toLowerCase();
    const targetType = (targetNode.data?.nodeType || targetNode.type || '').toLowerCase();
    
    // Combined type string for easier checking
    const combinedType = `${sourceType} ${targetType}`;
    
    // Security-related connections
    if (combinedType.includes('security') || 
        combinedType.includes('iam') || 
        combinedType.includes('auth') || 
        combinedType.includes('firewall') || 
        combinedType.includes('waf')) {
      return 'security';
    }
    
    // Database connections
    if (combinedType.includes('database') || 
        combinedType.includes('db') || 
        combinedType.includes('rds') || 
        combinedType.includes('sql')) {
      return 'database';
    }
    
    // API and data flow connections
    if (combinedType.includes('api') || 
        combinedType.includes('lambda') || 
        combinedType.includes('function') || 
        combinedType.includes('gateway')) {
      return 'dataFlow';
    }
    
    // Network connections
    if (combinedType.includes('network') || 
        combinedType.includes('cdn') || 
        combinedType.includes('dns') || 
        combinedType.includes('vpc')) {
      return 'network';
    }
    
    // Log connections
    if (combinedType.includes('log') || 
        combinedType.includes('monitor') || 
        combinedType.includes('trace')) {
      return 'log';
    }
    
    // Secure connections
    if (combinedType.includes('ssl') || 
        combinedType.includes('tls') || 
        combinedType.includes('https')) {
      return 'secure-connection';
    }
    
    // Vulnerable connections
    if (combinedType.includes('vulnerable') || 
        combinedType.includes('insecure')) {
      return 'vulnerable';
    }
    
    // Default case
    return 'dataFlow';
  };