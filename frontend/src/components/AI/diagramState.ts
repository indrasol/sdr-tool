
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

// Initial nodes for the diagram with proper icons
export const diagramNodesState: Node<CustomNodeData>[] = [
  {
    id: 'internet',
    type: 'default',
    position: { x: 50, y: 100 },
    data: { 
      label: 'Internet',
      category: 'Network',
      nodeType: 'Internet',
      iconRenderer: createIconRenderer(Globe, '#0078D7'),
      description: 'External network connection',
    },
  },
  {
    id: 'firewall',
    type: 'default',
    position: { x: 200, y: 100 },
    data: { 
      label: 'Firewall',
      category: 'Security',
      nodeType: 'Security Group',
      iconRenderer: createIconRenderer(Shield, '#D93653'),
      description: 'Network security protection',
    },
  },
  {
    id: 'webserver',
    type: 'default',
    position: { x: 350, y: 50 },
    data: { 
      label: 'Web Server',
      category: 'AWS',
      nodeType: 'EC2 Instance',
      iconRenderer: createIconRenderer(Server, '#ED7615'),
      description: 'Front-end EC2 instance',
    },
  },
  {
    id: 'appserver',
    type: 'default',
    position: { x: 350, y: 150 },
    data: { 
      label: 'App Server',
      category: 'AWS',
      nodeType: 'EC2 Instance',
      iconRenderer: createIconRenderer(Server, '#ED7615'),
      description: 'Application logic server',
    },
  },
  {
    id: 'database',
    type: 'default',
    position: { x: 500, y: 100 },
    data: { 
      label: 'Database',
      category: 'AWS',
      nodeType: 'RDS',
      iconRenderer: createIconRenderer(Database, '#3046DF'),
      description: 'Data storage layer',
    },
  },
  {
    id: 'cdn',
    type: 'default',
    position: { x: 200, y: 200 },
    data: { 
      label: 'CDN',
      category: 'AWS',
      nodeType: 'CloudFront',
      iconRenderer: createIconRenderer(Cloud, '#8356DB'),
      description: 'Content distribution',
    },
  },
];

// Initial edges for the diagram
export const diagramEdgesState: Edge[] = [
  {
    id: 'internet-firewall',
    source: 'internet',
    target: 'firewall',
    animated: true,
    type: 'default',
  },
  {
    id: 'firewall-webserver',
    source: 'firewall',
    target: 'webserver',
    type: 'secure',
  },
  {
    id: 'firewall-appserver',
    source: 'firewall',
    target: 'appserver',
    type: 'secure',
  },
  {
    id: 'webserver-appserver',
    source: 'webserver',
    target: 'appserver',
    type: 'default',
  },
  {
    id: 'appserver-database',
    source: 'appserver',
    target: 'database',
    type: 'secure',
  },
  {
    id: 'internet-cdn',
    source: 'internet',
    target: 'cdn',
    animated: true,
    type: 'default',
  },
  {
    id: 'cdn-webserver',
    source: 'cdn',
    target: 'webserver',
    type: 'default',
  },
];