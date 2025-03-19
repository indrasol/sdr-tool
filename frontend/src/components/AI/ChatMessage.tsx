
import React, { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useTypingEffect } from '@/hooks/useTypingEffect';
import { Bot, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './ChatMessage.css' 

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  isPreExisting?: boolean;
}

interface ChatMessageProps {
  message: Message;
  index: number;
  isLoadedProject?: boolean;
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

// Function to enhance text formatting
const enhanceTextFormatting = (text) => {
  if (!text) return '';
  let formatted = text
    .replace(/(\d+)\.\s+([^\n]+)/g, '$1. $2') // Numbered lists
    .replace(/(-|\*)\s+([^\n]+)/g, '* $2') // Bullet points
    .replace(/(\d+)\.\s+([^:]+):\s*/g, '### $1. $2\n') // Headers
    .replace(/\*\*([^*]+)\*\*/g, '**$1**') // Bold with **
    .replace(/__([^_]+)__/g, '**$1**') // Bold with __
    .replace(/^([A-Z][^:]+):/gm, '### $1'); // Section titles
  return formatted;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, index, isLoadedProject = false  }) => {
  // Create a deterministic ID for this message based on content and position
  // This ensures unique IDs even for identical content
  const messageId = useMemo(() => {
    // Make sure the ID is deterministic but unique for each different message
    return `message-${message.role}-${index}-${message.content.substring(0, 40)}`;
  }, [message.role, message.content, index]);
  
  // Check if this message has been typed before
  // const [hasTyped, setHasTyped] = useState(() => typedMessagesCache.has(messageId));
  const [hasTyped, setHasTyped] = useState(() => {
    if (message.isPreExisting === true) {
      return true;
    }
    return typedMessagesCache.has(messageId);
  });

  // Apply typing effect only for assistant messages that haven’t been typed
  const typingResult = useTypingEffect({
    texts: [message.content],
    typingSpeed: 15,
    pauseAtEnd: 0,
    pauseAtStart: 0,
    blinkCursor: message.role === 'assistant' && !hasTyped,
    shouldType: message.role === 'assistant' && !hasTyped,
  });

  // Use memoized gradients to avoid recalculation
  const gradientClasses = useMemo(() => {
    if (message.role === 'user') {
      return "bg-gradient-to-r from-[#8a7af8] to-[#b9aeff] text-white";
    } else {
      return "bg-gradient-to-r from-[#f3f3f3] to-[#ffffff] border border-gray-100";
    }
  }, [message.role]);

  // Enhanced formatted content for AI messages
  const formattedContent = useMemo(() => {
    if (message.role !== 'assistant') return message.content;
    return enhanceTextFormatting(message.content);
  }, [message.role, message.content]);

  // Mark message as typed when typing completes
  useEffect(() => {
    if (typingResult.isComplete && message.role === 'assistant' && !hasTyped) {
      setHasTyped(true);
      typedMessagesCache.add(messageId);
    }
  }, [typingResult.isComplete, message.role, messageId, hasTyped]);

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
          // "p-2.5 rounded-xl shadow-sm backdrop-blur-sm text-sm",
          "p-2.5 rounded-xl shadow-sm text-sm",
          gradientClasses,
          message.role === 'assistant' ? "message-content" : ""
        )}
        whileHover={{ 
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          transition: { duration: 0.2 }
        }}
      >
        {message.role === 'assistant' ? (
          hasTyped ? (
            // After typing is complete, use ReactMarkdown for better formatting
            <ReactMarkdown
              className="markdown-content"
              components={{
                h3: ({ children }) => <h3 className="text-md font-semibold mt-2 mb-1">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                p: ({ children }) => <p className="mb-2">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              }}
            >
              {formattedContent}
            </ReactMarkdown>
          ) : (
          <span dangerouslySetInnerHTML={{ __html: typingResult.displayText }}></span>
          )
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