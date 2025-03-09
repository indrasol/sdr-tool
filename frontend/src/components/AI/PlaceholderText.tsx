
import React from 'react';
import { useTypingEffect } from '@/hooks/useTypingEffect';
import { Bot } from 'lucide-react';

interface PlaceholderTextProps {
  hasMessages: boolean;
  messagesSent: boolean;
  hasInteracted: boolean;
}

// Placeholders for typing effect
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

// This function returns a string for use as placeholder text
const PlaceholderText = ({ 
  hasMessages, 
  messagesSent, 
  hasInteracted 
}: PlaceholderTextProps): string => {
  // Get the typing effect but use rawText instead of displayText with HTML
  const { rawText } = useTypingEffect({
    texts: placeholders,
    typingSpeed: 80,
    pauseAtEnd: 2000,
    pauseAtStart: 700,
    blinkCursor: false // We'll handle the cursor separately
  });

  // Determine what to show as placeholder
  // Only show typing effect when there are no messages and user hasn't interacted
  const placeholderText = hasMessages || messagesSent 
    ? "Ask Guardian AI..." // String placeholder when there are messages
    : (hasInteracted ? "Type your message..." : rawText);

  return placeholderText;
};

export default PlaceholderText;