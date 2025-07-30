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
  /**
   * Optional raw Iconify or SVG identifier coming directly from the back-end.
   * When present this takes precedence over client-side look-ups so we render
   * exactly the asset the server has chosen.
   */
  icon?: string;

  /**
   * Optional HEX/RGB colour hint coming from the back-end. If provided the
   * node (or its icon) should use this colour as primary accent.
   */
  color?: string;

  /**
   * Cloud provider hint (e.g. "aws", "azure", "gcp") passed through from the
   * back-end so the front-end can display provider-specific icons or apply
   * grouping.
   */
  provider?: string;

  /**
   * Technology hint (e.g. "postgresql", "redis") passed through from the
   * back-end for refined icon selection.
   */
  technology?: string;

  /**
   * Numeric layer hint (0,1,2…) coming from the backend used by the ELK
   * layout engine to pin the node into a swim-lane.
   */
  layerIndex?: number;

  /**
   * Optional shape descriptor (e.g. “cylinder”, “queue”) coming from the
   * back-end.  At the moment it is treated as metadata only but we keep it in
   * the type definition for future visual enhancements.
   */
  shape?: string;

  /**
   * Optional risk score or risk band (e.g. “low”, “medium”, “high”) attached
   * to the node by the security analysis pipeline.
   */
  risk?: string | number;
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