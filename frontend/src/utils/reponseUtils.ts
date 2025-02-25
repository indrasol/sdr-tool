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

// Parse expert response when no diagram changes are needed
export function parseExpertResponse(response) {
  if (response.expert_message) {
    let messageContent = `**Expert Advice:**\n\n${response.expert_message}\n\n`;
    
    if (response.justification) {
      messageContent += `**Justification:**\n\n${response.justification}`;
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

// Merge current nodes with backend actions
export function mergeNodes(currentNodes, backendActions) {
  // Create a map of existing nodes by ID for efficient lookup
  // Explicitly type the map to avoid TypeScript errors
  const nodesMap = new Map<string, ReactFlowNode>(
    currentNodes.map(n => [n.id, n as ReactFlowNode])
  );
  
  // Process each action from the backend
  backendActions.forEach((action) => {
    // Skip null or undefined actions
    if (!action) return;
    
    console.log("Processing action:", action);
    
    const normalizedNodeType = normalizeNodeType(action.node_type);
    const nodeConfig = nodeTypesConfig[normalizedNodeType] || {};
    
    switch (action.action) {
      case 'add':
        // Skip if node already exists (prevent duplicates)
        if (nodesMap.has(action.node_id)) {
          console.log(`Node ${action.node_id} already exists, updating instead`);
          // Update existing node if it already exists
          const existingNode = nodesMap.get(action.node_id);
          existingNode.data = buildNodeData(action, nodeConfig);
          existingNode.position = convertPosition(action.position);
        } else {
          // Create and add new node
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
        if (nodesMap.has(action.node_id)) {
          const nodeToModify = nodesMap.get(action.node_id);
          
          // Update node while preserving any local state not handled by backend
          nodeToModify.data = {
            ...nodeToModify.data,
            ...buildNodeData(action, nodeConfig)
          };
          
          // Only update position if provided
          if (action.position) {
            nodeToModify.position = convertPosition(action.position);
          }
        } else {
          console.warn(`Tried to modify non-existent node: ${action.node_id}`);
        }
        break;
        
      case 'remove':
      case 'delete':
        nodesMap.delete(action.node_id);
        break;
    }
  });
  
  return Array.from(nodesMap.values()).filter(node => node.id !== '1');
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

// Fixes to properly handle edges from backend responses
export function mergeEdges(currentEdges, backendActions) {
  // Create a map of existing edges by ID with explicit typing
  const edgesMap = new Map<string, ReactFlowEdge>(
    currentEdges.map(e => [e.id, e as ReactFlowEdge])
  );
  
  console.log("Processing edges from actions:", backendActions);
  
  // First, check if there are direct edges in the response and process them
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
      
      console.log("Adding edge:", edgeId, edge);
      
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
    
    // Return early if we've processed direct edges
    return Array.from(edgesMap.values());
  }
  
  // If no direct edges, continue with processing actions
  // First pass: process edge additions and modifications
  backendActions.forEach((action) => {
    // Skip null or undefined actions
    if (!action) return;
    
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
  
  return Array.from(edgesMap.values());
}
  

// Handles both architecture and expert responses
export function processBackendResponse(data, nodes, edges, setNodes, setEdges, setMessages, hadFirstInteraction) {
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
  
  // Process diagram updates with nodes first
  if (data.nodes) {
    console.log("Merging nodes from response:", data.nodes);
    const mergedNodes = mergeNodes(nodes, data.nodes);
    // Filter out placeholder if we've had first interaction
    if (hadFirstInteraction) {
      setNodes(mergedNodes.filter(node => node.id !== '1'));
    } else {
      setNodes(mergedNodes.filter(node => node.id !== '1'));
    }
  } else if (data.actions) {
    console.log("Merging nodes from actions:", data.actions);
    const mergedNodes = mergeNodes(nodes, data.actions);
    setNodes(mergedNodes.filter(node => node.id !== '1'));
  }
  
  // Process edges separately
  if (data.edges && Array.isArray(data.edges)) {
    console.log("Processing direct edges array:", data.edges);
    // Get existing edge IDs for comparison
    const existingEdgeIds = new Set(edges.map(e => e.id));
    
    // Create new edges in React Flow format
    const newEdges = data.edges.map(edge => {
      const id = edge.id || `edge-${edge.source}-${edge.target}`;
      return {
        id,
        source: edge.source,
        target: edge.target,
        type: 'custom', // Use our custom edge type
        label: edge.label || '',
        data: {
          ...edge,
          edge_type: edge.edge_type || 'default'
        }
      };
    });
    
    // Keep existing edges and add new ones
    const updatedEdges = [
      ...edges.filter(e => !newEdges.some(ne => ne.id === e.id)),
      ...newEdges
    ];
    
    console.log("Setting edges to:", updatedEdges);
    setEdges(updatedEdges);
  } else if (data.actions) {
    // Use the updated mergeEdges function for actions
    console.log("Merging edges from actions:", data.actions);
    const updatedEdges = mergeEdges(edges, data.actions);
    // Special case: if the response has both 'actions' and 'edges' properties
    if (data.edges && Array.isArray(data.edges)) {
      console.log("Also processing edges array within actions:", data.edges);
      const withDirectEdges = mergeEdges(updatedEdges, { edges: data.edges });
      setEdges(withDirectEdges);
    } else {
      setEdges(updatedEdges);
    }
  }
  
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