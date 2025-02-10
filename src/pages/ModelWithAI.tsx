
import { useCallback, useState } from 'react';
import { MessageSquare } from 'lucide-react';
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

    // Add user message
    const newMessage: Message = {
      id: Date.now(),
      content: userInput,
      type: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);

    // Here you would integrate with an AI service to process the input
    // For now, we'll just add a new node as a demonstration
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
          <div className="flex mb-4 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'chat'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
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
          <div className="flex flex-col gap-2">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Describe your model or diagram..."
              className="min-h-[100px] resize-none"
            />
            <Button 
              onClick={handleSubmit}
              className="w-full"
              disabled={!userInput.trim()}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Generate Diagram
            </Button>
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
