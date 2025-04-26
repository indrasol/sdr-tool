import React from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import NodeContextToolbar from './NodeContextToolbar';
import { NodeProps } from './types/diagramTypes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  // Check if this is an AWS or cloud related node for special styling
  const isCloudNode = nodeType.includes('AWS') || 
                     ['EC2', 'RDS', 'S3', 'Lambda', 'CloudFront', 'IAM'].some(
                       awsService => nodeType.includes(awsService)
                     );

  // Render the icon component if iconRenderer is provided
  const renderIcon = () => {
    if (iconRenderer) {
      const iconData = iconRenderer();
      const IconComponent = iconData.component;
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div 
            className="w-5 h-5 flex items-center justify-center rounded" 
            style={{ backgroundColor: iconData.bgColor }}
          >
            <IconComponent {...iconData.props} size={10} />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Add the NodeResizer component that appears when the node is selected */}
      {selected && (
        <NodeResizer 
          minWidth={70}
          minHeight={30}
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

      <div 
        className={`node-fade-in custom-node flex flex-col items-center justify-center w-full h-full rounded-lg border backdrop-blur-sm
          ${selected ? 'border-securetrack-purple border-2 shadow-lg' : 'border-gray-200/80 shadow-sm'} 
          p-1 transition-all duration-200 hover:shadow-md
          ${isCloudNode ? 'bg-white/90' : 'bg-gradient-to-br from-white/95 to-white/85'}`}
        style={style}
      >
        {iconRenderer && (
          <div className="mb-1">
            {renderIcon()}
          </div>
        )}
        <div className={`font-medium text-center text-xs ${isCloudNode ? 'text-securetrack-purple' : ''}`}>
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