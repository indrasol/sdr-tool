import { Node, Edge, MarkerType } from '@xyflow/react';
import elk from './elkSingleton';

export interface LayoutOpts {
  direction?: 'LR' | 'TB';
  nodeWidth?: number;
  nodeHeight?: number;
}

export async function layoutWithELK(
  nodes: Node[],
  edges: Edge[],
  { direction = 'LR', nodeWidth = 172, nodeHeight = 36 }: LayoutOpts = {}
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
      
      // Enhanced node placement and alignment for beautiful horizontal flow
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
      'elk.layered.crossingMinimization.semiInteractive': 'true',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      
      // Optimized spacing for clean horizontal architecture visualization
      'elk.spacing.nodeNode': '100',                        // More space between nodes in same layer
      'elk.layered.spacing.nodeNodeBetweenLayers': '180',  // Wider gaps between layers for clarity
      'elk.spacing.edgeNode': '40',                        // More edge-to-node spacing
      'elk.spacing.edgeEdge': '25',                        // Better edge separation
      
      // Layer assignment and ranking for proper left-to-right flow
      'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.cycleBreaking.strategy': 'GREEDY',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      
      // Port placement for cleaner edge routing
      'elk.portConstraints': 'FIXED_SIDE',
      'elk.layered.unnecessaryBendpoints': 'true',
      'elk.layered.edgeLabels.sideSelection': 'SMART_DOWN',
      
      // Hierarchical layout enhancements for architectural diagrams
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.layered.nodePlacement.favorStraightEdges': 'true',
      'elk.layered.compaction.postCompaction.strategy': 'LEFT',
      
      // Enhanced sizing and positioning for architecture diagrams
      'elk.padding': '[top=80,left=100,bottom=80,right=100]',
      'elk.separateConnectedComponents': 'true',
      'elk.layered.thoroughness': '50', // Better layout quality
    },
    children: nodes.map((n) => {
      // Detect explicit pinned flag instead of x!=0 heuristic
      const isPinned = n.data?.pinned === true;
      const child: any = {
        id: n.id,
        width: n.width ?? nodeWidth,
        height: n.height ?? nodeHeight,
      };
      if (isPinned && n.position) {
        child.layoutOptions = {
          'elk.fixed': 'true',
          'elk.x': `${n.position!.x}`,
          'elk.y': `${n.position!.y}`,
        };
      }
      return child;
    }),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  // Execute layout – may throw if graph invalid
  let res;
  try {
    res = await elk.layout(graph);
  } catch (err) {
    console.error('[ELK] layout failed – returning original positions', err);
    return { nodes, edges };
  }

  // Map ELK positions back onto React Flow nodes
  const positionedNodes: Node[] = nodes.map((n) => {
    const ln = res.children?.find((c: any) => c.id === n.id);
    if (!ln) return n; // should not happen but safety first
    return {
      ...n,
      position: {
        x: ln.x ?? n.position?.x ?? 0,
        y: ln.y ?? n.position?.y ?? 0,
      },
    };
  });

  // Update edge defaults – smoothstep
  const positionedEdges: Edge[] = edges.map((e) => ({
    ...e,
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 12,
      height: 12,
      color: '#333',
    },
    style: {
      strokeWidth: 1.5,
      stroke: '#333',
      ...e.style,
    },
  }));

  return { nodes: positionedNodes, edges: positionedEdges };
} 