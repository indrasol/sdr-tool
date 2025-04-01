import React from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import NodeContextToolbar from './NodeContextToolbar';
import { NodeProps } from './types/diagramTypes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Function to determine colors based on type
const getNodeColorsByType = (nodeType: string): { primary: string; background: string; dotColor: string } => {
  nodeType = nodeType.toLowerCase();
  
  // Security components get red
  if (nodeType.includes('security') || nodeType.includes('firewall') || 
      nodeType.includes('auth') || nodeType.includes('identity')) {
    return { 
      primary: '#E53E3E', // red
      background: '#FFF5F5', // light red background
      dotColor: '#FED7D7' // slightly darker dots
    };
  }
  
  // Servers get green
  if (nodeType.includes('server') || nodeType.includes('ec2') || 
      nodeType.includes('instance') || nodeType.includes('compute')) {
    return { 
      primary: '#38A169', // green
      background: '#F0FFF4', // light green background
      dotColor: '#C6F6D5' // slightly darker dots
    };
  }
  
  // Databases get blue (default like HubSpot image)
  if (nodeType.includes('database') || nodeType.includes('db') || 
      nodeType.includes('rds') || nodeType.includes('storage') || 
      nodeType.includes('hubspot')) {
    return { 
      primary: '#3182CE', // blue
      background: '#EBF8FF', // light blue background
      dotColor: '#BEE3F8' // slightly darker dots
    };
  }
  
  // Network components get purple
  if (nodeType.includes('network') || nodeType.includes('vpc') || 
      nodeType.includes('subnet') || nodeType.includes('route')) {
    return { 
      primary: '#805AD5', // purple
      background: '#FAF5FF', // light purple background
      dotColor: '#E9D8FD' // slightly darker dots
    };
  }
  
  // API related components get orange
  if (nodeType.includes('api') || nodeType.includes('gateway') || 
      nodeType.includes('endpoint')) {
    return { 
      primary: '#DD6B20', // orange
      background: '#FFFAF0', // light orange background
      dotColor: '#FEEBC8' // slightly darker dots
    };
  }
  
  // Cloud services default to teal
  if (nodeType.includes('aws') || nodeType.includes('azure') || 
      nodeType.includes('cloud') || nodeType.includes('lambda')) {
    return { 
      primary: '#319795', // teal
      background: '#E6FFFA', // light teal background
      dotColor: '#B2F5EA' // slightly darker dots
    };
  }
  
  // Default color for everything else - blue like in the image
  return { 
    primary: '#3182CE', // blue
    background: '#EBF8FF', // light blue background
    dotColor: '#BEE3F8' // slightly darker dots
  };
};

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

  // Get the node colors based on its type
  const nodeColors = getNodeColorsByType(nodeType);

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

  // Render the icon component if iconRenderer is provided
  const renderIcon = () => {
    if (iconRenderer) {
      const iconData = iconRenderer();
      const IconComponent = iconData.component;
      return (
        <IconComponent {...iconData.props} size={12} color={nodeColors.primary} />
      );
    }
    return null;
  };

  return (
    <>
      {/* Add the NodeResizer component that appears when the node is selected */}
      {selected && (
        <NodeResizer 
          minWidth={80}
          minHeight={25}
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

      {/* Single border node container */}
      <div 
        className={`custom-node flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${selected ? 'shadow-sm' : ''}`}
        style={{
          ...style,
          backgroundColor: nodeColors.background,
          border: `1px solid ${nodeColors.primary}`,
          borderRadius: '4px',
          position: 'relative'
        }}
      >
        <div className="flex items-center justify-center p-0 w-full">
          {/* Icon on the left */}
          {iconRenderer && (
            <div className="mr-1">
              {renderIcon()}
            </div>
          )}
          
          {/* Only display the label, no description */}
          <div className="font-medium text-xxs" style={{ color: nodeColors.primary, fontSize: '10px' }}>
            {label}
          </div>
        </div>
      </div>

      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-1.5 h-1.5 rounded-full"
        style={{ borderColor: nodeColors.primary, backgroundColor: 'white', border: `1px solid ${nodeColors.primary}` }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: nodeColors.primary, border: 'none' }}
      />
    </>
  );
};

export default CustomNode;


// import React from 'react';
// import { Handle, Position, NodeResizer } from '@xyflow/react';
// import NodeContextToolbar from './NodeContextToolbar';
// import { NodeProps } from './types/diagramTypes';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// const CustomNode = ({ 
//   id, 
//   data, 
//   selected,
//   style
// }: NodeProps) => {
//   // Ensure data is always defined with default values
//   const nodeData = data || { label: 'Node' };
  
