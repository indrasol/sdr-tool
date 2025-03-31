// Create a new file: src/components/AI/DFDVisualization.tsx

import React, { useMemo, useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls, 
  useNodesState,
  useEdgesState,
  MiniMap,
  Panel,
  Node,
  Edge,
  MarkerType,
  Position,
  Handle
} from '@xyflow/react';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, 
  Shield, 
  AlertTriangle, 
  Info, 
  Maximize, 
  Database, 
  User, 
  Server, 
  Globe,
  ArrowRightCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { DFDData, DFDThreat } from '../../interfaces/aiassistedinterfaces';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import '@xyflow/react/dist/style.css';

interface NodeData {
  label: string;
  description?: string;
  nodeType?: string;
  threats?: DFDThreat[];
}

interface ProcessNodeProps {
  data: NodeData;
  selected: boolean;
}

// Custom node components for DFD elements
const ProcessNode: React.FC<ProcessNodeProps> = ({ data, selected }) => (
  <div className={`relative flex flex-col items-center justify-center w-[80px] h-[80px] rounded-full bg-blue-100 border ${selected ? 'border-blue-500 border-2' : 'border-blue-300'}`}>
    <Server className="h-5 w-5 text-blue-500 mb-1" />
    <div className="text-center text-xs font-medium max-w-[70px] break-words">
      {data.label}
    </div>
    {data.threats && data.threats.length > 0 && (
      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs border border-white">
        {data.threats.length}
      </div>
    )}
    <Handle
      id="processInput"
      type="target"
      position={Position.Left}
      className="w-1.5 h-1.5 border-2 border-blue-500 bg-white"
    />
    <Handle
      id="processOutput"
      type="source"
      position={Position.Right}
      className="w-1.5 h-1.5 border-2 border-blue-500 bg-white"
    />
  </div>
);

const EntityNode: React.FC<ProcessNodeProps> = ({ data, selected }) => (
  <div className={`relative flex flex-col items-center justify-center w-[100px] h-[60px] bg-gray-100 border ${selected ? 'border-blue-500 border-2' : 'border-gray-300'}`}>
    <User className="h-5 w-5 text-gray-500 mb-1" />
    <div className="text-center text-xs font-medium max-w-[80px] break-words">
      {data.label}
    </div>
    {data.threats && data.threats.length > 0 && (
      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs border border-white">
        {data.threats.length}
      </div>
    )}
    <Handle
      id="entityInput"
      type="target"
      position={Position.Left}
      className="w-1.5 h-1.5 border-2 border-gray-500 bg-white"
    />
    <Handle
      id="entityOutput"
      type="source"
      position={Position.Right}
      className="w-1.5 h-1.5 border-2 border-gray-500 bg-white"
    />
  </div>
);

const DataStoreNode: React.FC<ProcessNodeProps> = ({ data, selected }) => (
  <div className={`relative flex flex-col items-center justify-center w-[100px] h-[60px] bg-cyan-100 border ${selected ? 'border-blue-500 border-2' : 'border-cyan-300'}`}>
    <Database className="h-5 w-5 text-cyan-600 mb-1" />
    <div className="text-center text-xs font-medium max-w-[80px] break-words">
      {data.label}
    </div>
    {data.threats && data.threats.length > 0 && (
      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs border border-white">
        {data.threats.length}
      </div>
    )}
    <Handle
      id="datastoreInput"
      type="target"
      position={Position.Left}
      className="w-1.5 h-1.5 border-2 border-cyan-600 bg-white"
    />
    <Handle
      id="datastoreOutput"
      type="source"
      position={Position.Right}
      className="w-1.5 h-1.5 border-2 border-cyan-600 bg-white"
    />
  </div>
);

const ExternalNode: React.FC<ProcessNodeProps> = ({ data, selected }) => (
  <div className={`relative flex flex-col items-center justify-center w-[100px] h-[60px] bg-purple-100 border ${selected ? 'border-blue-500 border-2' : 'border-purple-300'}`}>
    <Globe className="h-5 w-5 text-purple-600 mb-1" />
    <div className="text-center text-xs font-medium max-w-[80px] break-words">
      {data.label}
    </div>
    {data.threats && data.threats.length > 0 && (
      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs border border-white">
        {data.threats.length}
      </div>
    )}
    <Handle
      id="externalInput"
      type="target"
      position={Position.Left}
      className="w-1.5 h-1.5 border-2 border-purple-600 bg-white"
    />
    <Handle
      id="externalOutput" 
      type="source"
      position={Position.Right}
      className="w-1.5 h-1.5 border-2 border-purple-600 bg-white"
    />
  </div>
);

