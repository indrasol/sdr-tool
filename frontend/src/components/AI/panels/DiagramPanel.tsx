import React, { useEffect } from 'react';
import AIFlowDiagram from '../AIFlowDiagram';
import { Node } from '@xyflow/react';
import { CustomNodeData } from '../types/diagramTypes';

type ViewMode = 'AD' | 'DFD'; 

interface DiagramPanelProps {
  defaultSize: number;
  viewMode: ViewMode;
  onSwitchView: (mode: ViewMode) => void;
  nodes: Node<CustomNodeData>[];
  edges: any[];
  setNodes: React.Dispatch<React.SetStateAction<Node<CustomNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<any[]>>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSelect: () => void;
  onComment: () => void;
  onGenerateReport: () => string;
  onSave: () => void;
  onLayout?: () => void; // New prop for layout
  isLayouting?: boolean; // New prop for layout state
}

const DiagramPanel: React.FC<DiagramPanelProps> = ({
  defaultSize,
  viewMode,
  onSwitchView,
  nodes,
  edges,
  setNodes,
  setEdges,
  onZoomIn,
  onZoomOut,
  onFitView,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onSelect,
  onComment,
  onGenerateReport,
  onSave,
  onLayout,
  isLayouting
}) => {
  // Debug output
  useEffect(() => {
  }, [nodes, edges]);
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AIFlowDiagram 
        viewMode={viewMode}
        onSwitchView={onSwitchView}
        nodes={nodes}
        edges={edges}
        setNodes={setNodes}
        setEdges={setEdges}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onFitView={onFitView}
        onCopy={onCopy}
        onPaste={onPaste}
        onUndo={onUndo}
        onRedo={onRedo}
        onComment={onComment}
        onGenerateReport={onGenerateReport}
        onSave={onSave}
        onLayout={onLayout}
        isLayouting={isLayouting}
      />
    </div>
  );
};

export default DiagramPanel;