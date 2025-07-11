import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { sendDesignGenerateRequest } from '@/services/designService_v2';
import { DesignGenerateRequestV2, DesignServiceResponseV2, IntentV2, DSLResponse } from '@/interfaces/aiassistedinterfaces_v2';
import AIFlowDiagram from '@/components/AI/AIFlowDiagram';
import { Node, Edge, ReactFlowInstance } from '@xyflow/react';
import AIChat, { Message } from '@/components/AI/AIChat';
import FloatingChatInterface from '@/components/AI/FloatingChatInterface';
import { useAuth } from '@/components/Auth/AuthContext';
import tokenService from '@/services/tokenService';
import projectService from '@/services/projectService';
import { validateDiagramState } from '@/utils/diagramValidation';
import { BASE_API_URL } from '@/services/apiService';
import { DiagramStyleProvider } from '@/components/AI/contexts/DiagramStyleContext';
import SketchFilters from '@/components/AI/styles/SketchFilters';
import { resolveIcon } from '@/components/AI/utils/enhancedIconifyRegistry';
import { edgeStyles, determineEdgeType } from '@/components/AI/utils/edgeStyles';
import { 
  transformToLeftRightLayout, 
  prepareNodesWithLeftRightLayout, 
  needsLayoutTransformation 
} from '@/utils/layoutTransformer';
import { layoutWithEnhancedEngine, LayoutResult } from '@/components/AI/utils/enhancedLayoutEngine';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

// CRITICAL FIX: Enhanced edge processing function for proper edge loading and styling
const processEdges = (edges: Edge[] = [], nodes: Node[] = []): Edge[] => {
  if (!Array.isArray(edges) || edges.length === 0) {
    console.log('No edges to process');
    return [];
  }

  console.log(`🔗 Processing ${edges.length} edges for proper loading and styling`);

  // Create a map of existing edge IDs to prevent duplication
  const edgeIdMap = new Map();

  const processedEdges = edges.map(edge => {
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

    return {
      ...edge,
      id: edgeId,
      type: edgeType,
      style: {
        ...typeStyle,
        ...edge.style // Allow edge-specific overrides
      },
      animated: edge.animated || typeStyle.animated || false,
      markerEnd: edge.markerEnd || typeStyle.markerEnd || {
        type: 'arrowclosed',
        width: 20,
        height: 20,
        color: typeStyle.stroke || '#6b7280',
      },
      labelStyle: {
        fill: '#374151',
        fontWeight: 600,
        fontSize: 12,
        ...edge.labelStyle
      }
    };
  }).filter(edge => edge !== null) as Edge[];

  console.log(`✅ Successfully processed ${processedEdges.length} edges with proper styling`);
  return processedEdges;
};

// CRITICAL FIX: Enhanced node preparation with FORCED left-to-right layout transformation
const prepareNodesForDiagram = (inputNodes: Node[], inputEdges: Edge[] = []): Node[] => {
  if (!inputNodes || !Array.isArray(inputNodes) || inputNodes.length === 0) {
    return [];
  }

  console.log('🚀 V2: Preparing nodes with FORCED left-to-right layout, input nodes:', inputNodes.length);
  
  // Step 1: Clean and enhance nodes with icons
  const enhancedNodes = inputNodes.map((node, index) => {
    if (!node) return null;

    // Clean and validate label
    const originalLabel = node.data?.label || node.id || 'Node';
    let cleanLabel = String(originalLabel);
    
    // CRITICAL: Detect and fix label corruption
    if (typeof originalLabel === 'string' && (
      originalLabel.length > 50 || 
      originalLabel.includes('http') || 
      originalLabel.includes('data:') || 
      originalLabel.includes('.svg') || 
      originalLabel.includes('base64') ||
      originalLabel.includes('storage.') ||
      originalLabel.includes('supabase.') ||
      originalLabel.split('/').length > 3
    )) {
      cleanLabel = node.id?.replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ') || `Node ${index + 1}`;
      
      console.warn(`V2: Fixed corrupted label for node ${node.id}:`, {
        original: originalLabel.substring(0, 50) + '...',
        cleaned: cleanLabel
      });
    }

    // CRITICAL FIX: Enhanced icon resolution for diverse node icons
    const nodeType = String(node.data?.nodeType || node.type || 'default');
    const provider = node.data?.provider ? String(node.data.provider) : undefined;
    
    // Always resolve icon using enhanced registry for consistent diverse icons
    const resolvedIconId = resolveIcon(nodeType, provider);
    
    return {
      ...node,
      type: 'default',
      draggable: true,
      position: node.position || { x: 0, y: 0 }, // Temporary position, will be transformed
      data: {
        ...node.data,
        label: cleanLabel,
        nodeType: nodeType,
        iconifyId: resolvedIconId,
        validated: true,
        source: 'v2_enhanced'
      }
    } as Node;
  }).filter((node): node is Node => node !== null);

  // Step 2: Force left-to-right layout transformation
  console.log('🎯 V2: Checking if layout transformation is needed...');
  
  // Always apply left-to-right transformation for consistent architecture visualization
  const { nodes: transformedNodes } = transformToLeftRightLayout(enhancedNodes, inputEdges);
  
  console.log(`✅ V2: Layout transformation complete: ${transformedNodes.length} nodes positioned in left-to-right architecture`);
  
  return transformedNodes;
};

