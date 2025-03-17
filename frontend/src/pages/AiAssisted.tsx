import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import AIChat, { Message } from '@/components/AI/AIChat';
import AIFlowDiagram from '@/components/AI/AIFlowDiagram';
import { diagramNodesState, diagramEdgesState } from '@/components/AI/diagramState';
import { Edge, Node } from '@xyflow/react';
import { CustomNodeData } from '@/components/AI/types/diagramTypes';
import { ArchitectureResponse, DesignRequest, ResponseType  } from '@/interfaces/aiassistedinterfaces';
import { sendDesignRequest } from '@/services/designService';
import projectService from '@/services/projectService';
import ThinkingDisplay from '@/components/AI/ThinkingDisplay';

const AiAssisted = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [nodes, setNodes] = useState<Node<CustomNodeData>[]>(diagramNodesState);
  const [edges, setEdges] = useState(diagramEdgesState);

  // Track when diagram should be updated from architecture response
  const [diagramUpdateTrigger, setDiagramUpdateTrigger] = useState(0);

  // New state variables for API integration
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [thinking, setThinking] = useState<{ text: string; hasRedactedContent: boolean } | null>(null);
  // This would come from your app's context or route params
  const [projectId, setProjectId] = useState<string>('default-project'); 
  const [isProjectLoading, setIsProjectLoading] = useState<boolean>(false);
  const [projectLoaded, setProjectLoaded] = useState<boolean>(false);

  // Response metadata for UI display
  const [responseMetadata, setResponseMetadata] = useState({
    responseType: '',
    confidence: 0,
    classificationSource: 'unknown'
  });

  // Expert response related state
  const [references, setReferences] = useState<Array<{ title: string, url: string }>>([]);
  const [showReferences, setShowReferences] = useState(false);
  const [relatedConcepts, setRelatedConcepts] = useState<string[]>([]);
  const [showRelatedConcepts, setShowRelatedConcepts] = useState(false);

  // Clarification response related state
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [showClarificationQuestions, setShowClarificationQuestions] = useState(false);

  // Out-of-context response related state
  const [suggestion, setSuggestion] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Architecture response visual feedback
  const [architectureUpdated, setArchitectureUpdated] = useState(false);

  // Add refs to track latest state values
  const sessionIdRef = useRef(sessionId);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  // Keep refs in sync with state
  useEffect(() => {
    sessionIdRef.current = sessionId;
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [sessionId, nodes, edges]);

  // Function to load a project
  const load = async (projectIdToLoad: string) => {
    if (!projectIdToLoad) {
      console.error("No project ID provided for loading");
      return;
    }

    setIsProjectLoading(true);
    setError(null);

    try {
      console.log(`Loading project: ${projectIdToLoad}`);
      
      // Make API call to load_project endpoint
      const projectData = await projectService.loadProject(projectIdToLoad);

      console.log("Project Data : ", projectData);

      // Update session ID
      setSessionId(projectData.session_id);
      
      // Update project ID if needed
      setProjectId(projectData.project_id);
      
      // Load diagram state
      if (projectData.diagram_state) {
        setNodes(projectData.diagram_state.nodes || []);
        setEdges(projectData.diagram_state.edges || []);
        setDiagramUpdateTrigger(prev => prev + 1); // Force diagram refresh
      }
      
      // Load conversation history
      if (projectData.conversation_history && Array.isArray(projectData.conversation_history)) {
        const formattedMessages = projectData.conversation_history.map((entry: any) => {
          // Convert conversation history entries to Message format
          if (entry.query && entry.response) {
            return [
              { role: 'user', content: entry.query, isPreExisting: true },
              { role: 'assistant', content: entry.response.message || entry.response , isPreExisting: true}
            ];
          }
          return [];
        }).flat();
        
        setMessages(formattedMessages);
      }
      
      setProjectLoaded(true);
      toast({
        title: "Project Loaded",
        description: `Project ${projectData.project_id} loaded successfully`,
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error loading project:', error);
      setError(`Failed to load project: ${error.message}`);
      toast({
        title: "Error",
        description: error.message || 'Failed to load project',
        variant: "destructive"
      });
    } finally {
      setIsProjectLoading(false);
    }
  };

  // Function to save a project
  const save = async () => {
    if (!sessionId) {
      toast({
        title: "Cannot Save",
        description: "No active session to save",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log(`Saving project with session ID: ${sessionId}`);
      
      // Create current diagram state object to include in save request
      const currentDiagramState = {
        nodes: nodes,
        edges: edges
      };

      console.log(`Current Diagram State Nodes: ${JSON.stringify(currentDiagramState.nodes, null, 2)}`);
      console.log(`Current Diagram State Edges: ${JSON.stringify(currentDiagramState.edges, null, 2)}`);
      
      // Make API call to save_project endpoint with current diagram state
      const response = await projectService.saveProject(sessionId, currentDiagramState);

      console.log(`Saved Response : ${response}`)
      
      if (response) {
        console.log(`saved project bool response: ${response}`);
        toast({
          title: "Project Saved",
          description: `Project ${projectId} saved successfully`,
          variant: "default"
        });
      } 
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to save project',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  
  
  useEffect(() => {
    toast({
      title: "AI Assisted Project",
      description: "Design your security infrastructure using natural language."
    });

    // Determine the project ID from different sources
    let projectIdToUse = '';

    // 1. Try from URL params
    if (params.projectId) {
      projectIdToUse = params.projectId;
      console.log('Project ID from URL params:', projectIdToUse);
    }
    // 2. Try from navigation state
    else if (location.state && location.state.projectId) {
      projectIdToUse = location.state.projectId;
      console.log('Project ID from navigation state:', projectIdToUse);
    }
    // 3. Use default if needed or from component state
    else if (projectId) {
      projectIdToUse = projectId;
      console.log('Using existing project ID:', projectIdToUse);
    }

    // Update project ID state
    if (projectIdToUse) {
      setProjectId(projectIdToUse);
      
      // Load project data if we have a project ID and it's not already loaded
      if (!projectLoaded) {
        load(projectIdToUse);
      }
    }

    // Cleanup on component unmount
    return () => {
      console.log("AiAssisted component unmounting, cleaning up...");
      // Consider saving project on unmount to prevent losing work
      if (sessionIdRef.current) {
        const currentDiagramState = {
          nodes: nodesRef.current,
          edges: edgesRef.current
        };
        projectService.saveProject(sessionIdRef.current, currentDiagramState).catch(err => {
          console.error("Error saving project on unmount:", err);
        });
      }
    };
  }, [toast, location.state, params, projectId, projectLoaded]);

  // Handle user selecting a clarification question
  const handleQuestionSelect = (question: string) => {
    console.log("Selected question:", question);
    setShowClarificationQuestions(false);
    handleSendMessage(question);
  };

  // Handle user choosing to use a suggested query
  const handleUseSuggestion = () => {
    console.log("Using suggestion:", suggestion);
    setShowSuggestion(false);
    handleSendMessage(suggestion);
  };

  const handleSendMessage = async (message: string) => {
    if (!message) {
      // If empty message, just clear the messages
      setMessages([]);
      return;
    }
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    // Reset UI states for new query
    setShowReferences(false);
    setShowRelatedConcepts(false);
    setShowClarificationQuestions(false);
    setShowSuggestion(false);
    setError(null);

    // Set loading state
    setIsLoading(true);
    setError(null);
    
    try {

      // Prepare request to send to the API
      const request: DesignRequest = {
        project_id: projectId,
        query: message,
        diagram_state: {
          nodes,
          edges
        },
        session_id: sessionId || undefined
      };
      
      // Send request to API
      const response = await sendDesignRequest(request, true); // Always request thinking
      console.log("Full response:", response);


      
      // Update session ID if returned
      if (response.response.session_id) {
        setSessionId(response.response.session_id);
      }

      // Add AI response to chat
      setMessages(prev => [...prev, {    
        role: 'assistant', 
        content: response.response.message 
      }]);
      
     // Handle thinking display  
     if (response.response.thinking) {
        console.log("Processing thinking content");
        setThinking({
          text: response.response.thinking,
          hasRedactedContent: response.response.has_redacted_thinking || false
        });
      } else {
        setThinking(null);
      }

      console.log("Response : ",response.response)
      
      // Process different response types
      handleResponseByType(response.response);
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to get response from AI assistant. Please try again.');
      
      // Add error message to chat
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error processing your request. Please try again.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseByType = (response: any) => {
    console.log("Processing response in handleResponseByType:", response);
    
    try {
      // Update response metadata for UI display
      setResponseMetadata({
        responseType: response.response_type || '',
        confidence: response.confidence || 0,
        classificationSource: response.classification_source || 'unknown'
      });

      // Handle different response types
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
    } catch (error: any) {
      console.error("Error handling response:", error);
      setError(`Error processing response: ${error.message}`);
    }
  };

  // Handle architecture responses
  const handleArchitectureResponse = (response: any) => {
    console.log("Handling Architecture Response");

    // Access top-level properties since they're now properly included
    const diagramUpdates = response.diagram_updates;
    const nodesToAdd = response.nodes_to_add || [];
    const edgesToAdd = response.edges_to_add || [];
    const elementsToRemove = response.elements_to_remove || [];
    
    // Log key fields for debugging
    console.log("Diagram updates:", diagramUpdates);
    console.log("Nodes to add:", nodesToAdd);
    console.log("Edges to add:", edgesToAdd);
    console.log("Elements to remove:", elementsToRemove);
    
    // Visual feedback that architecture is being updated
    setArchitectureUpdated(true);
    setTimeout(() => setArchitectureUpdated(false), 2000);

    // Create a new copy of current nodes and edges
    let updatedNodes = [...nodes];
    let updatedEdges = [...edges];
    
    // Handle elements to remove first
    if (elementsToRemove && elementsToRemove.length > 0) {
      console.log("Removing elements:", elementsToRemove);
      const elementsToRemoveSet = new Set(elementsToRemove);
      
      // Remove nodes
      updatedNodes = updatedNodes.filter(node => !elementsToRemoveSet.has(node.id));
      
      // Remove edges connected to removed nodes or directly targeted
      updatedEdges = updatedEdges.filter(edge => 
        !elementsToRemoveSet.has(edge.id) && 
        !elementsToRemoveSet.has(edge.source) && 
        !elementsToRemoveSet.has(edge.target)
      );
      
      console.log(`After removal: Nodes=${updatedNodes.length}, Edges=${updatedEdges.length}`);
    }
    
    // Add new nodes if provided
    if (nodesToAdd && nodesToAdd.length > 0) {
      console.log("Adding nodes:", nodesToAdd);
      updatedNodes = [...updatedNodes, ...nodesToAdd];
    }
    
    // Add new edges if provided
    if (edgesToAdd && edgesToAdd.length > 0) {
      console.log("Adding edges:", edgesToAdd);
      updatedEdges = [...updatedEdges, ...edgesToAdd];
    }
    
    // Apply diagram updates to existing nodes
    if (diagramUpdates && Object.keys(diagramUpdates).length > 0) {
      console.log("Applying diagram updates:", diagramUpdates);
      
      updatedNodes = updatedNodes.map(node => {
        const updates = diagramUpdates[node.id];
        if (updates) {
          console.log(`Updating node ${node.id}:`, updates);
          return { ...node, ...updates };
        }
        return node;
      });
    }
    
    // Update state with the new nodes and edges
    console.log("Setting new nodes:", updatedNodes);
    console.log("Setting new edges:", updatedEdges);
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    
    // Trigger a redraw of the diagram
    setDiagramUpdateTrigger(prev => prev + 1);
  };

  // Handle expert responses
  const handleExpertResponse = (fullResponse: any) => {
    console.log("Handling Expert Response");
    
    // Access from top level of response
    const references = fullResponse.references || [];
    const relatedConcepts = fullResponse.related_concepts || [];
    
    // Handle references if available
    if (references.length > 0) {
      console.log("References:", references);
      setReferences(references);
      setShowReferences(true);
    } else {
      setReferences([]);
      setShowReferences(false);
    }
    
    // Handle related concepts if available
    if (relatedConcepts.length > 0) {
      console.log("Related concepts:", relatedConcepts);
      setRelatedConcepts(relatedConcepts);
      setShowRelatedConcepts(true);
    } else {
      setRelatedConcepts([]);
      setShowRelatedConcepts(false);
    }
  };

   // Handle clarification responses
   const handleClarificationResponse = (fullResponse: any) => {
    console.log("Handling Clarification Response");
    
    // Access questions from top level
    const questions = fullResponse.questions || [];
    
    // Display questions that need clarification
    if (questions.length > 0) {
      console.log("Clarification questions:", questions);
      setClarificationQuestions(questions);
      setShowClarificationQuestions(true);
    } else {
      setClarificationQuestions([]);
      setShowClarificationQuestions(false);
    }
  };

  // Handle out-of-context responses
  const handleOutOfContextResponse = (fullResponse: any) => {
    console.log("Handling Out-of-Context Response");
    
    // Access suggestion from top level
    const suggestionText = fullResponse.suggestion || '';
    
    // Display suggestion if available
    if (suggestionText) {
      console.log("Suggestion:", suggestionText);
      setSuggestion(suggestionText);
      setShowSuggestion(true);
    } else {
      setSuggestion('');
      setShowSuggestion(false);
    }
  };

  const handleGenerateReport = () => {
    // Store current diagram state in localStorage or context
    localStorage.setItem('diagramNodes', JSON.stringify(nodes));
    localStorage.setItem('diagramEdges', JSON.stringify(edges));
    
    // Navigate to report page
    navigate('/generate-report');
  };

  // Handle diagram updates from the flow diagram component
  const handleNodesChange = (updatedNodes: Node<CustomNodeData>[]) => {
    setNodes(updatedNodes);
  };
  
  const handleEdgesChange = (updatedEdges: Edge[]) => {
    setEdges(updatedEdges);
  };

  // Add this new function to handle diagram state reversion
  const handleRevertToDiagramState = (messageContent: string, diagramState: any) => {
    if (diagramState && diagramState.nodes && diagramState.edges) {
      // First, add a system message indicating we're reverting
      const revertMessage = `Reverting diagram to state before : "${messageContent}" modification`;
      
      // Add to messages (first user message, then AI response)
      setMessages(prev => [
        ...prev,
        { role: 'user', content: `Revert diagram to state before : "${messageContent}" modification` },
        { role: 'assistant', content: revertMessage }
      ]);
      
      // Revert to the stored diagram state
      setNodes(diagramState.nodes);
      setEdges(diagramState.edges);
      setDiagramUpdateTrigger(prev => prev + 1); // Force diagram refresh
      
      toast({
        title: "Diagram Reverted",
        description: "Successfully reverted to previous diagram state",
        variant: "default"
      });
    } else {
      toast({
        title: "Revert Failed",
        description: "Could not revert diagram - state information missing",
        variant: "destructive"
      });
    }
  };



  return (
    <Layout>
      <div className="fixed top-16 left-0 right-0 bottom-0 overflow-hidden flex flex-col mt-2">
        <div className="flex-1 flex gap-4 h-full overflow-hidden">
          <div className="w-full lg:w-1/3 overflow-hidden shadow-md rounded-r-xl">
            <AIChat 
              messages={messages} 
              onSendMessage={handleSendMessage} 
              onGenerateReport={handleGenerateReport}
              onSaveProject={save}
              isLoading={isLoading}
              thinking={thinking}
              error={error}
              projectId={projectId}
              isLoadedProject={projectLoaded}
              diagramState={{ nodes, edges }} // Pass the current diagram state
              onRevertToDiagramState={handleRevertToDiagramState} // Add new handler
            />
          </div>

          {/* <div className="w-2/3 relative">
            {architectureUpdated && (
              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10 bg-green-100 text-green-800 px-4 py-2 rounded-md shadow-md transition-opacity duration-300">
                Updating architecture...
              </div>
            )}
          </div> */}
        
          <div className="w-2/3">
            <AIFlowDiagram 
              key={`diagram-${diagramUpdateTrigger}`} // Force a remount when nodes/edges change
              nodes={nodes} 
              edges={edges} 
              setNodes={handleNodesChange}
              setEdges={handleEdgesChange}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AiAssisted;