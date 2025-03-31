import { CSSProperties } from 'react';

// Enhanced node styles with better shadows and borders but smaller size
export const nodeDefaults: { style: CSSProperties } = {
  style: {
    border: '1px solid #7C65F6', // Guardian AI purple border
    borderRadius: '5px', // Even smaller border radius
    padding: '4px', // Further reduced padding
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
    backgroundColor: 'white',
    fontSize: '10px', // Smaller font size
    minWidth: '70px', // Smaller minimum width
    maxWidth: '100px', // Smaller max width
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
  
  // AWS specific styling
  if (nodeType.includes('EC2') || nodeType === 'Server') {
    return {
      borderColor: '#ED7615',
      borderLeftWidth: '3px',
    };
  }
  
  if (nodeType.includes('RDS') || nodeType.includes('Database')) {
    return {
      borderColor: '#3046DF',
      borderLeftWidth: '3px',
    };
  }
  
  if (nodeType.includes('S3') || nodeType.includes('Storage')) {
    return {
      borderColor: '#5DA93C',
      borderLeftWidth: '3px',
    };
  }
  
  if (nodeType.includes('CloudFront') || nodeType.includes('CDN')) {
    return {
      borderColor: '#8356DB',
      borderLeftWidth: '3px',
    };
  }
  
  if (nodeType.includes('Lambda') || nodeType.includes('Function')) {
    return {
      borderColor: '#ED7615',
      borderLeftWidth: '3px',
    };
  }
  
  if (nodeType.includes('IAM') || nodeType.includes('Security')) {
    return {
      borderColor: '#D93653',
      borderLeftWidth: '3px',
    };
  }
  
  return {};
};

// Get category-specific styles for node icons but with smaller sizes
export const getCategoryStyle = (category: string): { color: string; bgColor: string } => {
  switch (category) {
    case 'AWS':
      return { color: 'white', bgColor: '#FF9900' };
    case 'Network':
      return { color: 'white', bgColor: '#0078D7' };
    case 'Security':
      return { color: 'white', bgColor: '#D93653' };
    case 'General':
    default:
      return { color: '#7C65F6', bgColor: '#F5F7F9' };
  }
};