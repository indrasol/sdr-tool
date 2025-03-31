
import React, { useState, useEffect } from 'react';
import AIChat from '../AIChat';
import { Message } from '../ChatMessage';

interface ChatPanelProps {
  defaultSize: number;
  onGenerateReport: () => string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ defaultSize, onGenerateReport }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const isCollapsed = defaultSize <= 5; // Consider it collapsed if size is small

  // Update elapsed time while thinking
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (isThinking) {
      // Set thinking start time when thinking begins
      if (!thinkingStartTime) {
        setThinkingStartTime(Date.now());
        setElapsedSeconds(0);
      }
      
      // Start interval to update elapsed time
      intervalId = window.setInterval(() => {
        if (thinkingStartTime) {
          const elapsed = Math.floor((Date.now() - thinkingStartTime) / 1000);
          setElapsedSeconds(elapsed);
        }
      }, 1000);
    } else {
      // Reset thinking state when not thinking
      setThinkingStartTime(null);
      setElapsedSeconds(0);
    }
    
    // Clean up interval on unmount or when thinking stops
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [isThinking, thinkingStartTime]);

  const handleSendMessage = (message: string) => {
    if (!message) {
      // If empty message, just clear the messages
      setMessages([]);
      return;
    }
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    // Set thinking state to true
    setIsThinking(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      // Create a unique AI response
      const aiResponse = "I understand your security requirements. I've updated the infrastructure diagram based on your needs.";
      
      // Set thinking to false
      setIsThinking(false);
      
      // Add AI response message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: aiResponse
      }]);
    }, 60000); // 60 seconds delay to show thinking state
  };

  const handleGenerateReportWithNavigation = () => {
    const reportPath = onGenerateReport();
    return reportPath;
  };

  return (
    <div className="bg-white border-r border-gray-200 h-full">
      {!isCollapsed ? (
        <AIChat 
          messages={messages} 
          onSendMessage={handleSendMessage}
          onGenerateReport={handleGenerateReportWithNavigation}
          isThinking={isThinking}
          elapsedTime={elapsedSeconds}
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <span className="text-xs text-gray-400 rotate-90 whitespace-nowrap">Chat Panel</span>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;