
import React from 'react';
import { Bot } from 'lucide-react';
import { useTypingEffect } from '@/hooks/useTypingEffect';

interface PlaceholderTextProps {
  hasMessages: boolean;
  messagesSent: boolean;
  hasInteracted: boolean;
}

// Placeholders
const placeholders = [
  "Describe your security infrastructure requirements...",
  "Add a firewall between the internet and internal network...",
  "I need a secure database with encryption...",
  "Create a DMZ for the web servers...",
  "Implement zero-trust architecture..."
];

// Custom placeholder with Guardian AI icon
export const GuardianAIPlaceholder: React.FC = () => (
  <div className="flex items-center gap-1.5 text-gray-400">
    <Bot size={16} className="text-securetrack-purple" />
    <span>Ask Guardian AI</span>
  </div>
);

// This returns a component with typing effect for use as placeholder
const PlaceholderText: React.FC<PlaceholderTextProps> = ({ 
  hasMessages, 
  messagesSent, 
  hasInteracted 
}) => {
  // If there are messages, we show a static placeholder
  if (hasMessages || messagesSent) {
    return <span>Ask Guardian AI...</span>;
  }
  
  // If user has interacted but no messages, show static placeholder
  if (hasInteracted) {
    return <span>Type your message...</span>;
  }
  
  // For initial state, show typing effect with random placeholders
  const { displayText } = useTypingEffect({
    texts: placeholders,
    typingSpeed: 50,
    pauseAtEnd: 3000,
    pauseAtStart: 500,
    blinkCursor: false
  });
  
  return <span dangerouslySetInnerHTML={{ __html: displayText }} />;
};

// This function returns a string for simple placeholder use cases
export const getStaticPlaceholderText = ({ 
  hasMessages, 
  messagesSent, 
  hasInteracted 
}: PlaceholderTextProps): string => {
  const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)];
  
  return hasMessages || messagesSent 
    ? "Ask Guardian AI..." 
    : (hasInteracted ? "Type your message..." : randomPlaceholder);
};

export default PlaceholderText;