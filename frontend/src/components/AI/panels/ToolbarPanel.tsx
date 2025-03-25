
import React, { useState } from 'react';
import DiagramToolbar from '../DiagramToolbar';

interface ToolbarPanelProps {
  onAddNode: (nodeType: string, position: { x: number; y: number }, iconRenderer?: any) => void;
}

const ToolbarPanel: React.FC<ToolbarPanelProps> = ({ onAddNode }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const handleToggleExpand = (expanded: boolean) => {
    setIsExpanded(expanded);
  };
  
  return (
    <div className={`h-full ${isExpanded ? 'w-72' : 'w-12'} bg-white border-l border-gray-200 transition-all duration-300 flex flex-col overflow-hidden relative`}>
      <DiagramToolbar 
        onAddNode={onAddNode}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
      />
    </div>
  );
};

export default ToolbarPanel;