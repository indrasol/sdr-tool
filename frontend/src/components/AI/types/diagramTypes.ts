
import { Node, Edge, NodeProps as ReactFlowNodeProps } from '@xyflow/react';

// Define the data structure for node data
export interface CustomNodeData {
  label: string;
  description?: string;
  nodeType?: string;
  iconRenderer?: () => { component: React.ElementType; props: any; bgColor: string };
  onEdit?: (id: string, label: string) => void;
  onDelete?: (id: string) => void;
  isComment?: boolean;
  [key: string]: unknown; // Add index signature to satisfy Record<string, unknown>
}

// Create a proper NodeProps type that extends ReactFlow's NodeProps
export type NodeProps = Omit<ReactFlowNodeProps, 'data'> & {
  data?: CustomNodeData;
  style?: React.CSSProperties; // Added the style property
};

export interface NodeEditData {
  id: string;
  label: string;
  description?: string;
}

type ViewMode = 'AD' | 'DFD';

export interface AIFlowDiagramProps {
  nodes: Node<CustomNodeData>[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node<CustomNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  viewMode: ViewMode; // Receive view mode
  onSwitchView: (mode: ViewMode) => void; 
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onComment?: () => void;
  onGenerateReport?: () => string;
  onSave?: () => void;
  onLayout?: () => void; // New prop for layout functionality
  isLayouting?: boolean; // New prop for tracking layout state
}

// Additional types that might be useful
export interface EdgeData {
  label?: string;
  type?: string;
  [key: string]: any; // Allow for additional custom properties
}

export interface LayoutOptions {
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  nodeWidth?: number;
  nodeHeight?: number;
}

export interface LayoutResult {
  nodes: Node<CustomNodeData>[];
  edges: Edge[];
}