
import React from 'react';
import { Sparkles, Bot, MessageSquare, ArrowRight, Clock, RefreshCw, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';
import { Message } from './ChatMessage';

interface ChatHistoryProps {
  chatHistory: Array<{
    id: string;
    date: Date;
    messages: Message[];
  }>;
  onSelectChat: (chatId: string) => void;
  onClearHistory: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  chatHistory, 
  onSelectChat,
  onClearHistory
}) => {
  const isEmpty = chatHistory.length === 0;

  // Function to determine if a chat contains diagram modifications
  const containsDiagramModifications = (chat: { messages: Message[] }): boolean => {
    // Look for keywords in messages that suggest diagram modifications
    const diagramKeywords = ['diagram', 'node', 'flow', 'component', 'connect', 'infrastructure'];
    
    return chat.messages.some(message => 
      diagramKeywords.some(keyword => 
        message.content.toLowerCase().includes(keyword)
      )
    );
  };

  if (isEmpty) {
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
        <h3 className="text-sm font-medium text-gray-700">Previous Conversations</h3>
        <button 
          onClick={onClearHistory}
          className="text-xs text-gray-500 hover:text-securetrack-purple flex items-center gap-1"
        >
          <RefreshCw size={12} />
          Clear
        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
        {chatHistory.map((chat) => {
          const hasDiagramModifications = containsDiagramModifications(chat);
          
          return (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ backgroundColor: 'rgba(124, 101, 246, 0.05)' }}
              onClick={() => onSelectChat(chat.id)}
              className="p-3 border-b cursor-pointer"
            >
              <div className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-securetrack-purple/10 flex items-center justify-center mr-3">
                  {hasDiagramModifications ? (
                    <PenTool size={16} className="text-securetrack-purple" />
                  ) : (
                    <Bot size={16} className="text-securetrack-purple" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {chat.messages[0]?.content.substring(0, 30)}...
                    </p>
                  </div>
                  <div className="flex items-center mt-1">
                    <Clock size={12} className="text-gray-400 mr-1" />
                    <p className="text-xs text-gray-500">
                      {chat.date.toLocaleDateString()} at {chat.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                {hasDiagramModifications && (
                  <ArrowRight size={16} className="text-gray-400 self-center" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatHistory;