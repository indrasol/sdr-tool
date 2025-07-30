/**
 * IRToReactflow adapter
 * 
 * This module provides utilities to work with nodes that have layerIndex 
 * properties for consistent swim-lane based layouts.
 */
import { Node, Edge } from '@xyflow/react';
import { layoutWithELK } from './elkLayout';

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
 * Process nodes to ensure they have valid layerIndex values
 * and prepare them for ELK layout
 */
export const prepareNodesForLayerLayout = (nodes: Node[]): Node[] => {
  // Create a map to track layer assignments
  const layerCounts: Record<number, number> = {};
  
  // Define layer constants
  const LAYER_CLIENT = 0;     // Client-side, browsers, mobile apps
  const LAYER_NETWORK = 1;    // Network components, firewalls, gateways, CDNs
  const LAYER_AUTH = 2;       // Auth services, identity providers, security services
  const LAYER_SERVICES = 3;   // Microservices, APIs, business logic
  const LAYER_MESSAGING = 4;  // Message queues, event buses, streaming
  const LAYER_PROCESSING = 5; // Processing, ETL, analytics
  const LAYER_DATA = 6;       // Databases, storage, caches
  const LAYER_MONITOR = 7;    // Monitoring, logging, observability
  const LAYER_EXTERNAL = 8;   // External services, third-party integrations
  
  // Define layer names for debugging
  const layerNames = {
    [LAYER_CLIENT]: "Client Layer",
    [LAYER_NETWORK]: "Network Layer",
    [LAYER_AUTH]: "Auth Layer",
    [LAYER_SERVICES]: "Service Layer",
    [LAYER_MESSAGING]: "Messaging Layer",
    [LAYER_PROCESSING]: "Processing Layer",
    [LAYER_DATA]: "Data Layer",
    [LAYER_MONITOR]: "Monitoring Layer",
    [LAYER_EXTERNAL]: "External Layer"
  };

  // First pass: Analyze node connections to understand overall topology
  // This helps with placing nodes that could belong to multiple layers
  const connectionMap: Record<string, {
    incomingFrom: Set<string>,
    outgoingTo: Set<string>
  }> = {};

  // Initialize connection map
  nodes.forEach(node => {
    connectionMap[node.id] = {
      incomingFrom: new Set<string>(),
      outgoingTo: new Set<string>()
    };
  });

  // Process edges to create connection map
  nodes.forEach(node => {
    const data = node.data as NodeData;
    
    const outgoingEdges = nodes.filter(n => {
      const targetData = n.data as NodeData;
      return n.id !== node.id && 
        (targetData.sources?.includes(node.id) || targetData.source === node.id);
    });
    
    const incomingEdges = nodes.filter(n => {
      const sourceData = n.data as NodeData;
      return n.id !== node.id && 
        (sourceData.targets?.includes(node.id) || sourceData.target === node.id);
    });
    
    outgoingEdges.forEach(target => {
      connectionMap[node.id].outgoingTo.add(target.id);
      connectionMap[target.id].incomingFrom.add(node.id);
    });
    
    incomingEdges.forEach(source => {
      connectionMap[node.id].incomingFrom.add(source.id);
      connectionMap[source.id].outgoingTo.add(node.id);
    });
  });
  
  // Process each node to ensure it has a valid layerIndex
  return nodes.map(node => {
    const data = node.data as NodeData;
    
    // Skip nodes that already have a valid layerIndex
    if (data?.layerIndex !== undefined) {
      // Count nodes in each layer
      layerCounts[data.layerIndex] = (layerCounts[data.layerIndex] || 0) + 1;
      console.log(`Node ${node.id} (${data?.label || 'unlabeled'}) already has layer ${data.layerIndex}`);
      return node;
    }
    
    // Extract all available data points for classification
    const nodeId = (node.id || '').toLowerCase();
    const nodeType = (data?.nodeType || '').toLowerCase();
    const nodeLabel = (data?.label || '').toLowerCase();
    const nodeDescription = (data?.description || '').toLowerCase();
    const iconifyId = (data?.iconifyId || '').toLowerCase();
    const provider = (data?.provider || '').toLowerCase();
    const technology = (data?.technology || '').toLowerCase();
    
    // Create weighted scoring system for each layer
    const scores = {
      [LAYER_CLIENT]: 0,
      [LAYER_NETWORK]: 0, 
      [LAYER_AUTH]: 0,
      [LAYER_SERVICES]: 0, 
      [LAYER_MESSAGING]: 0,
      [LAYER_PROCESSING]: 0,
      [LAYER_DATA]: 0,
      [LAYER_MONITOR]: 0,
      [LAYER_EXTERNAL]: 0
    };
    
    // Topological scoring - strongly consider node connections
    const hasIncoming = connectionMap[node.id].incomingFrom.size > 0;
    const hasOutgoing = connectionMap[node.id].outgoingTo.size > 0;
    
    // Client layer detection
    if (!hasIncoming && hasOutgoing) {
      // Likely a client - no incoming edges but has outgoing
      scores[LAYER_CLIENT] += 15;
    }
    
    // Data storage layer detection
    if (hasIncoming && !hasOutgoing) {
      // Likely a data store - has incoming but no outgoing
      scores[LAYER_DATA] += 15;
    }
    
    // STRICT NODE TYPE DETECTION - highest priority matching
    
    // First check exact matches with highest weight (50 points)
    
    // Client layer exact matches
    if (nodeType === 'client' || nodeType === 'browser' || nodeType === 'mobile' || nodeType === 'frontend') {
      scores[LAYER_CLIENT] += 50;
    }
    // Network layer exact matches
    else if (nodeType === 'gateway' || nodeType === 'loadbalancer' || nodeType === 'firewall' || nodeType === 'cdn') {
      scores[LAYER_NETWORK] += 50;
    }
    // Auth layer exact matches
    else if (nodeType === 'auth' || nodeType === 'authentication' || nodeType === 'identity') {
      scores[LAYER_AUTH] += 50;
    }
    // Service layer exact matches - most microservices should go here
    else if (nodeType === 'service' || nodeType === 'microservice' || nodeType === 'api') {
      scores[LAYER_SERVICES] += 50;
    }
    // Messaging layer exact matches
    else if (nodeType === 'queue' || nodeType === 'messaging' || nodeType === 'eventbus' || nodeType === 'broker') {
      scores[LAYER_MESSAGING] += 50;
    }
    // Processing layer exact matches
    else if (nodeType === 'processing' || nodeType === 'analytics' || nodeType === 'etl') {
      scores[LAYER_PROCESSING] += 50;
    }
    // Data layer exact matches
    else if (nodeType === 'database' || nodeType === 'storage' || nodeType === 'cache') {
      scores[LAYER_DATA] += 50;
    }
    // Monitoring layer exact matches
    else if (nodeType === 'monitoring' || nodeType === 'logging' || nodeType === 'metrics') {
      scores[LAYER_MONITOR] += 50;
    }
    
    // Check for explicit "Microservice" in the name with category
    if (nodeLabel.includes('microservice')) {
      if (nodeLabel.includes('payment') || nodeLabel.includes('checkout')) {
        scores[LAYER_SERVICES] += 40;
      }
      else if (nodeLabel.includes('chat') || nodeLabel.includes('message') || nodeLabel.includes('notification')) {
        scores[LAYER_MESSAGING] += 40;
      }
      else if (nodeLabel.includes('auth') || nodeLabel.includes('identity')) {
        scores[LAYER_AUTH] += 40;
      }
      else if (nodeLabel.includes('analytics') || nodeLabel.includes('matchmaking')) {
        scores[LAYER_PROCESSING] += 40;
      }
      else {
        // Default microservices to service layer
        scores[LAYER_SERVICES] += 35;
      }
    }
    
    // Specific service patterns in label
    if (nodeLabel.includes('service')) {
      // Special case for common service types
      if (nodeLabel.includes('auth')) {
        scores[LAYER_AUTH] += 25;
      }
      else if (nodeLabel.includes('chat') || nodeLabel.includes('message')) {
        scores[LAYER_MESSAGING] += 25;
      }
      else if (nodeLabel.includes('monitoring') || nodeLabel.includes('logging')) {
        scores[LAYER_MONITOR] += 25;
      }
      else {
        // Default services to service layer
        scores[LAYER_SERVICES] += 20;
      }
    }
    
    // Name-based scoring - check all text fields for indicators
    
    // --- CLIENT LAYER --- //
    if (matchesAny(nodeId, nodeType, nodeLabel, ['client', 'user', 'browser', 'mobile', 'desktop', 'frontend', 'ui', 'interface', 'app', 'react', 'angular', 'vue', 'customer'])) {
      scores[LAYER_CLIENT] += 15;
    }
    
    if (iconifyId.includes('browser') || iconifyId.includes('client') || 
        iconifyId.includes('desktop') || iconifyId.includes('mobile') ||
        iconifyId.includes('user') || iconifyId.includes('frontend')) {
      scores[LAYER_CLIENT] += 10;
    }
    
    // --- NETWORK LAYER --- //
    if (matchesAny(nodeId, nodeType, nodeLabel, ['gateway', 'firewall', 'waf', 'cdn', 'load_balancer', 'loadbalancer', 'proxy', 'router', 'switch', 'network', 'dns', 'vpn', 'ssl', 'tls', 'https', 'ingress', 'perimeter', 'dmz', 'payment gateway'])) {
      scores[LAYER_NETWORK] += 15;
    }
    
    if (iconifyId.includes('gateway') || iconifyId.includes('firewall') || 
        iconifyId.includes('network') || iconifyId.includes('cdn') ||
        iconifyId.includes('proxy') || iconifyId.includes('router')) {
      scores[LAYER_NETWORK] += 10;
    }
    
    // --- AUTH LAYER --- //
    if (matchesAny(nodeId, nodeType, nodeLabel, ['auth', 'authentication', 'authorization', 'identity', 'oauth', 'oidc', 'jwt', 'token', 'login', 'logout', 'sso', 'saml', 'keycloak', 'okta', 'cognito', 'vault', 'secret', 'key', 'certificate', 'password'])) {
      scores[LAYER_AUTH] += 15;
    }
    
    if (iconifyId.includes('auth') || iconifyId.includes('security') || 
        iconifyId.includes('lock') || iconifyId.includes('key') ||
        iconifyId.includes('identity') || iconifyId.includes('password')) {
      scores[LAYER_AUTH] += 10;
    }
    
    // --- SERVICE LAYER --- //
    if (matchesAny(nodeId, nodeType, nodeLabel, ['service', 'api', 'microservice', 'server', 'backend', 'function', 'lambda', 'compute', 'container', 'kubernetes', 'pod', 'endpoint', 'controller', 'game server', 'leaderboard'])) {
      scores[LAYER_SERVICES] += 15;
    }
    
    if (iconifyId.includes('api') || iconifyId.includes('service') || 
        iconifyId.includes('server') || iconifyId.includes('lambda') ||
        iconifyId.includes('function') || iconifyId.includes('container')) {
      scores[LAYER_SERVICES] += 10;
    }
    
    // --- MESSAGING LAYER --- //
    if (matchesAny(nodeId, nodeType, nodeLabel, ['queue', 'topic', 'messaging', 'kafka', 'rabbitmq', 'activemq', 'sqs', 'sns', 'kinesis', 'eventbridge', 'pubsub', 'event', 'bus', 'mq', 'jms', 'broker', 'message', 'stream', 'chat', 'notification'])) {
      scores[LAYER_MESSAGING] += 15;
    }
    
    if (iconifyId.includes('queue') || iconifyId.includes('messaging') || 
        iconifyId.includes('event') || iconifyId.includes('kafka') ||
        iconifyId.includes('rabbit') || iconifyId.includes('bus')) {
      scores[LAYER_MESSAGING] += 10;
    }
    
    // --- PROCESSING LAYER --- //
    if (matchesAny(nodeId, nodeType, nodeLabel, ['ml', 'ai', 'model', 'analytics', 'etl', 'spark', 'hadoop', 'feature', 'processing', 'transformation', 'pipeline', 'dataflow', 'data-flow', 'batch', 'process', 'calculation', 'compute', 'real-time', 'engine', 'matchmaking'])) {
      scores[LAYER_PROCESSING] += 15;
    }
    
    if (iconifyId.includes('analytics') || iconifyId.includes('process') || 
        iconifyId.includes('etl') || iconifyId.includes('transform') ||
        iconifyId.includes('ml') || iconifyId.includes('ai')) {
      scores[LAYER_PROCESSING] += 10;
    }
    
    // --- DATA LAYER --- //
    if (matchesAny(nodeId, nodeType, nodeLabel, ['database', 'db', 'data', 'storage', 'sql', 'nosql', 'mysql', 'postgres', 'mongodb', 'dynamodb', 'cosmos', 'redis', 'cache', 'store', 's3', 'bucket', 'blob', 'file', 'volume', 'persistence', 'oracle', 'elastic', 'index'])) {
      scores[LAYER_DATA] += 15;
    }
    
    if (iconifyId.includes('database') || iconifyId.includes('storage') || 
        iconifyId.includes('db') || iconifyId.includes('sql') ||
        iconifyId.includes('data') || iconifyId.includes('cache')) {
      scores[LAYER_DATA] += 10;
    }
    
    // --- MONITORING LAYER --- //
    if (matchesAny(nodeId, nodeType, nodeLabel, ['monitor', 'logging', 'log', 'metric', 'trace', 'alert', 'observability', 'prometheus', 'grafana', 'kibana', 'splunk', 'cloudwatch', 'datadog', 'sentry', 'newrelic', 'apm', 'dashboard'])) {
      scores[LAYER_MONITOR] += 15;
    }
    
    if (iconifyId.includes('monitor') || iconifyId.includes('log') || 
        iconifyId.includes('chart') || iconifyId.includes('graph') ||
        iconifyId.includes('alert') || iconifyId.includes('dashboard')) {
      scores[LAYER_MONITOR] += 10;
    }
    
    // --- EXTERNAL LAYER --- //
    if (matchesAny(nodeId, nodeType, nodeLabel, ['external', 'third-party', 'third_party', 'integration', 'saas', 'partner', 'vendor', 'provider', 'external-service', 'outside', 'foreign'])) {
      scores[LAYER_EXTERNAL] += 15;
    }
    
    if (iconifyId.includes('external') || iconifyId.includes('saas') || 
        iconifyId.includes('third-party') || iconifyId.includes('integration')) {
      scores[LAYER_EXTERNAL] += 10;
    }
    
    // Apply bonus/penalties based on specific terms in description
    if (nodeDescription) {
      applyScoreBonus(nodeDescription, scores, LAYER_CLIENT, ['frontend', 'user interface', 'ui component']);
      applyScoreBonus(nodeDescription, scores, LAYER_NETWORK, ['network boundary', 'traffic routing', 'perimeter']);
      applyScoreBonus(nodeDescription, scores, LAYER_AUTH, ['authentication', 'identity provider', 'security token']);
      applyScoreBonus(nodeDescription, scores, LAYER_SERVICES, ['business logic', 'api endpoint', 'microservice']);
      applyScoreBonus(nodeDescription, scores, LAYER_MESSAGING, ['message broker', 'event stream', 'async communication']);
      applyScoreBonus(nodeDescription, scores, LAYER_PROCESSING, ['data processing', 'transformation', 'analytics pipeline']);
      applyScoreBonus(nodeDescription, scores, LAYER_DATA, ['data store', 'persistence', 'database']);
      applyScoreBonus(nodeDescription, scores, LAYER_MONITOR, ['monitoring', 'logging system', 'observability']);
      applyScoreBonus(nodeDescription, scores, LAYER_EXTERNAL, ['third party', 'external system', 'integration']);
    }
    
    // Add bonus for technology or provider that clearly indicates layer
    if (technology) {
      applyTechScoring(technology, scores);
    }
    
    if (provider) {
      // Cloud provider databases and storage often go to data layer
      if ((provider === 'aws' || provider === 'azure' || provider === 'gcp') && 
          (nodeType.includes('database') || nodeType.includes('storage'))) {
        scores[LAYER_DATA] += 5;
      }
    }
    
    // Find maximum score
    let maxScore = 0;
    let bestLayer = LAYER_SERVICES; // Default to services layer
    
    Object.entries(scores).forEach(([layer, score]) => {
      const layerNum = parseInt(layer);
      if (score > maxScore) {
        maxScore = score;
        bestLayer = layerNum;
      }
    });
    
    // Special case: if scores are very low, try topology-based assignment
    if (maxScore < 10) {
      // If node has only outgoing connections, likely client/frontend
      if (!hasIncoming && hasOutgoing) {
        bestLayer = LAYER_CLIENT;
      } 
      // If node has only incoming connections, likely data layer
      else if (hasIncoming && !hasOutgoing) {
        bestLayer = LAYER_DATA;
      }
    }
    
    // Count nodes in each layer
    layerCounts[bestLayer] = (layerCounts[bestLayer] || 0) + 1;
    
    console.log(`Assigned ${node.id} (${nodeLabel}) to ${layerNames[bestLayer]} with score ${maxScore}`);
    
    // Set the layerIndex in the node data
    return {
      ...node,
      data: {
        ...data,
        layerIndex: bestLayer
      }
    };
  });
};