//   // Type assertion to work with the data
//   const safeData = nodeData as {
//     label: string;
//     description?: string;
//     nodeType?: string;
//     iconRenderer?: () => { component: React.ElementType; props: any; bgColor: string };
//     onEdit?: (id: string, label: string) => void;
//     onDelete?: (id: string) => void;
//   };
  
//   // Extract values with fallbacks
//   const label = safeData.label || 'Node';
//   const description = safeData.description || '';
//   const nodeType = safeData.nodeType || 'Component';
//   const iconRenderer = safeData.iconRenderer;

//   const handleEdit = (nodeId: string) => {
//     if (safeData.onEdit) {
//       safeData.onEdit(nodeId, label);
//     }
//   };

//   const handleDelete = (nodeId: string) => {
//     if (safeData.onDelete) {
//       safeData.onDelete(nodeId);
//     }
//   };

//   // Create a handleInfoToggle function for NodeContextToolbar
//   const handleInfoToggle = (nodeId: string) => {
//     // This is just a placeholder function to satisfy the prop requirements
//     console.log(`Info toggle for node ${nodeId}`);
//   };

//   // Check if this is an AWS or cloud related node for special styling
//   const isCloudNode = nodeType.includes('AWS') || 
//                      ['EC2', 'RDS', 'S3', 'Lambda', 'CloudFront', 'IAM'].some(
//                        awsService => nodeType.includes(awsService)
//                      );

//   // Render the icon component if iconRenderer is provided
//   const renderIcon = () => {
//     if (iconRenderer) {
//       const iconData = iconRenderer();
//       const IconComponent = iconData.component;
//       return (
//         <div className="flex items-center justify-center w-full h-full">
//           <div 
//             className="w-5 h-5 flex items-center justify-center rounded" 
//             style={{ backgroundColor: iconData.bgColor }}
//           >
//             <IconComponent {...iconData.props} size={10} />
//           </div>
//         </div>
//       );
//     }
//     return null;
//   };

//   return (
//     <>
//       {/* Add the NodeResizer component that appears when the node is selected */}
//       {selected && (
//         <NodeResizer 
//           minWidth={70}
//           minHeight={30}
//           isVisible={!!selected}
//           lineClassName="border-securetrack-purple"
//           handleClassName="h-2 w-2 bg-white border-2 border-securetrack-purple rounded"
//           handleStyle={{ borderWidth: 2 }}
//         />
//       )}
      
//       <NodeContextToolbar
//         id={id}
//         selected={!!selected}
//         data={{
//           label,
//           description,
//           nodeType
//         }}
//         onEdit={handleEdit}
//         onDelete={handleDelete}
//         onInfoToggle={handleInfoToggle}
//       />

//       <div 
//         className={`custom-node flex flex-col items-center justify-center w-full h-full bg-white rounded-lg border ${selected ? 'border-securetrack-purple border-2' : 'border-gray-200'} p-1 shadow-sm transition-all duration-200 ${selected ? 'shadow-md' : ''}`}
//         style={style}
//       >
//         {iconRenderer && (
//           <div className="mb-1">
//             {renderIcon()}
//           </div>
//         )}
//         <div className={`font-medium text-center text-xs ${isCloudNode ? 'text-securetrack-purple' : ''}`}>
//           {label}
//         </div>
        
//         {description && (
//           <TooltipProvider>
//             <Tooltip>
//               <TooltipTrigger asChild>
//                 <div className="text-[9px] text-gray-500 mt-0.5 truncate max-w-full text-center cursor-help">
//                   {description.length > 12 ? `${description.substring(0, 12)}...` : description}
//                 </div>
//               </TooltipTrigger>
//               <TooltipContent className="bg-white z-[9999] text-xs p-2">
//                 {description}
//               </TooltipContent>
//             </Tooltip>
//           </TooltipProvider>
//         )}
//       </div>

//       <Handle 
//         type="target" 
//         position={Position.Left} 
//         className="w-1.5 h-1.5 border-2 border-securetrack-purple bg-white"
//       />
//       <Handle 
//         type="source" 
//         position={Position.Right} 
//         className="w-1.5 h-1.5 border-2 border-securetrack-purple bg-white"
//       />
//     </>
//   );
// };

// export default CustomNode;