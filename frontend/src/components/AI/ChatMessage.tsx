import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useTypingEffect } from '@/hooks/useTypingEffect';
import { Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  isPreExisting?: boolean;
  isAlreadyTyped?: boolean;
  id?: number;
  timestamp?: string;
  changed?: boolean;
  diagramState?: any;
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

// Helper function to enhance text formatting for AI messages
const enhanceTextFormatting = (text: string) => {
  if (!text) return '';
  // Only minimal cleanup: ensure newlines before list items and headers
  let formatted = text
    .replace(/([^-\n])\n(\s*[-*] )/g, '$1\n\n$2') // Ensure blank line before bullet
    .replace(/([^-\n])\n(\s*\d+\. )/g, '$1\n\n$2') // Ensure blank line before numbered list
    .replace(/([^-\n])\n(\s*#+ )/g, '$1\n\n$2'); // Ensure blank line before header
  return formatted;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, index, isLoadedProject = false }) => {
  // Ensure message content is a string
  const safeContent = typeof message.content === 'string' ? message.content : String(message.content || '');

  // Initialize hasTyped based on message properties
  const [hasTyped, setHasTyped] = useState(message.isPreExisting || message.isAlreadyTyped || false);
  
  // Use memo to create a unique message key from content to help React identify each message
  // This prevents unnecessary re-animations when tabs are switched
  const messageKey = React.useMemo(() => {
    return message.id ? `msg-${message.id}` : 
           message.timestamp ? `msg-${message.timestamp}` : 
           `msg-${index}-${safeContent.substring(0, 20)}`;
  }, [message.id, message.timestamp, safeContent, index]);
  
  // Reference to the message container for auto-scrolling
  const messageRef = useRef(null);

  // Only use typing effect for non-empty assistant messages that haven't been typed yet
  const isAssistantMessage = message.role === 'assistant';
  const shouldAnimate = isAssistantMessage && !hasTyped && safeContent.length > 0 && !message.isAlreadyTyped;
  
  // Immediately mark revert response messages as typed
  useEffect(() => {
    if (isAssistantMessage && safeContent.includes("Successfully reverted to")) {
      setHasTyped(true);
    }
  }, [isAssistantMessage, safeContent]);

  // Check if this message changed the diagram (for UI indication)
  const changedDiagram = Boolean(message.changed);
  
  // Format content for the final display
  const formattedContent = isAssistantMessage ? enhanceTextFormatting(safeContent) : safeContent;
  
  // Use typing effect with medium speed
  const typingResult = useTypingEffect({
    text: safeContent,
    typingSpeed: 8, // Medium speed
    blinkCursor: shouldAnimate,
    shouldType: shouldAnimate
  });

  // Update hasTyped when typing completes
  useEffect(() => {
    if (isAssistantMessage && typingResult.isComplete && !hasTyped) {
      setHasTyped(true);
    }
  }, [typingResult.isComplete, isAssistantMessage, hasTyped]);

  // Auto-scroll effect during typing
  useEffect(() => {
    if (shouldAnimate && messageRef.current && !typingResult.isComplete) {
      // Scroll to the bottom of this message
      const messageElement = messageRef.current;
      const chatContainer = messageElement.closest('.messages-container') || document.documentElement;
      
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [typingResult.displayText, shouldAnimate, typingResult.isComplete]);

  // Failsafe: Force hasTyped to true after a reasonable timeout
  useEffect(() => {
    if (isAssistantMessage && !hasTyped && safeContent.length > 0) {
      
      const timeoutDuration = Math.max(60000, safeContent.length * 20);
      
      const timer = setTimeout(() => {
        setHasTyped(true);
      }, timeoutDuration);
      
      return () => clearTimeout(timer);
    }
  }, [isAssistantMessage, hasTyped, safeContent]);

  // Styling for message bubbles
  const gradientClasses = message.role === 'user'
    ? "bg-gradient-to-r from-[#8a7af8] to-[#b9aeff] text-white"
    : "bg-gradient-to-r from-[#f3f3f3] to-[#ffffff] border border-gray-100";

  // Create a temporary ReactMarkdown component to handle the typing effect with proper formatting
  const TypingMarkdown = () => {
    // Only render the part of the text that has been "typed" so far
    const partialContent = typingResult.rawText;
    
    return (
      <div className="markdown-content typing-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h3: ({ children }) => <h3 className="text-md font-semibold mt-2 mb-1">{children}</h3>,
            ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            p: ({ children }) => <p className="mb-2">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          }}
        >
          {partialContent}
        </ReactMarkdown>
        {/* Add the typing cursor at the end */}
        {!typingResult.isComplete && showCursor && (
          <span className="inline-flex ml-1 text-securetrack-purple">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
              <path d="M12 8V4H8"></path>
              <rect width="16" height="12" x="4" y="8" rx="2"></rect>
              <path d="M2 14h2"></path>
              <path d="M20 14h2"></path>
              <path d="M15 13v2"></path>
              <path d="M9 13v2"></path>
            </svg>
          </span>
        )}
      </div>
    );
  };

  // State for cursor blinking
  const [showCursor, setShowCursor] = useState(true);

  // Handle cursor blinking after typing completes
  useEffect(() => {
    if (!shouldAnimate || !typingResult.isComplete) return;
    
    let blinkCount = 0;
    const maxBlinks = 4; // 2 complete blinks
    
    const blinkTimer = setInterval(() => {
      if (blinkCount < maxBlinks) {
        setShowCursor(prev => !prev);
        blinkCount++;
      } else {
        setShowCursor(false);
        clearInterval(blinkTimer);
      }
    }, 250);
    
    return () => clearInterval(blinkTimer);
  }, [shouldAnimate, typingResult.isComplete]);

  return (
    <motion.div
      ref={messageRef}
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
        className={cn("p-2.5 rounded-xl shadow-sm text-sm", gradientClasses)}
        whileHover={{ 
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          transition: { duration: 0.2 }
        }}
      >
        {isAssistantMessage ? (
          hasTyped ? (
            // Render full message after typing completes with ReactMarkdown
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
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
              {formattedContent || "Loading..."}
            </ReactMarkdown>
          ) : (
            // Show typing animation with Markdown rendering applied to the typed text
            <TypingMarkdown />
          )
        ) : (
          // User messages render directly
          <span>{message.content}</span>
        )}
      </motion.div>
      <div
        className={cn(
          "text-xs mt-1 px-2 text-gray-500 flex items-center gap-1",
          message.role === 'user' ? "justify-end" : "justify-start"
        )}
      >
        {message.role === 'user' ? (
          'You'
        ) : (
          <span className="flex items-center gap-1">
            <Bot size={14} className="text-securetrack-purple" />
            {changedDiagram && (
              <span className="ml-1 text-xs bg-securetrack-purple/20 text-securetrack-purple px-1.5 py-0.5 rounded-full">
                Updated diagram
              </span>
            )}
          </span>
        )}
        • {message.timestamp 
            ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </motion.div>
  );
};

export default ChatMessage;