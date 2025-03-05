
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileText, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onGenerateReport: () => void;
}

const placeholders = [
  "Describe your security infrastructure requirements...",
  "Add a firewall between the internet and internal network...",
  "I need a secure database with encryption...",
  "Create a DMZ for the web servers...",
  "Implement zero-trust architecture..."
];

const AIChat: React.FC<AIChatProps> = ({ messages, onSendMessage, onGenerateReport }) => {
  const [input, setInput] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [typingForward, setTypingForward] = useState(true);
  const [charIndex, setCharIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-typing effect for placeholder
  useEffect(() => {
    const typingSpeed = 100; // ms per character
    const pauseAtEnd = 2000; // pause at the end of a complete message
    const pauseAtStart = 700; // pause at the start before typing
    
    const timer = setTimeout(() => {
      if (typingForward) {
        // Typing forward
        if (charIndex < placeholders[placeholderIndex].length) {
          setPlaceholder(placeholders[placeholderIndex].substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          // Reached the end, pause before starting to delete
          setTypingForward(false);
          return pauseAtEnd;
        }
      } else {
        // Deleting
        if (charIndex > 0) {
          setPlaceholder(placeholders[placeholderIndex].substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          // Fully deleted, move to the next placeholder
          setTypingForward(true);
          setPlaceholderIndex((placeholderIndex + 1) % placeholders.length);
          return pauseAtStart;
        }
      }
    }, typingForward ? typingSpeed : typingSpeed / 2);
    
    return () => clearTimeout(timer);
  }, [charIndex, placeholderIndex, typingForward]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">Chat with AI Assistant</h3>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 my-8">
            <p>Start describing your security requirements to the AI</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={cn(
                "p-3 rounded-lg max-w-[80%]",
                message.role === 'user' 
                  ? "bg-primary text-primary-foreground ml-auto" 
                  : "bg-muted mr-auto"
              )}
            >
              {message.content}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={placeholder}
            className="min-h-[60px] flex-grow"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={onGenerateReport}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIChat;