import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, MarkerType } from '@xyflow/react';

// Re-export edgeStyles and determineEdgeType for backward compatibility
export { edgeStyles, determineEdgeType } from './edgeStylesCompat';

// Define proper type for edge configuration
interface EdgeStyleConfig {
  style: {
    strokeWidth: number;
    stroke: string;
    strokeDasharray?: string;
    filter?: string;
    [key: string]: any;
  };
  markerEnd: {
    type: MarkerType;
    color: string;
    width: number;
    height: number;
  };
  labelStyle?: {
    fill: string;
    fontWeight: number;
    fontSize?: number;
    fontFamily?: string;
    textShadow?: string;
    [key: string]: any;
  };
  labelBgStyle?: {
    fill: string;
    rx?: number;
    ry?: number;
    padding?: number;
    [key: string]: any;
  };
}

// Edge styling configuration with proper types
const edgeConfig: {
  types: Record<string, EdgeStyleConfig>;
  default: EdgeStyleConfig;
} = {
  types: {
    default: {
      style: {
        strokeWidth: 2,
        stroke: '#555',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#555',
        width: 20,
        height: 20,
      },
      labelStyle: {
        fill: '#333',
        fontWeight: 500,
        fontSize: 12,
        fontFamily: 'Inter, system-ui, sans-serif',
        textShadow: '0 0 3px white, 0 0 3px white, 0 0 3px white, 0 0 3px white',
      },
      labelBgStyle: {
        fill: 'rgba(255, 255, 255, 0.85)',
        rx: 4,
        ry: 4,
        padding: 4,
      },
    },
    data: {
      style: {
        strokeWidth: 3,
        stroke: '#0096fb',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#0096fb',
        width: 20,
        height: 20,
      },
      labelStyle: {
        fill: '#0066b3',
        fontWeight: 600,
      },
    },
    control: {
      style: {
        strokeWidth: 2.5,
        stroke: '#ff6b6b',
        strokeDasharray: '5 5',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#ff6b6b',
        width: 20,
        height: 20,
      },
      labelStyle: {
        fill: '#e63946',
        fontWeight: 600,
      },
    },
    system: {
      style: {
        strokeWidth: 2.5,
        stroke: '#6c757d',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#6c757d',
        width: 20,
        height: 20,
      },
    },
    authentication: {
      style: {
        strokeWidth: 2.5,
        stroke: '#6a4c93',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#6a4c93',
        width: 20,
        height: 20,
      },
      labelStyle: {
        fill: '#6a4c93',
        fontWeight: 600,
      },
    },
  },
  // For edges without explicit type
  default: {
    style: {
      strokeWidth: 2,
      stroke: '#555',
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#555',
      width: 20,
      height: 20,
    },
    labelStyle: {
      fill: '#333',
      fontWeight: 500,
      fontSize: 12,
      fontFamily: 'Inter, system-ui, sans-serif',
      textShadow: '0 0 3px white, 0 0 3px white, 0 0 3px white, 0 0 3px white',
    },
    labelBgStyle: {
      fill: 'rgba(255, 255, 255, 0.85)',
      rx: 4,
      ry: 4,
      padding: 4,
    },
  },
};

// Define the expected data structure for our edges
interface CustomEdgeData {
  edgeType?: string;
  [key: string]: any;
}

