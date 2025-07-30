/**
 * Simplified IRToReactflow adapter
 * 
 * This module trusts the backend-assigned layerIndex for consistent swim-lane based layouts.
 * It maintains beautiful tinted layer containers with proper grouping and spacing.
 */
import { Node, Edge } from '@xyflow/react';
import { layoutWithELK } from './elkLayout';
import { layerThemes } from '../styles/layerThemes';

// Define the expected node data structure
interface NodeData {
  label?: string;
  nodeType?: string;
  description?: string;
  iconifyId?: string;
  layerIndex?: number;
  technology?: string;
  provider?: string;
  sources?: string[];
  source?: string;
  targets?: string[];
  target?: string;
  [key: string]: unknown;
}

/**
 * Process nodes using backend-provided layerIndex values
 */
export const prepareNodesForLayerLayout = (nodes: Node[]): Node[] => {
  // Create a map to track layer assignments for logging
  const layerCounts: Record<number, number> = {};
  
  // Default layer indices if they're missing
  const DEFAULT_LAYER_INDEX = 3;  // Service layer as default
  
  // Process each node to ensure it has a valid layerIndex
  return nodes.map(node => {
    const data = node.data as NodeData;
    
    // Trust backend layerIndex if it exists
    if (data?.layerIndex !== undefined) {
      // Count nodes in each layer
      layerCounts[data.layerIndex] = (layerCounts[data.layerIndex] || 0) + 1;
      console.log(`Node ${node.id} (${data?.label || 'unlabeled'}) has layer ${data.layerIndex}`);
      return node;
    }
    
    // Fallback for nodes without layerIndex
    console.warn(`Node ${node.id} (${data?.label || 'unlabeled'}) missing layerIndex - using default ${DEFAULT_LAYER_INDEX}`);
    return {
      ...node,
      data: {
        ...data,
        layerIndex: DEFAULT_LAYER_INDEX
      }
    };
  });
};

/**
 * Create layer group container nodes for each layer in the diagram
 */
