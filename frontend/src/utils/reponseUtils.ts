
import { Message } from '@/utils/types';
import { nodeTypesConfig } from '@/utils/nodeTypesConfig';
import { nodeDefaultStyle } from '@/components/ui/nodeStyles';


// Define node type for TypeScript
interface ReactFlowNode {
  id: string;
  type: string;
  data: any;
  position: {
    x: number;
    y: number;
  };
  measured?: {
    width: number;
    height: number;
  };
  style?: any;
}

// Define edge type for TypeScript
interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  data?: any;
}

// Define backend node properties interface
interface NodeProperties {
  node_type?: string;
  properties_type?: string;
  [key: string]: any;
}

// Define backend edge properties interface
interface EdgeData {
  edge_type?: string;
  type?: string;
  label?: string;
  properties?: any;
  [key: string]: any;
}



// Define backend action interface
interface BackendAction {
  node_id?: string;
  action?: string;
  node_type?: string;
  properties?: any;
  position?: any;
  id?: string;
  source?: string;
  target?: string;
  [key: string]: any;
}

// Helper for typing effect with improved performance
export function typeMessage(
  message: string, 
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>, 
  callback: () => void = () => {}
) {
  let index = 0;
  const fullMessage = message;
  const chunkSize = 3; // Process more characters at once for better performance
  
  const intervalId = setInterval(() => {
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];
      const updatedMessages = [...prev.slice(0, prev.length - 1)];
      
      // Add next chunk of characters to message
      const newIndex = Math.min(index + chunkSize, fullMessage.length);
      const updatedContent = fullMessage.substring(0, newIndex);
      updatedMessages.push({ ...lastMessage, content: updatedContent });
      
      return updatedMessages;
    });
    
    index += chunkSize;
    if (index >= fullMessage.length) {
      clearInterval(intervalId);
      callback();
    }
  }, 5); // Speed up typing for better UX
}


// Parse expert response function - handles various response formats
export function parseExpertResponse(response: any): string {
  if (!response || !response.expert_message) {
    console.warn("Invalid expert response format", response);
    return "I received a response that I couldn't properly interpret. Please try your request again with more details.";
  }
  
  let messageContent = `**Expert Advice:**\n\n${response.expert_message}\n\n`;
  
  // Handle justification as either string or array
  if (response.justification) {
    if (Array.isArray(response.justification)) {
      messageContent += `**Justification:**\n\n${response.justification.join('\n')}\n\n`;
    } else {
      messageContent += `**Justification:**\n\n${response.justification}\n\n`;
    }
  }
  
  // Add security messages if present
  if (response.security_messages && Array.isArray(response.security_messages)) {
    messageContent += "**Security Considerations:**\n\n";
    response.security_messages.forEach(msg => {
      if (typeof msg === 'object' && msg !== null) {
        const severity = msg.severity || 'INFO';
        const message = msg.message || '';
        messageContent += `**${severity}**: ${message}\n\n`;
      } else {
        messageContent += `${msg}\n\n`;
      }
    });
  }
  
  // Add recommended next steps if present
  if (response.recommended_next_steps) {
    messageContent += "**Recommended Next Steps:**\n\n";
    if (Array.isArray(response.recommended_next_steps)) {
      response.recommended_next_steps.forEach(step => {
        messageContent += `- ${step}\n`;
      });
    } else {
      messageContent += `${response.recommended_next_steps}\n`;
    }
    messageContent += "\n";
  }
  
  // Add references if present
  if (response.references && response.references.length > 0) {
    messageContent += "**References:**\n\n";
    if (Array.isArray(response.references)) {
      response.references.forEach(ref => {
        messageContent += `- ${ref}\n`;
      });
    } else {
      messageContent += `${response.references}\n`;
    }
  }
  
  return messageContent;
}

