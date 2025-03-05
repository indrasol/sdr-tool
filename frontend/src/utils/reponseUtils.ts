import { Message } from '@/utils/types';
import { nodeTypesConfig } from '@/utils/nodeTypesConfig';
import { nodeDefaultStyle } from '@/components/ui/nodeStyles';

// React Flow node and edge interfaces
interface ReactFlowNode {
  id: string;
  type: string;
  data: any;
  position: { x: number; y: number };
  measured?: { width: number; height: number };
  style?: any;
}

interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  data?: any;
}

// Typing effect helper (unchanged)
export function typeMessage(
  message: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  callback: () => void = () => {}
) {
  let index = 0;
  const fullMessage = message;
  const chunkSize = 3;

  const intervalId = setInterval(() => {
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];
      const updatedMessages = [...prev.slice(0, prev.length - 1)];
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
  }, 5);
}

// Convert position with fallback
function convertPosition(position: any, index: number): { x: number; y: number } {
  if (Array.isArray(position) && position.length >= 2) {
    const x = Number(position[0]);
    const y = Number(position[1]);
    if (!isNaN(x) && !isNaN(y)) return { x, y };
  } else if (position && 'x' in position && 'y' in position) {
    const x = Number(position.x);
    const y = Number(position.y);
    if (!isNaN(x) && !isNaN(y)) return { x, y };
  }
  return {
    x: 100 + (index % 3) * 200,
    y: 100 + Math.floor(index / 3) * 150,
  };
}

// Merge nodes based on ArchitectureResponse
export function mergeNodes(currentNodes: ReactFlowNode[], response: any): ReactFlowNode[] {
  if (!response || response.response_type !== 'architecture') return currentNodes;

  const nodesMap = new Map<string, ReactFlowNode>(currentNodes.map(node => [node.id, { ...node }]));

  // Process nodes_to_add
  response.nodes_to_add?.forEach((node: any, index: number) => {
    if (!node.id) {
      console.warn('Node missing id, assigning temporary id:', node);
      node.id = `temp-node-${Date.now()}-${index}`;
    }
    if (nodesMap.has(node.id)) {
      console.warn(`Duplicate node id ${node.id}, skipping addition`);
      return;
    }
    const nodeType = node.type || 'generic';
    const nodeConfig = nodeTypesConfig[nodeType.toLowerCase()] || {};
    nodesMap.set(node.id, {
      id: node.id,
      type: 'custom',
      data: {
        label: node.name || nodeType,
        properties: node.properties || {},
        icon: nodeConfig.icon || null,
      },
      position: convertPosition(node.position || null, index),
      style: nodeDefaultStyle,
      measured: { width: 150, height: 60 },
    });
  });

  // Process nodes_to_update
  response.nodes_to_update?.forEach((partialNode: any) => {
    const node = nodesMap.get(partialNode.id);
    if (!node) {
      console.warn(`Node ${partialNode.id} not found for update, treating as add`);
      const nodeType = partialNode.type || 'generic';
      const nodeConfig = nodeTypesConfig[nodeType.toLowerCase()] || {};
      nodesMap.set(partialNode.id, {
        id: partialNode.id,
        type: 'custom',
        data: {
          label: partialNode.name || nodeType,
          properties: partialNode.properties || {},
          icon: nodeConfig.icon || null,
        },
        position: convertPosition(null, nodesMap.size),
        style: nodeDefaultStyle,
        measured: { width: 150, height: 60 },
      });
      return;
    }
    node.data = {
      ...node.data,
      label: partialNode.name || node.data.label,
      properties: partialNode.properties ? { ...node.data.properties, ...partialNode.properties } : node.data.properties,
    };
    if (partialNode.type) {
      const nodeConfig = nodeTypesConfig[partialNode.type.toLowerCase()] || {};
      node.data.icon = nodeConfig.icon || node.data.icon;
    }
  });

  // Process nodes_to_remove
  response.nodes_to_remove?.forEach((nodeId: string) => {
    if (nodesMap.has(nodeId)) {
      nodesMap.delete(nodeId);
    } else {
      console.warn(`Node ${nodeId} not found for removal`);
    }
  });

  return Array.from(nodesMap.values());
}

// Merge edges based on ArchitectureResponse
export function mergeEdges(currentEdges: ReactFlowEdge[], response: any, updatedNodes: ReactFlowNode[]): ReactFlowEdge[] {
  if (!response || response.response_type !== 'architecture') return currentEdges;

  const edgesMap = new Map<string, ReactFlowEdge>(currentEdges.map(edge => [edge.id, { ...edge }]));
  const nodeIds = new Set(updatedNodes.map(node => node.id));

  // Process edges_to_add
  response.edges_to_add?.forEach((edge: any) => {
    const edgeId = edge.id || `edge-${edge.source}-${edge.target}-${Date.now()}`;
    if (!edge.source || !edge.target) {
      console.warn('Edge missing source or target:', edge);
      return;
    }
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      console.warn(`Edge ${edgeId} references invalid nodes: ${edge.source} -> ${edge.target}`);
      return;
    }
    if (edgesMap.has(edgeId)) {
      console.warn(`Duplicate edge id ${edgeId}, skipping addition`);
      return;
    }
    edgesMap.set(edgeId, {
      id: edgeId,
      source: edge.source,
      target: edge.target,
      label: edge.label || '',
      type: 'custom',
      data: {
        edge_type: edge.type || 'default',
        properties: edge.properties || {},
      },
    });
  });

  // Process edges_to_update
  response.edges_to_update?.forEach((partialEdge: any) => {
    const edge = edgesMap.get(partialEdge.id);
    if (!edge) {
      console.warn(`Edge ${partialEdge.id} not found for update`);
      return;
    }
    edge.source = partialEdge.source || edge.source;
    edge.target = partialEdge.target || edge.target;
    edge.label = partialEdge.label ?? edge.label;
    edge.data = {
      ...edge.data,
      edge_type: partialEdge.type || edge.data.edge_type,
      properties: partialEdge.properties ? { ...edge.data.properties, ...partialEdge.properties } : edge.data.properties,
    };
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      console.warn(`Updated edge ${partialEdge.id} references invalid nodes, removing`);
      edgesMap.delete(partialEdge.id);
    }
  });

  // Process edges_to_remove
  response.edges_to_remove?.forEach((edgeId: string) => {
    if (edgesMap.has(edgeId)) {
      edgesMap.delete(edgeId);
    } else {
      console.warn(`Edge ${edgeId} not found for removal`);
    }
  });

  return Array.from(edgesMap.values());
}

