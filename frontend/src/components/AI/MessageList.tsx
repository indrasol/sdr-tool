
import React, { useRef, useEffect } from 'react';
import ChatMessage, { Message } from './ChatMessage';
import EmptyChatState from './EmptyChatState';
import { motion } from 'framer-motion'
import { Bot } from 'lucide-react';
import './MessageList.css'

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  isLoadedProject?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading = false, isLoadedProject = false  }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Loading indicator animation variants
  const loadingVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="flex-grow overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <EmptyChatState />
      ) : (
        messages.map((message, index) => (
          <ChatMessage key={index} message={message} index={index} isLoadedProject={isLoadedProject} />
        ))
      )}
      {/* Loading indicator */}
      {isLoading && (
        <motion.div 
          initial="initial"
          animate="animate"
          variants={loadingVariants}
          className="max-w-[65%] mr-auto"
        >
          <div className="p-2.5 rounded-xl shadow-sm backdrop-blur-sm text-sm bg-gradient-to-r from-[#f3f3f3] to-[#ffffff] border border-gray-100">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div className="text-xs mt-1 px-2 text-gray-500 flex items-center gap-1 justify-start">
            <span className="flex items-center gap-1">
              <Bot size={14} className="text-securetrack-purple" /> 
            </span>
            • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </motion.div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;