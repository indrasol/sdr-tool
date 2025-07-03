import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useDiagramWithAI } from '@/components/AI/hooks/useDiagramWithAI';
import AIChat from '@/components/AI/AIChat';
import DiagramActions from '@/components/AI/DiagramActions';
import DiagramPanel from '@/components/AI/panels/DiagramPanel';
import { Edge, Node } from '@xyflow/react';
import { CustomNodeData } from '@/components/AI/types/diagramTypes';
import ToolbarPanel from '@/components/AI/panels/ToolbarPanel';
import { ChevronRight, ChevronLeft, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import styles from '@/styles/ChatPanel.module.css';
import {
  DesignRequest,
  DesignResponse,
  DFDGenerationStartedResponse,
  ResponseType,
  DFDSwitchRequest,
  FullThreatModelResponse,
  DFDData
} from '@/interfaces/aiassistedinterfaces';
import { sendDesignRequest, generateThreatModel } from '@/services/designService';
import { useDiagramNodes } from '@/components/AI/hooks/useDiagramNodes';
import { edgeStyles, determineEdgeType } from '@/components/AI/utils/edgeStyles';
// Import getLayoutedElements directly from AIFlowDiagram to ensure consistency
import AIFlowDiagram from '@/components/AI/AIFlowDiagram';
import { layoutWithELK } from '@/components/AI/utils/elkLayout';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import DFDVisualization from '@/components/AI/DFDVisualization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuthHeaders, BASE_API_URL, fetchWithTimeout, DEFAULT_TIMEOUT } from '../services/apiService'
import { debounce } from 'lodash';
import { createLayerContainers, determineNodeLayer, getLayerStyle, DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT, LABEL_EXTRA_HEIGHT, LAYER_CONTAINER_PADDING, LAYER_EXTRA_BOTTOM_PADDING } from '@/components/AI/utils/layerUtils';
import LayerGroupNode from '@/components/AI/LayerGroupNode';
import { mapNodeTypeToIcon } from '@/components/AI/utils/mapNodeTypeToIcon'; // Add import for mapNodeTypeToIcon
import { captureDiagramImage } from '@/utils/diagramUtils';
import projectService from '@/services/projectService';


// Interface for proper TypeScript support
interface DiagramPanelEdgesProps {
  setEdges: (edges: any[] | ((prev: any[]) => any[])) => void;
}

// Edge processing function
const processEdges = (edges = [], nodes = []) => {
  if (!Array.isArray(edges) || edges.length === 0) {
    return [];
  }

  // Create a map of existing edge IDs to prevent duplication
  const edgeIdMap = new Map();

  return edges.map(edge => {
    // Skip invalid edges
    if (!edge.source || !edge.target) {
      console.warn('Skipping invalid edge:', edge);
      return null;
    }

    // Ensure edge has an ID
    const edgeId = edge.id || `edge-${edge.source}-${edge.target}`;

    // Skip duplicate edges
    if (edgeIdMap.has(edgeId)) {
      console.warn('Skipping duplicate edge:', edgeId);
      return null;
    }

    edgeIdMap.set(edgeId, true);

    // Determine edge type - Fix the bezier warning by using correct React Flow edge types
    let edgeType = edge.type || determineEdgeType(edge.source, edge.target, nodes);
    
    // Map invalid edge types to valid React Flow edge types
    const validEdgeTypes = ['default', 'straight', 'step', 'smoothstep', 'simplebezier'];
    if (!validEdgeTypes.includes(edgeType)) {
      // Map common invalid types to valid ones
      if (edgeType === 'bezier') {
        edgeType = 'smoothstep'; // Use smoothstep instead of bezier for curved edges
      } else {
        edgeType = 'smoothstep'; // Default to smoothstep for unknown types
      }
    }

    // Get styling for this edge type
    const typeStyle = edgeStyles[edgeType] || edgeStyles.dataFlow || edgeStyles.default || {};

    // Create edge with proper React Flow edge type
    return {
      ...edge,
      id: edgeId,
      type: edgeType, // Use the validated edge type
      animated: edgeType === 'dataFlow' || edgeType === 'database' || edge.animated || false,
      markerEnd: {
        type: 'arrowclosed',
        width: 12,
        height: 12,
        color: typeStyle.stroke || '#333',
      },
      style: {
        strokeWidth: 2,
        stroke: typeStyle.stroke || '#333',
        strokeDasharray: typeStyle.strokeDasharray || 'none',
        ...(typeStyle || {}),
        ...(edge.style || {})
      },
      pathOptions: {
        curvature: edgeType === 'smoothstep' ? 0.15 : 0, // Slight curvature for smooth edges
        offset: 0
      }
    };
  }).filter(Boolean);
};

const ModelWithAI = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Constants for panel sizing
  const fixedExpandedWidth = 650;
  const collapsedWidth = 40;

  // UI state
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [chatPanelWidth, setChatPanelWidth] = useState(fixedExpandedWidth);
  const [isResizingChat, setIsResizingChat] = useState(false);
  const minChatWidth = 500; // Minimum chat panel width
  const maxChatWidth = 600; // Maximum chat panel width

  // Core state
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [thinking, setThinking] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [thinkingStartTime, setThinkingStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Response metadata
  const [responseMetadata, setResponseMetadata] = useState({
    responseType: '',
    confidence: 0,
    classificationSource: 'unknown',
  });
  const [references, setReferences] = useState([]);
  const [showReferences, setShowReferences] = useState(false);
  const [relatedConcepts, setRelatedConcepts] = useState([]);
  const [showRelatedConcepts, setShowRelatedConcepts] = useState(false);
  const [clarificationQuestions, setClarificationQuestions] = useState([]);
  const [showClarificationQuestions, setShowClarificationQuestions] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [architectureUpdated, setArchitectureUpdated] = useState(false);

  // Node and edge update state
  const [isNodeDragging, setIsNodeDragging] = useState(false);
  const [isEdgeUpdating, setIsEdgeUpdating] = useState(false);
  const nodePositionUpdateTimeoutRef = useRef(null);
  const edgeUpdateTimeoutRef = useRef(null);

  // Layout state
  const [isLayouting, setIsLayouting] = useState(false);
  // flag to indicate that the diagram has finished its initial layout and can be displayed
  const [diagramReady, setDiagramReady] = useState(false);
  const layoutTimeoutRef = useRef(null);
  // Ref to allow layout triggering from deeply nested callbacks before applyLayout is declared
  const applyLayoutRef = useRef<() => void>(() => {});
  const previousNodesLengthRef = useRef(0);
  const previousEdgesLengthRef = useRef(0);

  // Track if diagram already has loaded data
  const hasLoadedDiagramData = useRef(false);

  // Add refs for drag handling
  const isDraggingRef = useRef(false);
  const dragTimeoutRef = useRef(null);

  // DFD states
  const [viewMode, setViewMode] = useState<'AD' | 'DFD'>('AD');
  const [dfdData, setDfdData] = useState<any>(null);
  const [dfdGenerationStatus, setDfdGenerationStatus] = useState<string>('idle'); // 'idle', 'generating', 'complete', 'failed'
  const [dfdPollingInterval, setDfdPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const dfdReactFlowInstance = useRef(null);
  // Add a reference to the main diagram's ReactFlow instance
  const mainReactFlowInstance = useRef(null);
  // Track if we already auto-fit after the latest render
  const hasAutoFitView = useRef(false);

  // Diagram state from useDiagramWithAI hook
  const {
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
    handleSave: hookHandleSave,
    handleAddNode,
    handleGenerateReport,
  } = useDiagramWithAI();

  // Set up the useDiagramNodes hook
  const {
    editNodeDialogOpen,
    setEditNodeDialogOpen,
    currentEditNode,
    setCurrentEditNode,
    prepareNodes,
    handleConnect,
    handleAddNode: hookHandleAddNode,
    handleSaveNodeEdit,
    getEdgeType
  } = useDiagramNodes(nodes, edges, setNodes, setEdges);

  // After the viewModeChange function definition, add these helper functions before prepareNodesForDiagram
  // Helper functions for node editing
  const handleEditNode = (id, label) => {
    console.log(`Editing node: ${id} (${label})`);

    // Find the node
    const targetNode = nodes.find(node => node.id === id);

    if (targetNode) {
      setCurrentEditNode({
        id,
        label: targetNode.data?.label || '',
        description: targetNode.data?.description || ''
      });
      setEditNodeDialogOpen(true);
    }
  };

  const handleDeleteNode = (id) => {
    console.log(`Deleting node: ${id}`);

    // Find the node to be deleted to show its name in the toast
    const nodeToDelete = nodes.find(node => node.id === id);

    // Remove the node
    setNodes(nds => nds.filter(node => node.id !== id));

    // Remove any edges connected to this node
    setEdges(eds => eds.filter(edge => edge.source !== id && edge.target !== id));

    // Show a toast notification
    if (nodeToDelete) {
      const nodeLabel = nodeToDelete.data?.label || 'Unnamed node';

      toast({
        title: "Node Deleted",
        description: `Node "${nodeLabel}" has been removed`
      });
    }
  };

  // Apply custom node preparation that preserves sticky notes and comment nodes
  const prepareNodesForDiagram = useCallback((inputNodes, inputEdges) => {
    console.log('Preparing nodes for diagram, input nodes:', inputNodes.length);
    
    // Get the base prepareNodes function from the useDiagramNodes hook
    // But filter out comment/sticky note nodes first to handle them specially
    const regularNodes = inputNodes.filter(node => 
      !(node.type === 'comment' || node.data?.nodeType === 'stickyNote' || node.data?.isComment === true));
    
    // Sticky notes and comment nodes - preserved as-is
    const stickyNotes = inputNodes.filter(node => 
      (node.type === 'comment' || node.data?.nodeType === 'stickyNote' || node.data?.isComment === true));
    
    // Process regular nodes using the hook's prepareNodes function
    const processedRegularNodes = prepareNodes(regularNodes, inputEdges);
    
    // Add additional check for missing icons/styling and fix if needed
    const enhancedNodes = processedRegularNodes.map(node => {
      // If node doesn't have explicit icon data but has a nodeType, add the icon URL
      if (!node.data.iconUrl && node.data.nodeType) {
        // Check if we can get an icon URL for this node type
        const iconUrl = mapNodeTypeToIcon(node.data.nodeType);
        
        if (iconUrl) {
          // Store the icon URL directly in node data rather than creating a renderer
          node.data.iconUrl = iconUrl;
          console.log(`Added missing iconUrl for node ${node.id} (${node.data.nodeType})`);
        }
      }
      
      // Ensure all nodes have the standard callbacks
      if (!node.data.onEdit) {
        node.data.onEdit = handleEditNode;
      }
      if (!node.data.onDelete) {
        node.data.onDelete = handleDeleteNode;
      }
      if (!node.data.onLock) {
        node.data.onLock = (id: string) => {
          setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, pinned: !(n.data?.pinned === true) } } : n));
          // trigger layout if node unlocked
          if (!isLayouting) {
            setTimeout(() => {
              if (applyLayoutRef.current) {
                applyLayoutRef.current();
              }
            }, 50);
          }
        };
      }
      
      return node;
    });
    
    // Assign incremental animation delays for cinematic reveal (120ms steps)
    const enhancedNodesWithDelay = enhancedNodes.map((node, index) => {
      return {
        ...node,
        data: {
          ...node.data,
          animationDelayMs: index * 120,
        },
      };
    });
    
    // Combine both types of nodes 
    return [...enhancedNodesWithDelay, ...stickyNotes];
  }, [prepareNodes, handleEditNode, handleDeleteNode, isLayouting, applyLayoutRef]);

  // Memoize the edges to prevent unnecessary updates
  const stableEdges = useMemo(() => {
    // Don't update edges during node dragging
    if (isNodeDragging) {
      return edges;
    }
    return edges;
  }, [edges, isNodeDragging]);

  // Refs to keep track of current state
  const sessionIdRef = useRef(sessionId);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  // Keep refs in sync with state
  useEffect(() => {
    sessionIdRef.current = sessionId;
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [sessionId, nodes, edges]);

  // Track thinking time with elapsed seconds counter
  useEffect(() => {
    let intervalId = null;

    if (isLoading) {
      if (!thinkingStartTime) {
        setThinkingStartTime(Date.now());
        setElapsedSeconds(0);
      }

      intervalId = window.setInterval(() => {
        if (thinkingStartTime) {
          const elapsed = Math.floor((Date.now() - thinkingStartTime) / 1000);
          setElapsedSeconds(elapsed);
        }
      }, 1000);
    } else {
      setThinkingStartTime(null);
      setElapsedSeconds(0);
    }

    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading, thinkingStartTime]);

  // ----------------------------------------------------------------------------Function to update layer containers when nodes move
  const updateLayerContainers = useCallback((updatedNodes: Node[]) => {
    // Filter out existing layer containers - we'll recreate them
    const regularNodes = updatedNodes.filter(node => node.type !== 'layerGroup');

    // Create layer containers based on the nodes
    const layerContainers = createLayerContainers(regularNodes);

    // Combine layer containers with regular nodes
    return [...layerContainers, ...regularNodes];
  }, []);

  // Node drag handlers for layer container updates
  const handleNodeDragStart = useCallback(() => {
    isDraggingRef.current = true;
    setIsNodeDragging(true);
  }, [setIsNodeDragging]);

  const handleNodeDragStop = useCallback(() => {
    isDraggingRef.current = false;
    setIsNodeDragging(false);

    // Update layer containers after a short delay
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }

    // IMPORTANT: Only update layer containers when nodes are manually dragged
    // This ensures we don't recreate them unnecessarily
    dragTimeoutRef.current = setTimeout(() => {
      // Preserve existing layer containers and only update them if needed
      setNodes((currentNodes) => {
        // Get current regular nodes and layer containers
        const regularNodes = currentNodes.filter(node => node.type !== 'layerGroup');
        const existingLayerContainers = currentNodes.filter(node => node.type === 'layerGroup');
        
        // Create updated layer containers based on regular nodes' new positions
        const updatedLayerContainers = createLayerContainers(regularNodes);
        
        // Combine updated layer containers with regular nodes 
        return [...updatedLayerContainers, ...regularNodes];
      });
    }, 100);

  }, [updateLayerContainers, setNodes, setIsNodeDragging]);

  // -----------------------------------------------------------------------------------------
  // Apply layout function
  const applyLayout = useCallback(async () => {
    console.log('[ModelWithAI] applyLayout triggered.');
    // Get current state directly from refs to avoid stale closures
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
  
    // Use the isLayouting state directly
    if (isLayouting || currentNodes.length === 0) {
      console.log(`[ModelWithAI] Layout skipped (isLayouting: ${isLayouting}, nodes: ${currentNodes.length})`);
      return;
    }
  
    console.log('[ModelWithAI] Setting isLayouting = true');
    setIsLayouting(true);
    // Diagram is about to re-render – reset auto-fit flag
    hasAutoFitView.current = false;
    setDiagramReady(false);
  
    try {
      // Filter out any existing layer group nodes and save them separately
      const regularNodes = currentNodes.filter(node => node.type !== 'layerGroup');
      const existingLayerContainers = currentNodes.filter(node => node.type === 'layerGroup');
      
      console.log(`[ModelWithAI] Preparing ${regularNodes.length} regular nodes.`);
      // Call prepareNodesForDiagram with the correct parameters
      const preparedNodes = prepareNodesForDiagram(regularNodes, currentEdges);
      console.log(`[ModelWithAI] Processing ${currentEdges.length} edges.`);
      const processedEdges = processEdges(currentEdges, preparedNodes);
  
      console.log('[ModelWithAI] Calling getLayoutedElements with LR flow (maintaining existing behavior)');
      
      // Keep existing left-to-right flow with proper spacing
      const { nodes: layoutedNodes, edges: layoutedEdges } = await layoutWithELK(
        preparedNodes,
        processedEdges,
        { direction: 'LR', nodeWidth: 172, nodeHeight: 36 }
      );
  
      // Apply backend positioning rules to layouted nodes
      const backendPositionedNodes = layoutedNodes; // ELK already positioned
  
      if (backendPositionedNodes && backendPositionedNodes.length > 0) {
        console.log(`[ModelWithAI] Calculated ${backendPositionedNodes.length} positioned nodes. Updating state.`);
  
        // Create new layer containers if there were none previously
        const layerContainers = existingLayerContainers.length > 0 
          ? updateExistingLayerContainers(existingLayerContainers, backendPositionedNodes)
          : createLayerContainers(backendPositionedNodes);
          
        console.log(`[ModelWithAI] Using ${layerContainers.length} layer containers.`);
  
        // Combine layer containers with regular nodes
        // Layer containers come first so they render underneath
        const finalNodes = [...layerContainers, ...backendPositionedNodes];
  
        // Set nodes first
        setNodes(finalNodes);
        console.log('[ModelWithAI] setNodes called with layer containers.');
  
        // Set edges immediately after nodes (React batches these)
        if (layoutedEdges) {
          setEdges(layoutedEdges);
          console.log('[ModelWithAI] setEdges called.');
        }
  
        // Reset layouting flag slightly later using timeout, then mark diagram ready
        setTimeout(() => {
          console.log('[ModelWithAI] Resetting isLayouting = false after timeout.');
          setIsLayouting(false);
          setDiagramReady(true);
        }, 50);
  
      } else {
        console.log('[ModelWithAI] No layouted nodes returned. Resetting layouting flag immediately.');
        setIsLayouting(false);
        setDiagramReady(true);
      }
    } catch (error) {
      console.error('[ModelWithAI] Error applying layout:', error);
      setIsLayouting(false); // Ensure flag is reset on error
      setDiagramReady(true);

      toast({
        title: 'Error Applying Layout',
        description: error.message || 'Failed to apply layout',
        variant: 'destructive',
      });
    }
  }, [isLayouting, prepareNodesForDiagram, processEdges, setNodes, setEdges, setIsLayouting, setDiagramReady, toast]);

  // Keep ref updated
  useEffect(() => {
    applyLayoutRef.current = applyLayout;
  }, [applyLayout]);

  // Whenever layouting flag switches to false (and we have nodes) ensure diagramReady is true
  useEffect(() => {
    if (!isLayouting && nodes.length > 0) {
      setDiagramReady(true);
    }
  }, [isLayouting, nodes.length]);

  // Auto-fit once after diagram has rendered and is ready
  useEffect(() => {
    if (diagramReady && !hasAutoFitView.current && nodes.length > 0 && mainReactFlowInstance.current) {
      try {
        mainReactFlowInstance.current.fitView({ padding: 0.2 });
        hasAutoFitView.current = true;
      } catch (err) {
        console.warn('[ModelWithAI] Auto fitView failed', err);
      }
    }
  }, [diagramReady, nodes.length]);

  // New function to apply backend positioning rules for LEFT-TO-RIGHT flow
