// Data validation utility for diagram nodes and state
interface NodeValidationResult {
  isValid: boolean;
  errors: string[];
  cleanedNode?: any;
}

export const validateNodeData = (node: any): NodeValidationResult => {
  const errors: string[] = [];
  
  // Check required fields
  if (!node.id) {
    errors.push('Missing node ID');
  }
  
  if (!node.data) {
    errors.push('Missing node data');
  }
  
  // Validate label
  if (node.data?.label) {
    if (typeof node.data.label !== 'string') {
      errors.push('Label must be a string');
    } else if (node.data.label.length > 100) {
      errors.push('Label too long (likely corrupted)');
    } else if (node.data.label.includes('data:image') || node.data.label.includes('base64')) {
      errors.push('Label contains encoded data (corrupted)');
    }
  }
  
  // Validate position
  if (node.position && (typeof node.position.x !== 'number' || typeof node.position.y !== 'number')) {
    errors.push('Invalid position coordinates');
  }
  
  // Create cleaned node if there are fixable issues
  const cleanedNode = {
    ...node,
    position: node.position || { x: 0, y: 0 },
    data: {
      ...node.data,
      label: typeof node.data?.label === 'string' && node.data.label.length < 100 && !node.data.label.includes('data:image')
        ? node.data.label 
        : node.id || 'Node',
      nodeType: node.data?.nodeType || 'default',
      description: typeof node.data?.description === 'string' ? node.data.description.slice(0, 500) : '',
      validated: true
    }
  };
  
  return {
    isValid: errors.length === 0,
    errors,
    cleanedNode
  };
};

export const validateEdgeData = (edge: any, nodeIds: Set<string>): boolean => {
  if (!edge.id || !edge.source || !edge.target) {
    return false;
  }
  
  // Check if source and target nodes exist
  if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
    return false;
  }
  
  return true;
};

export const validateDiagramState = (state: any): any => {
  console.log('Validating diagram state...');
  
  if (!state || typeof state !== 'object') {
    console.warn('Invalid diagram state structure');
    return { nodes: [], edges: [] };
  }
  
  const rawNodes = Array.isArray(state.nodes) ? state.nodes : [];
  const rawEdges = Array.isArray(state.edges) ? state.edges : [];
  
  // Validate and clean nodes
  const validatedNodes = rawNodes.map(node => {
    if (!node) return null;
    
    const validation = validateNodeData(node);
    if (!validation.isValid) {
      console.warn(`Node ${node.id} validation issues:`, validation.errors);
      return validation.cleanedNode;
    }
    return node;
  }).filter(Boolean);
  
  // Create set of valid node IDs for edge validation
  const validNodeIds = new Set<string>();
  validatedNodes.forEach(node => {
    if (node && node.id) {
      validNodeIds.add(String(node.id));
    }
  });
  
  // Validate and clean edges – also strip invalid handle IDs
  const validatedEdges = rawEdges.reduce((acc: any[], edge: any) => {
    if (!edge) return acc;

    // Clean up handle IDs: convert null/"null"/"undefined" to undefined
    const cleanedEdge = { ...edge };
    if (cleanedEdge.sourceHandle === null || cleanedEdge.sourceHandle === 'null' || cleanedEdge.sourceHandle === 'undefined') {
      delete cleanedEdge.sourceHandle;
    }
    if (cleanedEdge.targetHandle === null || cleanedEdge.targetHandle === 'null' || cleanedEdge.targetHandle === 'undefined') {
      delete cleanedEdge.targetHandle;
    }

    // -------------------------------------------------------------
    // NEW: Provide default handle IDs so edges always attach even if
    // the backend omitted them. These match the ids defined in
    // CustomNode (source: "right", target: "left").
    // -------------------------------------------------------------
    if (!cleanedEdge.sourceHandle) {
      cleanedEdge.sourceHandle = 'right';
    }
    if (!cleanedEdge.targetHandle) {
      cleanedEdge.targetHandle = 'left';
    }

    const isValid = validateEdgeData(cleanedEdge, validNodeIds);
    if (!isValid) {
      console.warn(`Removing invalid edge: ${edge.id || 'unnamed'}`);
      return acc;
    }

    acc.push(cleanedEdge);
    return acc;
  }, []);
  
  console.log(`Validated ${validatedNodes.length} nodes and ${validatedEdges.length} edges`);
  
  return {
    nodes: validatedNodes,
    edges: validatedEdges
  };
};

export const sanitizeNodeLabel = (label: string | undefined, fallback: string = 'Node'): string => {
  if (!label || typeof label !== 'string') {
    return fallback;
  }
  
  // Remove any potential base64 or encoded data
  if (label.includes('data:image') || label.includes('base64') || label.length > 100) {
    return fallback;
  }
  
  // Clean and trim the label
  return label.trim() || fallback;
};

export const isCorruptedData = (data: any): boolean => {
  if (!data || typeof data !== 'object') return true;
  
  const label = data.label;
  if (!label || typeof label !== 'string') return false;
  
  // Check for signs of corruption
  return (
    label.length > 100 ||
    label.includes('data:image') ||
    label.includes('base64') ||
    /^[A-Za-z0-9+/]{50,}={0,2}$/.test(label) // base64 pattern
  );
}; 