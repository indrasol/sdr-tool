import DOMPurify from 'dompurify';
import { Message } from '@/utils/types';
import { nodeTypesConfig } from '@/utils/nodeTypesConfig';


// ADD THESE near top of file:
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

// Helper for typing effect
export function typeMessage(message, setMessages, callback = () => {}) {
  let index = 0;
  const fullMessage = message;
  
  const intervalId = setInterval(() => {
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];
      const updatedMessages = [...prev.slice(0, prev.length - 1)];
      
      // Add next character to message
      const updatedContent = fullMessage.substring(0, index);
      updatedMessages.push({ ...lastMessage, content: updatedContent });
      
      return updatedMessages;
    });
    
    index++;
    if (index > fullMessage.length) {
      clearInterval(intervalId);
      callback();
    }
  }, 5); // Speed up typing for better UX
}

// Update the parseExpertResponse function to handle both array and string justifications
export function parseExpertResponse(response) {
  if (response.expert_message) {
    let messageContent = `**Expert Advice:**\n\n${response.expert_message}\n\n`;
    
    if (response.justification) {
      // Handle justification as either string or array
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
  return null;
}

// Normalize node types for consistent handling
function normalizeNodeType(nodeType) {
  // Handle null or undefined node types
  if (!nodeType) return 'generic';
  return nodeType.toLowerCase().replace(/[\s_-]/g, '');
}

// Convert backend position format to React Flow format
function convertPosition(position) {
  // Check if position is an array [x, y]
  if (Array.isArray(position) && position.length >= 2) {
    return { x: position[0], y: position[1] };
  }
  
  // If position is already an object with x,y
  if (position && typeof position === 'object' && 'x' in position && 'y' in position) {
    return position;
  }
  
  // Fallback position (centered in viewport)
  return { x: 500, y: 200 };
}

// Build node properties from backend data
function buildNodeData(action, nodeConfig) {
  // Ensure properties exist
  const properties = action.properties || {};
  
  return {
    label: properties.node_type || action.node_type || nodeConfig.label || 'Node',
    icon: nodeConfig.icon || null,
    properties: properties, // Store full properties for reference
    description: properties.description || ''
  };
}


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
}


export function mergeNodes(currentNodes, backendActions) {
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
  
  // Normalize backendActions to an array no matter what format it comes in
  let actionsArray = [];
  if (Array.isArray(backendActions)) {
    actionsArray = backendActions;
  } else if (backendActions.nodes && Array.isArray(backendActions.nodes)) {
    actionsArray = backendActions.nodes;
  } else if (backendActions.actions && Array.isArray(backendActions.actions)) {
    actionsArray = backendActions.actions;
  } else if (typeof backendActions === 'object') {
    actionsArray = [backendActions]; // Single action
  }
  
  // Track which node types we see to detect potential replacements
  const nodeTypesAdded = new Set();
  
  // Process each action from the backend
  actionsArray.forEach((action) => {
    // Skip null or undefined actions
    if (!action) return;
    
    console.log("Processing node action:", action);
    
    // CRITICAL: If there's no node_id, generate one to avoid conflicts with existing nodes
    if (!action.node_id) {
      const nodeType = action.node_type || 'node';
      action.node_id = `${nodeType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      console.log(`Generated new node ID: ${action.node_id} for missing ID`);
    }
    
    // Track this node type to detect potential replacements
    const normalizedNodeType = normalizeNodeType(action.node_type);
    nodeTypesAdded.add(normalizedNodeType);
    
    const nodeConfig = nodeTypesConfig[normalizedNodeType] || {};
    
    // Handle different action types
    switch (action.action) {
      case 'add':
        // CRITICAL FIX: Check if we're trying to add a node that would overwrite an existing one
        // with the same ID (might happen if backend reuses IDs)
        if (nodesMap.has(action.node_id)) {
          console.log(`Node ID conflict: ${action.node_id} already exists`);
          // Generate a new unique ID instead of overwriting
          const newId = `${action.node_id}-${Date.now()}`;
          console.log(`Generated new node ID: ${newId} to avoid conflict`);
          
          // Create and add new node with the new ID
          const newNode = {
            id: newId,
            type: 'custom', // Using custom node type for consistent rendering
            data: buildNodeData(action, nodeConfig),
            position: convertPosition(action.position),
            measured: { width: 150, height: 60 }
          };
          nodesMap.set(newId, newNode);
        } else {
          // Normal case - add new node with the given ID
          const newNode = {
            id: action.node_id,
            type: 'custom', // Using custom node type for consistent rendering
            data: buildNodeData(action, nodeConfig),
            position: convertPosition(action.position),
            measured: { width: 150, height: 60 }
          };
          nodesMap.set(action.node_id, newNode);
        }
        break;
        
      case 'modify':
        // Only modify if the node exists - don't create new nodes with modify actions
        if (nodesMap.has(action.node_id)) {
          const nodeToModify = nodesMap.get(action.node_id);
          
          // Update node properties while preserving any local state
          nodeToModify.data = {
            ...nodeToModify.data,
            ...buildNodeData(action, nodeConfig)
          };
          
          // Only update position if provided
          if (action.position) {
            nodeToModify.position = convertPosition(action.position);
          }
          
          nodesMap.set(action.node_id, nodeToModify);
        } else {
          // DEFENSIVE: If backend is trying to "modify" a node that doesn't exist,
          // treat it as an "add" instead (this could be the source of the problem)
          console.warn(`Backend tried to modify non-existent node: ${action.node_id} - treating as add`);
          
          const newNode = {
            id: action.node_id,
            type: 'custom',
            data: buildNodeData(action, nodeConfig),
            position: convertPosition(action.position),
            measured: { width: 150, height: 60 }
          };
          nodesMap.set(action.node_id, newNode);
        }
        break;
        
      case 'remove':
      case 'delete':
        nodesMap.delete(action.node_id);
        break;
        
      // DEFENSIVE: If no action specified, assume it's an add
      default:
        if (!nodesMap.has(action.node_id)) {
          console.log(`Node with ID ${action.node_id} and no action specified - assuming add`);
          const newNode = {
            id: action.node_id,
            type: 'custom',
            data: buildNodeData(action, nodeConfig),
            position: convertPosition(action.position),
            measured: { width: 150, height: 60 }
          };
          nodesMap.set(action.node_id, newNode);
        }
        break;
    }
  });
  
  const resultNodes = Array.from(nodesMap.values()).filter(node => node.id !== '1');
  console.log("Nodes AFTER merging:", resultNodes);
  return resultNodes;
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

// IMPROVED: Merged edge handling for more robustness
export function mergeEdges(currentEdges, backendActions) {
  console.log("Current edges before merging:", currentEdges);
  console.log("Processing edges from backend:", backendActions);
  
  // Create a map of existing edges by ID
  const edgesMap = new Map<string, ReactFlowEdge>();
  currentEdges.forEach(edge => {
    edgesMap.set(edge.id, {...edge}); // Clone to avoid reference issues
  });
  
  // DEFENSIVE: If we received nothing meaningful, just return current edges
  if (!backendActions) {
    return currentEdges;
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
      
      console.log("Adding/updating edge:", edgeId, edge);
      
      // Create the edge in React Flow format
      const newEdge: ReactFlowEdge = {
        id: edgeId,
        source: edge.source,
        target: edge.target,
        label: edge.label || '',
        type: 'custom', // Use custom edge type
        data: { 
          ...edge,
          edge_type: edge.edge_type || 'default',
        }
      };
      
      edgesMap.set(edgeId, newEdge);
    });
  }
  
  // Normalize actions to array
  let actionsArray = [];
  if (Array.isArray(backendActions)) {
    actionsArray = backendActions;
  } else if (backendActions.actions && Array.isArray(backendActions.actions)) {
    actionsArray = backendActions.actions;
  } else if (typeof backendActions === 'object' && !backendActions.edges) {
    actionsArray = [backendActions]; // Single action
  }
  
  // Process edge actions
  actionsArray.forEach((action) => {
    if (!action) return;
    
    console.log("Processing edge action:", action);
    
    // Handle connection actions
    if (action.action === 'connect' || 
        (action.action === 'add' && action.node_type === 'connection')) {
      const source = action.properties?.source;
      const target = action.properties?.target;
      
      // Skip invalid connections
      if (!source || !target) {
        console.warn('Invalid connection - missing source or target:', action);
        return;
      }
      
      // Create edge ID based on connection ID or source/target
      const edgeId = action.node_id || `edge-${source}-${target}`;
      
      const edgeData = {
        type: action.properties?.edge_type || 'default',
        label: action.properties?.label || '',
        properties: action.properties || {}
      };
      
      // Create or update edge
      const edge: ReactFlowEdge = {
        id: edgeId,
        source: source,
        target: target,
        label: edgeData.label,
        type: 'custom', // Use our custom edge type
        data: edgeData
      };
      
      console.log("Adding edge from action:", edgeId, edge);
      edgesMap.set(edgeId, edge);
    }
    // Handle edge removal
    else if ((action.action === 'remove' || action.action === 'delete') && 
             (action.node_type === 'connection' || action.node_type === 'edge')) {
      edgesMap.delete(action.node_id);
    }
    // Handle explicit edge modifications
    else if (action.action === 'modify' && 
             (action.node_type === 'connection' || action.node_type === 'edge')) {
      if (edgesMap.has(action.node_id)) {
        const edge = edgesMap.get(action.node_id) as ReactFlowEdge;
        
        // Update edge properties
        edge.data = {
          ...edge.data,
          ...action.properties
        };
        
        // Update label if provided
        if (action.properties?.label) {
          edge.label = action.properties.label;
        }
        
        edgesMap.set(action.node_id, edge);
      }
    }
  });
  
  const resultEdges = Array.from(edgesMap.values());
  console.log("Edges AFTER merging:", resultEdges);
  return resultEdges;
}

  

// IMPROVED: Process backend response with better handling of different formats
export function processBackendResponse(data, nodes, edges, setNodes, setEdges, setMessages, hadFirstInteraction) {
  console.log("Processing backend response:", data);
  
  // Check if it's an expert response (no diagram changes)
  if (data.expert_message) {
    const messageContent = parseExpertResponse(data);
    if (messageContent) {
      // Add assistant message with typing effect
      const assistantMsg = {
        id: Date.now(),
        content: '',
        type: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      typeMessage(messageContent, setMessages);
    }
    return;
  }
  
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
    updatedEdges = mergeEdges(edges, data);
  }
  
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
      type: 'assistant',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, assistantMsg]);
    typeMessage(assistantMessage, setMessages);
  }
}