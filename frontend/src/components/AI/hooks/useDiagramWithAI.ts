import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Node, Edge } from '@xyflow/react';
import { CustomNodeData } from '../types/diagramTypes';
import { diagramNodesState, diagramEdgesState } from '../diagramState';
import { useNavigate } from 'react-router-dom';

export function useDiagramWithAI(
  externalNodes = [], 
  externalEdges = [], 
  onNodesChange = null, 
  onEdgesChange = null
) {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use provided external nodes/edges if available, otherwise use default state
  const [nodes, setNodes] = useState(() => {
    console.log('useDiagramWithAI initializing with nodes:', externalNodes.length);
    return externalNodes.length > 0 ? externalNodes : diagramNodesState;
  });
  
  const [edges, setEdges] = useState(() => {
    console.log('useDiagramWithAI initializing with edges:', externalEdges.length);
    return externalEdges.length > 0 ? externalEdges : diagramEdgesState;
  });

  // Sync with external nodes/edges if they change
  useEffect(() => {
    if (externalNodes && externalNodes.length > 0 && JSON.stringify(nodes) !== JSON.stringify(externalNodes)) {
      console.log("useDiagramWithAI: Syncing with external nodes:", externalNodes.length);
      setNodes(externalNodes);
    }
  }, [externalNodes]);

  useEffect(() => {
    if (externalEdges && externalEdges.length > 0 && JSON.stringify(edges) !== JSON.stringify(externalEdges)) {
      console.log("useDiagramWithAI: Syncing with external edges:", externalEdges.length);
      setEdges(externalEdges);
    }
  }, [externalEdges]);

  // Notify parent of node changes if callback provided
  useEffect(() => {
    if (onNodesChange && typeof onNodesChange === 'function') {
      console.log("useDiagramWithAI: Notifying parent of node changes:", nodes.length);
      onNodesChange(nodes);
    }
  }, [nodes, onNodesChange]);

  // Notify parent of edge changes if callback provided
  useEffect(() => {
    if (onEdgesChange && typeof onEdgesChange === 'function') {
      console.log("useDiagramWithAI: Notifying parent of edge changes:", edges.length);
      onEdgesChange(edges);
    }
  }, [edges, onEdgesChange]);

  // Handle diagram toolbar actions
  const handleZoomIn = useCallback(() => {
    console.log('Zoom in');
    // Implementation would depend on the specific flow instance
  }, []);

  const handleZoomOut = useCallback(() => {
    console.log('Zoom out');
    // Implementation would depend on the specific flow instance
  }, []);

  const handleFitView = useCallback(() => {
    console.log('Fit view');
    // Implementation would depend on the specific flow instance
  }, []);

  const handleCopy = useCallback(() => {
    console.log('Copy selected nodes');
    // Implementation would depend on selection state
  }, []);

  const handlePaste = useCallback(() => {
    console.log('Paste nodes');
    // Implementation would depend on clipboard state
  }, []);

  const handleUndo = useCallback(() => {
    console.log('Undo last action');
    // Implementation would require action history
  }, []);

  const handleRedo = useCallback(() => {
    console.log('Redo last action');
    // Implementation would require action history
  }, []);

  const handleSelect = useCallback(() => {
    console.log('Select tool activated');
    // Implementation would switch to selection mode
  }, []);

  const handleComment = useCallback(() => {
    console.log('Creating sticky note');
    
    // Create a comment node at a position more likely to be visible
    // and away from other diagram elements
    const centerPosition = {
      x: Math.random() * 200 + 300, // Random position between 300-500 px
      y: Math.random() * 200 + 100, // Random position between 100-300 px
    };
    
    const newId = `sticky-note-${Date.now()}`;
    console.log(`Creating new sticky note with ID: ${newId}`);
    
    // Create sticky note with stronger type identity
    const stickyNote = {
      id: newId,
      type: 'comment',
      position: centerPosition,
      // Explicitly set properties to prevent transformation
      draggable: true,
      selectable: true,
      // Add connector properties to prevent edge connections
      sourcePosition: null,
      targetPosition: null,
      connectable: false,
      // Use data properties to identify as a sticky note
      data: { 
        label: "Click to add note...",
        nodeType: 'stickyNote',
        isComment: true,
        excludeFromLayers: true,
        // Flag to prevent transformation
        isSticky: true,
        preserveType: 'comment',
        // Add delete handler
        onDelete: (id: string) => {
          // Use functional update to guarantee we're working with the latest state
          setNodes(prevNodes => {
            console.log(`Deleting sticky note with ID: ${id}`);
            return prevNodes.filter(node => node.id !== id);
          });
          
          toast({
            description: "Sticky note removed."
          });
        }
      },
      // Add style directly to node to reinforce its appearance
      style: {
        zIndex: 1000, // Ensure sticky notes are always on top
        background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)',
        border: '1px solid rgba(226, 205, 109, 0.5)',
        borderRadius: '2px',
        boxShadow: '2px 4px 7px rgba(0,0,0,0.15)',
      }
    };
    
    // Use functional update to guarantee we're working with the latest state
    setNodes(prevNodes => {
      console.log('Adding sticky note to diagram');
      // Add sticky note to nodes
      const newNodes = [...prevNodes, stickyNote];
      return newNodes;
    });
    
    toast({
      description: "Sticky note added. Click to edit."
    });
  }, [toast, setNodes]);

  const handleSave = useCallback(() => {
    console.log('Save diagram');
    toast({
      description: "Diagram saved successfully!"
    });
  }, [toast]);

  const handleAddNode = useCallback((label, position, iconRenderer) => {
    console.log(`Adding node "${label}" at position:`, position);
    
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'default',
      position,
      data: { 
        label,
        nodeType: label,
        icon: iconRenderer 
      }
    };
    
    setNodes(prev => {
      const updatedNodes = [...prev, newNode];
      console.log('Nodes after adding new node:', updatedNodes.length);
      return updatedNodes;
    });
    
    toast({
      description: `Added "${label}" node to diagram`
    });
  }, [toast]);

  const handleGenerateReport = useCallback(() => {
    // Store current diagram state in localStorage or context
    localStorage.setItem('diagramNodes', JSON.stringify(nodes));
    localStorage.setItem('diagramEdges', JSON.stringify(edges));
    
    // Return the path to navigate to
    return '/generate-report';
  }, [nodes, edges]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    handleZoomIn,
    handleZoomOut,
    handleFitView,
    handleCopy,
    handlePaste,
    handleUndo,
    handleRedo,
    handleSelect,
    handleComment,
    handleSave,
    handleAddNode,
    handleGenerateReport
  };
}