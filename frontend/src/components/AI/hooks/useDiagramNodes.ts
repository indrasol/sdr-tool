import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addEdge, MarkerType, Node, Edge, XYPosition } from '@xyflow/react';
import { getNodeShapeStyle, nodeDefaults } from '../utils/nodeStyles';
import { edgeStyles } from '../utils/edgeStyles';
import { mapNodeTypeToIcon } from '../utils/mapNodeTypeToIcon';
import RemoteSvgIcon from '../icons/RemoteSvgIcon';
import { CustomNodeData } from '../types/diagramTypes';


const determineEdgeType = (sourceId, targetId, nodes: Node[] = []) => {
  // Find the source and target nodes
  const sourceNode = nodes.find(n => n.id === sourceId);
  const targetNode = nodes.find(n => n.id === targetId);
  
  // If either node is missing, default to 'dataFlow'
  if (!sourceNode || !targetNode) {
    return 'dataFlow';
  }
  
  // Extract node types, defaulting to empty string if not present
  const sourceType = ((sourceNode.data?.nodeType || sourceNode.type || '') as string).toLowerCase();
  const targetType = ((targetNode.data?.nodeType || targetNode.type || '') as string).toLowerCase();
  
  // Create arrays of type keywords for easier checking
  const sourceTypeKeywords = sourceType.split(/[-_\s]+/);
  const targetTypeKeywords = targetType.split(/[-_\s]+/);
  
  // Helper function to check if any keyword is present in a node type
  const hasKeyword = (keywords, typeStr) => {
    return keywords.some(keyword => 
      typeStr.includes(keyword) || 
      sourceTypeKeywords.includes(keyword) || 
      targetTypeKeywords.includes(keyword)
    );
  };
  
  // Security-related connections
  if (hasKeyword(['security', 'iam', 'auth', 'firewall', 'waf', 'shield'], sourceType + targetType)) {
    return 'security';
  }
  
  // Database connections
  if (hasKeyword(['database', 'db', 'rds', 'sql', 'nosql', 'dynamo', 'mongo'], sourceType + targetType)) {
    return 'database';
  }
  
  // API and data flow connections
  if (hasKeyword(['api', 'gateway', 'lambda', 'function', 'serverless'], sourceType + targetType) ||
      sourceType.includes('api') || targetType.includes('api') ||
      sourceType === 'api gateway' || targetType === 'api gateway') {
    return 'dataFlow';
  }
  
  // Network connections
  if (hasKeyword(['network', 'cdn', 'cloudfront', 'route53', 'dns', 'vpc', 'subnet'], sourceType + targetType)) {
    return 'network';
  }
  
  // Log and monitoring connections
  if (hasKeyword(['log', 'monitor', 'cloudwatch', 'trace', 'metric'], sourceType + targetType)) {
    return 'log';
  }
  
  // Secure connections (SSL/TLS)
  if (hasKeyword(['ssl', 'tls', 'https', 'secure', 'encryption'], sourceType + targetType)) {
    return 'secure-connection';
  }
  
  // Vulnerable or insecure connections
  if (hasKeyword(['vulnerable', 'insecure', 'exploit', 'risk'], sourceType + targetType)) {
    return 'vulnerable';
  }
  
  // Default case - when no specific type is determined
  return 'dataFlow';
};

