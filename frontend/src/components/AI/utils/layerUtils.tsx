import { Node } from '@xyflow/react';
// Import the IconItem from the correct path
import { IconItem } from '@/components/AI/icons/IconsLoader';

// Interface for layer style
export interface LayerStyle {
  bgColor: string;
  borderColor: string;
  color: string;
  label: string;
}

// Define layer hierarchy with parent-child relationships
export interface LayerHierarchy {
  level: number;       // Level in hierarchy (0 = top level, higher = more nested)
  parent?: string;     // Parent layer if any
  children: string[];  // Child layers
}

// Define a central registry of layer configurations
export const layerConfigurations: Record<string, LayerStyle> = {
  // AWS - Orange theme
  aws: {
    bgColor: 'rgba(255, 153, 0, 0.15)',
    borderColor: 'rgba(255, 153, 0, 0.4)',
    color: '#FF9900',
    label: 'AWS Layer'
  },
  
  // Azure - Blue theme
  azure: {
    bgColor: 'rgba(0, 114, 198, 0.15)',
    borderColor: 'rgba(0, 114, 198, 0.4)',
    color: '#0072C6',
    label: 'Azure Layer'
  },
  
  // GCP - Blue theme (different shade than Azure)
  gcp: {
    bgColor: 'rgba(26, 115, 232, 0.15)',
    borderColor: 'rgba(26, 115, 232, 0.4)',
    color: '#1A73E8',
    label: 'GCP Layer'
  },
  
  // Application services - Green theme
  application: {
    bgColor: 'rgba(52, 168, 83, 0.15)',
    borderColor: 'rgba(52, 168, 83, 0.4)',
    color: '#34A853',
    label: 'Application Layer'
  },
  
  // Network - Red theme
  network: {
    bgColor: 'rgba(220, 53, 69, 0.15)',
    borderColor: 'rgba(220, 53, 69, 0.4)',
    color: '#DC3545',
    label: 'Network Layer'
  },
  
  // Client - Made fully transparent to be invisible
  client: {
    bgColor: 'rgba(0, 0, 0, 0)', // Completely transparent
    borderColor: 'rgba(0, 0, 0, 0)', // Completely transparent
    color: 'rgba(0, 0, 0, 0)', // Completely transparent
    label: '' // Empty label
  },
  
  // API Gateway - Azure blue-like theme
  api: {
    bgColor: 'rgba(0, 120, 215, 0.15)',
    borderColor: 'rgba(0, 120, 215, 0.4)',
    color: '#0078D7',
    label: 'API Layer'
  },
  
  // Default - Purple theme (for unknown types)
  default: {
    bgColor: 'rgba(124, 101, 246, 0.1)',
    borderColor: 'rgba(124, 101, 246, 0.3)',
    color: '#7C65F6',
    label: 'Other Services'
  }
};

// Define default layer hierarchy
// This establishes which layers contain other layers
const defaultLayerHierarchy: Record<string, LayerHierarchy> = {
  // Client layer sits at top level
  client: {
    level: 0,
    children: []
  },
  // Application layer can contain API, AWS, Azure, GCP layers
  application: {
    level: 1,
    children: ['api', 'aws', 'azure', 'gcp']
  },
  // API layer can contain services
  api: {
    level: 2,
    parent: 'application',
    children: []
  },
  // Cloud provider layers
  aws: {
    level: 2,
    parent: 'application',
    children: []
  },
  azure: {
    level: 2,
    parent: 'application',
    children: []
  },
  gcp: {
    level: 2,
    parent: 'application',
    children: []
  },
  // Network layer is separate but at same level as application
  network: {
    level: 1,
    children: []
  },
  // Default for anything else
  default: {
    level: 2,
    parent: 'application',
    children: []
  }
};

// Import the getAllIcons function from the correct path
import { getAllIcons } from '@/components/AI/icons/IconsLoader';

