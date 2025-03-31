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
import { DesignRequest, DesignResponse, DFDGenerationStartedResponse, ResponseType } from '@/interfaces/aiassistedinterfaces';
import { sendDesignRequest } from '@/services/designService';
import projectService from '@/services/projectService';
import { useDiagramNodes } from '@/components/AI/hooks/useDiagramNodes';
import { edgeStyles, determineEdgeType } from '@/components/AI/utils/edgeStyles';
// Import getLayoutedElements directly from AIFlowDiagram to ensure consistency
import AIFlowDiagram, { getLayoutedElements } from '@/components/AI/AIFlowDiagram';
import dagre, { layout } from 'dagre';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import DFDVisualization from '@/components/AI/DFDVisualization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuthHeaders, BASE_API_URL, fetchWithTimeout, DEFAULT_TIMEOUT } from '../services/apiService'

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
    
    // Determine edge type
    const edgeType = edge.type || determineEdgeType(edge.source, edge.target, nodes);
    
    // Get styling for this edge type
    const typeStyle = edgeStyles[edgeType] || edgeStyles.dataFlow || edgeStyles.default || {};
    
    // Create properly formatted edge object
    return {
      ...edge,
      id: edgeId,
      type: 'smoothstep',  // Force consistent edge type
      animated: edgeType === 'dataFlow' || edgeType === 'database',
      // Use a dedicated markerEnd object for better arrow rendering
      markerEnd: {
        type: 'arrowclosed',
        width: 10,
        height: 10,
        color: typeStyle.stroke || '#555'
      },
      style: {
        strokeWidth: 2,
        stroke: typeStyle.stroke || '#555',
        ...(typeStyle || {}),
        ...(edge.style || {})
      }
    };
  }).filter(Boolean);
};