// Process backend response based on response_type
export function processBackendResponse(
  data: any,
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  setNodes: React.Dispatch<React.SetStateAction<ReactFlowNode[]>>,
  setEdges: React.Dispatch<React.SetStateAction<ReactFlowEdge[]>>,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  hadFirstInteraction: boolean
) {
  console.log('Processing backend response:', data);

  // Defensive: Handle empty or invalid response
  if (!data || !data.response_type) {
    console.error('Invalid response: missing response_type');
    const errorMsg: Message = {
      id: Date.now(),
      content: 'Received an invalid response from the server. Please try again.',
      type: 'assistant',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, errorMsg]);
    return;
  }

  try {
    switch (data.response_type) {
      case 'architecture': {
        const updatedNodes = mergeNodes(nodes, data);
        const updatedEdges = mergeEdges(edges, data, updatedNodes);

        // Remove placeholder node after first interaction
        const finalNodes = hadFirstInteraction ? updatedNodes.filter(node => node.id !== '1') : updatedNodes;

        setNodes(finalNodes);
        setEdges(updatedEdges);

        let messageContent = '';
        if (data.explanation) {
          messageContent += `**Explanation**\n\n${data.explanation}\n\n`;
        }
        if (data.security_messages?.length > 0) {
          messageContent += '**Security Messages**\n\n';
          data.security_messages.forEach((msg: any) => {
            messageContent += `**${msg.severity || 'INFO'}**: ${msg.message}\n`;
            if (msg.affected_components?.length) {
              messageContent += `Affected: ${msg.affected_components.join(', ')}\n`;
            }
            if (msg.recommendation) {
              messageContent += `Recommendation: ${msg.recommendation}\n\n`;
            }
          });
        }

        if (messageContent) {
          const assistantMsg: Message = {
            id: Date.now(),
            content: '',
            type: 'assistant',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMsg]);
          typeMessage(messageContent, setMessages);
        } else if (updatedNodes.length !== nodes.length || updatedEdges.length !== edges.length) {
          const assistantMsg: Message = {
            id: Date.now(),
            content: '',
            type: 'assistant',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMsg]);
          typeMessage('I’ve updated your architecture diagram based on your request.', setMessages);
        }
        break;
      }

      case 'expert': {
        let messageContent = '';
        if (data.title) {
          messageContent += `**${data.title}**\n\n`;
        }
        messageContent += data.content || 'No expert content provided.';
        if (data.sections?.length) {
          messageContent += '\n\n**Sections**\n';
          data.sections.forEach((section: any) => {
            messageContent += `- ${Object.keys(section)[0]}: ${Object.values(section)[0]}\n`;
          });
        }
        if (data.references?.length) {
          messageContent += '\n**References**\n';
          data.references.forEach((ref: string) => messageContent += `- ${ref}\n`);
        }

        const assistantMsg: Message = {
          id: Date.now(),
          content: '',
          type: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        typeMessage(messageContent, setMessages);
        break;
      }

      case 'error': {
        const errorMsg: Message = {
          id: Date.now(),
          content: `**Error**: ${data.error_message || 'An error occurred.'}\n\n` +
            (data.details ? `Details: ${JSON.stringify(data.details, null, 2)}` : ''),
          type: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
        break;
      }

      case 'clarification': {
        let messageContent = `**Clarification Needed**: ${data.clarification_needed || 'Please provide more details.'}\n\n`;
        if (data.suggestions?.length) {
          messageContent += 'Suggestions:\n';
          data.suggestions.forEach((suggestion: string) => messageContent += `- ${suggestion}\n`);
        }
        const assistantMsg: Message = {
          id: Date.now(),
          content: '',
          type: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        typeMessage(messageContent, setMessages);
        break;
      }

      default:
        console.warn('Unknown response_type:', data.response_type);
        const unknownMsg: Message = {
          id: Date.now(),
          content: 'Received an unrecognized response type from the server. Please try again.',
          type: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, unknownMsg]);
    }
  } catch (error: any) {
    console.error('Error processing response:', error);
    const errorMsg: Message = {
      id: Date.now(),
      content: `Error processing response: ${error.message}. Please try again.`,
      type: 'assistant',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, errorMsg]);
  }
}