
import { Node, Edge, NodeProps as ReactFlowNodeProps } from '@xyflow/react';

// Define the data structure for node data
export interface CustomNodeData {
  label: string;
  description?: string;
  nodeType?: string;
  onEdit?: (id: string, label: string) => void;
  onDelete?: (id: string) => void;
  [key: string]: unknown; // Add index signature to satisfy Record<string, unknown>
}

// Create a proper NodeProps type that extends ReactFlow's NodeProps
export type NodeProps = Omit<ReactFlowNodeProps, 'data'> & {
  data?: CustomNodeData;
};

export interface NodeEditData {
  id: string;
  label: string;
  description?: string;
}

export interface AIFlowDiagramProps {
  nodes: Node<CustomNodeData>[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node<CustomNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}