const ModelWithAI = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // UI state
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  // Core state
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [thinking, setThinking] = useState(null);
  const [projectId, setProjectId] = useState('default-project');
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
  const layoutTimeoutRef = useRef(null);
  const previousNodesLengthRef = useRef(0);
  const previousEdgesLengthRef = useRef(0);
  
  // Track if diagram already has loaded data
  const hasLoadedDiagramData = useRef(false);

  // DFD states
  const [viewMode, setViewMode] = useState<'AD' | 'DFD'>('AD');
  const [dfdData, setDfdData] = useState<any>(null);
  const [dfdGenerationStatus, setDfdGenerationStatus] = useState<string>('idle'); // 'idle', 'generating', 'complete', 'failed'
  const [dfdPollingInterval, setDfdPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const dfdReactFlowInstance = useRef(null);

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
    handleAddNode: handleAddNodeWithType,
    handleSaveNodeEdit,
  } = useDiagramNodes(nodes, edges, setNodes, setEdges);

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

  // Apply layout function
  const applyLayout = useCallback(() => {
    console.log('ModelWithAI: Applying layout, nodes:', nodes.length);
    if (isLayouting || nodes.length === 0) return;
    
    setIsLayouting(true);
    
    try {
      // Process nodes and edges first
      const preparedNodes = prepareNodes(nodes);
      const processedEdges = processEdges(edges, preparedNodes);
      
      // Apply layout
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        preparedNodes,
        processedEdges,
        'TB',  // Top to Bottom layout
        172,   // Node width
        36     // Node height
      );
      
      // Update state with new layout - must use function form to avoid state sync issues
      if (layoutedNodes && layoutedNodes.length > 0) {
        setNodes(() => layoutedNodes);
        
        // Delay edge updates to prevent glitching
        setTimeout(() => {
          if (layoutedEdges) setEdges(() => layoutedEdges);
          setIsLayouting(false);
        }, 200);
      } else {
        setIsLayouting(false);
      }
    } catch (error) {
      console.error('Error applying layout:', error);
      setIsLayouting(false);
    }
  }, [nodes, edges, isLayouting, prepareNodes, setNodes, setEdges]);

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

  const fixedExpandedWidth = 600;
  const collapsedWidth = 48;

  // Initialize component and load project if available
  useEffect(() => {
    toast({
      title: "Welcome to Model Designer",
      description: "Create your security architecture using natural language or the diagram tools.",
      duration: 5000,
    });

    let projectIdToUse = '';
    if (params.projectId) {
      projectIdToUse = params.projectId;
      console.log('Project ID from URL params:', projectIdToUse);
    } else if (location.state && location.state.projectId) {
      projectIdToUse = location.state.projectId;
      console.log('Project ID from navigation state:', projectIdToUse);
    } else if (projectId) {
      projectIdToUse = projectId;
      console.log('Using existing project ID:', projectIdToUse);
    }

    if (projectIdToUse) {
      setProjectId(projectIdToUse);
      if (!projectLoaded) {
        load(projectIdToUse);
      }
    }

    return () => {
      console.log("ModelWithAI component unmounting, cleaning up...");
      if (sessionIdRef.current) {
        const currentDiagramState = { nodes: nodesRef.current, edges: edgesRef.current };
        projectService.saveProject(sessionIdRef.current, currentDiagramState).catch(err => {
          console.error("Error saving project on unmount:", err);
        });
      }
    };
  }, [toast, location.state, params, projectId, projectLoaded]);

  const handleSwitchView = useCallback(async (mode: 'AD' | 'DFD') => {
    console.log(`Switching view mode to: ${mode}`);
    
    if (mode === viewMode) return;
    
    // Update the view mode state
    setViewMode(mode);
    
    if (mode === 'DFD') {
      // Set loading state
      setDfdGenerationStatus('generating');
      
      try {
        // Prepare the request with current diagram state
        const request = {
          diagram_state: { nodes, edges },
          session_id: sessionId || undefined,
        };

        // Call the API to trigger DFD generation or fetch existing DFD
        const response = await fetchWithTimeout(
          `${BASE_API_URL}/projects/${projectId}/switch-to-dfd`,
          {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(request)
          },
          30000 // 30 second timeout
        );
  
        // Check for non-JSON responses (like HTML)
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Received non-JSON response:', contentType);
          // Get response text for debugging
          const responseText = await response.text();
          console.error('Response text (first 500 chars):', responseText.substring(0, 500));
          throw new Error('Invalid response format. Expected JSON.');
        }
        
        // Process all response data
        const data = await response.json();
        console.log('API Response:', data);

        // Handle different response statuses
        if (data.status === 'complete' && data.dfd_data) {
          // DFD data already exists and is up-to-date
          console.log('DFD data already exists:', data.dfd_data);
          setDfdData(data.dfd_data);
          setDfdGenerationStatus('complete');

          // Show a toast to indicate we're using existing data
          toast({
            title: 'Using Existing Threat Model',
            description: data.message || 'Using the existing threat model data.',
            variant: 'default',
          });
        } 
        else if (data.status === 'insufficient_diagram') {
          // Diagram doesn't have enough components
          setDfdGenerationStatus('failed');
          toast({
            title: 'Diagram Too Simple',
            description: data.message || 'Your diagram needs more components to generate a threat model.',
            variant: 'destructive',
          });
        }
        else if (data.status === 'generating') {
          // Generation has started - begin polling
          console.log('DFD generation initiated:', data);
          startPollingDfdStatus();

          // Show toast indicating generation started
          toast({
            title: 'Generating Threat Model',
            description: data.message || 'Building threat model from your architecture. This may take a minute.',
          });
        } 
        else {
          // Handle other statuses
          throw new Error(`Unexpected status: ${data.status}`);
        }
      } catch (error) {
        console.error('Error triggering DFD generation:', error);
        setDfdGenerationStatus('failed');
        
        toast({
          title: 'Error',
          description: error.message || 'Failed to generate threat model. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      // Clear polling interval when switching back to AD mode
      if (dfdPollingInterval) {
        clearInterval(dfdPollingInterval);
        setDfdPollingInterval(null);
      }
    }
  }, [viewMode, projectId, dfdPollingInterval, toast, nodes, edges, sessionId]);
  
  // Add function to poll DFD generation status
  const startPollingDfdStatus = useCallback(() => {
    // Clear existing interval if any
    if (dfdPollingInterval) {
      clearInterval(dfdPollingInterval);
    }
    
    let retryCount = 0;
    const maxRetries = 10; // About 10 minutes with 15-second intervals
    
    // Set polling interval
    const intervalId = setInterval(async () => {
      try {
        // Stop polling if we've reached max retries
        if (retryCount >= maxRetries) {
          clearInterval(intervalId);
          setDfdPollingInterval(null);
          setDfdGenerationStatus('failed');
          
          toast({
            title: 'DFD Generation Timeout',
            description: 'The threat model generation is taking longer than expected. Please try again.',
            variant: 'destructive',
          });
          return;
        }
        
        retryCount++;
        console.log(`Polling DFD status (attempt ${retryCount}/${maxRetries})...`);
        
        const statusResponse = await fetchWithTimeout(
          `${BASE_API_URL}/projects/${projectId}/threatmodel/status`,
          {
            method: 'GET',
            headers: getAuthHeaders(),
          },
          10000 // 10 second timeout
        );
        
        // Check for valid JSON response
        const contentType = statusResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await statusResponse.text();
          console.error('Status response text:', responseText.substring(0, 500));
          throw new Error('Invalid status response format. Expected JSON.');
        }
        
        const statusData = await statusResponse.json();
        const status = statusData.status;
        
        console.log('DFD generation status:', statusData);
        
        // Update UI with progress information if available
        if (status === 'in_progress' && statusData.progress) {
          // Show progress information to the user
          setDfdGenerationStatus('generating');
          
          // Add a message based on the step
          const stepMessages = {
            'initializing': 'Initializing threat model generation...',
            'analyzing_architecture': 'Analyzing architecture components...',
            'generating_threat_model': 'Building threat model from architecture...',
            'analyzing_threats': 'Analyzing potential security threats...',
            'finalizing_results': 'Finalizing threat model...'
          };
          
          const progressMessage = stepMessages[statusData.step] || statusData.message || 'Generating threat model...';
          
          // Consider updating UI with progress information here
          console.log(`Progress: ${statusData.progress}, Step: ${statusData.step}, Message: ${progressMessage}`);
        }
        
        // Handle completion status
        if (status === 'complete') {
          // Fetch the completed DFD data
          const dfdResponse = await fetchWithTimeout(
            `${BASE_API_URL}/projects/${projectId}/threatmodel`,
            {
              method: 'GET',
              headers: getAuthHeaders(),
            },
            10000 // 10 second timeout
          );
          
          if (!dfdResponse.ok) {
            throw new Error(`Failed to fetch DFD data: ${dfdResponse.status}`);
          }
          
          const dfdContentType = dfdResponse.headers.get('content-type');
          if (!dfdContentType || !dfdContentType.includes('application/json')) {
            const responseText = await dfdResponse.text();
            console.error('DFD response text:', responseText.substring(0, 500));
            throw new Error('Invalid DFD response format. Expected JSON.');
          }
          
          const dfdData = await dfdResponse.json();
          setDfdData(dfdData);
          setDfdGenerationStatus('complete');
          
          // Clear polling interval
          clearInterval(intervalId);
          setDfdPollingInterval(null);
  
          // Show success toast with threat count
          const threatCount = dfdData.threats ? dfdData.threats.length : 0;
          const perfStats = dfdData.performance || {};
          let toastMessage = `${threatCount} potential threats identified.`;
          
          // Add performance stats if available
          if (perfStats.total_time) {
            toastMessage += ` Generated in ${Math.round(perfStats.total_time)} seconds.`;
          }
          
          toast({
            title: 'Threat Model Generated',
            description: toastMessage,
            variant: 'default'
          });
          
          if (viewMode === 'AD') {
            toast({
              title: 'Threat Model Generated',
              description: 'Data Flow Diagram is now available. Switch to DFD view to see it.',
              action: (
                <Button size="sm" variant="outline" onClick={() => setViewMode('DFD')}>
                  View DFD
                </Button>
              )
            });
          }
        } 
        // Handle cancelled status
        else if (status === 'cancelled') {
          setDfdGenerationStatus('failed');
          clearInterval(intervalId);
          setDfdPollingInterval(null);
          
          // Automatically switch back to AD view when cancelled
          if (viewMode === 'DFD') {
            setViewMode('AD');
            
            // Force a state refresh after a short delay
            setTimeout(() => {
              setDfdData(null);
            }, 300);
          }
          
          toast({
            title: 'Generation Cancelled',
            description: statusData.message || 'The threat model generation was cancelled.',
            variant: 'default',
          });
        }
        else if (status === 'failed') {
          setDfdGenerationStatus('failed');
          clearInterval(intervalId);
          setDfdPollingInterval(null);
          
          toast({
            title: 'Error',
            description: statusData.error || 'Failed to generate threat model',
            variant: 'destructive',
          });
        }
        // Add explicit check for "not_started" state that persists too long
        else if (status === 'not_started' && retryCount > 3) {
          // If we've polled multiple times and status is still not_started, try triggering again
          try {
            console.log("Status still 'not_started' after multiple polls, retrying generation...");
            
            const triggerResponse = await fetchWithTimeout(
              `${BASE_API_URL}/projects/${projectId}/threatmodel`,
              {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  diagram_state: { nodes, edges }
                })
              },
              10000 // 10 second timeout
            );
            
            if (triggerResponse.ok) {
              console.log("Successfully re-triggered DFD generation");
              toast({
                title: 'Retrying Generation',
                description: 'Generation did not start properly. Retrying...',
                variant: 'default',
              });
            }
          } catch (triggerError) {
            console.error("Error re-triggering generation:", triggerError);
          }
        }
        // Continue polling for 'in_progress' status
      } catch (error) {
        console.error('Error polling DFD status:', error);
        // Don't stop polling on errors unless we've had too many
        if (retryCount >= 5) {
          clearInterval(intervalId);
          setDfdPollingInterval(null);
          setDfdGenerationStatus('failed');
          
          toast({
            title: 'Error',
            description: 'Failed to check threat model generation status',
            variant: 'destructive',
          });
        }
      }
    }, 15000); // Poll every 15 seconds
    
    setDfdPollingInterval(intervalId);
    
    // Return cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }, [projectId, dfdPollingInterval, toast, nodes, edges, viewMode]);

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
          const loadedNodes = (projectData.diagram_state.nodes || []).map((node) => ({
            ...node,
            type: 'default', // Normalize to 'default' for React Flow
            data: {
              ...node.data,
              nodeType: node.type || 'default', // Preserve original type
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

          // Process and set nodes and edges
          const preparedNodes = prepareNodes(loadedNodes);
          const validEdges = loadedEdges.filter((edge) => {
            if (!edge.source || !edge.target) {
              console.warn(`Skipping invalid edge without source or target:`, edge);
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
          const processedEdges = processEdges(validEdges);

          hasLoadedDiagramData.current = true;

          setNodes(preparedNodes);
          setEdges(processedEdges);

          // Apply layout after a short delay
          setTimeout(() => {
            applyLayout();
          }, 500);
        }

        if (projectData.conversation_history && Array.isArray(projectData.conversation_history)) {
          const formattedMessages = projectData.conversation_history
            .map((entry) => {
              if (entry.query && entry.response) {
                return [
                  { role: 'user', content: entry.query, isPreExisting: true },
                  { role: 'assistant', content: entry.response.message || entry.response, isPreExisting: true },
                ];
              }
              return [];
            })
            .flat();
          setMessages(formattedMessages);
        }

        setProjectLoaded(true);
        toast({
          title: 'Project Loaded',
          description: `Project ${projectData.project_id} loaded successfully`,
          variant: 'default',
        });
      } catch (error) {
        console.error('Error loading project:', error);
        setError(`Failed to load project: ${error.message}`);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load project',
          variant: 'destructive',
        });
      } finally {
        setIsProjectLoading(false);
      }
    },
    [setNodes, setEdges, prepareNodes, processEdges, applyLayout]
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
      console.log(`Saving project with session ID: ${sessionId}`);
      const currentDiagramState = { nodes, edges };
      const response = await projectService.saveProject(sessionId, currentDiagramState);
      console.log(`Saved Response: ${response}`);

      if (response) {
        toast({
          title: "Project Saved",
          description: `Project ${projectId} saved successfully`,
          variant: "default",
        });
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

    setMessages((prev) => [...prev, { role: 'user', content: message }]);
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

      const request = {
        project_id: projectId,
        query: message,
        diagram_state: { nodes, edges },
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
        
        // Add assistant message about DFD generation
        setMessages((prev) => [...prev, { 
          role: 'assistant', 
          content: response.message || "I've started generating the Data Flow Diagram. This might take a moment.",
          isAlreadyTyped: false
        }]);
        
        // Set DFD status and start polling
        setDfdGenerationStatus('generating');
        startPollingDfdStatus();
      }
      else if (isDesignResponse(response)) {
        // This is a regular design response
        if (response.response.session_id) {
          setSessionId(response.response.session_id);
        }
        
        console.log("Adding AI response:", response.response.message);
        setMessages((prev) => [...prev, { 
          role: 'assistant', 
          content: response.response.message,
          isAlreadyTyped: false
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
        console.log("is loaded project",projectLoaded)
        console.log("Messages : ",messages)
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

  const handleResponseByType = (response) => {
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
        startPollingDfdStatus();
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
  };

  // Handle architecture response from AI
  const handleArchitectureResponse = useCallback(
    (response) => {
      console.log('Handling Architecture Response');
      setIsLayouting(true);

      const diagramUpdates = response.diagram_updates || {};
      const nodesToAdd = response.nodes_to_add || [];
      const edgesToAdd = response.edges_to_add || [];
      const elementsToRemove = response.elements_to_remove || [];

      let updatedNodes = [...nodes];
      let updatedEdges = [...edges];

      // Remove elements
      if (elementsToRemove.length > 0) {
        console.log('Removing elements:', elementsToRemove);
        const elementsToRemoveSet = new Set(elementsToRemove);
        updatedNodes = updatedNodes.filter((node) => !elementsToRemoveSet.has(node.id));
        updatedEdges = updatedEdges.filter(
          (edge) =>
            !elementsToRemoveSet.has(edge.id) &&
            !elementsToRemoveSet.has(edge.source) &&
            !elementsToRemoveSet.has(edge.target)
        );
      }

      // Add new nodes
      if (nodesToAdd.length > 0) {
        console.log('Adding nodes:', nodesToAdd);
        const processedNodesToAdd = nodesToAdd.map((node) => ({
          ...node,
          type: 'default', // Normalize to 'default'
          position: node.position || { x: Math.random() * 500, y: Math.random() * 300 },
          data: {
            ...(node.data || {}),
            nodeType: node.type || 'default', // Preserve original type
            label: node.data?.label || node.id || 'Node',
            onEdit: handleEditNode,
            onDelete: handleDeleteNode,
          },
        }));
        const preparedNewNodes = prepareNodes(processedNodesToAdd);
        updatedNodes = [...updatedNodes, ...preparedNewNodes];
      }

      // Add new edges
      if (edgesToAdd.length > 0) {
        const validEdgesToAdd = edgesToAdd.filter((edge) => {
          if (!edge.source || !edge.target) {
            console.warn('Skipping edge with missing source or target:', edge);
            return false;
          }
          const sourceExists = updatedNodes.some((node) => node.id === edge.source);
          const targetExists = updatedNodes.some((node) => node.id === edge.target);
          if (!sourceExists || !targetExists) {
            console.warn(`Skipping edge with missing ${!sourceExists ? 'source' : 'target'} node:`, edge);
            return false;
          }
          return true;
        });
        const processedEdgesToAdd = processEdges(validEdgesToAdd);
        updatedEdges = [...updatedEdges, ...processedEdgesToAdd];
      }

      // Apply updates to existing nodes
      if (Object.keys(diagramUpdates).length > 0) {
        updatedNodes = updatedNodes.map((node) => {
          const updates = diagramUpdates[node.id];
          if (updates) {
            console.log(`Updating node ${node.id}:`, updates);
            return {
              ...node,
              ...updates,
              type: 'default', // Ensure updated nodes use 'default'
              data: {
                ...node.data,
                ...(updates.data || {}),
                nodeType: node.type || 'default',
                label: updates.data?.label || node.data.label,
                onEdit: handleEditNode,
                onDelete: handleDeleteNode,
              },
            };
          }
          return node;
        });
      }

      // Apply layout and update state
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(updatedNodes, updatedEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      setArchitectureUpdated(true);
      setIsLayouting(false);
    },
    [nodes, edges, setNodes, setEdges, prepareNodes, processEdges]
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
    // Create a reference to current generation status
    const [progressDetails, setProgressDetails] = useState({
      progress: "0%",
      step: "initializing",
      message: "Preparing to generate threat model...",
      elapsed: 0
    });

    // State to track cancellation
    const [isCancelling, setIsCancelling] = useState(false);

    // Poll for progress updates
    useEffect(() => {
      // Function to fetch status
      const fetchStatus = async () => {
        try {
          const response = await fetchWithTimeout(
            `${BASE_API_URL}/projects/${projectId}/threatmodel/status`,
            {
              method: 'GET',
              headers: getAuthHeaders(),
            },
            5000 // 5 second timeout for UI updates
          );

          if (response.ok) {
            const statusData = await response.json();
            
            // If status is 'cancelled', update UI accordingly
            if (statusData.status === 'cancelled') {
              setDfdGenerationStatus('failed');
              toast({
                title: 'Generation Cancelled',
                description: 'Threat model generation was cancelled',
                variant: 'default',
              });
              
              // Clear polling interval
              if (dfdPollingInterval) {
                clearInterval(dfdPollingInterval);
                setDfdPollingInterval(null);
              }
              return;
            }
            
            if (statusData.status === 'in_progress') {
              // Update progress information
              setProgressDetails({
                progress: statusData.progress || "0%",
                step: statusData.step || "initializing",
                message: statusData.message || "Generating threat model...",
                elapsed: statusData.elapsed_seconds || 0
              });
            }
          }
        } catch (error) {
          console.error("Error fetching progress update:", error);
        }
      };

      // Fetch status immediately
      fetchStatus();
      
      // Then set up interval to update every 3 seconds
      const progressInterval = setInterval(fetchStatus, 3000);
      
      // Clean up on unmount
      return () => clearInterval(progressInterval);
    }, []);

    // Function to handle cancellation
    const handleCancelGeneration = async () => {
      setIsCancelling(true);
      
      try {
        const response = await fetchWithTimeout(
          `${BASE_API_URL}/projects/${projectId}/threatmodel/cancel`,
          {
            method: 'POST',
            headers: getAuthHeaders(),
          },
          5000 // 5 second timeout
        );
        
        if (response.ok) {
          const result = await response.json();
          
          // Immediately switch back to AD view
          setViewMode('AD');
          
          // Clear any DFD polling interval
          if (dfdPollingInterval) {
            clearInterval(dfdPollingInterval);
            setDfdPollingInterval(null);
          }
          
          // Reset DFD generation status
          setDfdGenerationStatus('idle');
          
          toast({
            title: 'Generation Cancelled',
            description: 'Threat model generation has been cancelled. Switched back to Architecture Diagram.',
            variant: 'default',
          });
          
          // Force a state refresh after a short delay to ensure clean transition
          setTimeout(() => {
            setDfdData(null);
          }, 500);
        } else {
          // Show error toast if cancellation failed
          toast({
            title: 'Cancellation Failed',
            description: 'Unable to cancel the threat model generation. Please try again.',
            variant: 'destructive',
          });
          setIsCancelling(false);
        }
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
      return stepMessages[step] || progressDetails.message;
    };

    return (
      <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-10">
        <Loader2 className="h-10 w-10 animate-spin text-securetrack-purple mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">Generating Threat Model</h3>
        
        {/* Progress information */}
        <div className="mt-6 w-64 bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-securetrack-purple h-2.5 rounded-full transition-all duration-500" 
            style={{ width: progressDetails.progress }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-600 mt-2">
          {getStepMessage(progressDetails.step)}
        </p>
        
        {progressDetails.elapsed > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Time elapsed: {formatElapsedTime(progressDetails.elapsed)}
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
      handleAddNodeWithType(nodeType, position, iconRenderer);
      handleAddNode(nodeType, position, iconRenderer);
    },
    [handleAddNodeWithType, handleAddNode]
  );

  const handleActualSave = async () => {
    await save();
    hookHandleSave();
  };

  const handleGenerateReportWithNavigation = () => {
    const reportPath = handleGenerateReport();
    navigate(reportPath);
    return reportPath;
  };

  const handleRevertToDiagramState = (messageContent, diagramState) => {
    if (diagramState && diagramState.nodes && diagramState.edges) {
      const revertMessage = `Reverting diagram to state before: "${messageContent}" modification`;
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: `Revert diagram to state before: "${messageContent}" modification` },
        { role: 'assistant', content: revertMessage },
      ]);
      
      // Clear existing state first
      setNodes([]);
      setEdges([]);
      
      // Then set new state after a brief delay
      setTimeout(() => {
        setNodes(diagramState.nodes);
        
        // Set edges after nodes to ensure proper rendering
        setTimeout(() => {
          setEdges(diagramState.edges);
        }, 100);
      }, 100);
      
      toast({
        title: "Diagram Reverted",
        description: "Successfully reverted to previous diagram state",
        variant: "default",
      });
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

  return (
    <Layout>
      <div className="fixed top-16 left-0 right-0 bottom-0 overflow-hidden flex flex-col mt-2">
        <div className="flex h-full w-full">
          <div
            className="h-full bg-white border-r border-gray-200 transition-all duration-300 relative flex-shrink-0"
            style={{ width: isChatCollapsed ? `${collapsedWidth}px` : `${fixedExpandedWidth}px` }}
          >
            <button
              onClick={toggleChatCollapse}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 z-10 w-6 h-14 bg-white rounded-r-md border border-l-0 border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50"
              style={{ right: '-3px' }}
            >
              {isChatCollapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
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
              <div className="h-full overflow-y-auto">
                <div className="flex-1 h-full overflow-hidden">
                  <div className="w-full h-full overflow-hidden shadow-md rounded-r-lg">
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
                <AIFlowDiagram 
                  nodes={nodes}
                  edges={stableEdges}
                  setNodes={setNodes}
                  setEdges={setEdges}
                  viewMode={viewMode}
                  onSwitchView={handleSwitchView}
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
                />
              ) : (
                <div className="h-full w-full flex flex-col">
                  <DiagramActions
                    viewMode={viewMode}
                    onSwitchView={handleSwitchView}
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
                            <Button onClick={() => handleSwitchView('DFD')} className="mt-4">
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
            <ToolbarPanel onAddNode={combinedAddNode} viewMode={viewMode} />
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

        {showSuggestion && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 max-w-md z-10">
            <h3 className="text-md font-semibold mb-2">Perhaps you meant:</h3>
            <button
              onClick={handleUseSuggestion}
              className="text-blue-600 hover:text-blue-800 hover:underline text-left w-full"
            >
              {suggestion}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ModelWithAI;