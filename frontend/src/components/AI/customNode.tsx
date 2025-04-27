import React from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import NodeContextToolbar from './NodeContextToolbar';
import { NodeProps } from './types/diagramTypes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Function to determine colors based on node type
const getNodeColorsByType = (nodeType: string): { primary: string; background: string; dotColor: string } => {
  nodeType = nodeType.toLowerCase();
  
  if (nodeType.includes('security') || nodeType.includes('firewall') || 
      nodeType.includes('auth') || nodeType.includes('identity')) {
    return { primary: '#E53E3E', background: '#FFF5F5', dotColor: '#FED7D7' };
  }
  if (nodeType.includes('server') || nodeType.includes('ec2') || 
      nodeType.includes('instance') || nodeType.includes('compute')) {
    return { primary: '#38A169', background: '#F0FFF4', dotColor: '#C6F6D5' };
  }
  if (nodeType.includes('database') || nodeType.includes('db') || 
      nodeType.includes('rds') || nodeType.includes('storage') || 
      nodeType.includes('hubspot')) {
    return { primary: '#3182CE', background: '#EBF8FF', dotColor: '#BEE3F8' };
  }
  if (nodeType.includes('network') || nodeType.includes('vpc') || 
      nodeType.includes('subnet') || nodeType.includes('route')) {
    return { primary: '#805AD5', background: '#FAF5FF', dotColor: '#E9D8FD' };
  }
  if (nodeType.includes('api') || nodeType.includes('gateway') || 
      nodeType.includes('endpoint')) {
    return { primary: '#DD6B20', background: '#FFFAF0', dotColor: '#FEEBC8' };
  }
  if (nodeType.includes('aws') || nodeType.includes('azure') || 
      nodeType.includes('cloud') || nodeType.includes('lambda')) {
    return { primary: '#319795', background: '#E6FFFA', dotColor: '#B2F5EA' };
  }
  return { primary: '#3182CE', background: '#EBF8FF', dotColor: '#BEE3F8' };
};

const CustomNode = ({ id, data, selected, style }: NodeProps) => {
  const nodeData = data || { label: 'Node' };
  
  const safeData = nodeData as {
    label: string;
    description?: string;
    nodeType?: string;
    iconRenderer?: () => { component: React.ElementType; props: any; bgColor: string };
    onEdit?: (id: string, label: string) => void;
    onDelete?: (id: string) => void;
  };
  
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

  const handleInfoToggle = (nodeId: string) => {
    console.log(`Info toggle for node ${nodeId}`);
  };

  const nodeColors = getNodeColorsByType(nodeType);

  const renderIcon = () => {
    if (iconRenderer) {
      const iconData = iconRenderer();
      const IconComponent = iconData.component;
      return (
        <div className="flex items-center justify-center p-1 rounded-full bg-opacity-30" style={{ backgroundColor: `${nodeColors.primary}20` }}>
          <IconComponent {...iconData.props} size={30} color={nodeColors.primary} />
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {selected && (
        <NodeResizer 
          minWidth={40}
          minHeight={40}
          isVisible={!!selected}
          lineClassName="border-securetrack-purple"
          handleClassName="h-2 w-2 bg-white border-2 border-securetrack-purple rounded"
          handleStyle={{ borderWidth: 2 }}
        />
      )}
      
      <NodeContextToolbar
        id={id}
        selected={!!selected}
        data={{ label, description, nodeType }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onInfoToggle={handleInfoToggle}
      />

      <div 
        className={`node-fade-in custom-node flex flex-col items-center justify-center w-full h-full rounded-lg border backdrop-blur-sm
          ${selected ? 'border-securetrack-purple border-2 shadow-lg' : 'border-gray-200/80 shadow-sm'} 
          p-1 transition-all duration-200 hover:shadow-md
          ${isCloudNode ? 'bg-white/90' : 'bg-gradient-to-br from-white/95 to-white/85'}`}
        style={style}
      >
        {iconRenderer && (
          <div className="flex justify-center items-center mb-3 transition-transform duration-200 hover:scale-110">
            {renderIcon()}
          </div>
        )}
        
        <div className="font-Extrabold text-center break-words" style={{ color: 'black', fontSize: '10px',fontWeight: 900 }}>
          {label}
        </div>
        
        {description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-[9px] text-gray-500 mt-0.5 truncate max-w-full text-center cursor-help">
                  {description.length > 12 ? `${description.substring(0, 12)}...` : description}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-white/90 backdrop-blur-sm z-[9999] text-xs p-2 border-securetrack-purple/20">
                {description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

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