const applyBackendPositioning = useCallback((nodes: Node[]): Node[] => {
  console.log('[ModelWithAI] Applying backend positioning rules for LR flow');
  
  // Define backend layer X ranges for LEFT-TO-RIGHT flow
  const layerXRanges = {
    client: { min: 50, max: 250, centerX: 150 },        // CLIENT ZONE (X: 50-250) - LEFTMOST
    network: { min: 300, max: 500, centerX: 400 },      // DMZ LAYER (X: 300-500) - LEFT-CENTER
    application: { min: 550, max: 800, centerX: 675 },  // APPLICATION LAYER (X: 550-800) - CENTER
    data: { min: 850, max: 1100, centerX: 975 },        // DATA LAYER (X: 850-1100) - RIGHTMOST
    aws: { min: 550, max: 800, centerX: 675 },          // AWS positioned by service type
    azure: { min: 550, max: 800, centerX: 675 },        // Azure positioned by service type
    gcp: { min: 550, max: 800, centerX: 675 },          // GCP positioned by service type
    default: { min: 550, max: 800, centerX: 675 }       // Default to application layer
  };

  // Group nodes by layer
  const nodesByLayer: Record<string, Node[]> = {};
  nodes.forEach(node => {
    const nodeType = node.data?.nodeType || 'default';
    const layer = determineNodeLayer(nodeType as string);
    
    if (!nodesByLayer[layer]) nodesByLayer[layer] = [];
    nodesByLayer[layer].push(node);
  });

  // Position nodes within their respective layers for LR flow
  const positionedNodes: Node[] = [];
  
  Object.entries(nodesByLayer).forEach(([layer, layerNodes]) => {
    const xRange = layerXRanges[layer] || layerXRanges.default;
    
    // Calculate Y positioning with proper spacing (vertical spread within layer)
    const baseY = 100; // Start Y position for each layer
    const ySpacing = 200; // Increased spacing between stacked nodes

    layerNodes.forEach((node, index) => {
      const positionedNode = {
        ...node,
        position: {
          x: xRange.centerX, // Position at layer center X
          y: baseY + (index * ySpacing) // Spread vertically within layer
        }
      };
      positionedNodes.push(positionedNode);
    });
  });

  console.log(`[ModelWithAI] Applied LR backend positioning to ${positionedNodes.length} nodes`);
  return positionedNodes;
}, [determineNodeLayer]);

  // Helper function to update existing layer containers based on new node positions
  const updateExistingLayerContainers = useCallback((existingContainers: Node[], nodes: Node[]) => {
    // Create a map of layer type to existing container
    const layerToContainerMap = Object.fromEntries(
      existingContainers.map(container => [container.data?.layer as string, container])
    );
    
    // Filter out any comment nodes, sticky notes, client nodes, or nodes with excludeFromLayers flag
    const filteredNodes = nodes.filter(node => {
      // First check if it's a comment, sticky note, or explicitly excluded
      if (
        node.type === 'comment' || 
        node.data?.nodeType === 'stickyNote' || 
        node.data?.isComment === true ||
        node.data?.excludeFromLayers === true
      ) {
        return false;
      }
      
      // Then check if it's a client node
      const nodeType = node.data?.nodeType || '';
      if (typeof nodeType === 'string') {
        const nodeTypeStr = nodeType.toLowerCase();
        // Exclude all client nodes
        if (nodeTypeStr.includes('client') || 
            nodeTypeStr.startsWith('client_') ||
            nodeTypeStr.includes('mobile_app') ||
            nodeTypeStr.includes('browser') ||
            nodeTypeStr.includes('desktop_app') ||
            nodeTypeStr.includes('iot_device') ||
            nodeTypeStr.includes('kiosk') ||
            nodeTypeStr.includes('user_')) {
          return false;
        }
      }
      
      return true;
    });
    
    // Group nodes by layer
    const nodesByLayer: Record<string, Node[]> = {};
    filteredNodes.forEach(node => {
      const nodeType = node.data?.nodeType || 'default';
      const layer = determineNodeLayer(nodeType as string);
      
      // Skip client layer as an additional safety check
      if (layer === 'client') return;
      
      if (!nodesByLayer[layer]) nodesByLayer[layer] = [];
      nodesByLayer[layer].push(node);
    });
    
    // Update each existing container with new dimensions
    const updatedContainers: Node[] = [];
    
    Object.entries(nodesByLayer).forEach(([layer, layerNodes]) => {
      if (layerNodes.length === 0) return;
      
      // Get existing container or create style from layer type
      const existingContainer = layerToContainerMap[layer];
      const layerStyle = getLayerStyle(layer);
      
      // Calculate new boundaries based on node positions with improved padding
      const positions = layerNodes.map(n => n.position);
      const minX = Math.min(...positions.map(p => p.x)) - LAYER_CONTAINER_PADDING;
      const minY = Math.min(...positions.map(p => p.y)) - LAYER_CONTAINER_PADDING;
      
      // Calculate maximum extents with more space
      const maxX = Math.max(...layerNodes.map(node => {
        const nodeWidth = node.width || DEFAULT_NODE_WIDTH; // Use default width if not specified
        return node.position.x + nodeWidth;
      })) + LAYER_CONTAINER_PADDING; // Increased right padding
      
      // Add extra vertical padding beneath nodes so the bottom border has breathing room
      const EXTRA_BOTTOM_PADDING = LAYER_EXTRA_BOTTOM_PADDING;
      
      const maxY = Math.max(
        ...layerNodes.map(node => {
          const nodeHeight = (node.height || DEFAULT_NODE_HEIGHT) + LABEL_EXTRA_HEIGHT; // Include label height
          return node.position.y + nodeHeight;
        })
      ) + LAYER_CONTAINER_PADDING + EXTRA_BOTTOM_PADDING; // existing + extra
      
      const width = maxX - minX;
      const height = maxY - minY;
      
      // Apply additional size adjustments for data layer
      const isDataLayer = layer === 'data' || layer === 'database';
      const widthAdjustment = isDataLayer ? 40 : 0; // Extra width for data layer
      const heightAdjustment = isDataLayer ? 30 : 0; // Extra height for data layer
      
      // Round values to the nearest integer to avoid tiny float differences
      const roundedMinX = Math.round(minX);
      const roundedMinY = Math.round(minY);
      const roundedWidth = Math.round(width + widthAdjustment);
      const roundedHeight = Math.round(height + heightAdjustment);
      
      const TOLERANCE = 1; // pixels – ignore sub-pixel or 1-px jitter
      
      // If no existing container for this layer, create a brand-new one
      if (!existingContainer) {
        updatedContainers.push({
          id: `layer-${layer}`,
          type: 'layerGroup',
          position: { x: roundedMinX, y: roundedMinY },
          style: {
            width: roundedWidth,
            height: roundedHeight,
            backgroundColor: 'transparent',
            borderColor: layerStyle.borderColor,
            color: layerStyle.color,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderRadius: 10,
            zIndex: -10,
            boxShadow: 'none',
          },
          data: {
            label: layerStyle.label,
            nodeType: 'layerGroup',
            layer,
            childNodeIds: layerNodes.map(n => n.id),
          },
        } as Node);
        return; // proceed to next layer – nothing to update further
      }
      
      const positionChanged =
        Math.abs((existingContainer.position?.x ?? 0) - roundedMinX) > TOLERANCE ||
        Math.abs((existingContainer.position?.y ?? 0) - roundedMinY) > TOLERANCE;
      
      const currentWidth = Number(existingContainer.style?.width ?? 0);
      const currentHeight = Number(existingContainer.style?.height ?? 0);
      
      const sizeChanged =
        Math.abs(currentWidth - roundedWidth) > TOLERANCE ||
        Math.abs(currentHeight - roundedHeight) > TOLERANCE;
      
      // If nothing significant changed, keep the old container to avoid React re-mounts
      if (positionChanged || sizeChanged) {
        updatedContainers.push({
          ...existingContainer,
          position: { x: roundedMinX, y: roundedMinY },
          style: {
            ...existingContainer.style,
            width: roundedWidth,
            height: roundedHeight,
            backgroundColor: 'transparent',
            zIndex: -10,
          },
          data: {
            ...existingContainer.data,
            childNodeIds: layerNodes.map(n => n.id),
          },
        });
      } else {
        updatedContainers.push(existingContainer);
      }
    });
    
    return updatedContainers;
  }, []);

  // Check for significant changes to trigger auto-layout
  useEffect(() => {
    // Skip initial render, when loading project, or when already layouting
    if (nodes.length === 0 || isLayouting || isProjectLoading) return;

    // Check if nodes or edges count changed (something added or removed)
    const nodesCountChanged = nodes.length !== previousNodesLengthRef.current;
    const edgesCountChanged = edges.length !== previousEdgesLengthRef.current;

    // Update the refs with current counts
    previousNodesLengthRef.current = nodes.length;
    previousEdgesLengthRef.current = edges.length;

    // If something changed (and not initial load), apply layout with a delay
    if ((nodesCountChanged || edgesCountChanged) && hasLoadedDiagramData.current) {
      // Clear any existing timeout
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }

      layoutTimeoutRef.current = setTimeout(() => {
        applyLayout();
      }, 300);
    }

    return () => {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
    };
  }, [nodes.length, edges.length, isLayouting, applyLayout, isProjectLoading]);

  // Utility function for saving project with current state
  const saveCurrentState = useCallback(
    debounce(async () => {
      if (!sessionIdRef.current) {
        console.warn("Cannot save - no session ID available");
        return false; // Return false to indicate failure
      }

      console.log(`Saving project with session ID: ${sessionIdRef.current}`);
      
      // Filter out layerGroup nodes before saving to backend
      // Layers are frontend-only visual containers and should not be sent to backend
      const nodesForBackend = nodesRef.current.filter(node => node.type !== 'layerGroup');
      
      const currentDiagramState = { 
        nodes: nodesForBackend, 
        edges: edgesRef.current 
      };
      
      console.log('Saving Diagram State Nodes:', nodesForBackend.length);

      // Also log a nodes summary for better readability
      console.log('Nodes Summary:', nodesForBackend.map(node => ({
        id: node.id,
        type: node.type,
        nodeType: node.data?.nodeType,
        label: node.data?.label,
        hasIconRenderer: !!node.data?.iconRenderer
      })));

      // Capture and save diagram image
      try {
        // Apply fit view before capturing to ensure full diagram is visible
        if (mainReactFlowInstance.current && mainReactFlowInstance.current.fitView) {
          console.log('Applying fit view before auto-save diagram capture');
          mainReactFlowInstance.current.fitView({ 
            padding: 0.2, 
            duration: 0 // No animation for auto-save
          });
          
          // Brief wait for fit view to take effect
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const diagramImage = await captureDiagramImage({
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          quality: 1.0,
          padding: 50
        });
        
        if (diagramImage) {
          localStorage.setItem(`diagram_image_${projectId}`, diagramImage);
          console.log('Diagram image saved to localStorage during auto-save');
        }
      } catch (imageError) {
        console.warn('Could not capture diagram image during save:', imageError);
        // Continue with project save even if image capture fails
      }

      try {
        const result = await projectService.saveProject(sessionIdRef.current, currentDiagramState, projectId);
        console.log(`Project save result: ${result ? 'success' : 'failed'}`);
        return result;
      } catch (err) {
        console.error("Error saving project:", err);
        return false;
      }
    }, 1000), // 1-second debounce delay
    [projectId] // Dependency array
  );

  // Initialize component and load project if available
  useEffect(() => {
    toast({
      title: "Welcome to Model Designer",
      description: "Create your security architecture using natural language or the diagram tools.",
      duration: 5000,
    });

    let projectIdToUse = '';
    let diagramStateFromNav = null;
    let sessionIdFromNav = null;
    let fromReportPage = false;
    
    if (params.projectId) {
      projectIdToUse = params.projectId;
      console.log('Project ID from URL params:', projectIdToUse);
    } else if (location.state && location.state.projectId) {
      projectIdToUse = location.state.projectId;
      console.log('Project ID from navigation state:', projectIdToUse);
      
      // Check if we have diagram state passed from navigation (e.g., from report page)
      if (location.state.diagramState) {
        diagramStateFromNav = location.state.diagramState;
        console.log('Diagram state received from navigation:', diagramStateFromNav);
      }
      
      // Check if we have session ID from navigation
      if (location.state.sessionId) {
        sessionIdFromNav = location.state.sessionId;
        console.log('Session ID from navigation state:', sessionIdFromNav);
      }
      
      // Check if this navigation came from report page
      if (location.state.fromReport) {
        fromReportPage = true;
        console.log('Navigation came from report page');
      }
    } else if (projectId && projectId !== 'default-project') {
      projectIdToUse = projectId;
      console.log('Using existing project ID:', projectIdToUse);
    }

    if (projectIdToUse) {
      console.log('Setting project ID to:', projectIdToUse);
      setProjectId(projectIdToUse);
      
      // If we have session ID from navigation, set it immediately
      if (sessionIdFromNav) {
        setSessionId(sessionIdFromNav);
      }
      
      // If we have diagram state from navigation (from report page), restore it immediately
      if (diagramStateFromNav && fromReportPage) {
        console.log('Restoring diagram state from report page navigation');
        
        try {
          // Prepare the nodes from the diagram state
          const restoredNodes = (diagramStateFromNav.nodes || []).map((node) => ({
            ...node,
            data: {
              ...node.data,
              onEdit: handleEditNode,
              onDelete: handleDeleteNode,
            },
          }));
          
          const restoredEdges = diagramStateFromNav.edges || [];
          
          // Prepare nodes with proper handlers
          const preparedNodes = prepareNodesForDiagram(restoredNodes, restoredEdges);
          const processedEdges = processEdges(restoredEdges, preparedNodes);
          
          // Create layer containers for the restored nodes
          const layerContainers = createLayerContainers(preparedNodes);
          const combinedNodes = [...layerContainers, ...preparedNodes];
          
          // Set nodes and edges
          setNodes(combinedNodes);
          setEdges(processedEdges);
          
          // Mark project as loaded to prevent additional loading
          setProjectLoaded(true);
          hasLoadedDiagramData.current = true;
          
          // Load conversation history from backend for the project
          console.log('Loading conversation history for project:', projectIdToUse);
          
          // Load conversation history asynchronously
          const loadConversationHistory = async () => {
            try {
              const projectData = await projectService.loadProject(projectIdToUse);
              
              // Handle conversation history same as in the load function
              if (projectData.conversation_history && Array.isArray(projectData.conversation_history)) {
                const formattedMessages = projectData.conversation_history
                  .map((entry) => {
                    // Handle new format with id, role, content fields
                    if (entry.role && entry.content) {
                      return {
                        role: entry.role,
                        content: entry.content,
                        isPreExisting: true,
                        timestamp: entry.timestamp || new Date().toISOString()
                      };
                    }
                    // Handle old format with query and response fields
                    else if (entry.query && entry.response) {
                      return [
                        { role: 'user', content: entry.query, isPreExisting: true },
                        { role: 'assistant', content: entry.response.message || entry.response, isPreExisting: true },
                      ];
                    }
                    return [];
                  })
                  .flat();
                setMessages(formattedMessages);
                console.log("Loaded conversation history from report page navigation:", formattedMessages.length, "messages");
              }
            } catch (historyError) {
              console.warn('Could not load conversation history from report page restoration:', historyError);
              // Continue with diagram restoration even if history loading fails
            }
          };
          
          // Execute the async function
          loadConversationHistory();
          
          // Automatically apply layout and fit view after restoration
          setTimeout(() => {
            console.log('Auto-applying layout after diagram restoration from report page');
            applyLayoutRef.current(); // Use ref to avoid dependency issues
            
            // Apply fit view after layout is complete
            setTimeout(() => {
              if (mainReactFlowInstance.current) {
                console.log('Auto-applying fit view after layout completion');
                mainReactFlowInstance.current.fitView({ padding: 0.2, duration: 300 });
              }
            }, 800); // Wait longer to ensure layout is fully applied
          }, 500); // Wait for nodes to be rendered
          
          // Show success message
          toast({
            title: 'Project Restored',
            description: 'Successfully restored your diagram and conversation history from the report page.',
            duration: 3000,
          });
        } catch (error) {
          console.error('Error restoring diagram state from navigation:', error);
          
          // Fall back to loading from backend
          toast({
            title: 'Diagram Restoration Failed',
            description: 'Loading diagram from saved project data instead.',
            variant: 'default',
            duration: 3000,
          });
          
          // Load from backend as fallback
          if (!projectLoaded) {
            load(projectIdToUse);
          }
        }
      } else if (!projectLoaded) {
        // Only load from backend if we don't have navigation state
        load(projectIdToUse);
      }
    } else {
      console.log('No valid project ID found, waiting for user to select a project');
    }

    return () => {
      console.log("ModelWithAI component unmounting, cleaning up...");
      if (sessionIdRef.current) {
        console.log(`Saving project on unmount with session ID: ${sessionIdRef.current}`);
        console.log(`Current message count: ${messages.length}`);

        // Safely handle the case where saveCurrentState might be undefined
        const savePromise = saveCurrentState?.();
        if (savePromise && typeof savePromise.then === 'function') {
          savePromise.catch(err => {
            console.error("Failed to save project on unmount:", err);
          });
        } else {
          console.warn("saveCurrentState is not available during cleanup");
        }
      }
    };
  }, [toast, location.state, params.projectId, projectLoaded]); // Use ref for applyLayout to avoid dependency issues

  // Add this function before the handleSwitchView function
  const processAndDisplayThreatModel = useCallback((threatModelResponse) => {
    if (!threatModelResponse) {
      console.error('Invalid threat model response');
      setDfdGenerationStatus('failed');
      return;
    }

    try {
      // Transform FullThreatModelResponse to DFDData format for visualization
      const dfdData = {
        threat_model_id: threatModelResponse.threat_model_id || '',
        nodes: threatModelResponse.dfd_model.elements,
        edges: threatModelResponse.dfd_model.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label || '',
          properties: edge.properties || {}
        })),
        boundaries: threatModelResponse.dfd_model.boundaries,
        threats: threatModelResponse.threats.threats.map(threat => ({
          id: threat.id,
          description: threat.description,
          severity: threat.severity,
          mitigation: threat.mitigation || 'No mitigation specified',
          target_elements: threat.target_elements || [],
          properties: threat.properties || {
            threat_type: 'UNKNOWN',
            impact: 'Unknown impact'
          }
        })),
        generated_at: threatModelResponse.generated_at || new Date().toISOString()
      };

      setDfdData(dfdData);
      setDfdGenerationStatus('complete');

      // Show a success toast
      toast({
        title: 'Threat Analysis Complete',
        description: `Generated ${dfdData.threats.length} threats for your architecture.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error processing threat model response:', error);
      setDfdGenerationStatus('failed');

      toast({
        title: 'Error Processing Threat Model',
        description: error.message || 'Failed to process threat model data',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleSwitchView = useCallback(async (mode: 'AD' | 'DFD') => {
    console.log(`Switching view mode to: ${mode}`);

    if (mode === viewMode) return;

    // Update the view mode state
    setViewMode(mode);

    if (mode === 'DFD') {
      // Set loading state
      setDfdGenerationStatus('generating');

      try {
        // Filter out layerGroup nodes before sending to backend
        const filteredNodes = nodes.filter(node => node.type !== 'layerGroup');
        
        // Clean up the diagram state to ensure only essential properties are included
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

        // Prepare the request
        const request = {
          diagram_state: {
            nodes: cleanNodes,
            edges: cleanEdges
          },
          session_id: sessionId || undefined,
        };

        console.log('Sending clean diagram state for threat model generation', request);

        // Get the most current project ID (it might be different from state)
        const currentProjectId = projectId || params.projectId || location.state?.projectId;
        
        if (!currentProjectId) {
          throw new Error('No project ID available for threat model generation.');
        }

        // Use our service function to generate the threat model
        const threatModelResponse = await generateThreatModel(currentProjectId, request, toast);

        console.log('Threat Model Response:', threatModelResponse);

        // Use our new utility function to process and display the threat model
        processAndDisplayThreatModel(threatModelResponse);

      } catch (error) {
        console.error('Error generating threat model:', error);
        setDfdGenerationStatus('failed');

        toast({
          title: 'Error Generating Threat Model',
          description: error.message || 'Failed to generate threat model',
          variant: 'destructive',
        });
      }
    }
  }, [viewMode, nodes, edges, sessionId, projectId, processAndDisplayThreatModel, toast]);

  // Load project data
  const load = useCallback(
    async (projectIdToLoad) => {
      if (!projectIdToLoad) {
        console.error('No project ID provided for loading');
        return;
      }

      setIsProjectLoading(true);
      setError(null);

      try {
        console.log(`Loading project: ${projectIdToLoad}`);
        const projectData = await projectService.loadProject(projectIdToLoad);
        console.log('Project Data:', projectData);

        setSessionId(projectData.session_id);
        setProjectId(projectData.project_id);

        if (projectData.diagram_state) {
          // Map loaded nodes and ensure they're treated as regular nodes
          // Layer containers will be created in the frontend
          const loadedNodes = (projectData.diagram_state.nodes || []).map((node) => ({
            ...node,
            type: node.type === 'layerGroup' ? 'default' : (node.type || 'default'), // Convert any layerGroup nodes from backend to regular nodes
            data: {
              ...node.data,
              nodeType: node.data?.nodeType || 'default',
              label: node.data?.label || node.id || 'Node',
              onEdit: handleEditNode,
              onDelete: handleDeleteNode,
            },
          }));
          const loadedEdges = projectData.diagram_state.edges || [];

          console.log('Loaded Nodes (normalized):', loadedNodes);
          console.log('Loaded Edges:', loadedEdges);

          // Reset diagram state
          setNodes([]);
          setEdges([]);

          // Prepare nodes with their handlers and styles
          const preparedNodes = prepareNodesForDiagram(loadedNodes, []);

          // Validate edges against prepared nodes
          const validEdges = loadedEdges.filter((edge) => {
            if (!edge.source || !edge.target) {
              console.warn('Invalid edge found - missing source or target:', edge);
              return false;
            }
            const sourceExists = preparedNodes.some((node) => node.id === edge.source);
            const targetExists = preparedNodes.some((node) => node.id === edge.target);
            if (!sourceExists || !targetExists) {
              console.warn(`Skipping edge with missing ${!sourceExists ? 'source' : 'target'} node:`, edge);
              return false;
            }
            return true;
          });
          
          // Process edges
          const processedEdges = processEdges(validEdges, preparedNodes);

          // Run ELK once, right here
          let layoutedNodes = preparedNodes;
          let layoutedEdges = processedEdges;
          try {
            const { nodes, edges } = await layoutWithELK(
              preparedNodes,
              processedEdges,
              { direction: 'LR', nodeWidth: 172, nodeHeight: 36 }
            );
            layoutedNodes = nodes as Node[];
            layoutedEdges = edges as any[];
          } catch (err) {
            console.warn('[load] ELK failed, using raw positions', err);
          }

          // Build containers AFTER nodes have final coords
          const layerContainers = createLayerContainers(layoutedNodes);
          const combinedNodes = [...layerContainers, ...layoutedNodes];

          // Commit state atomically (avoids visible jump)
          setNodes(combinedNodes);
          setEdges(layoutedEdges);

          // Ensure a deterministic auto-arrange & fitView after everything mounts.
          // We schedule a two-step timeout:
          //   1) call applyLayout (guarantees ELK pass & layer containers sync)
          //   2) after layout completes, fit the viewport.
          setTimeout(() => {
            if (applyLayoutRef.current) {
              applyLayoutRef.current();
            }

            // Give ELK/layout a moment, then fit the view.
            setTimeout(() => {
              mainReactFlowInstance.current?.fitView({ padding: 0.2, duration: 300 });
            }, 600);
          }, 100);

          hasLoadedDiagramData.current = true;
          setProjectLoaded(true);

          // Check if project has threat model data
          if (projectData.dfd_data) {
            console.log('Project has existing threat model data:', projectData.dfd_data);
            setDfdData(projectData.dfd_data);
            // Pre-cache the threat model for immediate viewing if user switches to DFD view
            setDfdGenerationStatus('complete');
          }
        }

        // Handle conversation history
        if (projectData.conversation_history && Array.isArray(projectData.conversation_history)) {
          const formattedMessages = projectData.conversation_history
            .map((entry) => {
              // Handle new format with id, role, content fields
              if (entry.role && entry.content) {
                return {
                  role: entry.role,
                  content: entry.content,
                  isPreExisting: true,
                  timestamp: entry.timestamp || new Date().toISOString()
                };
              }
              // Handle old format with query and response fields
              else if (entry.query && entry.response) {
                return [
                  { role: 'user', content: entry.query, isPreExisting: true },
                  { role: 'assistant', content: entry.response.message || entry.response, isPreExisting: true },
                ];
              }
              return [];
            })
            .flat();
          setMessages(formattedMessages);
          console.log("Formatted messages for display:", formattedMessages);
        }

        // Show success message
        toast({
          title: 'Project Loaded',
          description: `Successfully loaded project: ${projectData.project_id}`,
          duration: 3000,
        });
      } catch (error) {
        console.error('Error loading project:', error);
        setError(`Failed to load project: ${error.message}`);

        toast({
          title: 'Error Loading Project',
          description: error.message || 'An unknown error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsProjectLoading(false);
      }
    },
    [toast, prepareNodesForDiagram, handleEditNode, handleDeleteNode, processEdges, setNodes, setEdges]  // Removed applyLayout dependency to avoid loops
  );

  const save = async () => {
    if (!sessionId) {
      toast({
        title: "Cannot Save",
        description: "No active session to save",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log(`Manual save initiated for session ID: ${sessionId}`);
      const result = await saveCurrentState();

      if (result) {
        toast({
          title: "Project Saved",
          description: `Project ${projectId} saved successfully`,
          variant: "default",
        });
      } else {
        throw new Error("Save operation failed");
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to save project',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChatCollapse = () => {
    setIsChatCollapsed(!isChatCollapsed);
  };

  const handleQuestionSelect = (question) => {
    console.log("Selected question:", question);
    setShowClarificationQuestions(false);
    handleSendMessage(question);
  };

  const handleUseSuggestion = () => {
    console.log("Using suggestion:", suggestion);
    setShowSuggestion(false);
    handleSendMessage(suggestion);
  };

  const handleSendMessage = async (message) => {
    if (!message) {
      setMessages([]);
      return;
    }

    // Add user message with timestamp
    const timestamp = new Date().toISOString();
    setMessages((prev) => [...prev, {
      role: 'user',
      content: message,
      timestamp: timestamp
    }]);

    setShowReferences(false);
    setShowRelatedConcepts(false);
    setShowClarificationQuestions(false);
    setShowSuggestion(false);
    setError(null);

    setIsLoading(true);
    setIsProcessing(true);
    setError(null);

    try {
      // Check if this is a DFD generation command
      const isDfdCommand = (message) => {
        const lowerCaseMessage = message.toLowerCase();
        return lowerCaseMessage.includes('generate dfd') ||
          lowerCaseMessage.includes('create dfd') ||
          lowerCaseMessage.includes('show dfd') ||
          lowerCaseMessage.includes('threat model') ||
          lowerCaseMessage.includes('data flow diagram') ||
          (lowerCaseMessage.includes('generate') && viewMode === 'DFD') ||
          (lowerCaseMessage.includes('update') && viewMode === 'DFD');
      };

      // Filter out layerGroup nodes before sending to backend
      const filteredNodes = nodes.filter(node => node.type !== 'layerGroup');

      // Get the most current project ID (it might be different from state)
      const currentProjectId = projectId || params.projectId || location.state?.projectId;
      
      if (!currentProjectId) {
        throw new Error('No project ID available. Please select or create a project first.');
      }

      const request = {
        project_id: currentProjectId,
        query: message,
        diagram_state: { nodes: filteredNodes, edges },
        session_id: sessionId || undefined,
        view_mode: isDfdCommand(message) ? 'DFD' : viewMode || 'AD'
      };

      const response = await sendDesignRequest(request, true, DEFAULT_TIMEOUT, toast);
      console.log("Full response:", response);

      // Type guard functions to ensure proper TypeScript narrowing
      const isDFDGenerationResponse = (resp: any): resp is DFDGenerationStartedResponse => {
        return 'status' in resp && resp.status === 202 && 'message' in resp;
      };
      const isDesignResponse = (resp: any): resp is DesignResponse => {
        return 'response' in resp && resp.response && 'message' in resp.response;
      };

      // Handle the response based on its type
      if (isDFDGenerationResponse(response)) {
        // This is a DFD generation started response
        console.log("DFD generation started:", response.message);

        // Add assistant message about DFD generation with timestamp
        const responseTimestamp = new Date().toISOString();
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: response.message || "I've started generating the Data Flow Diagram. This might take a moment.",
          isAlreadyTyped: false,
          timestamp: responseTimestamp
        }]);

        // Set DFD status - no need to start polling as we now call directly
        setDfdGenerationStatus('generating');

        // Try to generate the threat model immediately using direct API
        try {
          // Prepare the request with current diagram state
          // Filter out layerGroup nodes before sending to backend
          const filteredNodes = nodes.filter(node => node.type !== 'layerGroup');
          
          const request = {
            diagram_state: { 
              nodes: filteredNodes, 
              edges 
            },
            session_id: sessionId || undefined,
          };

          // Call the generate threat model API directly
          const threatModelResponse = await generateThreatModel(currentProjectId, request, toast);

          // Use our utility function for consistency
          processAndDisplayThreatModel(threatModelResponse);
        } catch (error) {
          console.error('Error generating threat model:', error);
          setDfdGenerationStatus('failed');
        }
      }
      else if (isDesignResponse(response)) {
        // This is a regular design response
        if (response.response.session_id) {
          setSessionId(response.response.session_id);
        }

        console.log("Adding AI response:", response.response.message);

        // Add assistant message with timestamp
        const responseTimestamp = new Date().toISOString();
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: response.response.message,
          isAlreadyTyped: false,
          timestamp: responseTimestamp
        }]);

        if (response.response.thinking) {
          console.log("Processing thinking content");
          setThinking({
            text: response.response.thinking,
            hasRedactedContent: response.response.has_redacted_thinking || false,
          });
        } else {
          setThinking(null);
        }
        console.log("Response:", response.response);
        console.log("is loaded project", projectLoaded)
        console.log("Messages : ", messages)
        handleResponseByType(response.response);
      }
      else {
        // Unexpected response format
        console.error("Unexpected response format:", response);
        throw new Error("Received an unexpected response format from the server.");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to get response from AI assistant. Please try again.');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error processing your request. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  const handleResponseByType = useCallback(async (response) => {
    console.log("Processing response in handleResponseByType:", response);

    try {
      setResponseMetadata({
        responseType: response.response_type || '',
        confidence: response.confidence || 0,
        classificationSource: response.classification_source || 'unknown',
      });

      // Check if this is a DFD generation response
      if (response.response_type === 'SystemNotification' &&
        response.message.includes('generating the Data Flow Diagram')) {
        console.log('DFD generation triggered via chat');
        setDfdGenerationStatus('generating');

        // Try to generate the threat model immediately using direct API
        try {
          // Get the most current project ID (it might be different from state)
          const currentProjectId = projectId || params.projectId || location.state?.projectId;
          
          if (!currentProjectId) {
            throw new Error('No project ID available for threat model generation.');
          }

          // Prepare the request with current diagram state
          // Filter out layerGroup nodes before sending to backend
          const filteredNodes = nodes.filter(node => node.type !== 'layerGroup');
          
          const request = {
            diagram_state: { 
              nodes: filteredNodes, 
              edges 
            },
            session_id: sessionId || undefined,
          };

          // Call the generate threat model API directly
          const threatModelResponse = await generateThreatModel(currentProjectId, request, toast);

          // Use our utility function for consistency
          processAndDisplayThreatModel(threatModelResponse);
        } catch (error) {
          console.error('Error generating threat model:', error);
          setDfdGenerationStatus('failed');

          toast({
            title: 'Error Generating Threat Model',
            description: error.message || 'Failed to generate threat model',
            variant: 'destructive',
          });
        }
        return;
      }

      switch (response.response_type) {
        case ResponseType.ARCHITECTURE:
          handleArchitectureResponse(response);
          break;
        case ResponseType.EXPERT:
          handleExpertResponse(response);
          break;
        case ResponseType.CLARIFICATION:
          handleClarificationResponse(response);
          break;
        case ResponseType.OUT_OF_CONTEXT:
          handleOutOfContextResponse(response);
          break;
        default:
          console.warn(`Unknown response type: ${response.response_type}`);
      }
    } catch (error) {
      console.error("Error handling response:", error);
      setError(`Error processing response: ${error.message}`);
    }
  }, [
    nodes, edges, sessionId, projectId, toast,
    generateThreatModel, processAndDisplayThreatModel, setDfdGenerationStatus,
    setResponseMetadata, setError
  ]);

  // Handle architecture response from AI – perform ELK layout before rendering to avoid flash
  const handleArchitectureResponse = useCallback(
    async (response) => {
      console.log('Handling Architecture Response with backend positioning');
      setIsLayouting(true); // Indicate layout process starts
      setDiagramReady(false);
  
      const diagramUpdates = response.diagram_updates || {};
      const nodesToAdd = response.nodes_to_add || [];
      const edgesToAdd = response.edges_to_add || [];
      const elementsToRemove = response.elements_to_remove || [];
  
      // --- Use current state directly ---
      // Separate regular nodes and layer containers
      const currentLayerContainers = [...nodes].filter(node => node.type === 'layerGroup');
      const currentNodes = [...nodes].filter(node => node.type !== 'layerGroup');
      const currentEdges = [...edges]; // Create a copy to prevent reference issues
      
      // Detect if this is an initial architecture generation (first time or nearly empty diagram)
      const isInitialGeneration = currentNodes.length === 0 || 
                                  (currentNodes.length <= 2 && nodesToAdd.length > 0);
      
      console.log('Architecture generation type:', isInitialGeneration ? 'Initial generation' : 'Modification');
  
      // --- Start Calculation Phase ---
      let nextNodes = [...currentNodes];
      let nextEdges = [...currentEdges];
  
      // 1. Apply removals first
      if (elementsToRemove.length > 0) {
        console.log('Calculating removals:', elementsToRemove);
        const elementsToRemoveSet = new Set(elementsToRemove);
        const removedNodeIds = new Set(nextNodes.filter(n => elementsToRemoveSet.has(n.id)).map(n => n.id));
  
        nextNodes = nextNodes.filter((node) => !elementsToRemoveSet.has(node.id));
        nextEdges = nextEdges.filter(
          (edge) =>
            !elementsToRemoveSet.has(edge.id) &&
            !removedNodeIds.has(edge.source) && 
            !removedNodeIds.has(edge.target)
        );
      }
  
      // 2. Apply updates to remaining nodes
      if (Object.keys(diagramUpdates).length > 0) {
        console.log('Calculating updates:', diagramUpdates);
        nextNodes = nextNodes.map((node) => {
          const updates = diagramUpdates[node.id];
          if (updates) {
            return {
              ...node,
              ...(updates.position && { position: updates.position }),
              data: {
                ...node.data,
                ...(updates.data || {}),
                ...(updates.type && { nodeType: updates.type }),
                onEdit: node.data.onEdit || handleEditNode,
                onDelete: node.data.onDelete || handleDeleteNode,
              },
              ...(updates.type && { type: 'default' }),
            };
          }
          return node;
        });
      }
  
      // 3. Prepare nodes to add with LR flow positioning hints
      const basicNodesToAdd = nodesToAdd.map((node, index) => ({
        id: node.id,
        type: 'default',
        position: node.position || { 
          x: 400 + (index * 160), // Horizontal spacing for LR flow
          y: 100 + (index * 140)  // Vertical spread within layer
        }, 
        data: {
          label: node.data?.label || node.id || 'Node',
          description: node.data?.description || '',
          nodeType: node.type || 'default',
        },
      }));
      const finalNodesListUnprepared = [...nextNodes, ...basicNodesToAdd];
  
      // 4. Process edges
      let finalEdgesList = [...nextEdges];
      
      if (edgesToAdd.length > 0) {
        console.log('Processing edges to add:', edgesToAdd.length);
        
        const validEdgesToAdd = edgesToAdd.filter(edge => {
          if (!edge.source || !edge.target) {
            console.warn(`Skipping edge ${edge.id || 'new'}: Missing source or target.`);
            return false;
          }
          
          const sourceExists = finalNodesListUnprepared.some(n => n.id === edge.source);
          const targetExists = finalNodesListUnprepared.some(n => n.id === edge.target);
          
          if (!sourceExists || !targetExists) {
            console.warn(`Skipping edge ${edge.id || 'new'}: ${!sourceExists ? 'source' : 'target'} node not found.`);
            return false;
          }
          
          return true;
        });
        
        if (validEdgesToAdd.length > 0) {
          console.log(`Adding ${validEdgesToAdd.length} new valid edges`);
          const processedEdgesToAdd = processEdges(validEdgesToAdd, finalNodesListUnprepared);
          finalEdgesList = [...finalEdgesList, ...processedEdgesToAdd];
        }
      }
      
      // 5. Validate edge consistency
      const allNodeIds = new Set(finalNodesListUnprepared.map(node => node.id));
      finalEdgesList = finalEdgesList.filter(edge => {
        if (!allNodeIds.has(edge.source) || !allNodeIds.has(edge.target)) {
          console.warn(`Removing invalid edge ${edge.id}: connects to non-existent node(s)`);
          return false;
        }
        return true;
      });
  
      // 6. Prepare ALL nodes
      console.log('Preparing final node list...');
      const finalNodesListPrepared = prepareNodesForDiagram(finalNodesListUnprepared, finalEdgesList);
  
      // 7. Run ELK layout BEFORE touching state to avoid initial clutter
      console.log('Running ELK layout before rendering…');
      let layoutedNodes: Node[] = finalNodesListPrepared;
      let layoutedEdges: any[] = finalEdgesList;
      try {
        const layoutRes = await layoutWithELK(finalNodesListPrepared, finalEdgesList, {
          direction: 'LR',
          nodeWidth: 172,
          nodeHeight: 36,
        });
        layoutedNodes = layoutRes.nodes as Node[];
        layoutedEdges = layoutRes.edges as any[];
      } catch (err) {
        console.warn('ELK layout failed, falling back to un-layouted positions', err);
      }
  
      // 8. Generate or update layer containers based on layouted nodes
      const updatedLayerContainers = updateExistingLayerContainers(currentLayerContainers, layoutedNodes);
  
      // 9. Combine layer containers with regular nodes
      const combinedNodes = [...updatedLayerContainers, ...layoutedNodes];
  
      // 10. Commit to React state
      setNodes(combinedNodes);
      setEdges(layoutedEdges);
  
      setArchitectureUpdated(true);
      setIsLayouting(false);
      setDiagramReady(true);
  
      // 11. Auto-apply layout and fit view for initial architecture generation
      if (isInitialGeneration && nodesToAdd.length > 0) {
        console.log('Auto-applying layout and fit view for initial architecture generation');
        
        // Apply layout and fit view after the nodes are rendered
        setTimeout(() => {
          console.log('Applying auto-arrange for initial generation');
          applyLayoutRef.current(); // Use ref to avoid dependency issues
          
          // Apply fit view after layout is complete
          setTimeout(() => {
            if (mainReactFlowInstance.current) {
              console.log('Applying auto-fit view for initial generation');
              mainReactFlowInstance.current.fitView({ 
                padding: 0.2, 
                duration: 500, // Smooth animation for better UX
                includeHiddenNodes: false 
              });
            }
          }, 1000); // Wait longer to ensure layout is fully applied
        }, 600); // Wait for nodes to be rendered
        
        // Show success message for initial generation
        setTimeout(() => {
          toast({
            title: 'Architecture Generated',
            description: 'Your architecture has been generated and automatically arranged for optimal viewing.',
            duration: 4000,
          });
        }, 1500); // Show after layout is complete
      }
      
      console.log('Architecture response processed successfully with LR flow positioning');
    },
    [setNodes, setEdges, prepareNodesForDiagram, processEdges, handleEditNode, handleDeleteNode, 
     setIsLayouting, nodes, edges, updateExistingLayerContainers, applyBackendPositioning, 
     applyLayoutRef, mainReactFlowInstance, setDiagramReady, toast]
  );

  const handleExpertResponse = (fullResponse) => {
    console.log("Handling Expert Response");
    const references = fullResponse.references || [];
    const relatedConcepts = fullResponse.related_concepts || [];

    if (references.length > 0) {
      console.log("References:", references);
      setReferences(references);
      setShowReferences(true);
    } else {
      setReferences([]);
      setShowReferences(false);
    }

    if (relatedConcepts.length > 0) {
      console.log("Related concepts:", relatedConcepts);
      setRelatedConcepts(relatedConcepts);
      setShowRelatedConcepts(true);
    } else {
      setRelatedConcepts([]);
      setShowRelatedConcepts(false);
    }
  };

  const handleClarificationResponse = (fullResponse) => {
    console.log("Handling Clarification Response");
    const questions = fullResponse.questions || [];

    if (questions.length > 0) {
      console.log("Clarification questions:", questions);
      setClarificationQuestions(questions);
      setShowClarificationQuestions(true);
    } else {
      setClarificationQuestions([]);
      setShowClarificationQuestions(false);
    }
  };

  const handleOutOfContextResponse = (fullResponse) => {
    console.log("Handling Out-of-Context Response");
    const suggestionText = fullResponse.suggestion || '';

    if (suggestionText) {
      console.log("Suggestion:", suggestionText);
      setSuggestion(suggestionText);
      setShowSuggestion(true);
    } else {
      setSuggestion('');
      setShowSuggestion(false);
    }
  };

  // Create an enhanced DFD loading indicator
  const DFDLoadingIndicator = () => {
    // Use local state to simulate progress
    const [simulatedProgress, setSimulatedProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('initializing');
    const [elapsedTime, setElapsedTime] = useState(0);

    // State to track cancellation
    const [isCancelling, setIsCancelling] = useState(false);

    // Simulate progress updates with a timer
    useEffect(() => {
      // Only run effect while in generating state
      if (dfdGenerationStatus !== 'generating') return;

      // Track elapsed time
      const timeInterval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      // Simulate progress steps
      const progressSteps = [
        { progress: 15, step: 'initializing', delay: 1500 },
        { progress: 30, step: 'analyzing_architecture', delay: 3000 },
        { progress: 60, step: 'generating_threat_model', delay: 4000 },
        { progress: 80, step: 'analyzing_threats', delay: 3000 },
        { progress: 95, step: 'finalizing_results', delay: 2000 }
      ];

      // Create a sequence of timeouts to update progress
      let totalDelay = 0;
      const timeouts = progressSteps.map(step => {
        totalDelay += step.delay;
        return setTimeout(() => {
          setSimulatedProgress(step.progress);
          setCurrentStep(step.step);
        }, totalDelay);
      });

      // Clean up all timeouts and intervals on unmount or when status changes
      return () => {
        clearInterval(timeInterval);
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }, [dfdGenerationStatus]);

    // Function to handle cancellation
    const handleCancelGeneration = async () => {
      setIsCancelling(true);

      try {
        // Immediately switch back to AD view
        setViewMode('AD');
        setDfdGenerationStatus('idle'); // Reset generation status
        toast({
          title: 'Generation Cancelled',
          description: 'Threat model generation has been cancelled. Switched back to Architecture Diagram.',
          variant: 'default',
        });
      } catch (error) {
        console.error("Error cancelling generation:", error);
        toast({
          title: 'Cancellation Error',
          description: 'An error occurred while trying to cancel.',
          variant: 'destructive',
        });
        setIsCancelling(false);
      }
    };

    // Format elapsed time
    const formatElapsedTime = (seconds) => {
      if (!seconds) return "";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    // Get step-specific message
    const getStepMessage = (step) => {
      const stepMessages = {
        'initializing': 'Initializing threat model generation...',
        'analyzing_architecture': 'Analyzing architecture components...',
        'generating_threat_model': 'Building threat model from architecture...',
        'analyzing_threats': 'Analyzing potential security threats...',
        'finalizing_results': 'Finalizing threat model...'
      };
      return stepMessages[step] || 'Generating threat model...';
    };

    return (
      <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-10">
        <Loader2 className="h-10 w-10 animate-spin text-securetrack-purple mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">Generating Threat Model</h3>

        {/* Progress information */}
        <div className="mt-6 w-64 bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-securetrack-purple h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${simulatedProgress}%` }}
          ></div>
        </div>

        <p className="text-sm text-gray-600 mt-2">
          {getStepMessage(currentStep)}
        </p>

        {elapsedTime > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Time elapsed: {formatElapsedTime(elapsedTime)}
          </p>
        )}

        <p className="text-xs text-gray-500 mt-4 max-w-md text-center">
          Complex diagrams with many components take longer to analyze. Please wait...
        </p>

        {/* Cancel button */}
        <Button
          variant="outline"
          size="sm"
          className="mt-6 bg-white border-red-500 text-red-500 hover:bg-red-50"
          onClick={handleCancelGeneration}
          disabled={isCancelling}
        >
          {isCancelling ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
              Cancelling...
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3 mr-2" />
              Cancel Generation
            </>
          )}
        </Button>
      </div>
    );
  };

  const combinedAddNode = useCallback(
    (nodeType, position, iconRenderer) => {
      hookHandleAddNode(nodeType, position, iconRenderer);
    },
    [hookHandleAddNode]
  );

  const handleActualSave = async () => {
    await save();
    hookHandleSave();
  };

  const handleGenerateReportWithNavigation = () => {
    // Start the async process but return immediately
    (async () => {
      // Clean diagram state by removing functions and keeping only essential data
      const cleanNodes = nodes
        .filter(node => node.type !== 'layerGroup') // Filter out layer containers
        .map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            label: node.data?.label,
            description: node.data?.description,
            nodeType: node.data?.nodeType,
            // Exclude functions like onEdit, onDelete, etc.
          }
        }));

      const cleanEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        label: edge.label
      }));

      const cleanDiagramState = {
        nodes: cleanNodes,
        edges: cleanEdges
      };

      // Get the most current project ID (it might be different from state)
      const currentProjectId = projectId || params.projectId || location.state?.projectId;
      
      // Log for debugging
      console.log('Generating report for project:', currentProjectId);
      console.log('Session ID:', sessionId);
      console.log('Diagram nodes:', cleanNodes.length);

      // Capture diagram image BEFORE navigating to report page
      // Only capture if we're in Architecture Diagram mode and have nodes
      let diagramImageUrl = null;
      if (viewMode === 'AD' && cleanNodes.length > 0) {
        try {
          toast({
            title: "Capturing diagram...",
            description: "Please wait while we capture your architecture diagram.",
            duration: 2000,
          });

          // Apply fit view before capturing to ensure full diagram is visible
          if (mainReactFlowInstance.current && mainReactFlowInstance.current.fitView) {
            console.log('Applying fit view before diagram capture');
            mainReactFlowInstance.current.fitView({ 
              padding: 0.2, 
              duration: 300 // Short animation to settle the view
            });
            
            // Wait for fit view animation to complete
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // Wait an additional moment for any ongoing animations to complete
          await new Promise(resolve => setTimeout(resolve, 300));

          diagramImageUrl = await captureDiagramImage({
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            quality: 1.0,
            padding: 50
          });

          console.log('Successfully captured diagram for report');
          
          // Save to localStorage for the report page
          if (diagramImageUrl) {
            localStorage.setItem(`diagram_image_${currentProjectId}`, diagramImageUrl);
            localStorage.setItem(`diagram_image_timestamp_${currentProjectId}`, Date.now().toString());
            console.log('Diagram image saved to localStorage for project:', currentProjectId);
          }
          
        } catch (error) {
          console.warn('Failed to capture diagram image:', error);
          toast({
            title: "Note",
            description: "Could not capture diagram image, but report will still be generated.",
            variant: "default",
          });
        }
      } else if (viewMode === 'DFD') {
        // If we're in DFD mode, try to get the saved architecture diagram
        const savedImage = localStorage.getItem(`diagram_image_${currentProjectId}`);
        if (savedImage) {
          diagramImageUrl = savedImage;
          console.log('Using previously saved architecture diagram');
        } else {
          toast({
            title: "Switch to Architecture View",
            description: "Please switch to Architecture Diagram view to capture the current diagram.",
            variant: "default",
          });
        }
      }

      // Store current diagram state in localStorage as backup
      localStorage.setItem('diagramNodes', JSON.stringify(cleanNodes));
      localStorage.setItem('diagramEdges', JSON.stringify(cleanEdges));
      localStorage.setItem('projectId', currentProjectId || '');
      localStorage.setItem('sessionId', sessionId || '');
      
      console.log('Navigating to report with:', { 
        projectId, 
        sessionId, 
        nodesCount: cleanNodes.length, 
        edgesCount: cleanEdges.length,
        hasDiagramImage: !!diagramImageUrl
      });
      
      console.log('Navigating with project ID:', currentProjectId);
      
      // Navigate with cleaned state and diagram image
      navigate('/generate-report', { 
        state: { 
          projectId: currentProjectId,
          sessionId: sessionId,
          diagramState: cleanDiagramState,
          diagramImage: diagramImageUrl // Pass the captured image
        } 
      });
    })();

    return '/generate-report'; // Return immediately for interface compatibility
  };

  const handleRevertToDiagramState = (messageContent, diagramState) => {
    if (diagramState && diagramState.nodes && diagramState.edges) {
      const revertMessage = `Reverting diagram to state before: "${messageContent}" modification`;

      // Add revert messages with timestamps
      const userTimestamp = new Date().toISOString();
      const aiTimestamp = new Date(Date.now() + 1000).toISOString(); // Slightly after user message

      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: `Revert diagram to state before: "${messageContent}" modification`,
          timestamp: userTimestamp
        },
        {
          role: 'assistant',
          content: revertMessage,
          timestamp: aiTimestamp
        },
      ]);

      // Set layouting state to prevent unwanted re-renders during reversion
      setIsLayouting(true);
      
      // Validate and prepare diagram state before reverting
      console.log('Preparing to revert diagram state');
      
      try {
        // 1. Extract nodes and edges from the stored state
        const revertNodes = [...diagramState.nodes || []];
        let revertEdges = [...diagramState.edges || []];
        
        // 2. Validate that all edges reference valid nodes
        const nodeIds = new Set(revertNodes.map(node => node.id));
        
        // Filter out any edges that reference non-existent nodes
        revertEdges = revertEdges.filter(edge => {
          if (!edge.source || !edge.target || !nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
            console.warn(`Filtered out invalid edge during revert: edge.id=${edge.id}, source=${edge.source}, target=${edge.target}`);
            return false;
          }
          return true;
        });
        
        // 3. Separate layer nodes vs regular nodes
        const layerNodes = revertNodes.filter(node => node.type === 'layerGroup');
        const regularNodes = revertNodes.filter(node => node.type !== 'layerGroup');
        
        // 4. Prepare nodes with proper callbacks and handlers
        const preparedRegularNodes = prepareNodesForDiagram(regularNodes, revertEdges);
        
        // 5. Create fresh layer containers if none exist in the old state
        let finalNodes;
        if (layerNodes.length === 0) {
          console.log('Creating new layer containers during revert');
          const newLayerContainers = createLayerContainers(preparedRegularNodes);
          finalNodes = [...newLayerContainers, ...preparedRegularNodes];
        } else {
          console.log('Using existing layer containers during revert');
          // Use the layer containers from the reverted state but make sure they're updated
          const updatedLayerContainers = updateExistingLayerContainers(layerNodes, preparedRegularNodes);
          finalNodes = [...updatedLayerContainers, ...preparedRegularNodes];
        }
        
        // 6. Process edges to ensure they have proper styling and types
        const processedEdges = processEdges(revertEdges, preparedRegularNodes);
        
        // Clear existing state first
        setNodes([]);
        setEdges([]);
        
        // Then set new state after a brief delay
        setTimeout(() => {
          console.log(`Reverting to state with ${finalNodes.length} nodes and ${processedEdges.length} edges`);
          
          // Set nodes first
          setNodes(finalNodes);
          
          // Then set edges after a short delay to ensure nodes are rendered
          setTimeout(() => {
            setEdges(processedEdges);
            
            // Apply layout to ensure proper positioning
            setTimeout(() => {
              // Apply layout with soft positioning (don't force layout)
              (async () => {
                try {
                  const { nodes: layoutedNodes, edges: layoutedEdges } = await layoutWithELK(
                    finalNodes,
                    processedEdges,
                    { direction: 'LR', nodeWidth: 172, nodeHeight: 36 }
                  );

                  setNodes(layoutedNodes as any);
                  setEdges(layoutedEdges as any);
                } catch (err) {
                  console.error('ELK layout error during revert', err);
                }
              })();
              
              // Reset layouting state
              setIsLayouting(false);
              
              // Fit view to show all elements
              if (mainReactFlowInstance.current) {
                setTimeout(() => {
                  mainReactFlowInstance.current.fitView({ padding: 0.2 });
                }, 100);
              }
            }, 100);
          }, 100);
        }, 100);
        
        toast({
          title: "Diagram Reverted",
          description: "Successfully reverted to previous diagram state",
          variant: "default",
        });
      } catch (error) {
        console.error('Error reverting diagram state:', error);
        setIsLayouting(false);
        
        toast({
          title: "Revert Failed",
          description: "An error occurred while reverting the diagram",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Revert Failed",
        description: "Could not revert diagram - state information missing",
        variant: "destructive",
      });
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (nodePositionUpdateTimeoutRef.current) {
        clearTimeout(nodePositionUpdateTimeoutRef.current);
      }
      if (edgeUpdateTimeoutRef.current) {
        clearTimeout(edgeUpdateTimeoutRef.current);
      }
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
    };
  }, []);

  // Add this function before the return statement
  const handleToggleDataFlow = useCallback(() => {
    console.log('Toggle data flow view');
    // For DFD mode, we might want to show different types of views
    // This is a placeholder - implement based on your app's requirements
  }, []);

  // Add new handlers for DFD view zoom control
  const handleDFDZoomIn = useCallback(() => {
    if (dfdReactFlowInstance.current) {
      dfdReactFlowInstance.current.zoomIn({ duration: 300 });
    }
  }, []);

  const handleDFDZoomOut = useCallback(() => {
    if (dfdReactFlowInstance.current) {
      dfdReactFlowInstance.current.zoomOut({ duration: 300 });
    }
  }, []);

  const handleDFDFitView = useCallback(() => {
    if (dfdReactFlowInstance.current) {
      dfdReactFlowInstance.current.fitView({ padding: 0.2, duration: 300 });
    }
  }, []);

  // Add this to the main component to pass correct data to AIFlowDiagram
  // This ensures that AIFlowDiagram's equality check will work correctly
  const viewModeChange = useCallback((mode: 'AD' | 'DFD') => {
    // First set the mode
    setViewMode(mode);

    // Then call the handler with proper switch logic
    handleSwitchView(mode);
  }, [handleSwitchView]);

  // Add chat panel resizing handlers
  const startResizingChat = (e) => {
    e.preventDefault();
    setIsResizingChat(true);
    document.body.style.cursor = 'ew-resize';
  };

  const handleResizeChat = useCallback((e) => {
    if (!isResizingChat) return;
    
    // Calculate new width based on mouse position
    const newWidth = e.clientX;
    
    // Constrain to min/max range
    const constrainedWidth = Math.max(minChatWidth, Math.min(maxChatWidth, newWidth));
    
    setChatPanelWidth(constrainedWidth);
  }, [isResizingChat, minChatWidth, maxChatWidth]);

  const stopResizingChat = useCallback(() => {
    setIsResizingChat(false);
    document.body.style.cursor = '';
  }, []);

  // Add event listeners for chat panel resizing
  useEffect(() => {
    if (isResizingChat) {
      document.addEventListener('mousemove', handleResizeChat);
      document.addEventListener('mouseup', stopResizingChat);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleResizeChat);
      document.removeEventListener('mouseup', stopResizingChat);
      document.body.style.cursor = ''; // Ensure cursor is reset when effect is cleaned up
    };
  }, [isResizingChat, handleResizeChat, stopResizingChat]);

  return (
    <Layout>
      <div className="fixed top-16 left-0 right-0 bottom-0 overflow-hidden flex flex-col mt-2">
        <div className="flex h-full w-full">
          <div
            className={`${styles.resizablePanel} ${isResizingChat ? styles.resizing : ''} ${isChatCollapsed ? styles.collapsedPanel : ''}`}
            style={{ width: isChatCollapsed ? `${collapsedWidth}px` : `${chatPanelWidth}px` }}
          >
            {/* Resize handle */}
            <div 
              className={styles.resizeHandle}
              onMouseDown={startResizingChat}
              title="Drag to resize panel"
            >
              <div className={styles.resizeHandleVisual} />
            </div>
            <button
              onClick={toggleChatCollapse}
              className={styles.toggleButton}
              title={isChatCollapsed ? "Expand chat panel" : "Collapse chat panel"}
            >
              {isChatCollapsed ? 
                <ChevronRight size={10} className="text-blue-500 mx-auto" /> : 
                <ChevronLeft size={10} className="text-blue-500 mx-auto" />
              }
            </button>
            

            {isChatCollapsed ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  <div className="transform -rotate-90 whitespace-nowrap text-gray-500 text-xs font-medium tracking-wide">
                    AI Chat Panel
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-hidden">
                <div className="flex-1 h-full overflow-hidden">
                  <div className="w-full h-full shadow-md rounded-r-lg">
                    <AIChat
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      onSaveProject={save}
                      onGenerateReport={handleGenerateReportWithNavigation}
                      isLoading={isLoading}
                      thinking={thinking}
                      error={error}
                      projectId={projectId}
                      isLoadedProject={projectLoaded}
                      diagramState={{ nodes, edges }}
                      onRevertToDiagramState={handleRevertToDiagramState}
                      suggestion={suggestion}
                      showSuggestion={showSuggestion}
                      onCloseSuggestion={() => setShowSuggestion(false)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-row h-full overflow-hidden">
            {/* Layout with single level of nesting, simpler structure */}
            <div className="flex-1 relative">
              {viewMode === 'AD' ? (
                <div className="h-full w-full relative">
                  {/* Diagram */}
                  <AIFlowDiagram
                    nodes={nodes}
                    edges={stableEdges}
                    setNodes={setNodes}
                    setEdges={setEdges}
                    viewMode={viewMode}
                    onSwitchView={viewModeChange}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onFitView={handleFitView}
                    onCopy={handleCopy}
                    onPaste={handlePaste}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onComment={handleComment}
                    onGenerateReport={handleGenerateReportWithNavigation}
                    onSave={handleActualSave}
                    onLayout={applyLayout}
                    isLayouting={isLayouting}
                    reactFlowInstanceRef={mainReactFlowInstance}
                    projectId={projectId}
                  />

                  {/* Overlay spinner while layout pending, only if diagram exists */}
                  {!diagramReady && nodes.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-30">
                      <Loader2 className="h-10 w-10 animate-spin text-securetrack-purple" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full w-full flex flex-col">
                  <DiagramActions
                    viewMode={viewMode}
                    onSwitchView={viewModeChange}
                    onZoomIn={handleDFDZoomIn}
                    onZoomOut={handleDFDZoomOut}
                    onFitView={handleDFDFitView}
                    onCopy={handleCopy}
                    onPaste={handlePaste}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onComment={handleComment}
                    onToggleDataFlow={handleToggleDataFlow}
                    onGenerateReport={handleGenerateReportWithNavigation}
                    onSave={handleActualSave}
                    projectId={projectId}
                  />
                  <div className="flex-1 overflow-auto bg-white">
                    {/* DFD Content */}
                    {dfdGenerationStatus === 'generating' && <DFDLoadingIndicator />}
                    {dfdGenerationStatus === 'complete' && <DFDVisualization dfdData={dfdData} reactFlowInstanceRef={dfdReactFlowInstance} />}
                    {dfdGenerationStatus === 'failed' && (
                      <div className="h-full flex items-center justify-center">
                        <Card className="max-w-md">
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                              Generation Failed
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p>Unable to generate the threat model. Please try again.</p>
                            <Button onClick={() => viewModeChange('DFD')} className="mt-4">
                              Retry
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Toolbar - Always visible */}
            {/* <ToolbarPanel onAddNode={combinedAddNode} viewMode={viewMode} /> */}
          </div>
        </div>

        {editNodeDialogOpen && currentEditNode && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Edit Node</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Label</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={currentEditNode.label}
                    onChange={(e) => setCurrentEditNode({ ...currentEditNode, label: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    value={currentEditNode.description || ''}
                    onChange={(e) => setCurrentEditNode({ ...currentEditNode, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    className="px-4 py-2 border rounded-md hover:bg-gray-100"
                    onClick={() => setEditNodeDialogOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    onClick={() => {
                      handleSaveNodeEdit(currentEditNode.id, {
                        label: currentEditNode.label,
                        description: currentEditNode.description || '',
                      });
                      setEditNodeDialogOpen(false);
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showClarificationQuestions && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 max-w-md z-10">
            <h3 className="text-md font-semibold mb-2">I need some clarification:</h3>
            <ul className="space-y-2">
              {clarificationQuestions.map((question, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleQuestionSelect(question)}
                    className="text-blue-600 hover:text-blue-800 hover:underline text-left w-full"
                  >
                    {question}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ModelWithAI;
