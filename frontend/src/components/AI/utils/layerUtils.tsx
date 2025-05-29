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
  // Client Zone - Purple theme (transparent as clients are separate)
  client: {
    bgColor: 'rgba(0, 0, 0, 0)', // Completely transparent
    borderColor: 'rgba(0, 0, 0, 0)', // Completely transparent
    color: 'rgba(0, 0, 0, 0)', // Completely transparent
    label: '' // Empty label - clients don't get grouped
  },
  
  // DMZ Layer - Red theme (Network Security Perimeter)
  network: {
    bgColor: 'rgba(220, 53, 69, 0.1)',
    borderColor: 'rgba(220, 53, 69, 0.8)',
    color: '#DC3545',
    label: 'DMZ Layer'
  },
  
  // Application Layer - Green theme (Business Logic)
  application: {
    bgColor: 'rgba(52, 168, 83, 0.1)',
    borderColor: 'rgba(52, 168, 83, 0.8)',
    color: '#34A853',
    label: 'Application Layer'
  },
  
  // Data Layer - Blue theme (Data Storage & Persistence)
  data: {
    bgColor: 'rgba(41, 121, 255, 0.1)',
    borderColor: 'rgba(41, 121, 255, 0.8)',
    color: '#2979FF',
    label: 'Data Layer'
  },
  
  // AWS - Orange theme (positioned by service type)
  aws: {
    bgColor: 'rgba(255, 153, 0, 0.1)',
    borderColor: 'rgba(255, 153, 0, 0.8)',
    color: '#FF9900',
    label: 'AWS Services'
  },
  
  // Azure - Blue theme
  azure: {
    bgColor: 'rgba(0, 114, 198, 0.1)',
    borderColor: 'rgba(0, 114, 198, 0.8)',
    color: '#0072C6',
    label: 'Azure Services'
  },
  
  // GCP - Blue theme (different shade than Azure)
  gcp: {
    bgColor: 'rgba(26, 115, 232, 0.1)',
    borderColor: 'rgba(26, 115, 232, 0.8)',
    color: '#1A73E8',
    label: 'GCP Services'
  },
  
  // Default - Purple theme (for unknown types)
  default: {
    bgColor: 'rgba(124, 101, 246, 0.1)',
    borderColor: 'rgba(124, 101, 246, 0.8)',
    color: '#7C65F6',
    label: 'Other Services'
  }
};

