/**
 * Enhanced Iconify Registry for SecureTrack Frontend
 * Provides unified icon system with 1000+ professional icons
 */

// Provider-specific icon mappings
export const providerIconMappings = {
  aws: {
    // Compute
    lambda: 'logos:aws-lambda',
    ec2: 'simple-icons:amazonec2',
    ecs: 'simple-icons:amazonecs',
    fargate: 'simple-icons:awsfargate',
    
    // Storage
    s3: 'simple-icons:amazons3',
    rds: 'simple-icons:amazonrds',
    dynamodb: 'simple-icons:amazondynamodb',
    
    // Security
    iam: 'simple-icons:identity',
    cognito: 'logos:aws-cognito',
    secrets_manager: 'mdi:key-variant',
    
    // Networking
    vpc: 'mdi:cloud-outline',
    cloudfront: 'simple-icons:amazoncloudfront',
    api_gateway: 'logos:aws-api-gateway',
    load_balancer: 'mdi:scale-balance'
  },
  
  azure: {
    // Compute
    app_service: 'simple-icons:microsoftazure',
    functions: 'mdi:function-variant',
    container_instances: 'mdi:kubernetes',
    
    // Storage
    storage_account: 'mdi:database-outline',
    cosmos_db: 'simple-icons:azurecosmosdb',
    
    // Security
    active_directory: 'simple-icons:azureactivedirectory',
    key_vault: 'mdi:key-variant',
    
    // Networking
    virtual_network: 'mdi:cloud-outline',
    application_gateway: 'mdi:gateway',
    traffic_manager: 'mdi:traffic-cone'
  },
  
  gcp: {
    // Compute
    compute_engine: 'logos:google-cloud',
    cloud_functions: 'logos:google-cloud-functions',
    cloud_run: 'logos:google-cloud-run',
    
    // Storage
    cloud_storage: 'logos:google-cloud-storage',
    firestore: 'logos:firebase',
    cloud_sql: 'mdi:database',
    
    // Security
    identity_access: 'mdi:account-key',
    secret_manager: 'mdi:key-variant',
    
    // Networking
    vpc: 'mdi:cloud-outline',
    cloud_cdn: 'mdi:web',
    load_balancer: 'mdi:scale-balance'
  }
};

// Generic category icons
export const categoryIconMappings = {
  // Core categories
  client: 'mdi:monitor-shimmer',
  process: 'mdi:server',
  database: 'mdi:database',
  security: 'mdi:shield-lock',
  network: 'mdi:router-network',
  application: 'mdi:application',
  storage: 'mdi:harddisk',
  queue: 'mdi:queue',
  cache: 'mdi:lightning-bolt',
  external: 'mdi:web',
  
  // Extended categories
  api: 'mdi:api',
  authentication: 'mdi:shield-account',
  authorization: 'mdi:shield-key',
  encryption: 'mdi:lock-outline',
  firewall: 'mdi:security-network',
  load_balancer: 'mdi:scale-balance',
  cdn: 'mdi:web',
  proxy: 'mdi:swap-horizontal',
  gateway: 'mdi:gateway',
  monitoring: 'mdi:chart-line',
  logging: 'mdi:file-document-outline',
  backup: 'mdi:backup-restore',
  
  // Container & Orchestration
  container: 'mdi:kubernetes',
  orchestrator: 'mdi:sitemap',
  scheduler: 'mdi:calendar-clock',
  
  // Data & Analytics
  data_warehouse: 'mdi:warehouse',
  analytics: 'mdi:chart-bar',
  etl: 'mdi:shuffle-variant',
  stream_processing: 'mdi:water',
  
  // Communication
  message_queue: 'mdi:message-processing',
  notification: 'mdi:bell-outline',
  email: 'mdi:email-outline',
  sms: 'mdi:message-text',
  
  // Development
  ci_cd: 'mdi:source-branch',
  testing: 'mdi:test-tube',
  deployment: 'mdi:rocket-launch'
};

// Technology-specific icons
export const technologyIconMappings = {
  // Languages & Frameworks
  nodejs: 'logos:nodejs-icon',
  python: 'logos:python',
  java: 'logos:java',
  dotnet: 'logos:dotnet',
  react: 'logos:react',
  angular: 'logos:angular-icon',
  vue: 'logos:vue',
  
  // Databases
  postgresql: 'logos:postgresql',
  mysql: 'logos:mysql',
  mongodb: 'logos:mongodb',
  redis: 'logos:redis',
  elasticsearch: 'logos:elasticsearch',
  
  // Infrastructure
  docker: 'logos:docker-icon',
  kubernetes: 'logos:kubernetes',
  terraform: 'logos:terraform-icon',
  ansible: 'logos:ansible',
  jenkins: 'logos:jenkins',
  
  // Monitoring & Observability
  prometheus: 'logos:prometheus',
  grafana: 'logos:grafana',
  datadog: 'logos:datadog',
  newrelic: 'logos:new-relic',
  
  // Message Brokers
  kafka: 'logos:apache-kafka',
  rabbitmq: 'logos:rabbitmq-icon',
  
  // Web Servers
  nginx: 'logos:nginx',
  apache: 'logos:apache'
};

