import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowInstance,
  Connection,
  Panel,
  MarkerType,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './customNode';
import CommentNode from './CommentNode';
import EditNodeDialog from './EditNodeDialog';
import { AIFlowDiagramProps } from './types/diagramTypes';
import { useDiagramNodes } from './hooks/useDiagramNodes';
import { edgeStyles } from './utils/edgeStyles';
import DiagramActions from './DiagramActions';
import FlowLegend from './FlowLegend';
import dagre from 'dagre';
import './AIFlowDiagram.css';


// Layout algorithm function - uses dagre to calculate node positions
export const getLayoutedElements = (nodes, edges, direction = 'TB', nodeWidth = 172, nodeHeight = 36) => {
  if (!nodes || nodes.length === 0) {
    console.warn('No nodes provided for layout');
    return { nodes: [], edges: [] };
  }

  try {
    // Create a new graph
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction });

    // Add nodes to the graph with dimensions
    nodes.forEach((node) => {
      const width = node.data?.width || nodeWidth; 
      const height = node.data?.height || nodeHeight;
      dagreGraph.setNode(node.id, { 
        width: width, 
        height: height 
      });
    });

    // Add edges to the graph
    if (edges && edges.length > 0) {
      edges.forEach((edge) => {
        if (edge.source && edge.target) {
          dagreGraph.setEdge(edge.source, edge.target);
        }
      });
    }

    // Run the layout algorithm
    dagre.layout(dagreGraph);

    // Get the positions from the layout algorithm
    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      
      if (!nodeWithPosition) {
        console.warn(`Node ${node.id} not found in layout results`);
        return node;
      }

      const useExistingPosition = node.position && node.position.x !== 0 && node.position.y !== 0;
      
      return {
        ...node,
        // Only set position if the node doesn't already have one or is a new node
        position: node.position && 
                 node.position.x !== undefined && 
                 node.position.y !== undefined && 
                 node.position.x !== 0 && 
                 node.position.y !== 0
          ? node.position 
          : {
              x: nodeWithPosition.x - nodeWidth / 2,
              y: nodeWithPosition.y - nodeHeight / 2,
            },
      };
    });

    return { nodes: layoutedNodes, edges };
  } catch (error) {
    console.error('Error in layout algorithm:', error);
    return { nodes, edges }; // Return original nodes and edges on error
  }
};

