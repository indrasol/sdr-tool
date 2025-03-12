
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import AIChat, { Message } from '@/components/AI/AIChat';
import AIFlowDiagram from '@/components/AI/AIFlowDiagram';
import { diagramNodesState, diagramEdgesState } from '@/components/AI/diagramState';
import { Node } from '@xyflow/react';
import { CustomNodeData } from '@/components/AI/types/diagramTypes';

const AiAssisted = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [nodes, setNodes] = useState<Node<CustomNodeData>[]>(diagramNodesState);
  const [edges, setEdges] = useState(diagramEdgesState);

  useEffect(() => {
    toast({
      title: "AI Assisted Project",
      description: "Design your security infrastructure using natural language."
    });
  }, [toast]);

  const handleSendMessage = (message: string) => {
    if (!message) {
      // If empty message, just clear the messages
      setMessages([]);
      return;
    }
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponse = "I understand your security requirements. I've updated the infrastructure diagram based on your needs.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      
      // Update diagram with simulated new nodes/edges
      // In a real implementation, this would be based on AI analysis
      const newNode: Node<CustomNodeData> = {
        id: `node-${Date.now()}`,
        type: 'default',
        position: { x: Math.random() * 300, y: Math.random() * 300 },
        data: { label: `Component from: "${message.substring(0, 20)}..."` }
      };
      
      setNodes(prev => [...prev, newNode]);
    }, 1000);
  };

  const handleGenerateReport = () => {
    // Store current diagram state in localStorage or context
    localStorage.setItem('diagramNodes', JSON.stringify(nodes));
    localStorage.setItem('diagramEdges', JSON.stringify(edges));
    
    // Navigate to report page
    navigate('/generate-report');
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
            />
          </div>
          <div className="hidden lg:block w-2/3 bg-white rounded-lg border shadow-sm">
            <AIFlowDiagram 
              nodes={nodes}
              edges={edges}
              setNodes={setNodes}
              setEdges={setEdges}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AiAssisted;