// Smart icon resolution function
export const resolveIcon = (
  nodeType: string, 
  provider?: string, 
  technology?: string
): string => {
  // Priority 1: Provider-specific icon
  if (provider && providerIconMappings[provider]?.[nodeType]) {
    return providerIconMappings[provider][nodeType];
  }
  
  // Priority 2: Technology-specific icon
  if (technology && technologyIconMappings[technology]) {
    return technologyIconMappings[technology];
  }
  
  // Priority 3: Direct technology match with nodeType
  if (technologyIconMappings[nodeType]) {
    return technologyIconMappings[nodeType];
  }
  
  // Priority 4: Category icon
  if (categoryIconMappings[nodeType]) {
    return categoryIconMappings[nodeType];
  }
  
  // Priority 5: Fallback based on common patterns
  if (nodeType.includes('database') || nodeType.includes('db')) {
    return categoryIconMappings.database;
  }
  if (nodeType.includes('api') || nodeType.includes('gateway')) {
    return categoryIconMappings.api;
  }
  if (nodeType.includes('auth') || nodeType.includes('security')) {
    return categoryIconMappings.security;
  }
  if (nodeType.includes('load') || nodeType.includes('balancer')) {
    return categoryIconMappings.load_balancer;
  }
  if (nodeType.includes('cache') || nodeType.includes('redis')) {
    return categoryIconMappings.cache;
  }
  
  // Ultimate fallback
  return categoryIconMappings.application;
};

// Icon categories for UI organization
export const iconCategories = {
  'Cloud Providers': ['aws', 'azure', 'gcp'],
  'Compute': ['server', 'container', 'function', 'vm'],
  'Storage': ['database', 'storage', 'cache', 'backup'],
  'Security': ['security', 'authentication', 'authorization', 'encryption', 'firewall'],
  'Network': ['network', 'load_balancer', 'cdn', 'proxy', 'gateway'],
  'Application': ['application', 'api', 'microservice', 'web_app'],
  'Communication': ['queue', 'message_queue', 'notification', 'email'],
  'Monitoring': ['monitoring', 'logging', 'analytics', 'metrics'],
  'Development': ['ci_cd', 'testing', 'deployment', 'source_control']
};

// Preload essential icons for performance
export const preloadIcons = [
  'mdi:server',
  'mdi:database', 
  'mdi:shield-lock',
  'mdi:monitor-shimmer',
  'mdi:application',
  'logos:aws',
  'logos:microsoft-azure',
  'logos:google-cloud',
  'mdi:kubernetes',
  'logos:docker-icon'
];

// Icon size mappings for different contexts
export const iconSizes = {
  small: 16,
  medium: 24,
  large: 32,
  xlarge: 48,
  toolbar: 20,
  node: 28,
  header: 24
};

// Enhanced Iconify Registry (backward compatibility)
export const iconifyRegistry: Record<string, string> = {
  ...categoryIconMappings,
  // Legacy mappings for backward compatibility
  client: 'mdi:monitor-shimmer',
  process: 'mdi:server',
  database: 'mdi:database',
  security: 'mdi:shield-lock',
  network: 'mdi:router-network',
  application: 'mdi:application',
  
  // Specific application services (matching backend)
  chat_service: 'mdi:message-text',
  leaderboard: 'mdi:trophy',
  analytics: 'mdi:chart-line',
  user_auth: 'mdi:shield-account',
  payment_gateway: 'mdi:credit-card',
  monitoring: 'mdi:chart-line',
  encryption_service: 'mdi:lock-outline',
  waf: 'mdi:security-network',
  secrets_manager: 'mdi:key-variant',
  audit_logs: 'mdi:file-document-outline',
  
  // Specific databases
  player_db: 'mdi:database',
  game_db: 'mdi:database',
  leaderboard_db: 'mdi:database',
  chat_db: 'mdi:database',
  
  // Specific services and components
  session_cache: 'mdi:lightning-bolt',
  realtime_engine: 'mdi:rocket-launch',
  matchmaking: 'mdi:account-group',
  game_server: 'mdi:server',
  game_client: 'mdi:gamepad-variant',
  logging: 'mdi:file-document-outline',
  metrics: 'mdi:chart-bar',
  siem: 'mdi:security',
  cdn: 'mdi:web',
  firewall: 'mdi:security-network',
  load_balancer: 'mdi:scale-balance',
  message_queue: 'mdi:message-processing',
  
  // Gaming specific
  game: 'mdi:gamepad-variant',
  player: 'mdi:account-group',
  match: 'mdi:trophy-variant'
};

// Export all mappings for external use
export const enhancedIconifyRegistry = {
  resolve: resolveIcon,
  categories: iconCategories,
  sizes: iconSizes,
  preload: preloadIcons,
  provider: providerIconMappings,
  category: categoryIconMappings,
  technology: technologyIconMappings,
  legacy: iconifyRegistry
};

export default enhancedIconifyRegistry; 