export function useDiagramNodes(
  initialNodes: Node<CustomNodeData>[] = [],
  initialEdges: Edge[] = [],
  externalSetNodes = null,
  externalSetEdges = null,
  externalOnLayout: (() => void) | null = null
) {
  const { toast } = useToast();
  const [editNodeDialogOpen, setEditNodeDialogOpen] = useState(false);
  const [currentEditNode, setCurrentEditNode] = useState(null);

  // Handle editing a node
  const handleEditNode = useCallback((id, label) => {
    // Find the node from initialNodes
    const targetNode = initialNodes.find(node => node.id === id);
    
    if (targetNode) {
      setCurrentEditNode({
        id,
        label: targetNode.data?.label || '',
        description: targetNode.data?.description || ''
      });
      setEditNodeDialogOpen(true);
    } else {
      console.warn(`Node with id ${id} not found for editing`);
    }
  }, [initialNodes]);

  // Handle deleting a node
  const handleDeleteNode = useCallback((id) => {
    if (!externalSetNodes || !externalSetEdges) {
      console.warn("External setters not available for handleDeleteNode");
      return;
    }
    
    // Find the node to be deleted to show its name in the toast
    const nodeToDelete = initialNodes.find(node => node.id === id);
    
    // Remove the node
    externalSetNodes(nds => nds.filter(node => node.id !== id));
    
    // Remove any edges connected to this node
    externalSetEdges(eds => eds.filter(edge => edge.source !== id && edge.target !== id));
    
    // Show a toast notification
    if (nodeToDelete) {
      const nodeLabel = nodeToDelete.data?.label || 'Unnamed node';
        
      toast({
        title: "Node Deleted",
        description: `Node "${nodeLabel}" has been removed`
      });
    }
  }, [initialNodes, externalSetNodes, externalSetEdges, toast]);

  // Apply style defaults to all nodes and add callbacks
  const prepareNodes = useCallback((nodes: Node<CustomNodeData>[], edges: Edge[] = []): Node<CustomNodeData>[] => {
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return [];
    }
    
    // Create sets for quick lookup of connected node IDs
    const sourceIds = new Set(edges.map(edge => edge.source));
    const targetIds = new Set(edges.map(edge => edge.target));
    
    return nodes.map(node => {
      if (!node) {
        return null;
      }
      
      // Special case: Preserve sticky notes and comment nodes
      if (
        node.type === 'comment' || 
        node.data?.nodeType === 'stickyNote' || 
        node.data?.isComment === true ||
        node.data?.preserveType === 'comment'
      ) {
        // Return sticky notes as-is with minimal modifications to preserve their nature
        const stickyNoteNode = {
          ...node,
          // Ensure type is kept as 'comment'
          type: 'comment',
          // Ensure these properties are preserved
          connectable: false,
          data: {
            ...node.data,
            // Ensure these critical properties are always present
            nodeType: node.data?.nodeType || 'stickyNote',
            isComment: true,
            excludeFromLayers: true,
            // Add handlers only if they don't exist
            onEdit: node.data?.onEdit || handleEditNode,
            onDelete: node.data?.onDelete || handleDeleteNode,
          }
        };
        return stickyNoteNode as Node<CustomNodeData>;
      }
      
      // Regular node processing
      // Extract node type and ensure it exists
      const nodeType = (node.data?.nodeType || node.type || 'default') as string;
      
      // Check if this is a client node 
      const isClientNode = () => {
        const nodeTypeStr = nodeType.toLowerCase();
        const section = nodeTypeStr.split('_')[0];
        
        return section === 'client' || 
              nodeTypeStr.startsWith('client_') ||
              nodeTypeStr.includes('client') || 
              nodeTypeStr.includes('mobile_app') ||
              nodeTypeStr.includes('browser') ||
              nodeTypeStr.includes('desktop_app') ||
              nodeTypeStr.includes('iot_device') ||
              nodeTypeStr.includes('kiosk') ||
              nodeTypeStr.includes('user_');
      };
      
      // Check if the node already has an iconRenderer from toolbar
      const existingIconRenderer = node.data?.iconRenderer;
      
      let iconRenderer = existingIconRenderer;
      
      // If no existing iconRenderer, try to create one from the nodeType
      if (!existingIconRenderer) {
        // Get icon URL based on node type
        const iconUrl = mapNodeTypeToIcon(nodeType);
        
        // Extract section from node type (e.g., 'network' from 'network_internet')
        const [section = '', component = ''] = nodeType.split('_');
        
        // Check if this is a microservice or application type node
        const isMicroserviceNode = nodeType.includes('microservice') || component === 'microservice';
        
        // Create iconRenderer if we have an icon URL
        if (iconUrl) {
          iconRenderer = () => ({
            component: RemoteSvgIcon,
            props: { 
              url: iconUrl, 
              size: 48,
              className: `${section}-icon${isMicroserviceNode ? ' microservice-icon' : ''} node-icon-container`
            },
            bgColor: 'transparent'
          });
        }
      }
      
      // Ensure position is not undefined
      const position = node.position || { x: Math.random() * 500, y: Math.random() * 300 };
      
      // Ensure data object exists and type it
      const data: Partial<CustomNodeData> = node.data || {};
      
      // Extract label from node data or generate from component part of nodeType, ensure it's a string
      const [section = '', component = ''] = nodeType.split('_');
      const originalLabel: string = (data.label || 
                   (component ? component.charAt(0).toUpperCase() + component.slice(1) : 'Node')) as string;
      
      // NEW LOGIC: Format the label based on nodeType and originalLabel
      let formattedLabel = originalLabel;
      
      // Only apply the special formatting if both nodeType and originalLabel exist
      if (nodeType && originalLabel) {
        // Extract the component name without the category prefix
        if (component) {
          // Format the component name to be user-friendly
          // e.g., "redis_cache" becomes "Redis Cache"
          const formattedComponent = component
            .split('_')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
          
          // Check if the original label already contains the component name at the start
          // to avoid duplication like "Redis - Redis - Session Cache"
          const startsWithComponent = originalLabel.toLowerCase().startsWith(formattedComponent.toLowerCase());
          
          // Only apply the formatting if the label doesn't already start with the component name
          if (!startsWithComponent && formattedComponent.toLowerCase() !== originalLabel.toLowerCase()) {
            formattedLabel = `${formattedComponent} - ${originalLabel}`;
          }
        }
      }
      
      // Check if this is an application or microservice node
      const isApplicationNode = section === 'application';
      const isMicroserviceNode = nodeType.includes('microservice') || component === 'microservice';
      
      // Check if this node has connections
      const hasSourceConnection = sourceIds.has(node.id);
      const hasTargetConnection = targetIds.has(node.id);
      
      // Determine if this node should be excluded from layers (client nodes)
      const shouldExcludeFromLayers = isClientNode();
      
      // === NEW: attach onLock toggle callback & keep pinned flag ===
      const togglePin = (id: string) => {
        if (!externalSetNodes) return;
        externalSetNodes((nds: Node[]) => nds.map(n => n.id === id ? { ...n, data: { ...n.data, pinned: !(n.data?.pinned === true) } } : n));
        // Trigger layout if provided
        if (externalOnLayout) {
          externalOnLayout();
        }
      };

      // Preserve existing pinned flag (default false)
      const isPinnedFlag = data.pinned === true;
      
      // Always force draggable to be true, never override with false
      return {
        ...node,
        type: 'default', // Always use our custom node
        position: position as XYPosition, // Assert position type
        dragging: node.dragging || false, // Preserve dragging state if it exists
        draggable: true, // Always draggable
        data: {
          ...data,
          // Preserve existing pinned flag or default
          pinned: isPinnedFlag,
          // Add callbacks for edit/delete
          onEdit: data.onEdit || handleEditNode,
          onDelete: data.onDelete || handleDeleteNode,
          // NEW: onLock callback to toggle pinned
          onLock: data.onLock || togglePin,
          label: formattedLabel, // Use the newly formatted label
          nodeType: nodeType,
          section: section,
          isMicroservice: isMicroserviceNode,
          iconRenderer: iconRenderer,
          hasSourceConnection: hasSourceConnection, 
          hasTargetConnection: hasTargetConnection,
          excludeFromLayers: shouldExcludeFromLayers || data.excludeFromLayers, // Mark client nodes to exclude from layers
        } as CustomNodeData, // Assert the final data structure
        className: node.dragging ? 'dragging' : '',
      } as Node<CustomNodeData>; // Assert the final node structure
    }).filter((node): node is Node<CustomNodeData> => node !== null); // Type guard for filter
  }, [handleEditNode, handleDeleteNode]);

  // Memoize the results of prepareNodes to prevent recreating nodes on every render
  const preparedNodes = useMemo(() => {
    return prepareNodes(initialNodes, initialEdges);
  }, [initialNodes, initialEdges, prepareNodes]);

  // Memoized function for determining edge type
  const getEdgeType = useCallback((sourceId, targetId) => {
    return determineEdgeType(sourceId, targetId, initialNodes);
  }, [initialNodes]);

  // Enhanced handle connect with improved arrowhead handling
  const handleConnect = useCallback((params) => {
    if (!externalSetEdges) {
      console.warn("externalSetEdges is not available for handleConnect");
      return;
    }
    
    if (!params.source || !params.target) {
      console.warn("Invalid connection params:", params);
      return;
    }
    
    // Create a unique ID for the new edge
    const edgeId = `edge-${params.source}-${params.target}-${Date.now()}`;
    
    // Determine edge type based on connected nodes
    const edgeType = getEdgeType(params.source, params.target);
    
    // Get stroke color based on edge type
    let strokeColor = '#555'; // Default color
    if (edgeStyles[edgeType] && typeof edgeStyles[edgeType].stroke === 'string') {
      strokeColor = edgeStyles[edgeType].stroke;
    } else if (edgeStyles.default && typeof edgeStyles.default.stroke === 'string') {
      strokeColor = edgeStyles.default.stroke;
    }
    
    // Create the new edge with consistent arrowhead
    const newEdge = {
      ...params,
      id: edgeId,
      type: edgeType,
      animated: edgeType === 'dataFlow' || edgeType === 'database',
      // Always include markerEnd for arrowhead display
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: strokeColor,
        markerEndOffset: -70
      },
      // Include styling based on edge type
      style: {
        strokeWidth: 2,
        stroke: strokeColor,
        ...(params.style || {}),
      },
      data: {
        // You can add additional edge data here if needed
        edgeType: edgeType,
        label: '' // Default empty label
      }
    };
    
    // Use functional update to avoid race conditions
    externalSetEdges((eds) => {
      // Avoid duplicate edges
      const existingEdge = eds.find(e => 
        e.source === params.source && e.target === params.target
      );
      
      if (existingEdge) {
        return eds;
      }
      
      return [...eds, newEdge];
    });
    
    toast({
      description: "Connection created"
    });
    
    return newEdge; // Return the newly created edge
  }, [externalSetEdges, toast, getEdgeType]);

  // Handle adding new nodes
  const handleAddNode = useCallback((nodeType, position, iconRenderer) => {
    if (!externalSetNodes) {
      console.warn("externalSetNodes is not available for handleAddNode");
      return;
    }
    
    // Create a unique ID for the new node
    const newId = `node-${nodeType.toLowerCase().replace(/\s+/g, '_')}-${Date.now()}`;
    
    // Convert nodeType from display label (e.g., "Network Firewall") to normalized format (e.g., "network_firewall")
    // This ensures consistency with how backend nodes are processed
    const normalizedNodeType = nodeType.toLowerCase().replace(/\s+/g, '_');
    
    // Determine category based on node type
    const nodeCategory = 
      nodeType.includes('AWS') || ['EC2', 'RDS', 'S3', 'Lambda', 'CloudFront', 'IAM'].some(t => nodeType.includes(t)) 
        ? 'AWS' 
      : ['Network', 'Internet', 'Router'].some(t => nodeType.includes(t)) 
        ? 'Network' 
      : ['Security', 'Shield', 'WAF', 'Lock'].some(t => nodeType.includes(t)) 
        ? 'Security' 
      : 'General';
    
    // Get appropriate styling for this node type
    const nodeTypeStyle = getNodeShapeStyle(nodeType);
    
    // Define the new node
    const newNode = {
      id: newId,
      type: normalizedNodeType, // Store the normalized type format here
      position,
      data: { 
        label: nodeType, // Keep original label for display
        onEdit: handleEditNode,
        onDelete: handleDeleteNode,
        nodeType: normalizedNodeType, // Use normalized type in data as well
        description: `A ${nodeType.toLowerCase()} component`,
        iconRenderer: iconRenderer, // Include the iconRenderer in node data
        category: nodeCategory,
      },
      style: {
        ...nodeDefaults.style,
        ...nodeTypeStyle
      }
    };
    
    // Add the new node to the diagram
    externalSetNodes((nds) => [...nds, newNode]);

    toast({
      title: "Node Added",
      description: `Added "${nodeType}" to the diagram`
    });
    
    return newId; // Return the ID of the newly created node
  }, [externalSetNodes, handleEditNode, handleDeleteNode, toast]);

  // Handle saving edited node data
  const handleSaveNodeEdit = useCallback((id, updatedData) => {
    if (!externalSetNodes) {
      console.warn("externalSetNodes is not available for handleSaveNodeEdit");
      return;
    }
    
    externalSetNodes(nds => 
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: updatedData.label,
              description: updatedData.description
            }
          };
        }
        return node;
      })
    );

    toast({
      title: "Node Updated",
      description: `Node "${updatedData.label}" has been updated`
    });
  }, [externalSetNodes, toast]);

  // Process edges to ensure proper typing and arrowheads
  const processEdges = useCallback((edgesToProcess) => {
    if (!Array.isArray(edgesToProcess) || edgesToProcess.length === 0) {
      return [];
    }
    
    return edgesToProcess.map(edge => {
      if (!edge.source || !edge.target) {
        console.warn('Skipping invalid edge:', edge);
        return null;
      }
      
      // Use the determined edge type or the existing one
      const edgeType = edge.type || getEdgeType(edge.source, edge.target);
      
      return {
        ...edge,
        type: edgeType,
        markerEnd: 'url(#arrowhead)',
        style: {
          ...(edge.style || {}),
          ...(edgeStyles[edgeType] || edgeStyles.default)
        }
      };
    }).filter(Boolean);
  }, [getEdgeType]);

  // Memoize processed edges
  const processedEdges = useMemo(() => {
    return processEdges(initialEdges);
  }, [initialEdges, processEdges]);

  return {
    editNodeDialogOpen,
    setEditNodeDialogOpen,
    currentEditNode,
    setCurrentEditNode,
    // Return the original functions but utilize the memoized values when the inputs match
    prepareNodes: useCallback((nodes, edges) => {
      // If inputs match the memoized inputs, return the memoized result
      if (nodes === initialNodes && edges === initialEdges) {
        return preparedNodes;
      }
      // Otherwise, run the calculation with the new inputs
      return prepareNodes(nodes, edges);
    }, [initialNodes, initialEdges, preparedNodes, prepareNodes]),
    handleConnect,
    handleAddNode,
    handleSaveNodeEdit,
    getEdgeType,
    processEdges: useCallback((edges) => {
      // If inputs match the memoized inputs, return the memoized result
      if (edges === initialEdges) {
        return processedEdges;
      }
      // Otherwise, run the calculation with the new inputs
      return processEdges(edges);
    }, [initialEdges, processedEdges, processEdges])
  };
}


