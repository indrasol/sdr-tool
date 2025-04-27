import { Node, Edge } from '@xyflow/react';
import { CustomNodeData } from './types/diagramTypes';
import React from 'react';
import { Globe, Shield, Server, Database, Cloud } from 'lucide-react';

// Helper function to create icon renderer function instead of direct JSX
const createIconRenderer = (IconComponent: React.ElementType, bgColor: string) => {
  // Return a function that will be called to create the icon when needed
  return () => {
    // This will be executed in a JSX context (in the CustomNode component)
    return {
      component: IconComponent,
      props: {
        size: 16,
        className: "text-white"
      },
      bgColor: bgColor
    };
  };
};

// Initial nodes for the diagram - now empty by default
export const diagramNodesState: Node<CustomNodeData>[] = [];

// Initial edges for the diagram - now empty by default
export const diagramEdgesState: Edge[] = [];