// Enhanced default edge component with smart edge paths
export function EnhancedDefaultEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  label,
  labelStyle = {},
  labelShowBg = true,
  labelBgStyle = {},
  labelBgPadding = [4, 4],
  labelBgBorderRadius = 4,
  interactionWidth = 20,
  selected = false,
}: EdgeProps) {
  // Cast data to our expected type
  const edgeData = data as CustomEdgeData | undefined;
  const edgeType = (edgeData?.edgeType || 'default') as keyof typeof edgeConfig.types;
  
  // Get edge configuration based on edge type, falling back to default
  const config = edgeConfig.types[edgeType] || edgeConfig.default;
  
  // Merge default style with type-specific style and any custom style
  const finalStyle = {
    ...edgeConfig.default.style,
    ...config.style,
    ...style,
  };
  
  if (selected) {
    finalStyle.strokeWidth = (finalStyle.strokeWidth as number) + 1;
    finalStyle.stroke = '#1a73e8';
    finalStyle.filter = 'drop-shadow(0 0 5px rgba(26, 115, 232, 0.4))';
  }
  
  // Merge default marker end with type-specific marker end
  const finalMarkerEnd = markerEnd || config.markerEnd;
  
  // Merge default label style with type-specific label style and any custom label style
  const finalLabelStyle = {
    ...edgeConfig.default.labelStyle,
    ...(config.labelStyle || {}),
    ...labelStyle,
  };
  
  // Merge default label bg style with type-specific label bg style
  const finalLabelBgStyle = {
    ...edgeConfig.default.labelBgStyle,
    ...(config.labelBgStyle || {}),
    ...labelBgStyle,
  };
  
  // Create unique edge ID for the path
  const edgePathId = `edge-path-${id}`;

  // Calculate path with enhanced options for better curve shape
  const [edgePath, edgeCenterX, edgeCenterY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25, // Higher curvature for more pronounced curves
  });

  // Calculate appropriate offset for label to avoid overlapping
  // The edgeCenterX and edgeCenterY give us the center of the edge path
  const labelOffsetX = 0;
  const labelOffsetY = -10; // Move label slightly up
  
  return (
    <>
      <path
        id={edgePathId}
        style={finalStyle}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={typeof finalMarkerEnd === 'string' ? finalMarkerEnd : finalMarkerEnd.type}
      />
      
      {/* Create a wider transparent path for better interactivity */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={interactionWidth}
        stroke="transparent"
        strokeLinecap="round"
        className="react-flow__edge-interaction"
      />
      
      {/* Render label if present */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${edgeCenterX + labelOffsetX}px,${edgeCenterY + labelOffsetY}px)`,
              pointerEvents: 'all',
              padding: `${labelBgPadding[1]}px ${labelBgPadding[0]}px`,
              borderRadius: labelBgBorderRadius,
              fontSize: finalLabelStyle.fontSize,
              fontFamily: finalLabelStyle.fontFamily,
              fontWeight: finalLabelStyle.fontWeight,
              color: finalLabelStyle.fill,
              textShadow: finalLabelStyle.textShadow,
              background: labelShowBg ? finalLabelBgStyle.fill : 'transparent',
              opacity: selected ? 1 : 0.9,
              transition: 'opacity 0.2s',
              boxShadow: selected ? '0 0 5px rgba(26, 115, 232, 0.4)' : '',
              zIndex: selected ? 1001 : 1000, // Ensure selected edges' labels appear on top
              whiteSpace: 'nowrap', // Prevent label text wrapping
              willChange: 'transform', // Hardware acceleration hint
              backfaceVisibility: 'hidden', // Prevent flickering in some browsers
              WebkitFontSmoothing: 'antialiased', // Better text rendering
              MozOsxFontSmoothing: 'grayscale', // Better text rendering in Firefox
            }}
            className="nodrag nopan edge-label edge-label-stable"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// Edge types mapping for React Flow
export const edgeTypes = {
  default: EnhancedDefaultEdge,
};

// Edge styling utilities to help determine edge type based on connection
export const getEdgeType = (sourceType: string, targetType: string): string => {
  // Data flow edges
  if (
    (sourceType?.includes('database') || sourceType?.includes('storage')) ||
    (targetType?.includes('database') || targetType?.includes('storage'))
  ) {
    return 'data';
  }
  
  // Authentication/Authorization edges
  if (
    sourceType?.includes('auth') ||
    targetType?.includes('auth') ||
    sourceType?.includes('identity') ||
    targetType?.includes('identity')
  ) {
    return 'authentication';
  }
  
  // Control flow edges
  if (
    sourceType?.includes('gateway') ||
    sourceType?.includes('firewall') ||
    sourceType?.includes('proxy') ||
    targetType?.includes('gateway') ||
    targetType?.includes('firewall') ||
    targetType?.includes('proxy')
  ) {
    return 'control';
  }
  
  // System communication edges
  if (
    (sourceType?.includes('service') && targetType?.includes('service')) ||
    (sourceType?.includes('api') && targetType?.includes('api'))
  ) {
    return 'system';
  }
  
  return 'default';
};

// Helper function to get edge styling based on source and target node types
export const getEdgeStyle = (sourceType: string, targetType: string): EdgeStyleConfig => {
  const edgeType = getEdgeType(sourceType, targetType);
  return edgeConfig.types[edgeType as keyof typeof edgeConfig.types] || edgeConfig.default;
};