// Define default layer hierarchy
// This establishes which layers contain other layers
const defaultLayerHierarchy: Record<string, LayerHierarchy> = {
  // Client nodes don't get grouped - they're separate
  client: {
    level: 0,
    children: []
  },
  // Network layer (DMZ) - top level
  network: {
    level: 1,
    children: []
  },
  // Application layer - top level
  application: {
    level: 1,
    children: ['aws', 'azure', 'gcp'] // Cloud services can be nested in application
  },
  // Data layer - top level  
  data: {
    level: 1,
    children: []
  },
  // Cloud provider layers as children of application when appropriate
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
  // Default for anything else
  default: {
    level: 2,
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
  application: ['service', 'microservice', 'function', 'monitor'],
  data: ['database', 'sql', 'nosql', 'db', 'storage', 'cache', 'postgresql', 'mongodb', 'redis', 'cassandra', 'mysql', 'databasetype', 'neo4j', 'graph_database'],
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
  
  // CLIENT ZONE - nodes with client_ prefix
  if (section === 'client' || nodeTypeStr.startsWith('client_')) {
    return 'client';
  }
  
  // DMZ LAYER - nodes with network_ prefix  
  if (section === 'network' || nodeTypeStr.startsWith('network_')) {
    return 'network';
  }
  
  // APPLICATION LAYER - nodes with application_ prefix
  if (section === 'application' || nodeTypeStr.startsWith('application_')) {
    return 'application';
  }
  
  // DATA LAYER - nodes with database_ or databasetype_ prefix
  if (section === 'database' || section === 'databasetype' || 
      nodeTypeStr.startsWith('database_') || nodeTypeStr.startsWith('databasetype_')) {
    return 'data';
  }
  
  // CLOUD PROVIDER LAYERS - determine by service type
  if (section === 'aws' || nodeTypeStr.startsWith('aws_')) {
    // Determine AWS service layer based on service type
    if (nodeTypeStr.includes('ec2') || nodeTypeStr.includes('lambda') || 
        nodeTypeStr.includes('beanstalk') || nodeTypeStr.includes('ecs')) {
      return 'application'; // Compute services go in application layer
    } else if (nodeTypeStr.includes('rds') || nodeTypeStr.includes('dynamodb') || 
               nodeTypeStr.includes('redshift') || nodeTypeStr.includes('s3')) {
      return 'data'; // Database services go in data layer
    } else if (nodeTypeStr.includes('cloudfront') || nodeTypeStr.includes('elb') || 
               nodeTypeStr.includes('alb') || nodeTypeStr.includes('vpc')) {
      return 'network'; // Network services go in DMZ layer
    }
    return 'aws'; // Default AWS layer
  }
  
  if (section === 'gcp' || nodeTypeStr.startsWith('gcp_')) {
    // Determine GCP service layer
    if (nodeTypeStr.includes('compute') || nodeTypeStr.includes('run') || 
        nodeTypeStr.includes('functions') || nodeTypeStr.includes('kubernetes')) {
      return 'application';
    } else if (nodeTypeStr.includes('sql') || nodeTypeStr.includes('firestore') || 
               nodeTypeStr.includes('bigquery') || nodeTypeStr.includes('storage')) {
      return 'data';
    } else if (nodeTypeStr.includes('cdn') || nodeTypeStr.includes('load_balancer') || 
               nodeTypeStr.includes('vpc')) {
      return 'network';
    }
    return 'gcp'; // Default GCP layer
  }
  
  if (section === 'azure' || nodeTypeStr.startsWith('azure_')) {
    // Determine Azure service layer
    if (nodeTypeStr.includes('vm') || nodeTypeStr.includes('functions') || 
        nodeTypeStr.includes('app_service') || nodeTypeStr.includes('kubernetes')) {
      return 'application';
    } else if (nodeTypeStr.includes('sql') || nodeTypeStr.includes('cosmos') || 
               nodeTypeStr.includes('storage') || nodeTypeStr.includes('synapse')) {
      return 'data';
    } else if (nodeTypeStr.includes('cdn') || nodeTypeStr.includes('load_balancer') || 
               nodeTypeStr.includes('firewall')) {
      return 'network';
    }
    return 'azure'; // Default Azure layer
  }
  
  // Fallback: Check for keyword matches for backward compatibility
  // But ensure we follow the prefix-based rules first
  
  // Additional client detection
  if (nodeTypeStr.includes('client') || nodeTypeStr.includes('mobile_app') ||
      nodeTypeStr.includes('browser') || nodeTypeStr.includes('desktop_app') ||
      nodeTypeStr.includes('iot_device') || nodeTypeStr.includes('kiosk') ||
      nodeTypeStr.includes('user_')) {
    return 'client';
  }
  
  // Additional database detection
  if (nodeTypeStr.includes('database') || nodeTypeStr.includes('databasetype') ||
      nodeTypeStr.includes('sql') || nodeTypeStr.includes('nosql') || 
      nodeTypeStr.includes('db') || nodeTypeStr.includes('mongo') ||
      nodeTypeStr.includes('redis') || nodeTypeStr.includes('cassandra') ||
      nodeTypeStr.includes('postgresql') || nodeTypeStr.includes('mysql') ||
      nodeTypeStr.includes('neo4j') || nodeTypeStr.includes('graph_database') ||
      nodeTypeStr.includes('time_series') || nodeTypeStr.includes('in_memory')) {
    return 'data';
  }
  
  // Additional network detection
  if (nodeTypeStr.includes('firewall') || nodeTypeStr.includes('router') ||
      nodeTypeStr.includes('load_balancer') || nodeTypeStr.includes('cdn') ||
      nodeTypeStr.includes('waf') || nodeTypeStr.includes('vpn') ||
      nodeTypeStr.includes('proxy')) {
    return 'network';
  }
  
  // Additional application detection
  if (nodeTypeStr.includes('service') || nodeTypeStr.includes('microservice') ||
      nodeTypeStr.includes('server') || nodeTypeStr.includes('api') ||
      nodeTypeStr.includes('gateway') || nodeTypeStr.includes('function') ||
      nodeTypeStr.includes('container') || nodeTypeStr.includes('monitor')) {
    return 'application';
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
    'cloud': 'aws',         // Map generic 'cloud' to 'aws'
    'database': 'data'      // Map 'database' to 'data'
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
        level: 2, // Default to child level
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

  // Group nodes by layer using updated determination logic
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

    // Skip client layer - don't group client nodes (they're separate)
    if (layer === 'client') {
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
  
  // Calculate layer boundaries based on backend positioning rules
  const layerBoundaries: Record<string, { minX: number, minY: number, maxX: number, maxY: number, width: number, height: number }> = {};
  
  // Define expected X ranges for each layer based on LEFT-TO-RIGHT flow
  const layerXRanges: Record<string, { min: number, max: number }> = {
    client: { min: 50, max: 350 },       // CLIENT ZONE (X: 50-350) - LEFTMOST (wider for horizontal spread)
    network: { min: 300, max: 600 },     // DMZ LAYER (X: 300-600) - LEFT-CENTER (wider for horizontal spread)
    application: { min: 550, max: 900 }, // APPLICATION LAYER (X: 550-900) - CENTER (wider for horizontal spread)
    data: { min: 950, max: 1350 },       // DATA LAYER (X: 950-1350) - RIGHTMOST (wider for horizontal spread)
    aws: { min: 550, max: 900 },         // AWS services positioned by type (wider range)
    azure: { min: 550, max: 900 },       // Azure services positioned by type (wider range)
    gcp: { min: 550, max: 900 },         // GCP services positioned by type (wider range)
    default: { min: 550, max: 900 }      // Default to application layer (wider range)
  };
  
   // Calculate boundaries for each layer (LEFT-TO-RIGHT flow)
   sortedLayers.forEach(([layer, layerNodes]) => {
    // Find boundaries of all nodes in this layer
    const positions = layerNodes.map(n => n.position);
    
    // Get expected X range for this layer (LEFT-TO-RIGHT flow)
    const expectedXRange = layerXRanges[layer] || layerXRanges.default;
    
    // Calculate boundaries with proper padding for LR flow
    const padding = 40; // Consistent padding for all layers
    
    // Use expected X range to position layer container properly (horizontal)
    const minX = Math.min(
      Math.min(...positions.map(p => p.x)) - padding,
      expectedXRange.min
    );
    
    const minY = Math.min(...positions.map(p => p.y)) - padding;

    // Calculate maximum extents for LR flow
    const maxX = Math.max(
      Math.max(...layerNodes.map(node => {
        const nodeWidth = node.width || 120;
        return node.position.x + nodeWidth;
      })) + padding,
      expectedXRange.max
    );
    
    const maxY = Math.max(...layerNodes.map(node => {
      const nodeHeight = node.height || 120;
      return node.position.y + nodeHeight;
    })) + padding;

    const width = maxX - minX;
    const height = maxY - minY;

    layerBoundaries[layer] = { minX, minY, maxX, maxY, width, height };
  });
  
  // Ensure proper layer separation based on backend Y ranges
  Object.entries(layerBoundaries).forEach(([layer, bounds]) => {
    const expectedXRange = layerXRanges[layer] || layerXRanges.default;
    
    // Ensure layer container encompasses the expected X range (horizontal)
    if (bounds.minX > expectedXRange.min) {
      bounds.minX = expectedXRange.min;
      bounds.width = bounds.maxX - bounds.minX;
    }
    
    if (bounds.maxX < expectedXRange.max) {
      bounds.maxX = expectedXRange.max;
      bounds.width = bounds.maxX - bounds.minX;
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
        backgroundColor: 'transparent', // Always transparent
        borderColor: layerStyle.borderColor,
        color: layerStyle.color,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 10,
        zIndex: -10, // Ensure layers are behind nodes
        boxShadow: 'none',
      },
      data: {
        label: layerStyle.label,
        nodeType: 'layerGroup',
        layer,
        childNodeIds: layerNodes.map(n => n.id),
        hierarchyLevel: hierarchyLevel
      },
    } as Node;
  }).filter(Boolean) as Node[];

  // Sort containers so parent layers are drawn first (bottom layer)
  return layerContainers.sort((a, b) => {
    const levelA = a.data?.hierarchyLevel as number || 0;
    const levelB = b.data?.hierarchyLevel as number || 0;
    return levelA - levelB;
  });
};

