import { CSSProperties } from 'react';

// Enhanced node styles with better shadows and borders but smaller size
export const nodeDefaults: { style: CSSProperties } = {
  style: {
    // We're now handling styles in the CustomNode component directly
    // Keep minimal defaults here
    fontSize: '12px',
  }
};

// Function to generate custom styles based on node type
export const getNodeShapeStyle = (nodeType: string): CSSProperties => {
  // Basic shapes
  if (nodeType === 'Circle') {
    return {
      width: 100,
      height: 100,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  }
  
  // We've moved all styling to the customNode component
  return {};
};

// Helper function to check if a node is a database type
const isDatabaseNode = (category: string): boolean => {
  const lowerCategory = category.toLowerCase();
  return lowerCategory.includes('database') || 
         lowerCategory.includes('sql') || 
         lowerCategory.includes('storage');
};

// Get category-specific styles for node icons with color mapping that matches toolbar categories
export const getCategoryStyle = (category: string): { color: string; bgColor: string; borderColor: string } => {
  const lowerCategory = category.toLowerCase();
  
  // AWS Category - Orange
  if (lowerCategory.includes('aws') || lowerCategory.includes('amazon')) {
    return { 
      color: 'white', 
      bgColor: '#FF9900', 
      borderColor: '#F5C375'
    };
  }
  
  // Network Category - Red
  if (lowerCategory.includes('network') || lowerCategory.includes('firewall') || lowerCategory.includes('waf')) {
    return { 
      color: 'white', 
      bgColor: '#DC3545', 
      borderColor: '#E56A76'
    };
  }
  
  // Database nodes - Treat as Application category (teal)
  if (isDatabaseNode(lowerCategory)) {
    return { 
      color: 'white', 
      bgColor: '#009688', 
      borderColor: '#4DB6AC'
    };
  }
  
  // Azure Category - Blue
  if (lowerCategory.includes('azure') || lowerCategory.includes('microsoft')) {
    return { 
      color: 'white', 
      bgColor: '#0072C6', 
      borderColor: '#4A98D6'
    };
  }
  
  // Application/Microservice Category - Teal
  if (lowerCategory.includes('microservice') || lowerCategory.includes('service') || lowerCategory.includes('application')) {
    return { 
      color: 'white', 
      bgColor: '#009688', 
      borderColor: '#4DB6AC'
    };
  }
  
  // GCP Category - Blue
  if (lowerCategory.includes('gcp') || lowerCategory.includes('google')) {
    return { 
      color: 'white', 
      bgColor: '#1A73E8', 
      borderColor: '#5B98ED'
    };
  }
  
  // Client/Device Category - Transparent (icon only)
  if (lowerCategory.includes('client') || lowerCategory.includes('device') || lowerCategory.includes('user')) {
    return { 
      color: 'white', 
      bgColor: 'transparent', 
      borderColor: 'transparent'
    };
  }
  
  // API Gateway - Blue
  if (lowerCategory.includes('api') || lowerCategory.includes('gateway')) {
    return { 
      color: 'white', 
      bgColor: '#0078D7', 
      borderColor: '#4C9FE2'
    };
  }
  
  // Default color scheme - Purple
  return { 
    color: 'white', 
    bgColor: '#7C65F6', 
    borderColor: '#ADA0F9'
  };
};