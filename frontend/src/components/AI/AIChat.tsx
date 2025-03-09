
import React, { useState, useEffect } from 'react';
import ChatTabs from './ChatTabs';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ChatHistory from './ChatHistory';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { WallpaperOption } from './types/chatTypes';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onGenerateReport: () => void;
}

interface ChatSession {
  id: string;
  date: Date;
  messages: Message[];
}

const AIChat: React.FC<AIChatProps> = ({ messages, onSendMessage, onGenerateReport }) => {
  const [activeTab, setActiveTab] = useState<'guardian' | 'history'>('guardian');
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentWallpaper, setCurrentWallpaper] = useState<WallpaperOption>({
    id: 'default',
    name: 'Default',
    bgClass: 'bg-gradient-to-b from-[#f8f9fb] to-[#f1f3f9]',
    textClass: 'text-gray-900'
  });

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
          messages: [...messages]
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
              ? { ...session, messages: [...messages] } 
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
          <MessageList messages={messages} />
          <ChatInput 
            onSendMessage={onSendMessage} 
            onGenerateReport={onGenerateReport}
            hasMessages={messages.length > 0}
            onWallpaperChange={handleWallpaperChange}
          />
        </>
      ) : (
        <ChatHistory 
          chatHistory={chatHistory}
          onSelectChat={handleSelectChat}
          onClearHistory={handleClearHistory}
        />
      )}
    </div>
  );
};

export default AIChat;