// import { useState, useCallback } from 'react';
// import { Node, Edge, Connection, XYPosition, addEdge } from '@xyflow/react';
// import { useToast } from '@/hooks/use-toast';
// import { CustomNodeData, NodeEditData } from '../types/diagramTypes';
// import { nodeDefaults, getNodeShapeStyle } from '../utils/nodeStyles';

// export function useDiagramNodes(
//   initialNodes = [],
//   initialEdges = [],
//   externalSetNodes = null,
//   externalSetEdges = null
// ) {
//   const { toast } = useToast();
//   const [editNodeDialogOpen, setEditNodeDialogOpen] = useState(false);
//   const [currentEditNode, setCurrentEditNode] = useState(null);

//   // Apply style defaults to all nodes and add callbacks
//   const prepareNodes = useCallback((nodes) => {
//     if (!nodes || !Array.isArray(nodes)) {
//       console.warn("prepareNodes received invalid nodes:", nodes);
//       return [];
//     }
    
//     return nodes.map(node => {
//       if (!node) {
//         console.warn("Encountered null or undefined node in prepareNodes");
//         return null;
//       }
      
//       // Determine category from node type for styling purposes
//       const nodeType = node.data?.nodeType || 'Component';
      
//       const nodeCategory = 
//         nodeType.includes('AWS') ? 'AWS' :
//         ['Network', 'Internet', 'Router'].some(t => nodeType.includes(t)) ? 'Network' :
//         ['Security', 'Shield', 'WAF', 'IAM', 'Lock'].some(t => nodeType.includes(t)) ? 'Security' :
//         'General';
      
