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
import dagre from 'dagre';
import './AIFlowDiagram.css';
import { AlertTriangle, Loader2, EyeOff, Eye } from 'lucide-react';
import { runThreatAnalysis } from '@/services/designService';
import { useToast } from '@/hooks/use-toast';
import { ThreatItem } from '@/interfaces/aiassistedinterfaces';
import ThreatPanel from './ThreatPanel';
import RemoteSvgIcon from './icons/RemoteSvgIcon';
import { mapNodeTypeToIcon } from '../AI/utils/mapNodeTypeToIcon';


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
  // Add state to control empty canvas view visibility
  const [showEmptyCanvas, setShowEmptyCanvas] = useState(true);
  // Add state for minimap visibility with localStorage persistence
  const [showMinimap, setShowMinimap] = useState(() => {
    // Try to get the stored preference from localStorage
    const storedPreference = localStorage.getItem('diagramMinimapVisible');
    // If there's a stored preference, use it; otherwise default to true
    return storedPreference === null ? true : storedPreference === 'true';
  });
  
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
    animated: false,
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

  // Threat analysis state
  const { toast } = useToast();
  const [runningThreatAnalysis, setRunningThreatAnalysis] = useState(false);
  const [threatAnalysisResults, setThreatAnalysisResults] = useState(null);
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<ThreatItem | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

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
        // Always include markerEnd for arrowhead display
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
      172,   // Node width
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

  // handler for toggling data flow diagram view
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

  // Run threat analysis function
  const handleRunThreatAnalysis = useCallback(async () => {
    try {
      setRunningThreatAnalysis(true);
      
      // Clean up the diagram state to ensure only essential properties
      const cleanNodes = nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          label: node.data?.label,
          description: node.data?.description,
          nodeType: node.data?.nodeType
        }
      }));
      
      const cleanEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        label: edge.label
      }));
      
      // Prepare request
      const request = {
        diagram_state: { 
          nodes: cleanNodes, 
          edges: cleanEdges 
        }
      };
      
      // Get project ID from URL
      const projectId = window.location.pathname.split('/').pop();
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      
      // Call threat analysis API
      const response = await runThreatAnalysis(projectId, request, toast);
      console.log('Threat analysis response:', response);
      
      // Process response
      setThreatAnalysisResults(response);
      setThreats(response.threats || []);
      
      // Show success toast
      const threatCount = response.threats?.length || 0;
      toast({
        title: 'Threat Analysis Complete',
        description: `${threatCount} potential threats identified in your architecture.`,
        variant: 'default',
      });
      
    } catch (error) {
      console.error('Error running threat analysis:', error);
      // Toast is already handled in the service function
    } finally {
      setRunningThreatAnalysis(false);
    }
  }, [nodes, edges, toast]);

  // Handler for threat selection
  const handleThreatSelect = useCallback((threat: ThreatItem | null) => {
    setSelectedThreat(threat);
  }, []);

  // Handler for node selection
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node === selectedNode ? null : node);
  }, [selectedNode]);

  // Toggle minimap visibility and save to localStorage
  const toggleMinimap = useCallback(() => {
    setShowMinimap(prev => {
      const newValue = !prev;
      localStorage.setItem('diagramMinimapVisible', String(newValue));
      return newValue;
    });
  }, []);

  // Handler for clicking on the pane (background)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Use effect to control empty canvas visibility
  useEffect(() => {
    // If we have actual nodes to display, don't show the empty canvas
    if (nodes && nodes.length > 0) {
      // If we have nodes, never show the empty canvas
      if (showEmptyCanvas) {
        console.log('Hiding empty canvas because nodes are present:', nodes.length);
        setShowEmptyCanvas(false);
      }
    } else if (initialNodes?.length === 0 && nodes.length === 0) {
      // Only show empty canvas when we truly have no nodes
      if (!showEmptyCanvas) {
        console.log('Showing empty canvas because no nodes are present');
        setShowEmptyCanvas(true);
      }
    }
  }, [initialNodes, nodes, showEmptyCanvas]);

  // Add state for welcome message visibility
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  
  // Handle welcome message visibility separately from empty canvas
  useEffect(() => {
    // If we have nodes, don't show the welcome message
    if (nodes && nodes.length > 0) {
      if (showWelcomeMessage) {
        console.log('Hiding welcome message because nodes are present:', nodes.length);
        setShowWelcomeMessage(false);
      }
      return;
    }
    
    // Show welcome message briefly if no nodes
    if (!showWelcomeMessage) {
      setShowWelcomeMessage(true);
    }
    
    // Set a timeout to hide after a while
    const timer = setTimeout(() => {
      setShowWelcomeMessage(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [nodes, showWelcomeMessage]);

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
      <div className="flex-1 overflow-hidden relative">
        {/* Modern gradient background */}
        <div className="diagram-background"></div>
        <div className="diagram-pattern"></div>
        
        {/* Display a watermark for DFD mode */}
        {viewMode === 'DFD' && (
          <div className="absolute top-2 right-2 bg-securetrack-purple/10 text-securetrack-purple px-3 py-1 rounded text-sm font-medium z-10">
            Threat Model View
          </div>
        )}
        
        {/* Always visible welcome message overlay that fades out */}
        {/* <div 
          className={`absolute bottom-1 left-1/2 transform -translate-x-1/8 text-center transition-opacity duration-1000 ${showWelcomeMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ zIndex: 5 }}
        >
          <div className="welcome-message px-6 py-4">
            <div className="welcome-text text-gray-800 font-medium text-lg">
              Drag and drop components from toolbar to create your architecture diagram
            </div>
            <div className="text-gray-600 text-base mt-1">
              Or start with AI-generated diagram based on requirements
            </div>
          </div>
        </div> */}
        
        {/* Show empty canvas background without animated placeholder nodes */}
        {showEmptyCanvas && (
          <div className="absolute inset-0 flex items-center justify-center empty-canvas-container" style={{ zIndex: 5 }}>
            <div className="absolute inset-0 diagram-background"></div>
            
            {/* Center welcome message with animation */}
            <div className="w-full h-full flex items-center justify-center">
              <div className="welcome-message px-10 py-8 animate-float-slow" style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(230, 240, 255, 0.3) 100%)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '20px',
                boxShadow: '0 15px 35px rgba(124, 101, 246, 0.15), 0 5px 15px rgba(124, 101, 246, 0.1), 0 0 0 1px rgba(124, 101, 246, 0.05)',
                maxWidth: '650px',
                transform: 'translateZ(0)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Decorative gradient overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '5px',
                  background: 'linear-gradient(90deg, #7C65F6 0%, #FF9900 50%, #4CAF50 100%)',
                  boxShadow: '0 1px 10px rgba(124, 101, 246, 0.3)'
                }}></div>
                
                <div className="welcome-text" style={{
                  color: '#2d3748',
                  fontSize: '24px',
                  fontWeight: '600',
                  letterSpacing: '-0.01em',
                  lineHeight: '1.4',
                  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  textShadow: '0 1px 1px rgba(255, 255, 255, 0.6)'
                }}>
                  Drag and drop components from toolbar to create your architecture diagram
                </div>
                <div style={{
                  marginTop: '16px',
                  color: '#4a5568',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  opacity: 0.85
                }}>
                  Or start with AI-generated diagram based on requirements
                </div>
                
                {/* Additional subtle decorative element */}
                <div style={{
                  position: 'absolute',
                  bottom: '-30px',
                  right: '-30px',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(124, 101, 246, 0.15) 0%, rgba(124, 101, 246, 0) 70%)',
                  zIndex: -1
                }}></div>
              </div>
            </div>
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
          proOptions={{ hideAttribution: true }} // This removes the React Flow watermark
          style={{ position: 'relative', zIndex: 20 }} // Ensure ReactFlow has higher z-index
        >
          {showMinimap && (
            <MiniMap
              nodeStrokeColor={(n) => (n.selected ? '#ff0072' : '#7C65F6')}
              nodeColor={(n) => {
                const nodeType = n.data?.nodeType;
                return nodeType ? '#FF9900' : '#ffffff';
              }}
              nodeBorderRadius={8}
              style={{ 
                width: 160, 
                height: 100,
                backgroundColor: '#f8f9fb',
                border: '1px solid rgba(124, 101, 246, 0.2)',
                borderRadius: '6px',
                zIndex: 5
              }}
              maskColor="rgba(124, 101, 246, 0.07)"
            />
          )}
          
          {/* Minimap toggle button - positioned above the minimap */}
          <Panel position="bottom-right" className="mr-2 mb-2">
            <button
              onClick={toggleMinimap}
              className="minimap-toggle-button"
              title={showMinimap ? "Hide minimap" : "Show minimap"}
            >
              {showMinimap ? (
                <EyeOff size={16} className="text-securetrack-purple opacity-80" />
              ) : (
                <Eye size={16} className="text-securetrack-purple opacity-80" />
              )}
            </button>
          </Panel>
          
          <Background gap={12} size={1} color="#f8f8f8" />
          
          {/* Add a left-side panel for the Run Threat Analysis button */}
          {viewMode === 'AD' && (
            <Panel position="top-left" className="ml-4 mt-3">
              <button
                onClick={handleRunThreatAnalysis}
                disabled={runningThreatAnalysis}
                className="p-2 bg-gradient-to-r from-red-100 to-red-200 rounded shadow-sm text-xs hover:from-red-200 hover:to-red-300 text-red-700 transition-all font-medium flex items-center gap-1 border border-red-200"
              >
                {runningThreatAnalysis ? (
                  <>
                    <Loader2 size={14} className="inline animate-spin" />
                    Running Analysis...
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} className="inline" />
                    Run Threat Analysis
                  </>
                )}
              </button>
            </Panel>
          )}
          
          {/* Keep the original panel but remove the threat analysis button */}
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
        
        {/* Add Threat Panel when threats are available */}
        {threats.length > 0 && (
          <ThreatPanel 
            threats={threats} 
            onThreatSelect={handleThreatSelect}
            selectedThreat={selectedThreat}
            selectedNode={selectedNode}
            onRunThreatAnalysis={handleRunThreatAnalysis}
          />
        )}
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