// Build a map of node types to categories based on the toolbar items from IconsLoader
const buildNodeTypeMap = (): Record<string, string> => {
  const nodeTypeMap: Record<string, string> = {};
  
  // Get all icons from IconsLoader
  const allToolbarItems = getAllIcons();
  
  // Process each toolbar item
  allToolbarItems.forEach(item => {
    // Use the lowercase category as the layer name
    const category = item.category.toLowerCase();
    
    // Add the item label to the map
    nodeTypeMap[item.label.toLowerCase()] = category;
    
    // Add each tag to the map
    item.tags.forEach(tag => {
      nodeTypeMap[tag.toLowerCase()] = category;
    });
  });
  
  return nodeTypeMap;
};

// Create the mapping once
const nodeTypeToCategory = buildNodeTypeMap();

// Additional keywords for categories (for backward compatibility)
const categoryKeywords: Record<string, string[]> = {
  aws: ['lambda', 'ec2', 's3', 'amazon'],
  azure: [],
  gcp: ['google', 'cloud run'],
  application: ['service', 'microservice', 'function', 'database', 'sql', 'storage', 'cache', 'monitor'],
  network: ['router', 'load_balancer', 'security', 'firewall', 'waf', 'iam'],
  client: ['device', 'user'],
  api: ['gateway']
};

/**
 * Determines which layer a node belongs to based on its type
 * Uses the icon data from IconsLoader.tsx for automatic categorization
 * @param nodeType The type of the node to categorize
 * @returns The layer category key that matches a layerConfigurations entry
 */
export const determineNodeLayer = (nodeType: string | undefined): string => {
  if (!nodeType) return 'default';

  const nodeTypeStr = (nodeType || '').toLowerCase();
  const section = nodeTypeStr.split('_')[0]; // Extract prefix
  
  // Enhanced client detection logic
  // Check for client prefix/section first for better performance
  if (section === 'client' || nodeTypeStr.startsWith('client_')) {
    return 'client';
  }
  
  // Additional client detection based on keywords
  if (nodeTypeStr.includes('client') || 
      nodeTypeStr.includes('mobile_app') ||
      nodeTypeStr.includes('browser') ||
      nodeTypeStr.includes('desktop_app') ||
      nodeTypeStr.includes('iot_device') ||
      nodeTypeStr.includes('kiosk') ||
      nodeTypeStr.includes('user_')) {
    return 'client';
  }
  
  // First, check if the node type is directly mapped in our icon data
  if (nodeTypeToCategory[nodeTypeStr]) {
    return nodeTypeToCategory[nodeTypeStr];
  }
  
  // Second, check if the section/prefix is a known category
  if (Object.keys(layerConfigurations).includes(section)) {
    return section;
  }
  
  // Third, check for keyword matches (backward compatibility)
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    // Check if nodeTypeStr includes the category name itself
    if (nodeTypeStr.includes(category)) {
      return category;
    }
    
    // Check if nodeTypeStr includes any of the keywords for this category
    for (const keyword of keywords) {
      if (nodeTypeStr.includes(keyword)) {
        return category;
      }
    }
  }
  
  // Default fallback
  return 'default';
};

/**
 * Gets styling for different layer types
 * @param layer The layer name to get styles for
 * @returns A LayerStyle object with visual styling properties
 */
export const getLayerStyle = (layer: string): LayerStyle => {
  // First try to get exact match from configurations
  if (layerConfigurations[layer]) {
    return layerConfigurations[layer];
  }
  
  // For backward compatibility, handle legacy layer names
  const legacyMappings: Record<string, string> = {
    'security': 'network',  // Map old 'security' to 'network'
    'cloud': 'aws'          // Map generic 'cloud' to 'aws'
  };
  
  if (legacyMappings[layer] && layerConfigurations[legacyMappings[layer]]) {
    return layerConfigurations[legacyMappings[layer]];
  }
  
  // If no match is found, return default style
  return layerConfigurations.default;
};

/**
 * Determines the layer hierarchy based on the nodes present in the diagram
 * @param nodesByLayer Object mapping layer names to arrays of nodes
 * @returns A record of layer names to their hierarchy information
 */
