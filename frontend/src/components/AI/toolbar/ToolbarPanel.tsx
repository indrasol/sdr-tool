import React, { useState } from 'react';
import DiagramToolbar from '../DiagramToolbar';

interface ToolbarPanelProps {
  onAddNode: (nodeType: string, position: { x: number; y: number }, iconRenderer?: any) => void;
  viewMode?: 'AD' | 'DFD';
}

const ToolbarPanel: React.FC<ToolbarPanelProps> = ({ onAddNode, viewMode = 'AD' }) => {
  console.log('ToolbarPanel rendering'); // Debug statement
  const [isExpanded, setIsExpanded] = useState(true);
  
  const handleToggleExpand = (expanded: boolean) => {
    setIsExpanded(expanded);
  };
  
  return (
    <div id="toolbar-panel" className={`h-full ${isExpanded ? 'w-72' : 'w-12'} bg-white border-l border-gray-200 transition-all duration-300 flex flex-col overflow-hidden relative`}>
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