//       // Apply category-specific styling
//       const nodeTypeStyle = getNodeShapeStyle(nodeType);
      
//       return {
//         ...node,
//         type: node.type || 'default', // Use our custom node for all nodes
//         data: {
//           ...node.data,
//           label: node.data?.label || 'Node',
//           onEdit: handleEditNode,
//           onDelete: handleDeleteNode,
//           description: node.data?.description || '',
//           nodeType: nodeType,
//           iconRenderer: node.data?.iconRenderer, // Pass iconRenderer to node data
//           category: nodeCategory, // Add category to data for styling
//         },
//         style: {
//           ...nodeDefaults.style,
//           ...nodeTypeStyle,
//           ...node.style,
//         }
//       };
//     }).filter(Boolean); // Filter out any null values
//   }, []);

//   // Handle editing a node
//   const handleEditNode = useCallback((id, label) => {
//     console.log(`Editing node: ${id} (${label})`);
    
//     // Find the node from initialNodes
//     const targetNode = initialNodes.find(node => node.id === id);
    
//     if (targetNode) {
//       setCurrentEditNode({
//         id,
//         label: targetNode.data?.label || '',
//         description: targetNode.data?.description || ''
//       });
//       setEditNodeDialogOpen(true);
//     } else {
//       console.warn(`Node with id ${id} not found for editing`);
//     }
//   }, [initialNodes]);

