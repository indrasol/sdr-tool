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
  "Ask Guardian AI to design a secure cloud architecture…",
  "Generate a data-flow diagram for my payment system",
  "Identify key risks in this Kubernetes deployment",
  "Suggest zero-trust controls for a SaaS platform",
  "How do I secure my API gateway?",
  "Create SOC 2 ready infrastructure",
  "Design a microservices layout with least-privilege access",
  "Propose encryption strategy for user data at rest",
  "Show mitigations for OWASP Top 10",
  "Generate threat model for this fintech app"
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