// Simplified and improved edge styles configuration
// This should replace your current edgeStyles.js file

export const edgeStyles = {
  // Default edge style (fallback)
  default: {
    stroke: '#cccccc', /* Light gray */
    strokeWidth: 1,
  },
  
  // Data flow connections (API, services)
  dataFlow: {
    stroke: '#cccccc', /* Light gray */
    strokeWidth: 1,
  },
  
  // Network connections
  network: {
    stroke: '#cccccc', /* Light gray */
    strokeWidth: 1,
  },
  
  // Database connections
  database: {
    stroke: '#cccccc', /* Light gray */
    strokeWidth: 1,
  },
  
  // Log and monitoring connections
  log: {
    stroke: '#cccccc', /* Light gray */
    strokeWidth: 1,
    /* Removed strokeDasharray */
  },
  
  // Security-related connections
  security: {
    stroke: '#cccccc', /* Light gray */
    strokeWidth: 1,
  },
  
  // Secure connections (SSL/TLS)
  'secure-connection': {
    stroke: '#cccccc', /* Light gray */
    strokeWidth: 1,
  },
  
  // Vulnerable or insecure connections
  vulnerable: {
    stroke: '#cccccc', /* Light gray */
    strokeWidth: 1,
    /* Removed strokeDasharray */
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