import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
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
import './AIFlowDiagram.css';
import { AlertTriangle, Loader2, EyeOff, Eye } from 'lucide-react';
import { runThreatAnalysis } from '@/services/designService';
import { useToast } from '@/hooks/use-toast';
import { ThreatItem } from '@/interfaces/aiassistedinterfaces';
import ThreatPanel from './ThreatPanel';
import RemoteSvgIcon from './icons/RemoteSvgIcon';
import LayerGroupNode from './LayerGroupNode';
import { createLayerContainers } from './utils/layerUtils';
import MermaidCanvas, { MermaidCanvasRef } from './MermaidCanvas';
import { fetchDataFlow, fetchFlowchart } from '@/services/dataFlowService';
import { DataFlowRequest } from '@/types/dataFlowTypes';
import { useTheme } from '@/contexts/ThemeContext';

// Helper function to check if two arrays of nodes or edges are deeply equal by comparing their essential properties
const areArraysEqual = (arr1: any[], arr2: any[], isNodes = true) => {
  if (!arr1 || !arr2) return arr1 === arr2;
  if (arr1.length !== arr2.length) return false;
  
  // Create a map of IDs to array indices for faster lookups
  const map2 = new Map(arr2.map((item, index) => [item.id, index]));
  
  // Check each item in arr1 exists in arr2 with the same essential properties
  return arr1.every(item1 => {
    // Get the corresponding item from arr2
    const index2 = map2.get(item1.id);
    if (index2 === undefined) return false;
    
    const item2 = arr2[index2];
    
    if (isNodes) {
      // For nodes, check position and essential data properties
      return (
        item1.position?.x === item2.position?.x &&
        item1.position?.y === item2.position?.y &&
        item1.data?.label === item2.data?.label &&
        item1.data?.nodeType === item2.data?.nodeType &&
        item1.data?.description === item2.data?.description
      );
    } else {
      // For edges, check source, target, and type
      return (
        item1.source === item2.source &&
        item1.target === item2.target &&
        item1.type === item2.type
      );
    }
  });
};

// getLayoutedElements removed – layout is now owned by the parent component

export interface AIFlowDiagramHandle {
  toggleSequence: () => void;
  toggleFlowchart: () => void;
  isSequenceActive: () => boolean;
  isFlowchartActive: () => boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
}

