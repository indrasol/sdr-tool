
import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DiagramToolbar from './DiagramToolbar';
import CustomNode from './customNode';
import EditNodeDialog from './EditNodeDialog';
import { AIFlowDiagramProps, CustomNodeData } from './types/diagramTypes';
import { useDiagramNodes } from './hooks/useDiagramNodes';

// Register our custom node types with the proper type casting
const nodeTypes: NodeTypes = {
  default: CustomNode as any // Using 'any' to bypass the complex type issues
};

const AIFlowDiagram: React.FC<AIFlowDiagramProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  setNodes: setNodesExternal,
  setEdges: setEdgesExternal
}) => {
  // Use our custom hook to manage nodes and their interactions
  const {
    editNodeDialogOpen,
    setEditNodeDialogOpen,
    currentEditNode,
    prepareNodes,
    handleConnect,
    handleAddNode,
    handleSaveNodeEdit
  } = useDiagramNodes(initialNodes, initialEdges, setNodesExternal, setEdgesExternal);

  // Apply styling and callbacks to nodes
  const nodesWithStyles = useMemo(() => {
    return prepareNodes(initialNodes);
  }, [initialNodes, prepareNodes]);

  // Use ReactFlow hooks to manage nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(nodesWithStyles);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync internal state with external state
  React.useEffect(() => {
    setNodesExternal(nodes);
  }, [nodes, setNodesExternal]);

  React.useEffect(() => {
    setEdgesExternal(edges);
  }, [edges, setEdgesExternal]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
        <DiagramToolbar onAddNode={handleAddNode} />
      </ReactFlow>

      <EditNodeDialog
        open={editNodeDialogOpen}
        onOpenChange={setEditNodeDialogOpen}
        node={currentEditNode}
        onSave={handleSaveNodeEdit}
      />
    </div>
  );
};

export default AIFlowDiagram;