//   // Handle saving edited node data
//   const handleSaveNodeEdit = useCallback((id, updatedData) => {
//     console.log(`Saving edits for node: ${id}`, updatedData);
    
//     if (!externalSetNodes) {
//       console.warn("externalSetNodes is not available for handleSaveNodeEdit");
//       return;
//     }
    
//     externalSetNodes(nds => 
//       nds.map(node => {
//         if (node.id === id) {
//           return {
//             ...node,
//             data: {
//               ...node.data,
//               label: updatedData.label,
//               description: updatedData.description
//             }
//           };
//         }
//         return node;
//       })
//     );

//     toast({
//       title: "Node Updated",
//       description: `Node "${updatedData.label}" has been updated`
//     });
//   }, [externalSetNodes, toast]);

//   // Handle deleting a node
//   const handleDeleteNode = useCallback((id) => {
//     console.log(`Deleting node: ${id}`);
    
//     if (!externalSetNodes || !externalSetEdges) {
//       console.warn("External setters not available for handleDeleteNode");
//       return;
//     }
    
//     // Find the node to be deleted to show its name in the toast
//     const nodeToDelete = initialNodes.find(node => node.id === id);
    
//     // Remove the node
//     externalSetNodes(nds => nds.filter(node => node.id !== id));
    
//     // Remove any edges connected to this node
//     externalSetEdges(eds => eds.filter(edge => edge.source !== id && edge.target !== id));
    
//     // Show a toast notification
//     if (nodeToDelete) {
//       const nodeLabel = nodeToDelete.data?.label || 'Unnamed node';
        
//       toast({
//         title: "Node Deleted",
//         description: `Node "${nodeLabel}" has been removed`//       });
//     }
//   }, [initialNodes, externalSetNodes, externalSetEdges, toast]);

//   // Handle adding new connections
//   const handleConnect = useCallback((params) => {
//     console.log("Creating new connection:", params);
    
//     if (!externalSetEdges) {
//       console.warn("externalSetEdges is not available for handleConnect");
//       return;
//     }
    
//     // Create a unique ID for the new edge
//     const edgeId = `edge-${Date.now()}`;
    
//     // Default to regular edge type
//     const edgeType = 'default';
    
//     // Create the new edge with the specified type
//     const newEdge = {
//       ...params,
//       id: edgeId,
//       type: edgeType,
//       animated: true,
//     };
    
//     // Use addEdge correctly
//     externalSetEdges((eds) => addEdge(newEdge, eds));
    
//     toast({
//       description: "Connection created"
//     });
//   }, [externalSetEdges, toast]);

//   // Handle adding new nodes
//   const handleAddNode = useCallback((nodeType, position, iconRenderer) => {
//     console.log(`Adding new node of type: ${nodeType} at position:`, position);
    
//     if (!externalSetNodes) {
//       console.warn("externalSetNodes is not available for handleAddNode");
//       return;
//     }
    
//     // Create a unique ID for the new node
//     const newId = `node-${Date.now()}`;
    
//     // Determine category based on node type
//     const nodeCategory = 
//       nodeType.includes('AWS') || ['EC2', 'RDS', 'S3', 'Lambda', 'CloudFront', 'IAM'].some(t => nodeType.includes(t)) 
//         ? 'AWS' 
//       : ['Network', 'Internet', 'Router'].some(t => nodeType.includes(t)) 
//         ? 'Network' 
//       : ['Security', 'Shield', 'WAF', 'Lock'].some(t => nodeType.includes(t)) 
//         ? 'Security' 
//       : 'General';
    
//     // Get appropriate styling for this node type
//     const nodeTypeStyle = getNodeShapeStyle(nodeType);
    
//     // Define the new node
//     const newNode = {
//       id: newId,
//       type: 'default',
//       position,
//       data: { 
//         label: nodeType, 
//         onEdit: handleEditNode,
//         onDelete: handleDeleteNode,
//         nodeType: nodeType,
//         description: `A ${nodeType.toLowerCase()} component`,
//         iconRenderer: iconRenderer, // Include the iconRenderer in node data
//         category: nodeCategory,
//       },
//       style: {
//         ...nodeDefaults.style,
//         ...nodeTypeStyle
//       }
//     };
    
//     // Add the new node to the diagram
//     externalSetNodes((nds) => [...nds, newNode]);

//     toast({
//       title: "Node Added",
//       description: `Added "${nodeType}" to the diagram`
//     });
//   }, [externalSetNodes, handleEditNode, handleDeleteNode, toast]);

//   return {
//     editNodeDialogOpen,
//     setEditNodeDialogOpen,
//     currentEditNode,
//     setCurrentEditNode,
//     prepareNodes,
//     handleConnect,
//     handleAddNode,
//     handleSaveNodeEdit
//   };
// }

