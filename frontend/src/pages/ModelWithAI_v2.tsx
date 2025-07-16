import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';

// TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { sendDesignGenerateRequest } from '@/services/designService_v2';
import { DesignGenerateRequestV2, DesignServiceResponseV2, IntentV2, DSLResponse } from '@/interfaces/aiassistedinterfaces_v2';
import AIFlowDiagram, { AIFlowDiagramHandle } from '@/components/AI/AIFlowDiagram';
import { Node, Edge, ReactFlowInstance } from '@xyflow/react';
import AIChat, { Message } from '@/components/AI/AIChat';
import SpeechOverlay from '@/components/AI/SpeechOverlay';
import { AnimatePresence } from 'framer-motion';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { 
  Send, 
  Mic, 
  MicOff, 
  MessageSquare,
  Save, 
  Layout as LayoutIcon, 
  Download, 
  Maximize, 
  RefreshCw,
  Layers,
  Grid,
  Zap,
  ChevronUp,
  Move
} from 'lucide-react';
import DiagramActions from '@/components/AI/DiagramActions';

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

// Utility: ensure each node has hasSourceConnection/hasTargetConnection flags based on edges
const addConnectionFlags = (nodes: Node[], edges: Edge[]): Node[] => {
  if (!nodes || nodes.length === 0) return nodes;
  const sourceIds = new Set(edges.map(e => e.source));
  const targetIds = new Set(edges.map(e => e.target));
  return nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      hasSourceConnection: sourceIds.has(n.id),
      hasTargetConnection: targetIds.has(n.id),
    },
  }));
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
  const [inputValue, setInputValue] = useState('');
  
  // Voice mode state
  const [isVoiceMode, setIsVoiceMode] = useState(false); // retained for compatibility
  const [isSpeechOverlayOpen, setIsSpeechOverlayOpen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isListening, setIsListening] = useState(false); // maintains compatibility with legacy speech logic
  
  // Enhanced layout state management
  const [isLayouting, setIsLayouting] = useState(false);
  const [lastLayoutResult, setLastLayoutResult] = useState<LayoutResult | undefined>();

  // Track in-flight request so we can cancel it when component unmounts
  const requestCtrlRef = useRef<AbortController | null>(null);
  
  // Voice recognition refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Debounce mechanism to prevent rapid fire messages
  const lastMessageTimeRef = useRef<number>(0);

  // Keep a ref to the underlying React Flow instance so we can trigger actions like fitView
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  // Diagram ref for DiagramActions
  const diagramRef = useRef<HTMLDivElement>(null);

  // Ref to access AIFlowDiagram imperative API
  const aiDiagramRef = useRef<AIFlowDiagramHandle | null>(null);

  // Active state for bottom bar buttons
  const [isDataFlowActive, setIsDataFlowActive] = useState(false);
  const [isFlowchartActive, setIsFlowchartActive] = useState(false);

  // Collapse state for bottom toolbar
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

  // Persisted chat position (in pixels)
  const [chatPos, setChatPos] = useState({ x: 0, y: 0 });
  const chatInputRef = useRef<HTMLDivElement>(null);
  const [chatRect, setChatRect] = useState<DOMRect | null>(null);

  // Track position of the expanded chat panel so we can also "fit" it back
  const [chatPanelPos, setChatPanelPos] = useState({ x: 0, y: 0 });

  const resetChatPosition = () => {
    setChatPos({ x: 0, y: 0 });
    setChatRect(null);
    // Also reset the expanded chat panel position
    setChatPanelPos({ x: 0, y: 0 });
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');

        setInputValue(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: 'Voice Error',
          description: 'Failed to recognize speech. Please try again.',
          variant: 'destructive'
        });
      };
    }
  }, [toast]);

  // Toggle voice mode
  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
  };

  // Start/stop voice recognition
  const toggleListening = () => {
    // Open the enhanced speech overlay for voice input
    setIsSpeechOverlayOpen(true);
  };

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
          const processedEdges = processEdges(validatedState.edges, enhancedNodes);
          const nodesWithFlags = addConnectionFlags(enhancedNodes, processedEdges);
          console.log(`✅ V2: Enhanced ${enhancedNodes.length} loaded nodes with left-to-right architecture layout`);
          console.log(`✅ V2: Processed ${processedEdges.length} edges for proper data flow visualization`);

          setNodes(nodesWithFlags);
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
    try {
      // CRITICAL FIX: Validate and clean diagram state before setting
      console.log('🔄 V2: Setting diagram state with FORCED left-to-right layout - raw:', state);
      const validatedState = validateDiagramState(state);
      console.log('V2: Setting diagram state - validated:', validatedState);

      // Apply enhanced node preparation with FORCED left-to-right layout
      const enhancedNodes = prepareNodesForDiagram(validatedState.nodes, validatedState.edges);
      const processedEdges = processEdges(validatedState.edges, enhancedNodes);
      const nodesWithFlags = addConnectionFlags(enhancedNodes, processedEdges);

      console.log(`✅ V2: Enhanced ${enhancedNodes.length} nodes with left-to-right layout in setDiagramState`);
      console.log(`✅ V2: Processed ${processedEdges.length} edges for data flow visualization`);

      setNodes(nodesWithFlags);
      setEdges(processedEdges);
    } catch (err) {
      console.error('Diagram state processing failed', err);
      toast({
        title: 'Diagram Error',
        description: 'Failed to load—reverting to last valid state.',
        variant: 'destructive',
      });
      // On failure we keep previous nodes/edges untouched to avoid blank canvas
    }

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
        const enhancedNodes = prepareNodesForDiagram(result.nodes, result.edges);
        const processedEdges = processEdges(result.edges, enhancedNodes);
        const nodesWithFlags = addConnectionFlags(enhancedNodes, processedEdges);
        setNodes(nodesWithFlags);
        setEdges(processedEdges);
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

  // Send message (adapted for bottom input)
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    setIsChatVisible(true); // auto-open chat window on send
    await handleSendMessageInternal(inputValue);
    setInputValue('');
  };





  const handleSendMessageInternal = async (userText: string) => {
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
              const processedEdges = processEdges(state.edges, enhancedNodes);
              const nodesWithFlags = addConnectionFlags(enhancedNodes, processedEdges);
              
              console.log(`✅ V2: Enhanced ${enhancedNodes.length} nodes with beautiful left-to-right architecture layout`);
              console.log(`✅ V2: Processed ${processedEdges.length} edges for clear data flow`);

              // Set enhanced nodes and processed edges
              setNodes(nodesWithFlags);
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
              handleSendMessage();
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

  // Modern action handlers
  const handleZoomIn = () => {
    aiDiagramRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    aiDiagramRef.current?.zoomOut();
  };

  const handleFitView = () => {
    aiDiagramRef.current?.fitView();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({
      title: 'Export',
      description: 'Export functionality coming soon!',
    });
  };

  const handleRefresh = () => {
    // Refresh the diagram layout
    handleEnhancedLayout({ 
      direction: 'LR', 
      engine: 'auto', 
      enablePerformanceMonitoring: true 
    });
  };

  // DiagramActions handlers
  const handleGenerateReport = () => {
    // TODO: Implement report generation
    toast({
      title: 'Report Generation',
      description: 'Report generation functionality coming soon!',
    });
  };

  const handleComment = () => {
    // TODO: Implement comment functionality
    toast({
      title: 'Comments',
      description: 'Comment functionality coming soon!',
    });
  };

  const handleSwitchView = (mode: 'AD' | 'DFD') => {
    if (mode === 'AD') {
      // DiagramActions already triggered the necessary toggles; just clear local flags
      setIsDataFlowActive(false);
      setIsFlowchartActive(false);
    }
    // (future) handle DFD switch if needed
  };

  // Toggle handlers that delegate to AIFlowDiagram via ref
  const handleToggleDataFlow = () => {
    if (aiDiagramRef.current) {
      aiDiagramRef.current.toggleSequence();
      setIsDataFlowActive(prev => {
        const next = !prev;
        if (next) setIsFlowchartActive(false);
        return next;
      });
    }
  };

  const handleToggleFlowchart = () => {
    if (aiDiagramRef.current) {
      aiDiagramRef.current.toggleFlowchart();
      setIsFlowchartActive(prev => {
        const next = !prev;
        if (next) setIsDataFlowActive(false);
        return next;
      });
    }
  };

  const handleRunThreatAnalysis = () => {
    // TODO: Implement threat analysis
    toast({
      title: 'Threat Analysis',
      description: 'Threat analysis functionality coming soon!',
    });
  };

  return (
    <Layout noMargins>
      <DiagramStyleProvider>
        <SketchFilters />
        
        {/* Full-screen diagram pane with extreme zoomed out dotted background like Flowstep */}
        <div 
          id="diagram-container"
          className={cn(
          "h-full min-h-[calc(100vh-64px)] w-full overflow-hidden relative",
          // Use dotted background pattern with CSS
          theme === 'dark'
            ? "bg-gray-900 bg-[radial-gradient(circle,#374151_1px,transparent_1px)] [background-size:32px_32px]"
            : "bg-white bg-[radial-gradient(circle,#e5e7eb_1px,transparent_1px)] [background-size:32px_32px]"
        )}>
          {/* Add subtle gradient overlay */}
          <motion.div 
            className="absolute inset-0 z-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-50/5 to-blue-50/10 dark:from-transparent dark:via-purple-900/5 dark:to-blue-900/10"></div>
          </motion.div>
          
          <motion.div 
            className="w-full h-full" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.6, ease: 'easeOut' }}
            ref={diagramRef}
          >
            <AIFlowDiagram
                ref={aiDiagramRef}
                nodes={nodes}
                edges={edges}
                setNodes={setNodes}
                setEdges={setEdges}
                viewMode="AD"
                onSwitchView={handleSwitchView}
                reactFlowInstanceRef={reactFlowInstanceRef}
                onSave={handleSave}
                onLayout={handleEnhancedLayout}
                isLayouting={isLayouting}
                lastLayoutResult={lastLayoutResult}
                projectId={projectId}
              />
          </motion.div>
        </div>

        {/* Draggable floating chat input */}
        <motion.div 
          ref={chatInputRef}
          className="absolute bottom-20 left-4 right-4 z-50 max-w-4xl mx-auto px-4 cursor-move"
          initial={{ y: 100, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.4, ease: 'easeOut' }}
          drag
          dragMomentum={false}
          style={{ x: chatPos.x, y: chatPos.y }}
          onDragEnd={(e, dragInfo) => {
            setChatPos(prev => ({ x: prev.x + dragInfo.offset.x, y: prev.y + dragInfo.offset.y }));
            if (chatInputRef.current) {
              setChatRect(chatInputRef.current.getBoundingClientRect());
            }
          }}
        >
          {/* Chat input with glass morphism */}
          <div className={cn(
            "backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl",
            "border border-white/20 dark:border-gray-700/20",
            "shadow-2xl shadow-black/10 dark:shadow-black/30"
          )}>
            <div className="px-6 py-4">
              <div className="flex items-center space-x-3">
                {/* Drag handle */}
                <div
                  className="cursor-move rounded-lg p-2 backdrop-blur-sm text-gray-400 hover:text-gray-600 hover:bg-white/20"
                  title="Drag chat bar"
                >
                  <Move size={16} />
                </div>
                  <div className="flex-1 relative">
                  <Input 
                    placeholder="Describe your architecture or ask about your system..." 
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className={cn(
                      "pr-16 pl-4 py-3 rounded-xl border-2 transition-all duration-200",
                      "bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm",
                      "border-white/30 dark:border-gray-600/30",
                      "focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20",
                      "text-gray-900 dark:text-gray-100",
                      "placeholder-gray-500 dark:placeholder-gray-400"
                    )}
                    disabled={isLoading}
                  />
                  
                  {/* Voice capture button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleListening}
                    className={cn(
                      "absolute right-2 top-1/2 transform -translate-y-1/2 rounded-lg p-2",
                      "backdrop-blur-sm",
                      isSpeechOverlayOpen 
                        ? "text-red-500 bg-red-500/20" 
                        : "text-gray-400 hover:text-gray-600 hover:bg-white/20"
                    )}
                  >
                    {isSpeechOverlayOpen ? <MicOff size={16} /> : <Mic size={16} />}
                  </Button>
                </div>

                {/* Toggle Chat Window */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatVisible(prev => !prev)}
                  className={cn(
                    "rounded-lg p-2 backdrop-blur-sm transition-all duration-200",
                    isChatVisible
                      ? "text-purple-600 bg-purple-600/20"
                      : "text-gray-400 hover:text-gray-600 hover:bg-white/20"
                  )}
                >
                  <MessageSquare size={16} />
                </Button>

                {/* Send button */}
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isLoading || !inputValue.trim()}
                  className={cn(
                    "rounded-xl px-6 py-3 transition-all duration-200",
                    "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800",
                    "shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105",
                    "backdrop-blur-sm",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  )}
                >
                  {isLoading ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                </Button>
                {/* Fit back button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetChatPosition}
                  disabled={chatPos.x === 0 && chatPos.y === 0 && chatPanelPos.x === 0 && chatPanelPos.y === 0}
                  className={cn(
                    "rounded-lg p-2 backdrop-blur-sm transition-all duration-200",
                    chatPos.x === 0 && chatPos.y === 0
                      ? "opacity-40 cursor-not-allowed"
                      : "text-gray-400 hover:text-gray-600 hover:bg-white/20"
                  )}
                >
                  <Maximize size={16} />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Draggable sliding chat panel */}
        <AnimatePresence>
          {isChatVisible && (
            <motion.div
              key="chat-panel"
              initial={{ opacity: 0, y: 50, height: 0 }}
              animate={{ opacity: 1, y: 0, height: '60vh' }}
              exit={{ opacity: 0, y: 50, height: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className={cn(
                'absolute z-50 w-[90vw] max-w-4xl cursor-move',
                'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl',
                'border border-white/20 dark:border-gray-700/20 shadow-2xl flex flex-col overflow-hidden'
              )}
              style={(() => {
                if (!chatRect) return { bottom: 'calc(5rem + 4.5rem)', left: '50%', transform: 'translateX(-50%)', x: chatPanelPos.x, y: chatPanelPos.y };
                const openUpwards = chatRect.top > window.innerHeight / 2;
                const panelX = chatRect.left + chatRect.width / 2;
                const base = { left: panelX, transform: 'translateX(-50%)', x: chatPanelPos.x, y: chatPanelPos.y } as any;
                return openUpwards
                  ? { ...base, bottom: window.innerHeight - chatRect.top + 16 }
                  : { ...base, top: chatRect.bottom + 16 };
              })()}
              drag
              dragMomentum={false}
              onDragEnd={(e, dragInfo) => {
                // Update the panel position relative to its current offset
                setChatPanelPos(prev => ({ x: prev.x + dragInfo.offset.x, y: prev.y + dragInfo.offset.y }));
              }}
            >
              <AIChat
                messages={messages}
                onSendMessage={(msg) => handleSendMessageInternal(msg)}
                onGenerateReport={handleGenerateReport}
                onSaveProject={handleSave}
                isLoading={isLoading}
                thinking={null}
                error={error}
                projectId={projectId}
                isLoadedProject={true}
                showInput={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <SpeechOverlay
          isOpen={isSpeechOverlayOpen}
          onClose={() => setIsSpeechOverlayOpen(false)}
          onTranscriptComplete={(transcript) => {
            setIsSpeechOverlayOpen(false);
            setIsChatVisible(true);
            handleSendMessageInternal(transcript);
          }}
        />

        {/* Floating DiagramActions bar with collapse capability */}
        {isToolbarCollapsed ? (
          <motion.button
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 p-2 rounded-full backdrop-blur-lg bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onClick={() => setIsToolbarCollapsed(false)}
          >
            <ChevronUp size={18} className="text-gray-700 dark:text-gray-200" />
          </motion.button>
        ) : (
          <motion.div
            className="absolute bottom-4 left-4 right-4 z-50 max-w-4xl mx-auto px-4"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          >
            <div
              className={cn(
                'inline-flex items-center bg-transparent backdrop-blur-none',
                'rounded-2xl px-2 gap-1'
              )}
            >
              <DiagramActions
                viewMode="AD"
                onSwitchView={handleSwitchView}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onFitView={handleFitView}
                onGenerateReport={handleGenerateReport}
                onComment={handleComment}
                onToggleDataFlow={handleToggleDataFlow}
                onToggleFlowchart={handleToggleFlowchart}
                onSave={handleSave}
                projectId={projectId}
                diagramRef={diagramRef}
                nodes={nodes}
                edges={edges}
                isDataFlowActive={isDataFlowActive}
                isFlowchartActive={isFlowchartActive}
                onRunThreatAnalysis={handleRunThreatAnalysis}
                runningThreatAnalysis={false}
                onLayout={handleEnhancedLayout}
                isLayouting={isLayouting}
                lastLayoutResult={lastLayoutResult}
                onCollapse={() => setIsToolbarCollapsed(true)}
              />
            </div>
          </motion.div>
        )}
      </DiagramStyleProvider>
    </Layout>
  );
};

export default ModelWithAI_V2; 