export const createLayerGroupNodes = (nodes: Node[]): Node[] => {
  // Get unique layer indices and their bounds
  const layers: Record<number, {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    nodes: Node[];
  }> = {};
  
  // Assign nodes to layers and calculate bounds
  nodes.forEach(node => {
    const data = node.data as NodeData;
    const layerIndex = data?.layerIndex ?? 3; // Default to service layer if missing
    
    if (!layers[layerIndex]) {
      layers[layerIndex] = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
        nodes: []
      };
    }
    
    // Skip nodes that don't have positions yet
    if (!node.position) return;
    
    const width = node.width ?? 172;
    const height = node.height ?? 36;
    
    // Update layer bounds
    layers[layerIndex].minX = Math.min(layers[layerIndex].minX, node.position.x);
    layers[layerIndex].minY = Math.min(layers[layerIndex].minY, node.position.y);
    layers[layerIndex].maxX = Math.max(layers[layerIndex].maxX, node.position.x + width);
    layers[layerIndex].maxY = Math.max(layers[layerIndex].maxY, node.position.y + height);
    
    // Add node to layer
    layers[layerIndex].nodes.push(node);
  });
  
  // Create layer group nodes with enhanced styling
  const layerGroupNodes: Node[] = [];
  
  // Sort layer indices to ensure consistent order
  const sortedLayerIndices = Object.keys(layers).map(Number).sort((a, b) => a - b);
  
  // Calculate total diagram dimensions for proportional spacing
  let minDiagramX = Infinity;
  let maxDiagramX = -Infinity;
  let minDiagramY = Infinity;
  let maxDiagramY = -Infinity;
  
  // Determine overall diagram bounds
  sortedLayerIndices.forEach(layerIndex => {
    const bounds = layers[layerIndex];
    if (bounds.minX < Infinity) {
      minDiagramX = Math.min(minDiagramX, bounds.minX);
      maxDiagramX = Math.max(maxDiagramX, bounds.maxX);
      minDiagramY = Math.min(minDiagramY, bounds.minY);
      maxDiagramY = Math.max(maxDiagramY, bounds.maxY);
    }
  });
  
  // Create layer containers with evenly distributed width and proper padding
  sortedLayerIndices.forEach(layerIndex => {
    const bounds = layers[layerIndex];
    
    // Skip layers with no nodes or invalid bounds
    if (bounds.nodes.length === 0 || 
        bounds.minX === Infinity || 
        bounds.minY === Infinity) {
      return;
    }
    
    // Add padding based on layer content - generous padding for better separation
    const nodeCount = bounds.nodes.length;
    const basePadding = 70; // Increased for better visual separation
    const dynamicPadding = Math.min(20 * Math.log(nodeCount + 1), 80); // More dynamic padding
    const padding = basePadding + dynamicPadding;
    
    // Calculate vertical space needed
    const layerHeight = bounds.maxY - bounds.minY;
    const minLayerHeight = 180; // Increased minimum height for better visual appearance
    
    // Get the style for this layer from our theme file, defaulting if not found
    const style = layerThemes[layerIndex] || layerThemes[3];
    
    // Calculate container dimensions based on content with generous padding
    const containerWidth = bounds.maxX - bounds.minX + (padding * 2);
    const containerHeight = Math.max(layerHeight + (padding * 2) + 40, minLayerHeight);
    
    // Create the layer group node with enhanced styling
    layerGroupNodes.push({
      id: `layer_${layerIndex}`,
      type: 'layerGroup',
      position: {
        x: bounds.minX - padding,
        y: bounds.minY - padding - 40, // Extra space for the header
      },
      style: {
        width: containerWidth,
        height: containerHeight,
        backgroundColor: style.color,
        borderRadius: '14px',  // Slightly rounder corners
        border: `2px dashed ${style.borderColor}`,
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)', // Subtle shadow for depth
        padding: '14px',
        backgroundImage: `linear-gradient(to bottom, ${style.borderColor}15, transparent 80px)`,
      },
      data: {
        label: style.label,
        layerIndex: layerIndex,
        nodeType: 'layerGroup',
        iconifyId: style.icon,
        description: style.description,
        source: 'frontend_enhanced',
        validated: true,
        nodeCount: bounds.nodes.length,
        layerStyle: {
          color: style.color,
          borderColor: style.borderColor
        }
      },
      zIndex: -10, // Keep containers behind nodes
      selectable: false, // Don't allow selecting containers
      draggable: false, // Don't allow dragging containers
    });
  });
  
  return layerGroupNodes;
};

/**
 * Post-process node positions to ensure consistent layer positioning
 * with better vertical stacking within layers
 */
