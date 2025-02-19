import { useCallback, useState } from 'react';
import { Paperclip, ChevronUp, List, Square, Circle, ArrowRight, Eraser, Pointer, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AppHeader from '@/components/layout/AppHeader';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { mergeNodes, mergeEdges } from '@/utils/reponseUtils';

type Message = {
  id: number;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
};

type ToolType = 'select' | 'square' | 'circle' | 'arrow' | 'eraser';

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start describing your model...' },
    position: { x: 250, y: 25 },
  },
];

const ModelWithAI = () => {
  const [userInput, setUserInput] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  
  // NEW: Loading state
  const [loading, setLoading] = useState(false);

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

    setLoading(true); // Indicate request in progress

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

      if (data.status === 'success') {
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


        // If there's an 'expert query' or textual 'response', show in chat
        if (data.response) {
          const assistantMsg: Message = {
            id: Date.now(),
            content: data.response,
            type: 'assistant',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }

        // If there's a 'message' field about node actions, also display it
        if (data.message) {
          // data.message could be string or array
          const combinedMessage = Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message;

          if (combinedMessage) {
            const nodeInteractionMsg: Message = {
              id: Date.now(),
              content: combinedMessage,
              type: 'assistant',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, nodeInteractionMsg]);
          }
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
      setUserInput('');
    }
  };

  // Helper to add shapes manually
  const addShape = (type: 'square' | 'circle') => {
    const newNode = {
      id: Date.now().toString(),
      type: type === 'square' ? 'default' : 'output',
      data: { label: `New ${type}` },
      position: { 
        x: Math.random() * 400 + 50,
        y: Math.random() * 400 + 50
      },
      style: type === 'circle' ? {
        borderRadius: '50%',
        width: 80,
        height: 80,
      } : undefined,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="flex h-[calc(100vh-64px)] pt-16">
        {/* Left Sidebar - Chat Interface */}
        <div className="w-1/3 border-r border-border p-4 flex flex-col">
          {/* Tab Navigation */}
          <div className="flex mb-4 mt-4">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              }`}
            >
              History
            </button>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-auto mb-4 glass-card p-4 rounded-lg space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === 'assistant' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'assistant'
                      ? 'bg-secondary text-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

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
              placeholder="Start describing your project ..."
              className="min-h-[60px] pr-[100px] resize-none bg-secondary rounded-lg"
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

        {/* Right Panel - Diagramming Area */}
        <div className="flex-1 bg-dot-pattern relative">
          {/* Drawing Toolbar */}
          <div className="absolute top-20 left-4 glass-card p-2 rounded-lg flex flex-col gap-2 z-10">
            <Button
              size="icon"
              variant={activeTool === 'select' ? 'default' : 'ghost'}
              onClick={() => setActiveTool('select')}
              className="h-8 w-8"
            >
              <Pointer className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={activeTool === 'square' ? 'default' : 'ghost'}
              onClick={() => {
                setActiveTool('square');
                addShape('square');
              }}
              className="h-8 w-8"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={activeTool === 'circle' ? 'default' : 'ghost'}
              onClick={() => {
                setActiveTool('circle');
                addShape('circle');
              }}
              className="h-8 w-8"
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={activeTool === 'arrow' ? 'default' : 'ghost'}
              onClick={() => setActiveTool('arrow')}
              className="h-8 w-8"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={activeTool === 'eraser' ? 'default' : 'ghost'}
              onClick={() => setActiveTool('eraser')}
              className="h-8 w-8"
            >
              <Eraser className="h-4 w-4" />
            </Button>
            <div className="h-px bg-border w-full my-1"></div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setNodes([]);
                setEdges([]);
              }}
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4 rotate-45" />
            </Button>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default ModelWithAI;