// Normalize actions to a standard array format
function normalizeActions(backendActions: any): BackendAction[] {
  if (!backendActions) return [];
  
  // Handle array format
  if (Array.isArray(backendActions)) {
    return backendActions.filter(action => action !== null && action !== undefined);
  }
  
  // Handle object with nodes array
  if (backendActions.nodes && Array.isArray(backendActions.nodes)) {
    return backendActions.nodes.filter(node => node !== null && node !== undefined);
  }
  
  // Handle object with actions array
  if (backendActions.actions && Array.isArray(backendActions.actions)) {
    return backendActions.actions.filter(action => action !== null && action !== undefined);
  }
  
  // Handle single action object
  if (typeof backendActions === 'object') {
    return [backendActions];
  }
  
  return [];
}
// Normalize node types for consistent handling
function normalizeNodeType(nodeType: string | undefined): string {
  // Handle null or undefined node types
  if (!nodeType) return 'generic';
  
  const normalizedType = nodeType.toLowerCase().replace(/[\s_-]/g, '');
  
  // Map common variations to standard types
  const typeMap = {
    'api': 'api',
    'apigateway': 'api',
    'gateway': 'api',
    'db': 'database',
    'storage': 'storage',
    's3': 'storage',
    'bucket': 'storage',
    'function': 'server',
    'lambda': 'server',
    'compute': 'server',
    'firewall': 'lock',
    'security': 'lock',
    'users': 'users',
    'user': 'users',
    'auth': 'users',
    'network': 'network',
    'vpc': 'network',
    'subnet': 'network',
    'folder': 'folder',
    'directory': 'folder',
    'file': 'file',
    'document': 'file',
    'config': 'settings',
    'settings': 'settings',
    'code': 'code',
    'app': 'code',
    'application': 'code',
    'service': 'cloud',
    'microservice': 'cloud'
  };
  
  return typeMap[normalizedType] || normalizedType;
}
// Enhanced position handling
function convertPosition(position: any, nodeIndex: number = 0): { x: number, y: number } {
  try {
    // Handle array format [x, y]
    if (Array.isArray(position) && position.length >= 2) {
      const x = typeof position[0] === 'number' ? position[0] : parseFloat(position[0]);
      const y = typeof position[1] === 'number' ? position[1] : parseFloat(position[1]);
      
      if (!isNaN(x) && !isNaN(y)) {
        return { x, y };
      }
    }
    
    // Handle object format {x, y}
    if (position && typeof position === 'object' && 'x' in position && 'y' in position) {
      const x = typeof position.x === 'number' ? position.x : parseFloat(position.x);
      const y = typeof position.y === 'number' ? position.y : parseFloat(position.y);
      
      if (!isNaN(x) && !isNaN(y)) {
        return { x, y };
      }
    }
  } catch (error) {
    console.error("Error processing position:", error);
  }
  
  // Generate a smart default position based on node index for better layout
  // This creates a grid layout instead of stacking all nodes at the same position
  const columns = 3;
  const rowHeight = 150;
  const columnWidth = 200;
  
  return { 
    x: 100 + (nodeIndex % columns) * columnWidth, 
    y: 100 + Math.floor(nodeIndex / columns) * rowHeight 
  };
}

// Enhanced node data builder
function buildNodeData(action: BackendAction, nodeConfig: any): any {
  // Ensure properties exist
  const properties = action.properties || {};
  
  // Determine the best label for the node
  let label = '';
  if (properties.label) {
    label = properties.label;
  } else if (properties.node_type) {
    label = properties.node_type.charAt(0).toUpperCase() + properties.node_type.slice(1);
  } else if (action.node_type) {
    label = action.node_type.charAt(0).toUpperCase() + action.node_type.slice(1);
  } else if (nodeConfig.label) {
    label = nodeConfig.label;
  } else {
    label = 'Node';
  }
  
  return {
    label: label,
    icon: nodeConfig.icon || null,
    properties: {
      ...properties,
      node_type: properties.node_type || action.node_type || nodeConfig.type || 'generic'
    },
    description: properties.description || ''
  };
}

