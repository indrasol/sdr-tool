import { DiagramStyle } from '../contexts/DiagramStyleContext';

// Icon size mappings for different contexts
export const iconSizes = {
  small: 16,
  medium: 24,
  large: 32,
  xlarge: 48,
  toolbar: 20,
  node: 28,
  header: 24,
  contextual: 32,
};

// Get icon size based on diagram style and context
export const getIconSize = (
  diagramStyle: DiagramStyle,
  context: keyof typeof iconSizes = 'medium'
): number => {
  const baseSize = iconSizes[context];
  
  // Adjust size based on diagram style
  switch (diagramStyle) {
    case 'sketch':
      return Math.round(baseSize * 1.1); // 10% larger for sketch mode
    case 'minimal':
      return Math.round(baseSize * 0.9); // 10% smaller for minimal mode
    case 'professional':
    default:
      return baseSize;
  }
};

// Color mappings for different node categories
export const categoryColors = {
  // Cloud Providers
  aws: '#FF9900',
  azure: '#0078D4',
  gcp: '#4285F4',
  
  // Core categories
  client: '#7C65F6',
  process: '#8B5CF6',
  database: '#1976D2',
  security: '#DC3545',
  network: '#DC3545',
  application: '#34A853',
  storage: '#FF7043',
  queue: '#FFA726',
  cache: '#00ACC1',
  external: '#78909C',
  
  // Extended categories
  api: '#00BCD4',
  authentication: '#F57C00',
  authorization: '#E65100',
  encryption: '#8BC34A',
  firewall: '#F44336',
  load_balancer: '#9C27B0',
  cdn: '#673AB7',
  proxy: '#3F51B5',
  gateway: '#2196F3',
  monitoring: '#009688',
  logging: '#4CAF50',
  backup: '#CDDC39',
  
  // Default
  default: '#7C65F6',
};

// Get color for a node type
export const getNodeColor = (nodeType: string): string => {
  // Direct match
  if (categoryColors[nodeType as keyof typeof categoryColors]) {
    return categoryColors[nodeType as keyof typeof categoryColors];
  }
  
  // Pattern matching for node types
  const lowerNodeType = nodeType.toLowerCase();
  
  // AWS services
  if (lowerNodeType.includes('aws') || 
      lowerNodeType.includes('lambda') || 
      lowerNodeType.includes('s3') ||
      lowerNodeType.includes('ec2') ||
      lowerNodeType.includes('dynamo')) {
    return categoryColors.aws;
  }
  
  // Azure services
  if (lowerNodeType.includes('azure') || 
      lowerNodeType.includes('microsoft')) {
    return categoryColors.azure;
  }
  
  // GCP services
  if (lowerNodeType.includes('gcp') || 
      lowerNodeType.includes('google')) {
    return categoryColors.gcp;
  }
  
  // Database types
  if (lowerNodeType.includes('database') || 
      lowerNodeType.includes('db') ||
      lowerNodeType.includes('sql') ||
      lowerNodeType.includes('storage')) {
    return categoryColors.database;
  }
  
  // Security types
  if (lowerNodeType.includes('security') || 
      lowerNodeType.includes('firewall') ||
      lowerNodeType.includes('auth') ||
      lowerNodeType.includes('encryption')) {
    return categoryColors.security;
  }
  
  // Network types
  if (lowerNodeType.includes('network') || 
      lowerNodeType.includes('router') ||
      lowerNodeType.includes('gateway')) {
    return categoryColors.network;
  }
  
  // Application types
  if (lowerNodeType.includes('application') || 
      lowerNodeType.includes('app') ||
      lowerNodeType.includes('service')) {
    return categoryColors.application;
  }
  
  // Client types
  if (lowerNodeType.includes('client') || 
      lowerNodeType.includes('user') ||
      lowerNodeType.includes('device')) {
    return categoryColors.client;
  }
  
  return categoryColors.default;
};

// Icon filter effects for different diagram styles
export const getIconFilter = (diagramStyle: DiagramStyle): string => {
  switch (diagramStyle) {
    case 'sketch':
      return 'url(#rough-paper) drop-shadow(0 2px 4px rgba(0,0,0,0.15))';
    case 'minimal':
      return 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))';
    case 'professional':
    default:
      return 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))';
  }
};

// Transition styles for animations
export const iconTransitions = {
  gentle: 'all 0.2s ease-in-out',
  smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  bouncy: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  spring: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// Get appropriate transition for diagram style
export const getIconTransition = (diagramStyle: DiagramStyle): string => {
  switch (diagramStyle) {
    case 'sketch':
      return iconTransitions.bouncy;
    case 'minimal':
      return iconTransitions.gentle;
    case 'professional':
    default:
      return iconTransitions.smooth;
  }
}; 