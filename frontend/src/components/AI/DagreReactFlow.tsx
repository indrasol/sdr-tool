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
      "id": "user",
      "type": "custom",
      "data": {
        "label": "Client",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/onprem/client/user.png"
      },
      "position": {
        "x": -202.6169646372133,
        "y": 175.9108723662823
      }
    },
    {
      "id": "gke",
      "type": "custom",
      "data": {
        "label": "GKE Cluster",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/gcp/compute/gke-on-prem.png"
      },
      "position": {
        "x": -167.78435064622442,
        "y": -500
      }
    },
    {
      "id": "api_gateway",
      "type": "custom",
      "data": {
        "label": "API Gateway",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/gcp/api/endpoints.png"
      },
      "position": {
        "x": 372.0847328955177,
        "y": 233.62163695167374
      }
    },
    {
      "id": "service_mesh",
      "type": "custom",
      "data": {
        "label": "Service Mesh",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/gcp/compute/gke-on-prem.png"
      },
      "position": {
        "x": 89.28261452811806,
        "y": 51.788219863691566
      }
    },
    {
      "id": "service1",
      "type": "custom",
      "data": {
        "label": "Service 1",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/gcp/compute/gke-on-prem.png"
      },
      "position": {
        "x": 415.4491060671654,
        "y": -5.555168090857366
      }
    },
    {
      "id": "service2",
      "type": "custom",
      "data": {
        "label": "Service 2",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/gcp/compute/gke-on-prem.png"
      },
      "position": {
        "x": -0.14460245007202183,
        "y": 428.31924373352905
      }
    },
    {
      "id": "service3",
      "type": "custom",
      "data": {
        "label": "Service 3",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/gcp/compute/gke-on-prem.png"
      },
      "position": {
        "x": -292.51486079003377,
        "y": 113.87180664315476
      }
    },
    {
      "id": "cache",
      "type": "custom",
      "data": {
        "label": "Redis Cache",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/gcp/database/memorystore.png"
      },
      "position": {
        "x": 348.27652667670975,
        "y": -372.4668829631653
      }
    },
    {
      "id": "message_broker",
      "type": "custom",
      "data": {
        "label": "Pub/Sub",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/gcp/analytics/pubsub.png"
      },
      "position": {
        "x": -185.8268456584053,
        "y": 399.1902346081009
      }
    },
    {
      "id": "database",
      "type": "custom",
      "data": {
        "label": "Cloud Spanner",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/gcp/database/spanner.png"
      },
      "position": {
        "x": 189.2591337542225,
        "y": 358.14647549884916
      }
    },
    {
      "id": "cicd",
      "type": "custom",
      "data": {
        "label": "Cloud Build",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/gcp/devtools/build.png"
      },
      "position": {
        "x": 122.94780904264525,
        "y": -493.21551900214376
      }
    },
    {
      "id": "monitoring",
      "type": "custom",
      "data": {
        "label": "Cloud Monitoring",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/gcp/operations/monitoring.png"
      },
      "position": {
        "x": -71.01710077996937,
        "y": -421.4098795065207
      }
    },
    {
      "id": "logging",
      "type": "custom",
      "data": {
        "label": "Cloud Logging",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/gcp/operations/logging.png"
      },
      "position": {
        "x": -364.9628319593693,
        "y": -317.1039779306521
      }
    },
    {
      "id": "waf",
      "type": "custom",
      "data": {
        "label": "Web Application Firewall",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/onprem/network/nginx.png"
      },
      "position": {
        "x": -252.43236604309106,
        "y": 348.90293782805776
      }
    }
  ],
  "edges": [
    {
      "id": "user_api_gateway",
      "source": "user",
      "target": "api_gateway",
      "label": "HTTPS 443 / TLS1.3"
    },
    {
      "id": "api_gateway_service_mesh",
      "source": "api_gateway",
      "target": "service_mesh",
      "label": "HTTPS 443 / JWT Auth"
    },
    {
      "id": "service_mesh_service1",
      "source": "service_mesh",
      "target": "service1",
      "label": "gRPC mTLS 8080"
    },
    {
      "id": "service_mesh_service2",
      "source": "service_mesh",
      "target": "service2",
      "label": "gRPC mTLS 8080"
    },
    {
      "id": "service_mesh_service3",
      "source": "service_mesh",
      "target": "service3",
      "label": "gRPC mTLS 8080"
    },
    {
      "id": "service1_cache",
      "source": "service1",
      "target": "cache",
      "label": "Redis Cache 6379 / TLS"
    },
    {
      "id": "service2_message_broker",
      "source": "service2",
      "target": "message_broker",
      "label": "Pub/Sub Message"
    },
    {
      "id": "service3_message_broker",
      "source": "service3",
      "target": "message_broker",
      "label": "Pub/Sub Message"
    },
    {
      "id": "service1_database",
      "source": "service1",
      "target": "database",
      "label": "JDBC TLS 443"
    },
    {
      "id": "service2_database",
      "source": "service2",
      "target": "database",
      "label": "JDBC TLS 443"
    },
    {
      "id": "service3_database",
      "source": "service3",
      "target": "database",
      "label": "JDBC TLS 443"
    },
    {
      "id": "cicd_gke",
      "source": "cicd",
      "target": "gke",
      "label": "Deploy Image"
    },
    {
      "id": "gke_monitoring",
      "source": "gke",
      "target": "monitoring",
      "label": "Metrics Export"
    },
    {
      "id": "gke_logging",
      "source": "gke",
      "target": "logging",
      "label": "Log Export"
    },
    {
      "id": "waf_api_gateway",
      "source": "waf",
      "target": "api_gateway",
      "label": "HTTPS 443 / TLS1.3"
    }
  ],
  "clusters": [
    {
      "cluster_id": "gcp_environment",
      "cluster_label": "GCP Environment",
      "cluster_nodes": [
        "waf"
      ],
      "cluster_parent": []
    },
    {
      "cluster_id": "kubernetes_cluster",
      "cluster_label": "Kubernetes Cluster",
      "cluster_nodes": [
        "gke",
        "api_gateway",
        "service_mesh",
        "cache",
        "message_broker"
      ],
      "cluster_parent": [
        "gcp_environment"
      ]
    },
    {
      "cluster_id": "microservices",
      "cluster_label": "Microservices",
      "cluster_nodes": [
        "service1",
        "service2",
        "service3"
      ],
      "cluster_parent": [
        "kubernetes_cluster"
      ]
    },
    {
      "cluster_id": "data_layer",
      "cluster_label": "Data Layer",
      "cluster_nodes": [
        "database"
      ],
      "cluster_parent": [
        "gcp_environment"
      ]
    },
    {
      "cluster_id": "ci/cd",
      "cluster_label": "CI/CD",
      "cluster_nodes": [
        "cicd"
      ],
      "cluster_parent": [
        "gcp_environment"
      ]
    },
    {
      "cluster_id": "monitoring_and_logging",
      "cluster_label": "Monitoring and Logging",
      "cluster_nodes": [
        "monitoring",
        "logging"
      ],
      "cluster_parent": [
        "gcp_environment"
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
      {/* Hidden handles to allow edges to connect to clusters */}
      <Handle type="target" position={Position.Left}   style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <Handle type="target" position={Position.Top}    style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <Handle type="target" position={Position.Right}  style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <Handle type="target" position={Position.Bottom} style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <Handle type="source" position={Position.Left}   style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <Handle type="source" position={Position.Top}    style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <Handle type="source" position={Position.Right}  style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
    </div>
  );
};
// Edge tokens and sizing — Eraser dark-mode look
const EDGE_WIDTH = 20;
const EDGE_HALO_EXTRA = 0.9;
const EDGE_CORNER_RADIUS = 50;
const EDGE_OFFSET = 50;

const EDGE_TOKENS = {
  dark: {
    stroke: "#ffffff !important",
    halo: "rgba(255,255,255,0.28)",
    shadow: "rgba(0,0,0,0.28)",
    labelBg: "#374151",
    labelStroke: "#6B7280",
    labelText: "#F9FAFB",
  },
  light: {
    stroke: "#374151",
    halo: "rgba(0, 0, 0, 0)",
    shadow: "rgba(0, 0, 0, 0.1)",
    labelBg: "#FFFFFF",
    labelStroke: "#D1D5DB",
    labelText: "#1F2937",
  },
} as const;
// ─── Dynamic Eraser-Style Edge Component ────────────────────────────────
const DynamicEraserEdge: React.FC<EdgeProps> = (props) => {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, data } = props;
  const isDarkMode = (data as any)?.isDarkMode ?? true;
  const T = isDarkMode ? EDGE_TOKENS.dark : EDGE_TOKENS.light;

  // Get fanout/fanin data from edge data
  const {
    siblings = 1,
    index = 0,
    inSiblings = 1,
    inIndex = 0,
    routeAroundClusters = false,
    clusterExitPoint,
    clusterEntryPoint,
    obstacles = [], // [{ x, y, width, height }]
    isBidirectional = false,
    forwardLabel,
    reverseLabel,
    useClusterBoundaryForSource = false,
    useClusterBoundaryForTarget = false,
    clusterBoundarySourcePoint,
    clusterBoundaryTargetPoint,
    useCenterForSource = false,
    useCenterForTarget = false,
  } = (data as any) || {};
  
  const FANOUT_OFFSET = 20;
  const CLUSTER_AVOIDANCE_OFFSET = 20;
  const MIN_EDGE_SEPARATION = 10;
  const CONNECTION_POINT_OFFSET = 8;

  // Calculate intelligent routing points with proper connection handling
  let sx = sourceX;
  let sy = sourceY;
  let tx = targetX;
  let ty = targetY;

  // Choose effective handle directions to avoid obstacles between source and target
  let effectiveSourcePosition = sourcePosition;
  let effectiveTargetPosition = targetPosition;

  type Rect = { x: number; y: number; width: number; height: number };
  const rectIntersectsHorizontalBand = (r: Rect, y: number, bandHalf: number, x1: number, x2: number) => {
    const yMin = y - bandHalf;
    const yMax = y + bandHalf;
    const rx1 = r.x;
    const rx2 = r.x + r.width;
    const ry1 = r.y;
    const ry2 = r.y + r.height;
    const overlapY = !(ry2 < yMin || ry1 > yMax);
    const overlapX = !(rx2 < Math.min(x1, x2) || rx1 > Math.max(x1, x2));
    return overlapY && overlapX;
  };
  const rectIntersectsVerticalBand = (r: Rect, x: number, bandHalf: number, y1: number, y2: number) => {
    const xMin = x - bandHalf;
    const xMax = x + bandHalf;
    const rx1 = r.x;
    const rx2 = r.x + r.width;
    const ry1 = r.y;
    const ry2 = r.y + r.height;
    const overlapX = !(rx2 < xMin || rx1 > xMax);
    const overlapY = !(ry2 < Math.min(y1, y2) || ry1 > Math.max(y1, y2));
    return overlapX && overlapY;
  };
  const BAND_HALF = 40; // clearance around the baseline corridor

  // Horizontal layout avoidance
  if (sourcePosition === Position.Right || sourcePosition === Position.Left) {
    const blockedMid = (obstacles as Rect[]).some((r) =>
      rectIntersectsHorizontalBand(r, (sourceY + targetY) / 2, BAND_HALF, sourceX, targetX)
    );
    if (blockedMid) {
      // Prefer routing above if clear, else below
      const upClear = !(obstacles as Rect[]).some((r) =>
        rectIntersectsHorizontalBand(r, Math.min(sourceY, targetY) - 120, BAND_HALF, sourceX, targetX)
      );
      const downClear = !(obstacles as Rect[]).some((r) =>
        rectIntersectsHorizontalBand(r, Math.max(sourceY, targetY) + 120, BAND_HALF, sourceX, targetX)
      );
      if (upClear) {
        effectiveSourcePosition = Position.Top;
        effectiveTargetPosition = Position.Left;
      } else if (downClear) {
        effectiveSourcePosition = Position.Bottom;
        effectiveTargetPosition = Position.Right;
      }
    }
  } else {
    // Vertical layout avoidance
    const blockedMid = (obstacles as Rect[]).some((r) =>
      rectIntersectsVerticalBand(r, (sourceX + targetX) / 2, BAND_HALF, sourceY, targetY)
    );
    if (blockedMid) {
      const leftClear = !(obstacles as Rect[]).some((r) =>
        rectIntersectsVerticalBand(r, Math.min(sourceX, targetX) - 120, BAND_HALF, sourceY, targetY)
      );
      const rightClear = !(obstacles as Rect[]).some((r) =>
        rectIntersectsVerticalBand(r, Math.max(sourceX, targetX) + 120, BAND_HALF, sourceY, targetY)
      );
      if (leftClear) {
        effectiveSourcePosition = Position.Left;
        effectiveTargetPosition = Position.Left;
      } else if (rightClear) {
        effectiveSourcePosition = Position.Right;
        effectiveTargetPosition = Position.Right;
      }
    }
  }

  // Ensure edges start from proper connection points, not node centers
  const getConnectionPoint = (x: number, y: number, position: Position, isSource: boolean, idx = 0) => {
    if (isSource ? useCenterForSource : useCenterForTarget) return { x, y };
    const offset = isSource ? CONNECTION_POINT_OFFSET : -CONNECTION_POINT_OFFSET;
    
    switch (position) {
      case Position.Right:
        return { x: x + offset, y: y };
      case Position.Left:
        return { x: x - offset, y: y };
      case Position.Top:
        return { x: x, y: y - offset };
      case Position.Bottom:
        return { x: x, y: y + offset };
      default:
        return { x, y };
    }
  };

  // Apply proper connection points
  const sourceConn = getConnectionPoint(sourceX, sourceY, effectiveSourcePosition, true, index);
  const targetConn = getConnectionPoint(targetX, targetY, effectiveTargetPosition, false, inIndex);
  
  sx = sourceConn.x;
  sy = sourceConn.y;
  tx = targetConn.x;
  ty = targetConn.y;

  // If instructed, override with explicit cluster boundary points so edges
  // originate/terminate on cluster borders rather than centers
  if (useClusterBoundaryForSource && clusterBoundarySourcePoint) {
    sx = (clusterBoundarySourcePoint as any).x ?? sx;
    sy = (clusterBoundarySourcePoint as any).y ?? sy;
    // Derive a sensible handle direction for smooth path math
    const dx = (tx - sx);
    const dy = (ty - sy);
    if (Math.abs(dx) >= Math.abs(dy)) {
      effectiveSourcePosition = dx >= 0 ? Position.Right : Position.Left;
    } else {
      effectiveSourcePosition = dy >= 0 ? Position.Bottom : Position.Top;
    }
  }
  if (useClusterBoundaryForTarget && clusterBoundaryTargetPoint) {
    tx = (clusterBoundaryTargetPoint as any).x ?? tx;
    ty = (clusterBoundaryTargetPoint as any).y ?? ty;
    const dx = (tx - sx);
    const dy = (ty - sy);
    if (Math.abs(dx) >= Math.abs(dy)) {
      effectiveTargetPosition = dx >= 0 ? Position.Left : Position.Right;
    } else {
      effectiveTargetPosition = dy >= 0 ? Position.Top : Position.Bottom;
    }
  }

  // Calculate uniform separation for even edge placement
  const totalOutgoing = siblings;
  const totalIncoming = inSiblings;
  const maxEdges = Math.max(totalOutgoing, totalIncoming);
  
  // Use consistent, predictable spacing based on number of edges
  const baseSeparation = Math.max(MIN_EDGE_SEPARATION, FANOUT_OFFSET);
  const edgeMultiplier = Math.max(1, Math.ceil(maxEdges / 2));
  const uniformSeparation = baseSeparation * edgeMultiplier;
  
  // Uniform fan-out at source for even edge placement
  if (effectiveSourcePosition === Position.Right || effectiveSourcePosition === Position.Left) {
    // Vertical stacking for horizontal connections
    if (totalOutgoing > 1) {
      const spacing = uniformSeparation;
      const totalHeight = (totalOutgoing - 1) * spacing;
      const startY = sy - totalHeight / 2;
      sy = startY + (index * spacing);
    }
  } else {
    // Horizontal stacking for vertical connections
    if (totalOutgoing > 1) {
      const spacing = uniformSeparation;
      const totalWidth = (totalOutgoing - 1) * spacing;
      const startX = sx - totalWidth / 2;
      sx = startX + (index * spacing);
    }
  }

  // Uniform fan-in at target for even edge placement
  if (effectiveTargetPosition === Position.Right || effectiveTargetPosition === Position.Left) {
    // Vertical stacking for horizontal connections
    if (totalIncoming > 1) {
      const spacing = uniformSeparation;
      const totalHeight = (totalIncoming - 1) * spacing;
      const startY = ty - totalHeight / 2;
      ty = startY + (inIndex * spacing);
    }
  } else {
    // Horizontal stacking for vertical connections
    if (totalIncoming > 1) {
      const spacing = uniformSeparation;
      const totalWidth = (totalIncoming - 1) * spacing;
      const startX = tx - totalWidth / 2;
      tx = startX + (inIndex * spacing);
    }
  }

  // Enhanced routing for cluster avoidance with anti-overlap logic
  if (routeAroundClusters && clusterExitPoint && clusterEntryPoint) {
    // Use cluster exit/entry points for routing
    const midX = (clusterExitPoint.x + clusterEntryPoint.x) / 2;
    const midY = (clusterExitPoint.y + clusterEntryPoint.y) / 2;
    
    // Create waypoints for routing around clusters
    const waypoint1X = (sx + clusterExitPoint.x) / 2;
    const waypoint1Y = (sy + clusterExitPoint.y) / 2;
    const waypoint2X = (clusterEntryPoint.x + tx) / 2;
    const waypoint2Y = (clusterEntryPoint.y + ty) / 2;
    
    // Enhanced anti-overlap routing with directional awareness
    const isHorizontalRoute = Math.abs(sx - tx) > Math.abs(sy - ty);
    
    if (isHorizontalRoute) {
      // Horizontal routing - enhanced Y coordinate separation
      const edgeSpecificOffset = (index - (siblings - 1) / 2) * CLUSTER_AVOIDANCE_OFFSET;
      const targetSpecificOffset = (inIndex - (inSiblings - 1) / 2) * CLUSTER_AVOIDANCE_OFFSET;
      
      // Apply different offsets for source and target to prevent crossing
      sy += edgeSpecificOffset;
      ty += targetSpecificOffset;
      
      // Add additional separation for edges going in same direction
      if (Math.sign(edgeSpecificOffset) === Math.sign(targetSpecificOffset)) {
        const additionalSeparation = Math.abs(edgeSpecificOffset - targetSpecificOffset) * 0.3;
        sy += Math.sign(edgeSpecificOffset) * additionalSeparation;
        ty -= Math.sign(targetSpecificOffset) * additionalSeparation;
      }
    } else {
      // Vertical routing - enhanced X coordinate separation
      const edgeSpecificOffset = (index - (siblings - 1) / 2) * CLUSTER_AVOIDANCE_OFFSET;
      const targetSpecificOffset = (inIndex - (inSiblings - 1) / 2) * CLUSTER_AVOIDANCE_OFFSET;
      
      // Apply different offsets for source and target to prevent crossing
      sx += edgeSpecificOffset;
      tx += targetSpecificOffset;
      
      // Add additional separation for edges going in same direction
      if (Math.sign(edgeSpecificOffset) === Math.sign(targetSpecificOffset)) {
        const additionalSeparation = Math.abs(edgeSpecificOffset - targetSpecificOffset) * 0.3;
        sx += Math.sign(edgeSpecificOffset) * additionalSeparation;
        tx -= Math.sign(targetSpecificOffset) * additionalSeparation;
      }
    }
  } else {
    // Standard uniform routing for consistent edge separation
    // Apply uniform spacing for non-cluster routing
    if (effectiveSourcePosition === Position.Right || effectiveSourcePosition === Position.Left) {
      const baseOffset = (index - (siblings - 1) / 2) * uniformSeparation;
      sy += baseOffset;
    } else {
      const baseOffset = (index - (siblings - 1) / 2) * uniformSeparation;
      sx += baseOffset;
    }
    
    if (effectiveTargetPosition === Position.Right || effectiveTargetPosition === Position.Left) {
      const baseOffset = (inIndex - (inSiblings - 1) / 2) * uniformSeparation;
      ty += baseOffset;
    } else {
      const baseOffset = (inIndex - (inSiblings - 1) / 2) * uniformSeparation;
      tx += baseOffset;
    }
  }

  // Detect if this is a straight edge (horizontal or vertical)
  const isHorizontalEdge = Math.abs(sy - ty) < 5; // Within 5px = horizontal
  const isVerticalEdge   = Math.abs(sx - tx) < 5; // Within 5px = vertical
  const isStraightEdge   = isHorizontalEdge || isVerticalEdge;

  // Use different corner radius / offset for straight vs curved edges
  const cornerRadius = isStraightEdge ? 0 : EDGE_CORNER_RADIUS;
  const offsetValue  = isStraightEdge ? 0 : EDGE_OFFSET;

  // Use the adjusted coordinates for path calculation
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
    sourcePosition: effectiveSourcePosition,
    targetPosition: effectiveTargetPosition,
    borderRadius: cornerRadius,
    offset: offsetValue,
  });

  const labelText = String(label ?? "");
  
  // Split long labels into multiple lines
  const splitLabelIntoLines = (text: string, maxCharsPerLine: number = 12): string[] => {
    if (text.length <= maxCharsPerLine) return [text];
    
    // Split by common delimiters first
    const parts = text.split(/[\s\/\-]+/);
    const lines: string[] = [];
    let currentLine = "";
    
    for (const part of parts) {
      const testLine = currentLine ? `${currentLine} ${part}` : part;
      
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = part;
        } else {
          // If single word is too long, force break it
          lines.push(part);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };
  
  const labelLines = splitLabelIntoLines(labelText);
  const isMultiLine = labelLines.length > 1;
  
  // Dynamic font sizing based on label length - matching node label sizes
  const calculateFontSize = (text: string): number => {
    const baseSize = isMultiLine ? 30 : 35; // Slightly smaller for multi-line
    const minLength = 8;
    const maxLength = 20;
    
    if (text.length <= minLength) return baseSize;
    if (text.length >= maxLength) return baseSize * 0.7;
    
    // Linear interpolation between baseSize and reduced size
    const ratio = (text.length - minLength) / (maxLength - minLength);
    return baseSize - (ratio * (baseSize * 0.3));
  };

  const fontSize = calculateFontSize(labelText);
  
  // Calculate label dimensions for gap creation - accounting for multi-line
  const labelPadding = 8; // Reduced padding to prevent cutting off arrows
  const maxLineWidth = Math.max(...labelLines.map(line => line.length));
  const estimatedLabelWidth = Math.min(
    (maxLineWidth * fontSize * 0.55) + (labelPadding * 2), // Width based on longest line
    300 // Maximum gap width to prevent cutting off arrows
  );
  const lineHeight = fontSize * 1.2; // Line spacing
  const totalTextHeight = labelLines.length * lineHeight - (lineHeight - fontSize); // Adjust for line spacing
  const labelHeight = totalTextHeight + (labelPadding * 1.5); // Account for multi-line height

  // Create path segments with gap for label
  const createPathWithGap = (path: string, centerX: number, centerY: number, gapWidth: number, gapHeight: number) => {
    // Parse the path to find segments
    const pathCommands = path.match(/[MLC][^MLC]*/g) || [];
    
    if (pathCommands.length === 0) return path;
    
    // For smooth step paths, we need to find the point closest to the label center
    // and create a gap around it
    const halfGapWidth = gapWidth / 2;
    const halfGapHeight = gapHeight / 2;
    
    // Create a mask to hide the path in the label area
    return path; // We'll use SVG masking instead for better control
  };

  // Calculate distance from label to target to avoid cutting arrow
  const distanceToTarget = Math.sqrt(
    Math.pow(tx - labelX, 2) + Math.pow(ty - labelY, 2)
  );
  const distanceToSource = Math.sqrt(
    Math.pow(sx - labelX, 2) + Math.pow(sy - labelY, 2)
  );
  
  const minDistanceFromArrow = 30; // Minimum distance to prevent arrow interference

  // Create gap only if label is not too close to arrow heads to prevent interference
  const shouldCreateGap = !!label &&
    distanceToTarget > minDistanceFromArrow &&
    distanceToSource > minDistanceFromArrow;
  
  return (
    <>
      <defs>
        {/* Create a mask to cut out the label area from the edge */}
        <mask id={`edge-mask-${id}`} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="-100000" y="-100000" width="200000" height="200000">
          <rect x="-5000" y="-5000" width="10000" height="10000" fill="white" />
          {shouldCreateGap && (
            <rect
              x={labelX - estimatedLabelWidth / 2}
              y={labelY - labelHeight / 2}
              width={estimatedLabelWidth}
              height={labelHeight}
              fill="black"
              rx={8}
            />
          )}
        </mask>
      </defs>

      {/* halo edge with mask */}
      <BaseEdge
        id={`${id}-halo`}
        path={edgePath}
        markerEnd={`url(#eraser-arrow-${isDarkMode ? "dark" : "light"})`}
        mask={shouldCreateGap ? `url(#edge-mask-${id})` : undefined}
        style={{
          stroke: isDarkMode ? "#ffffff" : T.stroke,
          strokeWidth: EDGE_WIDTH + EDGE_HALO_EXTRA,
          opacity: isDarkMode ? 1.0 : 0.5,
          filter: isDarkMode ? "none" : "blur(0.7px)",
          fill: "none",
          strokeLinecap: "round",
          strokeLinejoin: "round",
        
          pointerEvents: "none",
          
        }}
      />

      {/* main stroke with mask (line only, no arrow) */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#eraser-arrow-${isDarkMode ? "dark" : "light"})`}
        mask={shouldCreateGap ? `url(#edge-mask-${id})` : undefined}
        style={{
          stroke: isDarkMode ? "#ffffff" : T.stroke,
          strokeWidth: EDGE_WIDTH,
          fill: "none",
          filter: isDarkMode ? "none" : `drop-shadow(0 1.5px 3px ${T.shadow})`,
          opacity: 1.0,
          strokeOpacity: 1.0,
          paintOrder: "stroke",
          pointerEvents: "none",
          
        }}
      />

      {/* separate arrow path so arrow is never masked */}
      <path
        d={edgePath}
        stroke="none"
        fill="none"
        markerEnd={`url(#eraser-arrow-${isDarkMode ? "dark" : "light"})`}
        markerStart={isBidirectional ? `url(#eraser-arrow-start-${isDarkMode ? "dark" : "light"})` : undefined}
      />

      {/* Large text label matching node label size - with multi-line support */}
      {label && (
        <g>
          {labelLines.map((line, index) => {
            const lineY = labelY + (index - (labelLines.length - 1) / 2) * lineHeight;
            return (
              <text
                key={index}
                x={labelX}
                y={lineY}
                style={{
                  fontSize: fontSize,
                  fontWeight: 700, // Match node label weight
                  fill: T.labelText,
                  textAnchor: "middle",
                  dominantBaseline: "middle",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  // Enhanced text shadow for larger text
                  textShadow: isDarkMode 
                    ? "0 0 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)"
                    : "0 0 4px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.7)",
                  // Stronger stroke for larger text
                  stroke: isDarkMode ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)",
                  strokeWidth: 1,
                  paintOrder: "stroke fill",
                }}
              >
                {line}
              </text>
            );
          })}
        </g>
      )}

      {/* filled arrowhead */}
      <svg style={{ height: 0, width: 0 }}>
        <defs>
          <marker
            id={`eraser-arrow-${isDarkMode ? "dark" : "light"}`}
            markerWidth="20"
            markerHeight="20"
            refX="20"
            refY="8"
            orient="auto"
            markerUnits="strokeWidth"
          >
          {/* Open V shape - two lines forming a V */}
          <polyline
              points="2,3 20,8 2,13"
              fill="none"
              stroke={isDarkMode ? "#ffffff" : T.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </marker>
          
          {/* Start arrow marker for bidirectional edges */}
          <marker
            id={`eraser-arrow-start-${isDarkMode ? "dark" : "light"}`}
            markerWidth="20"
            markerHeight="20"
            refX="0"
            refY="8"
            orient="auto"
            markerUnits="strokeWidth"
          >
          {/* Open V shape pointing in opposite direction */}
          <polyline
              points="18,3 0,8 18,13"
              fill="none"
              stroke={isDarkMode ? "#ffffff" : T.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
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
// Check if cluster is empty (no direct cluster_nodes and no child clusters)
const isClusterEmpty = (cluster: any, allClusters: any[], clusterMap: Map<string, any>) => {
  const hasDirectNodes = cluster.cluster_nodes && cluster.cluster_nodes.length > 0;
  const hasChildClusters = allClusters.some((c) =>
    c.cluster_parent && c.cluster_parent.includes(cluster.cluster_id)
  );
  return !hasDirectNodes && !hasChildClusters;
};
// Check if cluster is a parent cluster that should only show boundaries
const isParentClusterOnly = (cluster: any, allClusters: any[]) => {
  const hasChildClusters = allClusters.some((c) =>
    c.cluster_parent && c.cluster_parent.includes(cluster.cluster_id)
  );
  // Parent cluster if it has child clusters (regardless of direct cluster_nodes)
  return hasChildClusters;
};
// Dagre-only: removed ELK utilities
// ─── Inject style to override edge color ────────────────────────────────
const ensureEraserEdgeStyle = () => {
  const STYLE_ID = "eraser-edge-style";
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const styleTag = document.createElement("style");
  styleTag.id = STYLE_ID;
  styleTag.innerHTML = `
    .react-flow .react-flow__edge-path.eraser-edge-dark { stroke: #ffffff !important; }
    .react-flow .react-flow__edge-path.eraser-edge-light { stroke: #000000 !important; }
  `;
  document.head.appendChild(styleTag);
};
ensureEraserEdgeStyle();


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
      // Map each leaf node to its immediate cluster (non-recursive)
      const nodeToImmediateCluster = new Map<string, string>();
      for (const c of allClusters) {
        for (const nid of (c.cluster_nodes || [])) {
          if (nodeMap.has(nid)) {
            nodeToImmediateCluster.set(nid, c.cluster_id);
          }
        }
      }
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
      // Aggregate edges at cluster boundary when multiple edges share same cluster↔node endpoints
      const aggregateEdges = (edgesInput: any[]) => {
        const skipIds = new Set<string>();
        const aggregated: any[] = [];
        const joinLabels = (list: any[]) => {
          const labels = Array.from(new Set(list.map((e) => e.label).filter(Boolean)));
          return labels.length <= 1 ? (labels[0] || '') : labels.join(' / ');
        };
        // Forward aggregation: many sources in same immediate cluster -> same target
        const fwd = new Map<string, any[]>();
        for (const e of edgesInput) {
          const srcCluster = nodeToImmediateCluster.get(e.source);
          if (!srcCluster) continue;
          const key = `${srcCluster}->${e.target}`;
          if (!fwd.has(key)) fwd.set(key, []);
          fwd.get(key)!.push(e);
        }
        for (const [key, list] of fwd.entries()) {
          if (list.length <= 1) continue;
          const [srcCluster, target] = key.split('->');
          const targetImmediateCluster = nodeToImmediateCluster.get(target);
          // Only aggregate when target is inside a (different) cluster.
          if (!targetImmediateCluster || targetImmediateCluster === srcCluster) continue;
          // Aggregate ONLY if every leaf node in the source cluster connects to the same target
          const allLeaves = new Set(getDescendantLeafNodes(srcCluster));
          const sourceIds = new Set(list.map((e) => e.source));
          const everyLeafConnects = Array.from(allLeaves).every((nid) => sourceIds.has(nid));
          if (!everyLeafConnects) continue; // keep node->node edges if partial
          aggregated.push({ id: `clusteragg_${srcCluster}_${target}` , source: srcCluster, target, label: joinLabels(list), _aggregated: true });
          for (const e of list) skipIds.add(e.id);
        }
        const remaining = edgesInput.filter((e) => !skipIds.has(e.id));
        return [...remaining, ...aggregated];
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
        items: Array<{ id: string; width: number; height: number; order?: number }>,
        relEdges: Array<{ source: string; target: string;label?: string ;weight?: "number" ;labelpos?: "c" | "l" | "r" }>,
        params?: { rankdir?: "LR" | "TB" | "RL" | "BT"; nodesep?: number; ranksep?: number; edgesep?: number; marginx?: number; marginy?: number; ranker?:"longest-path" | "network-simplex" | "tight-tree"; acyclicer?:"greedy" | "none" ;align?: "UL" | "UR" | "DL" | "DR"; }
      ) => {
        const g = new dagre.graphlib.Graph();
        // derive dynamic graph-level parameters based on items, edges, and clusters
        const nodeCount = items.length;
        const edgeCount = relEdges.length;
        // Estimate cluster factor (how "heavy" the clusters are in this layout)
        const clusterFactor = items.filter(i => i.id.startsWith("cluster")).length;
        const avgItemSize = items.reduce((sum, i) => sum + (i.width + i.height), 0) / Math.max(1, items.length);
        // Dynamic separation logic
        const dynamicNodeSep = params?.nodesep 
          ?? Math.min(400, 120 + nodeCount * 10 + clusterFactor * 20);
        const dynamicRankSep = params?.ranksep 
          ?? Math.min(500, 150 + edgeCount * 12 + clusterFactor * 25);
        const dynamicEdgeSep = Math.max(
          20,
          Math.min(120, 10 + edgeCount * 3 + clusterFactor * 5)
        );
        const dynamicMarginX = 40 + nodeCount * 2 + clusterFactor * 30;
        const dynamicMarginY = 40 + edgeCount * 2 + Math.floor(avgItemSize / 40);
        g.setGraph({
          rankdir: params?.rankdir || direction,
          nodesep: dynamicNodeSep,
          ranksep: dynamicRankSep,
          edgesep: dynamicEdgeSep,
          marginx: dynamicMarginX,
          marginy: dynamicMarginY,
          ranker: params?.ranker ?? 'longest-path',
          acyclicer: params?.acyclicer ?? 'none',
          align: params?.align ?? 'UR',// Add alignment

        });

        // Enhanced edge configuration
        g.setDefaultEdgeLabel(() => ({ 
          width: 60, 
          height: 40,
          labelpos: 'c' // Center label position
        }));
        for (const it of items) {
          g.setNode(it.id, { width: it.width, height: it.height});
        }
        for (const e of relEdges) {
          g.setEdge(e.source, e.target, { label: e.label});
        }
        dagre.layout(g);
        console.log("dagre layout", g);
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
          style: { width: rect.width, height: rect.height, zIndex: -1000 },
          draggable: false,
          sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
          targetPosition: direction === 'LR' ? Position.Left : Position.Top,
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
      
      // Function to detect and merge bidirectional edges
      const detectBidirectionalEdges = (edges: any[]) => {
        const processed = new Set<string>();
        const mergedEdges: any[] = [];
        const edgeMap = new Map<string, any>();
        
        // Create edge map for quick lookup
        for (const edge of edges) {
          const key = `${edge.source}->${edge.target}`;
          edgeMap.set(key, edge);
        }
        
        for (const edge of edges) {
          const forwardKey = `${edge.source}->${edge.target}`;
          const reverseKey = `${edge.target}->${edge.source}`;
          
          // Skip if already processed
          if (processed.has(forwardKey)) continue;
          
          // Check if reverse edge exists
          const reverseEdge = edgeMap.get(reverseKey);
          
          if (reverseEdge && !processed.has(reverseKey)) {
            // Bidirectional edge found - merge them
            const bidirectionalEdge = {
              ...edge,
              id: `bidirectional_${edge.source}_${edge.target}`,
              isBidirectional: true,
              forwardLabel: edge.label,
              reverseLabel: reverseEdge.label,
              // Use forward edge label as primary, but store both
              label: edge.label === reverseEdge.label ? edge.label : `${edge.label} / ${reverseEdge.label}`,
              reverseEdgeId: reverseEdge.id
            };
            
            mergedEdges.push(bidirectionalEdge);
            processed.add(forwardKey);
            processed.add(reverseKey);
          } else {
            // Unidirectional edge
            mergedEdges.push({
              ...edge,
              isBidirectional: false
            });
            processed.add(forwardKey);
          }
        }
        
        return mergedEdges;
      };

      // Aggregate then detect and merge bidirectional edges
      const aggregatedFirst = aggregateEdges(allEdges);
      const processedEdges = detectBidirectionalEdges(aggregatedFirst);

      // Intelligent edge routing with cluster detection
      const outgoingGrouped: Record<string, any[]> = {};
      for (const e of processedEdges) {
        outgoingGrouped[e.source] = outgoingGrouped[e.source] || [];
        outgoingGrouped[e.source].push(e);
      }

      // group edges by target (for fan-in)
      const incomingGrouped: Record<string, any[]> = {};
      for (const e of processedEdges) {
        incomingGrouped[e.target] = incomingGrouped[e.target] || [];
        incomingGrouped[e.target].push(e);
      }

      // Function to find cluster for a node
      const findNodeCluster = (nodeId: string) => {
        if (clusterMap.has(nodeId)) return clusterMap.get(nodeId);
        for (const cluster of allClusters) {
          if (cluster.cluster_nodes && cluster.cluster_nodes.includes(nodeId)) {
            return cluster;
          }
        }
        return null;
      };

      // Function to calculate cluster exit/entry points
      const calculateClusterBoundaryPoint = (cluster: any, targetX: number, targetY: number, isExit: boolean) => {
        if (!cluster) return null;
        
        // Find cluster rectangle from our computed cluster rectangles
        const clusterRect = Object.values(rfNodes).find(n => n.id === cluster.cluster_id && n.type === 'cluster');
        if (!clusterRect) return null;
        
        const clusterCenterX = clusterRect.position.x + (clusterRect.style?.width || 0) / 2;
        const clusterCenterY = clusterRect.position.y + (clusterRect.style?.height || 0) / 2;
        
        // Calculate direction from cluster center to target
        const dx = targetX - clusterCenterX;
        const dy = targetY - clusterCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return { x: clusterCenterX, y: clusterCenterY };
        
        // Normalize direction
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Calculate boundary point
        const clusterWidth = clusterRect.style?.width || 400;
        const clusterHeight = clusterRect.style?.height || 300;
        const radius = Math.max(clusterWidth, clusterHeight) / 2 + 20; // smaller padding to keep edge near cluster
        
        return {
          x: clusterCenterX + nx * radius,
          y: clusterCenterY + ny * radius
        };
      };

      // Precompute node rectangles for obstacle-aware routing
      const nodeRects = rfNodes
        .filter((n) => n.type === "custom")
        .map((n) => ({ id: n.id, x: n.position.x, y: n.position.y, width: NODE_W, height: NODE_H }));

      const rfEdges = processedEdges.flatMap((e) => {
        const siblings = outgoingGrouped[e.source];
        const idx = siblings.findIndex((s) => s.id === e.id);

        const incomingSiblings = incomingGrouped[e.target];
        const inIdx = incomingSiblings.findIndex((s) => s.id === e.id);

        // Detect if edge crosses cluster boundaries
        const sourceCluster = findNodeCluster(e.source);
        const targetCluster = findNodeCluster(e.target);
        const routeAroundClusters = sourceCluster !== targetCluster;
        
        // Calculate cluster exit/entry points if needed
        let clusterExitPoint = null;
        let clusterEntryPoint = null;
        let useClusterBoundaryForSource = false;
        let useClusterBoundaryForTarget = false;
        let clusterBoundarySourcePoint: any = null;
        let clusterBoundaryTargetPoint: any = null;
        
        if (routeAroundClusters && sourceCluster && !clusterMap.has(e.source)) {
          const targetNode = rfNodes.find(n => n.id === e.target);
          if (targetNode) {
            clusterExitPoint = calculateClusterBoundaryPoint(
              sourceCluster, 
              targetNode.position.x, 
              targetNode.position.y, 
              true
            );
          }
        }
        
        if (routeAroundClusters && targetCluster && !clusterMap.has(e.target)) {
          const sourceNode = rfNodes.find(n => n.id === e.source);
          if (sourceNode) {
            clusterEntryPoint = calculateClusterBoundaryPoint(
              targetCluster, 
              sourceNode.position.x, 
              sourceNode.position.y, 
              false
            );
          }
        }

        // If edge endpoint is a cluster, compute explicit boundary point to start/end there
        if (clusterMap.has(e.source) && !(e as any)._aggregated) {
          const meta = clusterMap.get(e.source)!;
          const targetNode = rfNodes.find(n => n.id === e.target);
          if (targetNode) {
            const b = calculateClusterBoundaryPoint(meta, targetNode.position.x, targetNode.position.y, true);
            if (b) {
              useClusterBoundaryForSource = true;
              clusterBoundarySourcePoint = b;
            }
          }
        }
        if (clusterMap.has(e.target) && !(e as any)._aggregated) {
          const meta = clusterMap.get(e.target)!;
          const sourceNode = rfNodes.find(n => n.id === e.source);
          if (sourceNode) {
            const b = calculateClusterBoundaryPoint(meta, sourceNode.position.x, sourceNode.position.y, false);
            if (b) {
              useClusterBoundaryForTarget = true;
              clusterBoundaryTargetPoint = b;
            }
          }
        }

        // Aggregated edge: start at right boundary of cluster, end at left side of target
        if ((e as any)._aggregated && clusterMap.has(e.source)) {
          const clusterNode = rfNodes.find(n => n.id === e.source);
          if (clusterNode) {
            useClusterBoundaryForSource = true;
            clusterBoundarySourcePoint = {
              x: clusterNode.position.x + (clusterNode.style?.width || 0),
              y: clusterNode.position.y + (clusterNode.style?.height || 0) / 2 - 200, // move edge upward to bypass node icons/labels
            };
            // Direction will be recalculated in edge component based on dx
          }
        }

        // Build obstacle list excluding the edge endpoints
        const obstacles = nodeRects
          .filter((r) => r.id !== e.source && r.id !== e.target)
          .map(({ id: _id, ...rest }) => rest);

        return {
          ...e,
          type: "openArrow",
          data: {
            isDarkMode,
            siblings: siblings.length,
            index: idx,
            inSiblings: incomingSiblings.length,
            inIndex: inIdx,
            routeAroundClusters,
            clusterExitPoint,
            clusterEntryPoint,
            obstacles,
            isBidirectional: e.isBidirectional,
            forwardLabel: e.forwardLabel,
              reverseLabel: e.reverseLabel,
              useClusterBoundaryForSource,
              useClusterBoundaryForTarget,
              clusterBoundarySourcePoint,
              clusterBoundaryTargetPoint,
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
        };
      });

      setEdges(rfEdges);
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
          style: { strokeWidth: EDGE_WIDTH },
          animated: false,
        }}
        connectionLineStyle={{ strokeWidth: EDGE_WIDTH }}
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