export const determineLayerHierarchy = (nodesByLayer: Record<string, Node[]>): Record<string, LayerHierarchy> => {
  // Start with the default hierarchy
  const hierarchy = { ...defaultLayerHierarchy };
  
  // Get the layers that have nodes
  const activeLayers = Object.keys(nodesByLayer).filter(layer => 
    nodesByLayer[layer] && nodesByLayer[layer].length > 0
  );
  
  // Ensure all active layers have a hierarchy entry
  activeLayers.forEach(layer => {
    if (!hierarchy[layer]) {
      // If layer not in default hierarchy, add it with sensible defaults
      hierarchy[layer] = {
        level: 2, // Default to application child level
        parent: 'application',
        children: []
      };
    }
  });
  
  // Clear children arrays for active layers to rebuild parent-child relationships
  activeLayers.forEach(layer => {
    hierarchy[layer].children = [];
  });
  
  // Rebuild parent-child relationships based on active layers
  activeLayers.forEach(layer => {
    const parent = hierarchy[layer].parent;
    if (parent && activeLayers.includes(parent)) {
      // Add this layer to its parent's children if both are active
      hierarchy[parent].children.push(layer);
    }
  });
  
  return hierarchy;
};

/**
 * Creates layer container nodes for grouping nodes by layer type
 * @param nodes The nodes to group into layers
 * @returns An array of layer group nodes with proper containment
 */
