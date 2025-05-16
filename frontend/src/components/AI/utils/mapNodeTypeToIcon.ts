// mapNodeTypeToIcon.ts
import applicationIcons from '../../AI/icons/ApplicationIcons.json'; // Provided sample
// Assume similar imports for other sections
import awsIcons from '../../AI/icons/AWSIcons.json';
import azureIcons from '../../AI/icons/AzureIcons.json';
import gcpIcons from '../../AI/icons/GCPIcons.json';
import clientIcons from '../../AI/icons/ClientIcons.json';
import networkIcons from '../../AI/icons/NetworkIcons.json';
// Add imports for database icons
import databaseIcons from '../../AI/icons/DatabaseIcons.json';
import databaseTypeIcons from '../../AI/icons/DatabaseTypeIcons.json';

interface IconData {
  name: string;
  description: string;
  icon_url: string;
}

interface IconMapping {
  [key: string]: string; // nodeType -> icon_url
}

// Combine all section icons into a single mapping
const iconMappings: IconMapping = {
  ...applicationIcons.application.reduce((acc: IconMapping, icon: IconData) => {
    acc[icon.name.replace('application_', '')] = icon.icon_url; // e.g., "database" -> URL
    return acc;
  }, {}),
  ...awsIcons.aws.reduce((acc: IconMapping, icon: IconData) => {
    acc[icon.name.replace('aws_', '')] = icon.icon_url; // e.g., "ec2" -> URL
    return acc;
  }, {}),
  ...azureIcons.azure.reduce((acc: IconMapping, icon: IconData) => {
    acc[icon.name.replace('application_', '')] = icon.icon_url;
    return acc;
  }, {}),
  ...gcpIcons.gcp.reduce((acc: IconMapping, icon: IconData) => {
    acc[icon.name.replace('aws_', '')] = icon.icon_url; 
    return acc;
  }, {}),
  ...clientIcons.client.reduce((acc: IconMapping, icon: IconData) => {
    acc[icon.name.replace('aws_', '')] = icon.icon_url; 
    return acc;
  }, {}),
  ...networkIcons.network.reduce((acc: IconMapping, icon: IconData) => {
    acc[icon.name.replace('aws_', '')] = icon.icon_url; 
    return acc;
  }, {}),
  // Add database icons
  ...databaseIcons.database.reduce((acc: IconMapping, icon: IconData) => {
    acc[icon.name.replace('database_', '')] = icon.icon_url;
    // Also keep full name for exact matches
    acc[icon.name] = icon.icon_url;
    return acc;
  }, {}),
  // Add database type icons
  ...databaseTypeIcons.databasetype.reduce((acc: IconMapping, icon: IconData) => {
    acc[icon.name.replace('databasetype_', '')] = icon.icon_url;
    // Also keep full name for exact matches
    acc[icon.name] = icon.icon_url;
    return acc;
  }, {}),
};