const AIFlowDiagram = forwardRef<AIFlowDiagramHandle, AIFlowDiagramProps>(({
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
  lastLayoutResult,
  reactFlowInstanceRef,
  projectId,
  // Toggle functions for diagram views
  onToggleDataFlow,
  onToggleFlowchart,
  // State for active views
  isDataFlowActive,
  isFlowchartActive,
  // Threat analysis functionality
  onRunThreatAnalysis,
  runningThreatAnalysis: externalRunningThreatAnalysis,
}, ref): React.ReactNode => {
  // Add theme hook
  const { theme } = useTheme();
  
  // Add a ref for the diagram container to capture it as an image
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  
  // Add state for layout functionality if not provided from parent
  const [internalIsLayouting, setInternalIsLayouting] = useState(false);
  const effectiveIsLayouting = externalIsLayouting !== undefined ? externalIsLayouting : internalIsLayouting;
  
  // Add state for data flow diagram toggle
  const [internalIsSequenceActive, setInternalIsSequenceActive] = useState(false);
  const [sequenceMermaid, setSequenceMermaid] = useState<string>('');
  const [isGeneratingSequence, setIsGeneratingSequence] = useState(false);

  // State for Mermaid flowchart diagram toggle
  const [internalIsFlowchartActive, setInternalIsFlowchartActive] = useState(false);
  const [flowchartMermaid, setFlowchartMermaid] = useState<string>('');
  const [isGeneratingFlowchart, setIsGeneratingFlowchart] = useState(false);

  // Use external state if provided, otherwise use internal state
  const effectiveIsSequenceActive = isDataFlowActive !== undefined ? isDataFlowActive : internalIsSequenceActive;
  const effectiveIsFlowchartActive = isFlowchartActive !== undefined ? isFlowchartActive : internalIsFlowchartActive;

  const [diagramDirty, setDiagramDirty] = useState(false);
  // Add state to control empty canvas view visibility
  const [showEmptyCanvas, setShowEmptyCanvas] = useState(true);
  // Add state for minimap visibility with localStorage persistence
  const [showMinimap, setShowMinimap] = useState(() => {
    // Try to get the stored preference from localStorage
    const storedPreference = localStorage.getItem('diagramMinimapVisible');
    // If there's a stored preference, use it; otherwise default to true
    return storedPreference === null ? true : storedPreference === 'true';
  });
  
  // Add state for auto-zoom when selecting threats (default to OFF)
  const [isAutoZoomEnabled, setIsAutoZoomEnabled] = useState(false);
  
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
    layerGroup: LayerGroupNode,
  }), []);

  // Default edge options with theme-aware styling
  const defaultEdgeOptions = useMemo(() => ({
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 12, 
      height: 12,
      color: theme === 'dark' ? '#e5e7eb' : '#333',
    },
    style: {
      strokeWidth: 1.5,
      stroke: theme === 'dark' ? '#e5e7eb' : '#333',
    },
    animated: false,
    pathOptions: {
      curvature: 0.1, // Minimal curvature
      offset: 0
    }
  }), [theme]);

  const reactFlowInstance = useRef(null);
  const mermaidCanvasRef = useRef<MermaidCanvasRef>(null);
  const [didFitView, setDidFitView] = useState(false);

  // Use ReactFlow hooks to manage nodes and edges with stabilized initial values
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialNodes && initialNodes.length > 0 ? initialNodes : []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges && initialEdges.length > 0 ? initialEdges : []
  );

  // Add refs to track update state
  const isUpdatingNodesRef = useRef(false);
  const isUpdatingEdgesRef = useRef(false);

  // *** OPTIMIZE: Log when the initialNodes prop changes ***
  useEffect(() => {
    // Skip if we're currently updating nodes from this effect already
    if (isUpdatingNodesRef.current) return;
    
    // Skip updates if we're currently dragging nodes
    if (isDragging.current) return;
    
    // Only log during development and with fewer details
    if (process.env.NODE_ENV === 'development') {
      // console.log('[AIFlowDiagram] initialNodes received:', initialNodes?.length);
    }
    
    // CRITICAL FIX: Only update internal state when the prop changes and differs from current state
    // Compare lengths first for performance, then do a deep check only if needed
    if (initialNodes?.length !== nodes.length || !areArraysEqual(initialNodes || [], nodes, true)) {
      // Set flag to prevent re-entry
      isUpdatingNodesRef.current = true;
      setNodes(initialNodes || []);
      // Reset flag after a small delay
      setTimeout(() => {
        isUpdatingNodesRef.current = false;
      }, 0);
    }
    // Don't update if just references changed but content is the same
  }, [initialNodes, nodes]); // Added nodes as dependency for comparison

  // *** OPTIMIZE: Log when the initialEdges prop changes ***
  useEffect(() => {
    // Skip if we're currently updating edges from this effect already
    if (isUpdatingEdgesRef.current) return;
    
    // Only log during development 
    if (process.env.NODE_ENV === 'development') {
      // console.log('[AIFlowDiagram] initialEdges received:', initialEdges?.length);
    }
    
    // CRITICAL FIX: Only update internal state when the prop changes and differs from current state
    if (initialEdges?.length !== edges.length || !areArraysEqual(initialEdges || [], edges, false)) {
      // Set flag to prevent re-entry
      isUpdatingEdgesRef.current = true;
      setEdges(initialEdges || []);
      // Reset flag after a small delay
      setTimeout(() => {
        isUpdatingEdgesRef.current = false;
      }, 0);
    }
    // Don't update if just references changed but content is the same
  }, [initialEdges, edges]); // Added edges as dependency for comparison

  // Threat analysis state
  const { toast } = useToast();
  const [internalRunningThreatAnalysis, setInternalRunningThreatAnalysis] = useState(false);
  const effectiveRunningThreatAnalysis = externalRunningThreatAnalysis !== undefined ? externalRunningThreatAnalysis : internalRunningThreatAnalysis;
  const [threatAnalysisResults, setThreatAnalysisResults] = useState(null);
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<ThreatItem | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Sync internal state with external state - with debouncing for drag operations
  const isInitialMount = useRef(true);
  const dragTimeoutRef = useRef(null);
  const isDragging = useRef(false);
  const hasSyncedInitialData = useRef(false);

  // Handle node position changes more efficiently to prevent flickering
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Skip if we're updating from props to internal state (controlled by refs)
    if (isUpdatingNodesRef.current) {
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
        if (nodes.length > 0 && setNodesExternal && !isUpdatingNodesRef.current) {
          // Only sync if the external nodes are different (prevents loop)
          if (initialNodes?.length !== nodes.length || !areArraysEqual(initialNodes || [], nodes, true)) {
            setNodesExternal(nodes);
          }
        }
      }, 200);
    } else if (nodes.length > 0 && setNodesExternal && !isUpdatingNodesRef.current) {
      // Not dragging - sync immediately for other updates
      // Only sync if the external nodes are different (prevents loop)
      if (initialNodes?.length !== nodes.length || !areArraysEqual(initialNodes || [], nodes, true)) {
        setNodesExternal(nodes);
      }
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, [nodes, setNodesExternal, effectiveIsLayouting, initialNodes]);

  // --- Layer-container refresh logic (debounced & merge to avoid flicker) ---
  const REFRESH_DEBOUNCE_MS = 300; // wait before refreshing to avoid thrashing
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleContainerRefresh = useCallback(() => {
    // Debounce successive calls
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      setNodes((curr) => {
        const regular = curr.filter((n: any) => n.type !== 'layerGroup');
        const existingContainers = curr.filter((n: any) => n.type === 'layerGroup');

        const freshContainers = createLayerContainers(regular as any);

        const TOLERANCE = 1; // px – ignore tiny float jitter

        let didUpdate = false;

        // Merge – reuse unchanged containers to retain React identity
        const mergedContainers = freshContainers.map((fc) => {
          const match = existingContainers.find((ec) => ec.id === fc.id);
          if (!match) {
            didUpdate = true; // brand-new container
            return fc;
          }

          const widthEq =
            Math.abs(Number(match.style?.width ?? 0) - Number(fc.style?.width ?? 0)) <= TOLERANCE;
          const heightEq =
            Math.abs(Number(match.style?.height ?? 0) - Number(fc.style?.height ?? 0)) <= TOLERANCE;
          const xEq = Math.abs(match.position.x - fc.position.x) <= TOLERANCE;
          const yEq = Math.abs(match.position.y - fc.position.y) <= TOLERANCE;

          if (widthEq && heightEq && xEq && yEq) {
            // Nothing important changed – keep the old object to prevent re-mount
            return match;
          }

          // Significant change – mark and update necessary fields while preserving other props
          didUpdate = true;
          return {
            ...match,
            position: fc.position,
            style: {
              ...match.style,
              width: fc.style?.width,
              height: fc.style?.height,
            },
            data: {
              ...match.data,
              childNodeIds: fc.data?.childNodeIds,
            },
          } as any;
        });

        // Also detect removed containers (present previously but not in fresh list)
        if (!didUpdate && existingContainers.length !== mergedContainers.length) {
          didUpdate = true;
        }

        // If nothing meaningfully changed, bail out to avoid needless state churn
        if (!didUpdate) {
          return curr;
        }

        return [...mergedContainers, ...regular] as any;
      });
    }, REFRESH_DEBOUNCE_MS);
  }, [setNodes]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // CRITICAL FIX: Simplified node change handler that prevents layout flicker
  const handleNodesChange = useCallback((changes) => {
    // Apply changes immediately for smooth UI
    onNodesChange(changes);
    
    // CRITICAL: Only handle essential position changes, ignore dimension changes to prevent flicker
    const positionChanges = changes.filter(change => change.type === 'position');
    
    if (positionChanges.length === 0) {
      return; // No position changes, nothing to do
    }
    
    // Track moved nodes
    const movedNodeIds = new Set(positionChanges.map(change => change.id));
    
    // Detect drag state changes
    const dragStartChange = positionChanges.find(change => change.dragging === true);
    const dragEndChange = positionChanges.find(change => 
      change.dragging === false || change.dragging === undefined
    );
    
    if (dragStartChange && !isDragging.current) {
      isDragging.current = true;
    } else if (dragEndChange && isDragging.current) {
      // Mark moved nodes as pinned
      setNodes(prevNodes => prevNodes.map(n =>
        movedNodeIds.has(n.id) ? { ...n, data: { ...n.data, pinned: true } } : n
      ));
      
      // CRITICAL FIX: Simplified sync after drag ends
      setTimeout(() => {
        isDragging.current = false;
        
        // Only sync to parent if not updating from parent
        if (setNodesExternal && !isUpdatingNodesRef.current) {
          setNodesExternal(nodes);
        }
      }, 50); // Reduced timeout for faster response
    }
  }, [onNodesChange, nodes, setNodesExternal, setNodes]);

  // Use custom hook to manage nodes and their interactions
  const {
    editNodeDialogOpen,
    setEditNodeDialogOpen,
    currentEditNode,
    prepareNodes,
    handleConnect: hookHandleConnect,
    handleAddNode,
    handleSaveNodeEdit,
  } = useDiagramNodes(nodes, edges, setNodes, setEdges, onLayout);

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
        type: 'smoothstep',
        animated: edgeType === 'dataFlow' || edgeType === 'database',
        // Enhanced arrow marker for better visibility
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 25, // Increased from 22 to 25
          height: 25, // Increased from 22 to 25
          color: '#000000', // Always use black for better visibility
          markerEndOffset: -50, // Adjusted for larger arrowhead
        },
        style: {
          strokeWidth: 2,
          stroke: '#000000', // Use black for better visibility
          ...(edge.style || {}),
        },
        // Add support for vertical-first routing to encourage top-to-bottom flow
        pathOptions: {
          offset: 10, // Reduced offset for cleaner lines
          vertical: true, // Prefer vertical paths first
        }
      };
    }).filter(Boolean);
  }, []);

  // CRITICAL FIX: Simplified initial sync with validation
  useEffect(() => {
    if (initialRenderRef.current && initialNodes && initialNodes.length > 0) {
      console.log('Initial sync - processing validated nodes and edges');
      
      // Process nodes and edges
      const preparedNodes = prepareNodes(initialNodes, initialEdges || []);
      const processedEdges = processEdges(initialEdges || []);
      
      // Update state once
      setNodes(preparedNodes);
      setEdges(processedEdges);
      
      // Store references
      originalDiagramRef.current = { nodes: preparedNodes, edges: processedEdges };
      dataFlowDiagramRef.current = { nodes: [], edges: [] };
      
      // Mark as complete
      initialRenderRef.current = false;
      hasSyncedInitialData.current = true;
      
      console.log(`Initial sync complete: ${preparedNodes.length} nodes, ${processedEdges.length} edges`);
    }
  }, [initialNodes, initialEdges, prepareNodes, processEdges, setNodes, setEdges]);

  // Edge sync - don't update during layouting or dragging
  useEffect(() => {
    // Skip if we're updating from props to internal state
    if (isUpdatingEdgesRef.current) {
      return;
    }
    
    // Skip edge updates during dragging to prevent issues
    if (isDragging.current) {
      return;
    }
    
    if (!effectiveIsLayouting && edges.length > 0 && setEdgesExternal) {
      // Only sync if the external edges are different (prevents loop)
      if (initialEdges?.length !== edges.length || !areArraysEqual(initialEdges || [], edges, false)) {
        setEdgesExternal(edges);
      }
    }
  }, [edges, setEdgesExternal, effectiveIsLayouting, initialEdges, isDragging]);

  // Handle layout button – delegate to parent component which owns layout
  const handleLayout = useCallback(() => {
    onLayout?.({
      direction: 'LR',
      engine: 'auto',
      enablePerformanceMonitoring: true
    });
  }, [onLayout]);

  // Handle connect event
  const handleConnect = useCallback(
    (params) => {
      // Create the new edge with simple, directional styling
      const newEdge = {
        ...params,
        type: 'smoothstep', 
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: '#333',
        },
        style: {
          strokeWidth: 1.5,
          stroke: '#333',
        },
        pathOptions: {
          curvature: 0.1, // Minimal curvature
          offset: 0
        }
      };
      
      // First add the edge to the local state immediately for visual feedback
      setEdges(prev => [...prev, newEdge]);
      
      // Then use the hook's method to properly handle the connection with proper typing
      hookHandleConnect(newEdge);
    },
    [hookHandleConnect, setEdges]
  );

  // Handle save action
  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  // Handle generate report action
  const handleGenerateReport = () => {
    if (onGenerateReport) {
      return onGenerateReport();
    }
    return '/report';
  };

  // CRITICAL FIX: Simplified onInit that prevents double layout
  const onInit = useCallback((instance) => {
    reactFlowInstance.current = instance;
    if (reactFlowInstanceRef) {
      reactFlowInstanceRef.current = instance;
    }
    console.log('ReactFlow instance initialized');

    // Simple fit view without triggering layout
    setTimeout(() => {
      if (reactFlowInstance.current && !didFitView) {
        console.log('Fitting view to diagram content');
        reactFlowInstance.current.fitView({ padding: 0.2 });
        setDidFitView(true);
      }
    }, 100); // Reduced timeout
  }, [didFitView, reactFlowInstanceRef]);

  // handler for toggling data flow diagram view
  const handleToggleSequence = useCallback(async () => {
    // Use external toggle function if provided, otherwise use internal logic
    if (onToggleDataFlow) {
      onToggleDataFlow();
      return;
    }

    if (!effectiveIsSequenceActive) {
      deactivateOtherViews('sequence');
      // about to enable data flow view
      if (diagramDirty || !sequenceMermaid) {
        try {
          setIsGeneratingSequence(true);
          // Build request body excluding layerGroup nodes
          const cleanNodes = nodes.filter((n) => n.type !== 'layerGroup');
          const requestBody: DataFlowRequest = {
            project_id: projectId || 'default-project',
            nodes: cleanNodes,
            edges: edges,
          };

          console.log('Sequence DataFlowRequest payload:', requestBody);
          const { mermaid_code } = await fetchDataFlow(requestBody, undefined, toast);
          console.log('Sequence DataFlowResponse:', mermaid_code);
          setSequenceMermaid(mermaid_code);
          setDiagramDirty(false);
        } catch (error) {
          console.error('Sequence diagram generation failed:', error);
          return;
        } finally {
          setIsGeneratingSequence(false);
        }
      }
    }

    setInternalIsSequenceActive((prev) => !prev);

  }, [onToggleDataFlow, effectiveIsSequenceActive, diagramDirty, sequenceMermaid, nodes, edges, projectId, toast]);

  // NEW: handler for flowchart generation toggle
  const handleToggleFlowchart = useCallback(async () => {
    // Use external toggle function if provided, otherwise use internal logic
    if (onToggleFlowchart) {
      onToggleFlowchart();
      return;
    }

    if (!effectiveIsFlowchartActive) {
      deactivateOtherViews('flowchart');
      if (diagramDirty || !flowchartMermaid) {
        try {
          setIsGeneratingFlowchart(true);
          const cleanNodes = nodes.filter((n) => n.type !== 'layerGroup');
          const requestBody: DataFlowRequest = {
            project_id: projectId || 'default-project',
            nodes: cleanNodes,
            edges: edges,
          };

          console.log('Flowchart DataFlowRequest payload:', requestBody);
          const { mermaid_code } = await fetchFlowchart(requestBody, undefined, toast);
          console.log('Flowchart DataFlowResponse:', mermaid_code);
          setFlowchartMermaid(mermaid_code);
          setDiagramDirty(false);
        } catch (error) {
          console.error('Flowchart generation failed:', error);
          return;
        } finally {
          setIsGeneratingFlowchart(false);
        }
      }
    }

    setInternalIsFlowchartActive((prev) => !prev);

  }, [onToggleFlowchart, effectiveIsFlowchartActive, diagramDirty, flowchartMermaid, nodes, edges, projectId, toast]);

  // Run threat analysis function
  const handleRunThreatAnalysis = useCallback(async () => {
    try {
      setInternalRunningThreatAnalysis(true);
      
      // Filter out layerGroup nodes first
      const filteredNodes = nodes.filter(node => node.type !== 'layerGroup');
      
      // Clean up the diagram state to ensure only essential properties
      const cleanNodes = filteredNodes.map(node => ({
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
      setInternalRunningThreatAnalysis(false);
    }
  }, [nodes, edges, toast]);

  // Add a state for active severity filter
  const [activeSeverityFilter, setActiveSeverityFilter] = useState('ALL');

  // Process nodes function - pass threats to nodes
  const processNodes = useCallback((nodes) => {
    // Log the total threats and severity filter for debugging
    if (threats && threats.length > 0) {
      console.log(`Processing ${threats.length} threats with filter: ${activeSeverityFilter}`);
      console.log('Threat targets:', threats.map(t => t.target_elements || []).flat());
    }

    return nodes.map(node => {
      // Skip layer and group nodes or nodes without data
      if (node.type === 'layerGroup' || !node.data) {
        return node;
      }

      // Find threats that target this node
      const nodeThreats = threats.filter(threat => {
        if (!threat || !threat.target_elements) return false;
        return threat.target_elements.includes(node.id);
      });
      
      // Only update if we have threats to show
      if (nodeThreats.length > 0) {
        console.log(`Node ${node.id} has ${nodeThreats.length} threats with filter ${activeSeverityFilter}`);
        
        // Log each threat to verify they're being processed properly
        nodeThreats.forEach((threat, index) => {
          console.log(`- Threat ${index+1}: severity=${threat.severity}, target_elements=${threat.target_elements?.join(',')}`);
        });
      }
      
      // Create a new node with the same properties
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          threats: nodeThreats,
          activeSeverityFilter: activeSeverityFilter
        }
      };
      
      // Force data-has-threats attribute for easier CSS targeting
      if (nodeThreats.length > 0) {
        updatedNode.data.hasThreats = true;
      }
      
      return updatedNode;
    });
  }, [threats, activeSeverityFilter]);

  // Add effect to update nodes when threats or filter changes
  useEffect(() => {
    if (threats && threats.length > 0) {
      // console.log(`Processing ${threats.length} threats with filter: ${activeSeverityFilter}`);
      
      // Log unique nodes that are targeted by threats
      const targetedNodeIds = new Set(threats.flatMap(t => t.target_elements || []));
      // console.log(`Threats target ${targetedNodeIds.size} unique nodes: ${Array.from(targetedNodeIds).join(', ')}`);
    }
    
    // Use this temporary function to check if nodes were updated with threats
    const verifyNodesUpdated = (updatedNodes) => {
      const nodesWithThreats = updatedNodes.filter(n => 
        n.data && n.data.threats && n.data.threats.length > 0
      );
      
      if (nodesWithThreats.length > 0) {
        // console.log(`Successfully updated ${nodesWithThreats.length} nodes with threats`);
      } else if (threats && threats.length > 0) {
        // console.warn('No nodes were updated with threats despite having threats available');
      }
      
      return updatedNodes;
    };
    
    setNodes(nodes => verifyNodesUpdated(processNodes(nodes)));
  }, [threats, activeSeverityFilter, processNodes, setNodes]);

  // Add auto-zoom effect when a threat is selected
  useEffect(() => {
    // Skip if auto-zoom is disabled, no threat is selected, or if the reactFlow instance isn't ready
    if (!isAutoZoomEnabled || !selectedThreat || !reactFlowInstance.current) return;
    
    // Get the target elements from the selected threat
    const targetNodeIds = selectedThreat.target_elements || [];
    
    // Skip if the threat doesn't target any specific nodes
    if (targetNodeIds.length === 0) return;
    
    // Find the nodes that are targets of this threat
    const targetNodes = nodes.filter(node => 
      targetNodeIds.includes(node.id)
    );
    
    // Skip if no target nodes found
    if (targetNodes.length === 0) return;
    
    // Create a padding value to give some space around the nodes
    const padding = 0.2; // 20% padding
    
    // console.log('Auto-zooming to threat target nodes:', targetNodeIds);
    
    // Zoom to the target nodes with animation
    setTimeout(() => {
      reactFlowInstance.current.fitView({
        nodes: targetNodes,
        padding,
        duration: 800, // Animation duration in ms
        minZoom: 0.5, // Set a minimum zoom level
        maxZoom: 1.5, // Set a maximum zoom level
      });
    }, 100);
    
  }, [selectedThreat, nodes, isAutoZoomEnabled]);

  // Handler for threat selection (update to include severity filter)
  const handleThreatSelect = useCallback((threat: ThreatItem | null) => {
    if (threat === null || (selectedThreat && selectedThreat.id === threat.id)) {
      // Deselecting current threat, reset view to show all nodes if auto-zoom is enabled
      setSelectedThreat(null);
      
      // Reset the view after a short delay if auto-zoom is enabled
      if (isAutoZoomEnabled) {
        setTimeout(() => {
          if (reactFlowInstance.current && nodes.length > 0) {
            reactFlowInstance.current.fitView({ padding: 0.2, duration: 800 });
          }
        }, 100);
      }
    } else {
      // Selecting a new threat
      setSelectedThreat(threat);
      
      // The zooming will be handled by the useEffect above if auto-zoom is enabled
    }
    
    // If a threat is selected, set the severity filter to match its severity
    if (threat) {
      setActiveSeverityFilter(threat.severity || 'ALL');
    } else {
      setActiveSeverityFilter('ALL');
    }
  }, [selectedThreat, nodes, isAutoZoomEnabled]);

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
        // console.log('Hiding empty canvas because nodes are present:', nodes.length);
        setShowEmptyCanvas(false);
      }
    } else if (initialNodes?.length === 0 && nodes.length === 0) {
      // Only show empty canvas when we truly have no nodes
      if (!showEmptyCanvas) {
        // console.log('Showing empty canvas because no nodes are present');
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
        // console.log('Hiding welcome message because nodes are present:', nodes.length);
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

  // Add this effect to handle switching between viewModes
  useEffect(() => {
    // When switching to DFD mode, we need to handle the DFD visualization
    if (viewMode === 'DFD') {
      // We'll let ModelWithAI handle fetching and setting the data
    }
  }, [viewMode]);

  // Handle zoom in action
  const handleZoomIn = () => {
    if (effectiveIsSequenceActive || effectiveIsFlowchartActive) {
      // For sequence/flowchart diagrams, use MermaidCanvas zoom
      if (mermaidCanvasRef.current) {
        mermaidCanvasRef.current.zoomIn();
      }
    } else {
      // For ReactFlow diagrams, use ReactFlow zoom
      if (reactFlowInstance.current) {
        reactFlowInstance.current.zoomIn();
      }
    }
    if (onZoomIn) {
      onZoomIn();
    }
  };

  // Handle zoom out action
  const handleZoomOut = () => {
    if (effectiveIsSequenceActive || effectiveIsFlowchartActive) {
      // For sequence/flowchart diagrams, use MermaidCanvas zoom
      if (mermaidCanvasRef.current) {
        mermaidCanvasRef.current.zoomOut();
      }
    } else {
      // For ReactFlow diagrams, use ReactFlow zoom
      if (reactFlowInstance.current) {
        reactFlowInstance.current.zoomOut();
      }
    }
    if (onZoomOut) {
      onZoomOut();
    }
  };

  // Handle fit view action
  const handleFitView = () => {
    if (effectiveIsSequenceActive || effectiveIsFlowchartActive) {
      // For sequence/flowchart diagrams, use MermaidCanvas fit view
      if (mermaidCanvasRef.current) {
        mermaidCanvasRef.current.fitView();
      }
    } else {
      // For ReactFlow diagrams, use ReactFlow fit view
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({ padding: 0.2 });
      }
    }
    if (onFitView) {
      onFitView();
    }
  };

  // Add safety mechanism to reset drag state if stuck
  useEffect(() => {
    // Safety timeout to reset dragging state if it gets stuck
    const safetyTimeout = setTimeout(() => {
      if (isDragging.current) {
        // console.log('Safety: Resetting stuck drag state');
        isDragging.current = false;
      }
    }, 3000); // 3 seconds timeout - should be longer than any reasonable drag operation
    
    return () => clearTimeout(safetyTimeout);
  }, [nodes]);   // Run this check whenever nodes change

  useEffect(() => {
    if (!effectiveIsSequenceActive) {
      setDiagramDirty(true);
    }
  }, [nodes, edges, effectiveIsSequenceActive]);

  // Helper to reset other diagram views when one is activated
  const deactivateOtherViews = (view: 'sequence' | 'flowchart') => {
    if (view === 'sequence') {
      setInternalIsFlowchartActive(false);
    } else if (view === 'flowchart') {
      setInternalIsSequenceActive(false);
    }
  };

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    toggleSequence: handleToggleSequence,
    toggleFlowchart: handleToggleFlowchart,
    isSequenceActive: () => effectiveIsSequenceActive,
    isFlowchartActive: () => effectiveIsFlowchartActive,
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    fitView: handleFitView,
  }), [handleToggleSequence, handleToggleFlowchart, effectiveIsSequenceActive, effectiveIsFlowchartActive, handleZoomIn, handleZoomOut, handleFitView]);

  // AIFlowDiagram.tsx
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-hidden relative" ref={diagramContainerRef} data-theme={theme}>
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
                background: theme === 'dark' 
                  ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.4) 0%, rgba(55, 65, 81, 0.3) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(230, 240, 255, 0.3) 100%)',
                backdropFilter: 'blur(12px)',
                border: theme === 'dark' 
                  ? '1px solid rgba(124, 101, 246, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '20px',
                boxShadow: theme === 'dark'
                  ? '0 15px 35px rgba(124, 101, 246, 0.25), 0 5px 15px rgba(124, 101, 246, 0.15), 0 0 0 1px rgba(124, 101, 246, 0.1)'
                  : '0 15px 35px rgba(124, 101, 246, 0.15), 0 5px 15px rgba(124, 101, 246, 0.1), 0 0 0 1px rgba(124, 101, 246, 0.05)',
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
                  background: 'linear-gradient(to right, rgba(124, 101, 246, 0.8), rgba(66, 153, 225, 0.8))',
                  boxShadow: '0 1px 10px rgba(124, 101, 246, 0.3)'
                }}></div>
                
                <div className="welcome-text" style={{
                  color: theme === 'dark' ? '#e5e7eb' : '#2d3748',
                  fontSize: '24px',
                  fontWeight: '600',
                  letterSpacing: '-0.01em',
                  lineHeight: '1.4',
                  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  textShadow: theme === 'dark' 
                    ? '0 1px 1px rgba(0, 0, 0, 0.6)'
                    : '0 1px 1px rgba(255, 255, 255, 0.6)'
                }}>
                  Design your secure architecture with AI assistance
                </div>
                <div style={{
                  marginTop: '16px',
                  color: theme === 'dark' ? '#9ca3af' : '#4a5568',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  opacity: 0.85
                }}>
                  Simply describe your requirements in natural language to generate diagrams
                </div>
                
                {/* Additional subtle decorative element */}
                <div style={{
                  position: 'absolute',
                  bottom: '-30px',
                  right: '-30px',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: theme === 'dark'
                    ? 'radial-gradient(circle, rgba(124, 101, 246, 0.25) 0%, rgba(124, 101, 246, 0) 70%)'
                    : 'radial-gradient(circle, rgba(124, 101, 246, 0.15) 0%, rgba(124, 101, 246, 0) 70%)',
                  zIndex: -1
                }}></div>
              </div>
            </div>
          </div>
        )}
        
        {effectiveIsSequenceActive || effectiveIsFlowchartActive ? (
          <div className="w-full h-full" style={{ position: 'relative', zIndex: 20 }}>
            {isGeneratingSequence || isGeneratingFlowchart ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-securetrack-purple" />
              </div>
            ) : (
              <MermaidCanvas 
                ref={mermaidCanvasRef}
                code={effectiveIsSequenceActive ? sequenceMermaid : flowchartMermaid} 
              />
            )}
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={viewMode === 'AD' ? handleNodesChange : undefined}
            onEdgesChange={viewMode === 'AD' ? onEdgesChange : undefined}
            onConnect={viewMode === 'AD' ? handleConnect : undefined}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onInit={onInit}
            fitView={false}
            fitViewOptions={{
              padding: 0.2,
              includeHiddenNodes: false,
              minZoom: 0.1,
              maxZoom: 1.5
            }}
            attributionPosition="bottom-right"
            panOnScroll
            zoomOnScroll
            selectionOnDrag={viewMode === 'AD'}
            nodesDraggable={true}
            nodesConnectable={viewMode === 'AD'}
            elementsSelectable={viewMode === 'AD'}
            proOptions={{ hideAttribution: true }}
            style={{ position: 'relative', zIndex: 20 }}
            onNodeClick={viewMode === 'AD' ? onNodeClick : undefined}
            onPaneClick={viewMode === 'AD' ? onPaneClick : undefined}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            minZoom={0.1}
            maxZoom={2.0}
          >
            {showMinimap && (
              <MiniMap
                nodeStrokeColor={(n) => (n.selected ? '#ff0072' : '#7C65F6')}
                nodeColor={(n) => {
                  const nodeType = n.data?.nodeType;
                  return nodeType ? '#FF9900' : theme === 'dark' ? '#374151' : '#ffffff';
                }}
                nodeBorderRadius={8}
                style={{ 
                  width: 160, 
                  height: 100,
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#f8f9fb',
                  border: `1px solid ${theme === 'dark' ? 'rgba(124, 101, 246, 0.4)' : 'rgba(124, 101, 246, 0.2)'}`,
                  borderRadius: '6px',
                  zIndex: 5,
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px'
                }}
                maskColor={theme === 'dark' ? 'rgba(124, 101, 246, 0.15)' : 'rgba(124, 101, 246, 0.07)'}
              />
            )}
            
            {/* Minimap toggle button - positioned above the minimap */}
            <Panel position="bottom-left" className="ml-2 mb-2">
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
            
            {/* Dotted background – slightly larger dots & theme-aware color for better visibility */}
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={2}
              color={theme === 'dark' ? '#4b5563' : '#c8c8c8'}
            />
            
            {/* Add a left-side panel for the Run Threat Analysis button */}
            {/* {viewMode === 'AD' && (
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
            )} */}
            
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
        )}
        
        {/* Add Threat Panel when threats are available */}
        {threats.length > 0 && (
          <ThreatPanel 
            threats={threats} 
            onThreatSelect={handleThreatSelect}
            selectedThreat={selectedThreat}
            selectedNode={selectedNode}
            onRunThreatAnalysis={handleRunThreatAnalysis}
            activeSeverityFilter={activeSeverityFilter}
            setActiveSeverityFilter={setActiveSeverityFilter}
            isAutoZoomEnabled={isAutoZoomEnabled}
            setIsAutoZoomEnabled={setIsAutoZoomEnabled}
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
});

export default AIFlowDiagram;

/*
 * TODO – Manual Test Steps for Node Pinning (A–D)
 * A. Drag a single node and release – it should keep its new position after auto-layout runs (data.pinned === true). A 📌 badge must appear.
 * B. Select a node, click the lock button in the floating toolbar – the badge toggles and the next "Auto-arrange" must move it when unlocked.
 * C. Multi-select or lasso-drag several nodes; move them as a group – all moved nodes become pinned (badge visible).
 * D. Save the project, reload the page – nodes that were pinned before should still be pinned and stay fixed after a new layout.
 */