// Create a new node with consistent styling
function createNode(action: BackendAction, nodeConfig: any, nodeIndex: number): ReactFlowNode {
  
  // Create the node with consistent properties
  return {
    id: action.node_id,
    type: 'custom',
    data: buildNodeData(action, nodeConfig),
    position: convertPosition(action.position, nodeIndex),
    style: nodeDefaultStyle,
    measured: { width: 150, height: 60 }
  };
}

// Update an existing node
function updateNode(nodesMap: Map<string, ReactFlowNode>, action: BackendAction, nodeConfig: any): ReactFlowNode | undefined {
  const nodeToModify = nodesMap.get(action.node_id);
  
  if (!nodeToModify) return;
  
  // Update node properties while preserving any local state
  nodeToModify.data = {
    ...nodeToModify.data,
    ...buildNodeData(action, nodeConfig)
  };
  
  // Only update position if provided
  if (action.position) {
    nodeToModify.position = convertPosition(action.position);
  }
  
  return nodeToModify;
}

// Improved node merging with conflict resolution
export function mergeNodes(currentNodes: ReactFlowNode[], backendActions: any) {
  console.log("Current nodes BEFORE merging:", currentNodes);
  console.log("Backend actions for nodes:", backendActions);
  
  // DEFENSIVE: If we received nothing meaningful, just return current nodes
  if (!backendActions || (Array.isArray(backendActions) && backendActions.length === 0)) {
    return currentNodes;
  }
  
  // First, preserve all current nodes in a map
  const nodesMap = new Map<string, ReactFlowNode>();
  currentNodes.forEach(node => {
    if (node.id !== '1') { // Skip placeholder
      nodesMap.set(node.id, {...node}); // Clone to avoid reference issues
    }
  });
  
  // Normalize actions to an array with consistent format
  const actionsArray = normalizeActions(backendActions);
  
  // First pass: Process removes to avoid conflicts
  actionsArray.forEach((action, index) => {
    if (!action) return;
    
    // CRITICAL: If there's no node_id, generate one to avoid conflicts
    if (!action.node_id) {
      const nodeType = action.node_type || 'node';
      action.node_id = `${nodeType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      console.log(`Generated new node ID: ${action.node_id} for missing ID`);
    }
    
    if (action.action === 'remove' || action.action === 'delete') {
      nodesMap.delete(action.node_id);
    }
  });
  
  // Second pass: Process adds and modifies
  actionsArray.forEach((action, index) => {
    if (!action || !action.node_id) return;
    
    // Get appropriate node config based on normalized type
    const normalizedNodeType = normalizeNodeType(action.node_type);
    const nodeConfig = nodeTypesConfig[normalizedNodeType] || {};
    
    console.log("Processing node action:", action.action, action.node_id, normalizedNodeType);
    
    if (action.action === 'add') {
      // Handle duplicates by creating unique IDs
      if (nodesMap.has(action.node_id)) {
        console.log(`Node ID conflict: ${action.node_id} already exists`);
        // Generate a new unique ID instead of overwriting
        const newId = `${action.node_id}-${Date.now()}`;
        console.log(`Generated new node ID: ${newId} to avoid conflict`);
        
        // Clone the action to avoid modifying the original
        const newAction = {...action, node_id: newId};
        const newNode = createNode(newAction, nodeConfig, index);
        nodesMap.set(newId, newNode);
      } else {
        // Normal case - add new node with the given ID
        const newNode = createNode(action, nodeConfig, index);
        nodesMap.set(action.node_id, newNode);
      }
    } 
    else if (action.action === 'modify') {
      if (nodesMap.has(action.node_id)) {
        const updatedNode = updateNode(nodesMap, action, nodeConfig);
        if (updatedNode) {
          nodesMap.set(action.node_id, updatedNode);
        }
      } else {
        // If node doesn't exist, treat as add instead
        console.log(`Node ${action.node_id} doesn't exist but received modify - treating as add`);
        const newNode = createNode(action, nodeConfig, index);
        nodesMap.set(action.node_id, newNode);
      }
    }
    // Explicitly handle remove actions with more logging
    else if (action.action === 'remove' || action.action === 'delete') {
      const nodeId = action.node_id;
      if (nodeId && nodesMap.has(nodeId)) {
        console.log(`Removing node ${nodeId}`);
        nodesMap.delete(nodeId);
      } else {
        console.warn(`Attempted to remove node ${nodeId} but it wasn't found`);
        
        // Try to find by node_type if provided
        if (action.node_type) {
          const nodeToRemove = Array.from(nodesMap.values()).find(
            node => node.data?.properties?.node_type === action.node_type
          );
          if (nodeToRemove) {
            console.log(`Found node ${nodeToRemove.id} by type ${action.node_type}, removing it`);
            nodesMap.delete(nodeToRemove.id);
          }
        }
      }
    }
    // Handle action-less nodes as adds
    else if (!action.action) {
      if (!nodesMap.has(action.node_id)) {
        console.log(`Node with ID ${action.node_id} has no action - assuming add`);
        action.action = 'add'; // Set default action
        const newNode = createNode(action, nodeConfig, index);
        nodesMap.set(action.node_id, newNode);
      }
    }
  });
  
  const resultNodes = Array.from(nodesMap.values()).filter(node => node.id !== '1');
  console.log("Nodes AFTER merging:", resultNodes.length);
  return resultNodes;
}



