/**
 * API Adapters
 * 
 * Utility functions for transforming backend API responses to frontend-compatible formats.
 * This ensures consistent data structures across the application and handles any
 * discrepancies between backend and frontend data models.
 */
import { Node, Edge } from '@xyflow/react';

/**
 * Interface for backend node structure
 */
interface BackendNode {
  id: string;
  name: string;
  kind: string;
  layer: string;
  description?: string;
  metadata?: {
    layerIndex?: number;
    iconifyId?: string;
    provider?: string;
    technology?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Interface for backend edge structure
 */
interface BackendEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  [key: string]: any;
}

/**
 * Interface for backend group structure
 */
interface BackendGroup {
  id: string;
  name: string;
  type: string;
  member_node_ids: string[];
  [key: string]: any;
}

/**
 * Transforms backend node objects to ReactFlow compatible node objects
 * 
 * @param backendNodes - Array of nodes from the backend API
 * @returns Array of ReactFlow compatible node objects
 */
export function adaptBackendNodes(backendNodes: BackendNode[]): Node[] {
  return backendNodes.map(node => ({
    id: node.id,
    // Default to 'default' type, can be overridden if needed
    type: 'default',
    data: {
      // Basic properties
      label: node.name,
      description: node.description || '',
      nodeType: node.kind,
      
      // Layer and visual properties
      layerIndex: node.metadata?.layerIndex !== undefined 
        ? node.metadata.layerIndex 
        : getDefaultLayerIndex(node.kind),
      iconifyId: node.metadata?.iconifyId || getDefaultIcon(node.kind),
      
      // Cloud provider info if available
      provider: node.metadata?.provider,
      technology: node.metadata?.technology,
      
      // Preserve original properties for reference
      originalLayer: node.layer,
      originalKind: node.kind,
      
      // Pass along any other metadata
      ...node.metadata
    },
    // Position will be determined by layout algorithm
    position: { x: 0, y: 0 }
  }));
}

/**
 * Transforms backend edge objects to ReactFlow compatible edge objects
 * 
 * @param backendEdges - Array of edges from the backend API
 * @returns Array of ReactFlow compatible edge objects
 */
export function adaptBackendEdges(backendEdges: BackendEdge[]): Edge[] {
  return backendEdges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    // Add default styling
    style: { strokeWidth: 2 },
    // Add animated property for data flow edges
    animated: edge.animated || false,
    // Pass through any additional properties
    ...edge
  }));
}

/**
 * Gets the default layer index based on node kind
 */
function getDefaultLayerIndex(kind: string): number {
  const kindToLayerMap: Record<string, number> = {
    'CLIENT': 0,
    'EDGE_NETWORK': 1,
    'IDENTITY': 2,
    'SERVICE': 3,
    'INTEGRATION_MESSAGING': 4,
    'PROCESSING_ANALYTICS': 5,
    'COMPUTE': 5,
    'DATA': 6,
    'OBSERVABILITY': 7,
    'AI_ML': 5,
    'DEV_CI_CD': 3,
    'OTHER': 3
  };
  
  return kindToLayerMap[kind?.toUpperCase()] || 3; // Default to service layer (3)
}

/**
 * Gets the default icon based on node kind
 */
function getDefaultIcon(kind: string): string {
  const kindToIconMap: Record<string, string> = {
    'CLIENT': 'mdi:devices',
    'EDGE_NETWORK': 'mdi:security-network',
    'IDENTITY': 'mdi:shield-lock',
    'SERVICE': 'mdi:cube-outline',
    'INTEGRATION_MESSAGING': 'mdi:message-processing-outline',
    'PROCESSING_ANALYTICS': 'mdi:cog-transfer-outline',
    'COMPUTE': 'mdi:server',
    'DATA': 'mdi:database',
    'OBSERVABILITY': 'mdi:monitor-dashboard',
    'AI_ML': 'mdi:brain',
    'DEV_CI_CD': 'mdi:pipe',
    'OTHER': 'mdi:cube-outline'
  };
  
  return kindToIconMap[kind?.toUpperCase()] || 'mdi:cube-outline';
} 