// Add common name aliases for better matching
const nodeTypeAliases: Record<string, string> = {
  // Networking
  'firewall': 'network_firewall',
  'network_firewall': 'network_firewall',
  'load_balancer': 'network_load_balancer',
  'router': 'network_router',
  'gateway': 'network_gateway',
  'proxy': 'network_proxy',
  'reverse_proxy': 'network_proxy',
  'cdn': 'network_cdn',
  
  // Security
  'waf': 'security_waf',
  'security_firewall': 'network_firewall',
  
  // Application
  'api_gateway': 'application_api_gateway',
  'application_api_gateway': 'application_api_gateway',
  'api_service': 'application_api',
  'web_server': 'application_web_server',
  'app_server': 'application_server',
  'microservice': 'application_microservice',
  
  // Database (add detailed aliases for databases)
  'sql_database': 'database_sql_database',
  'nosql_db': 'database_nosql_database',
  'nosql_database': 'database_nosql_database',
  'database': 'database_mysql', // Default database icon
  'cache': 'database_redis_cache',
  'cache_store': 'database_redis_cache',
  'redis': 'database_redis_cache',
  'mysql': 'database_mysql',
  'postgresql': 'database_postgresql',
  'postgres': 'database_postgresql',
  'mongodb': 'database_mongodb',
  'cassandra': 'database_cassandra',
  'elasticsearch': 'database_elasticsearch',
  'neo4j': 'database_neo4j',
  'graph_database': 'databasetype_graph_database',
  'sql_server': 'database_sql_server',
  'couchdb': 'database_couchdb',
  'mariadb': 'database_mariadb',
  'oracle': 'database_oracledb',
  'time_series': 'databasetype_time_series_database',
  'influxdb': 'database_influxdb',
  'timescaledb': 'database_timescaledb',
  'in_memory_database': 'databasetype_in_memory_database',
  'key_value_store': 'database_redis_cache',
  'column_store': 'databasetype_columnar_store',
  'multi_model': 'databasetype_multi_model_database',
  
  // Client
  'client': 'client_device',
  'mobile': 'client_mobile',
  'browser': 'client_browser',
  'user': 'client_user',
  
  // Cloud
  'vm': 'application_vm',
  'function': 'application_function',
  'lambda': 'aws_lambda',
  'container': 'application_container',
  'kubernetes': 'application_kubernetes',
  
  // Monitoring
  'monitoring': 'monitoring',
  'log': 'logging',
  'logging': 'logging'
};

// Add direct application icon mappings for key components to ensure they're found
// This helps with cases where the normal icon lookup might fail
const directIconMappings: Record<string, string> = {};

// Find specific icon URLs and add them to direct mappings
applicationIcons.application.forEach((icon: IconData) => {
  // Add API Gateway mapping (handle both with and without application_ prefix)
  if (icon.name === 'application_api_gateway' || icon.name === 'api_gateway') {
    directIconMappings['api_gateway'] = icon.icon_url;
    directIconMappings['application_api_gateway'] = icon.icon_url;
  }
});

// Add direct mappings for database icons
databaseIcons.database.forEach((icon: IconData) => {
  const simpleName = icon.name.replace('database_', '');
  directIconMappings[simpleName] = icon.icon_url;
  // Also store the full name for exact matches
  directIconMappings[icon.name] = icon.icon_url;
});

// Add direct mappings for database type icons
databaseTypeIcons.databasetype.forEach((icon: IconData) => {
  const simpleName = icon.name.replace('databasetype_', '');
  directIconMappings[simpleName] = icon.icon_url;
  // Also store the full name for exact matches
  directIconMappings[icon.name] = icon.icon_url;
});

// Add database icon color mappings
const databaseIconColors: Record<string, string> = {
  'database_mongodb': '#4DB33D', // MongoDB green
  'database_postgresql': '#336791', // PostgreSQL blue
  'database_redis_cache': '#D82C20', // Redis red
  'database_mysql': '#00758F', // MySQL blue
  'database_cassandra': '#1287B1', // Cassandra blue
  'database_neo4j': '#008CC1', // Neo4j blue
  'database_elasticsearch': '#FEC514', // Elasticsearch yellow
  'database_influxdb': '#22ADF6', // InfluxDB blue
  'sqlite': '#044a64', // SQLite blue
  'database_couchdb': '#E42528', // CouchDB red
  // Default database color
  'database': '#1976D2' // Generic database blue
};

// Add application icon color mappings
const applicationIconColors: Record<string, string> = {
  'application_api_gateway': '#34A853', // API Gateway green
  'application_microservice': '#000000', // Microservice black (changed from green)
  'application_web_server': '#34A853', // Web server green
  'application_server': '#34A853', // Server green
  'application_function': '#34A853', // Function green
  'application_container': '#34A853', // Container green
  'application_kubernetes': '#34A853', // Kubernetes green
  // Default application color
  'application': '#34A853' // Generic application green
};

