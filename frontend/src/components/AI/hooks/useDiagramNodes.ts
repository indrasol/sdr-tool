
import { useState, useCallback } from 'react';
import { Node, Edge, Connection, XYPosition, addEdge } from '@xyflow/react';
import { useToast } from '@/hooks/use-toast';
import { CustomNodeData, NodeEditData } from '../types/diagramTypes';
import { nodeDefaults, getNodeShapeStyle } from '../utils/nodeStyles';

export function useDiagramNodes(
  initialNodes: Node<CustomNodeData>[],
  initialEdges: Edge[],
  externalSetNodes: React.Dispatch<React.SetStateAction<Node<CustomNodeData>[]>>,
  externalSetEdges: React.Dispatch<React.SetStateAction<Edge[]>>
) {
  const { toast } = useToast();
  const [editNodeDialogOpen, setEditNodeDialogOpen] = useState(false);
  const [currentEditNode, setCurrentEditNode] = useState<NodeEditData | null>(null);

  // Apply style defaults to all nodes and add callbacks
  const prepareNodes = useCallback((nodes: Node<CustomNodeData>[]) => {
    return nodes.map(node => ({
      ...node,
      type: 'default', // Use our custom node for all nodes
      data: {
        ...node.data,
        label: node.data?.label || 'Node',
        onEdit: handleEditNode,
        onDelete: handleDeleteNode,
        description: node.data?.description || '',
        nodeType: node.data?.nodeType || node.type || 'Component',
      },
      style: {
        ...nodeDefaults.style,
        ...node.style,
      }
    }));
  }, []);

  // Handle editing a node
  const handleEditNode = useCallback((id: string, label: string) => {
    const node = initialNodes.find(node => node.id === id);
    
    if (node) {
      setCurrentEditNode({
        id,
        label: node.data?.label || '',
        description: node.data?.description || ''
      });
      setEditNodeDialogOpen(true);
    }
  }, [initialNodes]);

  // Handle saving edited node data
  const handleSaveNodeEdit = useCallback((id: string, updatedData: { label: string; description: string }) => {
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
  const handleDeleteNode = useCallback((id: string) => {
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

  // Handle adding new connections
  const handleConnect = useCallback(
    (params: Connection) => externalSetEdges((eds) => addEdge(params, eds)),
    [externalSetEdges]
  );

  // Handle adding new nodes
  const handleAddNode = useCallback(
    (nodeType: string, position: XYPosition) => {
      // Create a unique ID for the new node
      const newId = `node-${Date.now()}`;
      
      // Define the new node
      const newNode: Node<CustomNodeData> = {
        id: newId,
        type: 'default',
        position,
        data: { 
          label: nodeType, 
          onEdit: handleEditNode,
          onDelete: handleDeleteNode,
          nodeType: nodeType,
          description: `A ${nodeType.toLowerCase()} component`
        },
        style: {
          ...nodeDefaults.style,
          ...getNodeShapeStyle(nodeType)
        }
      };
      
      // Add the new node to the diagram
      externalSetNodes((nds) => [...nds, newNode]);
    },
    [externalSetNodes, handleEditNode, handleDeleteNode]
  );

  return {
    editNodeDialogOpen,
    setEditNodeDialogOpen,
    currentEditNode,
    prepareNodes,
    handleConnect,
    handleAddNode,
    handleSaveNodeEdit
  };
}