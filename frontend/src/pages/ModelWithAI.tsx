import { useCallback, useState, useEffect, useRef, memo } from 'react';
// import { Paperclip, ChevronUp, List, Square, Circle, ArrowRight, Eraser, Pointer, Plus } from 'lucide-react';
import { Cloud, Database, Server, Folder, File, Settings, Users, Lock, Network, Code, Search, Paperclip, ChevronUp, List, Square, Circle, Eraser, Plus, RectangleHorizontal, Diamond, Type } from 'lucide-react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { mergeNodes, mergeEdges, parseExpertResponse } from '@/utils/reponseUtils';
import { tomorrow as tomorrowNight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message, ToolType } from '@/utils/types';
import { typeMessage } from '@/utils/reponseUtils';

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start describing your model...' },
    position: { x: 500, y: 200 },
  },
];

const ModelWithAI = () => {
  const [userInput, setUserInput] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  
  // NEW: Loading state
  const [loading, setLoading] = useState(false);

  // First, add a ref for the chat container
  // const chatContainerRef = useRef<HTMLDivElement>(null);
  // const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update the useEffect to ensure smooth scrolling
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, []);

  // UPDATED: handleSend instead of handleSubmit
  const handleSend = async () => {
    if (!userInput.trim()) return;

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
      const response = await fetch('http://localhost:8000/api/routes/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: userInput,
          diagram_context: {
            nodes,
            edges,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Backend response:', data);
      console.log('Backend response nodes:', data.nodes);
      console.log('Backend response edges:', data.edges);

      // Example structure:
      // {
      //   "status": "success",
      //   "message": [... or string ...],
      //   "nodes": [...],
      //   "edges": [...],
      //   "response": "some text if it's an expert query"
      // }

      // Handle different response cases
      let assistantMessage = '';

      // Category : Node Interaction Response
      if (data.status === 'success') {

        // Add the assistant's message placeholder
        const assistantMsg: Message = {
          id: Date.now(),
          content: '', // Initially empty content for typing effect
          type: 'assistant',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        
        
        // Merge nodes if present
        if (data.nodes) {
          const merged = mergeNodes(nodes, data.nodes);
          setNodes(merged);
        }

        // Merge edges if present
        if (data.edges) {
          const merged = mergeEdges(edges, data.edges);
          setEdges(merged);
        }

        // If there's a 'message' field about node actions, also display it
        if (data.message) {
          // data.message could be string or array
          const combinedMessage = Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message;

          if (combinedMessage) {
            assistantMessage = combinedMessage;
            // Start the typing effect for the node interaction message
            typeMessage(assistantMessage, setMessages, () => {
              // If needed, add any additional post-typing logic here
            });
          }
        }

        // // Category : 'expert query' or textual response
        if (data.expert_message) {
          const formattedText = parseExpertResponse(data.expert_message);
          assistantMessage = formattedText;

          // Trigger typing effect after adding the message
          typeMessage(assistantMessage, setMessages, () => {
        });
      }

      } else {
        // For error or out-of-context
        const errorMsg: Message = {
          id: Date.now(),
          content: data.message || 'Something went wrong.',
          type: 'assistant',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (error) {
      console.error('Failed to fetch from backend:', error);
      const errorMsg: Message = {
        id: Date.now(),
        content: 'Error contacting server.',
        type: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const addShape = (type: 'square' | 'circle' | 'rectangle' | 'diamond' | 'text' | 'cloud' | 'database' | 'server' | 'folder' | 'file' | 'settings' | 'users' | 'lock' | 'network' | 'code') => {
    let newNode;
    
    const position = {
      x: 300 + (Math.random() - 0.5) * 20,
      y: 100 + (Math.random() - 0.5) * 20
    };
    
    const commonStyle = {
      width: 150,
      height: 40,
      border: '2px solid hsl(var(--primary))',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent'
    };
    
    // Handle basic shapes
    if (['square', 'circle', 'rectangle', 'diamond', 'text'].includes(type)) {
      newNode = {
        id: Date.now().toString(),
        type: 'basic',
        data: { label: type.charAt(0).toUpperCase() + type.slice(1) },
        position,
        style: commonStyle
      };
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
      
      newNode = {
        id: Date.now().toString(),
        type: 'custom',
        data: { 
          label: '',
          icon: IconComponent 
        },
        position,
        style: commonStyle
      };
    }
    
    setNodes((nds) => [...nds, newNode]);
  };

  // Update the node components
  const BasicNode = ({ data }) => (
    <>
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center justify-center w-full h-full">
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
        <span>{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );

  const CustomNode = ({ data }) => {
    const Icon = data.icon;
    return (
      <>
        <Handle 
          type="target" 
          position={Position.Left} 
        />
        <div className="flex items-center justify-center w-full h-full">
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
          <Icon className="w-6 h-6" />
        </div>
        <Handle type="source" position={Position.Right} />
      </>
    );
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
                ))
              ) : (
                // History view with same chat styling
                <div className="space-y-4">
                  {messages.map((message) => (
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
                    Processing...
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
            <Controls 
              position="top-left"
              style={{ top: 10, left: 10 }}
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
        </div>
      </div>
    </div>
  );
};

export default ModelWithAI;
