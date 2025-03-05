
import { Node, Edge } from '@xyflow/react';

// Initial nodes for the diagram
export const diagramNodesState: Node[] = [
  {
    id: 'internet',
    type: 'default',
    position: { x: 50, y: 100 },
    data: { label: 'Internet' },
  },
  {
    id: 'firewall',
    type: 'default',
    position: { x: 200, y: 100 },
    data: { label: 'Firewall' },
  },
  {
    id: 'webserver',
    type: 'default',
    position: { x: 350, y: 50 },
    data: { label: 'Web Server' },
  },
  {
    id: 'appserver',
    type: 'default',
    position: { x: 350, y: 150 },
    data: { label: 'App Server' },
  },
  {
    id: 'database',
    type: 'default',
    position: { x: 500, y: 100 },
    data: { label: 'Database' },
  },
];

// Initial edges for the diagram
export const diagramEdgesState: Edge[] = [
  {
    id: 'internet-firewall',
    source: 'internet',
    target: 'firewall',
    animated: true,
  },
  {
    id: 'firewall-webserver',
    source: 'firewall',
    target: 'webserver',
  },
  {
    id: 'firewall-appserver',
    source: 'firewall',
    target: 'appserver',
  },
  {
    id: 'webserver-appserver',
    source: 'webserver',
    target: 'appserver',
  },
  {
    id: 'appserver-database',
    source: 'appserver',
    target: 'database',
  },
];