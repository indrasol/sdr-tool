
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

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, []);

  const handleSubmit = () => {
    // Here you would integrate with an AI service to process the input
    // For now, we'll just add a new node as a demonstration
    const newNode = {
      id: Date.now().toString(),
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
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-2">Model Description</h2>
            <p className="text-muted-foreground mb-4">
              Describe your model in natural language and see it visualized in real-time
            </p>
          </div>
          
          <div className="flex-1 overflow-auto mb-4 glass-card p-4 rounded-lg">
            {/* Chat messages would go here */}
          </div>

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
