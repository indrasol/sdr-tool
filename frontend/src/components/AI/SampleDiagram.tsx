
import React, { useEffect, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  BaseEdge,
  getSmoothStepPath,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import type { EdgeProps, NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
// Your JSON response
// import graphJson from "./graph.json";
const graphJson = {
  "nodes": [
    {
      "id": "internet",
      "type": "custom",
      "data": {
        "label": "Internet",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/onprem/network/internet.png"
      },
      "position": {
        "x": -216.8166896919887,
        "y": -411.60035197884537
      }
    },
    {
      "id": "users",
      "type": "custom",
      "data": {
        "label": "Users",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/onprem/client/users.png"
      },
      "position": {
        "x": -500,
        "y": -97.7680091964728
      }
    },
    {
      "id": "vpc_aws",
      "type": "custom",
      "data": {
        "label": "AWS VPC",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/vpc.png"
      },
      "position": {
        "x": -416.026399558214,
        "y": 259.2139469967744
      }
    },
    {
      "id": "lb",
      "type": "custom",
      "data": {
        "label": "Load Balancer",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/elastic-load-balancing.png"
      },
      "position": {
        "x": -74.44475379910087,
        "y": 194.9319261549156
      }
    },
    {
      "id": "lambda_func",
      "type": "custom",
      "data": {
        "label": "AI Processing",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/compute/lambda.png"
      },
      "position": {
        "x": 19.04996194747746,
        "y": -107.78143406202278
      }
    },
    {
      "id": "s3_storage",
      "type": "custom",
      "data": {
        "label": "Primary Storage",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/storage/simple-storage-service-s3.png"
      },
      "position": {
        "x": 449.2069392906731,
        "y": -252.86692941632273
      }
    },
    {
      "id": "cognito",
      "type": "custom",
      "data": {
        "label": "User Authentication",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/security/cognito.png"
      },
      "position": {
        "x": 295.45215518416023,
        "y": -326.7377626137622
      }
    },
    {
      "id": "rds_db",
      "type": "custom",
      "data": {
        "label": "Database",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/database/rds.png"
      },
      "position": {
        "x": -365.0241081089613,
        "y": -344.3833889268053
      }
    },
    {
      "id": "redis_cache",
      "type": "custom",
      "data": {
        "label": "Caching Layer",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/onprem/inmemory/redis.png"
      },
      "position": {
        "x": -468.24579499542006,
        "y": 57.71250994889983
      }
    },
    {
      "id": "cloudwatch",
      "type": "custom",
      "data": {
        "label": "Monitoring",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/management/cloudwatch.png"
      },
      "position": {
        "x": 342.46786292142093,
        "y": 350.785068625055
      }
    },
    {
      "id": "vpc_azure",
      "type": "custom",
      "data": {
        "label": "Azure VNet",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/vpc.png"
      },
      "position": {
        "x": 485.8769856574661,
        "y": 226.66241203423576
      }
    },
    {
      "id": "logic_app",
      "type": "custom",
      "data": {
        "label": "Workflow",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/azure/compute/function-apps.png"
      },
      "position": {
        "x": 112.72179578164858,
        "y": 484.0166431583069
      }
    },
    {
      "id": "blob_storage",
      "type": "custom",
      "data": {
        "label": "Backup Storage",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/azure/storage/blob-storage.png"
      },
      "position": {
        "x": 50.17357060996746,
        "y": -479.74654017871654
      }
    },
    {
      "id": "active_directory",
      "type": "custom",
      "data": {
        "label": "Employee Authentication",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/azure/identity/active-directory.png"
      },
      "position": {
        "x": -213.44272552475678,
        "y": 430.4709876110147
      }
    },
    {
      "id": "azure_monitor",
      "type": "custom",
      "data": {
        "label": "Observability",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/azure/general/managementgroups.png"
      },
      "position": {
        "x": 499.0512002856276,
        "y": 17.090921843745317
      }
    }
  ],
  "edges": [
    {
      "id": "internet_users",
      "source": "internet",
      "target": "users",
      "label": "HTTPS 443 / TLS1.3"
    },
    {
      "id": "users_lb",
      "source": "users",
      "target": "lb",
      "label": "HTTPS 443 / OAuth2"
    },
    {
      "id": "lb_cognito",
      "source": "lb",
      "target": "cognito",
      "label": "HTTPS 443 / JWT Auth"
    },
    {
      "id": "cognito_lambda_func",
      "source": "cognito",
      "target": "lambda_func",
      "label": "IAM Role Assumption"
    },
    {
      "id": "lambda_func_rds_db",
      "source": "lambda_func",
      "target": "rds_db",
      "label": "gRPC / mTLS"
    },
    {
      "id": "lambda_func_s3_storage",
      "source": "lambda_func",
      "target": "s3_storage",
      "label": "Data Storage"
    },
    {
      "id": "lambda_func_redis_cache",
      "source": "lambda_func",
      "target": "redis_cache",
      "label": "Cache Data"
    },
    {
      "id": "lambda_func_logic_app",
      "source": "lambda_func",
      "target": "logic_app",
      "label": "Asynchronous Workflow"
    },
    {
      "id": "s3_storage_blob_storage",
      "source": "s3_storage",
      "target": "blob_storage",
      "label": "S3 Replication"
    },
    {
      "id": "cloudwatch_azure_monitor",
      "source": "cloudwatch",
      "target": "azure_monitor",
      "label": "Metrics & Logs"
    },
    {
      "id": "lb_active_directory",
      "source": "lb",
      "target": "active_directory",
      "label": "Employee Access"
    },
    {
      "id": "active_directory_users",
      "source": "active_directory",
      "target": "users",
      "label": "User Authentication"
    }
  ],
  "clusters": [
    {
      "cluster_id": "aws_environment",
      "cluster_label": "AWS Environment",
      "cluster_nodes": [
        "vpc_aws",
        "cloudwatch"
      ],
      "cluster_parent": []
    },
    {
      "cluster_id": "public_subnet",
      "cluster_label": "Public Subnet",
      "cluster_nodes": [
        "lb"
      ],
      "cluster_parent": [
        "aws_environment"
      ]
    },
    {
      "cluster_id": "private_subnet",
      "cluster_label": "Private Subnet",
      "cluster_nodes": [
        "lambda_func",
        "s3_storage",
        "cognito",
        "rds_db",
        "redis_cache"
      ],
      "cluster_parent": [
        "aws_environment"
      ]
    },
    {
      "cluster_id": "azure_environment",
      "cluster_label": "Azure Environment",
      "cluster_nodes": [
        "vpc_azure"
      ],
      "cluster_parent": []
    },
    {
      "cluster_id": "public_subnet_1",
      "cluster_label": "Public Subnet",
      "cluster_nodes": [
        "logic_app"
      ],
      "cluster_parent": [
        "azure_environment"
      ]
    },
    {
      "cluster_id": "private_subnet_1",
      "cluster_label": "Private Subnet",
      "cluster_nodes": [
        "blob_storage",
        "active_directory",
        "azure_monitor"
      ],
      "cluster_parent": [
        "azure_environment"
      ]
    }
  ]
}
 
// ─── Custom node renderer ────────────────────────────────
const CustomNode: React.FC<NodeProps> = ({ data }) => {
  const d = (data ?? {}) as { label: string; iconUrl: string; isDarkMode?: boolean };
  
  // Calculate responsive font size based on label length
  const calculateFontSize = (label: string): number => {
    const baseSize = 35;
    const minLength = 8;
    const maxLength = 20;
    
    if (label.length <= minLength) return baseSize;
    if (label.length >= maxLength) return baseSize * 0.7;
    
    // Linear interpolation between baseSize and reduced size
    const ratio = (label.length - minLength) / (maxLength - minLength);
    return baseSize - (ratio * (baseSize * 0.3));
  };
  
  const fontSize = calculateFontSize(d.label);
  const maxTextWidth = 180; // Maximum width for text before wrapping
  
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center",
      width: "100%",
      height: "100%",
      overflow: "hidden"
    }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 150,
          height: 150,
          flexShrink: 0,
        }}
      >
        {/* Multiple connection points for better routing */}
        <Handle 
          type="target" 
          position={Position.Left} 
          style={{ 
            opacity: 0,
            width: 8,
            height: 8,
            border: 'none',
            background: 'transparent'
          }} 
        />
        <Handle 
          type="target" 
          position={Position.Top} 
          style={{ 
            opacity: 0,
            width: 8,
            height: 8,
            border: 'none',
            background: 'transparent'
          }} 
        />
        <Handle 
          type="target" 
          position={Position.Bottom} 
          style={{ 
            opacity: 0,
            width: 8,
            height: 8,
            border: 'none',
            background: 'transparent'
          }} 
        />
        
        <img
          src={d.iconUrl}
          alt={d.label}
          style={{ 
            width: 150, 
            height: 150, 
            objectFit: "contain",
            maxWidth: "100%",
            maxHeight: "100%"
          }}
        />
        
        {/* Source handles */}
        <Handle 
          type="source" 
          position={Position.Right} 
          style={{ 
            opacity: 0,
            width: 8,
            height: 8,
            border: 'none',
            background: 'transparent'
          }} 
        />
        <Handle 
          type="source" 
          position={Position.Bottom} 
          style={{ 
            opacity: 0,
            width: 8,
            height: 8,
            border: 'none',
            background: 'transparent'
          }} 
        />
        <Handle 
          type="source" 
          position={Position.Top} 
          style={{ 
            opacity: 0,
            width: 8,
            height: 8,
            border: 'none',
            background: 'transparent'
          }} 
        />
      </div>
      <div style={{ 
        fontSize: fontSize, 
        fontWeight: 700, 
        marginTop: 8, 
        textAlign: "center", 
        color: d.isDarkMode ? "#fff" : "#000",
        maxWidth: maxTextWidth,
        wordWrap: "break-word",
        overflowWrap: "break-word",
        hyphens: "auto",
        lineHeight: 1.2,
        flexShrink: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {d.label}
      </div>
    </div>
  );
};
// ─── Cluster renderer ────────────────────────────────
const ClusterNode: React.FC<NodeProps> = ({ data }) => {
  const d = (data ?? {}) as { label: string; tint?: string; borderColor?: string; isDarkMode?: boolean; depth?: number };
  
  // Calculate dynamic padding based on label length and depth
  const calculateDynamicPadding = (label: string, depth?: number): number => {
    const basePadding = 24;
    const labelLengthBonus = Math.max(0, (label.length - 15) * 1.5);
    const depthBonus = (depth || 0) * 4;
    return Math.max(20, basePadding + labelLengthBonus + depthBonus);
  };
  
  // Calculate dynamic badge styling based on label length
  const calculateBadgeStyle = (label: string) => {
    const baseFontSize = 28; // Fixed font size as requested
    const padding = label.length > 20 ? "4px 12px" : label.length > 15 ? "3px 10px" : "2px 8px";
    const borderRadius = label.length > 25 ? 6 : 4;
    
    return {
      fontSize: `${baseFontSize}px`,
      padding: padding,
      borderRadius: `${borderRadius}px`,
    };
  };
  
  const dynamicPadding = calculateDynamicPadding(d.label, d.depth);
  const badgeStyle = calculateBadgeStyle(d.label);
  
  return (
    <div
      style={{
        border: `4px solid ${d.borderColor || (d.isDarkMode ? "#444" : "#777")}`,
        borderRadius: 12,
        background: d.tint || (d.isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"),
        padding: dynamicPadding,
        color: d.isDarkMode ? "#fff" : "#000",
        fontSize: 30,
        fontWeight: 700,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
        position: "relative",
        boxShadow: d.isDarkMode 
          ? "inset 0 0 20px rgba(255,255,255,0.1), 0 0 10px rgba(0,0,0,0.3)" 
          : "inset 0 0 20px rgba(0,0,0,0.1), 0 0 10px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ 
        position: "absolute", 
        top: Math.max(12, dynamicPadding * 0.4), // Increased gap from cluster boundary
        left: Math.max(8, dynamicPadding * 0.5), // Increased gap from cluster boundary and node icons
        fontWeight: 800, 
        backgroundColor: "#ffffff", 
        ...badgeStyle,
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        color: "#000000",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "calc(100% - 32px)" // Adjusted max width to match current left positioning
      }} title={d.label}>
        {d.label}
      </div>
    </div>
  );
};
// ─── Dynamic Eraser-Style Edge Component ────────────────────────────────
const DynamicEraserEdge: React.FC<EdgeProps> = (props) => {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, data } = props;
  const d = (data ?? {}) as { isDarkMode?: boolean };
  const isDarkMode = d.isDarkMode ?? true;
  
  // Dynamic path calculation based on distance and layout
  const distance = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));
  const isShortDistance = distance < 200;
  const borderRadius = Math.min(20, Math.max(8, distance * 0.08)); // Dynamic radius
  
  // Choose path type dynamically
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius,
    offset: isShortDistance ? 10 : 20, // Dynamic offset
  });

  // Dynamic stroke width based on distance (longer edges = thicker)
  const dynamicStrokeWidth = Math.min(3.5, Math.max(2, 2 + distance / 400));
  
  // Dynamic colors based on theme
  const edgeColor = isDarkMode ? "#e5e7eb" : "#374151";
  const shadowColor = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)";
  
  // Dynamic label sizing
  const labelText = String(label || '');
  const labelPadding = Math.max(8, labelText.length * 0.5);
  const labelWidth = Math.max(40, labelText.length * 7 + labelPadding * 2);
  const labelHeight = 26;

  return (
    <>
      {/* Subtle glow effect for depth */}
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: dynamicStrokeWidth + 0.5,
          opacity: 0.3,
          filter: "blur(1px)",
          fill: "none"
        }}
      />
      
      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: dynamicStrokeWidth,
          fill: "none",
          filter: `drop-shadow(0 2px 4px ${shadowColor})`
        }}
        markerEnd={`url(#dynamic-arrow-${isDarkMode ? 'dark' : 'light'})`}
      />
      
      {/* Dynamic label */}
      {label && (
        <g>
          <rect
            x={labelX - labelWidth / 2}
            y={labelY - labelHeight / 2}
            width={labelWidth}
            height={labelHeight}
            rx={labelHeight / 2} // Fully rounded like Eraser
            fill={isDarkMode ? "#374151" : "#ffffff"}
            stroke={isDarkMode ? "#6b7280" : "#d1d5db"}
            strokeWidth={1}
            opacity={0.95}
            filter={`drop-shadow(0 3px 6px ${shadowColor})`}
          />
          <text
            x={labelX}
            y={labelY}
            style={{
              fontSize: Math.min(12, Math.max(10, 12 - labelText.length * 0.1)), // Dynamic font size
              fontWeight: 500,
              fill: isDarkMode ? "#f9fafb" : "#1f2937",
              textAnchor: "middle",
              dominantBaseline: "middle",
              fontFamily: "system-ui, -apple-system, sans-serif"
            }}
          >
            {labelText}
          </text>
        </g>
      )}
      
      {/* Dynamic arrowhead definitions */}
      <svg style={{ height: 0, width: 0 }}>
        <defs>
          <marker
            id={`dynamic-arrow-${isDarkMode ? 'dark' : 'light'}`}
            markerWidth="16"
            markerHeight="16"
            refX="14"
            refY="8"
            orient="auto"
            markerUnits="strokeWidth"
          >
            {/* Eraser-style filled arrow */}
            <path
              d="M2,3 L14,8 L2,13 L4,8 Z"
              fill={edgeColor}
              stroke="none"
              style={{
                filter: `drop-shadow(0 1px 2px ${shadowColor})`
              }}
            />
          </marker>
        </defs>
      </svg>
    </>
  );
};
const nodeTypes = { custom: CustomNode, cluster: ClusterNode };
const edgeTypes = { openArrow: DynamicEraserEdge };
// Cluster color management
const CLUSTER_COLORS = [
  { border: '#ff8c00', tint: 'rgba(255, 140, 0, 0.1)' },  // Orange
  { border: '#1e90ff', tint: 'rgba(30, 144, 255, 0.1)' },  // Blue  
  { border: '#32cd32', tint: 'rgba(50, 205, 50, 0.1)' },   // Green
];
// Get cluster color based on depth and rotation, ensuring different colors from parent
const getClusterColor = (depth: number, clusterId: string, parentColorIndex?: number) => {
  let colorIndex = (depth + clusterId.charCodeAt(0)) % CLUSTER_COLORS.length;
  
  // If this cluster has a parent and would get the same color, use the next available color
  if (parentColorIndex !== undefined && colorIndex === parentColorIndex) {
    colorIndex = (colorIndex + 1) % CLUSTER_COLORS.length;
  }
  
  return CLUSTER_COLORS[colorIndex];
};
// Check if cluster is empty (no direct nodes and no child clusters)
const isClusterEmpty = (cluster: any, allClusters: any[], clusterMap: Map<string, any>) => {
  const hasDirectNodes = cluster.nodes && cluster.nodes.length > 0;
  const hasChildClusters = allClusters.some(c => 
    c.parent && c.parent.includes(cluster.id)
  );
  return !hasDirectNodes && !hasChildClusters;
};
// Check if cluster is a parent cluster that should only show boundaries
const isParentClusterOnly = (cluster: any, allClusters: any[]) => {
  const hasChildClusters = allClusters.some(c => 
    c.parent && c.parent.includes(cluster.id)
  );
  // Parent cluster if it has child clusters (regardless of direct nodes)
  return hasChildClusters;
};
// Dagre-only: removed ELK utilities
// ─── Main Component ────────────────────────────────
function EraserFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const reactFlowInstance = useReactFlow();
  useEffect(() => {
    const run = async () => {
      // 1) Prepare helpers and inputs
      const NODE_W = 160;
      const NODE_H = 180; // updated to match new 140x140 icon size
      type Cluster = {
        cluster_id: string;
        cluster_label: string;
        cluster_parent?: string[];
        cluster_nodes?: string[]; // direct leaf node ids (may include cluster ids in data, we will ignore those here)
      };
      const allNodes = graphJson.nodes;
      const allEdges = graphJson.edges;
      const allClusters: Cluster[] = graphJson.clusters || [];
      // Build quick maps
      const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
      const clusterMap = new Map(allClusters.map((c) => [c.cluster_id, c]));
      // Parent/child cluster relationships
      const getDirectChildren = (cid: string) =>
        allClusters.filter((c) => (c.cluster_parent || []).includes(cid)).map((c) => c.cluster_id);
      // Get all descendant leaf node ids for a cluster (recursively)
      const getDescendantLeafNodes = (cid: string): string[] => {
        const c = clusterMap.get(cid);
        if (!c) return [];
        const directLeaves = (c.cluster_nodes || []).filter((nid) => nodeMap.has(nid));
        const childClusters = getDirectChildren(cid);
        const childLeaves = childClusters.flatMap((ccid) => getDescendantLeafNodes(ccid));
        return [...new Set([...directLeaves, ...childLeaves])];
      };
      // Find top-level clusters (no parent)
      const topLevelClusters = allClusters.filter((c) => !c.cluster_parent || c.cluster_parent.length === 0);
      // For a node, find the top-level cluster it belongs to (if any)
      const nodeTopCluster = (nid: string): string | null => {
        for (const top of topLevelClusters) {
          const descendants = getDescendantLeafNodes(top.cluster_id);
          if (descendants.includes(nid)) return top.cluster_id;
        }
        return null;
      };
      // Compute crossing edges count for a cluster (edges with exactly one endpoint inside)
      const computeCrossingEdges = (cid: string): number => {
        const inside = new Set(getDescendantLeafNodes(cid));
        let count = 0;
        for (const e of allEdges) {
          const aIn = inside.has(e.source);
          const bIn = inside.has(e.target);
          if ((aIn && !bIn) || (!aIn && bIn)) count++;
        }
        return count;
      };
      // Enhanced adaptive padding for a cluster based on multiple dynamic factors
      const adaptivePadding = (cid: string): number => {
        const cluster = clusterMap.get(cid);
        const leafCount = getDescendantLeafNodes(cid).length;
        const boundary = computeCrossingEdges(cid);
        const depth = getDepth(cid);
        const labelLength = cluster?.cluster_label?.length || 0;
        
        // Dynamic base padding that scales with cluster depth
        const basePadding = Math.max(60, 100 - (depth * 15)); // More padding for top-level clusters
        
        // Dynamic per-node spacing based on cluster size
        const perNodeSpacing = leafCount <= 2 ? 20 : leafCount <= 5 ? 16 : 14;
        
        // Dynamic per-edge spacing based on boundary complexity
        const perEdgeSpacing = boundary <= 2 ? 25 : boundary <= 5 ? 20 : 18;
        
        // Additional spacing for cluster label length
        const labelSpacing = Math.max(0, (labelLength - 10) * 2);
        
        // Calculate total padding
        const pad = basePadding +   (leafCount * perNodeSpacing) +  (boundary * perEdgeSpacing) +   labelSpacing;
        
        // Dynamic bounds based on cluster complexity
        const minPadding = Math.max(60, basePadding);
        const maxPadding = Math.min(400, 200 + (leafCount * 15));
        
        return Math.max(minPadding, Math.min(pad, maxPadding));
      };
      // Layout a set of items with dagre (utility)
      const layoutWithDagre = (
        items: Array<{ id: string; width: number; height: number }>,
        relEdges: Array<{ source: string; target: string }>,
        params?: { rankdir?: "LR" | "TB" | "RL" | "BT"; nodesep?: number; ranksep?: number }
      ) => {
        const g = new dagre.graphlib.Graph();
        g.setGraph({
          rankdir: params?.rankdir || direction,
          nodesep: params?.nodesep ?? 150, // Increased for better edge routing
          ranksep: params?.ranksep ?? 200,  // Increased for cleaner paths
          edgesep: 20, // Add edge separation
          marginx: 20,
          marginy: 20,
        });
        // Enhanced edge configuration
        g.setDefaultEdgeLabel(() => ({ 
          width: 40, 
          height: 20,
          labelpos: 'c' // Center label position
        }));
        for (const it of items) {
          g.setNode(it.id, { width: it.width, height: it.height });
        }
        for (const e of relEdges) {
          g.setEdge(e.source, e.target);
        }
        dagre.layout(g);
        const positions: Record<string, { x: number; y: number; width: number; height: number }> = {};
        for (const it of items) {
          const dn = g.node(it.id) as any;
          if (dn) {
            positions[it.id] = {
              x: dn.x - it.width / 2,
              y: dn.y - it.height / 2,
              width: it.width,
              height: it.height,
            };
          }
        }
        return positions;
      };
      // Pass 1: Layout content inside each cluster, bottom-up
      // Determine depth for clusters
      const getDepth = (cid: string): number => {
        let d = 0;
        let current = clusterMap.get(cid);
        while (current && current.cluster_parent && current.cluster_parent.length > 0) {
          d++;
          current = clusterMap.get(current.cluster_parent[0]);
        }
        return d;
      };
      const clustersByDepth: Record<number, string[]> = {};
      for (const c of allClusters) {
        const depth = getDepth(c.cluster_id);
        clustersByDepth[depth] = clustersByDepth[depth] || [];
        clustersByDepth[depth].push(c.cluster_id);
      }
      // Store cluster rectangles and relative positions for children
      const clusterRect: Record<string, { x: number; y: number; width: number; height: number }> = {};
      const clusterChildNodePos: Record<string, Record<string, { x: number; y: number }>> = {};
      const clusterChildClusterPos: Record<string, Record<string, { x: number; y: number }>> = {};
      // Layout from deepest to top
      const depthLevels = Object.keys(clustersByDepth)
        .map((k) => Number(k))
        .sort((a, b) => b - a);
      for (const depth of depthLevels) {
        for (const cid of clustersByDepth[depth]) {
          const padding = adaptivePadding(cid);
          const directLeaves = (clusterMap.get(cid)?.cluster_nodes || []).filter((nid) => nodeMap.has(nid));
          const childCids = getDirectChildren(cid);
          // Create items for dagre: direct leaf nodes + child clusters as blocks if any
          const items: Array<{ id: string; width: number; height: number }> = [];
          // Add leaves
          for (const nid of directLeaves) {
            items.push({ id: nid, width: NODE_W, height: NODE_H });
          }
          // Add child clusters as items with their precomputed sizes
          for (const ccid of childCids) {
            const rect = clusterRect[ccid] || { width: NODE_W * 2, height: NODE_H * 2, x: 0, y: 0 };
            // Treat them as blocks (include some gap between clusters inside parent)
            const extra = 40;
            items.push({ id: ccid, width: rect.width + extra, height: rect.height + extra });
          }
          // Relation edges inside this cluster between items at this level
          const itemIds = new Set(items.map((i) => i.id));
          const relEdges = allEdges
            .filter((e) => {
              // Both endpoints must be within this cluster's descendants
              const allLeaves = new Set(getDescendantLeafNodes(cid));
              const within = allLeaves.has(e.source) && allLeaves.has(e.target);
              if (!within) return false;
              // Edges should connect current level items: either leaf ids or child cluster ids (via membership)
              const srcItem = directLeaves.includes(e.source)
                ? e.source
                : childCids.find((cc) => getDescendantLeafNodes(cc).includes(e.source));
              const tgtItem = directLeaves.includes(e.target)
                ? e.target
                : childCids.find((cc) => getDescendantLeafNodes(cc).includes(e.target));
              return !!srcItem && !!tgtItem && itemIds.has(srcItem) && itemIds.has(tgtItem);
            })
            .map((e) => {
              const src = directLeaves.includes(e.source)
                ? e.source
                : (childCids.find((cc) => getDescendantLeafNodes(cc).includes(e.source)) as string);
              const tgt = directLeaves.includes(e.target)
                ? e.target
                : (childCids.find((cc) => getDescendantLeafNodes(cc).includes(e.target)) as string);
              return { source: src, target: tgt };
            });
          // If no items, skip
          if (items.length === 0) {
            clusterRect[cid] = { x: 0, y: 0, width: 2 * padding, height: 2 * padding };
            clusterChildNodePos[cid] = {};
            clusterChildClusterPos[cid] = {};
            continue;
          }
          const pos = layoutWithDagre(items, relEdges, {
            rankdir: direction,
            nodesep: Math.max(200, 180 + (depth * 20)), // Dynamic node separation based on depth
            ranksep: Math.max(280, 240 + (depth * 30)), // Dynamic rank separation based on depth
          });
          // Determine bounds
          const minX = Math.min(...Object.values(pos).map((p) => p.x));
          const minY = Math.min(...Object.values(pos).map((p) => p.y));
          const maxX = Math.max(...Object.values(pos).map((p) => p.x + p.width));
          const maxY = Math.max(...Object.values(pos).map((p) => p.y + p.height));
          const width = maxX - minX + padding;
          const height = maxY - minY + padding;
          clusterRect[cid] = { x: 0, y: 0, width, height };
          // Save relative positions for child leaves and clusters (normalize to padding/2 offset)
          const offsetX = -minX + padding / 2;
          const offsetY = -minY + padding / 2;
          clusterChildNodePos[cid] = {};
          for (const nid of directLeaves) {
            const p = pos[nid];
            if (p) clusterChildNodePos[cid][nid] = { x: p.x + offsetX, y: p.y + offsetY };
          }
          clusterChildClusterPos[cid] = {};
          for (const ccid of childCids) {
            const p = pos[ccid];
            if (p) clusterChildClusterPos[cid][ccid] = { x: p.x + offsetX, y: p.y + offsetY };
          }
        }
      }
      // Treat unclustered nodes as singleton blocks
      const clusteredLeafIds = new Set<string>(
        allClusters.flatMap((c) => getDescendantLeafNodes(c.cluster_id))
      );
      const unclusteredNodes = allNodes.filter((n) => !clusteredLeafIds.has(n.id));
      type Block = { id: string; width: number; height: number; isPseudo?: boolean };
      const topBlocks: Block[] = [];
      // Add top-level cluster blocks
      for (const top of topLevelClusters) {
        const rect = clusterRect[top.cluster_id] || { width: 400, height: 300, x: 0, y: 0 };
        // Add extra separation margin for inter-cluster breathing room
        const separation = 80; // increased from 40
        topBlocks.push({ id: top.cluster_id, width: rect.width + separation, height: rect.height + separation });
      }
      // Add pseudo blocks for unclustered nodes
      for (const n of unclusteredNodes) {
        topBlocks.push({ id: `__single__${n.id}`, width: NODE_W + 80, height: NODE_H + 80, isPseudo: true });
      }
      // Build edges between top-level blocks using original edges contracted to top clusters
      const blockEdgesSet = new Set<string>();
      const blockEdges: Array<{ source: string; target: string }> = [];
      const toBlockId = (nid: string) => nodeTopCluster(nid) || `__single__${nid}`;
      for (const e of allEdges) {
        const a = toBlockId(e.source);
        const b = toBlockId(e.target);
        if (a === b) continue; // internal to same block
        const key = `${a}->${b}`;
        if (!blockEdgesSet.has(key)) {
          blockEdgesSet.add(key);
          blockEdges.push({ source: a, target: b });
        }
      }
      // Pass 2: Layout blocks (clusters as super-nodes) with dynamic spacing
      const calculateBlockSpacing = () => {
        const avgClusterSize = topLevelClusters.reduce((sum, cluster) => {
          const rect = clusterRect[cluster.cluster_id] || { width: 400, height: 300 };
          return sum + (rect.width + rect.height);
        }, 0) / Math.max(1, topLevelClusters.length);
        
        // Dynamic spacing based on average cluster size
        const baseNodeSep = Math.max(300, Math.min(500, 250 + (avgClusterSize * 0.3)));
        const baseRankSep = Math.max(380, Math.min(600, 320 + (avgClusterSize * 0.4)));
        
        return { nodesep: baseNodeSep, ranksep: baseRankSep };
      };
      
      const blockSpacing = calculateBlockSpacing();
      
      const blockPositions = layoutWithDagre(
        topBlocks.map((b) => ({ id: b.id, width: b.width, height: b.height })),
        blockEdges,
        { rankdir: direction, nodesep: blockSpacing.nodesep, ranksep: blockSpacing.ranksep }
      );
      // Pass 3: Collision detection and adaptive separation with repulsion
const ensureSeparation = (
  positions: Record<string, { x: number; y: number; width: number; height: number }>
) => {
  const ids = Object.keys(positions);
  // run multiple passes until overlaps are resolved
  for (let iter = 0; iter < 10; iter++) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = positions[ids[i]];
        const b = positions[ids[j]];
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        // ✅ adaptive minGap based on cluster size
        const minGapX = Math.max(60, Math.min(200, Math.min(a.width, b.width) * 0.15));
        const minGapY = Math.max(60, Math.min(200, Math.min(a.height, b.height) * 0.15));
        if (overlapX > -minGapX && overlapY > -minGapY) {
          // calculate how much to push apart
          const shiftX = (overlapX + minGapX) / 2;
          const shiftY = (overlapY + minGapY) / 2;
          // push X
          if (a.x < b.x) {
            a.x -= shiftX / 2;
            b.x += shiftX / 2;
          } else {
            a.x += shiftX / 2;
            b.x -= shiftX / 2;
          }
          // push Y
          if (a.y < b.y) {
            a.y -= shiftY / 2;
            b.y += shiftY / 2;
          } else {
            a.y += shiftY / 2;
            b.y -= shiftY / 2;
          }
        }
      }
    }
  }
};
      ensureSeparation(blockPositions); // increased from 30
      // Compose final RF nodes
      const rfNodes: any[] = [];
      // Place clusters recursively using stored relative positions
      const placeClusterRecursive = (cid: string, originX: number, originY: number, depth: number = 0, parentColorIndex?: number) => {
        const rect = clusterRect[cid];
        const meta = graphJson.clusters.find((c) => c.cluster_id === cid);
        const clusterColor = getClusterColor(depth, cid, parentColorIndex);
        const emptyCluster = isClusterEmpty(meta, graphJson.clusters, clusterMap);
        const parentClusterOnly = isParentClusterOnly(meta, graphJson.clusters);
        
        // Calculate current color index for passing to children
        const currentColorIndex = (depth + cid.charCodeAt(0)) % CLUSTER_COLORS.length;
        // If parent color was provided and matches current, adjust for children
        const colorIndexForChildren = parentColorIndex !== undefined && currentColorIndex === parentColorIndex 
          ? (currentColorIndex + 1) % CLUSTER_COLORS.length 
          : currentColorIndex;
        
        rfNodes.push({
          id: cid,
          type: "cluster",
          data: {
            label: meta?.cluster_label || cid,
            tint: emptyCluster ? "transparent" : clusterColor.tint,
            borderColor: clusterColor.border,
            isDarkMode: isDarkMode,
            depth: depth,
          },
          position: { x: originX, y: originY },
          style: { width: rect.width, height: rect.height, zIndex: -1 },
          draggable: false,
        });
        // Place direct child leaves
        const childPos = clusterChildNodePos[cid] || {};
        const srcPos = direction === 'LR' ? Position.Right : Position.Bottom;
        const tgtPos = direction === 'LR' ? Position.Left : Position.Top;
        for (const [nid, p] of Object.entries(childPos)) {
          const dataNode = nodeMap.get(nid)!;
          rfNodes.push({
            id: nid,
            type: "custom",
            data: { ...dataNode.data, isDarkMode: isDarkMode },
            position: { x: originX + p.x, y: originY + p.y },
            sourcePosition: srcPos,
            targetPosition: tgtPos,
          });
        }
        // Place child clusters
        const chClusters = getDirectChildren(cid);
        for (const ccid of chClusters) {
          const p = (clusterChildClusterPos[cid] || {})[ccid];
          if (!p) continue;
          placeClusterRecursive(ccid, originX + p.x, originY + p.y, depth + 1, colorIndexForChildren);
        }
      };
      // Place top-level blocks
      for (const top of topLevelClusters) {
        const pos = blockPositions[top.cluster_id];
        if (!pos) continue;
        // Normalize cluster box (remove the extra separation margin we added to size)
        const rect = clusterRect[top.cluster_id];
        const offsetX = pos.x + (pos.width - rect.width) / 2;
        const offsetY = pos.y + (pos.height - rect.height) / 2;
        placeClusterRecursive(top.cluster_id, offsetX, offsetY);
      }
      // Place unclustered nodes as their own small blocks
      for (const n of unclusteredNodes) {
        const bid = `__single__${n.id}`;
        const pos = blockPositions[bid];
        if (!pos) continue;
        const x = pos.x + (pos.width - NODE_W) / 2;
        const y = pos.y + (pos.height - NODE_H) / 2;
        rfNodes.push({
          id: n.id,
          type: "custom",
          data: { ...n.data, isDarkMode: isDarkMode },
          position: { x, y },
          sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
          targetPosition: direction === 'LR' ? Position.Left : Position.Top,
        });
      }
      setNodes(rfNodes);
      setEdges(
        allEdges.map((e) => ({
          ...e,
          type: "openArrow",
          data: { isDarkMode },
          style: {
            strokeWidth: 2.5,
          },
          labelStyle: {
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "system-ui, -apple-system, sans-serif"
          },
          labelBgStyle: {
            fill: isDarkMode ? "#2d3748" : "#ffffff",
            stroke: isDarkMode ? "#4a5568" : "#e2e8f0",
            strokeWidth: 1,
            rx: 12,
            opacity: 0.95
          }
        }))
      );
    };
    run();
  }, [direction, isDarkMode]);
  // Fit view when nodes or edges change
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      const timeout = setTimeout(() => {
        reactFlowInstance.fitView({
          padding: 0.2,
          duration: 300,
        });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [nodes, edges, reactFlowInstance]);
  return (
    <div style={{ width: "100%", height: "100vh", background: isDarkMode ? "#1e1e1e" : "#ffffff", position: 'relative' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setDirection('LR')}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #444',
            background: direction === 'LR' ? '#2d6cdf' : '#222',
            color: '#fff',
            cursor: 'pointer'
          }}
        >Horizontal</button>
        <button
          onClick={() => setDirection('TB')}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #444',
            background: direction === 'TB' ? '#2d6cdf' : '#222',
            color: '#fff',
            cursor: 'pointer'
          }}
        >Vertical</button>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #444',
            background: isDarkMode ? '#f39c12' : '#3498db',
            color: '#fff',
            cursor: 'pointer'
          }}
        >{isDarkMode ? 'Light' : 'Dark'}</button>
        <button
          onClick={() => {
            if (reactFlowInstance) {
              reactFlowInstance.fitView({
                padding: 0.2,
                duration: 300,
              });
            }
          }}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #444',
            background: '#2d6cdf',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >Fit View</button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        defaultEdgeOptions={{
          type: 'openArrow',
          style: { strokeWidth: 2.5 },
          animated: false,
        }}
        connectionLineStyle={{ strokeWidth: 2.5 }}
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 2,
        }}
        defaultViewport={{
          x: 0,
          y: 0,
          zoom: 1,
        }}
        minZoom={0.1}
        maxZoom={4}
        attributionPosition="bottom-left"
      >
        <MiniMap />
        <Controls />
        <Background color={isDarkMode ? "#333" : "#ddd"} gap={16} />
      </ReactFlow>
    </div>
  );
}
// Wrapper component with ReactFlowProvider
export default function EraserFlowWithProvider() {
  return (
    <ReactFlowProvider>
      <EraserFlow />
    </ReactFlowProvider>
  );
}
