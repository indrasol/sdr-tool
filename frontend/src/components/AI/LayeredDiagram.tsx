import React from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls,
  MiniMap,
  Panel,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useLayerVisualizer } from './hooks/useLayerVisualizer';
import LayerGroupNode from './LayerGroupNode';
import CustomNode from './customNode';
import { Button } from '../ui/button';

interface NodeData {
  layerIndex?: number;
  [key: string]: unknown;
}

interface LayeredDiagramProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  groups?: any[];
  onNodeClick?: (node: Node<NodeData>) => void;
}

/**
 * A component that renders a layered diagram using the taxonomy-based approach
 * 
 * This component demonstrates the integration of the new backend data with
 * the frontend visualization using beautiful tinted layer containers.
 */
const LayeredDiagram: React.FC<LayeredDiagramProps> = ({
  nodes,
  edges,
  groups = [],
  onNodeClick
}) => {
  // Use our new layer visualizer hook to apply taxonomy-based layout
  const {
    processedNodes,
    processedEdges,
    isProcessing,
    layoutDirection,
    toggleDirection
  } = useLayerVisualizer({
    nodes,
    edges,
    groups,
    direction: 'LR' // Default to left-to-right layout
  });

  // Register custom node types
  const nodeTypes = {
    layerGroup: LayerGroupNode,
    custom: CustomNode,
    default: CustomNode
  };

  return (
    <div className="w-full h-full relative">
      {/* Show loading indicator while processing */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-10">
          <div className="bg-white p-4 rounded-md shadow-md">
            <p className="font-medium">Optimizing layout...</p>
          </div>
        </div>
      )}

      {/* ReactFlow component with our custom nodes and layout */}
      <ReactFlow
        nodes={processedNodes}
        edges={processedEdges}
        nodeTypes={nodeTypes}
        fitView
        onNodeClick={(_, node) => onNodeClick?.(node)}
        className="bg-gray-50"
      >
        {/* Background pattern */}
        <Background color="#aaa" gap={16} />
        
        {/* Controls panel */}
        <Controls />
        
        {/* Mini map for navigation */}
        <MiniMap 
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        
        {/* Custom panel with controls */}
        <Panel position="top-right" className="bg-white p-2 rounded-md shadow-sm">
          <div className="flex flex-col gap-2">
            <Button 
              onClick={toggleDirection}
              variant="outline"
              size="sm"
            >
              {layoutDirection === 'LR' ? 'Switch to Top-Down' : 'Switch to Left-Right'}
            </Button>
            
            <div className="text-xs text-gray-500 mt-2">
              <p>{processedNodes.length} nodes in {getLayerCount(processedNodes)} layers</p>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

// Helper function to count unique layers
function getLayerCount(nodes: Node<NodeData>[]): number {
  const layerIndices = new Set<number>();
  
  nodes.forEach(node => {
    const layerIndex = node.data?.layerIndex;
    if (typeof layerIndex === 'number' && node.type !== 'layerGroup') {
      layerIndices.add(layerIndex);
    }
  });
  
  return layerIndices.size;
}

export default LayeredDiagram; 