// Create a new edge with consistent properties
function createEdge(source: string, target: string, label: string = '', data: EdgeData = {}, id: string | null = null) {
  const edgeId = id || `edge-${source}-${target}`;
  
  return {
    id: edgeId,
    source: source,
    target: target,
    label: label,
    type: 'custom',
    data: {
      ...data,
      edge_type: data.edge_type || 'default'
    }
  };
}
// IMPROVED: Merged edge handling for more robustness
export function mergeEdges(currentEdges: ReactFlowEdge[], backendActions: any, currentNodes?: ReactFlowNode[]) {
  console.log("Current edges before merging:", currentEdges);
  console.log("Processing edges from backend:", backendActions);
  
  // Create a map of existing edges by ID
  const edgesMap = new Map<string, ReactFlowEdge>();
  currentEdges.forEach(edge => {
    if (edge.source && edge.target) {
      edgesMap.set(edge.id, {...edge}); // Clone to avoid reference issues
    } else {
      console.warn("Skipping invalid edge with missing source or target:", edge);
    }
  });
  
  // DEFENSIVE: If we received nothing meaningful, just return current edges
  if (!backendActions) {
    return currentEdges;
  }
  
  // Track added nodes for auto-connection later
  const addedNodeIds = new Set<string>();
  const nodeTypesMap = new Map<string, string[]>();
  
  // Extract node actions to track which nodes were added
  if (backendActions.nodes && Array.isArray(backendActions.nodes)) {
    backendActions.nodes.forEach(node => {
      if (node.action === 'add' && node.node_id) {
        addedNodeIds.add(node.node_id);
        
        // Track node types for auto-connection
        const nodeType = node.node_type?.toLowerCase() || '';
        if (nodeType) {
          if (!nodeTypesMap.has(nodeType)) {
            nodeTypesMap.set(nodeType, []);
          }
          nodeTypesMap.get(nodeType)?.push(node.node_id);
        }
      }
    });
  }
  
  // Process direct edges array if it exists
  if (backendActions.edges && Array.isArray(backendActions.edges)) {
    console.log("Found direct edges array:", backendActions.edges);
    
    backendActions.edges.forEach(edge => {
      // Skip invalid edges
      if (!edge.source || !edge.target) {
        console.warn("Invalid edge - missing source or target:", edge);
        return;
      }
      
      // Create a unique ID for the edge if one doesn't exist
      const edgeId = edge.id || `edge-${edge.source}-${edge.target}`;
      
      // Create the edge in React Flow format
      const edgeData: EdgeData = {
        ...edge,
        edge_type: edge.edge_type || edge.type || 'default'
      };

      const newEdge = createEdge(
        edge.source,
        edge.target,
        edge.label || '',
        edgeData,
        edgeId
      );
      
      edgesMap.set(edgeId, newEdge);
    });
  }

  // Normalize actions to array
  const actionsArray = normalizeActions(backendActions);
  
  // Process connection actions in normalized actions
  actionsArray.forEach((action) => {
    if (!action) return;
    
    // Handle connection actions
    if (action.action === 'connect' || 
        (action.action === 'add' && 
         (action.node_type === 'connection' || action.node_type === 'edge'))) {
      
      let source = null;
      let target = null;
      
      // Try different property locations to find source and target
      if (action.properties) {
        source = action.properties.source;
        target = action.properties.target;
      }
      
      if (!source && action.source) source = action.source;
      if (!target && action.target) target = action.target;
      
      // Skip invalid connections
      if (!source || !target) {
        console.warn('Invalid connection - missing source or target:', action);
        return;
      }
      
      // Create edge ID based on connection ID or source/target
      const edgeId = action.node_id || action.id || `edge-${source}-${target}`;
      
      // Extract edge properties
      const edgeData: EdgeData = {
        type: 'default',
        edge_type: 'default',
        label: '',
        properties: {}
      };
      
      // Extract edge properties from different possible locations
      if (action.properties) {
        Object.assign(edgeData, {
          type: action.properties.edge_type || action.properties.type || 'default',
          edge_type: action.properties.edge_type || action.properties.type || 'default',
          label: action.properties.label || '',
          properties: action.properties
        });
      }
      
      // Create the edge
      const edge = createEdge(source, target, edgeData.label || '', edgeData, edgeId);
      
      console.log("Adding edge from action:", edgeId, edge.source, edge.target);
      edgesMap.set(edgeId, edge);
    }
    // Handle edge removal
    else if ((action.action === 'remove' || action.action === 'delete') && 
             (action.node_type === 'connection' || action.node_type === 'edge')) {
      const edgeId = action.node_id || action.id;
      if (edgeId) {
        console.log(`Removing edge ${edgeId}`);
        edgesMap.delete(edgeId);
      }
    }
    // Handle explicit edge modifications
    else if (action.action === 'modify' && 
             (action.node_type === 'connection' || action.node_type === 'edge')) {
      const edgeId = action.node_id || action.id;
      if (edgeId && edgesMap.has(edgeId)) {
        const edge = {...edgesMap.get(edgeId)};
        
        // Update edge properties
        if (edge.data && action.properties) {
          edge.data = {
            ...edge.data,
            ...action.properties
          };
        }
        
        // Update label if provided
        if (action.properties?.label) {
          edge.label = action.properties.label;
        }
        
        edgesMap.set(edgeId, edge);
      }
    }
    
    // Track nodes that were added
    if (action.action === 'add' && action.node_id) {
      addedNodeIds.add(action.node_id);
      
      const nodeType = action.node_type?.toLowerCase() || '';
      if (nodeType) {
        if (!nodeTypesMap.has(nodeType)) {
          nodeTypesMap.set(nodeType, []);
        }
        nodeTypesMap.get(nodeType)?.push(action.node_id);
      }
    }
  });

  // Enhanced auto-connection logic based on node types
  if (addedNodeIds.size > 0 && currentNodes && currentNodes.length > 0) {
    // Common connection patterns
    const patterns = [
      // Load balancer -> Web server
      { sourceType: 'loadbalancer', targetType: 'webserver' },
      { sourceType: 'load', targetType: 'web' },
      // Web server -> Application server
      { sourceType: 'webserver', targetType: 'applicationserver' },
      { sourceType: 'web', targetType: 'application' },
      // Application server -> Database
      { sourceType: 'applicationserver', targetType: 'database' },
      { sourceType: 'application', targetType: 'db' },
      // API Gateway -> Microservices
      { sourceType: 'apigateway', targetType: 'service' },
      { sourceType: 'api', targetType: 'microservice' },
      // User -> Web server
      { sourceType: 'client', targetType: 'web' },
      { sourceType: 'user', targetType: 'webserver' },
    ];
    
    // Find existing nodes by type
    const nodesByType = new Map<string, ReactFlowNode[]>();
    
    // Categorize existing nodes
    currentNodes.forEach(node => {
      const nodeType = ((node.data?.properties as any)?.node_type || '').toLowerCase();
      const nodeLabel = (node.data?.label || '').toLowerCase();
      
      // Add to nodesByType by explicit type
      if (nodeType) {
        if (!nodesByType.has(nodeType)) {
          nodesByType.set(nodeType, []);
        }
        nodesByType.get(nodeType)?.push(node);
      }
      
      // Also categorize by keywords in label
      if (nodeLabel.includes('web')) {
        if (!nodesByType.has('web')) {
          nodesByType.set('web', []);
        }
        nodesByType.get('web')?.push(node);
      }
      
      if (nodeLabel.includes('database') || nodeLabel.includes('db')) {
        if (!nodesByType.has('database')) {
          nodesByType.set('database', []);
        }
        nodesByType.get('database')?.push(node);
      }
      
      if (nodeLabel.includes('load')) {
        if (!nodesByType.has('load')) {
          nodesByType.set('load', []);
        }
        nodesByType.get('load')?.push(node);
      }
      
      if (nodeLabel.includes('api')) {
        if (!nodesByType.has('api')) {
          nodesByType.set('api', []);
        }
        nodesByType.get('api')?.push(node);
      }
      
      if (nodeLabel.includes('micro') || nodeLabel.includes('service')) {
        if (!nodesByType.has('service')) {
          nodesByType.set('service', []);
        }
        nodesByType.get('service')?.push(node);
      }
    });
    
    // Add newly added nodes to the nodesByType map
    nodeTypesMap.forEach((nodeIds, type) => {
      if (!nodesByType.has(type)) {
        nodesByType.set(type, []);
      }
      
      // Find the actual nodes that were added
      nodeIds.forEach(nodeId => {
        const matchingNode = currentNodes.find(node => node.id === nodeId);
        if (matchingNode) {
          nodesByType.get(type)?.push(matchingNode);
        }
      });
    });
    
    // Try to establish connections based on common patterns
    patterns.forEach(pattern => {
      const sourceNodes = nodesByType.get(pattern.sourceType) || [];
      const targetNodes = nodesByType.get(pattern.targetType) || [];
      
      sourceNodes.forEach(source => {
        // Only consider newly added nodes as sources, or if there's no existing connection
        if (addedNodeIds.has(source.id)) {
          targetNodes.forEach(target => {
            const edgeId = `edge-${source.id}-${target.id}`;
            
            // Check if this connection already exists
            if (!Array.from(edgesMap.values()).some(e => 
              (e.source === source.id && e.target === target.id) ||
              (e.source === target.id && e.target === source.id)
            )) {
              console.log(`Auto-connecting ${pattern.sourceType} (${source.id}) to ${pattern.targetType} (${target.id})`);
              const newEdge = createEdge(source.id, target.id, '', { edge_type: 'default' }, edgeId);
              edgesMap.set(edgeId, newEdge);
            }
          });
        }
      });
    });
    
    // Special case: Microservices and API Gateway
    const apiGateways = nodesByType.get('api') || [];
    const microservices = nodesByType.get('service') || [];
    
    if (apiGateways.length > 0 && microservices.length > 0) {
      // Connect all microservices to the first API gateway
      const apiGateway = apiGateways[0];
      
      microservices.forEach(service => {
        if (addedNodeIds.has(service.id)) {
          const edgeId = `edge-${apiGateway.id}-${service.id}`;
          if (!edgesMap.has(edgeId)) {
            console.log(`Auto-connecting API Gateway to Microservice: ${service.id}`);
            const newEdge = createEdge(apiGateway.id, service.id, '', { edge_type: 'default' }, edgeId);
            edgesMap.set(edgeId, newEdge);
          }
        }
      });
    }
  }

  // Filter out any edges with invalid source/target
  const resultEdges = Array.from(edgesMap.values()).filter(edge => 
    edge.source && edge.target
  );
  
  console.log("Edges AFTER merging:", resultEdges.length);
  return resultEdges;
}


  

