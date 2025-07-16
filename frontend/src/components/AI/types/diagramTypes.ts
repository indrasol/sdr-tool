import { Node, Edge, NodeProps as ReactFlowNodeProps } from '@xyflow/react';
import { ThreatItem } from '@/interfaces/aiassistedinterfaces';

// Define the data structure for node data
export interface CustomNodeData {
  label: string;
  description?: string;
  nodeType?: string;
  iconRenderer?: () => { component: React.ElementType; props: any; bgColor: string };
  iconUrl?: string; // Add iconUrl property for direct HTML icon content
  onEdit?: (id: string, label: string) => void;
  onDelete?: (id: string) => void;
  onLock?: (id: string) => void; // Toggle pinned
  isComment?: boolean;
  threats?: ThreatItem[];
  activeSeverityFilter?: string;
  hasSourceConnection?: boolean;
  hasTargetConnection?: boolean;
  pinned?: boolean; // Indicates if node position is locked
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
  onLayout?: (options: {
    direction: 'LR' | 'TB' | 'BT' | 'RL';
    engine: 'auto' | 'elk' | 'dagre' | 'basic';
    enablePerformanceMonitoring: boolean;
  }) => void; // Enhanced layout functionality
  isLayouting?: boolean; // New prop for tracking layout state
  lastLayoutResult?: {
    engineUsed: string;
    executionTime: number;
    qualityScore: number;
    success: boolean;
    complexityMetrics?: {
      nodeCount: number;
      edgeCount: number;
      complexityScore: number;
    };
  }; // Layout result for feedback
  reactFlowInstanceRef?: React.MutableRefObject<any>; // Reference to the ReactFlow instance
  projectId?: string; // Project ID to display
  diagramRef?: React.RefObject<HTMLDivElement>; // Reference to diagram container for image capture
  // Toggle functions for diagram views
  onToggleDataFlow?: () => void;
  onToggleFlowchart?: () => void;
  // State for active views
  isDataFlowActive?: boolean;
  isFlowchartActive?: boolean;
  // Threat analysis functionality
  onRunThreatAnalysis?: () => void;
  runningThreatAnalysis?: boolean;
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