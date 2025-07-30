/**
 * Layer Themes
 * 
 * Defines beautiful tinted colors for each layer type that perfectly match
 * the backend layer assignments from taxonomy.
 */

export interface LayerTheme {
  label: string;
  color: string;
  borderColor: string;
  icon: string;
  description: string;
}

export const layerThemes: Record<number, LayerTheme> = {
  // Layer 0: CLIENT - lightish grey tint
  0: {
    label: 'Client Layer',
    color: 'rgba(240, 240, 245, 0.75)',
    borderColor: 'rgba(180, 180, 190, 0.8)',
    icon: 'mdi:devices',
    description: 'Client applications, user interfaces, and consumer-facing components'
  },
  
  // Layer 1: EDGE_NETWORK - lightish red tint
  1: {
    label: 'Network / Edge Layer',
    color: 'rgba(255, 230, 230, 0.75)',
    borderColor: 'rgba(235, 140, 140, 0.8)',
    icon: 'mdi:security-network',
    description: 'Network infrastructure, firewalls, load balancers, and security components'
  },
  
  // Layer 2: IDENTITY - lightish purple tint
  2: {
    label: 'Identity Layer',
    color: 'rgba(240, 230, 255, 0.75)',
    borderColor: 'rgba(180, 150, 220, 0.8)',
    icon: 'mdi:shield-lock',
    description: 'Authentication, authorization, and identity management services'
  },
  
  // Layer 3: SERVICE - lightish green tint
  3: {
    label: 'Service Layer',
    color: 'rgba(230, 255, 230, 0.75)',
    borderColor: 'rgba(110, 190, 110, 0.8)',
    icon: 'mdi:cube-outline',
    description: 'Core business services, APIs, and microservices'
  },
  
  // Layer 4: INTEGRATION_MESSAGING - lightish orange tint
  4: {
    label: 'Messaging Layer',
    color: 'rgba(255, 240, 225, 0.75)',
    borderColor: 'rgba(235, 170, 110, 0.8)',
    icon: 'mdi:message-processing-outline',
    description: 'Message queues, event buses, and asynchronous communication'
  },
  
  // Layer 5: PROCESSING_ANALYTICS/COMPUTE - lightish amber tint
  5: {
    label: 'Processing Layer',
    color: 'rgba(255, 250, 220, 0.75)',
    borderColor: 'rgba(230, 190, 100, 0.8)',
    icon: 'mdi:cog-transfer-outline',
    description: 'Data processing, ETL pipelines, and transformation services'
  },
  
  // Layer 6: DATA - lightish blue tint
  6: {
    label: 'Data Storage Layer',
    color: 'rgba(225, 240, 255, 0.75)',
    borderColor: 'rgba(100, 160, 220, 0.8)',
    icon: 'mdi:database',
    description: 'Databases, storage systems, caches, and persistence'
  },
  
  // Layer 7: OBSERVABILITY - lightish teal tint
  7: {
    label: 'Monitoring Layer',
    color: 'rgba(225, 250, 245, 0.75)',
    borderColor: 'rgba(100, 200, 180, 0.8)',
    icon: 'mdi:monitor-dashboard',
    description: 'Monitoring, logging, metrics, and observability services'
  },
  
  // Layer 8: AI_ML - lightish indigo tint
  8: {
    label: 'AI/ML Layer',
    color: 'rgba(230, 235, 255, 0.75)',
    borderColor: 'rgba(130, 140, 220, 0.8)',
    icon: 'mdi:brain',
    description: 'AI models, machine learning systems, and intelligent components'
  },
  
  // Layer 9: DEV_CI_CD - lightish pink tint
  9: {
    label: 'DevOps Layer',
    color: 'rgba(255, 235, 245, 0.75)',
    borderColor: 'rgba(220, 150, 190, 0.8)',
    icon: 'mdi:pipe',
    description: 'CI/CD pipelines, build systems, and deployment infrastructure'
  },
  
  // Layer 10: OTHER - lightish brown tint
  10: {
    label: 'Other Components',
    color: 'rgba(245, 240, 235, 0.75)',
    borderColor: 'rgba(190, 170, 150, 0.8)',
    icon: 'mdi:layers',
    description: 'Miscellaneous components that don\'t fit other categories'
  }
};

/**
 * Gets the theme for a given layer index, with fallback
 */
export function getLayerTheme(layerIndex?: number): LayerTheme {
  if (layerIndex !== undefined && layerIndex in layerThemes) {
    return layerThemes[layerIndex];
  }
  
  // Default to service layer (3)
  return layerThemes[3];
}

export default layerThemes; 