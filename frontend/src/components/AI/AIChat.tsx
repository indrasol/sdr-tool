
import React, { useState, useEffect } from 'react';
import ChatTabs from './ChatTabs';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ChatHistory from './ChatHistory';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { WallpaperOption } from './types/chatTypes';
import ThinkingDisplay from './ThinkingDisplay'

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  isPreExisting?: boolean;
  timestamp?: string;
  diagramState?: {
    nodes: any[];
    edges: any[];
  };
}

interface AIChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onGenerateReport: () => void;
  onSaveProject: () => void;
  isLoading?: boolean;
  thinking?: {
    text: string;
    hasRedactedContent: boolean;
  } | null;
  error?: string | null;
  projectId?: string;
  isLoadedProject?: boolean;
  // New props for diagram state handling
  diagramState?: {
    nodes: any[];
    edges: any[];
  };
  onRevertToDiagramState?: (messageContent: string, diagramState: any) => void;
}

interface ChatSession {
  id: string;
  date: Date;
  messages: Message[];
}

const AIChat: React.FC<AIChatProps> = ({ 
  messages, 
  onSendMessage, 
  onGenerateReport, 
  onSaveProject,
  isLoading = false,
  thinking = null,
  error = null,
  projectId,
  isLoadedProject = false,
  diagramState,
  onRevertToDiagramState
}) => {
  const [activeTab, setActiveTab] = useState<'guardian' | 'history'>('guardian');
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentWallpaper, setCurrentWallpaper] = useState<WallpaperOption>({
    id: 'default',
    name: 'Default',
    bgClass: 'bg-gradient-to-b from-[#f8f9fb] to-[#f1f3f9]',
    textClass: 'text-gray-900'
  });

  // Track previous diagram state for comparison
  const [prevDiagramState, setPrevDiagramState] = useState<any>(null);

  // Enhanced messages to store diagram state
  // We'll do this whenever diagramState changes
  useEffect(() => {
    if (!diagramState) return;
    
    // Only process if diagram has actually changed
    const diagramChanged = !prevDiagramState || 
      JSON.stringify(prevDiagramState.nodes) !== JSON.stringify(diagramState.nodes) ||
      JSON.stringify(prevDiagramState.edges) !== JSON.stringify(diagramState.edges);
    
    if (diagramChanged && messages.length > 0 && activeSessionId) {
      // Clone current diagram state to keep it immutable
      const currentDiagramState = {
        nodes: JSON.parse(JSON.stringify(diagramState.nodes)),
        edges: JSON.parse(JSON.stringify(diagramState.edges))
      };
      
      // Update all user messages that don't have a diagram state
      // This ensures each message has the diagram state at the time it was sent
      const updatedChatHistory = chatHistory.map(session => {
        if (session.id !== activeSessionId) return session;
        
        // Create a diagram state at each message to enable reversion
        const updatedMessages = [...session.messages];
        
        // Find user messages without diagram state
        for (let i = 0; i < updatedMessages.length; i++) {
          const msg = updatedMessages[i];
          if (msg.role === 'user' && !msg.diagramState) {
            updatedMessages[i] = {
              ...msg,
              diagramState: currentDiagramState,
              timestamp: msg.timestamp || new Date().toISOString()
            };
          }
        }
        
        return {
          ...session,
          messages: updatedMessages
        };
      });
      
      // Save updated chat history
      setChatHistory(updatedChatHistory);
      localStorage.setItem('chatHistory', JSON.stringify(updatedChatHistory));
      
      // Update prev state for future comparisons
      setPrevDiagramState(currentDiagramState);
    }
  }, [diagramState, messages, activeSessionId, chatHistory, prevDiagramState]);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('chatHistory');
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        // Convert string dates back to Date objects
        const historyWithProperDates = parsed.map((session: any) => ({
          ...session,
          date: new Date(session.date)
        }));
        setChatHistory(historyWithProperDates);
      } catch (e) {
        console.error('Failed to parse chat history:', e);
      }
    }

    // Load saved wallpaper preference
    const savedWallpaper = localStorage.getItem('chatWallpaper');
    if (savedWallpaper) {
      try {
        setCurrentWallpaper(JSON.parse(savedWallpaper));
      } catch (e) {
        console.error('Failed to parse wallpaper settings:', e);
      }
    }
  }, []);

  // Save current session to history when messages change
  useEffect(() => {
    if (messages.length > 0 && activeTab === 'guardian') {
      // If no active session yet, create one
      if (!activeSessionId) {
        const newSessionId = uuidv4();
        setActiveSessionId(newSessionId);
        const newSession = {
          id: newSessionId,
          date: new Date(),
          messages: messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp || new Date().toISOString()
          }))
        };
        
        setChatHistory(prev => {
          const updated = [newSession, ...prev];
          // Save to localStorage
          localStorage.setItem('chatHistory', JSON.stringify(updated));
          return updated;
        });
      } else {
         // Update existing session
         setChatHistory(prev => {
          const updatedHistory = prev.map(session => 
            session.id === activeSessionId 
              ? { 
                  ...session, 
                  messages: messages.map(msg => ({
                    ...msg,
                    timestamp: msg.timestamp || new Date().toISOString()
                  }))
                } 
              : session
          );
          
          // Save to localStorage
          localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
          return updatedHistory;
        });
      }
    }
  }, [messages, activeSessionId, activeTab]);

  const handleWallpaperChange = (wallpaper: WallpaperOption) => {
    setCurrentWallpaper(wallpaper);
    localStorage.setItem('chatWallpaper', JSON.stringify(wallpaper));
  };

  const handleSelectChat = (chatId: string) => {
    const selectedChat = chatHistory.find(chat => chat.id === chatId);
    if (selectedChat) {
      // Tell the parent component to update its messages
      onSendMessage(''); // First clear the current message
      selectedChat.messages.forEach(msg => {
        if (msg.role === 'user') {
          onSendMessage(msg.content);
        }
      });
      setActiveSessionId(chatId);
      setActiveTab('guardian'); // Switch to guardian tab to show the loaded chat
    }
  };

  const handleClearHistory = () => {
    setChatHistory([]);
    localStorage.removeItem('chatHistory');
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    onSendMessage(''); // Clear current chat
  };

  // Handle reverting to a previous diagram state
  const handleRevertToDiagramState = (messageContent: string, diagramState: any) => {
    if (onRevertToDiagramState) {
      // Switch to the guardian tab to show the reverted diagram
      setActiveTab('guardian');
      
      // Call the parent handler with message content and diagram state
      onRevertToDiagramState(messageContent, diagramState);
      }
    };

  return (
    <div className={cn("flex flex-col h-full relative overflow-hidden", currentWallpaper.textClass)}>
      {/* Add the background with the selected wallpaper */}
      <div className={cn("absolute inset-0 -z-10", currentWallpaper.bgClass)} />
      
      <ChatTabs 
        activeTab={activeTab} 
        onTabChange={tab => {
          setActiveTab(tab);
          if (tab === 'guardian' && activeSessionId === null && messages.length === 0) {
            startNewChat();
          }
        }} 
      />
      
      {activeTab === 'guardian' ? (
        <>
          <MessageList 
            messages={messages} 
            isLoading={isLoading}
            isThinking={isLoading} 
            thinking={thinking}
            isLoadedProject={isLoadedProject}
          />
          
          {/* Show thinking UI when available */}
          {thinking && thinking.text && (
            <div className="px-4 pb-2">
              <ThinkingDisplay 
                thinking={thinking.text} 
                hasRedactedThinking={thinking.hasRedactedContent} 
              />
            </div>
          )}
          
          {/* Show error messages when available */}
          {error && (
            <div className="mx-4 mb-3 p-3 bg-red-100 text-red-800 rounded-md">
              {error}
            </div>
          )}
          <ChatInput 
            onSendMessage={onSendMessage} 
            onGenerateReport={onGenerateReport}
            onSaveProject={onSaveProject}
            hasMessages={messages.length > 0}
            onWallpaperChange={handleWallpaperChange}
            // isDisabled={isLoading}
            isThinking={isLoading}
            projectId={projectId}
            isLoadedProject={isLoadedProject}
          />
        </>
      ) : (
        <ChatHistory 
          chatHistory={chatHistory}
          onSelectChat={handleSelectChat}
          onClearHistory={handleClearHistory}
          onRevertToDiagramState={handleRevertToDiagramState}
          />
      )}
    </div>
  );
};

export default AIChat;