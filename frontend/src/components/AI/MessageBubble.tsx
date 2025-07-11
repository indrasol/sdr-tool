import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isTyping?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  content,
  timestamp,
  isTyping = false,
  onCopy,
  copied = false
}) => {
  const { theme } = useTheme();
  const isUser = role === 'user';

  const bubbleVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20
      }
    }
  };

  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex gap-3 max-w-[80%] group",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ring-2",
        isUser
          ? theme === 'dark'
            ? "bg-gradient-to-r from-purple-600 to-purple-700 ring-purple-400/30"
            : "bg-gradient-to-r from-purple-500 to-purple-600 ring-purple-200"
          : theme === 'dark'
            ? "bg-gradient-to-r from-indigo-600 to-indigo-700 ring-indigo-400/30"
            : "bg-gradient-to-r from-indigo-500 to-indigo-600 ring-indigo-200"
      )}>
        {isUser ? (
          <User size={14} className="text-white" />
        ) : (
          <Bot size={14} className="text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "relative flex flex-col gap-1",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Message Bubble */}
        <div className={cn(
          "relative px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-200",
          "hover:shadow-xl hover:scale-[1.02] transform",
          isUser
            ? theme === 'dark'
              ? "bg-gradient-to-r from-purple-700/90 to-purple-600/90 text-white border-purple-500/30 shadow-purple-900/20"
              : "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-300/50 shadow-purple-500/20"
            : theme === 'dark'
              ? "bg-gradient-to-r from-gray-800/95 to-gray-700/95 text-gray-100 border-gray-600/30 shadow-gray-900/40"
              : "bg-gradient-to-r from-white to-gray-50 text-gray-800 border-gray-200/50 shadow-gray-300/20",
          "relative overflow-hidden"
        )}>
          {/* Subtle shimmer effect */}
          <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
            isUser
              ? "bg-gradient-to-r from-transparent via-white/10 to-transparent"
              : theme === 'dark'
                ? "bg-gradient-to-r from-transparent via-gray-300/10 to-transparent"
                : "bg-gradient-to-r from-transparent via-gray-500/5 to-transparent",
            "animate-shimmer"
          )} />
          
          {/* Content */}
          <div className="relative z-10">
            {isTyping ? (
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-bounce",
                    theme === 'dark' ? "bg-gray-400" : "bg-gray-500"
                  )} style={{ animationDelay: '0ms' }} />
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-bounce",
                    theme === 'dark' ? "bg-gray-400" : "bg-gray-500"
                  )} style={{ animationDelay: '150ms' }} />
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-bounce",
                    theme === 'dark' ? "bg-gray-400" : "bg-gray-500"
                  )} style={{ animationDelay: '300ms' }} />
                </div>
                <span className={cn(
                  "text-sm font-medium ml-2",
                  theme === 'dark' ? "text-gray-300" : "text-gray-600"
                )}>
                  AI is thinking...
                </span>
              </div>
            ) : (
              <div className={cn(
                "text-sm leading-relaxed font-medium",
                isUser 
                  ? "text-white" 
                  : theme === 'dark'
                    ? "text-gray-100"
                    : "text-gray-800"
              )}>
                {content}
              </div>
            )}
          </div>
          
          {/* Arrow pointer */}
          <div className={cn(
            "absolute w-3 h-3 transform rotate-45",
            isUser
              ? "-left-1 top-4"
              : "-right-1 top-4",
            isUser
              ? theme === 'dark'
                ? "bg-purple-700 border-l border-b border-purple-500/30"
                : "bg-purple-500 border-l border-b border-purple-300/50"
              : theme === 'dark'
                ? "bg-gray-800 border-r border-t border-gray-600/30"
                : "bg-white border-r border-t border-gray-200/50"
          )} />
        </div>

        {/* Timestamp and Actions */}
        <div className={cn(
          "flex items-center gap-2 text-xs opacity-70 group-hover:opacity-100 transition-opacity",
          isUser ? "flex-row-reverse" : "flex-row",
          theme === 'dark' ? "text-gray-400" : "text-gray-500"
        )}>
          {timestamp && (
            <span className="font-medium">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
          
          {!isUser && onCopy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
              className={cn(
                "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200",
                theme === 'dark'
                  ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              )}
            >
              {copied ? (
                <Check size={12} className="text-green-500" />
              ) : (
                <Copy size={12} />
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble; 