import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addEdge, MarkerType, Node, Edge, XYPosition } from '@xyflow/react';
import { getNodeShapeStyle, nodeDefaults } from '../utils/nodeStyles';
import { getEdgeStyle, getEdgeType, edgeStyles } from '../utils/edgeStyles';
import { iconifyRegistry } from '../utils/iconifyRegistry';
import { CustomNodeData } from '../types/diagramTypes';
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from '../utils/layerUtils';


// Legacy edge type determination function for backward compatibility
// Can be used as fallback if needed
const determineEdgeType = (sourceId: string, targetId: string, nodes: Node[] = []): string => {
  // Find the source and target nodes
  const sourceNode = nodes.find(n => n.id === sourceId);
  const targetNode = nodes.find(n => n.id === targetId);
  
  // If either node is missing, default to 'default'
  if (!sourceNode || !targetNode) {
    return 'default';
  }
  
  // Extract node types, defaulting to empty string if not present
  const sourceType = ((sourceNode.data?.nodeType || sourceNode.type || '') as string).toLowerCase();
  const targetType = ((targetNode.data?.nodeType || targetNode.type || '') as string).toLowerCase();
  
  // Use the new getEdgeType function from edgeStyles.tsx
  return getEdgeType(sourceType, targetType);
};

export function useDiagramNodes(
  initialNodes: Node<CustomNodeData>[] = [],
  initialEdges: Edge[] = [],
  externalSetNodes = null,
  externalSetEdges = null,
  externalOnLayout: ((options?: {
    direction: 'LR' | 'TB' | 'BT' | 'RL';
    engine: 'auto' | 'elk' | 'dagre' | 'basic';
    enablePerformanceMonitoring: boolean;
  }) => void) | null = null
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
        label: targetNode.data?.label || label,
        description: targetNode.data?.description || '',
        nodeType: targetNode.data?.nodeType || '',
      });
      setEditNodeDialogOpen(true);
    }
  }, [initialNodes]);

  // Handle saving node edit
  const handleSaveNodeEdit = useCallback((editData) => {
    if (!externalSetNodes) {
      console.warn("externalSetNodes is not available for handleSaveNodeEdit");
      return;
    }
    
    externalSetNodes((nds) =>
      nds.map((node) => {
        if (node.id === editData.id) {
          // Update node data
          return {
            ...node,
            data: {
              ...node.data,
              label: editData.label,
              description: editData.description,
              nodeType: editData.nodeType,
              // Preserve other data fields
            },
          };
        }
        return node;
      })
    );
    
    // Close the dialog
    setEditNodeDialogOpen(false);
    setCurrentEditNode(null);
    
    // Show success toast
    toast({
      description: "Node updated successfully!"
    });
  }, [externalSetNodes, toast]);

  // Handle connect
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
    
    // Determine the source and target node types
    const sourceNode = initialNodes.find(n => n.id === params.source);
    const targetNode = initialNodes.find(n => n.id === params.target);
    const sourceType = sourceNode?.data?.nodeType || '';
    const targetType = targetNode?.data?.nodeType || '';
    
    // Get edge type based on connected nodes
    const edgeType = getEdgeType(sourceType, targetType);
    
    // Get edge style configuration
    const edgeStyleConfig = getEdgeStyle(sourceType, targetType);
    
    // Get stroke color from edge style config
    const strokeColor = edgeStyleConfig.style.stroke || '#555'; // Default color if not found
    
    // Create the new edge with consistent arrowhead
    const newEdge = {
      ...params,
      id: edgeId,
      type: 'default', // Use our custom default edge type
      // Add data with edgeType for styling
      data: {
        ...(params.data || {}),
        edgeType: edgeType,
        sourceType: sourceType,
        targetType: targetType,
        label: params.label || '' // Default empty label
      },
      // Include styling based on edge type
      style: {
        ...(params.style || {})
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
  }, [externalSetEdges, toast, initialNodes]);

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
    const iconifyId = iconifyRegistry[normalizedNodeType] || 'mdi:application';
    
    // Define the new node
    const newNode = {
      id: newId,
      type: normalizedNodeType, // Store the normalized type format here
      position,
      data: { 
        label: nodeType, // Keep original label for display
        onEdit: handleEditNode,
        onDelete: () => {}, // This will be handled separately
        nodeType: normalizedNodeType, // Use normalized type in data as well
        description: `A ${nodeType.toLowerCase()} component`,
        iconifyId,
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
  }, [externalSetNodes, handleEditNode]);

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
  const prepareNodes = useCallback((nodes, edges) => {
    if (!Array.isArray(nodes)) {
      console.warn("prepareNodes received invalid nodes:", nodes);
      return [];
    }
    
    return nodes.map((node) => {
      if (!node) {
        console.warn("Encountered null or undefined node in prepareNodes");
        return null;
      }

      const nodeId = node.id;
      const hasSourceConnection = edges.some(e => e.source === nodeId);
      const hasTargetConnection = edges.some(e => e.target === nodeId);
      
      // Safety check for node.data
      if (!node.data) {
        node.data = {};
      }
      
      return {
        ...node,
        // Ensure node has a type (default to 'default')
        type: node.type || 'default',
        data: {
          ...node.data,
          label: node.data.label || 'Node',
          // Add connection flags for handle visibility
          hasSourceConnection,
          hasTargetConnection,
          // Add event handlers
          onEdit: handleEditNode,
          onDelete: handleDeleteNode,
          onLock: () => {}, // Placeholder for future locking functionality
          // Preserve other data fields
        }
      };
    }).filter(Boolean); // Remove nulls
  }, [handleEditNode, handleDeleteNode]);

  // Memoize prepared nodes
  const preparedNodes = useMemo(() => {
    return prepareNodes(initialNodes, initialEdges);
  }, [initialNodes, initialEdges]);

  // Memoized function for determining edge type
  const getEdgeType = useCallback((sourceId, targetId) => {
    return determineEdgeType(sourceId, targetId, initialNodes);
  }, [initialNodes]);

  // Process edges to ensure proper rendering
  const processEdges = useCallback((edgesToProcess) => {
    if (!Array.isArray(edgesToProcess) || edgesToProcess.length === 0) {
      return [];
    }

    return edgesToProcess.map(edge => {
      if (!edge.source || !edge.target) {
        console.warn('Skipping invalid edge:', edge);
        return null;
      }

      // Find source and target node types
      const sourceNode = initialNodes.find(n => n.id === edge.source);
      const targetNode = initialNodes.find(n => n.id === edge.target);
      const sourceType = sourceNode?.data?.nodeType || '';
      const targetType = targetNode?.data?.nodeType || '';
      
      // Determine edge type
      const edgeType = getEdgeType(sourceType, targetType);
      
      return {
        ...edge,
        type: 'default', // Use our custom default edge
        data: {
          ...(edge.data || {}),
          edgeType: edgeType,
          sourceType: sourceType,
          targetType: targetType
        }
      };
    }).filter(Boolean);
  }, [initialNodes]);

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
    determineEdgeType, // Keep for backward compatibility
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
//     if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
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

