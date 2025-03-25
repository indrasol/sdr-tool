import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useDiagramWithAI } from '@/components/AI/hooks/useDiagramWithAI';
import AIChat from '@/components/AI/AIChat';
import DiagramPanel from '@/components/AI/panels/DiagramPanel';
import { Edge, Node } from '@xyflow/react';
import { CustomNodeData } from '@/components/AI/types/diagramTypes';
import ToolbarPanel from '@/components/AI/panels/ToolbarPanel';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { DesignRequest, ResponseType } from '@/interfaces/aiassistedinterfaces';
import { sendDesignRequest } from '@/services/designService';
import projectService from '@/services/projectService';
import { useDiagramNodes } from '@/components/AI/hooks/useDiagramNodes';
import { edgeStyles, determineEdgeType } from '@/components/AI/utils/edgeStyles';
// Import getLayoutedElements directly from AIFlowDiagram to ensure consistency
import { getLayoutedElements } from '@/components/AI/AIFlowDiagram';
import dagre, { layout } from 'dagre';

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
      const request = {
        project_id: projectId,
        query: message,
        diagram_state: { nodes, edges },
        session_id: sessionId || undefined,
      };

      const response = await sendDesignRequest(request, true);
      console.log("Full response:", response);

      if (response.response.session_id) {
        setSessionId(response.response.session_id);
      }

      console.log("Adding AI response:", response.response.message);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: response.response.message,
        isAlreadyTyped: false  // Explicitly set to false to ensure typing animation works
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
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to get response from AI assistant. Please try again.');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error processing your request. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
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

  // Load project on mount if projectId is provided
  // useEffect(() => {
  //   if (initialProjectId && !projectLoaded) {
  //     load(initialProjectId);
  //   }
  // }, [initialProjectId, projectLoaded, load]);

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
            <DiagramPanel
              defaultSize={100}
              nodes={nodes}
              edges={stableEdges}
              setNodes={(newNodes) => {
                // Detect if this is a drag operation by comparing positions only
                const isDragUpdate = isNodeDragging || 
                  (nodes.length === newNodes.length && 
                   nodes.some((oldNode, i) => {
                     const newNode = newNodes[i];
                     return oldNode.id === newNode.id && 
                            (oldNode.position.x !== newNode.position.x || 
                             oldNode.position.y !== newNode.position.y);
                   }));
                
                if (isDragUpdate) {
                  setIsNodeDragging(true);
                  
                  // Clear any existing timeout
                  if (nodePositionUpdateTimeoutRef.current) {
                    clearTimeout(nodePositionUpdateTimeoutRef.current);
                  }
                  
                  // Schedule an update after dragging finishes
                  nodePositionUpdateTimeoutRef.current = setTimeout(() => {
                    setNodes(newNodes);
                    setIsNodeDragging(false);
                  }, 100);
                } else {
                  // Not a drag operation, update immediately
                  setNodes(newNodes);
                }
              }}
              setEdges={(newEdges) => {
                // Don't process edge updates during node dragging
                if (isNodeDragging) {
                  return;
                }

                // Handle both direct array and functional updater cases
                const edgesToProcess = typeof newEdges === 'function' 
                ? newEdges(edges) // If it's a function, call it with current edges
                : newEdges;   
                
                // Detect if this is a rapid edge update (possibly AI-generated)
                const isRapidUpdate = isEdgeUpdating || 
                  (edgesToProcess.length !== edges.length || 
                   JSON.stringify(edgesToProcess) !== JSON.stringify(edges));
                   
                if (isRapidUpdate) {
                  setIsEdgeUpdating(true);
                  
                  // Clear any existing timeout
                  if (edgeUpdateTimeoutRef.current) {
                    clearTimeout(edgeUpdateTimeoutRef.current);
                  }
                  
                  // Schedule an update after a brief delay to batch changes
                  edgeUpdateTimeoutRef.current = setTimeout(() => {
                    // Process edges with proper styling and types before updating state
                    const processedEdges = processEdges(edgesToProcess, nodes);
                    setEdges(() => processedEdges);
                    setIsEdgeUpdating(false);
                  }, 100);
                } else {
                  // Normal update, process and set immediately
                  const processedEdges = processEdges(edgesToProcess, nodes);
                  setEdges(() => processedEdges);
                }
              }}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitView={handleFitView}
              onCopy={handleCopy}
              onPaste={handlePaste}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onSelect={handleSelect}
              onComment={handleComment}
              onGenerateReport={handleGenerateReportWithNavigation}
              onSave={handleActualSave}
              onLayout={applyLayout}
              isLayouting={isLayouting}
            />

            <ToolbarPanel onAddNode={combinedAddNode} />
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