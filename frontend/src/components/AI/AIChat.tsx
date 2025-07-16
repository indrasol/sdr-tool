import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatTabs from './ChatTabs';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ChatHistory from './ChatHistory';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { WallpaperOption } from './types/chatTypes';
import ThinkingDisplay from './ThinkingDisplay'
import { X } from 'lucide-react';
import SpeechOverlay from './SpeechOverlay';
import { useTheme } from '@/contexts/ThemeContext';

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
  // Add props for suggestion display
  suggestion?: string;
  showSuggestion?: boolean;
  onCloseSuggestion?: () => void;
  /** Hide input area when shown in embedded read-only panel */
  showInput?: boolean;
}

interface ChatSession {
  id: string;
  date: Date;
  messages: Message[];
}

const CHAT_KEY = 'chatHistory';
// Roughly 4 MB – browsers usually allow a bit more, but this is safe across vendors.
const MAX_BYTES = 4 * 1024 * 1024;

const stripHeavyFields = (history: ChatSession[]): ChatSession[] => {
  // Remove diagramState (and any other heavy fields) before persisting to LS
  return history.map(s => ({
    ...s,
    messages: s.messages.map(m => {
      const { diagramState, ...rest } = m as any;
      return rest;
    })
  }));
};

const safePersistHistory = (history: ChatSession[]) => {
  try {
    const lightHistory = stripHeavyFields(history);
    const json = JSON.stringify(lightHistory);
    if (json.length > MAX_BYTES) {
      // Retain most recent sessions until under limit
      let trimmed = [...lightHistory];
      while (json.length > MAX_BYTES && trimmed.length > 1) {
        trimmed.pop();
      }
      localStorage.setItem(CHAT_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(CHAT_KEY, json);
    }
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError') {
      console.warn('chatHistory quota exceeded – clearing stored history');
      try { localStorage.removeItem(CHAT_KEY); } catch (_) {}
    } else {
      console.error('Failed to persist chatHistory', e);
    }
  }
};

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
  onRevertToDiagramState,
  suggestion = '',
  showSuggestion = false,
  onCloseSuggestion = () => {},
  showInput = true,
}) => {
  const { theme } = useTheme();
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
  
  // Track if revert was recently used to handle special logic
  const [revertJustUsed, setRevertJustUsed] = useState(false);
  
  // Track processed messages to prevent retyping
  const processedMessageIds = useRef(new Set());
  
  // State for determining if we should use local history or backend history
  const useBackendHistory = Boolean(projectId && isLoadedProject);
  
  // Track last message count to detect new messages
  const lastMessageCount = useRef(0);

  // Add new state for handling the suggestion UI
  const [internalShowSuggestion, setInternalShowSuggestion] = useState(showSuggestion);
  const [internalSuggestion, setInternalSuggestion] = useState(suggestion);

  // Add state for speech recognition overlay
  const [showSpeechOverlay, setShowSpeechOverlay] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');

  // Update internal state when props change
  useEffect(() => {
    setInternalShowSuggestion(showSuggestion);
    setInternalSuggestion(suggestion);
  }, [showSuggestion, suggestion]);

  // Function to handle using a suggestion
  const handleUseSuggestion = () => {
    if (internalSuggestion) {
      onSendMessage(internalSuggestion);
      setInternalShowSuggestion(false);
    }
  };

  // Function to close the suggestion card
  const handleCloseSuggestion = () => {
    setInternalShowSuggestion(false);
    onCloseSuggestion();
  };

  // Function to refresh history if we're using backend history
  const refreshHistory = async () => {
    if (useBackendHistory && projectId) {
      // We'll implement this in the ChatHistory component
      // Just updating flags here
      setRevertJustUsed(false);
      
      // Mark all messages as processed to prevent re-typing
      messages.forEach(msg => {
        if (msg.id !== undefined) {
          processedMessageIds.current.add(msg.id);
        }
      });
      
      // Trigger a DOM event to notify ChatHistory component to refresh
      const event = new CustomEvent('refreshHistoryRequest', { detail: { timestamp: Date.now() } });
      window.dispatchEvent(event);
      console.log('Dispatched refreshHistoryRequest event');
    }
  };

  // Trigger a history refresh when new messages are added
  useEffect(() => {
    if (useBackendHistory && messages.length > lastMessageCount.current) {
      console.log(`Message count increased from ${lastMessageCount.current} to ${messages.length}, refreshing history`);
      
      // Update the reference for next comparison
      lastMessageCount.current = messages.length;
      
      // Schedule a refresh after a short delay to allow backend to process
      setTimeout(() => {
        refreshHistory();
      }, 500);
    } else {
      // Always keep lastMessageCount in sync with actual messages length
      lastMessageCount.current = messages.length;
    }
  }, [messages.length, useBackendHistory, projectId]);

  // Listen for history update events
  useEffect(() => {
    if (!useBackendHistory || !projectId) return;
    
    const handleHistoryUpdate = (event: CustomEvent) => {
      // Check if this update is for our project
      if (event.detail?.projectId === projectId) {
        console.log(`Received historyUpdated event with ${event.detail.count} messages`);
        
        // Ensure all message IDs are marked as processed
        messages.forEach(msg => {
          if (msg.id !== undefined) {
            processedMessageIds.current.add(msg.id);
          }
        });
      }
    };
    
    // Add event listener
    window.addEventListener('historyUpdated', handleHistoryUpdate as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('historyUpdated', handleHistoryUpdate as EventListener);
    };
  }, [useBackendHistory, projectId, messages]);

  // When project is first loaded, make sure we're on the guardian tab
  useEffect(() => {
    if (isLoadedProject && projectId && messages.length > 0) {
      setActiveTab('guardian');
      console.log(`Showing ${messages.length} messages in the Guardian tab for project ${projectId}`);
      
      // Sort messages by ID or timestamp if available to ensure proper order
      const sortedMessages = [...messages].sort((a, b) => {
        // If both messages have IDs, sort by ID
        if (a.id !== undefined && b.id !== undefined) {
          return a.id - b.id;
        }
        // If both messages have timestamps, sort by timestamp
        else if (a.timestamp && b.timestamp) {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
        // Default to current order
        return 0;
      });
      
      // Track which message IDs we've processed to prevent retyping
      sortedMessages.forEach(msg => {
        if (msg.id !== undefined) {
          processedMessageIds.current.add(msg.id);
        }
      });
      
      // Log messages for debugging
      sortedMessages.forEach((msg, idx) => {
        const preview = msg.content && typeof msg.content === 'string' 
          ? msg.content.substring(0, 30) + (msg.content.length > 30 ? '...' : '') 
          : 'No content';
        console.log(`Message #${idx + 1}: ${msg.role} (ID: ${msg.id || 'none'}) - ${preview}`);
      });
    }
  }, [isLoadedProject, projectId, messages]);

  // Enhanced messages to store diagram state
  // We'll do this whenever diagramState changes
  useEffect(() => {
    // Only use local storage if we're not using backend history
    if (!useBackendHistory && diagramState) {
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
        safePersistHistory(updatedChatHistory);
        
        // Update prev state for future comparisons
        setPrevDiagramState(currentDiagramState);
      }
    }
  }, [diagramState, messages, activeSessionId, chatHistory, prevDiagramState, useBackendHistory]);

  // Load chat history from localStorage on component mount (only if not using backend history)
  useEffect(() => {
    if (!useBackendHistory) {
      const storedHistory = localStorage.getItem(CHAT_KEY);
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
  }, [useBackendHistory]);

  // Save current session to history when messages change
  useEffect(() => {
    // Only save to local storage if we're not using backend history
    if (!useBackendHistory && messages.length > 0 && activeTab === 'guardian') {
      // If no active session yet, create one
      if (!activeSessionId) {
        const newSessionId = uuidv4();
        setActiveSessionId(newSessionId);
        const newSession = {
          id: newSessionId,
          date: new Date(),
          messages: messages.map(msg => ({
            ...msg,
            // Only add timestamp if it doesn't exist
            timestamp: msg.timestamp || new Date().toISOString()
          }))
        };
        
        setChatHistory(prev => {
          const updated = [newSession, ...prev];
          safePersistHistory(updated);
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
                    // Only add timestamp if it doesn't exist
                    timestamp: msg.timestamp || new Date().toISOString()
                  }))
                } 
              : session
          );
          
          safePersistHistory(updatedHistory);
          return updatedHistory;
        });
      }
    }
    
    // Update backend history in memory to show in History tab
    if (useBackendHistory && messages.length > 0) {
      // Check if these are the same messages we already know about or new ones
      // If revert was just used, we need to do special handling
      if (revertJustUsed) {
        console.log('Revert used - updating history tab to match new state');
        // Reset the flag as we've handled it
        setRevertJustUsed(false);
      }
      
      // Always force a history refresh after messages change in active session
      // This is critical to ensure new messages show in history tab
      const timeSinceLastRefresh = Date.now() - lastMessageCount.current;
      if (timeSinceLastRefresh > 500) { // Avoid too frequent refreshes
        refreshHistory();
      }
    }
    
  }, [messages, activeSessionId, activeTab, useBackendHistory, revertJustUsed]);

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
    if (!useBackendHistory) {
      setChatHistory([]);
      localStorage.removeItem(CHAT_KEY);
    }
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
      
      // Mark that revert was just used so we can handle special logic
      setRevertJustUsed(true);
      
      // Call the parent handler with message content and diagram state
      onRevertToDiagramState(messageContent, diagramState);
      
      // Ensure all message IDs in the system are marked as processed to prevent re-typing
      messages.forEach(msg => {
        if (msg.id !== undefined) {
          processedMessageIds.current.add(msg.id);
        }
      });
      
      // If using backend history, we need special handling
      if (useBackendHistory) {
        // Allow time for the revert to complete and messages to update
        setTimeout(() => {
          // Process any new messages that are added as a result of the revert
          messages.forEach(msg => {
            if (msg.id !== undefined) {
              processedMessageIds.current.add(msg.id);
            }
          });
          
          console.log(`After revert: ${processedMessageIds.current.size} message IDs tracked`);
          
          // Force a history refresh after revert
          refreshHistory();
          
          // Reset the revert flag after a delay
          setTimeout(() => {
            setRevertJustUsed(false);
            
            // Force another refresh to ensure history is up to date
            refreshHistory();
          }, 1000);
        }, 1000);
      }
    }
  };
  
  // Handle tab switching with special handling after revert
  const handleTabChange = (tab: 'guardian' | 'history') => {
    // If switching to history tab right after a revert, we need to ensure
    // we have the latest messages in chatHistory
    if (tab === 'history' && useBackendHistory) {
      // Reset the revert flag as we're handling it now
      if (revertJustUsed) {
        setRevertJustUsed(false);
      }
      
      // Log what we're doing
      console.log(`Switching to history tab, refreshing history data...`);
    }
    
    // Set the active tab
    setActiveTab(tab);
    
    // If switching to guardian and there are no messages and no active session
    if (tab === 'guardian' && activeSessionId === null && messages.length === 0) {
      startNewChat();
    }
    
    // When switching back to guardian tab, ensure that all messages are marked as processed
    // to prevent re-typing
    if (tab === 'guardian' && messages.length > 0) {
      // Mark all messages as processed
      messages.forEach(msg => {
        if (msg.id !== undefined) {
          processedMessageIds.current.add(msg.id);
        }
      });
      
      // Force scroll to bottom after a short delay
      setTimeout(() => {
        const messagesContainer = document.querySelector('.messages-container');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
          // If container not found, try to find any overflow container in the chat area
          const chatArea = document.querySelector('.overflow-y-auto');
          if (chatArea) {
            chatArea.scrollTop = chatArea.scrollHeight;
          }
        }
      }, 100);
    }
  };

  // Handle microphone click from ChatInput
  const handleMicrophoneClick = () => {
    if (!isLoading) {
      setShowSpeechOverlay(true);
    }
  };

  // Handle speech recognition transcript
  const handleTranscriptComplete = (transcript: string) => {
    if (transcript) {
      setSpeechTranscript(transcript);
      onSendMessage(transcript);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full relative overflow-hidden", 
      currentWallpaper.textClass,
      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
    )}>
      {/* Add the background with the selected wallpaper and theme-aware styling */}
      <div className={cn(
        "absolute inset-0 -z-10", 
        currentWallpaper.bgClass,
        theme === 'dark' 
          ? 'bg-gradient-to-b from-gray-900 to-gray-800' 
          : currentWallpaper.bgClass
      )} />
      
      {/* ChatTabs - Positioned above content with proper z-index */}
      <div className="relative z-20 flex-shrink-0">
        <ChatTabs 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
      </div>
      
      {/* Speech Recognition Overlay - Positioned relative to this component */}
      {activeTab === 'guardian' && (
        <SpeechOverlay
          isOpen={showSpeechOverlay}
          onClose={() => setShowSpeechOverlay(false)}
          onTranscriptComplete={handleTranscriptComplete}
        />
      )}
      
      {/* Content Area - Below tabs with proper z-index */}
      <div className="flex-1 min-h-0 relative z-10">
        {activeTab === 'guardian' ? (
          <div className="flex flex-col h-full">
            <MessageList 
              messages={messages}
              thinking={thinking}
              error={error}
              onRevertToDiagramState={handleRevertToDiagramState}
            />
            
            {showInput && (
              <div className={cn(
                "border-t flex-shrink-0",
                theme === 'dark' 
                  ? "border-gray-700" 
                  : "border-gray-200"
              )}>
                <ChatInput 
                  onSendMessage={onSendMessage} 
                  onGenerateReport={onGenerateReport}
                  onSaveProject={onSaveProject}
                  hasMessages={messages.length > 0}
                  isThinking={Boolean(thinking?.text) || isLoading}
                  projectId={projectId}
                  isLoadedProject={isLoadedProject}
                  onMicrophoneClick={handleMicrophoneClick}
                />
              </div>
            )}
            
            {/* Display suggestion card inside chat interface */}
            {internalShowSuggestion && internalSuggestion && (
              <div className="mx-4 mb-3 relative z-30">
                <div className={cn(
                  "backdrop-blur-sm rounded-lg shadow-lg p-4 border relative transition-all duration-300 ease-in-out",
                  theme === 'dark'
                    ? "bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-purple-900/80 border-indigo-700/50 hover:shadow-indigo-900/30"
                    : "bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 border-indigo-100/50 hover:shadow-indigo-100/30"
                )}>
                  <button 
                    onClick={handleCloseSuggestion}
                    className={cn(
                      "absolute top-3 right-3 transition-colors duration-200",
                      theme === 'dark'
                        ? "text-indigo-400 hover:text-indigo-300"
                        : "text-indigo-400 hover:text-indigo-600"
                    )}
                    aria-label="Close suggestion"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "w-1 h-16 rounded-full opacity-70",
                      theme === 'dark'
                        ? "bg-gradient-to-b from-indigo-400 to-purple-400"
                        : "bg-gradient-to-b from-indigo-400 to-purple-400"
                    )}></div>
                    <div className="flex-1">
                      <h3 className={cn(
                        "text-sm font-semibold mb-1.5 flex items-center",
                        theme === 'dark' ? "text-indigo-300" : "text-indigo-700"
                      )}>
                        <span className={cn(
                          "inline-block w-2 h-2 rounded-full animate-pulse mr-2",
                          theme === 'dark' ? "bg-indigo-400" : "bg-indigo-400"
                        )}></span>
                        Perhaps you meant:
                      </h3>
                      <button
                        onClick={handleUseSuggestion}
                        className={cn(
                          "hover:underline text-left w-full text-sm pl-1 transition-all duration-200",
                          theme === 'dark'
                            ? "text-indigo-300 hover:text-indigo-200"
                            : "text-indigo-600 hover:text-indigo-800"
                        )}
                      >
                        {internalSuggestion}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <ChatHistory 
            chatHistory={chatHistory}
            onSelectChat={handleSelectChat}
            onClearHistory={handleClearHistory}
            onRevertToDiagramState={handleRevertToDiagramState}
            projectId={projectId}
          />
        )}
      </div>
    </div>
  );
};

export default AIChat;