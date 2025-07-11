import { Node, Edge } from '@xyflow/react';

interface LayerConfig {
  baseX: number;
  fixedY: number;
  spacing: number;
  label: string;
}

// Beautiful left-to-right architecture layers with improved spacing
const LAYER_CONFIGS: Record<string, LayerConfig> = {
  client: { baseX: 80, fixedY: 200, spacing: 200, label: 'Client Zone' },
  network: { baseX: 400, fixedY: 350, spacing: 180, label: 'DMZ Layer' },
  application: { baseX: 800, fixedY: 500, spacing: 200, label: 'Application Layer' },
  database: { baseX: 1300, fixedY: 650, spacing: 220, label: 'Data Layer' },
  default: { baseX: 800, fixedY: 500, spacing: 200, label: 'Application Layer' }
};

/**
 * Determines the architectural layer based on node type, ID, and label
 */
function determineNodeLayer(node: Node): string {
  const nodeType = String(node.data?.nodeType || '').toLowerCase();
  const nodeId = String(node.id || '').toLowerCase();
  const label = String(node.data?.label || '').toLowerCase();
  
  // Client layer detection
  if (nodeType.startsWith('client_') || 
      nodeId.includes('client') || 
      nodeId.includes('browser') || 
      nodeId.includes('mobile') ||
      nodeId.includes('user') ||
      label.includes('client') ||
      label.includes('browser') ||
      label.includes('mobile')) {
    return 'client';
  }
  
  // Network/DMZ layer detection
  if (nodeType.startsWith('network_') ||
      nodeId.includes('cdn') ||
      nodeId.includes('firewall') ||
      nodeId.includes('load_balancer') ||
      nodeId.includes('load balancer') ||
      nodeId.includes('waf') ||
      nodeId.includes('proxy') ||
      nodeId.includes('gateway') && !nodeId.includes('api') ||
      label.includes('cdn') ||
      label.includes('firewall') ||
      label.includes('load balancer') ||
      label.includes('waf')) {
    return 'network';
  }
  
  // Database layer detection
  if (nodeType.startsWith('database_') ||
      nodeType.includes('database') ||
      nodeId.includes('database') ||
      nodeId.includes('db') ||
      nodeId.includes('cache') ||
      nodeId.includes('redis') ||
      nodeId.includes('postgresql') ||
      nodeId.includes('mysql') ||
      nodeId.includes('mongo') ||
      nodeId.includes('storage') ||
      label.includes('database') ||
      label.includes('cache') ||
      label.includes('storage')) {
    return 'database';
  }
  
  // Everything else goes to application layer
  return 'application';
}

/**
 * Transforms any layout (top-down or scattered) into beautiful left-to-right architecture
 */
export function transformToLeftRightLayout(nodes: Node[], edges: Edge[]): { nodes: Node[], edges: Edge[] } {
  if (!nodes || nodes.length === 0) {
    return { nodes, edges };
  }

  console.log('🔄 Transforming layout to left-to-right architecture...');
  
  // Group nodes by layer
  const nodesByLayer: Record<string, Node[]> = {
    client: [],
    network: [],
    application: [],
    database: []
  };
  
  // Categorize all nodes
  nodes.forEach(node => {
    const layer = determineNodeLayer(node);
    nodesByLayer[layer].push(node);
  });
  
  // Log layer distribution
  Object.entries(nodesByLayer).forEach(([layer, layerNodes]) => {
    if (layerNodes.length > 0) {
      console.log(`📍 ${layer.toUpperCase()} layer: ${layerNodes.length} nodes`);
    }
  });
  
  // Transform nodes to left-to-right positions
  const transformedNodes: Node[] = [];
  
  Object.entries(nodesByLayer).forEach(([layer, layerNodes]) => {
    const config = LAYER_CONFIGS[layer];
    
    layerNodes.forEach((node, index) => {
      const newX = config.baseX + (index * config.spacing);
      const newY = config.fixedY;
      
      console.log(`🎯 ${node.id}: Moving to (${newX}, ${newY}) in ${layer} layer`);
      
      transformedNodes.push({
        ...node,
        position: { x: newX, y: newY },
        data: {
          ...node.data,
          layer: layer,
          transformed: true
        }
      });
    });
  });
  
  console.log(`✅ Layout transformation complete: ${transformedNodes.length} nodes positioned`);
  
  return { 
    nodes: transformedNodes, 
    edges: edges // Keep edges as-is
  };
}

/**
 * Enhanced node preparation that forces left-to-right layout
 */
export function prepareNodesWithLeftRightLayout(inputNodes: Node[], inputEdges: Edge[] = []): Node[] {
  if (!inputNodes || !Array.isArray(inputNodes) || inputNodes.length === 0) {
    return [];
  }

  console.log('🚀 Preparing nodes with forced left-to-right layout...');
  
  // First, ensure all nodes have proper data structure
  const cleanedNodes = inputNodes.map((node, index) => {
    if (!node) return null;

    // Clean and validate label
    const originalLabel = node.data?.label || node.id || 'Node';
    let cleanLabel = String(originalLabel);
    
    // Fix corrupted labels
    if (typeof originalLabel === 'string' && (
      originalLabel.length > 50 || 
      originalLabel.includes('http') || 
      originalLabel.includes('data:') ||
      originalLabel.includes('.svg') ||
      originalLabel.includes('storage.') ||
      originalLabel.includes('supabase.')
    )) {
      cleanLabel = node.id?.replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ') || `Node ${index + 1}`;
    }

    return {
      ...node,
      type: 'default',
      draggable: true,
      data: {
        ...node.data,
        label: cleanLabel,
        nodeType: node.data?.nodeType || 'default',
        validated: true,
        source: 'layout_transformer'
      }
    } as Node;
  }).filter((node): node is Node => node !== null);

  // Apply left-to-right transformation
  const { nodes: transformedNodes } = transformToLeftRightLayout(cleanedNodes, inputEdges);
  
  return transformedNodes;
}

/**
 * Checks if the current layout appears to be top-down and needs transformation
 */
export function needsLayoutTransformation(nodes: Node[]): boolean {
  if (!nodes || nodes.length < 2) return false;
  
  // Calculate the spread in X vs Y directions
  const xPositions = nodes.map(n => n.position?.x || 0);
  const yPositions = nodes.map(n => n.position?.y || 0);
  
  const xSpread = Math.max(...xPositions) - Math.min(...xPositions);
  const ySpread = Math.max(...yPositions) - Math.min(...yPositions);
  
  // If Y spread is significantly larger than X spread, it's likely top-down
  const isTopDown = ySpread > xSpread * 1.5;
  
  console.log(`📊 Layout analysis: X-spread=${xSpread}, Y-spread=${ySpread}, isTopDown=${isTopDown}`);
  
  return isTopDown;
} 