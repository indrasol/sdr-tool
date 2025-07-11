import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import NodeContextToolbar from './NodeContextToolbar';
import { CustomNodeData } from './types/diagramTypes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getCategoryStyle } from './utils/nodeStyles';
import ThreatBadges from './ThreatBadges';  // Import ThreatBadges component
import { classNames } from "@/lib/utils";
import { Icon } from '@iconify/react';
import { NodeIcon } from './components/SmartIcon';
import { useDiagramStyle } from './contexts/DiagramStyleContext';
import { resolveIcon } from './utils/enhancedIconifyRegistry';

const CustomNode = ({ 
  id, 
  data, 
  selected,
}: NodeProps) => {
  // Get current diagram style
  const { diagramStyle, styleConfig } = useDiagramStyle();
  
  // Ensure data is always defined with default values
  const nodeData: Partial<CustomNodeData> = data || { label: 'Node', nodeType: 'default' };
  
  // No need for explicit type assertion, data is implicitly typed by NodeProps
  const safeData = nodeData as CustomNodeData; // Assert here for easier access below
  
  // Extract values with fallbacks, using the asserted safeData
  const label = safeData.label || 'Node';
  const description = safeData.description || '';
  const nodeType = safeData.nodeType || 'default';
  const iconifyId = (safeData as any).iconifyId as string | undefined;
  
  // Resolve icon using enhanced registry
  const resolvedIconId = iconifyId || resolveIcon(nodeType);
  // Access connection flags safely, defaulting to false if undefined
  const hasSourceConnection = safeData.hasSourceConnection ?? false;
  const hasTargetConnection = safeData.hasTargetConnection ?? false;
  // Get threats from context/props
  const threats = safeData.threats || [];
  const activeSeverityFilter = safeData.activeSeverityFilter || 'ALL';

  // Check pinned state
  const isPinned = safeData.pinned === true;

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

  const handleLockToggle = (nodeId: string) => {
    if (safeData.onLock) {
      safeData.onLock(nodeId);
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
           nodeTypeStr.includes('nosql') ||
           nodeTypeStr.includes('mongodb') ||
           nodeTypeStr.includes('redis') ||
           nodeTypeStr.includes('postgresql') ||
           nodeTypeStr.includes('cassandra') ||
           nodeTypeStr.includes('neo4j') ||
           nodeTypeStr.includes('storage') ||
           nodeTypeStr.includes('db') ||
           nodeTypeStr.includes('cache');
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

  // Check if this is an application node
  const isApplicationNode = () => {
    const nodeTypeStr = nodeType.toLowerCase();
    const section = nodeTypeStr.split('_')[0];
    
    return nodeTypeStr.includes('application') || 
           nodeTypeStr.includes('service') || 
           nodeTypeStr.includes('app') ||
           nodeTypeStr.includes('microservice') ||
           section === 'application';
  };

  // Check if this is a network node
  const isNetworkNode = () => {
    const nodeTypeStr = nodeType.toLowerCase();
    const section = nodeTypeStr.split('_')[0];
    
    return nodeTypeStr.includes('network') || 
           nodeTypeStr.includes('firewall') || 
           nodeTypeStr.includes('security') ||
           nodeTypeStr.includes('router') ||
           section === 'network';
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
    
    // Database Category - Transparent (icon only, no background)
    if (isDatabaseNode()) {
      // Different styling for database types vs specific databases
      if (nodeTypeStr.includes('databasetype') || (nodeTypeStr.includes('database') && nodeTypeStr.includes('type'))) {
        // Special styling for database type nodes - transparent with icon only
        return { 
          bg: 'bg-transparent', 
          border: 'border-transparent',
          iconClass: 'text-[#0D47A1] drop-shadow-md'
        };
      }
      // Standard styling for database instances - transparent with icon only
      return { 
        bg: 'bg-transparent', 
        border: 'border-transparent',
        iconClass: 'text-[#1976D2] drop-shadow-md'
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

  // Get node colors with special case for different node types
  const nodeColors = getNodeColor();
  
  // Check if this is a specific node type
  const isApplication = isApplicationNode();
  const isNetwork = isNetworkNode();
  const isClient = isClientNode();
  
  // Database nodes need special treatment - always transparent
  const isDatabase = isDatabaseNode();
  const nodeStyle = isDatabase ? {
    bg: 'bg-transparent',
    border: 'border-transparent',
    iconClass: 'text-[#1976D2] drop-shadow-lg', // Enhanced shadow for better visibility
    hasBackground: false
  } : isApplication ? {
    bg: 'bg-transparent',
    border: 'border-transparent',
    iconClass: 'text-[#34A853] drop-shadow-lg', // Green color for application icons with enhanced shadow
    hasBackground: false
  } : isNetwork ? {
    bg: 'bg-transparent',
    border: 'border-transparent',
    iconClass: 'text-[#DC3545] drop-shadow-lg', // Red color for network icons with enhanced shadow
    hasBackground: false
  } : isClient ? {
    bg: 'bg-transparent',
    border: 'border-transparent',
    iconClass: 'text-[#7C65F6] drop-shadow-lg', // Purple color for client icons with enhanced shadow
    hasBackground: false
  } : {
    ...nodeColors,
    hasBackground: true
  };

  // Calculate icon size based on node type
  const getIconSize = () => {
    // Client nodes get largest icons
    if (isClient) {
      return 70; // Extra large for client icons
    }
    
    // Database nodes get larger icons since they have no background
    if (isDatabase) {
      return 64; // Slightly larger for better visibility without background
    }
    
    // Application nodes also get larger icons
    if (isApplication) {
      return 60; // Larger application icons
    }
    
    // Network nodes also get larger icons
    if (isNetwork) {
      return 58; // Large network icons
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
      <TooltipContent 
        className="radix-tooltip-content-override"
        style={{
          backgroundColor: 'white', 
          background: 'white',
          color: '#000000',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)', 
          border: '1px solid rgba(0, 0, 0, 0.1)',
          padding: '10px',
          borderRadius: '8px',
          zIndex: 10000,
          opacity: 1,
          width: 'auto',
          maxWidth: '280px',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none'
        }}
      >
        <div style={{ 
          backgroundColor: 'white', 
          background: 'white',
          opacity: 1,
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none'
        }}>
          <p style={{ 
            fontSize: '0.875rem', 
            fontWeight: 600, 
            color: 'black',
            margin: 0,
            lineHeight: '1.4'
          }}>
            {truncatedDescription}
          </p>
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
    right: '-6px',
    borderRadius: '50%',
    zIndex: 10,
  };

  // Add target handle style with conditional visibility
  const targetHandleStyle = {
    background: '#fff',
    border: '2px solid #000000',
    width: '12px',
    height: '12px',
    left: '-6px',
    borderRadius: '50%',
    zIndex: 10,
  };
  
  // Add specific database node style 
  const databaseNodeStyle = {
    className: "database-node", // Special class for database nodes
    width: '70px',
    height: '70px',
    background: 'transparent',
    padding: '0',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    filter: 'drop-shadow(0px 2px 5px rgba(0,0,0,0.15))'
  };

  return (
    <div
      className={`custom-node node-fade-in ${selected ? 'custom-node-selected' : ''} ${isDatabase ? 'database-node-container' : ''} ${isApplication ? 'application-node-container' : ''} ${isNetwork ? 'network-node-container' : ''} ${isClient ? 'client-node-container' : ''}`}
      style={{ 
        position: 'relative', 
        zIndex: 1,
        // Use animationDelay in ms if provided via node data for staggered fade-in effect
        animationDelay: safeData.animationDelayMs !== undefined ? `${safeData.animationDelayMs}ms` : undefined,
      }}
      data-nodetype={nodeType.toLowerCase()}
      data-has-threats={threats && threats.length > 0 ? 'true' : 'false'}
      data-is-database={isDatabase ? 'true' : 'false'}
      data-is-application={isApplication ? 'true' : 'false'}
      data-is-network={isNetwork ? 'true' : 'false'}
      data-is-client={isClient ? 'true' : 'false'}
    >
      {/* Source handle (right) - Only render when there's a connection or node is selected */}
      {(hasSourceConnection || selected) && (
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="custom-handle source-handle"
          style={sourceHandleStyle}
        />
      )}
      
      {/* Target handle (left) - Only render when there's a connection or node is selected */}
      {(hasTargetConnection || selected) && (
        <Handle
          type="target"
          position={Position.Left}
          id="left"
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
          onLock={() => {
            if (safeData.onLock) {
              safeData.onLock(id);
            }
          }}
          onInfoToggle={() => handleInfoToggle(id)}
        />
      )}
      
      {/* All nodes now use icon-only style with label underneath */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex flex-col items-center ${selected ? 'outline-2 outline-blue-400 outline-offset-2 rounded-md' : ''}`}>
              {/* Pinned badge */}
              {isPinned && (
                <div className="pinned-badge absolute -top-1 -left-1 text-red-500 text-sm select-none" title="Pinned">📌</div>
              )}
              {/* Icon container with enhanced styling */}
              <div 
                className={classNames(
                  "flex flex-col items-center justify-center mb-1 gap-6", // Use gap-6 for wide, equal vertical spacing between icons
                  selected ? "ring-2 ring-blue-400 rounded-md" : "",
                  isDatabase ? "database-node" : 
                  isApplication ? "application-node" : 
                  isNetwork ? "network-node" : 
                  isClient ? "client-node" :
                  "p-1.5 rounded-md shadow-md", // Special class for node types
                  !isDatabase && !isApplication && !isNetwork && !isClient && nodeStyle.bg, // Only apply background if not a special node type
                  !isDatabase && !isApplication && !isNetwork && !isClient && nodeStyle.border // Only apply border if not a special node type
                )}
                style={{ 
                  minWidth: isClient ? '70px' : isDatabase || isApplication || isNetwork ? '64px' : '50px', 
                  minHeight: isClient ? '70px' : isDatabase || isApplication || isNetwork ? '64px' : '50px',
                  backgroundColor: isClient || isDatabase || isApplication || isNetwork ? 'transparent' : (getCategoryStyle(nodeType)?.bgColor || 'transparent'),
                  position: 'relative',
                  borderRadius: styleConfig.nodeStyle.borderRadius,
                  transition: 'all 0.2s ease-in-out',
                  filter: diagramStyle === 'sketch' ? 'url(#hand-shadow)' : (isClient || isDatabase || isApplication || isNetwork ? 'drop-shadow(0px 2px 8px rgba(0,0,0,0.2))' : 'none'),
                  fontFamily: styleConfig.nodeStyle.fontFamily,
                }}
              >
                {resolvedIconId && (
                  <NodeIcon
                    nodeType={nodeType}
                    className={nodeStyle.iconClass}
                    style={{
                      width: iconSize,
                      height: iconSize,
                      filter: diagramStyle === 'sketch' ? 'url(#rough-paper)' : styleConfig.nodeStyle.filter,
                    }}
                  />
                )}
              </div>
              
              {/* Add extra vertical spacing between icon and label for clarity */}
              <div style={{ height: '0px' }} />
              {/* Label underneath */}
              <div 
                className="text-center mt-2 max-w-[200px]"
                style={{
                  fontFamily: styleConfig.nodeStyle.fontFamily,
                }}
              >
                <div 
                  className="font-semibold text-sm node-label bg-transparent"
                  style={{
                    fontSize: styleConfig.nodeStyle.fontSize,
                    fontWeight: styleConfig.nodeStyle.fontWeight,
                    fontFamily: styleConfig.nodeStyle.fontFamily,
                  }}
                >
                  {(() => {
                    // AGGRESSIVE CORRUPTION DETECTION AND LOGGING
                    let displayLabel = label;
                    
                    if (typeof label === 'string') {
                      // Detect multiple types of corruption
                      const isCorrupted = (
                        label.length > 50 || 
                        label.includes('http') || 
                        label.includes('data:') || 
                        label.includes('.svg') || 
                        label.includes('base64') ||
                        label.includes('storage.') ||
                        label.includes('supabase.') ||
                        label.includes('amazonaws.') ||
                        label.includes('blob:') ||
                        label.split('/').length > 3 ||
                        label.startsWith('eyJ') || // Base64 detection
                        /^[A-Za-z0-9+/=]{20,}$/.test(label) // Base64 pattern
                      );
                      
                      if (isCorrupted) {
                        console.error(`🚨 RENDERING CORRUPTION DETECTED in node ${id}:`, {
                          originalLabel: label.substring(0, 100) + (label.length > 100 ? '...' : ''),
                          nodeType,
                          data
                        });
                        
                        // Generate clean fallback label
                        const cleanLabel = (nodeType?.split('_').pop() || id || 'Node')
                          .replace(/[-_]/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase());
                        
                        console.log(`🔧 Using clean fallback label: "${cleanLabel}"`);
                        displayLabel = cleanLabel;
                      }
                    }
                    
                    return displayLabel;
                  })()}
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