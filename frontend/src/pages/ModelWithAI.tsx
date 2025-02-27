import { useCallback, useState, useEffect, useRef, memo } from 'react';
// import { Paperclip, ChevronUp, List, Square, Circle, ArrowRight, Eraser, Pointer, Plus } from 'lucide-react';
import { Cloud, Database, Server, Folder, File, Settings, Users, Lock, Network, Code, Search, Paperclip, ChevronUp, List, Square, Circle, Eraser, Plus, RectangleHorizontal, Diamond, Type, Loader2, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AppHeader from '@/components/layout/AppHeader';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  NodeResizer,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  getBezierPath,
  EdgeProps, 
  EdgeLabelRenderer
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { mergeNodes, mergeEdges, processBackendResponse } from '@/utils/reponseUtils';
import { nodeTypesConfig } from '@/utils/nodeTypesConfig';
import { tomorrow as tomorrowNight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message, ToolType } from '@/utils/types';
import { typeMessage } from '@/utils/reponseUtils';
// import { CustomControls } from '@/components/ui/custom-controls';
import { FlowControls } from '@/components/ui/flow-controls';
import { useParams } from 'react-router-dom';

const initialNodes =  [
  {
    id: '1',
    type: 'input',
    data: { 
      label: 'Start describing your model...',
      properties: {},
    },
    position: { x: 500, y: 200 },
    measured: {width: 150, height: 60}
  },
]

// ADD THIS CODE:
// Define a consistent node style for all nodes
const nodeDefaultStyle = {
  width: 150,
  height: 60,
  border: '2px solid rgb(75, 39, 153)', // Purple border from placeholder
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'white',
  padding: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
};

const ModelWithAI = () => {
  const { projectId } = useParams(); // Get projectId from URL params
  const [userInput, setUserInput] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [version, setVersion] = useState(1); // Initialize version to 1
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Track if we've had first interaction
  const [hadFirstInteraction, setHadFirstInteraction] = useState(false);
  // Loading state
  const [loading, setLoading] = useState(false);
  // Generating report state
  const [generatingReport, setGeneratingReport] = useState(false);


  // Define types for node and edge properties to fix TypeScript errors
  interface NodeProperties {
    node_type?: string;
    [key: string]: any;  // Allow for any other properties
  }
  
  interface EdgeProperties {
    edge_type?: string;
    type?: string;
    [key: string]: any;
  }

  // NEW: Add session state for better context management
  const [sessionState, setSessionState] = useState({
  projectId: projectId || '',
  currentVersion: 1,
  conversationHistory: [] as Message[],
  diagramContext: {
    nodes: [],
    edges: []
  }
  });

  // NEW: Update session state whenever nodes, edges, or messages change
  useEffect(() => {
    setSessionState(prevState => ({
      ...prevState,
      currentVersion: version,
      conversationHistory: messages,
      diagramContext: {
        nodes: nodes.map(node => ({
          id: node.id,
          type: ((node.data?.properties as NodeProperties | undefined)?.node_type) || node.type,
          properties: node.data?.properties || {},
          position: [node.position.x, node.position.y]
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: ((edge.data as EdgeProperties | undefined)?.edge_type) || edge.type,
          properties: edge.data?.properties || {}
        }))
      }
    }));
  }, [nodes, edges, messages, version, projectId]);


  // Initial welcome message after component mounts
  useEffect(() => {
    // Only add welcome message if no messages exist yet
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now(),
        content: "Hey! I'm your secure archietcture design assistant. Describe what you'd like to design, or use the shape tools to get started.",
        type: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({
      ...params,
      type: 'custom', // Use custom edge type for all connections
      id: `edge-${params.source}-${params.target}`,
      data: { type: 'default' }
    }, eds));
  }, []);

  // UPDATED: handleSend to preserve existing nodes and edges
  const handleSend = async () => {
    if (!userInput.trim()) return;

    // Set that we've had our first interaction
    if (!hadFirstInteraction) {
      setHadFirstInteraction(true);
    }

    // Add user message to the chat
    const newUserMessage: Message = {
      id: Date.now(),
      content: userInput,
      type: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    
    // Clear the input immediately after sending
    setUserInput('');
    setLoading(true);

    try {
      // NEW: Use sessionState for more consistent context representation
      const requestPayload = {
        user_input: userInput,
        diagram_context: {
          nodes: nodes.map(node => ({
            id: node.id,
            type: ((node.data?.properties as NodeProperties | undefined)?.node_type) || node.type,
            properties: node.data?.properties || {},
            position: [node.position.x, node.position.y]
          })),
          edges: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: ((edge.data as EdgeProperties | undefined)?.edge_type) || edge.type,
            properties: edge.data?.properties || {}
          })),
          version
        },
        // NEW: Include conversation history for better context
        conversation_history: messages
          .filter(msg => msg.type !== 'assistant')
          .map(msg => ({
            role: msg.type,
            content: msg.content,
            timestamp: msg.timestamp
          })),
        project_id: projectId,
        compliance_standards: [],
      };

      console.log("Request Payload:", requestPayload);

      const response = await fetch('http://localhost:8000/v1/routes/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Backend response:', data);

      // Update the version if provided
      if (data.version) {
        setVersion(data.version);
      }

      // Process the backend response
      processBackendResponse(data, nodes, edges, setNodes, setEdges, setMessages, hadFirstInteraction);
    } catch (error: any) {
      console.error('Failed to fetch from backend:', error);
      
    // NEW: Enhanced error message with recovery suggestion
    const errorMsg: Message = {
      id: Date.now(),
      content: `Error: ${error?.message || 'Failed to contact server.'}\n\nTry simplifying your request or refreshing the page if the problem persists.`,
      type: 'assistant' as const,
      timestamp: new Date(),
    };
      
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Function to generate a report
  const handleGenerateReport = async () => {
    if (nodes.length === 0) {
      // Don't generate a report for an empty diagram
      const errorMsg: Message = {
        id: Date.now(),
        content: "Please design an architecture first before generating a report.",
        type: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    setGeneratingReport(true);
    try {

      // Format nodes and edges with proper type casting for the report
      const formattedDiagramContext = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: ((node.data?.properties as NodeProperties | undefined)?.node_type) || node.type,
          properties: node.data?.properties || {},
          position: [node.position.x, node.position.y]
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: ((edge.data as EdgeProperties | undefined)?.edge_type) || edge.type,
          properties: edge.data?.properties || {}
        }))
      };
      // You'll implement the report generation API call here
      const reportRequest = {
        project_id: projectId,
        diagram_context: sessionState.diagramContext,
        conversation_history: sessionState.conversationHistory,
        format: 'markdown'
      };
      
      // Placeholder for the actual API call
      // const reportResponse = await fetch('http://localhost:8000/api/routes/generate_report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(reportRequest)
      // });
      // For now, just redirect to a report page
      
      // Navigate to report page (you'll need to implement this)
      // history.push(`/projects/${projectId}/report`);
      
      console.log("Report generation requested:", reportRequest);
      
      // Inform the user (temporary until navigation is implemented)
      const infoMsg: Message = {
        id: Date.now(),
        content: "This feature will be available soon!",
        type: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, infoMsg]);
      
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      const errorMsg: Message = {
        id: Date.now(),
        content: `Error generating report: ${error?.message || 'Unknown error'}`,
        type: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setGeneratingReport(false);
    }
  };

  

  const addShape = (type: 'square' | 'circle' | 'rectangle' | 'diamond' | 'text' | 'cloud' | 'database' | 'server' | 'folder' | 'file' | 'settings' | 'users' | 'lock' | 'network' | 'code') => {
    // Set that we've had first interaction
    if (!hadFirstInteraction) {
      setHadFirstInteraction(true);
    }

    
    // NEW: Better positioning calculation to avoid stacking
    const nodeCount = nodes.length;
    const position = {
      x: 500 + (nodeCount % 3) * 50, 
      y: 200 + Math.floor(nodeCount / 3) * 50,
    };
    
    // Handle basic shapes
    if (['square', 'circle', 'rectangle', 'diamond', 'text'].includes(type)) {
      const newNode = {
        id: `node-${Date.now()}`, // Use more predictable IDs
        type: 'custom',
        data: { 
          label: type.charAt(0).toUpperCase() + type.slice(1),
          properties: { node_type: type } // Important: set node_type in properties
        },
        position,
        style: nodeDefaultStyle,
        measured: { width: 150, height: 60 }
      };
      
      setNodes((nds) => [...nds, newNode]);
    } 
    // Handle architecture tools
    else {
      const IconComponent = {
        cloud: Cloud,
        database: Database,
        server: Server,
        folder: Folder,
        file: File,
        settings: Settings,
        users: Users,
        lock: Lock,
        network: Network,
        code: Code
      }[type];
      
      const newNode = {
        id: `${type}-${Date.now()}`, // More descriptive ID
        type: 'custom',
        data: { 
          label: type.charAt(0).toUpperCase() + type.slice(1),
          icon: IconComponent,
          properties: { node_type: type } // Set node_type for backend identification
        },
        position,
        style: nodeDefaultStyle,
        measured: { width: 200, height: 70 } 
      };
      
      setNodes((nds) => [...nds, newNode]);
    }
  };

  // Basic node component
  const BasicNode = ({ data }) => (
    <>
      <Handle type="target" position={Position.Left} style={{ background: 'rgb(75, 39, 153)' }} />
      <div className="flex flex-col items-center justify-center w-full h-full"> 
        <NodeResizer
          minWidth={100}
          minHeight={40}
          handleStyle={{
            border: 'none',
            backgroundColor: 'transparent',
          }}
          lineStyle={{
            border: 'none',
          }}
        />
        <span className='text-sm'>{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: 'rgb(75, 39, 153)' }} />
    </>
  );
    
  // Custom node with icon
  const CustomNode = ({ data }) => {
    const Icon = data.icon;
    
    return (
      <>
        <Handle 
          type="target" 
          position={Position.Left} 
          style={{ background: 'rgb(75, 39, 153)' }}
        />
        <div className="flex flex-col items-center justify-center w-full h-full" style={nodeDefaultStyle}>
          <NodeResizer
            minWidth={100}
            minHeight={40}
            handleStyle={{
              border: 'none',
              backgroundColor: 'transparent',
            }}
            lineStyle={{
              border: 'none',
            }}
          />
          
          {/* Icon section */}
          {Icon && (
            <div className="mb-1"> 
              <Icon className="w-5 h-5 text-purple-700" /> 
            </div>
          )}
          
          {/* Label section */}
          <span 
            className="text-sm font-medium"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '90%',
              textAlign: 'center'
            }}
          >
            {data.label}
          </span>
        </div>
        <Handle 
          type="source" 
          position={Position.Right} 
          style={{ background: 'rgb(75, 39, 153)' }}
        />
      </>
    );
  };

  // Custom Edge component to show labels
  const CustomEdge: React.FC<EdgeProps> = (props) => {
    const {
      id,
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      label,
      data,
      style = {},
      markerEnd,
    } = props;
      const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });
      return (
        <>
          <path
            id={id}
            style={{ ...style, strokeWidth: 2 }}
            className="react-flow__edge-path"
            d={edgePath}
            markerEnd={markerEnd}
          />
          {label && (
            <EdgeLabelRenderer>
              <div
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                  fontSize: 12,
                  pointerEvents: 'all',
                  backgroundColor: 'white',
                  padding: '2px 4px',
                  borderRadius: 4,
                }}
                className="nodrag nopan"
              >
                {label}
              </div>
            </EdgeLabelRenderer>
          )}
        </>
      );
    };

  // Add this to your edgeTypes in ReactFlow
  const edgeTypes = {
    custom: CustomEdge,
  };


  const toolList = [
    { type: 'square', icon: <Square className="h-4 w-4" />, label: 'Square' },
    { type: 'rectangle', icon: <RectangleHorizontal className="h-4 w-4" />, label: 'Rectangle' },
    { type: 'circle', icon: <Circle className="h-4 w-4" />, label: 'Circle' },
    { type: 'text', icon: <Type className="h-4 w-4" />, label: 'Text' },
    { type: 'clear', icon: <Plus className="h-4 w-4 rotate-45" />, label: 'Clear All', action: () => { setNodes([]); setEdges([]); } },
    // Software architecture tools
    { type: 'cloud', icon: <Cloud className="h-4 w-4" />, label: 'Cloud' },
    { type: 'database', icon: <Database className="h-4 w-4" />, label: 'Database' },
    { type: 'server', icon: <Server className="h-4 w-4" />, label: 'Server' },
    { type: 'folder', icon: <Folder className="h-4 w-4" />, label: 'Folder' },
    { type: 'file', icon: <File className="h-4 w-4" />, label: 'File' },
    { type: 'settings', icon: <Settings className="h-4 w-4" />, label: 'Settings' },
    { type: 'users', icon: <Users className="h-4 w-4" />, label: 'Users' },
    { type: 'lock', icon: <Lock className="h-4 w-4" />, label: 'Security' },
    { type: 'network', icon: <Network className="h-4 w-4" />, label: 'Network' },
    { type: 'code', icon: <Code className="h-4 w-4" />, label: 'Code' },
  ];

  const filteredTools = toolList.filter(tool => {
    if (!searchQuery) return true;
    return tool.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const Flow = () => {
    const reactFlowInstance = useReactFlow();
    
    return (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={{ 
          basic: BasicNode,
          custom: CustomNode 
        }}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: 'custom',
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1.25 }}
        minZoom={0.2}
        maxZoom={2}
        style={{ 
          width: '100%', 
          height: '70vh',
          position: 'absolute',
          top: 0,
          right: 0
        }}
        proOptions={{ hideAttribution: true }}
      >
        <FlowControls 
          position="top-left"
          style={{ 
            boxShadow: '0 0 2px 1px rgba(0, 0, 0, 0.08)',
          }}
          // style={{ marginTop: '80px', marginLeft: '10px' }}
        />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === 'basic') return '#0041d0';
            if (n.type === 'custom') return '#ff0072';
            return '#eee';
          }}
          nodeColor={(n) => {
            if (n.type === 'basic') return '#fff';
            if (n.type === 'custom') return '#fff';
            return '#fff';
          }}
          nodeBorderRadius={2}
          position="bottom-right"
          style={{ 
            backgroundColor: 'white',
            border: '2px solid #e5e5e5',
            borderRadius: '8px',
            margin: 20,
            width: 200,
            height: 150,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            bottom: 100
          }}
          zoomable
          pannable
        />
        <Background />
      </ReactFlow>
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-background">
      <AppHeader />
      
      <div className="flex h-[calc(100vh-64px)] pt-16">
        {/* Left Sidebar - Chat Interface */}
        <div className="w-1/3 border-r border-border flex flex-col h-[calc(100vh-64px)]">
          {/* Inner container with padding */}
          <div className="flex flex-col h-full p-4">
            {/* Tab Buttons */}
            <div className="flex mb-4">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg border-b-2 transition-colors ${
                  activeTab === 'chat' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Guardian AI
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg border-b-2 transition-colors ${
                  activeTab === 'history' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                History
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-auto glass-card p-4 rounded-lg space-y-4 mb-4">
              {activeTab === 'chat' ? (
                // Existing chat messages
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.type === "assistant" ? "justify-start" : "justify-end"}`}
                    // ref={message.type === "assistant" ? lastMessageRef : null}
                  >
                    <div 
                      className={`max-w-[80%] p-3 rounded-lg ${message.type === "assistant" ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"}`}
                    >
                      <ReactMarkdown
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const value = String(children).replace(/\n$/, "");
                            return inline ? (
                              <code className="bg-gray-200 px-1 py-0.5 rounded">{children}</code>
                            ) : (
                              <SyntaxHighlighter
                                style={tomorrowNight}
                                language={className?.replace(/language-/, "") || 'json'} // default to json if language not specified
                                PreTag="div" // to fix react-markdown code block issue
                                {...props}
                              >
                                {value}
                              </SyntaxHighlighter>
                            );
                          },
                        }}
                        skipHtml={false}
                      >
                        {DOMPurify.sanitize(message.content)}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))
              ) : (
                // History view with same chat styling
                <div className="space-y-4">
                  {messages
                    .filter(message => message.type === "user")
                    .map((message) => (
                    <div key={message.id}>
                      <div className="text-sm text-muted-foreground mb-1">
                        {new Date(message.timestamp).toLocaleString()}
                      </div>
                      <div className={`flex ${message.type === "assistant" ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${message.type === "assistant" ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"}`}>
                          <ReactMarkdown
                            components={{
                              code({ node, inline, className, children, ...props }) {
                                return inline ? (
                                  <code className="bg-gray-200 px-1 py-0.5 rounded">{children}</code>
                                ) : (
                                  <SyntaxHighlighter style={tomorrowNight} language="javascript" {...props}>
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                );
                              },
                            }}
                          >
                            {DOMPurify.sanitize(message.content)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-secondary text-foreground">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="relative">
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Start describing your project ..."
                className="w-full min-h-[60px] pr-[100px] resize-none bg-secondary rounded-lg"
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                {/* Report Generation Button */}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={handleGenerateReport}
                  disabled={loading || generatingReport || nodes.length === 0}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Generate Security Report"
                >
                  {generatingReport ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <List className="h-5 w-5" />
                </Button>
                <Button 
                  size="icon" 
                  onClick={handleSend}
                  disabled={!userInput.trim() || loading}
                  className="h-8 w-8"
                >
                  <ChevronUp className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Diagramming Area */}
        <div className="flex-1 bg-dot-pattern relative">
          {/* Drawing Toolbar */}
          <div className="flex flex-col gap-4 p-4 glass-card rounded-lg">
            {/* Search bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* Tools container with proper padding and overflow handling */}
            <div className="flex gap-2 justify-start flex-wrap overflow-x-auto px-2 py-1 min-w-0">
              {filteredTools.map((tool) => (
                <Button
                  key={tool.type}
                  variant={activeTool === tool.type ? 'default' : 'ghost'}
                  onClick={() => {
                    const newTool = tool.type;
                    setActiveTool(newTool);
                    setTimeout(() => setActiveTool(null), 200);
                    
                    if (tool.action) {
                      tool.action();
                    } else if ([
                      'square', 
                      'circle', 
                      'rectangle', 
                      'diamond', 
                      'text',
                      'cloud',
                      'database',
                      'server',
                      'folder',
                      'file',
                      'settings',
                      'users',
                      'lock',
                      'network',
                      'code'
                    ].includes(tool.type)) {
                      addShape(tool.type as any);
                    }
                  }}
                  className="h-9 px-3 rounded-lg transition-all duration-200 hover:scale-105 hover:bg-secondary hover:text-foreground whitespace-nowrap"
                  title={tool.label}
                >
                  <div className="flex items-center gap-2">
                    {tool.icon}
                    <span className="text-sm font-medium">{tool.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
          <ReactFlowProvider>
            <Flow />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
};

export default ModelWithAI; 
