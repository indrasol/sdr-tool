
import React, { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useTypingEffect } from '@/hooks/useTypingEffect';
import { Bot, Sparkles } from 'lucide-react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessageProps {
  message: Message;
  index: number; // Add message index from parent
}

const messageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  hover: { scale: 1.02, transition: { duration: 0.2 } }
};

const AIIconCursor = () => (
  <motion.span 
    className="inline-flex ml-1 text-securetrack-purple"
    animate={{ 
      scale: [1, 1.1, 1],
      rotate: [-3, 3, -3],
     }}
    transition={{ 
      duration: 1.5, 
      repeat: Infinity,
      repeatType: "reverse" 
    }}
  >
    <Bot size={16} className="opacity-80" />
  </motion.span>
);

// Global cache to track which messages have been typed
// Using content hash as key to ensure persistence between tab switches
const typedMessagesCache = new Set<string>();

const ChatMessage: React.FC<ChatMessageProps> = ({ message, index }) => {
  // Create a deterministic ID for this message based on content and position
  // This ensures unique IDs even for identical content
  const messageId = useMemo(() => {
    // Make sure the ID is deterministic but unique for each different message
    return `message-${message.role}-${index}-${message.content.substring(0, 40)}`;
  }, [message.role, message.content, index]);
  
  // Check if this message has been typed before
  const [hasTyped, setHasTyped] = useState(() => typedMessagesCache.has(messageId));
  
  // Get the typing effect result only if it's an AI message and hasn't been typed yet
  const { displayText, isComplete } = useTypingEffect({
    texts: [message.content],
    typingSpeed: 30,
    pauseAtEnd: 0,
    pauseAtStart: 0,
    blinkCursor: message.role === 'assistant' && !hasTyped && message.content.length > 0
  });

  // Use memoized gradients to avoid recalculation
  const gradientClasses = useMemo(() => {
    if (message.role === 'user') {
      return "bg-gradient-to-r from-[#8a7af8] to-[#b9aeff] text-white";
    } else {
      return "bg-gradient-to-r from-[#f3f3f3] to-[#ffffff] border border-gray-100";
    }
  }, [message.role]);

  // Mark as typed when complete
  useEffect(() => {
    if (isComplete && message.role === 'assistant' && !hasTyped) {
      setHasTyped(true);
      typedMessagesCache.add(messageId);
    }
  }, [isComplete, message.role, messageId, hasTyped]);

  // The content to display, with cursor if needed
  const messageContent = useMemo(() => {
    if (message.role === 'user') {
      return message.content;
    }
    
    // For AI messages
    if (!hasTyped) {
      // During typing, use the cursor from useTypingEffect
      return displayText;
    } else {
      // After typing is complete, show the full message content
      return message.content;
    }
  }, [message.role, displayText, hasTyped, message.content]);

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      whileHover="hover"
      variants={messageVariants}
      className={cn(
        "max-w-[65%] animate-fade-in",
        message.role === 'user' ? "ml-auto" : "mr-auto"
      )}
    >
      <motion.div 
        className={cn(
          "p-2.5 rounded-xl shadow-sm backdrop-blur-sm text-sm",
          gradientClasses
        )}
        whileHover={{ 
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          transition: { duration: 0.2 }
        }}
      >
        {message.role === 'assistant' ? (
          <span dangerouslySetInnerHTML={{ __html: messageContent }}></span>
        ) : (
          message.content
        )}
      </motion.div>
      <div className={cn(
        "text-xs mt-1 px-2 text-gray-500 flex items-center gap-1",
        message.role === 'user' ? "justify-end" : "justify-start"
      )}>
        {message.role === 'user' ? 'You' : (
          <span className="flex items-center gap-1">
            <Bot size={14} className="text-securetrack-purple" /> 
          </span>
        )} • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </div>
    </motion.div>
  );
};

export default ChatMessage;