import React, { useState, useRef, useEffect } from 'react';
import DiagramToolbar from '../DiagramToolbar';
import styles from './ToolbarPanel.module.css';

interface ToolbarPanelProps {
  onAddNode: (nodeType: string, position: { x: number; y: number }, iconRenderer?: any) => void;
  viewMode?: 'AD' | 'DFD';
}

const ToolbarPanel: React.FC<ToolbarPanelProps> = ({ onAddNode, viewMode = 'AD' }) => {
  console.log('ToolbarPanel rendering'); // Debug statement
  const [isExpanded, setIsExpanded] = useState(true);
  const [panelWidth, setPanelWidth] = useState(288); // Default width (72 * 4 = 288px)
  const [isResizing, setIsResizing] = useState(false);
  const minWidth = 240; // Minimum panel width in px
  const maxWidth = 384; // Maximum panel width in px (72 * 5.33 = 384px)
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  
  const handleToggleExpand = (expanded: boolean) => {
    setIsExpanded(expanded);
  };
  
  const startResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'ew-resize'; // Set cursor for the entire page during resize
  };
  
  // Handle mouse movement during resize
  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate new width based on mouse position
      const rootElement = document.documentElement;
      const viewportWidth = rootElement.clientWidth;
      
      // Since the panel is on the right side, calculate from right edge
      const newWidth = viewportWidth - e.clientX;
      
      // Constrain to min/max range
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      setPanelWidth(constrainedWidth);
    };
    
    const stopResize = () => {
      setIsResizing(false);
      document.body.style.cursor = ''; // Reset cursor back to default
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
      document.body.style.cursor = ''; // Ensure cursor is reset when effect is cleaned up
    };
  }, [isResizing]);
  
  const dynamicWidth = isExpanded ? `${panelWidth}px` : 'w-12';
  
  return (
    <div 
      className={`${styles.resizablePanel} ${isResizing ? styles.resizing : ''} ${!isExpanded ? styles.collapsedPanel : ''}`}
      style={{ width: isExpanded ? panelWidth : 48 }}
    >
      {/* Resize handle */}
      <div 
        ref={resizeHandleRef}
        className={styles.resizeHandle}
        onMouseDown={startResize}
        title="Drag to resize panel"
      >
        <div className={styles.resizeHandleVisual} />
      </div>
      
      <DiagramToolbar 
        onAddNode={onAddNode}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
        viewMode={viewMode}
      />
    </div>
  );
};

export default ToolbarPanel;