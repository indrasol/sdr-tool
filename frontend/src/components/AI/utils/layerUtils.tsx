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
  
  // Application services - Teal theme
  application: {
    bgColor: 'rgba(0, 150, 136, 0.15)',
    borderColor: 'rgba(0, 150, 136, 0.4)',
    color: '#009688',
    label: 'Application Layer'
  },
  
  // Network - Red theme
  network: {
    bgColor: 'rgba(220, 53, 69, 0.15)',
    borderColor: 'rgba(220, 53, 69, 0.4)',
    color: '#DC3545',
    label: 'Network Layer'
  },
  
  // Client - Transparent/Light theme
  client: {
    bgColor: 'rgba(75, 85, 99, 0.08)',
    borderColor: 'rgba(75, 85, 99, 0.25)',
    color: '#4B5563',
    label: 'Client Layer'
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
 * Creates layer container nodes for grouping nodes by layer type
 * @param nodes The nodes to group into layers
 * @returns An array of layer group nodes
 */
export const createLayerContainers = (nodes: Node[]): Node[] => {
  if (!nodes || nodes.length === 0) return [];

  // Group nodes by layer
  const nodesByLayer: Record<string, Node[]> = {};
  nodes.forEach(node => {
    // Skip layer containers to avoid recursion
    if (node.type === 'layerGroup') return;

    const nodeType = node.data?.nodeType || 'default';
    const layer = determineNodeLayer(nodeType as string);

    if (!nodesByLayer[layer]) nodesByLayer[layer] = [];
    nodesByLayer[layer].push(node);
  });

  // Create container nodes for each layer with nodes
  const layerContainers = Object.entries(nodesByLayer)
    .filter(([_, layerNodes]) => layerNodes.length > 0)
    .map(([layer, layerNodes]) => {
      // Find boundaries of all nodes in this layer
      const positions = layerNodes.map(n => n.position);

      // Calculate container boundaries with padding
      const minX = Math.min(...positions.map(p => p.x)) - 40;
      const minY = Math.min(...positions.map(p => p.y)) - 40;

      // Calculate maximum extents using each node's width/height or default values
      const maxX = Math.max(...layerNodes.map(node => {
        // Use node's width if available, or a default width
        const nodeWidth = node.width || 100;
        return node.position.x + nodeWidth;
      })) + 40;
      
      const maxY = Math.max(...layerNodes.map(node => {
        // Use node's height if available, or a default height
        const nodeHeight = node.height || 100;
        return node.position.y + nodeHeight;
      })) + 40;

      const width = maxX - minX;
      const height = maxY - minY;

      // Get style for this layer
      const layerStyle = getLayerStyle(layer);

      return {
        id: `layer-${layer}`,
        type: 'layerGroup',
        position: { x: minX, y: minY },
        style: {
          width: width,
          height: height,
          backgroundColor: layerStyle.bgColor,
          borderColor: layerStyle.borderColor,
          color: layerStyle.color,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderRadius: 10,
          zIndex: -5,
          boxShadow: '0 0 10px rgba(0,0,0,0.05)',
        },
        data: {
          label: layerStyle.label,
          nodeType: 'layerGroup',
          layer,
          childNodeIds: layerNodes.map(n => n.id),
        },
      } as Node;
    });

  return layerContainers;
};













// import { Node } from '@xyflow/react';

// // Interface for layer style
// export interface LayerStyle {
//   bgColor: string;
//   borderColor: string;
//   color: string;
//   label: string;
// }

// // Define a central registry of layer configurations
// // This maps directly to your icon categories
// export const layerConfigurations: Record<string, LayerStyle> = {
//   // AWS - Orange theme
//   aws: {
//     bgColor: 'rgba(255, 153, 0, 0.15)',  // #FF9900 with transparency
//     borderColor: 'rgba(255, 153, 0, 0.4)', // #FF9900 border with more opacity
//     color: '#FF9900',
//     label: 'AWS Layer'
//   },
  
//   // Azure - Blue theme
//   azure: {
//     bgColor: 'rgba(0, 114, 198, 0.15)',  // #0072C6 with transparency
//     borderColor: 'rgba(0, 114, 198, 0.4)', // Matching Azure blue
//     color: '#0072C6',
//     label: 'Azure Layer'
//   },
  
//   // GCP - Blue theme (different shade than Azure)
//   gcp: {
//     bgColor: 'rgba(26, 115, 232, 0.15)',  // #1A73E8 with transparency
//     borderColor: 'rgba(26, 115, 232, 0.4)', // GCP blue
//     color: '#1A73E8',
//     label: 'GCP Layer'
//   },
  
//   // Application services - Teal theme
//   application: {
//     bgColor: 'rgba(0, 150, 136, 0.15)',  // #009688 with transparency
//     borderColor: 'rgba(0, 150, 136, 0.4)', // Teal
//     color: '#009688',
//     label: 'Application Layer'
//   },
  
//   // Network - Red theme
//   network: {
//     bgColor: 'rgba(220, 53, 69, 0.15)',  // #DC3545 with transparency
//     borderColor: 'rgba(220, 53, 69, 0.4)', // Network red
//     color: '#DC3545',
//     label: 'Network Layer'
//   },
  
//   // Client - Transparent/Light theme
//   client: {
//     bgColor: 'rgba(75, 85, 99, 0.08)',  // Light gray with transparency
//     borderColor: 'rgba(75, 85, 99, 0.25)', // Gray border
//     color: '#4B5563',
//     label: 'Client Layer'
//   },
  
//   // API Gateway - Azure blue-like theme
//   api: {
//     bgColor: 'rgba(0, 120, 215, 0.15)',  // #0078D7 with transparency
//     borderColor: 'rgba(0, 120, 215, 0.4)', // API Gateway blue
//     color: '#0078D7',
//     label: 'API Layer'
//   },
  
//   // Default - Purple theme (for unknown types)
//   default: {
//     bgColor: 'rgba(124, 101, 246, 0.1)',  // #7C65F6 with transparency
//     borderColor: 'rgba(124, 101, 246, 0.3)', // Light purple border
//     color: '#7C65F6',
//     label: 'Other Services'
//   }
// };

// /**
//  * Determines which layer a node belongs to based on its type by matching
//  * it against icon category patterns
//  * @param nodeType The type of the node to categorize
//  * @returns The layer category key that matches a layerConfigurations entry
//  */
// export const determineNodeLayer = (nodeType: string | undefined): string => {
//   if (!nodeType) return 'default';

//   const nodeTypeStr = (nodeType || '').toLowerCase();
//   const section = nodeTypeStr.split('_')[0]; // Extract prefix (e.g., 'aws', 'azure')
  
//   // AWS Layer
//   if (nodeTypeStr.includes('aws') || 
//       nodeTypeStr.includes('lambda') || 
//       nodeTypeStr.includes('ec2') || 
//       nodeTypeStr.includes('s3') ||
//       nodeTypeStr.includes('amazon') ||
//       section === 'aws') {
//     return 'aws';
//   }
  
//   // Azure Layer
//   if (nodeTypeStr.includes('azure') || 
//       section === 'azure') {
//     return 'azure';
//   }
  
//   // GCP Layer
//   if (nodeTypeStr.includes('gcp') || 
//       nodeTypeStr.includes('google') || 
//       nodeTypeStr.includes('cloud run') ||
//       section === 'gcp') {
//     return 'gcp';
//   }
  
//   // Application Layer
//   if (nodeTypeStr.includes('service') ||
//       nodeTypeStr.includes('microservice') ||
//       nodeTypeStr.includes('application') ||
//       nodeTypeStr.includes('function') ||
//       nodeTypeStr.includes('database') ||
//       nodeTypeStr.includes('sql') ||
//       nodeTypeStr.includes('storage') ||
//       nodeTypeStr.includes('cache') ||
//       nodeTypeStr.includes('monitor') ||
//       section === 'application') {
//     return 'application';
//   }
  
//   // Network Layer
//   if (nodeTypeStr.includes('network') ||
//       nodeTypeStr.includes('router') ||
//       nodeTypeStr.includes('load_balancer') ||
//       nodeTypeStr.includes('security') ||
//       nodeTypeStr.includes('firewall') ||
//       nodeTypeStr.includes('waf') ||
//       nodeTypeStr.includes('iam') ||
//       section === 'network') {
//     return 'network';
//   }
  
//   // Client Layer
//   if (nodeTypeStr.includes('client') || 
//       nodeTypeStr.includes('device') || 
//       nodeTypeStr.includes('user') ||
//       section === 'client') {
//     return 'client';
//   }
  
//   // API Layer
//   if (nodeTypeStr.includes('api') || 
//       nodeTypeStr.includes('gateway') ||
//       section === 'api') {
//     return 'api';
//   }
  
//   return 'default';
// };

// /**
//  * Gets styling for different layer types
//  * @param layer The layer name to get styles for
//  * @returns A LayerStyle object with visual styling properties
//  */
// export const getLayerStyle = (layer: string): LayerStyle => {
//   // First try to get exact match from configurations
//   if (layerConfigurations[layer]) {
//     return layerConfigurations[layer];
//   }
  
//   // For backward compatibility, handle legacy layer names
//   const legacyMappings: Record<string, string> = {
//     'security': 'network',  // Map old 'security' to 'network'
//     'cloud': 'aws'          // Map generic 'cloud' to 'aws'
//   };
  
//   if (legacyMappings[layer] && layerConfigurations[legacyMappings[layer]]) {
//     return layerConfigurations[legacyMappings[layer]];
//   }
  
//   // If no match is found, return default style
//   return layerConfigurations.default;
// };

// /**
//  * Creates layer container nodes for grouping nodes by layer type
//  * @param nodes The nodes to group into layers
//  * @returns An array of layer group nodes
//  */
// export const createLayerContainers = (nodes: Node[]): Node[] => {
//   if (!nodes || nodes.length === 0) return [];

//   // Group nodes by layer
//   const nodesByLayer: Record<string, Node[]> = {};
//   nodes.forEach(node => {
//     // Skip layer containers to avoid recursion
//     if (node.type === 'layerGroup') return;

//     const nodeType = node.data?.nodeType || 'default';
//     const layer = determineNodeLayer(nodeType as string);

//     if (!nodesByLayer[layer]) nodesByLayer[layer] = [];
//     nodesByLayer[layer].push(node);
//   });

//   // Create container nodes for each layer with nodes
//   const layerContainers = Object.entries(nodesByLayer)
//     .filter(([_, layerNodes]) => layerNodes.length > 0)
//     .map(([layer, layerNodes]) => {
//       // Find boundaries of all nodes in this layer
//       const positions = layerNodes.map(n => n.position);

//       // Calculate container boundaries with padding
//       const minX = Math.min(...positions.map(p => p.x)) - 40;
//       const minY = Math.min(...positions.map(p => p.y)) - 40;

//       // Create a node map to quickly look up node dimensions
//       const nodeMap = new Map(layerNodes.map(node => [node.id, node]));
      
//       // Calculate maximum extents using each node's width/height or default values
//       const maxX = Math.max(...layerNodes.map(node => {
//         // Use node's width if available, or a default width
//         const nodeWidth = node.width || 100;
//         return node.position.x + nodeWidth;
//       })) + 40;
      
//       const maxY = Math.max(...layerNodes.map(node => {
//         // Use node's height if available, or a default height
//         const nodeHeight = node.height || 100;
//         return node.position.y + nodeHeight;
//       })) + 40;

//       const width = maxX - minX;
//       const height = maxY - minY;

//       // Get style for this layer
//       const layerStyle = getLayerStyle(layer);

//       return {
//         id: `layer-${layer}`,
//         type: 'layerGroup',
//         position: { x: minX, y: minY },
//         style: {
//           width: width,
//           height: height,
//           backgroundColor: layerStyle.bgColor,
//           borderColor: layerStyle.borderColor,
//           color: layerStyle.color,
//           borderWidth: 2, // Increased for better visibility
//           borderStyle: 'dashed', // Changed from dotted for better visibility
//           borderRadius: 10,
//           zIndex: -5, // Ensure it's behind nodes but visible
//           boxShadow: '0 0 10px rgba(0,0,0,0.05)', // Subtle shadow for better visibility
//         },
//         data: {
//           label: layerStyle.label,
//           nodeType: 'layerGroup',
//           layer,
//           childNodeIds: layerNodes.map(n => n.id),
//         },
//       } as Node;
//     });

//   return layerContainers;
// };