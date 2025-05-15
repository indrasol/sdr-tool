import React from 'react';
import { Handle, Position, NodeResizer, NodeProps } from '@xyflow/react';
import NodeContextToolbar from './NodeContextToolbar';
import { CustomNodeData } from './types/diagramTypes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getCategoryStyle } from './utils/nodeStyles';
import ThreatBadges from './ThreatBadges';  // Import ThreatBadges component
import { classNames } from "@/lib/utils";
import { mapNodeTypeToIcon } from './utils/mapNodeTypeToIcon';  // Add mapNodeTypeToIcon import

const CustomNode = ({ 
  id, 
  data, 
  selected,
}: NodeProps) => {
  // Ensure data is always defined with default values
  const nodeData: Partial<CustomNodeData> = data || { label: 'Node', nodeType: 'default' };
  
  // No need for explicit type assertion, data is implicitly typed by NodeProps
  const safeData = nodeData as CustomNodeData; // Assert here for easier access below
  
  // Extract values with fallbacks, using the asserted safeData
  const label = safeData.label || 'Node';
  const description = safeData.description || '';
  const nodeType = safeData.nodeType || 'default';
  const iconRenderer = safeData.iconRenderer;
  // Access connection flags safely, defaulting to false if undefined
  const hasSourceConnection = safeData.hasSourceConnection ?? false;
  const hasTargetConnection = safeData.hasTargetConnection ?? false;
  // Get threats from context/props
  const threats = safeData.threats || [];
  const activeSeverityFilter = safeData.activeSeverityFilter || 'ALL';

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

  // Check if this is a client node
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

  // Check if this is an API Gateway node
  const isApiGateway = () => {
    const nodeTypeStr = nodeType.toLowerCase();
    return nodeTypeStr.includes('api') && nodeTypeStr.includes('gateway');
  };

  // Check if this is a server node
  const isServerNode = () => {
    const nodeTypeStr = nodeType.toLowerCase();
    return nodeTypeStr.includes('server') || nodeTypeStr.includes('compute');
  };

  const getNodeColor = () => {
    // Extract section from nodeType
    const nodeTypeStr = nodeType.toLowerCase();
    const section = nodeTypeStr.split('_')[0];
    
    // AWS Category - Orange
    if (nodeTypeStr.includes('aws') || 
        nodeTypeStr.includes('lambda') || 
        nodeTypeStr.includes('s3') ||
        nodeTypeStr.includes('ec2') ||
        nodeTypeStr.includes('dynamo') ||
        section === 'aws') {
      return { 
        bg: 'bg-[#FF9900]/80', 
        border: 'border-orange-300',
        iconClass: 'text-white drop-shadow-md'
      };
    }
    
    // Azure Category - Azure Blue
    if (nodeTypeStr.includes('azure') || 
        nodeTypeStr.includes('microsoft') || 
        section === 'azure') {
      return { 
        bg: 'bg-[#0078D4]/80', 
        border: 'border-blue-300',
        iconClass: 'text-white drop-shadow-md'
      };
    }
    
    // Database Category - Teal
    if (isDatabaseNode()) {
      return { 
        bg: 'bg-[#00A3A3]/80', 
        border: 'border-teal-300',
        iconClass: 'text-white drop-shadow-md'
      };
    }
    
    // Application/Service Category - Green
    if (nodeTypeStr.includes('application') || 
        nodeTypeStr.includes('service') || 
        nodeTypeStr.includes('app') ||
        nodeTypeStr.includes('microservice') ||
        section === 'application') {
      return { 
        bg: 'bg-[#34A853]/80', 
        border: 'border-green-300',
        iconClass: 'text-white drop-shadow-md'
      };
    }
    
    // Network Category - Red
    if (nodeTypeStr.includes('network') || 
        nodeTypeStr.includes('firewall') || 
        nodeTypeStr.includes('security') ||
        nodeTypeStr.includes('router') ||
        section === 'network') {
      return { 
        bg: 'bg-[#DC3545]/80', 
        border: 'border-red-300',
        iconClass: 'text-white drop-shadow-md'
      };
    }
    
    // GCP Category - Blue
    if (nodeTypeStr.includes('gcp') || 
        nodeTypeStr.includes('google') || 
        nodeTypeStr.includes('cloud run') ||
        section === 'gcp') {
      return { 
        bg: 'bg-[#1A73E8]/80', 
        border: 'border-blue-300',
        iconClass: 'text-white drop-shadow-md'
      };
    }
    
    // Client/Device Category - Transparent (icon only)
    if (isClientNode()) {
      return { 
        bg: 'bg-transparent', 
        border: 'border-transparent',
        iconClass: 'drop-shadow-md'
      };
    }
    
    // API Gateway - Blue with extra contrast
    if (isApiGateway() || section === 'api') {
      return { 
        bg: 'bg-[#0078D7]/75', 
        border: 'border-blue-300',
        iconClass: 'text-white drop-shadow-lg'
      };
    }
    
    // Servers - Special styling for better visibility
    if (isServerNode()) {
      return { 
        bg: 'bg-[#5A5AF3]/75', 
        border: 'border-indigo-300',
        iconClass: 'text-white drop-shadow-lg'
      };
    }
    
    // Default color for unknown types - Purple
    return { 
      bg: 'bg-[#7C65F6]/80', 
      border: 'border-purple-300',
      iconClass: 'text-white drop-shadow-md'
    };
  };

  // Get node colors
  const nodeColors = getNodeColor();

  // Calculate icon size based on node type
  const getIconSize = () => {
    // Client nodes get larger icons
    if (isClientNode()) {
      return 60;
    }
    
    // Network nodes like firewall
    if (nodeType.toLowerCase().includes('firewall') || 
        nodeType.toLowerCase().includes('network')) {
      return 40;
    }
    
    // API Gateway and Servers get slightly larger icons for better visibility
    if (isApiGateway() || isServerNode()) {
      return 42;
    }
    
    // Default size for other nodes
    return 40;
  };

  const iconSize = getIconSize();
  // Always use white for icon color to ensure visibility against colored backgrounds
  const iconColor = isClientNode() ? (getCategoryStyle(nodeType)?.color || '#7C65F6') : 'white';

  // Get description tooltip to display on hover, if a description exists
  const getDescriptionTooltip = () => {
    if (!description) return null;
    
    // Truncate description if it's longer than 200 characters
    const truncatedDescription = description.length > 200 
      ? description.substring(0, 200) + '...' 
      : description;
    
    return (
      <TooltipContent>
        <div className="max-w-xs">
          <p className="text-xs text-gray-800">{truncatedDescription}</p>
        </div>
      </TooltipContent>
    );
  };

  // Add source handle style with conditional visibility
  const sourceHandleStyle = {
    background: '#fff',
    border: '2px solid #000000',
    width: '12px',
    height: '12px',
    bottom: '-6px',
    borderRadius: '50%',
    zIndex: 10,
  };

  // Add target handle style with conditional visibility
  const targetHandleStyle = {
    background: '#fff',
    border: '2px solid #000000',
    width: '12px',
    height: '12px',
    top: '-6px',
    borderRadius: '50%',
    zIndex: 10,
  };
  
  return (
    <div
      className={`custom-node ${selected ? 'custom-node-selected' : ''}`}
      style={{ position: 'relative', zIndex: 1 }}
      data-nodetype={nodeType.toLowerCase()}
      data-has-threats={threats && threats.length > 0 ? 'true' : 'false'}
    >
      {/* Source handle (bottom) - Only render when there's a connection or node is selected */}
      {(hasSourceConnection || selected) && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="custom-handle source-handle"
          style={sourceHandleStyle}
        />
      )}
      
      {/* Target handle (top) - Only render when there's a connection or node is selected */}
      {(hasTargetConnection || selected) && (
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="custom-handle target-handle"
          style={targetHandleStyle}
        />
      )}
      
      {/* Toolbar for node actions */}
      {selected && (
        <NodeContextToolbar 
          id={id}
          selected={selected}
          data={safeData}
          onEdit={() => handleEdit(id)} 
          onDelete={() => handleDelete(id)}
          onInfoToggle={() => handleInfoToggle(id)}
        />
      )}
      
      {/* All nodes now use icon-only style with label underneath */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex flex-col items-center ${selected ? 'outline-2 outline-blue-400 outline-offset-2 rounded-md' : ''}`}>
              {/* Icon container with shadow for better visibility */}
              <div 
                className={classNames(
                  "flex items-center justify-center mb-1 shadow-md",
                  selected ? "ring-2 ring-blue-400 rounded-md" : "",
                  isClientNode() ? "" : "p-1.5 rounded-md",
                  nodeColors.bg,
                  nodeColors.border
                )}
                style={{ 
                  minWidth: isClientNode() ? '60px' : '50px', 
                  minHeight: isClientNode() ? '60px' : '50px',
                  backgroundColor: isClientNode() ? 'transparent' : getCategoryStyle(nodeType)?.bgColor || 'transparent',
                  position: 'relative', // Ensure icon container is positioned
                }}
              >
                {iconRenderer ? (
                  (() => {
                    const { component: IconComponent, props } = iconRenderer();
                    return (
                      <IconComponent 
                        {...props} 
                        size={iconSize} 
                        className={nodeColors.iconClass || ''}
                        color={isClientNode() ? props.color : iconColor}
                      />
                    );
                  })()
                ) : (
                  mapNodeTypeToIcon(nodeType)
                )}
              </div>
              
              {/* Label underneath */}
              <div className="text-center mt-1 max-w-[120px]">
                <div className="font-medium text-xs">
                  {label}
                </div>
              </div>
              
              {/* Description tooltip */}
              {description && getDescriptionTooltip()}
            </div>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
      
      {/* Display threat badges - outside of all containers for maximum visibility */}
      {threats && threats.length > 0 && (
        <div className="threat-badge-container">
          <ThreatBadges 
            nodeId={id}
            threats={threats} 
            activeSeverityFilter={activeSeverityFilter}
          />
        </div>
      )}
    </div>
  );
};

export default CustomNode;