// Add network icon color mappings
const networkIconColors: Record<string, string> = {
  'network_firewall': '#DC3545', // Firewall red
  'network_router': '#DC3545', // Router red
  'network_load_balancer': '#DC3545', // Load Balancer red
  'network_vpn': '#DC3545', // VPN red
  'network_gateway': '#DC3545', // Gateway red
  'network_proxy': '#DC3545', // Proxy red
  'network_cdn': '#DC3545', // CDN red
  'network_waf': '#DC3545', // WAF red
  // Default network color
  'network': '#DC3545' // Generic network red
};

// Add client icon color mappings
const clientIconColors: Record<string, string> = {
  'client_browser': '#7C65F6', // Browser purple
  'client_mobile': '#7C65F6', // Mobile purple
  'client_user': '#7C65F6', // User purple
  'client_device': '#7C65F6', // Device purple
  'client_desktop': '#7C65F6', // Desktop purple
  'client_tablet': '#7C65F6', // Tablet purple
  // Default client color
  'client': '#7C65F6' // Generic client purple
};

// Utility function to map nodeType to icon URL
export const mapNodeTypeToIcon = (nodeType: string): string | null => {
  if (!nodeType) {
    console.warn('mapNodeTypeToIcon received empty nodeType');
    return null;
  }

  // Handle different formats - try both the exact match and a lowercase match
  const normalizedType = nodeType.toLowerCase();
  console.log('Looking up icon for nodeType:', nodeType, 'normalized:', normalizedType);
  
  // Try direct icon mappings first (for priority components like API Gateway)
  if (directIconMappings[normalizedType]) {
    console.log('Found direct mapping for:', normalizedType, directIconMappings[normalizedType]);
    return directIconMappings[normalizedType];
  }
  
  // Special styling for network types
  if (normalizedType.includes('network') || 
      normalizedType.includes('firewall') || 
      normalizedType.includes('router') ||
      normalizedType.includes('security')) {
    
    // Find matching network icon
    for (const [netType, color] of Object.entries(networkIconColors)) {
      if (normalizedType.includes(netType.replace('network_', ''))) {
        console.log(`Found network match for ${normalizedType}: ${netType}`);
        // For specific network types, add a data attribute for styling
        if (directIconMappings[netType]) {
          const url = directIconMappings[netType];
          console.log(`Using direct icon URL for ${netType}: ${url}`);
          return `<div class="network-icon" data-net-type="${netType}" style="width:100%;height:100%;">
                    <img src="${url}" 
                         style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0px 2px 4px rgba(0,0,0,0.2));" 
                         alt="${netType.replace('network_', '')}" />
                  </div>`;
        }
      }
    }
  }
  
  // Special styling for application types - update microservice to black
  if (normalizedType.includes('application') || 
      normalizedType.includes('service') || 
      normalizedType.includes('gateway') ||
      normalizedType.includes('server')) {
    
    // Find matching application icon
    for (const [appType, color] of Object.entries(applicationIconColors)) {
      if (normalizedType.includes(appType.replace('application_', ''))) {
        console.log(`Found application match for ${normalizedType}: ${appType}`);
        
        // Special case for microservices
        if (appType === 'application_microservice' || normalizedType.includes('microservice')) {
          console.log('Using black color for microservice');
          
          if (directIconMappings[appType]) {
            const url = directIconMappings[appType];
            return `<div class="application-icon" data-app-type="${appType}" style="width:100%;height:100%;">
                      <img src="${url}" 
                           style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0px 2px 4px rgba(0,0,0,0.3));color:#000000;" 
                           alt="${appType.replace('application_', '')}" />
                    </div>`;
          }
        }
        
        // For other application types, add a data attribute for styling
        if (directIconMappings[appType]) {
          const url = directIconMappings[appType];
          console.log(`Using direct icon URL for ${appType}: ${url}`);
          return `<div class="application-icon" data-app-type="${appType}" style="width:100%;height:100%;">
                    <img src="${url}" 
                         style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0px 2px 4px rgba(0,0,0,0.2));" 
                         alt="${appType.replace('application_', '')}" />
                  </div>`;
        }
      }
    }
  }
  
  // Special styling for database types
  if (normalizedType.includes('database') || 
      normalizedType.includes('sql') || 
      normalizedType.includes('mongodb') ||
      normalizedType.includes('redis') ||
      normalizedType.includes('cassandra')) {
    
    // Find matching database icon
    for (const [dbType, color] of Object.entries(databaseIconColors)) {
      if (normalizedType.includes(dbType.replace('database_', ''))) {
        console.log(`Found database match for ${normalizedType}: ${dbType}`);
        // For specific db types, add a data attribute for styling
        if (directIconMappings[dbType]) {
          const url = directIconMappings[dbType];
          console.log(`Using direct icon URL for ${dbType}: ${url}`);
          return `<div class="database-icon" data-db-type="${dbType}" style="width:100%;height:100%;">
                    <img src="${url}" 
                         style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0px 2px 4px rgba(0,0,0,0.2));" 
                         alt="${dbType.replace('database_', '')}" />
                  </div>`;
        }
      }
    }
  }
  
  // Special handling for Database types
  if (normalizedType.includes('database')) {
    // Check for database type first
    if (normalizedType.includes('type') || 
        normalizedType.includes('sql') || 
        normalizedType.includes('nosql') ||
        normalizedType.includes('graph') ||
        normalizedType.includes('time_series') ||
        normalizedType.includes('in_memory')) {
      
      // Try to find in database type icons
      for (const key of Object.keys(iconMappings)) {
        if (key.includes('databasetype_') && key.includes(normalizedType.replace('database', '').trim())) {
          console.log('Found database type match:', key, iconMappings[key]);
          return iconMappings[key];
        }
      }
    }
    
    // Try specific database matches
    const dbTypes = ['mysql', 'postgresql', 'mongodb', 'redis', 'cassandra', 'neo4j', 'elasticsearch'];
    for (const dbType of dbTypes) {
      if (normalizedType.includes(dbType)) {
        const dbKey = `database_${dbType}`;
        if (iconMappings[dbKey]) {
          console.log('Found specific database match:', dbKey, iconMappings[dbKey]);
          return iconMappings[dbKey];
        }
      }
    }
  }
  
  // For API Gateway specific handling
  if (normalizedType === 'api_gateway' || normalizedType === 'application_api_gateway' || 
      normalizedType.includes('api') && normalizedType.includes('gateway')) {
    // First try application icons
    const apiGatewayIcon = applicationIcons.application.find(
      (icon: IconData) => icon.name === 'application_api_gateway' || icon.name.includes('api_gateway')
    );
    
    if (apiGatewayIcon) {
      console.log('Found API Gateway icon:', apiGatewayIcon.icon_url);
      return apiGatewayIcon.icon_url;
    }
    
    // Fallback to network icons
    const networkApiIcon = networkIcons.network.find(
      (icon: IconData) => icon.name === 'network_api_gateway' || icon.name.includes('api_gateway')
    );
    
    if (networkApiIcon) {
      console.log('Found network API icon as fallback:', networkApiIcon.icon_url);
      return networkApiIcon.icon_url;
    }
  }
  
  // Try exact match first (in case of network_firewall format)
  if (iconMappings[normalizedType]) {
    console.log('Found exact match for:', normalizedType, iconMappings[normalizedType]);
    return iconMappings[normalizedType];
  }
  
  // Try alias match if exists
  if (nodeTypeAliases[normalizedType]) {
    const aliasKey = nodeTypeAliases[normalizedType];
    console.log('Found alias match:', normalizedType, '→', aliasKey);
    if (iconMappings[aliasKey]) {
      console.log('Icon found via alias:', aliasKey, iconMappings[aliasKey]);
      return iconMappings[aliasKey];
    }
  }
  
  // If exact match fails, try to handle "network firewall" format by removing spaces
  const noSpacesType = normalizedType.replace(/\s+/g, '_');
  if (iconMappings[noSpacesType]) {
    console.log('Found match after removing spaces:', noSpacesType, iconMappings[noSpacesType]);
    return iconMappings[noSpacesType];
  }
  
  // Also try splitting by sections to handle "Network Firewall" -> "network_firewall"
  const words = normalizedType.split(/[\s_]+/).filter(Boolean);
  
  if (words.length > 1) {
    // Try common section prefixes like "network", "aws", "application"
    const commonSections = ['network', 'aws', 'azure', 'gcp', 'security', 'application', 'database', 'databasetype', 'client'];
    
    for (const section of commonSections) {
      if (words[0] === section || words.includes(section)) {
        // Form keys like "network_firewall" from "Network Firewall"
        const componentKey = `${section}_${words.join('_').replace(section, '').replace(/^_+|_+$/g, '')}`;
        console.log('Trying section-based key:', componentKey);
        
        if (iconMappings[componentKey]) {
          console.log('Found section-based match:', componentKey, iconMappings[componentKey]);
          return iconMappings[componentKey];
        }
      }
    }
  }
  
  // Database-specific check (try with different formats)
  if (normalizedType.includes('database') || 
      normalizedType.includes('sql') || 
      normalizedType.includes('nosql') ||
      normalizedType.includes('db')) {
    // Try different variations
    const variations = [
      'database_mysql',            // Default database
      'database_postgresql',
      'database_mongodb',
      'database_redis_cache',
      'databasetype_sql_database', // General SQL database
      'databasetype_nosql_database' // General NoSQL database
    ];
    
    for (const variation of variations) {
      if (iconMappings[variation]) {
        console.log('Found database variation match:', variation, iconMappings[variation]);
        return iconMappings[variation];
      }
    }
  }
  
  // API Gateway specific check (try with different formats)
  if (normalizedType.includes('api') && normalizedType.includes('gateway')) {
    // Try different variations
    const variations = [
      'api_gateway',
      'application_api_gateway',
      'network_api_gateway',
      'apigateway'
    ];
    
    for (const variation of variations) {
      if (iconMappings[variation]) {
        console.log('Found API Gateway variation match:', variation, iconMappings[variation]);
        return iconMappings[variation];
      }
    }
  }
  
  // Special styling for client types
  if (normalizedType.includes('client') || 
      normalizedType.includes('browser') || 
      normalizedType.includes('mobile') ||
      normalizedType.includes('user') ||
      normalizedType.includes('device')) {
    
    // Find matching client icon
    for (const [clientType, color] of Object.entries(clientIconColors)) {
      if (normalizedType.includes(clientType.replace('client_', ''))) {
        console.log(`Found client match for ${normalizedType}: ${clientType}`);
        // For specific client types, add a data attribute for styling
        if (directIconMappings[clientType]) {
          const url = directIconMappings[clientType];
          console.log(`Using direct icon URL for ${clientType}: ${url}`);
          return `<div class="client-icon" data-client-type="${clientType}" style="width:100%;height:100%;">
                    <img src="${url}" 
                         style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0px 2px 5px rgba(124, 101, 246, 0.35));" 
                         alt="${clientType.replace('client_', '')}" />
                  </div>`;
        }
      }
    }
  }
  
  // Final fallback: log available keys for debugging
  console.log('No icon found for:', nodeType);
  console.log('Available icon keys (sample):', Object.keys(iconMappings).slice(0, 10));
  
  // If we have an iconMapping for "firewall" and the nodeType includes "firewall", use that
  // This is a special case for common components
  for (const key of Object.keys(iconMappings)) {
    if (normalizedType.includes(key)) {
      console.log('Found partial match:', key, iconMappings[key]);
      return iconMappings[key];
    }
  }
  
  return null; // No match found
};