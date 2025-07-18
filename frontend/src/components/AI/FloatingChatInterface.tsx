import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  X, 
  Minimize2, 
  Maximize2, 
  GripVertical,
  Bot,
  History,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AIChat, { Message } from './AIChat';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingChatInterfaceProps {
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
  diagramState?: {
    nodes: any[];
    edges: any[];
  };
  onRevertToDiagramState?: (messageContent: string, diagramState: any) => void;
  suggestion?: string;
  showSuggestion?: boolean;
  onCloseSuggestion?: () => void;
}

const FloatingChatInterface: React.FC<FloatingChatInterfaceProps> = ({
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
  onCloseSuggestion = () => {}
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('floatingChat_collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('floatingChat_minimized');
    return saved ? JSON.parse(saved) : false;
  });
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('floatingChat_position');
    if (saved) return JSON.parse(saved);
    
    // Position it optimally from toolbar area
    const toolbarHeight = 120; // Account for header + toolbar
    const rightPadding = 20;
    const defaultX = window.innerWidth - 600 - rightPadding; // Position from right edge
    const defaultY = toolbarHeight;
    
    return { 
      x: Math.max(20, defaultX), 
      y: defaultY 
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState(() => {
    const saved = localStorage.getItem('floatingChat_size');
    // Calculate optimal default size - increase height significantly
    const toolbarHeight = 120; // Account for header + toolbar
    const bottomPadding = 20; // Reduced padding for more height
    const defaultHeight = window.innerHeight - toolbarHeight - bottomPadding;
    const defaultWidth = Math.min(600, window.innerWidth * 0.4); // 40% of screen width, max 600px
    
    return saved ? JSON.parse(saved) : { 
      width: Math.max(defaultWidth, 500), // Minimum 500px width
      height: Math.max(defaultHeight, 700) // Increased minimum height to 700px
    };
  });

  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });

  // Minimum and maximum constraints
  const minWidth = 400;
  const minHeight = 350;
  const maxWidth = window.innerWidth * 0.8;
  const maxHeight = window.innerHeight - 100;
  const chatRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!chatRef.current) return;
    
    const rect = chatRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Constrain to viewport with some padding
      const padding = 10;
      const maxX = window.innerWidth - size.width - padding;
      const maxY = window.innerHeight - size.height - padding;
      
      setPosition({
        x: Math.max(padding, Math.min(newX, maxX)),
        y: Math.max(padding, Math.min(newY, maxY))
      });
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  // Handle resize functionality
  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
    resizeStartSize.current = { width: size.width, height: size.height };
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!isResizing || !resizeHandle) return;

    requestAnimationFrame(() => {
      const deltaX = e.clientX - resizeStartPos.current.x;
      const deltaY = e.clientY - resizeStartPos.current.y;
      
      let newWidth = resizeStartSize.current.width;
      let newHeight = resizeStartSize.current.height;
      let newX = position.x;
      let newY = position.y;

      // Handle different resize directions
      switch (resizeHandle) {
        case 'se': // Bottom-right
          newWidth = resizeStartSize.current.width + deltaX;
          newHeight = resizeStartSize.current.height + deltaY;
          break;
        case 'sw': // Bottom-left
          newWidth = resizeStartSize.current.width - deltaX;
          newHeight = resizeStartSize.current.height + deltaY;
          newX = position.x + deltaX;
          break;
        case 'ne': // Top-right
          newWidth = resizeStartSize.current.width + deltaX;
          newHeight = resizeStartSize.current.height - deltaY;
          newY = position.y + deltaY;
          break;
        case 'nw': // Top-left
          newWidth = resizeStartSize.current.width - deltaX;
          newHeight = resizeStartSize.current.height - deltaY;
          newX = position.x + deltaX;
          newY = position.y + deltaY;
          break;
        case 'n': // Top
          newHeight = resizeStartSize.current.height - deltaY;
          newY = position.y + deltaY;
          break;
        case 's': // Bottom
          newHeight = resizeStartSize.current.height + deltaY;
          break;
        case 'e': // Right
          newWidth = resizeStartSize.current.width + deltaX;
          break;
        case 'w': // Left
          newWidth = resizeStartSize.current.width - deltaX;
          newX = position.x + deltaX;
          break;
      }

      // Apply constraints
      newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

      // Update size and position
      setSize({ width: newWidth, height: newHeight });
      
      // Only update position if it changed
      if (newX !== position.x || newY !== position.y) {
        const padding = 10;
        const constrainedX = Math.max(padding, Math.min(newX, window.innerWidth - newWidth - padding));
        const constrainedY = Math.max(padding, Math.min(newY, window.innerHeight - newHeight - padding));
        setPosition({ x: constrainedX, y: constrainedY });
      }
    });
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
      }
      if (isResizing) {
        document.addEventListener('mousemove', handleResizeMouseMove);
      }
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isResizing ? (
        resizeHandle?.includes('e') || resizeHandle?.includes('w') ? 'ew-resize' :
        resizeHandle?.includes('n') || resizeHandle?.includes('s') ? 'ns-resize' :
        resizeHandle === 'nw' || resizeHandle === 'se' ? 'nwse-resize' :
        resizeHandle === 'ne' || resizeHandle === 'sw' ? 'nesw-resize' : 'default'
      ) : isDragging ? 'grabbing' : 'default';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = 'default';
    };
  }, [isDragging, isResizing, dragOffset, size, resizeHandle]);

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem('floatingChat_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem('floatingChat_minimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

  useEffect(() => {
    localStorage.setItem('floatingChat_position', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    localStorage.setItem('floatingChat_size', JSON.stringify(size));
  }, [size]);

  // Handle window resize to keep chat within bounds and update constraints
  useEffect(() => {
    const handleResize = () => {
      const padding = 10;
      const newMaxWidth = window.innerWidth * 0.8;
      const newMaxHeight = window.innerHeight - 100;
      
      // Update size constraints if current size exceeds new limits
      setSize(prevSize => ({
        width: Math.min(prevSize.width, newMaxWidth),
        height: Math.min(prevSize.height, newMaxHeight)
      }));
      
      // Keep position within bounds
      setPosition(prev => ({
        x: Math.max(padding, Math.min(prev.x, window.innerWidth - size.width - padding)),
        y: Math.max(padding, Math.min(prev.y, window.innerHeight - size.height - padding))
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size]);

  // Count unread messages (simplified)
  const unreadCount = messages.filter(m => m.role === 'assistant').length;

  return (
    <>
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "fixed z-50 bg-gradient-to-br from-white/95 to-blue-50/95 backdrop-blur-lg",
              "border border-white/20 shadow-2xl rounded-2xl overflow-hidden",
              "transition-all duration-200 ease-out flex flex-col", // Added flex flex-col for proper layout
              isDragging 
                ? "shadow-3xl scale-[1.02] ring-2 ring-blue-200/50" 
                : isResizing
                ? "shadow-3xl ring-2 ring-purple-200/50 ring-offset-2"
                : "shadow-2xl hover:shadow-3xl"
            )}
            style={{
              left: position.x,
              top: position.y,
              width: isCollapsed ? 360 : size.width,
              height: isCollapsed ? 80 : size.height,
            }}
          >
            {/* Header - Fixed at top */}
            <div 
              className={cn(
                "flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10",
                "border-b border-white/20 select-none transition-all duration-150",
                "flex-shrink-0 relative z-10", // Added z-10 to keep header above content but not above tabs
                isDragging 
                  ? "cursor-grabbing bg-gradient-to-r from-blue-500/20 to-purple-500/20" 
                  : "cursor-grab hover:bg-gradient-to-r hover:from-blue-500/15 hover:to-purple-500/15"
              )}
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-800">Guardian AI</h3>
                  <span className="text-xs text-gray-500">
                    {thinking ? 'Thinking...' : isLoading ? 'Processing...' : 'Ready to help'}
                  </span>
                </div>
                {unreadCount > 0 && !isCollapsed && (
                  <Badge variant="secondary" className="bg-blue-500 text-white text-xs px-2 py-1">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-white/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCollapsed(!isCollapsed);
                  }}
                >
                  {isCollapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-white/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(true);
                  }}
                >
                  <X size={14} />
                </Button>
              </div>
            </div>

            {/* Chat Content - Takes remaining space and handles its own layout */}
            {!isCollapsed && (
              <div className="flex-1 min-h-0 overflow-hidden relative z-0">
                <AIChat
                  messages={messages}
                  onSendMessage={onSendMessage}
                  onGenerateReport={onGenerateReport}
                  onSaveProject={onSaveProject}
                  isLoading={isLoading}
                  thinking={thinking}
                  error={error}
                  projectId={projectId}
                  isLoadedProject={isLoadedProject}
                  diagramState={diagramState}
                  onRevertToDiagramState={onRevertToDiagramState}
                  suggestion={suggestion}
                  showSuggestion={showSuggestion}
                  onCloseSuggestion={onCloseSuggestion}
                />
              </div>
            )}

            {/* Resize Handles - Only horizontal (left and right) */}
            {!isCollapsed && (
              <>
                {/* Left edge handle */}
                <div
                  className="absolute left-0 top-4 bottom-4 w-3 cursor-w-resize opacity-0 hover:opacity-60 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-lg transition-opacity"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
                />
                
                {/* Right edge handle */}
                <div
                  className="absolute right-0 top-4 bottom-4 w-3 cursor-e-resize opacity-0 hover:opacity-60 bg-gradient-to-b from-blue-400 to-purple-500 rounded-l-lg transition-opacity"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
                />
              </>
            )}

            {/* Size indicator during resize */}
            {isResizing && (
              <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-md text-xs font-mono shadow-lg">
                {size.width} × {size.height}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button (when minimized) */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsMinimized(false)}
              className={cn(
                "w-16 h-16 rounded-full shadow-2xl",
                "bg-gradient-to-r from-blue-500 to-purple-600",
                "hover:from-blue-600 hover:to-purple-700",
                "transition-all duration-300 transform hover:scale-110",
                "border-4 border-white/20"
              )}
            >
              <div className="relative">
                <MessageSquare className="h-6 w-6 text-white" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatInterface; 