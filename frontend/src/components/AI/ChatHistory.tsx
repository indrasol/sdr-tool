import React, { useState, useEffect, useRef } from 'react';
import { Clock, RefreshCw, PenTool, Bot, RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Message } from './AIChat';
import projectHistoryService, { UserMessage } from '@/services/projectHistoryService';
import { useToast } from '@/hooks/use-toast';

interface ChatHistoryProps {
  chatHistory: Array<{
    id: string;
    date: Date;
    messages: Message[];
  }>;
  onSelectChat: (chatId: string) => void; 
  onClearHistory: () => void;
  onRevertToDiagramState?: (messageContent: string, diagramState: any) => void;
  projectId?: string;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  chatHistory, 
  onSelectChat,
  onClearHistory,
  onRevertToDiagramState,
  projectId
}) => {
  const [recentMessages, setRecentMessages] = useState<UserMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Track when component is visible to refresh data
  const isVisible = useRef(false);
  const lastRefreshTime = useRef<number>(0);

  // Fetch messages from backend API when component mounts or projectId changes
  useEffect(() => {
    if (!projectId) return;
    
    // Set the component as visible
    isVisible.current = true;
    
    // Fetch messages on mount
    fetchMessages();
    
    // When component unmounts, mark as not visible
    return () => {
      isVisible.current = false;
    };
  }, [projectId, toast]);
  
  // Add effect to refresh data periodically when component is visible
  useEffect(() => {
    if (!projectId) return;
    
    // Check if we recently refreshed (within the last 2 seconds)
    const shouldRefresh = Date.now() - lastRefreshTime.current > 2000;
    
    // If we're visible and should refresh, do it
    if (isVisible.current && shouldRefresh) {
      console.log('Refreshing history data because component is visible');
      fetchMessages(true);
      lastRefreshTime.current = Date.now();
    }
    
    // Setup a refresh interval (every 3 seconds)
    const intervalId = setInterval(() => {
      if (isVisible.current && Date.now() - lastRefreshTime.current > 3000) {
        console.log('Refreshing history data on interval');
        fetchMessages(true);
        lastRefreshTime.current = Date.now();
      }
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [projectId]);
  
  // Listen for refresh history events from parent component
  useEffect(() => {
    if (!projectId) return;
    
    // Function to handle refresh requests
    const handleRefreshRequest = (event) => {
      console.log('Received refreshHistoryRequest event');
      // Always use cache busting for event-triggered refreshes
      fetchMessages(true);
    };
    
    // Add event listener
    window.addEventListener('refreshHistoryRequest', handleRefreshRequest);
    
    // Clean up
    return () => {
      window.removeEventListener('refreshHistoryRequest', handleRefreshRequest);
    };
  }, [projectId]);
  
  // Listen for revert completed events
  useEffect(() => {
    if (!projectId) return;
    
    const handleRevertCompleted = (event: CustomEvent) => {
      // Check if this event is for our project
      if (event.detail?.projectId === projectId) {
        console.log(`Received revertCompleted event for project ${projectId}`);
        
        // Force immediate refresh
        fetchMessages(true);
        
        // Update the lastRefreshTime to prevent duplicate refreshes
        lastRefreshTime.current = Date.now();
      }
    };
    
    // Add event listener
    window.addEventListener('revertCompleted', handleRevertCompleted as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('revertCompleted', handleRevertCompleted as EventListener);
    };
  }, [projectId]);
  
  // Function to fetch messages from the API
  const fetchMessages = async (ignoreCache: boolean = false) => {
    if (!projectId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const messages = await projectHistoryService.getProjectHistory(projectId, 10, ignoreCache);
      console.log(`Fetched ${messages.length} messages from history${ignoreCache ? ' (cache bypassed)' : ''}`);
      setRecentMessages(messages);
    } catch (err) {
      console.error('Error fetching message history:', err);
      setError('Failed to load message history');
      toast({
        title: 'Error',
        description: 'Failed to load message history',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle click on revert button
  const handleRevertClick = async (messageId: number, content: string) => {
    if (!projectId || !messageId) return;
    
    setIsLoading(true);
    try {
      const response = await projectHistoryService.revertToMessage(projectId, messageId);
      
      // Call the parent handler with message content and diagram state
      if (response && response.diagram_state && onRevertToDiagramState) {
        onRevertToDiagramState(content, response.diagram_state);
        
        toast({
          title: "Diagram Reverted",
          description: "Successfully reverted to previous diagram state",
          variant: "default",
        });
        
        // Schedule multiple refreshes to ensure history is updated
        // First refresh after a short delay
        setTimeout(() => {
          if (projectId) {
            console.log('First refresh after revert');
            fetchMessages(true); // true = ignore cache
            
            // Second refresh after the system has had more time to process
            setTimeout(() => {
              console.log('Second refresh after revert');
              fetchMessages(true);
              
              // Final refresh after user might have added new messages
              setTimeout(() => {
                console.log('Final refresh after revert');
                fetchMessages(true);
              }, 2000);
            }, 1500);
          }
        }, 800);
      }
    } catch (err: any) {
      console.error('Error reverting to diagram state:', err);
      toast({
        title: "Revert Failed",
        description: err.message || "Could not revert diagram state",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle clearing history with confirmation
  const handleClearHistory = () => {
    // Currently just for UI purposes - we don't actually delete from backend
    // separate feature to be implemented requiring permission management
    
    toast({
      title: "History Viewed",
      description: "History is view-only. New messages within the past 10 days will appear here automatically.",
      variant: "default",
    });
    
    // Original local storage clear - keeping for compatibility 
    // with existing local chat history feature
    localStorage.removeItem('chatHistory');
  };

  // Show loading state
  if (isLoading && recentMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Loader2 className="h-12 w-12 text-gray-300 mb-3 animate-spin" />
        <h3 className="text-lg font-medium text-gray-700">Loading history...</h3>
      </div>
    );
  }

  // Show error state
  if (error && recentMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-700">Failed to load history</h3>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
      </div>
    );
  }

  // Check if we should use backend history or local history
  const shouldShowBackendHistory = Boolean(projectId);
  
  // If we have a projectId but no backend messages, show empty state for project
  if (shouldShowBackendHistory && recentMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Clock className="h-12 w-12 text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-700">No recent messages</h3>
        <p className="text-sm text-gray-500 mt-2">
          Your recent conversations with Guardian AI will appear here
        </p>
      </div>
    );
  }
  
  // If we should use local history but have no messages
  if (!shouldShowBackendHistory && chatHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Clock className="h-12 w-12 text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-700">No chat history yet</h3>
        <p className="text-sm text-gray-500 mt-2">
          Your conversations with Guardian AI will appear here
        </p>
      </div>
    );
  }

  // Rendering for backend history
  if (shouldShowBackendHistory) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="text-sm font-medium text-gray-700">Recent Messages</h3>
          <span className="text-xs text-gray-500 italic">Last 10 days</span>
        </div>
        <div className="flex-grow overflow-y-auto">
          {recentMessages.map((message, index) => (
            <motion.div
              key={`message-${message.id || index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ backgroundColor: 'rgba(124, 101, 246, 0.05)' }}
              className="p-3 border-b"
            >
              <div className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-securetrack-purple/10 flex items-center justify-center mr-3">
                  {message.changed ? (
                    <PenTool size={16} className="text-securetrack-purple" />
                  ) : (
                    <Bot size={16} className="text-securetrack-purple" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {message.content.length > 50 
                        ? message.content.substring(0, 50) + "..." 
                        : message.content}
                    </p>
                  </div>
                  <div className="flex items-center mt-1">
                    <Clock size={12} className="text-gray-400 mr-1" />
                    <p className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleDateString()} at {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                {message.changed && message.has_diagram_state && message.id && (
                  <button
                    onClick={() => handleRevertClick(message.id, message.content)}
                    className="p-1 rounded-full hover:bg-securetrack-purple/10 transition-colors"
                    title="Revert to this diagram state"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="text-securetrack-purple animate-spin" />
                    ) : (
                      <RotateCcw size={16} className="text-securetrack-purple" />
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Render local history if we get here
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-medium text-gray-700">Recent Messages</h3>
        <button 
          onClick={onClearHistory}
          className="text-xs text-gray-500 hover:text-securetrack-purple flex items-center gap-1"
        >
          <RefreshCw size={12} />
          Clear History
        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
        {chatHistory.flatMap(chat => 
          chat.messages
            .filter(msg => msg.role === 'user')
            .map((msg, idx) => {
              // Find the assistant response that might contain diagram changes
              const assistantResponse = chat.messages.find((m, i) => 
                i > idx && m.role === 'assistant'
              );

              // A message has diagram modifications if:
              // 1. It has a diagramState property OR
              // 2. The following assistant message contains diagram-related keywords
              const hasDiagramModification = 
                // Check if the message has a diagram state
                !!msg.diagramState || 
                // Check if assistant response mentions diagram changes
                (assistantResponse && /diagram|node|component|add|update|remove|change/.test(assistantResponse.content.toLowerCase()));
              
              return (
                <motion.div
                  key={`${chat.id}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ backgroundColor: 'rgba(124, 101, 246, 0.05)' }}
                  className="p-3 border-b"
                >
                  <div className="flex items-start">
                    <div className="h-8 w-8 rounded-full bg-securetrack-purple/10 flex items-center justify-center mr-3">
                      {hasDiagramModification ? (
                        <PenTool size={16} className="text-securetrack-purple" />
                      ) : (
                        <Bot size={16} className="text-securetrack-purple" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {msg.content.length > 50 
                            ? msg.content.substring(0, 50) + "..." 
                            : msg.content}
                        </p>
                      </div>
                      <div className="flex items-center mt-1">
                        <Clock size={12} className="text-gray-400 mr-1" />
                        <p className="text-xs text-gray-500">
                          {new Date(msg.timestamp || chat.date).toLocaleDateString()} at {new Date(msg.timestamp || chat.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                    {hasDiagramModification && msg.diagramState && (
                      <button
                        onClick={() => onRevertToDiagramState && onRevertToDiagramState(msg.content, msg.diagramState)}
                        className="p-1 rounded-full hover:bg-securetrack-purple/10 transition-colors"
                        title="Revert to this diagram state"
                      >
                        <RotateCcw size={16} className="text-securetrack-purple" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
        )}
      </div>
    </div>
  );
};

export default ChatHistory;