const ModelWithAI_V2: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const params = useParams<{ projectId: string }>();
  const { theme } = useTheme();

  const [sessionId, setSessionId] = useState<string | undefined>();
  const [nodes, setNodes] = useState<Node<any>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | undefined>();
  
  // Enhanced layout state management
  const [isLayouting, setIsLayouting] = useState(false);
  const [lastLayoutResult, setLastLayoutResult] = useState<LayoutResult | undefined>();

  // Track in-flight request so we can cancel it when component unmounts
  const requestCtrlRef = useRef<AbortController | null>(null);
  
  // Debounce mechanism to prevent rapid fire messages
  const lastMessageTimeRef = useRef<number>(0);

  // Keep a ref to the underlying React Flow instance so we can trigger actions like fitView
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  // REMOVED: Automatic fitView that overrides backend positions
  // Only trigger fitView when explicitly requested by user, not on every node change

  // ----------------------------
  //  LOAD PROJECT ON MOUNT
  // ----------------------------

  useEffect(() => {
    // Determine the project id from URL params or navigation state
    const pid = params.projectId || (location.state as any)?.projectId;
    if (!pid) return;

    setProjectId(pid);

    (async () => {
      try {
        // Set loading state during project load
        setIsLoading(true);
        
        const data = await projectService.loadProject(pid);
        
        // Always set session ID first
        if (data.session_id) {
          setSessionId(data.session_id);
        }

        // Load diagram state with FORCED left-to-right layout
        if (data.diagram_state) {
          console.log('🔄 Loading project diagram state with FORCED left-to-right layout - raw:', data.diagram_state);
          const validatedState = validateDiagramState(data.diagram_state);
          console.log('Loading project diagram state - validated:', validatedState);
          
          // CRITICAL FIX: Apply enhanced node preparation with FORCED left-to-right layout
          const enhancedNodes = prepareNodesForDiagram(validatedState.nodes, validatedState.edges);
          console.log(`✅ V2: Enhanced ${enhancedNodes.length} loaded nodes with left-to-right architecture layout`);
          
          // CRITICAL FIX: Process edges for proper loading and styling
          const processedEdges = processEdges(validatedState.edges, enhancedNodes);
          console.log(`✅ V2: Processed ${processedEdges.length} edges for proper data flow visualization`);
          
          setNodes(enhancedNodes);
          setEdges(processedEdges);
        }

        // Load chat history with better error handling and validation
        if (Array.isArray(data.conversation_history)) {
          console.log('Raw conversation history from backend:', data.conversation_history);
          
          if (data.conversation_history.length > 0) {
            // Filter and validate messages
            const validMessages = data.conversation_history.filter((m: any) => {
              const isValid = m && 
                (m.role === 'user' || m.role === 'assistant') && 
                m.content && 
                typeof m.content === 'string' && 
                m.content.trim().length > 0;
              
              if (!isValid) {
                console.warn('Invalid message filtered out:', m);
              }
              return isValid;
            });
            
            console.log(`Filtered ${validMessages.length} valid messages from ${data.conversation_history.length} total`);
            
            if (validMessages.length > 0) {
              const chats = validMessages.map((m: any, index: number) => ({
                id: Date.now() + index,
                role: m.role,
                content: m.content,
                timestamp: m.timestamp || new Date().toISOString(),
                isPreExisting: true
              }));
              
              console.log('Processed chat history:', chats);
              setMessages(chats);
            } else {
              console.log('No valid messages found after filtering');
              setMessages([]);
            }
          } else {
            console.log('Conversation history is empty array');
            setMessages([]);
          }
        } else {
          console.log('No conversation history found or not an array:', typeof data.conversation_history);
          setMessages([]);
        }
        
        // Clear any previous errors
        setError(null);
        
      } catch (e: any) {
        console.error('Project load error:', e);
        console.error('Error details:', {
          message: e.message,
          stack: e.stack,
          projectId: pid,
          timestamp: new Date().toISOString()
        });
        
        setError(e.message || 'Cannot load project');
        toast({ 
          title: 'Load failed', 
          description: e.message || 'Cannot load project', 
          variant: 'destructive' 
        });
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------
  //  SAVE HANDLER
  // --------------------------------

  const handleSave = async () => {
    if (!projectId || !sessionId) {
      toast({ title: 'Cannot save', description: 'Missing project or session', variant: 'destructive' });
      return;
    }
    const nodesForBackend = nodes.filter(n => n.type !== 'layerGroup');
    try {
      const ok = await projectService.saveProject(sessionId, { nodes: nodesForBackend, edges }, projectId);
      if (ok) {
        toast({ title: 'Project saved', description: 'Work saved successfully' });
      }
    } catch (err:any) {
      toast({ title: 'Save failed', description: err.message || 'Could not save', variant: 'destructive' });
    }
  };

  const setDiagramState = (state: { nodes: Node<any>[]; edges: Edge[] }) => {
    // CRITICAL FIX: Validate and clean diagram state before setting
    console.log('🔄 V2: Setting diagram state with FORCED left-to-right layout - raw:', state);
    const validatedState = validateDiagramState(state);
    console.log('V2: Setting diagram state - validated:', validatedState);
    
    // CRITICAL FIX: Apply enhanced node preparation with FORCED left-to-right layout
    const enhancedNodes = prepareNodesForDiagram(validatedState.nodes, validatedState.edges);
    console.log(`✅ V2: Enhanced ${enhancedNodes.length} nodes with left-to-right layout in setDiagramState`);
    
    // CRITICAL FIX: Process edges for proper loading and styling
    const processedEdges = processEdges(validatedState.edges, enhancedNodes);
    console.log(`✅ V2: Processed ${processedEdges.length} edges for data flow visualization`);
    
    setNodes(enhancedNodes);
    setEdges(processedEdges);

    // REMOVED: Automatic fitView - left-to-right layout is already optimally positioned
  };

  // Enhanced layout handler with multi-engine support
  const handleEnhancedLayout = async (options: {
    direction: 'LR' | 'TB' | 'BT' | 'RL';
    engine: 'auto' | 'elk' | 'dagre' | 'basic';
    enablePerformanceMonitoring: boolean;
  }) => {
    if (!nodes.length || isLayouting) return;

    console.log('[Enhanced Layout] Starting layout with options:', options);
    setIsLayouting(true);

    try {
      const result = await layoutWithEnhancedEngine(nodes, edges, {
        direction: options.direction,
        engine: options.engine,
        enablePerformanceMonitoring: options.enablePerformanceMonitoring
      });

      if (result.success) {
        setNodes(result.nodes);
        setEdges(result.edges);
        setLastLayoutResult(result);
        
        toast({
          title: 'Layout Applied',
          description: `Layout completed using ${result.engineUsed} engine in ${result.executionTime.toFixed(2)}ms`,
        });
        
        console.log('[Enhanced Layout] Layout applied successfully:', result);
      } else {
        throw new Error(result.errorMessage || 'Layout failed');
      }
    } catch (error) {
      console.error('[Enhanced Layout] Layout failed:', error);
      toast({
        title: 'Layout Error',
        description: 'Failed to apply layout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLayouting(false);
    }
  };



  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    // Prevent multiple simultaneous requests
    if (isLoading) {
      console.log('Request already in progress, ignoring new request');
      return;
    }

    // Debounce rapid messages (prevent sending within 500ms of last message)
    const now = Date.now();
    if (now - lastMessageTimeRef.current < 500) {
      console.log('Message sent too quickly, ignoring to prevent duplicates');
      return;
    }
    lastMessageTimeRef.current = now;

    // Cancel any previous in-flight request (user typed quickly or navigated away)
    requestCtrlRef.current?.abort();
    const controller = new AbortController();
    requestCtrlRef.current = controller;

    const timestamp = new Date().toISOString();
    const userMessageId = Date.now();
    const placeholderId = Date.now() + 1; // Ensure unique ID
    
    // Add user message and placeholder assistant message in a single update
    console.log(`Adding user message with ID: ${userMessageId} and placeholder ${placeholderId}`);
    setMessages(prev => [
      ...prev,
      {
        id: userMessageId,
        role: 'user',
        content: userText,
        timestamp,
      },
      {
        id: placeholderId,
        role: 'assistant',
        content: '…',
        timestamp,
      },
    ]);

    const req: DesignGenerateRequestV2 = {
      project_id: projectId || 'default-project',
      query: userText,
      session_id: sessionId,
    };

    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      // CRITICAL DEBUG: Log the request being sent
      console.log('[DesignServiceV2] Sending request:', req);
      
      const resp: DesignServiceResponseV2 = await sendDesignGenerateRequest(
        req,
        toast,
        undefined,
        controller.signal,
      );

      // CRITICAL DEBUG: Log raw backend response  
      console.log('[DesignServiceV2] response:', resp);
      console.log('Raw backend response - full object:', JSON.stringify(resp, null, 2));

      if (resp.response.session_id) setSessionId(resp.response.session_id);

      const r = resp.response;
      let assistantContent = r.message || '';

      const updatePlaceholder = (newContent: string) => {
        console.log(`Updating placeholder ${placeholderId} with content: ${newContent.substring(0, 100)}...`);
        setMessages(prev => prev.map(m => m.id === placeholderId ? { ...m, content: newContent } : m));
      };

      switch (r.intent) {
        case IntentV2.DSL_CREATE:
        case IntentV2.DSL_UPDATE: {
          const dslRes = r as DSLResponse;

          // Guard against backend responses that may omit the payload when an
          // error occurs or no diagram state was produced.  This prevents
          // "Cannot read properties of undefined (reading 'diagram_state')"
          if (dslRes.payload && dslRes.payload.diagram_state) {
            // replace placeholder with final assistant text immediately
            const finalMsg = r.message || `Diagram updated (version ${dslRes.payload.version_id}).`;
            updatePlaceholder(finalMsg);

            // Defer heavy node/edge processing so UI can paint the message first
            setTimeout(() => {
              let state = dslRes.payload!.diagram_state;

              console.log('🔄 V2: Received backend diagram state - applying FORCED left-to-right layout - raw:', state);

              // CRITICAL FIX: Validate the incoming state after cleaning
              state = validateDiagramState(state);
              console.log('V2: Received backend diagram state - validated:', state);

              // If the back-end returned pinned nodes, mark them in the diagram
              if (dslRes.payload.pinned_nodes && dslRes.payload.pinned_nodes.length > 0) {
                state.nodes = state.nodes.map((n: any) =>
                  dslRes.payload!.pinned_nodes!.includes(n.id)
                    ? { ...n, data: { ...n.data, pinned: true } }
                    : n
                );
              }

              // CRITICAL FIX: Apply enhanced node preparation with FORCED left-to-right layout
              const enhancedNodes = prepareNodesForDiagram(state.nodes, state.edges);
              
              console.log(`✅ V2: Enhanced ${enhancedNodes.length} nodes with beautiful left-to-right architecture layout`);

              // CRITICAL FIX: Process edges for proper loading and styling  
              const processedEdges = processEdges(state.edges, enhancedNodes);
              console.log(`✅ V2: Processed ${processedEdges.length} edges for clear data flow`);

              // Set enhanced nodes and processed edges
              setNodes(enhancedNodes);
              setEdges(processedEdges);
              
              // REMOVED: Automatic fitView - left-to-right layout is already optimally positioned

              // heavy work scheduled, return
              assistantContent = undefined;
            }, 0);
          } else {
            // Fallback – still acknowledge the action so the user gets feedback
            console.warn('DSL response is missing payload', dslRes);
            assistantContent = dslRes.message || 'Received update but no diagram data was returned.';
          }
          break;
        }
        case IntentV2.EXPERT_QA:
          // message already set
          break;
        case IntentV2.CLARIFY:
          assistantContent = (r as any).questions?.join('\n') || assistantContent;
          break;
        case IntentV2.OUT_OF_SCOPE:
          assistantContent = (r as any).suggestion || assistantContent;
          break;
        case IntentV2.VIEW_TOGGLE: {
          const vt = r as any;
          if (vt.diagram_state) setDiagramState(vt.diagram_state);
          assistantContent = `Switched view to ${vt.target_view}.`;
          break;
        }
      }

      if (assistantContent !== undefined) {
        updatePlaceholder(assistantContent);
      }
      setError(null);
    } catch (e: any) {
      console.error('❌ Architecture generation failed:', e);
      console.error('Message send error details:', {
        message: e.message,
        stack: e.stack,
        placeholderId,
        userText: userText.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });
      
      // ROBUST ERROR HANDLING: Provide specific feedback for different error types
      let errorMessage = 'Sorry, something went wrong. Please try again.';
      let shouldRetry = false;
      
      if (e.response?.status === 422) {
        const errorDetail = e.response.data?.detail;
        
        if (errorDetail?.error_code === 'DIAGRAM_VALIDATION_FAILED') {
          console.warn('⚠️ Diagram validation failed:', errorDetail.errors);
          errorMessage = 'The generated diagram had validation issues. Let me try a different approach...';
          shouldRetry = true;
          
          // Automatically retry with a refined prompt
          if (userText && !userText.includes('[RETRY]')) {
            console.log('🔄 Auto-retrying with refined prompt...');
            setTimeout(() => {
              const refinedPrompt = `[RETRY] Create a ${userText.toLowerCase()} with simpler, cleaner component names (avoid special characters)`;
              handleSendMessage(refinedPrompt);
            }, 1000);
            
            // Update placeholder message directly
            setMessages(prev => prev.map(m => 
              m.id === placeholderId 
                ? { ...m, content: 'I encountered some validation issues. Let me try a different approach with cleaner component names...' }
                : m
            ));
            return; // Don't show error, show retry message instead
          }
        } else if (errorDetail?.error_code === 'DSL_PARSING_FAILED') {
          errorMessage = 'The diagram generation encountered a technical issue. Please try rephrasing your request.';
        }
      } else if (e.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (e.response?.status >= 500) {
        errorMessage = 'Our servers are experiencing issues. Please try again in a few moments.';
      } else if (!navigator.onLine) {
        errorMessage = 'Network connection lost. Please check your connection and try again.';
      }
      
      setError(e.message || 'Error');
      
      // Replace the placeholder with appropriate error message
      setMessages(prev => prev.map(m => 
        m.id === placeholderId 
          ? { ...m, content: errorMessage }
          : m
      ));
    } finally {
      setIsLoading(false);
      // Clear controller after completion so unmount cleanup doesn't double-abort
      requestCtrlRef.current = null;
    }
  };

  // ---------------- WebSocket notifications --------------------
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Grab the current JWT so the gateway/back-end can authenticate the WS upgrade
    const token = tokenService.getToken();

    // Build ws:// or wss:// url based on BASE_API_URL
    const wsProtocol = BASE_API_URL.startsWith('https') ? 'wss' : 'ws';
    const apiUrl = new URL(BASE_API_URL);
    const wsBase = `${wsProtocol}://${apiUrl.host}`;
    const url = `${wsBase}/v1/routes/ws/notifications/${user.id}`;
    
    console.log('WebSocket URL:', url);

    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      try {
        // Append JWT as query parameter instead of sub-protocol to avoid handshake failure
        const wsUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          // Heartbeat ping every 20 s to keep the connection alive
          heartbeat && clearInterval(heartbeat);
          heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send('ping');
          }, 20000);
        };

        ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            console.log('WebSocket message received:', data);
            
            switch (data?.type) {
              case 'DIAGRAM_UPDATED':
                toast({
                  title: 'Diagram updated',
                  description: `A new version (${data.payload?.version ?? '?'}) was saved.`,
                });
                break;
              
              case 'CONVERSATION_UPDATED':
                // Handle conversation updates if needed
                if (data.payload?.session_id === sessionId) {
                  console.log('Conversation updated for current session');
                }
                break;
              
              case 'PROJECT_LOADED':
                // Handle project load completion
                if (data.payload?.project_id === projectId) {
                  console.log('Project load completed');
                }
                break;
              
              case 'ERROR':
                toast({
                  title: 'Error',
                  description: data.payload?.message || 'An error occurred',
                  variant: 'destructive'
                });
                break;
              
              default:
                console.log('Unknown WebSocket message type:', data?.type);
            }
          } catch (e) {
            console.warn('WS msg parse error', e);
          }
        };

        ws.onerror = (err) => {
          console.warn('Notification WebSocket error', err);
        };

        ws.onclose = () => {
          wsRef.current = null;
          heartbeat && clearInterval(heartbeat);
          // Auto-reconnect after 3 s unless component unmounted
          retryTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        console.warn('Cannot open notification WS', err);
        retryTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      // Abort any outstanding fetch when component unmounts
      requestCtrlRef.current?.abort();
      wsRef.current?.close();
      wsRef.current = null;
      heartbeat && clearInterval(heartbeat);
      retryTimeout && clearTimeout(retryTimeout);
    };
  }, [user?.id]);

  return (
    <Layout>
      <DiagramStyleProvider>
        <SketchFilters />
        {/* Full-viewport workspace (below the fixed header) */}
        <div className="fixed top-16 left-0 right-0 bottom-0 overflow-hidden flex flex-col mt-2">
          {/* Full-width Diagram */}
          <div className={cn(
            "flex-1 relative",
            theme === 'dark' 
              ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" 
              : "bg-gray-50"
          )}>
            {/* Add dark mode pattern overlay */}
            {theme === 'dark' && (
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20"></div>
                <div 
                  className="absolute inset-0" 
                  style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, rgba(124, 101, 246, 0.08) 0%, transparent 50%), 
                                     radial-gradient(circle at 75% 75%, rgba(124, 101, 246, 0.08) 0%, transparent 50%)`,
                    backgroundSize: '400px 400px',
                    animation: 'patternMove 20s ease-in-out infinite alternate'
                  }}
                ></div>
              </div>
            )}
            <AIFlowDiagram
              nodes={nodes}
              edges={edges}
              setNodes={setNodes}
              setEdges={setEdges}
              viewMode="AD"
              onSwitchView={(_mode) => { /* view switch handler TBD */ }}
              reactFlowInstanceRef={reactFlowInstanceRef}
              onSave={handleSave}
              onLayout={handleEnhancedLayout}
              isLayouting={isLayouting}
              lastLayoutResult={lastLayoutResult}
              projectId={projectId}
            />
          </div>
        </div>

        {/* Modern Floating Chat Interface */}
        <FloatingChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onSaveProject={handleSave}
          onGenerateReport={() => {}}
          isLoading={false}
          thinking={isLoading ? { text: 'Processing your request...', hasRedactedContent: false } : null}
          error={error}
          projectId={projectId}
          isLoadedProject={false}
          diagramState={{ nodes, edges }}
          onRevertToDiagramState={(_msg, state) => {
            if (state?.nodes && state?.edges) {
              setDiagramState({ nodes: state.nodes, edges: state.edges });
            }
          }}
        />
      </DiagramStyleProvider>
    </Layout>
  );
};

export default ModelWithAI_V2; 