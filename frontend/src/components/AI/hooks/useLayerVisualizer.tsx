import { useState, useEffect, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { applyLayerLayout } from '../utils/simplifiedIrToReactflow';

interface IRGroup {
  id: string;
  name: string;
  type: string;
  member_node_ids: string[];
}

interface UseLayerVisualizerProps {
  nodes: Node[];
  edges: Edge[];
  groups?: IRGroup[];
  direction?: 'LR' | 'TB';
}

interface UseLayerVisualizerReturn {
  processedNodes: Node[];
  processedEdges: Edge[];
  isProcessing: boolean;
  layoutDirection: 'LR' | 'TB';
  toggleDirection: () => void;
}

/**
 * Hook to handle layer-based visualization of nodes using the taxonomy-based approach
 * 
 * This hook processes nodes and edges to create a beautiful layered visualization
 * based on the layerIndex values provided by the backend.
 */
export function useLayerVisualizer({
  nodes,
  edges,
  groups = [],
  direction = 'LR'
}: UseLayerVisualizerProps): UseLayerVisualizerReturn {
  const [processedNodes, setProcessedNodes] = useState<Node[]>([]);
  const [processedEdges, setProcessedEdges] = useState<Edge[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [layoutDirection, setLayoutDirection] = useState<'LR' | 'TB'>(direction);

  /**
   * Process groups to enhance node data with group information
   */
  const enhanceNodesWithGroupInfo = useCallback((inputNodes: Node[], groupData: IRGroup[]): Node[] => {
    if (!groupData.length) return inputNodes;
    
    const nodeGroupMap: Record<string, string[]> = {};
    
    // Create mapping of node IDs to group names
    groupData.forEach(group => {
      group.member_node_ids.forEach(nodeId => {
        if (!nodeGroupMap[nodeId]) {
          nodeGroupMap[nodeId] = [];
        }
        nodeGroupMap[nodeId].push(group.name);
      });
    });
    
    // Enhance nodes with group information
    return inputNodes.map(node => {
      const groups = nodeGroupMap[node.id] || [];
      if (!groups.length) return node;
      
      return {
        ...node,
        data: {
          ...node.data,
          groups
        }
      };
    });
  }, []);

  /**
   * Toggle between LR and TB layout directions
   */
  const toggleDirection = useCallback(() => {
    setLayoutDirection(prev => prev === 'LR' ? 'TB' : 'LR');
  }, []);

  /**
   * Apply layout when nodes, edges, or direction changes
   */
  useEffect(() => {
    if (!nodes.length) return;
    
    const applyLayout = async () => {
      try {
        setIsProcessing(true);
        
        // Enhance nodes with group information
        const enhancedNodes = enhanceNodesWithGroupInfo(nodes, groups);
        
        // Apply layout using the new simplified approach
        const { nodes: layoutedNodes, edges: layoutedEdges } = await applyLayerLayout(
          enhancedNodes,
          edges,
          layoutDirection
        );
        
        setProcessedNodes(layoutedNodes);
        setProcessedEdges(layoutedEdges);
      } catch (error) {
        console.error('Error applying layer layout:', error);
      } finally {
        setIsProcessing(false);
      }
    };
    
    applyLayout();
  }, [nodes, edges, groups, layoutDirection, enhanceNodesWithGroupInfo]);

  return {
    processedNodes,
    processedEdges,
    isProcessing,
    layoutDirection,
    toggleDirection
  };
}

export default useLayerVisualizer; 