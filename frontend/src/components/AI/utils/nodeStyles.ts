
import { CSSProperties } from 'react';

// Default node style with Guardian AI purple border
export const nodeDefaults: { style: CSSProperties } = {
  style: {
    border: '1px solid #7C65F6', // Guardian AI purple border
    borderRadius: '8px',
    padding: '10px',
  }
};

// Function to generate a custom shape style if needed
export const getNodeShapeStyle = (nodeType: string): CSSProperties => {
  if (nodeType === 'Circle') {
    return {
      width: 100,
      height: 100,
      borderRadius: '50%',
    };
  }
  
  return {};
};