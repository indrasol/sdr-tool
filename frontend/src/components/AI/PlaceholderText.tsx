import React, { useEffect } from 'react';
import { Bot } from 'lucide-react';
import { useMultiTextTypingEffect } from '@/hooks/useMultiTextTypingEffect';

interface PlaceholderTextProps {
  hasMessages: boolean;
  messagesSent: boolean;
  hasInteracted: boolean;
}

// Extended set of placeholders for more engaging experience
const placeholders = [
  "Describe your security infrastructure requirements...",
  "Add a firewall between the internet and internal network",
  "I need a secure database with encryption",
  "Create a DMZ for my web servers",
  "Implement zero-trust architecture",
  "How can I secure AWS S3 buckets?",
  "Show me secure cloud architecture for a banking app",
  "Design a microservices architecture with API gateway",
  "What's the best approach for container security?",
  "Design a secure VPN architecture for remote workers",
  "Help me set up network segmentation",
  "How should I implement defense in depth?",
  "Secure my API endpoints",
  "Show me a GDPR-compliant architecture",
  "Create a threat model for my application"
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
  
  // For initial state, show continuous typing effect with multiple placeholders
  const { displayText, isTyping, isDeleting, currentTextIndex } = useMultiTextTypingEffect({
    texts: placeholders,
    typingSpeed: 80, 
    pauseAtEnd: 2000,
    pauseAtStart: 800,
    deleteSpeed: 50,
    blinkCursor: true,
    useBotCursor: true // Use the Guardian AI bot as cursor
  });
  
  // Debug log in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`PlaceholderText: typing=${isTyping}, deleting=${isDeleting}, messageIndex=${currentTextIndex}`);
    }
  }, [isTyping, isDeleting, currentTextIndex]);
  
  return <span className="typing-placeholder" dangerouslySetInnerHTML={{ __html: displayText }} />;
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