const AIFlowDiagram: React.FC<AIFlowDiagramProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  setNodes: setNodesExternal,
  setEdges: setEdgesExternal,
  viewMode,
  onSwitchView,
  onZoomIn,
  onZoomOut,
  onFitView,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onComment,
  onGenerateReport,
  onSave,
  onLayout,
  isLayouting: externalIsLayouting,
}): React.ReactNode => {
  // Add state for layout functionality if not provided from parent
  const [internalIsLayouting, setInternalIsLayouting] = useState(false);
  const effectiveIsLayouting = externalIsLayouting !== undefined ? externalIsLayouting : internalIsLayouting;
  
  // Add state for data flow diagram toggle
  const [isDataFlowActive, setIsDataFlowActive] = useState(false);
  // Store the original diagram nodes and edges
  const originalDiagramRef = useRef({ nodes: [], edges: [] });
  // Store the data flow diagram nodes and edges
  const dataFlowDiagramRef = useRef({ nodes: [], edges: [] });
  
  const previousNodesLengthRef = useRef(initialNodes?.length || 0);
  const previousEdgesLengthRef = useRef(initialEdges?.length || 0);
  const layoutTimeoutRef = useRef(null);
  const initialRenderRef = useRef(true);

  // For performance optimization and smoother interactions
  const nodesCountRef = useRef(initialNodes?.length || 0);
  const edgesCountRef = useRef(initialEdges?.length || 0);
  
  // Register custom node types
  const nodeTypes = useMemo(() => ({
    default: CustomNode,
    comment: CommentNode,
  }), []);

  // Default edge options
  const defaultEdgeOptions = useMemo(() => ({
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#555',
    },
    style: {
      strokeWidth: 2,
      stroke: '#555',
    },
  }), []);

  const reactFlowInstance = useRef(null);
  const [didFitView, setDidFitView] = useState(false);

  // Use ReactFlow hooks to manage nodes and edges with stabilized initial values
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialNodes && initialNodes.length > 0 ? initialNodes : []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges && initialEdges.length > 0 ? initialEdges : []
  );

  // Sync internal state with external state - with debouncing for drag operations
  const isInitialMount = useRef(true);
  const dragTimeoutRef = useRef(null);
  const isDragging = useRef(false);
  const hasSyncedInitialData = useRef(false);

  // Optimized node change handler to prevent unnecessary updates
  const handleNodesChange = useCallback((changes) => {
    // Track if we're currently dragging nodes
    const isDraggingNow = changes.some(change => 
      change.type === 'position' && change.dragging === true
    );
    
    // Update dragging state for our debounced state sync
    if (isDraggingNow) {
      isDragging.current = true;
    }
  
    onNodesChange(changes);
  }, [onNodesChange]);

  // Use custom hook to manage nodes and their interactions
  const {
    editNodeDialogOpen,
    setEditNodeDialogOpen,
    currentEditNode,
    prepareNodes,
    handleConnect: hookHandleConnect,
    handleAddNode,
    handleSaveNodeEdit,
  } = useDiagramNodes(nodes, edges, setNodes, setEdges);

  // Process edge data to ensure proper rendering
  const processEdges = useCallback((edgesToProcess) => {
    if (!Array.isArray(edgesToProcess) || edgesToProcess.length === 0) {
      return [];
    }

    return edgesToProcess.map(edge => {
      if (!edge.source || !edge.target) {
        console.warn('Skipping invalid edge:', edge);
        return null;
      }

      // Determine edge type
      const edgeType = edge.type || 'smoothstep';
      
      // Get styling for this edge type
      const typeStyle = edgeStyles[edgeType] || edgeStyles.dataFlow || {};
      
      return {
        ...edge,
        id: edge.id || `edge-${edge.source}-${edge.target}-${Date.now()}`,
        type: 'smoothstep', // Force consistency in edge type
        animated: edgeType === 'dataFlow' || edgeType === 'database',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: typeStyle.stroke || '#555'
        },
        style: {
          strokeWidth: 2,
          stroke: typeStyle.stroke || '#555',
          ...(edge.style || {}),
        }
      };
    }).filter(Boolean);
  }, []);

  // Handle initial sync of nodes and edges - ONCE only
  useEffect(() => {
    if (initialRenderRef.current && initialNodes && initialNodes.length > 0) {
      console.log('Initial sync of nodes and edges');
      // First process nodes
      const preparedNodes = prepareNodes(initialNodes);
      
      // Then process edges
      const processedEdges = initialEdges && initialEdges.length > 0 
        ? processEdges(initialEdges) 
        : [];
      
      // Update state
      setNodes(preparedNodes);
      setEdges(processedEdges);
      
      // Store original diagram for toggling
      originalDiagramRef.current = {
        nodes: preparedNodes,
        edges: processedEdges
      };
      
      // Create empty data flow diagram (no nodes, no edges)
      dataFlowDiagramRef.current = {
        nodes: [],
        edges: []
      };
      
      // Mark initial render as complete
      initialRenderRef.current = false;
      hasSyncedInitialData.current = true;
    }
  }, [initialNodes, initialEdges, prepareNodes, processEdges, setNodes, setEdges]);

  // Apply layout when nodes or edges change significantly - but NOT on initial render
  useEffect(() => {
    // Skip if not yet synced initial data, or no nodes, or currently layouting
    if (
      !hasSyncedInitialData.current || 
      initialNodes.length === 0 || 
      effectiveIsLayouting ||
      initialRenderRef.current
    ) {
      return;
    }
    
    // Check if nodes or edges count changed (something added or removed)
    const nodesCountChanged = initialNodes.length !== previousNodesLengthRef.current;
    const edgesCountChanged = initialEdges.length !== previousEdgesLengthRef.current;
    
    // Update the refs with current counts
    previousNodesLengthRef.current = initialNodes.length;
    previousEdgesLengthRef.current = initialEdges.length;
    
    // If something changed, apply layout with a delay
    if ((nodesCountChanged || edgesCountChanged)) {
      // Clear any existing timeout
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
      
      if (setInternalIsLayouting) setInternalIsLayouting(true);
      
      // Apply layout with a slight delay to batch changes
      layoutTimeoutRef.current = setTimeout(() => {
        // First prepare nodes with proper styles
        const preparedNodes = prepareNodes(initialNodes);
        // Then process edges with proper styling
        const processedEdges = processEdges(initialEdges);
        
        // Now apply layout
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          preparedNodes,
          processedEdges
        );
        
        // Update the nodes with new positions
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        
        // Wait a bit and then fit view to show all elements
        setTimeout(() => {
          if (reactFlowInstance.current) {
            reactFlowInstance.current.fitView({ padding: 0.2 });
          }
          if (setInternalIsLayouting) setInternalIsLayouting(false);
        }, 300);
      }, 200);
    }
    
    return () => {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
    };
  }, [initialNodes, initialEdges, effectiveIsLayouting, prepareNodes, processEdges, setNodes, setEdges]);

  // Handle node position changes more efficiently to prevent flickering
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Don't do immediate state updates when we're dragging or layouting
    if (isDragging.current || effectiveIsLayouting) {
      // Clear any existing timeout
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
      
      // Set a new timeout to sync state after dragging stops
      dragTimeoutRef.current = setTimeout(() => {
        if (nodes.length > 0 && setNodesExternal) {
          setNodesExternal(nodes);
        }
        isDragging.current = false;
      }, 100);
    } else if (nodes.length > 0 && setNodesExternal) {
      // Not dragging - sync immediately for other updates
      setNodesExternal(nodes);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, [nodes, setNodesExternal, effectiveIsLayouting]);

  // Edge sync - don't update during layouting
  useEffect(() => {
    if (!effectiveIsLayouting && edges.length > 0 && setEdgesExternal) {
      setEdgesExternal(edges);
    }
  }, [edges, setEdgesExternal, effectiveIsLayouting]);

  // Handle connect event
  const handleConnect = useCallback(
    (params) => {
      console.log('Connection created:', params);
      const newEdge = {
        ...params,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: '#555',
        },
        style: {
          strokeWidth: 2,
          stroke: '#555',
        }
      };
      hookHandleConnect(newEdge);
    },
    [hookHandleConnect]
  );

  // Internal layout function if no external one is provided
  const internalOnLayout = useCallback(() => {
    console.log('Applying internal layout, nodes:', nodes.length);
    if (effectiveIsLayouting || nodes.length === 0) return;
    
    if (setInternalIsLayouting) setInternalIsLayouting(true);
    
    // Get current nodes and edges
    const currentNodes = nodes;
    const currentEdges = edges;
    
    // Apply layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      currentNodes,
      currentEdges,
      'TB',  // Top to Bottom direction
      150,   // Node width
      36     // Node height
    );
    
    // Update state
    console.log('Setting layouted nodes:', layoutedNodes.length);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    // Fit view and reset layout flag
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({ padding: 0.2 });
      }
      if (setInternalIsLayouting) setInternalIsLayouting(false);
    }, 300);
  }, [nodes, edges, setNodes, setEdges, effectiveIsLayouting, setInternalIsLayouting]);

  // Add this effect to handle switching between viewModes
  useEffect(() => {
    // When switching to DFD mode, we need to handle the DFD visualization
    if (viewMode === 'DFD') {
      // We'll let ModelWithAI handle fetching and setting the data
      // console.log('AIFlowDiagram: DFD mode active');
    } else {
      // console.log('AIFlowDiagram: AD mode active');
    }
  }, [viewMode]);

  // Use external layout function if provided, otherwise use internal
  const handleLayout = useCallback(() => {
    console.log('Layout triggered, using:', onLayout ? 'external' : 'internal');
    if (onLayout) {
      onLayout();
    } else {
      internalOnLayout();
    }
  }, [onLayout, internalOnLayout]);

  // Handle zoom in action
  const handleZoomIn = () => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.zoomIn();
    }
    if (onZoomIn) {
      onZoomIn();
    }
  };

  // Handle zoom out action
  const handleZoomOut = () => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.zoomOut();
    }
    if (onZoomOut) {
      onZoomOut();
    }
  };

  // Handle fit view action
  const handleFitView = () => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView({ padding: 0.2 });
    }
    if (onFitView) {
      onFitView();
    }
  };

  // Handle save action
  const handleSave = () => {
    console.log('Saving diagram...', nodes?.length, 'nodes and', edges?.length, 'edges');
    if (onSave) {
      onSave();
    }
  };

  // Handle generate report action
  const handleGenerateReport = () => {
    console.log('Generating report...');
    if (onGenerateReport) {
      return onGenerateReport();
    }
    return '/report';
  };

  // Store the instance of ReactFlow when it's initialized
  const onInit = useCallback((instance) => {
    reactFlowInstance.current = instance;
    console.log('ReactFlow instance initialized');

    // Force a fit view after a short delay
    setTimeout(() => {
      if (reactFlowInstance.current && !didFitView) {
        console.log('Fitting view to diagram content');
        reactFlowInstance.current.fitView({ padding: 0.2 });
        setDidFitView(true);
        
        // Apply initial layout if we have multiple nodes
        if (nodes.length > 1) {
          console.log('Applying initial layout');
          handleLayout();
        }
      }
    }, 200);
  }, [didFitView, handleLayout, nodes.length]);

  // Handler for toggling data flow diagram view
  const handleToggleDataFlow = useCallback(() => {
    // Toggle the state
    setIsDataFlowActive(prevState => {
      const newState = !prevState;
      console.log('Toggling data flow diagram view:', newState ? 'ON' : 'OFF');
      
      if (newState) {
        // Save current diagram state if needed
        if (!isDataFlowActive && nodes.length > 0) {
          originalDiagramRef.current = {
            nodes: [...nodes],
            edges: [...edges]
          };
        }
        
        // Switch to data flow diagram (empty)
        setNodes([]);
        setEdges([]);
      } else {
        // Switch back to original diagram
        setNodes(originalDiagramRef.current.nodes);
        setEdges(originalDiagramRef.current.edges);
      }
      
      return newState;
    });
  }, [isDataFlowActive, nodes, edges, setNodes, setEdges]);

  // AIFlowDiagram.tsx
  return (
    <div className="h-full w-full flex flex-col">
      <DiagramActions
        viewMode={viewMode}
        onSwitchView={onSwitchView}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onCopy={onCopy}
        onPaste={onPaste}
        onUndo={onUndo}
        onRedo={onRedo}
        onComment={onComment}
        onToggleDataFlow={handleToggleDataFlow}
        onGenerateReport={handleGenerateReport}
        onSave={handleSave}
      />
      <div className="flex-1 overflow-hidden bg-white relative">
        {/* Display a watermark for DFD mode */}
        {viewMode === 'DFD' && (
          <div className="absolute top-2 right-2 bg-securetrack-purple/10 text-securetrack-purple px-3 py-1 rounded text-sm font-medium z-10">
            Threat Model View
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={viewMode === 'AD' ? handleNodesChange : undefined}
          onEdgesChange={viewMode === 'AD' ? onEdgesChange : undefined}
          onConnect={viewMode === 'AD' ? handleConnect : undefined}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onInit={onInit}
          fitView
          attributionPosition="bottom-right"
          panOnScroll
          zoomOnScroll
          selectionOnDrag={viewMode === 'AD'} // Only allow selection in AD mode
          nodesDraggable={viewMode === 'AD'} // Only allow dragging in AD mode
          nodesConnectable={viewMode === 'AD'} // Only allow connections in AD mode
          elementsSelectable={viewMode === 'AD'} // Only allow selection in AD mode
        >
          <MiniMap
            nodeStrokeColor={(n) => (n.selected ? '#ff0072' : '#7C65F6')}
            nodeColor={(n) => {
              const nodeType = n.data?.nodeType;
              return nodeType ? '#FF9900' : '#ffffff';
            }}
            nodeBorderRadius={8}
          />
          <Background gap={12} size={1} color="#f8f8f8" />
          
          {/* Add the FlowLegend component with dynamic edges and nodes */}
          <FlowLegend edges={edges} nodes={nodes} />
          
          <Panel position="top-right" className="flex gap-2">
            {viewMode === 'AD' && (
              <>
                <div className="p-2 bg-white rounded shadow-sm text-xs">
                  <span className="font-bold">{edges.length}</span> connections
                </div>
                <button
                  onClick={handleLayout}
                  className="p-2 bg-white rounded shadow-sm text-xs hover:bg-gray-100 transition-colors"
                  disabled={effectiveIsLayouting}
                >
                  {effectiveIsLayouting ? 'Arranging...' : 'Auto-arrange'}
                </button>
              </>
            )}
            {viewMode === 'DFD' && (
              <div className="p-2 bg-securetrack-lightpurple/15 rounded shadow-sm text-xs text-securetrack-purple">
                Threat Model View Active
              </div>
            )}
          </Panel>
        </ReactFlow>
      </div>

      {/* Show edit node dialog only in AD mode */}
      {viewMode === 'AD' && editNodeDialogOpen && currentEditNode && (
        <EditNodeDialog
          open={editNodeDialogOpen}
          onOpenChange={setEditNodeDialogOpen}
          node={currentEditNode}
          onSave={handleSaveNodeEdit}
        />
      )}
    </div>
  );
};

export default AIFlowDiagram;



// import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import {
//   ReactFlow,
//   MiniMap,
//   Background,
//   useNodesState,
//   useEdgesState,
//   ReactFlowInstance,
//   Connection,
//   Panel,
//   MarkerType,
//   Node,
//   Edge,
// } from '@xyflow/react';
// import '@xyflow/react/dist/style.css';
// import CustomNode from './customNode';
// import CommentNode from './CommentNode';
// import EditNodeDialog from './EditNodeDialog';
// import { AIFlowDiagramProps } from './types/diagramTypes';
// import { useDiagramNodes } from './hooks/useDiagramNodes';
// import { edgeStyles } from './utils/edgeStyles';
// import DiagramActions from './DiagramActions';
// import dagre from 'dagre';
// import './AIFlowDiagram.css';


// // Layout algorithm function - uses dagre to calculate node positions
// export const getLayoutedElements = (nodes, edges, direction = 'TB', nodeWidth = 172, nodeHeight = 36) => {
//   if (!nodes || nodes.length === 0) {
//     console.warn('No nodes provided for layout');
//     return { nodes: [], edges: [] };
//   }

//   try {
//     // Create a new graph
//     const dagreGraph = new dagre.graphlib.Graph();
//     dagreGraph.setDefaultEdgeLabel(() => ({}));
//     dagreGraph.setGraph({ rankdir: direction });

//     // Add nodes to the graph with dimensions
//     nodes.forEach((node) => {
//       const width = node.data?.width || nodeWidth; 
//       const height = node.data?.height || nodeHeight;
//       dagreGraph.setNode(node.id, { 
//         width: width, 
//         height: height 
//       });
//     });

//     // Add edges to the graph
//     if (edges && edges.length > 0) {
//       edges.forEach((edge) => {
//         if (edge.source && edge.target) {
//           dagreGraph.setEdge(edge.source, edge.target);
//         }
//       });
//     }

//     // Run the layout algorithm
//     dagre.layout(dagreGraph);

//     // Get the positions from the layout algorithm
//     const layoutedNodes = nodes.map((node) => {
//       const nodeWithPosition = dagreGraph.node(node.id);
      
//       if (!nodeWithPosition) {
//         console.warn(`Node ${node.id} not found in layout results`);
//         return node;
//       }

//       const useExistingPosition = node.position && node.position.x !== 0 && node.position.y !== 0;
      
//       return {
//         ...node,
//         // Only set position if the node doesn't already have one or is a new node
//         position: node.position && 
//                  node.position.x !== undefined && 
//                  node.position.y !== undefined && 
//                  node.position.x !== 0 && 
//                  node.position.y !== 0
//           ? node.position 
//           : {
//               x: nodeWithPosition.x - nodeWidth / 2,
//               y: nodeWithPosition.y - nodeHeight / 2,
//             },
//       };
//     });

//     return { nodes: layoutedNodes, edges };
//   } catch (error) {
//     console.error('Error in layout algorithm:', error);
//     return { nodes, edges }; // Return original nodes and edges on error
//   }
// };

// const AIFlowDiagram: React.FC<AIFlowDiagramProps> = ({
//   nodes: initialNodes,
//   edges: initialEdges,
//   setNodes: setNodesExternal,
//   setEdges: setEdgesExternal,
//   viewMode,
//   onSwitchView,
//   onZoomIn,
//   onZoomOut,
//   onFitView,
//   onCopy,
//   onPaste,
//   onUndo,
//   onRedo,
//   onComment,
//   onGenerateReport,
//   onSave,
//   onLayout,
//   isLayouting: externalIsLayouting,
// }) => {
//   // Add state for layout functionality if not provided from parent
//   const [internalIsLayouting, setInternalIsLayouting] = useState(false);
//   const effectiveIsLayouting = externalIsLayouting !== undefined ? externalIsLayouting : internalIsLayouting;
  
//   // Add state for data flow diagram toggle
//   const [isDataFlowActive, setIsDataFlowActive] = useState(false);
//   // Store the original diagram nodes and edges
//   const originalDiagramRef = useRef({ nodes: [], edges: [] });
//   // Store the data flow diagram nodes and edges
//   const dataFlowDiagramRef = useRef({ nodes: [], edges: [] });
  
//   const previousNodesLengthRef = useRef(initialNodes?.length || 0);
//   const previousEdgesLengthRef = useRef(initialEdges?.length || 0);
//   const layoutTimeoutRef = useRef(null);
//   const initialRenderRef = useRef(true);

//   // For performance optimization and smoother interactions
//   const nodesCountRef = useRef(initialNodes?.length || 0);
//   const edgesCountRef = useRef(initialEdges?.length || 0);
  
//   // Register custom node types
//   const nodeTypes = useMemo(() => ({
//     default: CustomNode,
//     comment: CommentNode,
//   }), []);

//   // Default edge options
//   const defaultEdgeOptions = useMemo(() => ({
//     type: 'smoothstep',
//     markerEnd: {
//       type: MarkerType.ArrowClosed,
//       width: 20,
//       height: 20,
//       color: '#555',
//     },
//     style: {
//       strokeWidth: 2,
//       stroke: '#555',
//     },
//   }), []);

//   const reactFlowInstance = useRef(null);
//   const [didFitView, setDidFitView] = useState(false);

//   // Use ReactFlow hooks to manage nodes and edges with stabilized initial values
//   const [nodes, setNodes, onNodesChange] = useNodesState(
//     initialNodes && initialNodes.length > 0 ? initialNodes : []
//   );
//   const [edges, setEdges, onEdgesChange] = useEdgesState(
//     initialEdges && initialEdges.length > 0 ? initialEdges : []
//   );

//   // Sync internal state with external state - with debouncing for drag operations
//   const isInitialMount = useRef(true);
//   const dragTimeoutRef = useRef(null);
//   const isDragging = useRef(false);
//   const hasSyncedInitialData = useRef(false);

//   // Optimized node change handler to prevent unnecessary updates
//   const handleNodesChange = useCallback((changes) => {
//     // Track if we're currently dragging nodes
//     const isDraggingNow = changes.some(change => 
//       change.type === 'position' && change.dragging === true
//     );
    
//     // Update dragging state for our debounced state sync
//     if (isDraggingNow) {
//       isDragging.current = true;
//     }
  
//     onNodesChange(changes);
//   }, [onNodesChange]);

//   // Use custom hook to manage nodes and their interactions
//   const {
//     editNodeDialogOpen,
//     setEditNodeDialogOpen,
//     currentEditNode,
//     prepareNodes,
//     handleConnect: hookHandleConnect,
//     handleAddNode,
//     handleSaveNodeEdit,
//   } = useDiagramNodes(nodes, edges, setNodes, setEdges);

//   // Process edge data to ensure proper rendering
//   const processEdges = useCallback((edgesToProcess) => {
//     if (!Array.isArray(edgesToProcess) || edgesToProcess.length === 0) {
//       return [];
//     }

//     return edgesToProcess.map(edge => {
//       if (!edge.source || !edge.target) {
//         console.warn('Skipping invalid edge:', edge);
//         return null;
//       }

//       // Determine edge type
//       const edgeType = edge.type || 'smoothstep';
      
//       // Get styling for this edge type
//       const typeStyle = edgeStyles[edgeType] || edgeStyles.dataFlow || {};
      
//       return {
//         ...edge,
//         id: edge.id || `edge-${edge.source}-${edge.target}-${Date.now()}`,
//         type: 'smoothstep', // Force consistency in edge type
//         animated: edgeType === 'dataFlow' || edgeType === 'database',
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 15,
//           height: 15,
//           color: typeStyle.stroke || '#555'
//         },
//         style: {
//           strokeWidth: 2,
//           stroke: typeStyle.stroke || '#555',
//           ...(edge.style || {}),
//         }
//       };
//     }).filter(Boolean);
//   }, []);

//   // Handle initial sync of nodes and edges - ONCE only
//   useEffect(() => {
//     if (initialRenderRef.current && initialNodes && initialNodes.length > 0) {
//       console.log('Initial sync of nodes and edges');
//       // First process nodes
//       const preparedNodes = prepareNodes(initialNodes);
      
//       // Then process edges
//       const processedEdges = initialEdges && initialEdges.length > 0 
//         ? processEdges(initialEdges) 
//         : [];
      
//       // Update state
//       setNodes(preparedNodes);
//       setEdges(processedEdges);
      
//       // Store original diagram for toggling
//       originalDiagramRef.current = {
//         nodes: preparedNodes,
//         edges: processedEdges
//       };
      
//       // Create empty data flow diagram (no nodes, no edges)
//       dataFlowDiagramRef.current = {
//         nodes: [],
//         edges: []
//       };
      
//       // Mark initial render as complete
//       initialRenderRef.current = false;
//       hasSyncedInitialData.current = true;
//     }
//   }, [initialNodes, initialEdges, prepareNodes, processEdges, setNodes, setEdges]);

//   // Apply layout when nodes or edges change significantly - but NOT on initial render
//   useEffect(() => {
//     // Skip if not yet synced initial data, or no nodes, or currently layouting
//     if (
//       !hasSyncedInitialData.current || 
//       initialNodes.length === 0 || 
//       effectiveIsLayouting ||
//       initialRenderRef.current
//     ) {
//       return;
//     }
    
//     // Check if nodes or edges count changed (something added or removed)
//     const nodesCountChanged = initialNodes.length !== previousNodesLengthRef.current;
//     const edgesCountChanged = initialEdges.length !== previousEdgesLengthRef.current;
    
//     // Update the refs with current counts
//     previousNodesLengthRef.current = initialNodes.length;
//     previousEdgesLengthRef.current = initialEdges.length;
    
//     // If something changed, apply layout with a delay
//     if ((nodesCountChanged || edgesCountChanged)) {
//       // Clear any existing timeout
//       if (layoutTimeoutRef.current) {
//         clearTimeout(layoutTimeoutRef.current);
//       }
      
//       if (setInternalIsLayouting) setInternalIsLayouting(true);
      
//       // Apply layout with a slight delay to batch changes
//       layoutTimeoutRef.current = setTimeout(() => {
//         // First prepare nodes with proper styles
//         const preparedNodes = prepareNodes(initialNodes);
//         // Then process edges with proper styling
//         const processedEdges = processEdges(initialEdges);
        
//         // Now apply layout
//         const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
//           preparedNodes,
//           processedEdges
//         );
        
//         // Update the nodes with new positions
//         setNodes(layoutedNodes);
//         setEdges(layoutedEdges);
        
//         // Wait a bit and then fit view to show all elements
//         setTimeout(() => {
//           if (reactFlowInstance.current) {
//             reactFlowInstance.current.fitView({ padding: 0.2 });
//           }
//           if (setInternalIsLayouting) setInternalIsLayouting(false);
//         }, 300);
//       }, 200);
//     }
    
//     return () => {
//       if (layoutTimeoutRef.current) {
//         clearTimeout(layoutTimeoutRef.current);
//       }
//     };
//   }, [initialNodes, initialEdges, effectiveIsLayouting, prepareNodes, processEdges, setNodes, setEdges]);

//   // Handle node position changes more efficiently to prevent flickering
//   useEffect(() => {
//     // Skip on initial mount
//     if (isInitialMount.current) {
//       isInitialMount.current = false;
//       return;
//     }
    
//     // Don't do immediate state updates when we're dragging or layouting
//     if (isDragging.current || effectiveIsLayouting) {
//       // Clear any existing timeout
//       if (dragTimeoutRef.current) {
//         clearTimeout(dragTimeoutRef.current);
//       }
      
//       // Set a new timeout to sync state after dragging stops
//       dragTimeoutRef.current = setTimeout(() => {
//         if (nodes.length > 0 && setNodesExternal) {
//           setNodesExternal(nodes);
//         }
//         isDragging.current = false;
//       }, 100);
//     } else if (nodes.length > 0 && setNodesExternal) {
//       // Not dragging - sync immediately for other updates
//       setNodesExternal(nodes);
//     }
    
//     // Cleanup timeout on unmount
//     return () => {
//       if (dragTimeoutRef.current) {
//         clearTimeout(dragTimeoutRef.current);
//       }
//     };
//   }, [nodes, setNodesExternal, effectiveIsLayouting]);

//   // Edge sync - don't update during layouting
//   useEffect(() => {
//     if (!effectiveIsLayouting && edges.length > 0 && setEdgesExternal) {
//       setEdgesExternal(edges);
//     }
//   }, [edges, setEdgesExternal, effectiveIsLayouting]);

//   // Handle connect event
//   const handleConnect = useCallback(
//     (params) => {
//       console.log('Connection created:', params);
//       const newEdge = {
//         ...params,
//         type: 'smoothstep',
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 15,
//           height: 15,
//           color: '#555',
//         },
//         style: {
//           strokeWidth: 2,
//           stroke: '#555',
//         }
//       };
//       hookHandleConnect(newEdge);
//     },
//     [hookHandleConnect]
//   );

//   // Internal layout function if no external one is provided
//   const internalOnLayout = useCallback(() => {
//     console.log('Applying internal layout, nodes:', nodes.length);
//     if (effectiveIsLayouting || nodes.length === 0) return;
    
//     if (setInternalIsLayouting) setInternalIsLayouting(true);
    
//     // Get current nodes and edges
//     const currentNodes = nodes;
//     const currentEdges = edges;
    
//     // Apply layout
//     const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
//       currentNodes,
//       currentEdges,
//       'TB',  // Top to Bottom direction
//       172,   // Node width
//       36     // Node height
//     );
    
//     // Update state
//     console.log('Setting layouted nodes:', layoutedNodes.length);
//     setNodes(layoutedNodes);
//     setEdges(layoutedEdges);
    
//     // Fit view and reset layout flag
//     setTimeout(() => {
//       if (reactFlowInstance.current) {
//         reactFlowInstance.current.fitView({ padding: 0.2 });
//       }
//       if (setInternalIsLayouting) setInternalIsLayouting(false);
//     }, 300);
//   }, [nodes, edges, setNodes, setEdges, effectiveIsLayouting, setInternalIsLayouting]);

//   // Add this effect to handle switching between viewModes
//   useEffect(() => {
//     // When switching to DFD mode, we need to handle the DFD visualization
//     if (viewMode === 'DFD') {
//       // We'll let ModelWithAI handle fetching and setting the data
//       // console.log('AIFlowDiagram: DFD mode active');
//     } else {
//       // console.log('AIFlowDiagram: AD mode active');
//     }
//   }, [viewMode]);

//   // Use external layout function if provided, otherwise use internal
//   const handleLayout = useCallback(() => {
//     console.log('Layout triggered, using:', onLayout ? 'external' : 'internal');
//     if (onLayout) {
//       onLayout();
//     } else {
//       internalOnLayout();
//     }
//   }, [onLayout, internalOnLayout]);

//   // Handle zoom in action
//   const handleZoomIn = () => {
//     if (reactFlowInstance.current) {
//       reactFlowInstance.current.zoomIn();
//     }
//     if (onZoomIn) {
//       onZoomIn();
//     }
//   };

//   // Handle zoom out action
//   const handleZoomOut = () => {
//     if (reactFlowInstance.current) {
//       reactFlowInstance.current.zoomOut();
//     }
//     if (onZoomOut) {
//       onZoomOut();
//     }
//   };

//   // Handle fit view action
//   const handleFitView = () => {
//     if (reactFlowInstance.current) {
//       reactFlowInstance.current.fitView({ padding: 0.2 });
//     }
//     if (onFitView) {
//       onFitView();
//     }
//   };

//   // Handle save action
//   const handleSave = () => {
//     console.log('Saving diagram...', nodes?.length, 'nodes and', edges?.length, 'edges');
//     if (onSave) {
//       onSave();
//     }
//   };

//   // Handle generate report action
//   const handleGenerateReport = () => {
//     console.log('Generating report...');
//     if (onGenerateReport) {
//       return onGenerateReport();
//     }
//     return '/report';
//   };

//   // Store the instance of ReactFlow when it's initialized
//   const onInit = useCallback((instance) => {
//     reactFlowInstance.current = instance;
//     console.log('ReactFlow instance initialized');

//     // Force a fit view after a short delay
//     setTimeout(() => {
//       if (reactFlowInstance.current && !didFitView) {
//         console.log('Fitting view to diagram content');
//         reactFlowInstance.current.fitView({ padding: 0.2 });
//         setDidFitView(true);
        
//         // Apply initial layout if we have multiple nodes
//         if (nodes.length > 1) {
//           console.log('Applying initial layout');
//           handleLayout();
//         }
//       }
//     }, 200);
//   }, [didFitView, handleLayout, nodes.length]);

//   // andler for toggling data flow diagram view
//   const handleToggleDataFlow = useCallback(() => {
//     // Toggle the state
//     setIsDataFlowActive(prevState => {
//       const newState = !prevState;
//       console.log('Toggling data flow diagram view:', newState ? 'ON' : 'OFF');
      
//       if (newState) {
//         // Save current diagram state if needed
//         if (!isDataFlowActive && nodes.length > 0) {
//           originalDiagramRef.current = {
//             nodes: [...nodes],
//             edges: [...edges]
//           };
//         }
        
//         // Switch to data flow diagram (empty)
//         setNodes([]);
//         setEdges([]);
//       } else {
//         // Switch back to original diagram
//         setNodes(originalDiagramRef.current.nodes);
//         setEdges(originalDiagramRef.current.edges);
//       }
      
//       return newState;
//     });
//   }, [isDataFlowActive, nodes, edges, setNodes, setEdges]);

//   // Display loading state if no nodes yet and not in DFD mode
//   if (!nodes || (nodes.length === 0 && !isDataFlowActive)) {
//     return (
//       <div className="h-full w-full flex flex-col items-center justify-center">
//         <p>Loading diagram...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="h-full w-full flex flex-col">
//       <DiagramActions
//         viewMode={viewMode}
//         onSwitchView={onSwitchView}
//         onZoomIn={handleZoomIn}
//         onZoomOut={handleZoomOut}
//         onFitView={handleFitView}
//         onCopy={onCopy}
//         onPaste={onPaste}
//         onUndo={onUndo}
//         onRedo={onRedo}
//         onComment={onComment}
//         onToggleDataFlow={handleToggleDataFlow}
//         onGenerateReport={handleGenerateReport}
//         onSave={handleSave}
//       />
//       <div className="flex-1 overflow-hidden bg-white relative">
//         {/* Display a watermark for DFD mode */}
//         {viewMode === 'DFD' && (
//           <div className="absolute top-2 right-2 bg-securetrack-purple/10 text-securetrack-purple px-3 py-1 rounded text-sm font-medium z-10">
//             Threat Model View
//           </div>
//         )}
//         <ReactFlow
//           nodes={nodes}
//           edges={edges}
//           onNodesChange={viewMode === 'AD' ? handleNodesChange : undefined}
//           onEdgesChange={viewMode === 'AD' ? onEdgesChange : undefined}
//           onConnect={viewMode === 'AD' ? handleConnect : undefined}
//           nodeTypes={nodeTypes}
//           defaultEdgeOptions={defaultEdgeOptions}
//           onInit={onInit}
//           fitView
//           attributionPosition="bottom-right"
//           panOnScroll
//           zoomOnScroll
//           selectionOnDrag={viewMode === 'AD'} // Only allow selection in AD mode
//           nodesDraggable={viewMode === 'AD'} // Only allow dragging in AD mode
//           nodesConnectable={viewMode === 'AD'} // Only allow connections in AD mode
//           elementsSelectable={viewMode === 'AD'} // Only allow selection in AD mode
//         >
//           <MiniMap
//             nodeStrokeColor={(n) => (n.selected ? '#ff0072' : '#7C65F6')}
//             nodeColor={(n) => {
//               const nodeType = n.data?.nodeType;
//               return nodeType ? '#FF9900' : '#ffffff';
//             }}
//             nodeBorderRadius={8}
//           />
//           <Background gap={12} size={1} color="#f8f8f8" />
//           <Panel position="top-right" className="flex gap-2">
//             {viewMode === 'AD' && (
//               <>
//                 <div className="p-2 bg-white rounded shadow-sm text-xs">
//                   <span className="font-bold">{edges.length}</span> connections
//                 </div>
//                 <button
//                   onClick={handleLayout}
//                   className="p-2 bg-white rounded shadow-sm text-xs hover:bg-gray-100 transition-colors"
//                   disabled={effectiveIsLayouting}
//                 >
//                   {effectiveIsLayouting ? 'Arranging...' : 'Auto-arrange'}
//                 </button>
//               </>
//             )}
//             {viewMode === 'DFD' && (
//               <div className="p-2 bg-securetrack-lightpurple/15 rounded shadow-sm text-xs text-securetrack-purple">
//                 Threat Model View Active
//               </div>
//             )}
//           </Panel>
//           {/* <Panel position="top-right" className="flex gap-2">
//             {!isDataFlowActive && (
//               <>
//                 <div className="p-2 bg-white rounded shadow-sm text-xs">
//                   <span className="font-bold">{edges.length}</span> connections
//                 </div>
//                 <button
//                   onClick={handleLayout}
//                   className="p-2 bg-white rounded shadow-sm text-xs hover:bg-gray-100 transition-colors"
//                   disabled={effectiveIsLayouting}
//                 >
//                   {effectiveIsLayouting ? 'Arranging...' : 'Auto-arrange'}
//                 </button>
//               </>
//             )}
//             {isDataFlowActive && (
//               <div className="p-2 bg-securetrack-lightpurple/15 rounded shadow-sm text-xs text-securetrack-purple">
//                 Data Flow Diagram View Active
//               </div>
//             )}
//           </Panel> */}
//         </ReactFlow>
//       </div>

//       {/* Show edit node dialog only in AD mode */}
//       {viewMode === 'AD' && editNodeDialogOpen && currentEditNode && (
//         <EditNodeDialog
//           open={editNodeDialogOpen}
//           onOpenChange={setEditNodeDialogOpen}
//           node={currentEditNode}
//           onSave={handleSaveNodeEdit}
//         />
//       )}
//     </div>
//   );
// };

// export default AIFlowDiagram;
