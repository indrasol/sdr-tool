import React from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import NodeContextToolbar from './NodeContextToolbar';
import { NodeProps } from './types/diagramTypes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getCategoryStyle } from './utils/nodeStyles';

const CustomNode = ({ 
  id, 
  data, 
  selected,
  style
}: NodeProps) => {
  // Ensure data is always defined with default values
  const nodeData = data || { label: 'Node' };
  
  // Type assertion to work with the data
  const safeData = nodeData as {
    label: string;
    description?: string;
    nodeType?: string;
    iconRenderer?: () => { component: React.ElementType; props: any; bgColor: string };
    onEdit?: (id: string, label: string) => void;
    onDelete?: (id: string) => void;
  };
  
  // Extract values with fallbacks
  const label = safeData.label || 'Node';
  const description = safeData.description || '';
  const nodeType = safeData.nodeType || 'Component';
  const iconRenderer = safeData.iconRenderer;

  const handleEdit = (nodeId: string) => {
    if (safeData.onEdit) {
      safeData.onEdit(nodeId, label);
    }
  };

  const handleDelete = (nodeId: string) => {
    if (safeData.onDelete) {
      safeData.onDelete(nodeId);
    }
  };

  // Create a handleInfoToggle function for NodeContextToolbar
  const handleInfoToggle = (nodeId: string) => {
    // This is just a placeholder function to satisfy the prop requirements
    console.log(`Info toggle for node ${nodeId}`);
  };

  // Check if this is a client category node
  const isClientNode = () => {
    const nodeTypeStr = nodeType.toLowerCase();
    const section = nodeTypeStr.split('_')[0];
    
    return nodeTypeStr.includes('client') || 
           nodeTypeStr.includes('device') || 
           nodeTypeStr.includes('user') ||
           section === 'client';
  };

  // Check if this is a database node - should be part of application category
  const isDatabaseNode = () => {
    const nodeTypeStr = nodeType.toLowerCase();
    return nodeTypeStr.includes('database') || 
           nodeTypeStr.includes('sql') || 
           nodeTypeStr.includes('storage');
  };

  // Check if this is a cache or monitoring node
  const isCacheOrMonitoring = () => {
    const nodeTypeStr = nodeType.toLowerCase();
    return nodeTypeStr.includes('cache') || 
           nodeTypeStr.includes('monitor') || 
           nodeTypeStr.includes('observability');
  };

  // Get category and colors based on node type
  const getNodeColor = () => {
    const nodeTypeStr = nodeType.toLowerCase();
    const section = nodeTypeStr.split('_')[0]; // Get the first part of the nodeType (e.g., 'aws')
    
    // Match toolbar category colors
    
    // AWS Category - Orange
    if (nodeTypeStr.includes('aws') || 
        nodeTypeStr.includes('lambda') || 
        nodeTypeStr.includes('ec2') || 
        nodeTypeStr.includes('s3') ||
        section === 'aws') {
      return { 
        bg: 'bg-[#FF9900]/90', 
        border: 'border-orange-300',
        iconClass: null
      };
    }
    
    // Network Category - Red with black icons
    if (nodeTypeStr.includes('network') || 
        nodeTypeStr.includes('firewall') || 
        nodeTypeStr.includes('waf') || 
        section === 'network') {
      return { 
        bg: 'bg-[#DC3545]/90', 
        border: 'border-red-300',
        iconClass: 'filter invert brightness-0'
      };
    }
    
    // Database nodes - Treat as Application category (teal) but preserve icon colors
    if (isDatabaseNode()) {
      return { 
        bg: 'bg-[#009688]/90', 
        border: 'border-teal-300',
        iconClass: null
      };
    }
    
    // Cache and Monitoring nodes - Preserve icon colors
    if (isCacheOrMonitoring()) {
      return { 
        bg: 'bg-[#009688]/90', 
        border: 'border-teal-300',
        iconClass: null
      };
    }
    
    // Azure Category - Blue
    if (nodeTypeStr.includes('azure') || 
        section === 'azure') {
      return { 
        bg: 'bg-[#0072C6]/90', 
        border: 'border-blue-300',
        iconClass: null
      };
    }
    
    // Application/Microservice Category - Teal with black icons
    if (nodeTypeStr.includes('microservice') || 
        nodeTypeStr.includes('service') || 
        nodeTypeStr.includes('application') ||
        section === 'application') {
      return { 
        bg: 'bg-[#009688]/90', 
        border: 'border-teal-300',
        iconClass: 'filter invert brightness-0'
      };
    }
    
    // GCP Category - Blue
    if (nodeTypeStr.includes('gcp') || 
        nodeTypeStr.includes('google') || 
        nodeTypeStr.includes('cloud run') ||
        section === 'gcp') {
      return { 
        bg: 'bg-[#1A73E8]/90', 
        border: 'border-blue-300',
        iconClass: null
      };
    }
    
    // Client/Device Category - Transparent (icon only)
    if (isClientNode()) {
      return { 
        bg: 'bg-transparent', 
        border: 'border-transparent',
        iconClass: null
      };
    }
    
    // API Gateway - Blue
    if (nodeTypeStr.includes('api') || 
        nodeTypeStr.includes('gateway') ||
        section === 'api') {
      return { 
        bg: 'bg-[#0078D7]/90', 
        border: 'border-blue-300',
        iconClass: null
      };
    }
    
    // Default color for unknown types - Purple
    return { 
      bg: 'bg-[#7C65F6]/90', 
      border: 'border-purple-300',
      iconClass: null
    };
  };

  // Get node colors
  const nodeColors = getNodeColor();

  // Render the icon component if iconRenderer is provided
  const renderIcon = () => {
    if (iconRenderer) {
      const iconData = iconRenderer();
      const IconComponent = iconData.component;
      return (
        <div className={`flex items-center justify-center ${nodeColors.iconClass || ''}`}>
          <IconComponent {...iconData.props} size={48} />
        </div>
      );
    }
    return null;
  };

  // Determine if we should render a full styled node or just the icon
  const renderClientIconOnly = isClientNode();

  return (
    <>
      {/* Add the NodeResizer component that appears when the node is selected */}
      {selected && (
        <NodeResizer 
          minWidth={60}
          minHeight={60}
          isVisible={!!selected}
          lineClassName="border-securetrack-purple"
          handleClassName="h-2 w-2 bg-white border-2 border-securetrack-purple rounded"
          handleStyle={{ borderWidth: 2 }}
        />
      )}
      
      <NodeContextToolbar
        id={id}
        selected={!!selected}
        data={{
          label,
          description,
          nodeType
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onInfoToggle={handleInfoToggle}
      />

      {/* Node container with modern styling or icon-only for client category */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`node-fade-in custom-node flex flex-col items-center justify-center ${selected ? 'scale-110' : ''}`}>
              {renderClientIconOnly ? (
                // Icon-only for Client category
                <div className="w-16 h-16 flex items-center justify-center">
                  {renderIcon()}
                </div>
              ) : (
                // Styled container for other categories - no white container
                <div className={`w-20 h-20 rounded-xl ${nodeColors.bg} flex items-center justify-center shadow-sm border ${nodeColors.border} relative`}>
                  {renderIcon()}
                  <div className="node-label">
                    {label}
                  </div>
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs bg-white/90 backdrop-blur-sm p-3 shadow-lg rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-1">{label}</h4>
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-1.5 h-1.5 border-2 border-securetrack-purple bg-white/90"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-1.5 h-1.5 border-2 border-securetrack-purple bg-white/90"
      />
    </>
  );
};

export default CustomNode;