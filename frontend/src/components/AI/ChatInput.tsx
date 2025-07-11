import React, { useState, useRef } from 'react';
import { Send, Mic, Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import PlaceholderText, { getStaticPlaceholderText } from './PlaceholderText';
import { useTheme } from '@/contexts/ThemeContext';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  hasMessages?: boolean;
  onGenerateReport?: () => void;
  onSaveProject?: () => void;
  isThinking?: boolean;
  projectId?: string;
  isLoadedProject?: boolean;
  onMicrophoneClick?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  hasMessages = false,
  onGenerateReport,
  onSaveProject,
  isThinking = false,
  projectId = '',
  isLoadedProject = false,
  onMicrophoneClick
}) => {
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [messagesSent, setMessagesSent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const isTyping = input.trim().length > 0;
  const canSend = input.trim() && !isThinking && !isProcessing;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSend) {
      setIsProcessing(true);
      onSendMessage(input.trim());
      setInput('');
      setMessagesSent(true);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
      }
      
      // Simulate processing state for a brief moment
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && canSend) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleMicrophoneClick = () => {
    if (!isThinking && onMicrophoneClick) {
      onMicrophoneClick();
    }
  };

  // Get placeholder text props
  const placeholderProps = { 
    hasMessages, 
    messagesSent, 
    hasInteracted 
  };

  // Only show the bot icon when there are messages or messages were sent, and no text in the input
  const showBotIcon = (hasMessages || messagesSent) && !input;
  
  // Show typing placeholder only in the very first empty state (no messages yet)
  const showTypingPlaceholder = !input && !isThinking && !hasInteracted && !hasMessages;
  
  // Only set static placeholder when NOT showing the typing effect
  const staticPlaceholder = showTypingPlaceholder
    ? ""
    : isThinking
      ? "AI is thinking..."
      : showBotIcon
        ? ""
        : getStaticPlaceholderText(placeholderProps);

  return (
    <motion.div 
      className="relative"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Compact Input Container */}
      <div className="relative p-3">
        <form ref={formRef} onSubmit={handleSubmit} className="relative">
          {/* Clean Input Container */}
          <div className={cn(
            "relative group transition-all duration-300 ease-out",
            "border rounded-2xl shadow-sm hover:shadow-md",
            "min-h-[44px] flex items-center",
            theme === 'dark'
              ? "bg-gray-700 border-gray-600"
              : "bg-white border-gray-200",
            isFocused 
              ? theme === 'dark'
                ? "border-indigo-400 shadow-indigo-500/20 ring-2 ring-indigo-500/20"
                : "border-indigo-400 shadow-indigo-100/50 ring-2 ring-indigo-100/50"
              : isTyping
                ? theme === 'dark'
                  ? "border-purple-400"
                  : "border-purple-300"
                : theme === 'dark'
                  ? "border-gray-600 hover:border-gray-500"
                  : "border-gray-200 hover:border-gray-300",
            isThinking && "opacity-75 cursor-not-allowed"
          )}>

            {/* Compact Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={staticPlaceholder}
              disabled={isThinking}
              rows={1}
              className={cn(
                "w-full resize-none bg-transparent border-0 outline-0",
                "py-3 px-4 pr-20 font-medium text-[14px] leading-relaxed",
                "focus:ring-0 focus:outline-none",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                theme === 'dark'
                  ? "text-gray-100 placeholder-gray-400"
                  : "text-gray-800 placeholder-gray-400"
              )}
              style={{ 
                minHeight: '44px',
                maxHeight: '120px',
                lineHeight: '1.4'
              }}
            />

            {/* Typing effect placeholder overlay */}
            {showTypingPlaceholder && (
              <div className="absolute top-1/2 left-4 transform -translate-y-1/2 pointer-events-none z-5">
                <PlaceholderText 
                  hasMessages={hasMessages} 
                  messagesSent={messagesSent} 
                  hasInteracted={hasInteracted} 
                />
              </div>
            )}

            {/* Action Buttons - Right side only */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 z-30">
              
              {/* Microphone Button */}
              <motion.button
                type="button"
                onClick={handleMicrophoneClick}
                disabled={isThinking}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
                  "border border-gray-200/50",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                  theme === 'dark'
                    ? "bg-gray-600 hover:bg-gray-500 border-gray-500 text-gray-300 hover:text-gray-200"
                    : "bg-gray-100 hover:bg-gray-200 border-gray-200/50 text-gray-600 hover:text-gray-700"
                )}
              >
                <Mic size={14} />
              </motion.button>

              {/* Send Button */}
              <motion.button
                type="submit"
                disabled={!canSend}
                whileHover={{ scale: canSend ? 1.05 : 1 }}
                whileTap={{ scale: canSend ? 0.95 : 1 }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
                  "border shadow-sm",
                  canSend
                    ? theme === 'dark'
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-indigo-500 text-white shadow-indigo-500/25"
                      : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-indigo-400 text-white shadow-indigo-500/25"
                    : theme === 'dark'
                      ? "bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                <Send size={13} className={canSend ? "" : "opacity-50"} />
              </motion.button>
            </div>
          </div>
        </form>
      </div>

      {/* Thinking Indicator - Outside main container */}
      <AnimatePresence>
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 mx-3 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200/50"
          >
            <div className="flex items-center gap-3 text-xs text-indigo-700">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
              <span className="font-medium">AI is thinking...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChatInput;