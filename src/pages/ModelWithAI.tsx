
import { useCallback, useState } from 'react';
import { Paperclip, ChevronUp, List } from 'lucide-react';
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

type Message = {
  id: number;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
};

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

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, []);

  const handleSubmit = () => {
    if (!userInput.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      content: userInput,
      type: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);

    const newNode = {
      id: Date.now().toString(),
      type: 'default',
      data: { label: userInput },
      position: { 
        x: Math.random() * 400 + 50,
        y: Math.random() * 400 + 50
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    setUserInput('');
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Chat Interface */}
        <div className="w-1/3 border-r border-border p-4 flex flex-col">
          {/* Tab Navigation */}
          <div className="flex mb-4">
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
                onClick={handleSubmit}
                disabled={!userInput.trim()}
                className="h-8 w-8"
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Diagramming Area */}
        <div className="flex-1 bg-dot-pattern">
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
