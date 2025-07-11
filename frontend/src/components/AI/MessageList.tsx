import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import MessageBubble from './MessageBubble';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  isPreExisting?: boolean;
  timestamp?: string;
  id?: number;
  changed?: boolean;
  diagramState?: {
    nodes: any[];
    edges: any[];
  };
}

interface MessageListProps {
  messages: Message[];
  thinking?: {
    text: string;
    hasRedactedContent: boolean;
  } | null;
  error?: string | null;
  onRevertToDiagramState?: (messageContent: string, diagramState: any) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  thinking,
  error,
  onRevertToDiagramState
}) => {
  const { theme } = useTheme();
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const handleCopyMessage = async (content: string, messageId?: number) => {
    try {
      await navigator.clipboard.writeText(content);
      if (messageId) {
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <div className={cn(
      "flex-1 overflow-hidden",
      theme === 'dark' 
        ? "bg-gradient-to-b from-gray-900/50 to-gray-800/50" 
        : "bg-gradient-to-b from-gray-50/50 to-white/50"
    )}>
      <ScrollArea className="h-full px-4 py-6">
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className={cn(
              "flex flex-col items-center justify-center h-64 text-center",
              theme === 'dark' ? "text-gray-400" : "text-gray-500"
            )}>
              <div className={cn(
                "text-6xl mb-4",
                theme === 'dark' ? "text-gray-600" : "text-gray-300"
              )}>
                💬
              </div>
              <h3 className={cn(
                "text-xl font-semibold mb-2",
                theme === 'dark' ? "text-gray-300" : "text-gray-600"
              )}>
                Start a conversation
              </h3>
              <p className={cn(
                "text-sm max-w-md",
                theme === 'dark' ? "text-gray-500" : "text-gray-400"
              )}>
                Ask questions about your architecture diagram or request modifications. 
                The AI will help you design secure and robust systems.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id || index}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                  onCopy={message.role === 'assistant' ? () => handleCopyMessage(message.content, message.id) : undefined}
                  copied={copiedMessageId === message.id}
                />
              ))}
              
              {/* Thinking indicator */}
              {thinking && (
                <MessageBubble
                  role="assistant"
                  content={thinking.text}
                  isTyping={true}
                />
              )}
              
              {/* Error message */}
              {error && (
                <div className={cn(
                  "p-4 rounded-lg border-l-4 border-red-500 mx-4",
                  theme === 'dark'
                    ? "bg-red-900/20 text-red-300 border-red-400"
                    : "bg-red-50 text-red-700 border-red-400"
                )}>
                  <div className="font-medium text-sm">Error</div>
                  <div className="text-sm mt-1 opacity-90">{error}</div>
                </div>
              )}
            </>
          )}
          
          {/* Auto-scroll target */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessageList;