/**
 * Helper function to check if any of the search terms match any of the fields
 */
function matchesAny(nodeId: string, nodeType: string, nodeLabel: string, terms: string[]): boolean {
  for (const term of terms) {
    if (nodeId.includes(term) || nodeType.includes(term) || nodeLabel.includes(term)) {
      return true;
    }
  }
  return false;
}

/**
 * Apply score bonus based on terms appearing in text
 */
function applyScoreBonus(text: string, scores: Record<number, number>, layer: number, terms: string[]) {
  for (const term of terms) {
    if (text.includes(term)) {
      scores[layer] += 5;
    }
  }
}

/**
 * Apply technology-specific scoring
 */
function applyTechScoring(technology: string, scores: Record<number, number>) {
  // Client technologies
  const clientTechs = ['react', 'angular', 'vue', 'html', 'css', 'javascript', 'typescript', 'ios', 'android', 'flutter'];
  
  // Data technologies
  const dataTechs = ['mysql', 'postgres', 'mongodb', 'cassandra', 'redis', 'elasticsearch', 'dynamodb', 'cosmosdb'];
  
  // Auth technologies
  const authTechs = ['oauth', 'jwt', 'keycloak', 'okta', 'auth0', 'cognito', 'active-directory'];
  
  // Service technologies
  const serviceTechs = ['spring', 'express', 'django', 'node', 'dotnet', 'java', 'go', 'ruby', 'php'];
  
  // Messaging technologies
  const messagingTechs = ['kafka', 'rabbitmq', 'activemq', 'sns', 'sqs', 'pubsub', 'nats', 'zeromq'];
  
  // Processing technologies
  const processingTechs = ['spark', 'flink', 'hadoop', 'airflow', 'databricks', 'tensorflow', 'pytorch'];
  
  // Monitoring technologies
  const monitoringTechs = ['prometheus', 'grafana', 'datadog', 'splunk', 'elk', 'cloudwatch', 'newrelic'];
  
  // Network technologies
  const networkTechs = ['nginx', 'haproxy', 'istio', 'envoy', 'kong', 'traefik', 'cloudfront'];
  
  // Check each category
  if (clientTechs.some(tech => technology.includes(tech))) {
    scores[0] += 10;
  }
  
  if (networkTechs.some(tech => technology.includes(tech))) {
    scores[1] += 10;
  }
  
  if (authTechs.some(tech => technology.includes(tech))) {
    scores[2] += 10;
  }
  
  if (serviceTechs.some(tech => technology.includes(tech))) {
    scores[3] += 10;
  }
  
  if (messagingTechs.some(tech => technology.includes(tech))) {
    scores[4] += 10;
  }
  
  if (processingTechs.some(tech => technology.includes(tech))) {
    scores[5] += 10;
  }
  
  if (dataTechs.some(tech => technology.includes(tech))) {
    scores[6] += 10;
  }
}

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
    const layerIndex = data?.layerIndex ?? 3; // Default to service layer
    
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
  
  // Enhanced layer labels and styling
  const layerStyles: Record<number, {
    label: string;
    color: string;
    borderColor: string;
    icon: string;
    description: string;
  }> = {
    0: {
      label: 'Client Layer',
      color: 'rgba(221, 242, 253, 0.75)',
      borderColor: 'rgba(91, 156, 221, 0.8)',
      icon: 'mdi:devices',
      description: 'Client applications, user interfaces, and consumer-facing components'
    },
    1: {
      label: 'Network / Security Layer',
      color: 'rgba(255, 240, 219, 0.75)',
      borderColor: 'rgba(237, 174, 73, 0.8)',
      icon: 'mdi:security-network',
      description: 'Network infrastructure, firewalls, load balancers, and security components'
    },
    2: {
      label: 'Authentication Layer',
      color: 'rgba(255, 226, 226, 0.75)',
      borderColor: 'rgba(232, 106, 106, 0.8)',
      icon: 'mdi:shield-lock',
      description: 'Authentication, authorization, and identity management services'
    },
    3: {
      label: 'Service Layer',
      color: 'rgba(230, 255, 230, 0.75)',
      borderColor: 'rgba(113, 190, 113, 0.8)',
      icon: 'mdi:cube-outline',
      description: 'Core business services, APIs, and microservices'
    },
    4: {
      label: 'Messaging Layer',
      color: 'rgba(255, 230, 255, 0.75)',
      borderColor: 'rgba(190, 113, 190, 0.8)',
      icon: 'mdi:message-processing-outline',
      description: 'Message queues, event buses, and asynchronous communication'
    },
    5: {
      label: 'Processing Layer',
      color: 'rgba(255, 255, 225, 0.75)',
      borderColor: 'rgba(215, 215, 90, 0.8)',
      icon: 'mdi:cog-transfer-outline',
      description: 'Data processing, ETL pipelines, and transformation services'
    },
    6: {
      label: 'Data Storage Layer',
      color: 'rgba(225, 240, 255, 0.75)',
      borderColor: 'rgba(90, 153, 215, 0.8)',
      icon: 'mdi:database',
      description: 'Databases, storage systems, caches, and persistence'
    },
    7: {
      label: 'Monitoring Layer',
      color: 'rgba(235, 235, 250, 0.75)',
      borderColor: 'rgba(149, 149, 209, 0.8)',
      icon: 'mdi:monitor-dashboard',
      description: 'Monitoring, logging, metrics, and observability services'
    },
    8: {
      label: 'External Systems Layer',
      color: 'rgba(242, 242, 242, 0.75)',
      borderColor: 'rgba(150, 150, 150, 0.8)',
      icon: 'mdi:web',
      description: 'External services, third-party integrations, and SaaS providers'
    }
  };
  
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
  
  // Calculate available width for proportional distribution
  const diagramWidth = maxDiagramX - minDiagramX;
  
  // Create layer containers with evenly distributed width and proper padding
  sortedLayerIndices.forEach(layerIndex => {
    const bounds = layers[layerIndex];
    
    // Skip layers with no nodes or invalid bounds
    if (bounds.nodes.length === 0 || 
        bounds.minX === Infinity || 
        bounds.minY === Infinity) {
      return;
    }
    
    // Add padding based on layer content
    const nodeCount = bounds.nodes.length;
    const basePadding = 60; // Reduced base padding for tighter layout
    const dynamicPadding = Math.min(15 * Math.log(nodeCount + 1), 60); // Reduced dynamic padding
    const padding = basePadding + dynamicPadding;
    
    // Calculate vertical space needed
    const layerHeight = bounds.maxY - bounds.minY;
    const minLayerHeight = 150; // Minimum height for layer containers
    
    // Get the style for this layer, defaulting if not found
    const style = layerStyles[layerIndex] || {
      label: `Layer ${layerIndex}`,
      color: 'rgba(240, 240, 240, 0.75)',
      borderColor: 'rgba(180, 180, 180, 0.8)',
      icon: 'mdi:layers',
      description: `Layer ${layerIndex} - Contains ${bounds.nodes.length} node(s)`
    };
    
    // Calculate container dimensions based on content
    const containerWidth = bounds.maxX - bounds.minX + (padding * 2);
    const containerHeight = Math.max(layerHeight + (padding * 2) + 36, minLayerHeight);
    
    // Create the layer group node with enhanced styling
    layerGroupNodes.push({
      id: `layer_${layerIndex}`,
      type: 'layerGroup',
      position: {
        x: bounds.minX - padding,
        y: bounds.minY - padding - 36, // Extra space for the header
      },
      style: {
        width: containerWidth,
        height: containerHeight,
        backgroundColor: style.color,
        borderRadius: '12px',
        border: `2px dashed ${style.borderColor}`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        padding: '12px',
        // Create a gradient header effect
        backgroundImage: `linear-gradient(to bottom, ${style.borderColor}22, transparent 70px)`,
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
        // Additional styling info
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
 */
const postProcessNodePositions = (nodes: Node[]): Node[] => {
  // Group nodes by layer
  const nodesByLayer: Record<number, Node[]> = {};
  
  // Find the minimum x position for each layer
  const layerMinX: Record<number, number> = {};
  const layerMaxX: Record<number, number> = {};
  const layerCount: Record<number, number> = {};
  
  // First pass - group nodes and find min/max positions
  nodes.forEach(node => {
    const layerIdx = (node.data as any)?.layerIndex;
    if (layerIdx === undefined) return;
    
    // Initialize arrays and values for this layer
    if (!nodesByLayer[layerIdx]) nodesByLayer[layerIdx] = [];
    if (layerMinX[layerIdx] === undefined) layerMinX[layerIdx] = Infinity;
    if (layerMaxX[layerIdx] === undefined) layerMaxX[layerIdx] = -Infinity;
    if (layerCount[layerIdx] === undefined) layerCount[layerIdx] = 0;
    
    // Add node to layer
    nodesByLayer[layerIdx].push(node);
    layerCount[layerIdx]++;
    
    // Update min/max X positions
    if (node.position) {
      layerMinX[layerIdx] = Math.min(layerMinX[layerIdx], node.position.x);
      layerMaxX[layerIdx] = Math.max(layerMaxX[layerIdx], node.position.x + (node.width || 180));
    }
  });
  
  // Find all unique layer indices and sort them
  const layerIndices = Object.keys(nodesByLayer).map(Number).sort((a, b) => a - b);
  
  // Base horizontal position
  const baseX = 100;
  let currentX = baseX;
  // Reduce horizontal spacing between layers (was 400, now 250)
  const layerSpacing = 250;
  
  // Apply consistent X position for each layer
  layerIndices.forEach(layerIdx => {
    const layerNodes = nodesByLayer[layerIdx];
    if (!layerNodes || layerNodes.length === 0) return;
    
    // Calculate width needed for this layer
    const layerWidth = layerMaxX[layerIdx] - layerMinX[layerIdx];
    
    // Sort nodes by vertical position for better vertical organization
    layerNodes.sort((a, b) => {
      return (a.position?.y || 0) - (b.position?.y || 0);
    });
    
    // Apply offset to all nodes in this layer
    layerNodes.forEach((node, index) => {
      if (!node.position) return;
      
      // Calculate the offset from layer minX
      const offsetX = node.position.x - layerMinX[layerIdx];
      
      // Position the node with consistent X value for the layer
      node.position.x = currentX + offsetX;
      
      // Apply vertical stacking for nodes in same layer
      // Only need y-adjustment if more than 3 nodes in layer
      if (layerNodes.length > 3) {
        // Get node height for spacing calculation
        const nodeHeight = node.height || 50;
        // Default vertical gap between nodes
        const verticalGap = 40;
        // Position nodes vertically based on their order
        node.position.y = 100 + (index * (nodeHeight + verticalGap));
      }
    });
    
    // Move to next layer position
    currentX += Math.max(layerWidth, 200) + layerSpacing;
  });
  
  // Return all nodes
  return nodes;
};

/**
 * Apply layer-based ELK layout to nodes and edges with layerIndex constraints
 */
export const applyLayerLayout = async (
  nodes: Node[], 
  edges: Edge[], 
  direction: 'LR' | 'TB' = 'LR'
): Promise<{ nodes: Node[], edges: Edge[] }> => {
  console.log(`🔄 Applying enhanced layer layout with ${direction} direction for ${nodes.length} nodes...`);
  
  // First ensure all nodes have layer indices
  const layeredNodes = prepareNodesForLayerLayout(nodes);
  
  // Enhanced layout options for better spacing
  const layoutOptions = {
    direction,
    nodeWidth: 180,         // Slightly larger nodes
    nodeHeight: 45,         // Taller nodes
    spacingBetweenLayers: 250, // Reduced horizontal spacing between layers
    spacingWithinLayer: 60,    // More vertical spacing within layers
  };
  
  console.log(`⚙️ Using layout options:`, layoutOptions);
  
  // Apply ELK layout with enhanced options
  const result = await layoutWithELK(layeredNodes, edges, layoutOptions);
  
  // Post-process nodes to ensure consistent layer positioning
  // This helps maintain proper left-to-right ordering by layer index
  const processedNodes = postProcessNodePositions(result.nodes);
  
  // Generate layer group container nodes
  const layerGroups = createLayerGroupNodes(processedNodes);
  
  console.log(`✅ Layer layout complete: ${processedNodes.length} nodes, ${layerGroups.length} layer groups`);
  
  // Combine regular nodes and layer groups
  return {
    nodes: [...processedNodes, ...layerGroups],
    edges: result.edges
  };
}; 