// IMPROVED: Process backend response with better handling of different formats
export function processBackendResponse(
  data: any, 
  nodes: ReactFlowNode[], 
  edges: ReactFlowEdge[], 
  setNodes: React.Dispatch<React.SetStateAction<ReactFlowNode[]>>, 
  setEdges: React.Dispatch<React.SetStateAction<ReactFlowEdge[]>>, 
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>, 
  hadFirstInteraction: boolean
) {
  console.log("Processing backend response:", data);
  
  // DEFENSIVE: Handle empty or null response
  if (!data) {
    console.error("Received empty response from backend");

    // Add error message to chat
    const errorMsg = {
      id: Date.now(),
      content: "I received an empty response. Please try your request again.",
      type: "assistant" as const,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, errorMsg]);
    return;
  }
  
  // Check if it's an expert response (no diagram changes)
  if (data.expert_message) {
    const messageContent = parseExpertResponse(data);
    if (messageContent) {
      // Add assistant message with typing effect
      const assistantMsg = {
        id: Date.now(),
        content: '',
        type: 'assistant' as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      typeMessage(messageContent, setMessages);
    }
    return;
  }

  try {
    // CRITICAL FIX: Always start with current nodes and edges,
    // never replace them entirely
    let updatedNodes = [...nodes];
    let updatedEdges = [...edges];
    
    // Process diagram updates with nodes first
    if (data.nodes || data.actions) {
      updatedNodes = mergeNodes(nodes, data);
    }
    
    // Filter out placeholder if we've had first interaction
    if (hadFirstInteraction) {
      updatedNodes = updatedNodes.filter(node => node.id !== '1');
    }
    
    // Process edges
    if (data.edges || data.actions) {
      updatedEdges = mergeEdges(edges, data, updatedNodes);
    }
    
    // Verify that edges reference valid nodes
    updatedEdges = updatedEdges.filter(edge => {
      const sourceExists = updatedNodes.some(node => node.id === edge.source);
      const targetExists = updatedNodes.some(node => node.id === edge.target);
      
      if (!sourceExists || !targetExists) {
        console.warn(`Removing edge ${edge.id} because it references non-existent node(s)`);
        return false;
      }
      
      return true;
    });
    // Update state with the merged nodes and edges
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    
    // Prepare explanation message
    let assistantMessage = '';
    
    if (data.explanation) {
      assistantMessage += `**Explanation**\n\n${data.explanation}\n\n`;
    }
    
    if (data.security_messages && data.security_messages.length > 0) {
      assistantMessage += "**Security Messages**\n\n";
      data.security_messages.forEach(msg => {
        if (typeof msg === 'object' && msg !== null) {
          const severity = msg.severity || 'INFO';
          const message = msg.message || '';
          assistantMessage += `**${severity}**: ${message}\n\n`;
        } else {
          assistantMessage += `${msg}\n\n`;
        }
      });
    }
    
    if (data.references && data.references.length > 0) {
      assistantMessage += "**References**\n\n";
      data.references.forEach(ref => {
        assistantMessage += `- ${ref}\n`;
      });
    }
    
    // Add assistant message if we have content
    if (assistantMessage.trim()) {
      const assistantMsg = {
        id: Date.now(),
        content: '',
        type: 'assistant' as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      typeMessage(assistantMessage, setMessages);
    } else {
      // If no explanation but we made diagram changes, add a generic message
      if ((updatedNodes.length !== nodes.length) || (updatedEdges.length !== edges.length)) {
        const assistantMsg = {
          id: Date.now(),
          content: '',
          type: 'assistant' as const,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMsg]);
        typeMessage("I've updated your architecture diagram based on your request.", setMessages);
      }
    }
  } catch (error) {
    console.error("Error processing backend response:", error);
    
    // Add error message to chat
    const errorMsg = {
      id: Date.now(),
      content: `Error processing response: ${error.message}. Please try again.`,
      type: 'assistant' as const,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, errorMsg]);
  }
}