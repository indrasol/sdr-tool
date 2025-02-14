
import { useCallback, useState } from 'react';
import { Paperclip, ChevronUp, List , Edit, Trash} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AppHeader from '@/components/layout/AppHeader';
import { BaseEdge} from "reactflow";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, []);

  const fetchArchitecture = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/routes/generate_architecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userInput }),
      });

      if (!response.ok) throw new Error("Failed to fetch architecture");

      const data = await response.json();
      console.log("Backend Response:", JSON.stringify(data, null, 2));

      // Extract nodes and edges from API response
    if (!data || !data.architecture || !data.architecture.nodes || !data.architecture.edges) throw new Error("Invalid API response format");

    // Transform response into ReactFlow nodes
    const formattedNodes = data.architecture.nodes.map((node: any) => ({
      id: node.id.toString(),
      type: node.type || "default",
      data: { label: node.data?.label ||  `Node ${node.id}` }, // Ensure label is meaningful,
      position: { x: node.x || Math.random() * 400, y: node.y || Math.random() * 400 }, // Fallback positioning
    }));

    // Transform response into ReactFlow edges
    const formattedEdges = data.architecture.edges.map((edge: any) => ({
      id: edge.id.toString(),
      source: edge.source.toString(),
      target: edge.target.toString(),
      animated: true, // Optional animation
    }));

    // Update state with new nodes and edges
    setNodes(formattedNodes);
    setEdges(formattedEdges);

    // Add assistant message in chat
    const aiMessage: Message = {
      id: Date.now() + 1,
      content: "Generated architecture successfully!",
      type: 'assistant',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMessage]);

  } catch (error) {
    console.error("Error processing architecture:", error);
    setMessages(prev => [...prev, { id: Date.now() + 2, content: "Error generating architecture.", type: "assistant", timestamp: new Date() }]);
  }
  setLoading(false);
  setUserInput('');
  };
  console.log("User Input:", userInput);
  // console.log("Messages:", messages);
  console.log("Nodes:", nodes);
  console.log("Edges:", edges);
  console.log("About to start handlesubmit()")

  const handleSubmit = () => {
    if (!userInput.trim()) return;

    // Add User Message
    const newMessage: Message = {
      id: Date.now(),
      content: userInput,
      type: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);

    fetchArchitecture();
    setUserInput('');
  };

  // Define colors for different node types
  const nodeColors = {
    scanning: "#E57373",
    storage: "#388E3C",
    processing: "#5C6BC0",
    akamai: "#D32F2F",
  };

  // Custom Node Component
  const CustomNode = ({ data }) => (
    <div style={{ ...nodeStyle, background: nodeColors[data.type] || "#90A4AE" }} className="p-2 rounded-lg shadow-md flex justify-between items-center">
      <span>{data.label}</span>
      <div className="flex gap-2">
        <button className="text-white opacity-75 hover:opacity-100">
          <Edit size={14} />
        </button>
        <button className="text-white opacity-75 hover:opacity-100">
          <Trash size={14} />
        </button>
      </div>
    </div>
  );

  const nodeStyle = {
    padding: "12px 16px",
    borderRadius: "12px",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
    background: "white",
    border: "1px solid #ddd",
    textAlign: "center" as "center",
  };
  
  // Custom Edge Styles
  const customEdgeStyle = {
    strokeWidth: 2,
    stroke: "#757575",
  };

  // Labeled Edges
  const edgeTypes = {
    labeled: ({ id, source, target, label, style }) => (
      <BaseEdge
        id={id}
        path='smoothstep'
        style={style}
        label={label} // Pass label directly as a prop
      />
    ),
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
            {loading && <p className="text-primary">Generating...</p>}
            {error && <p className="text-red-500">{error}</p>}
          </div>
  
          {/* Input Area */}
          <div className="relative">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Start describing your project..."
              className="min-h-[60px] pr-[100px] resize-none bg-secondary rounded-lg"
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <List className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!userInput.trim() || loading}
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
            nodes={nodes.map((node) => ({
              ...node,
              style: nodeStyle,
            }))}
            edges={edges.map((edge) => ({
              ...edge,
              type: "smoothstep",
              animated: true,
              style: customEdgeStyle,
            }))}
            nodeTypes={{
              custom: (props) => (
                <div style={{ ...nodeStyle, background: "#E3F2FD" as "center" }}>
                  {props.data.label}
                </div>
              ),
            }}
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
