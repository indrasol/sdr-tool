import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addEdge } from '@xyflow/react';
import { getNodeShapeStyle, nodeDefaults } from '../utils/nodeStyles';
import { edgeStyles } from '../utils/edgeStyles';


const determineEdgeType = (sourceId, targetId, nodes = []) => {
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
  initialNodes = [],
  initialEdges = [],
  externalSetNodes = null,
  externalSetEdges = null
) {
  const { toast } = useToast();
  const [editNodeDialogOpen, setEditNodeDialogOpen] = useState(false);
  const [currentEditNode, setCurrentEditNode] = useState(null);

  // Apply style defaults to all nodes and add callbacks
  const prepareNodes = useCallback((nodes) => {
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      console.warn("prepareNodes received invalid or empty nodes:", nodes);
      return [];
    }
    
    return nodes.map(node => {
      if (!node) {
        console.warn("Encountered null or undefined node in prepareNodes");
        return null;
      }
      
      // Determine category from node type for styling purposes
      const nodeType = node.data?.nodeType || node.type || 'Component';
      
      // Apply category-specific styling
      const nodeTypeStyle = getNodeShapeStyle(nodeType);
      
      // Ensure position is not undefined
      const position = node.position || { x: Math.random() * 500, y: Math.random() * 300 };
      
      // Ensure data object exists
      const data = node.data || {};
      
      return {
        ...node,
        type: node.type || 'default', // Use our custom node for all nodes
        position: position,
        data: {
          ...data,
          label: data.label || node.id || nodeType,
          onEdit: handleEditNode,
          onDelete: handleDeleteNode,
          description: data.description || '',
          nodeType: nodeType,
          iconRenderer: data.iconRenderer, // Pass iconRenderer to node data
        },
        style: {
          background: '#fff', // White background
          border: 'none', // No border
          borderRadius: '8px', // Rounded corners
          padding: '10px', // Consistent padding
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Subtle shadow
          width: 150, // Fixed width
          height: 50, // Fixed height
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        draggable: node.draggable !== false  // Ensure nodes are draggable by default
      };
    }).filter(Boolean); // Filter out any null values
  }, []);

  // Handle editing a node
  const handleEditNode = useCallback((id, label) => {
    console.log(`Editing node: ${id} (${label})`);
    
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

  // Handle saving edited node data
  const handleSaveNodeEdit = useCallback((id, updatedData) => {
    console.log(`Saving edits for node: ${id}`, updatedData);
    
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

  // Handle deleting a node
  const handleDeleteNode = useCallback((id) => {
    console.log(`Deleting node: ${id}`);
    
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

  // Memoized function for determining edge type
  const getEdgeType = useCallback((sourceId, targetId) => {
    return determineEdgeType(sourceId, targetId, initialNodes);
  }, [initialNodes]);

  // Enhanced handle connect with improved arrowhead handling
  const handleConnect = useCallback((params) => {
    console.log("Creating new connection:", params);
    
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
    
    // Create the new edge with consistent arrowhead
    const newEdge = {
      ...params,
      id: edgeId,
      type: edgeType,
      animated: false,
      // Always include markerEnd for arrowhead display
      markerEnd: 'url(#arrowhead)',
      // Include styling based on edge type
      style: {
        ...(edgeStyles[edgeType] || edgeStyles.default)
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
        console.log("Edge already exists, not adding duplicate");
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
    console.log(`Adding new node of type: ${nodeType} at position:`, position);
    
    if (!externalSetNodes) {
      console.warn("externalSetNodes is not available for handleAddNode");
      return;
    }
    
    // Create a unique ID for the new node
    const newId = `node-${nodeType.toLowerCase()}-${Date.now()}`;
    
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
      type: 'default',
      position,
      data: { 
        label: nodeType, 
        onEdit: handleEditNode,
        onDelete: handleDeleteNode,
        nodeType: nodeType,
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

  return {
    editNodeDialogOpen,
    setEditNodeDialogOpen,
    currentEditNode,
    setCurrentEditNode,
    prepareNodes,
    handleConnect,
    handleAddNode,
    handleSaveNodeEdit,
    getEdgeType,
    processEdges
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
//         description: `Node "${nodeLabel}" has been removed`
//       });
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