import { Node, Edge } from '@xyflow/react';
import elkSingleton from './elkSingleton';

export interface LayoutOpts {
  direction?: 'LR' | 'TB' | 'BT' | 'RL';
  nodeWidth?: number;
  nodeHeight?: number;
  spacingBetweenLayers?: number;
  spacingWithinLayer?: number;
}

export async function layoutWithELK(
  nodes: Node[],
  edges: Edge[],
  { direction = 'LR', nodeWidth = 172, nodeHeight = 36, spacingBetweenLayers = 300, spacingWithinLayer = 50 }: LayoutOpts = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  // Early-out if no nodes to layout
  if (!nodes || nodes.length === 0) {
    return { nodes, edges };
  }

  // Build ELK compatible graph structure with enhanced layout options for beautiful horizontal layouts
  const graph: any = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.edgeRouting': 'ORTHOGONAL',
      
      // Optimize spacing for better readability
      'elk.spacing.nodeNode': String(Math.min(spacingWithinLayer, 40)),  // Reduced spacing between nodes in same layer
      'elk.layered.spacing.nodeNodeBetweenLayers': String(Math.min(spacingBetweenLayers, 200)), // Reduced horizontal spacing
      'elk.spacing.edgeNode': '40',                    // Reduced edge-to-node spacing
      'elk.spacing.edgeEdge': '30',                    // Reduced edge separation
      'elk.spacing.labelNode': '25',                   // Reduced space between labels and nodes
      'elk.spacing.labelLabel': '20',                  // Reduced space between labels
      'elk.spacing.componentComponent': '80',          // Reduced space between disconnected components
      
      // Advanced layering strategies for enterprise-grade organization
      'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
      
      // Handle feedback edges better
      
      // Vertical ordering within layers - prioritize grouping similar nodes
      'elk.layered.considerModelOrder.crossingCounterbalance': '0.1',
      'elk.layered.inLayerConstraintProvider': 'VERTICAL_CONSTRAINT',
      
      // Padding and component separation
      'elk.padding': '[top=40,left=40,bottom=40,right=40]',
      'elk.separateConnectedComponents': 'true',
      
      // Additional optimization for compact layout
      'elk.layered.compaction.postCompaction.strategy': 'LEFT',
      'elk.layered.nodePlacement.favorStraightEdges': 'true',
    },
    children: nodes.map((n) => {
      // Detect explicit pinned flag instead of x!=0 heuristic
      const isPinned = n.data?.pinned === true;
      const child: any = {
        id: n.id,
        width: n.width ?? nodeWidth,
        height: n.height ?? nodeHeight,
      };

      // Apply layer constraints using layerIndex property with vertical positioning constraints
      // This ensures nodes are positioned in their correct swim lanes
      const layerIdx = (n.data as any)?.layerIndex;
      if (layerIdx !== undefined) {
        // Determine node type/category for vertical ordering within layer
        let verticalOrder = 0;
        const nodeType = ((n.data as any)?.nodeType || '').toLowerCase();
        const nodeLabel = ((n.data as any)?.label || '').toLowerCase();
        
        // Group similar nodes together vertically within their layer
        if (nodeType.includes('database') || nodeLabel.includes('database') || nodeType.includes('db') || nodeLabel.includes('data')) {
          verticalOrder = 1;  // Databases at top
        } else if (nodeType.includes('service') || nodeLabel.includes('service') || nodeType.includes('api')) {
          verticalOrder = 2;  // Services in middle
        } else if (nodeType.includes('queue') || nodeLabel.includes('queue') || nodeType.includes('message')) {
          verticalOrder = 3;  // Messaging components
        } else if (nodeType.includes('client') || nodeLabel.includes('client')) {
          verticalOrder = 4;  // Clients
        } else if (nodeType.includes('security') || nodeLabel.includes('security')) {
          verticalOrder = 5;  // Security components
        }
        
        // Calculate a consistency score for this node within its layer
        // This helps maintain stable vertical ordering
        const labelHash = hashCode(nodeLabel);
        // Use a smaller multiplier for more compact vertical arrangement
        const verticalPosition = (verticalOrder * 60) + (labelHash % 60);
        
        child.layoutOptions = { 
          ...(child.layoutOptions ?? {}), 
          'layerIndex': String(layerIdx),
          'elk.layered.layering.nodeLayerAssignment': String(layerIdx),
          // Force nodes to stay in their assigned layer with vertical ordering
          'elk.layered.layering.layerConstraint': 'FIRST_SAME_AS_PREVIOUS',
          // Set vertical position within layer
          'elk.position.y': String(verticalPosition),
          'verticalOrder': String(verticalOrder)
        };
      }

      // Honor pinned nodes by setting fixed position
      if (isPinned && n.position) {
        child.layoutOptions = {
          ...(child.layoutOptions ?? {}),
          'elk.fixed': 'true',
          'elk.position': `(${n.position!.x},${n.position!.y})`,
        };
      }
      return child;
    }),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
      // Add specific edge options for each edge
      layoutOptions: {
        'elk.layered.feedbackEdge': 'false',  // Not a feedback edge by default
        'elk.edgeLabels.inline': 'true',      // Place labels inline
        'elk.layered.spacing.edgeNodeBetweenLayers': '15',  // Keep reasonable spacing
        'elk.layered.spacing.edgeEdgeBetweenLayers': '15',  // Keep reasonable spacing
      },
      labels: e.label ? [{ text: e.label, layoutOptions: { 'elk.nodeLabels.placement': 'CENTER' } }] : undefined
    })),
  };

  // Use ELK instance directly
  const layouted = await elkSingleton.layout(graph);

  // Convert ELK result back to React Flow format
  const layoutedNodes = nodes.map((node) => {
    // Find corresponding node in layouted graph
    const layoutNode = layouted.children?.find((n: any) => n.id === node.id);
    
    // Skip if node not found in layout results
    if (!layoutNode) {
      return node;
    }

    return {
      ...node,
      position: {
        x: layoutNode.x || 0,
        y: layoutNode.y || 0,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Simple hash code function for consistent vertical ordering
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
} 