const BoundaryNode: React.FC<ProcessNodeProps> = ({ data, selected }) => (
  <div className={`relative flex items-center justify-center w-full h-full ${selected ? 'border-red-500' : 'border-red-300'} border-2 border-dashed rounded-lg`}>
    <div className="absolute -top-3 left-3 bg-white px-2 py-0.5 text-xs font-bold text-red-500 uppercase tracking-wider">
      {data.label}
    </div>
  </div>
);

// Define interface
interface DFDVisualizationProps {
  dfdData: DFDData;
  reactFlowInstanceRef?: React.MutableRefObject<any>;
}

// FlowLegend component - displayed in the bottom left
const FlowLegend: React.FC<{ edges: Edge[], nodes: Node[] }> = ({ edges, nodes }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Skip edges without labels or with non-string labels
  const edgesWithLabels = edges.filter(edge => {
    // Look for label in edge.data.label first, then edge.label
    const label = edge.data?.label || edge.label;
    return label && typeof label === 'string' && label.trim() !== '';
  });
  
  // Create a map of node IDs to node labels for quick lookup
  const nodeLabels = new Map();
  nodes.forEach(node => {
    // For node data that contains a label property
    if (node.data && node.data.label) {
      nodeLabels.set(node.id, node.data.label);
    } else {
      // Fallback to node ID if no label is found
      nodeLabels.set(node.id, node.id);
    }
  });
  
  // Group edges by source-target pair to avoid duplicates
  const uniqueFlows = new Map();
  
  edgesWithLabels.forEach(edge => {
    const key = `${edge.source}-${edge.target}`;
    // Keep only the first occurrence of each source-target pair
    if (!uniqueFlows.has(key)) {
      // Get source and target labels from the nodeLabels map
      const sourceLabel = nodeLabels.get(edge.source) || 'Unknown';
      const targetLabel = nodeLabels.get(edge.target) || 'Unknown';
      
      // Use edge.data.label if available, otherwise fall back to edge.label
      const label = edge.data?.label || edge.label;
      
      uniqueFlows.set(key, {
        id: edge.id,
        label,
        source: edge.source,
        target: edge.target,
        sourceLabel,
        targetLabel,
        encrypted: edge.animated,
      });
    }
  });
  
  // Convert map to array
  const flowsList = Array.from(uniqueFlows.values());
  
  if (flowsList.length === 0) return null;
  
  return (
    <div className="absolute bottom-2 left-2 z-10 bg-white rounded-lg shadow-md overflow-hidden">
      <div 
        className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="text-xs font-bold flex items-center">
          <ArrowRightCircle className="w-3 h-3 mr-1.5 text-purple-600" />
          Data Flows ({flowsList.length})
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          {isCollapsed ? 
            <ChevronUp className="w-4 h-4" /> : 
            <ChevronDown className="w-4 h-4" />
          }
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="p-3 max-h-64 overflow-auto">
          <div className="space-y-3">
            {flowsList.map(flow => (
              <div key={flow.id} className="text-xs group">
                <div className="flex items-center gap-2 pb-1">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${flow.encrypted ? 'bg-green-500' : 'bg-purple-500'}`} />
                  <div className="font-medium">{flow.label}</div>
                </div>
                <div className="text-gray-500 text-[10px] ml-4.5 pl-0.5 border-l-2 border-gray-200 group-hover:border-purple-200 px-2">
                  <span className="font-medium text-gray-700">{flow.sourceLabel}</span> 
                  {" → "} 
                  <span className="font-medium text-gray-700">{flow.targetLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DFDVisualization: React.FC<DFDVisualizationProps> = ({ dfdData, reactFlowInstanceRef }) => {
  const { toast } = useToast();
  const localReactFlowInstance = useRef(null);
  const [layoutApplied, setLayoutApplied] = useState(false);
  const isLayoutingRef = useRef(false);

  // Use the passed ref if available, otherwise use the local one
  const actualReactFlowInstance = reactFlowInstanceRef || localReactFlowInstance;

  // Add a style tag to globally hide all edge labels
  React.useEffect(() => {
    // Create and inject a style tag that hides all edge labels
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      .react-flow__edge-text-wrapper,
      .react-flow__edge-text,
      .react-flow__edge-textbg {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(styleTag);
    
    // Clean up the style tag on component unmount
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  if (!dfdData || !dfdData.threat_model_id) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Threat Model Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Switch back to Architecture Diagram mode and design your system first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data from dfdData
  const { nodes: dfdNodes = [], edges: dfdEdges = [], boundaries = [], threats = [] } = dfdData;
  
  console.log('DFD Data:', { nodes: dfdNodes, edges: dfdEdges, boundaries, threats });

  // Generate nodes from DFD data
  const initialNodes = useMemo(() => {
    const result = [];
    
    // If no nodes are provided but we have edges, extract nodes from edge connections
    if (dfdNodes.length === 0 && dfdEdges.length > 0) {
      console.log('No nodes provided, generating nodes from edges');
      
      // Extract unique node IDs from all edges
      const uniqueNodeIds = new Set();
      dfdEdges.forEach(edge => {
        if (edge.source) uniqueNodeIds.add(edge.source);
        if (edge.target) uniqueNodeIds.add(edge.target);
      });
      
      console.log('Unique node IDs extracted from edges:', uniqueNodeIds);
      
      // Create default trust boundaries
      if (boundaries.length === 0) {
        // Add DMZ boundary
        result.push({
          id: 'boundary-dmz',
          type: 'boundaryNode',
          position: { x: 50, y: 50 },
          style: { 
            width: 400, 
            height: 300,
            zIndex: -1
          },
          data: {
            label: 'DMZ',
            elements: ['Firewall', 'Web Server', 'CDN']
          }
        });
        
        // Add Internal Network boundary
        result.push({
          id: 'boundary-internal',
          type: 'boundaryNode',
          position: { x: 300, y: 150 },
          style: { 
            width: 500, 
            height: 350,
            zIndex: -1
          },
          data: {
            label: 'Internal Network',
            elements: ['App Server', 'API Service', 'Database']
          }
        });
      } else {
        // If we have boundaries, add them
        boundaries.forEach((boundary, index) => {
          // Find all element positions to determine boundary size
          const elementIds = boundary.element_ids || [];
          if (elementIds.length === 0) return;
          
          result.push({
            id: `boundary-${boundary.id}`,
            type: 'boundaryNode',
            position: { x: 100 + index * 150, y: 100 + index * 50 },
            style: { 
              width: 600, 
              height: 400,
              zIndex: -1
            },
            data: {
              label: boundary.label || 'Trust Boundary',
              elements: elementIds
            }
          });
        });
      }
      
      // Convert unique node IDs to nodes with appropriate types
      Array.from(uniqueNodeIds).forEach((nodeId, index) => {
        const id = String(nodeId);
        
        // Determine node type based on naming conventions
        let type = 'processNode';
        const lowerCaseId = id.toLowerCase();
        
        if (lowerCaseId.includes('user') || 
            lowerCaseId.includes('client') || 
            lowerCaseId.includes('browser') || 
            lowerCaseId.includes('actor')) {
          type = 'entityNode';
        } 
        else if (lowerCaseId.includes('database') || 
                lowerCaseId.includes('db') || 
                lowerCaseId.includes('store') || 
                lowerCaseId.includes('credential')) {
          type = 'dataStoreNode';
        }
        else if (lowerCaseId.includes('internet') || 
                lowerCaseId.includes('external') || 
                lowerCaseId.includes('third-party') || 
                lowerCaseId.includes('cdn')) {
          type = 'externalNode';
        }
        
        // Create initial grid positions
        const xPos = 200 + (index % 3) * 250;
        const yPos = 200 + Math.floor(index / 3) * 150;
        
        result.push({
          id,
          type,
          // Use sourcePosition and targetPosition for better edge connections
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          position: { x: xPos, y: yPos },
          data: {
            label: id.replace(/([A-Z])/g, ' $1').trim(), // Add spaces before capital letters
            description: '',
            nodeType: type,
            threats: []
          }
        });
      });
    } else {
      // Original code for when nodes are provided
      
      // First add boundaries, so they go to the back
      boundaries.forEach((boundary, index) => {
        // Find all element positions to determine boundary size
        const elementIds = boundary.element_ids || [];
        if (elementIds.length === 0) return;
        
        // For now, create a large boundary as a placeholder
        result.push({
          id: `boundary-${boundary.id}`,
          type: 'boundaryNode',
          position: { x: 100 + index * 150, y: 100 + index * 50 },
          style: { 
            width: 600, 
            height: 400,
            zIndex: -1
          },
          data: {
            label: boundary.label || 'Trust Boundary',
            elements: elementIds
          }
        });
      });
      
      // Add other nodes with appropriate types
      dfdNodes.forEach((node, index) => {
        const nodeType = (node.type || '').toLowerCase();
        
        let type = 'processNode';
        if (nodeType.includes('actor') || nodeType.includes('user') || nodeType.includes('client') || nodeType.includes('browser')) {
          type = 'entityNode';
        } else if (nodeType.includes('datastore') || nodeType.includes('database') || nodeType.includes('store') || nodeType.includes('credential')) {
          type = 'dataStoreNode';
        } else if (nodeType.includes('external') || nodeType.includes('third-party') || nodeType.includes('internet')) {
          type = 'externalNode';
        }
        
        // Place nodes in a grid layout initially
        const xPos = 200 + (index % 3) * 250;
        const yPos = 200 + Math.floor(index / 3) * 150;
        
        // Filter threats targeting this node
        const nodeThreats = threats.filter(t => t.target_element_id === node.id);
        
        result.push({
          id: node.id,
          type,
          // Use sourcePosition and targetPosition for better edge connections
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          position: { x: xPos, y: yPos },
          data: {
            label: node.label,
            description: node.properties?.description || '',
            nodeType: node.type,
            threats: nodeThreats
          }
        });
      });
    }
    
    console.log('Generated nodes:', result);
    return result;
  }, [dfdNodes, dfdEdges, boundaries, threats]);

  // Generate edges from DFD data
  const initialEdges = useMemo(() => {
    const result = [];
    
    // Map to track duplicate edge IDs
    const seenIds = new Set();
    
    // Helper function to get standard handle IDs based on node type
    const getStandardHandleIds = (nodeType) => {
      switch(nodeType) {
        case 'entityNode':
          return { source: 'entityOutput', target: 'entityInput' };
        case 'dataStoreNode':
          return { source: 'datastoreOutput', target: 'datastoreInput' };
        case 'externalNode':
          return { source: 'externalOutput', target: 'externalInput' };
        case 'processNode':
        default:
          return { source: 'processOutput', target: 'processInput' };
      }
    };
    
    // Get node type map for quick lookups
    const nodeTypeMap = {};
    initialNodes.forEach(node => {
      nodeTypeMap[node.id] = node.type;
    });
    
    dfdEdges.forEach((edge, index) => {
      // Validate edge has source and target
      if (!edge.source || !edge.target) {
        console.warn('Invalid edge missing source or target:', edge);
        return;
      }
      
      // Ensure a unique ID by checking if we've seen this ID already
      let uniqueId = edge.id;
      if (seenIds.has(uniqueId)) {
        // If we've seen this ID before, create a new unique ID with an index
        let counter = 1;
        while (seenIds.has(`${edge.id}-${counter}`)) {
          counter++;
        }
        uniqueId = `${edge.id}-${counter}`;
      }
      seenIds.add(uniqueId);
      
      // Extract properties for label
      const props = edge.properties || {};
      const protocol = props.protocol ? `${props.protocol}` : '';
      const encrypted = props.isEncrypted ? '(Encrypted)' : '';
      const label = edge.label || (protocol ? `${protocol} ${encrypted}` : 'Data Flow');
      
      // Get node types for source and target
      const sourceType = nodeTypeMap[edge.source] || 'processNode';
      const targetType = nodeTypeMap[edge.target] || 'processNode';
      
      // Get appropriate handle IDs
      const sourceHandles = getStandardHandleIds(sourceType);
      const targetHandles = getStandardHandleIds(targetType);
      
      result.push({
        id: uniqueId,
        source: edge.source,
        target: edge.target,
        sourceHandle: sourceHandles.source,
        targetHandle: targetHandles.target,
        // Store the label in the data property for the legend instead of directly on the edge
        data: {
          ...props,
          label, // Store label here for the legend to use
          threats: threats.filter(t => t.target_element_id === edge.id)
        },
        // Don't set any label property at all - completely omit it
        // label: null,
        // Set all styling related to labels to ensure they don't appear
        style: {
          stroke: props.isEncrypted ? '#10B981' : '#6B7280',
          strokeWidth: 2,
        },
        // Remove all label-related properties from the edge
        labelBgPadding: [0, 0],
        labelBgBorderRadius: 0,
        labelStyle: { display: 'none', fontSize: 0, opacity: 0 },
        labelBgStyle: { display: 'none', opacity: 0, fill: 'transparent' },
        labelShowBg: false,
        type: 'smoothstep',
        animated: !!props.isEncrypted,
        markerEnd: { 
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15
        }
      });
    });
    
    console.log('Generated edges with proper handles:', result);
    return result;
  }, [dfdEdges, threats, initialNodes]);

  // Create node state hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Define node types for the diagram
  const nodeTypes = useMemo(
    () => ({
      processNode: ProcessNode,
      entityNode: EntityNode,
      dataStoreNode: DataStoreNode,
      externalNode: ExternalNode,
      boundaryNode: BoundaryNode,
    }),
    []
  );

  // Handle fit view
  const onFitView = useCallback(() => {
    if (actualReactFlowInstance.current) {
      actualReactFlowInstance.current.fitView({ padding: 0.2 });
    }
  }, [actualReactFlowInstance]);

  // Auto layout the diagram
  const onLayout = useCallback(() => {
    if (!nodes.length || layoutApplied || isLayoutingRef.current) return;
    
    isLayoutingRef.current = true;
    toast({
      title: "Auto Layout",
      description: "Applying automatic layout to the diagram."
    });
    
    // Create a better layout - position entities on left, datastores on right
    const entityNodes = nodes.filter(n => n.type === 'entityNode' || n.type === 'externalNode');
    const processNodes = nodes.filter(n => n.type === 'processNode');
    const datastoreNodes = nodes.filter(n => n.type === 'dataStoreNode');
    const boundaryNodes = nodes.filter(n => n.type === 'boundaryNode');
    
    // Create a new array with updated nodes
    const newNodes = [...nodes];
    
    // Initialize default positions
    let leftY = 150;
    let centerY = 150;
    let rightY = 150;
    
    // Position external node like "Internet" at the top left
    const internetNode = entityNodes.find(n => n.id.toLowerCase().includes('internet'));
    if (internetNode) {
      const internetNodeIndex = newNodes.findIndex(n => n.id === internetNode.id);
      if (internetNodeIndex !== -1) {
        newNodes[internetNodeIndex] = {
          ...newNodes[internetNodeIndex],
          position: { x: 100, y: 100 }
        };
        leftY = 250; // Start other entity nodes below this
      }
    }
    
    // Position entities on the left side
    entityNodes
      .filter(n => n !== internetNode)
      .forEach((node, i) => {
        const index = newNodes.findIndex(n => n.id === node.id);
        if (index !== -1) {
          newNodes[index] = {
            ...newNodes[index],
            position: { x: 100, y: leftY + i * 100 }
          };
        }
      });
    
    // Position processes in the center
    processNodes.forEach((node, i) => {
      const index = newNodes.findIndex(n => n.id === node.id);
      if (index !== -1) {
        newNodes[index] = {
          ...newNodes[index],
          position: { x: 400, y: centerY + i * 120 }
        };
      }
    });
    
    // Position datastores on the right
    datastoreNodes.forEach((node, i) => {
      const index = newNodes.findIndex(n => n.id === node.id);
      if (index !== -1) {
        newNodes[index] = {
          ...newNodes[index],
          position: { x: 700, y: rightY + i * 100 }
        };
      }
    });
    
    // Position boundaries to encompass their elements
    boundaryNodes.forEach((boundary) => {
      const elementIds = boundary.data?.elements || [];
      if (elementIds.length === 0) return;
      
      // Find all nodes within this boundary
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      
      // Find the bounding box of all nodes in this boundary
      newNodes.forEach(node => {
        if (elementIds.includes(node.id)) {
          const nodeWidth = node.type === 'processNode' ? 80 : 100;
          const nodeHeight = node.type === 'processNode' ? 80 : 60;
          
          minX = Math.min(minX, node.position.x - 20);
          minY = Math.min(minY, node.position.y - 20);
          maxX = Math.max(maxX, node.position.x + nodeWidth + 20);
          maxY = Math.max(maxY, node.position.y + nodeHeight + 20);
        }
      });
      
      // Set boundary position and size if we found at least one element
      if (minX !== Infinity) {
        const boundaryIndex = newNodes.findIndex(n => n.id === boundary.id);
        if (boundaryIndex !== -1) {
          newNodes[boundaryIndex] = {
            ...newNodes[boundaryIndex],
            position: { x: minX, y: minY },
            style: {
              ...newNodes[boundaryIndex].style,
              width: maxX - minX,
              height: maxY - minY,
              zIndex: -1
            }
          };
        }
      }
    });
    
    // Update nodes in a batch update instead of individual mutations
    setNodes(newNodes);
    
    // Set the layout applied flag to prevent repeated layouts
    setTimeout(() => {
      if (actualReactFlowInstance.current) {
        actualReactFlowInstance.current.fitView({ padding: 0.2 });
      }
      setLayoutApplied(true);
      isLayoutingRef.current = false;
    }, 100);
  }, [nodes, setNodes, toast, layoutApplied, actualReactFlowInstance]);

  // Group threats by severity
  const highThreats = threats.filter(t => (t.severity || '').toLowerCase() === 'high');
  const mediumThreats = threats.filter(t => (t.severity || '').toLowerCase() === 'medium');
  const lowThreats = threats.filter(t => (t.severity || '').toLowerCase() === 'low');

  // Auto-layout on first render
  React.useEffect(() => {
    if (!layoutApplied && nodes.length > 0) {
      // Small delay before initial layout to ensure all nodes are properly initialized
      const timer = setTimeout(() => {
        onLayout();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [onLayout, nodes.length, layoutApplied]);

  return (
    <div className="h-full w-full relative">
      {/* Stats panel */}
      <div className="absolute top-2 left-2 z-10 bg-white rounded-lg shadow-md p-3 flex gap-3">
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
          <span className="text-xs font-medium">High: {highThreats.length}</span>
        </div>
        <div className="flex items-center">
          <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
          <span className="text-xs font-medium">Medium: {mediumThreats.length}</span>
        </div>
        <div className="flex items-center">
          <Shield className="h-4 w-4 text-blue-500 mr-1" />
          <span className="text-xs font-medium">Low: {lowThreats.length}</span>
        </div>
      </div>
      
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onInit={(instance) => {
            actualReactFlowInstance.current = instance;
          }}
          fitView
          minZoom={0.1}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed },
            labelStyle: { display: 'none', fontSize: 0 },
            labelBgStyle: { display: 'none' }
          }}
          connectionLineComponent={null} // Disable connection lines
          edgesFocusable={false} // Make edges non-focusable to reduce warnings
          nodesFocusable={false} // Make nodes non-focusable 
          nodesConnectable={false} // Disable node connections
        >
          <MiniMap 
            nodeStrokeColor={(n) => {
              if (n.type === 'boundaryNode') return '#EF4444';
              if (n.type === 'processNode') return '#2563EB'; 
              if (n.type === 'dataStoreNode') return '#0891B2';
              if (n.type === 'externalNode') return '#8B5CF6';
              return '#6B7280';
            }}
            nodeColor={(n) => {
              if (n.type === 'processNode') return '#DBEAFE';
              if (n.type === 'entityNode') return '#F3F4F6';
              if (n.type === 'dataStoreNode') return '#CFFAFE';
              if (n.type === 'externalNode') return '#F3E8FF';
              return '#fff';
            }}
            style={{ 
              width: 120, 
              height: 80,
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '4px'
            }}
            className="shadow-sm"
            maskColor="rgba(240, 240, 240, 0.4)"
          />
          <Background color="#f8f8f8" />
          
          {/* Add Flow Legend */}
          <FlowLegend edges={edges} nodes={nodes} />
          
          <Panel position="top-right" className="bg-white rounded-md shadow-md p-2 flex gap-2">
            <button
              onClick={() => {
                setLayoutApplied(false); // Reset layout flag
                onLayout(); // Re-apply layout
              }}
              className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
            >
              <Maximize className="h-4 w-4" /> Auto Layout
            </button>
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default DFDVisualization;