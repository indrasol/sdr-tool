// mapNodeTypeToIcon.ts
import applicationIcons from '../../AI/icons/ApplicationIcons.json'; // Provided sample
// Assume similar imports for other sections
import awsIcons from '../../AI/icons/AWSIcons.json';
import azureIcons from '../../AI/icons/AzureIcons.json';
import gcpIcons from '../../AI/icons/GCPIcons.json';
import clientIcons from '../../AI/icons/ClientIcons.json';
import networkIcons from '../../AI/icons/NetworkIcons.json';

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
  
  // Database
  'sql_database': 'database_sql',
  'nosql_db': 'database_nosql',
  'database': 'database',
  'cache': 'database_cache',
  'cache_store': 'database_cache',
  
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
    const commonSections = ['network', 'aws', 'azure', 'gcp', 'security', 'application', 'database', 'client'];
    
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