export const createLayerContainers = (nodes: Node[]): Node[] => {
  if (!nodes || nodes.length === 0) return [];

  // Group nodes by layer
  const nodesByLayer: Record<string, Node[]> = {};
  nodes.forEach(node => {
    // Skip layer containers to avoid recursion
    if (node.type === 'layerGroup') return;
    
    // Skip comment nodes, sticky notes, or nodes with excludeFromLayers flag
    if (
      node.type === 'comment' || 
      node.data?.nodeType === 'stickyNote' || 
      node.data?.isComment === true ||
      node.data?.excludeFromLayers === true
    ) {
      return;
    }

    const nodeType = node.data?.nodeType || 'default';
    const layer = determineNodeLayer(nodeType as string);

    // Enhanced client layer exclusion
    // Skip client layer - don't group client nodes 
    if (layer === 'client' || 
        (typeof nodeType === 'string' && (
          nodeType.toLowerCase().includes('client') || 
          nodeType.toLowerCase().startsWith('client_')
        ))) {
      return;
    }

    if (!nodesByLayer[layer]) nodesByLayer[layer] = [];
    nodesByLayer[layer].push(node);
  });

  // Determine appropriate hierarchy based on active layers
  const layerHierarchy = determineLayerHierarchy(nodesByLayer);
  
  // Sort layers by hierarchy level (top-level first)
  const sortedLayers = Object.entries(nodesByLayer)
    .filter(([_, layerNodes]) => layerNodes.length > 0)
    .sort(([layerA], [layerB]) => {
      return (layerHierarchy[layerA]?.level || 0) - (layerHierarchy[layerB]?.level || 0);
    });
  
  // Calculate layer boundaries - first pass for basic sizing
  const layerBoundaries: Record<string, { minX: number, minY: number, maxX: number, maxY: number, width: number, height: number }> = {};
  
  // First pass: Calculate initial boundaries based on contained nodes
  sortedLayers.forEach(([layer, layerNodes]) => {
    // Find boundaries of all nodes in this layer
    const positions = layerNodes.map(n => n.position);
    
    // Initial boundary calculations with LESS padding than before (tighter fit)
    const padding = 30; // Reduced padding
    const minX = Math.min(...positions.map(p => p.x)) - padding;
    const minY = Math.min(...positions.map(p => p.y)) - padding;

    // Calculate maximum extents using each node's width/height or default values
    const maxX = Math.max(...layerNodes.map(node => {
      const nodeWidth = node.width || 100;
      return node.position.x + nodeWidth;
    })) + padding;
    
    const maxY = Math.max(...layerNodes.map(node => {
      const nodeHeight = node.height || 100;
      return node.position.y + nodeHeight;
    })) + padding;

    const width = maxX - minX;
    const height = maxY - minY;

    layerBoundaries[layer] = { minX, minY, maxX, maxY, width, height };
  });
  
  // Second pass: Adjust child layers to stay within parent boundaries and add spacing
  sortedLayers.forEach(([layer]) => {
    const parentLayer = layerHierarchy[layer]?.parent;
    if (parentLayer && layerBoundaries[parentLayer] && layerBoundaries[layer]) {
      // Get parent boundaries
      const parent = layerBoundaries[parentLayer];
      const current = layerBoundaries[layer];
      
      // Calculate margin between parent and child
      const margin = 30; // Space between parent edge and child edge
      
      // Adjust boundaries to ensure child is inside parent with margin
      // We'll adjust the parent instead to be larger if needed
      if (current.minX < parent.minX + margin) {
        parent.minX = current.minX - margin;
        parent.width = parent.maxX - parent.minX;
      }
      
      if (current.maxX > parent.maxX - margin) {
        parent.maxX = current.maxX + margin;
        parent.width = parent.maxX - parent.minX;
      }
      
      if (current.minY < parent.minY + margin) {
        parent.minY = current.minY - margin;
        parent.height = parent.maxY - parent.minY;
      }
      
      if (current.maxY > parent.maxY - margin) {
        parent.maxY = current.maxY + margin;
        parent.height = parent.maxY - parent.minY;
      }
    }
  });
  
  // Third pass: Ensure sibling layers don't overlap
  // Sort by y-position to handle layers at the same hierarchy level
  const siblingGroups: Record<string, string[]> = {};
  
  // Group layers by their hierarchy level
  Object.entries(layerHierarchy).forEach(([layer, hierarchy]) => {
    if (layerBoundaries[layer]) {
      const level = hierarchy.level.toString(); // Convert number to string for key
      if (!siblingGroups[level]) siblingGroups[level] = [];
      siblingGroups[level].push(layer);
    }
  });
  
  // For each level, make sure siblings don't overlap
  Object.values(siblingGroups).forEach(siblings => {
    if (siblings.length <= 1) return; // No siblings to compare with
    
    // Sort siblings by minY position
    siblings.sort((a, b) => layerBoundaries[a].minY - layerBoundaries[b].minY);
    
    // Check for overlaps and adjust
    for (let i = 1; i < siblings.length; i++) {
      const aboveSibling = siblings[i-1];
      const currentSibling = siblings[i];
      const above = layerBoundaries[aboveSibling];
      const current = layerBoundaries[currentSibling];
      
      // Check for vertical overlap
      if (current.minY < above.maxY) {
        // Move the current layer down
        const offset = above.maxY - current.minY + 20; // 20px gap
        current.minY += offset;
        current.maxY += offset;
      }
    }
  });
  
  // Create container nodes for each layer based on final boundaries
  const layerContainers = sortedLayers.map(([layer, layerNodes]) => {
    // Skip client layer (redundant check, but for safety)
    if (layer === 'client') return null;
    
    // Get style for this layer
    const layerStyle = getLayerStyle(layer);
    const bounds = layerBoundaries[layer];
    
    // Safe hierarchy level for typescript
    const hierarchyLevel = layerHierarchy[layer]?.level || 0;

    return {
      id: `layer-${layer}`,
      type: 'layerGroup',
      position: { x: bounds.minX, y: bounds.minY },
      style: {
        width: bounds.width,
        height: bounds.height,
        backgroundColor: layerStyle.bgColor,
        borderColor: layerStyle.borderColor,
        color: layerStyle.color,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 10,
        zIndex: -5, // Simple z-index, the component will handle display order
        boxShadow: '0 0 10px rgba(0,0,0,0.05)',
      },
      data: {
        label: layerStyle.label,
        nodeType: 'layerGroup',
        layer,
        childNodeIds: layerNodes.map(n => n.id),
        hierarchyLevel: hierarchyLevel
      },
    } as Node;
  }).filter(Boolean) as Node[]; // Filter out any null values

  // Sort containers so parent layers are drawn first (bottom layer)
  return layerContainers.sort((a, b) => {
    const levelA = a.data?.hierarchyLevel as number || 0;
    const levelB = b.data?.hierarchyLevel as number || 0;
    return levelA - levelB;
  });
};

