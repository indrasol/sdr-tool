import React from 'react';
import { Clock, RefreshCw, PenTool, Bot, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Message } from './AIChat';

interface ChatHistoryProps {
  chatHistory: Array<{
    id: string;
    date: Date;
    messages: Message[];
  }>;
  onSelectChat: (chatId: string) => void; // We'll keep this but not use it for row clicks
  onClearHistory: () => void;
  onRevertToDiagramState?: (messageContent: string, diagramState: any) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  chatHistory, 
  onSelectChat,
  onClearHistory,
  onRevertToDiagramState
}) => {
  // Extract all user messages from all chat histories
  const allUserMessages = chatHistory.flatMap(chat => 
    chat.messages
      .filter(msg => msg.role === 'user')
      .map((msg, idx) => {
        // Find the assistant response that might contain diagram changes
        const assistantResponse = chat.messages.find((m, i) => 
          i > idx && m.role === 'assistant'
        );

        // A message has diagram modifications if:
        // 1. It has a diagramState property OR
        // 2. The following assistant message contains diagram-related keywords
        const hasDiagramModification = 
          // Check if the message has a diagram state
          !!msg.diagramState || 
          // Check if assistant response contains diagram-related keywords
          (assistantResponse && containsDiagramModifications(assistantResponse.content));
        
        return {
          content: msg.content,
          date: new Date(msg.timestamp || chat.date),
          chatId: chat.id,
          messageIndex: idx,
          diagramState: msg.diagramState,
          hasDiagramModification: hasDiagramModification
        };
      })
  );

  // Sort messages by date (newest last)
  const sortedUserMessages = [...allUserMessages].sort((a, b) => 
    a.date.getTime() - b.date.getTime()
  );

  // Get the 10 most recent messages
  const recentUserMessages = sortedUserMessages.slice(-10);

  // Function to determine if a message contains diagram modifications based on content
  function containsDiagramModifications(content: string): boolean {
    const diagramKeywords = [
      'diagram', 'node', 'flow', 'component', 'connect', 'infrastructure',
      'added', 'removed', 'updated', 'modified', 'created', 'linked',
      'architecture', 'deployed', 'configured', 'setup', 'designed',
      'network', 'database', 'server', 'cloud', 'security', 'firewall',
      'gateway', 'router', 'topology', 'layout', 'structure', 'service',
      'api', 'container', 'kubernetes', 'docker', 'aws', 'azure', 'gcp'
    ];
    
    return diagramKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  // Handle click on revert button
  const handleRevertClick = (message: string, diagramState: any) => {
    if (onRevertToDiagramState && diagramState) {
      onRevertToDiagramState(message, diagramState);
    }
  };

  // If there are no messages in history
  if (recentUserMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Clock className="h-12 w-12 text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-700">No chat history yet</h3>
        <p className="text-sm text-gray-500 mt-2">
          Your conversations with Guardian AI will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-medium text-gray-700">Recent Messages</h3>
        <button 
          onClick={onClearHistory}
          className="text-xs text-gray-500 hover:text-securetrack-purple flex items-center gap-1"
        >
          <RefreshCw size={12} />
          Clear History
        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
        {recentUserMessages.map((message, index) => (
          <motion.div
            key={`${message.chatId}-${message.messageIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ backgroundColor: 'rgba(124, 101, 246, 0.05)' }}
            className="p-3 border-b"
          >
            <div className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-securetrack-purple/10 flex items-center justify-center mr-3">
                {message.hasDiagramModification ? (
                  <PenTool size={16} className="text-securetrack-purple" />
                ) : (
                  <Bot size={16} className="text-securetrack-purple" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {message.content.length > 50 
                      ? message.content.substring(0, 50) + "..." 
                      : message.content}
                  </p>
                </div>
                <div className="flex items-center mt-1">
                  <Clock size={12} className="text-gray-400 mr-1" />
                  <p className="text-xs text-gray-500">
                    {message.date.toLocaleDateString()} at {message.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
              {message.hasDiagramModification && message.diagramState && onRevertToDiagramState && (
                <button
                  onClick={() => handleRevertClick(message.content, message.diagramState)}
                  className="p-1 rounded-full hover:bg-securetrack-purple/10 transition-colors"
                  title="Revert to this diagram state"
                >
                  <RotateCcw size={16} className="text-securetrack-purple" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;