const postProcessNodePositions = (nodes: Node[]): Node[] => {
  // Group nodes by layer
  const nodesByLayer: Record<number, Node[]> = {};
  
  // Find the minimum x position for each layer
  const layerMinX: Record<number, number> = {};
  const layerMaxX: Record<number, number> = {};
  
  // First pass - group nodes and find min/max positions
  nodes.forEach(node => {
    const layerIdx = (node.data as NodeData)?.layerIndex;
    if (layerIdx === undefined) return;
    
    // Initialize arrays and values for this layer
    if (!nodesByLayer[layerIdx]) nodesByLayer[layerIdx] = [];
    if (layerMinX[layerIdx] === undefined) layerMinX[layerIdx] = Infinity;
    if (layerMaxX[layerIdx] === undefined) layerMaxX[layerIdx] = -Infinity;
    
    // Add node to layer
    nodesByLayer[layerIdx].push(node);
    
    // Update min/max X positions
    if (node.position) {
      layerMinX[layerIdx] = Math.min(layerMinX[layerIdx], node.position.x);
      layerMaxX[layerIdx] = Math.max(layerMaxX[layerIdx], node.position.x + (node.width || 180));
    }
  });
  
  // Find all unique layer indices and sort them
  const layerIndices = Object.keys(nodesByLayer).map(Number).sort((a, b) => a - b);
  
  // Base horizontal position with more space at the left margin
  const baseX = 150;
  let currentX = baseX;
  
  // Increased horizontal spacing between layers for better visual separation
  const layerSpacing = 300; 
  
  // Apply consistent X position for each layer
  layerIndices.forEach(layerIdx => {
    const layerNodes = nodesByLayer[layerIdx];
    if (!layerNodes || layerNodes.length === 0) return;
    
    // Calculate width needed for this layer
    const layerWidth = Math.max(layerMaxX[layerIdx] - layerMinX[layerIdx], 200);
    
    // Sort nodes by any defined groups first, then by label alphabetically
    layerNodes.sort((a, b) => {
      // First, try to group by domain or other grouping property if available
      const aGroup = (a.data as any)?.domain || '';
      const bGroup = (b.data as any)?.domain || '';
      
      if (aGroup !== bGroup) {
        return aGroup.localeCompare(bGroup);
      }
      
      // Then sort alphabetically by label for nicer organization
      const aLabel = (a.data as any)?.label || '';
      const bLabel = (b.data as any)?.label || '';
      return aLabel.localeCompare(bLabel);
    });
    
    // Vertical layout parameters
    const nodeHeight = 50;  // Estimated average node height
    const verticalGap = 35;  // Space between nodes
    const startY = 100;     // Top margin
    
    // Apply offset to all nodes in this layer for a nice vertical stack
    layerNodes.forEach((node, index) => {
      if (!node.position) return;
      
      // Set X position centered in the layer's horizontal space
      const centerX = currentX + (layerWidth / 2);
      const nodeWidth = node.width || 180;
      node.position.x = centerX - (nodeWidth / 2);
      
      // Set Y position in a neat vertical stack with proper spacing
      node.position.y = startY + (index * (nodeHeight + verticalGap));
    });
    
    // Move to next layer position with increased spacing
    currentX += layerWidth + layerSpacing;
  });
  
  return nodes;
};

/**
 * Apply layer-based ELK layout to nodes and edges with layerIndex constraints
 * and create beautiful tinted layer groups with proper node arrangement
 */
export const applyLayerLayout = async (
  nodes: Node[], 
  edges: Edge[], 
  direction: 'LR' | 'TB' = 'LR'
): Promise<{ nodes: Node[], edges: Edge[] }> => {
  console.log(`🔄 Applying enhanced layer layout with ${direction} direction for ${nodes.length} nodes...`);
  
  // First ensure all nodes have layer indices by trusting the backend values
  const layeredNodes = prepareNodesForLayerLayout(nodes);
  
  // Enhanced layout options for better visual presentation
  const layoutOptions = {
    direction,
    nodeWidth: 180,
    nodeHeight: 50,  // Slightly taller nodes for better readability
    spacingBetweenLayers: 300, // Increased for better layer separation
    spacingWithinLayer: 70,    // More vertical spacing for cleaner layout
  };
  
  console.log(`⚙️ Using layout options:`, layoutOptions);
  
  // Apply ELK layout
  const result = await layoutWithELK(layeredNodes, edges, layoutOptions);
  
  // Post-process nodes to ensure consistent layer positioning and beautiful vertical stacking
  const processedNodes = postProcessNodePositions(result.nodes);
  
  // Generate layer group container nodes with beautiful tinted styling
  const layerGroups = createLayerGroupNodes(processedNodes);
  
  console.log(`✅ Layer layout complete: ${processedNodes.length} nodes, ${layerGroups.length} layer groups`);
  
  // Combine regular nodes and layer groups
  return {
    nodes: [...processedNodes, ...layerGroups],
    edges: result.edges
  };
}; 