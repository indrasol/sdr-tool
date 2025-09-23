
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
      "id": "gcp_environment",
      "label": "GCP Environment",
      "nodes": [
        "waf"
      ],
      "parent": []
    },
    {
      "id": "kubernetes_cluster",
      "label": "Kubernetes Cluster",
      "nodes": [
        "gke",
        "api_gateway",
        "service_mesh",
        "cache",
        "message_broker"
      ],
      "parent": [
        "gcp_environment"
      ]
    },
    {
      "id": "microservices",
      "label": "Microservices",
      "nodes": [
        "service1",
        "service2",
        "service3"
      ],
      "parent": [
        "kubernetes_cluster"
      ]
    },
    {
      "id": "data_layer",
      "label": "Data Layer",
      "nodes": [
        "database"
      ],
      "parent": [
        "gcp_environment"
      ]
    },
    {
      "id": "ci/cd",
      "label": "CI/CD",
      "nodes": [
        "cicd"
      ],
      "parent": [
        "gcp_environment"
      ]
    },
    {
      "id": "monitoring_and_logging",
      "label": "Monitoring and Logging",
      "nodes": [
        "monitoring",
        "logging"
      ],
      "parent": [
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
    const baseSize = 45;
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
          width: 180,
          height: 180,
          flexShrink: 0,
        }}
      >
        <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
        <img
          src={d.iconUrl}
          alt={d.label}
          style={{ 
            width: 180, 
            height: 180, 
            objectFit: "contain",
            maxWidth: "100%",
            maxHeight: "100%"
          }}
        />
        <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
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
    const basePadding = 25;
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
        fontSize: "40px", // Increased font size for better visibility
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
// ─── Open arrow edge ────────────────────────────────
const OpenArrowEdge: React.FC<EdgeProps> = (props) => {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, data } = props;
  const d = (data ?? {}) as { isDarkMode?: boolean };
  const isDarkMode = d.isDarkMode ?? true;
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: isDarkMode ? "#fff" : "#000", strokeWidth: 2, fill: "none" }}
        markerEnd="url(#open-arrowhead)"
      />
      {label && (
        <g>
          <rect
            x={labelX - 50}
            y={labelY - 10}
            width={100}
            height={20}
            rx={6}
            fill={isDarkMode ? "#1e1e1e" : "#ffffff"}
            stroke={isDarkMode ? "#555" : "#ccc"}
            strokeWidth={1}
            opacity={0.97}
          />
          <text
            x={labelX}
            y={labelY}
            style={{
              fontSize: 10,
              fontWeight: 600,
              fill: isDarkMode ? "#fff" : "#000",
              textAnchor: "middle",
              dominantBaseline: "middle",
            }}
          >
            {label}
          </text>
        </g>
      )}
      <svg style={{ height: 0 }}>
        <defs>
          <marker
            id="open-arrowhead"
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polyline
              points="2,2 10,4 2,6"
              fill="none"
              stroke={isDarkMode ? "#fff" : "#000"}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </marker>
        </defs>
      </svg>
    </>
  );
};
const nodeTypes = { custom: CustomNode, cluster: ClusterNode };
const edgeTypes = { openArrow: OpenArrowEdge };
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
        id: string;
        label: string;
        parent?: string[];
        nodes?: string[]; // direct leaf node ids (may include cluster ids in data, we will ignore those here)
      };
      const allNodes = graphJson.nodes;
      const allEdges = graphJson.edges;
      const allClusters: Cluster[] = graphJson.clusters || [];
      // Build quick maps
      const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
      const clusterMap = new Map(allClusters.map((c) => [c.id, c]));
      // Parent/child cluster relationships
      const getDirectChildren = (cid: string) =>
        allClusters.filter((c) => (c.parent || []).includes(cid)).map((c) => c.id);
      // Get parent cluster id for a cluster
      const getParent = (cid: string): string | null => {
        const cluster = clusterMap.get(cid);
        if (!cluster || !cluster.parent || cluster.parent.length === 0) return null;
        return cluster.parent[0]; // Return first parent (assuming single parent hierarchy)
      };
      // Get all descendant leaf node ids for a cluster (recursively)
      const getDescendantLeafNodes = (cid: string): string[] => {
        const c = clusterMap.get(cid);
        if (!c) return [];
        const directLeaves = (c.nodes || []).filter((nid) => nodeMap.has(nid));
        const childClusters = getDirectChildren(cid);
        const childLeaves = childClusters.flatMap((ccid) => getDescendantLeafNodes(ccid));
        return [...new Set([...directLeaves, ...childLeaves])];
      };
      // Find top-level clusters (no parent)
      const topLevelClusters = allClusters.filter((c) => !c.parent || c.parent.length === 0);
      // For a node, find the top-level cluster it belongs to (if any)
      const nodeTopCluster = (nid: string): string | null => {
        for (const top of topLevelClusters) {
          const descendants = getDescendantLeafNodes(top.id);
          if (descendants.includes(nid)) return top.id;
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
        const labelLength = cluster?.label?.length || 0;
        
        // Compute internal edge density for edge overlap prevention
        const computeInternalEdgeDensity = (cid: string): number => {
          const internalNodes = new Set(getDescendantLeafNodes(cid));
          const internalEdges = allEdges.filter(e => 
            internalNodes.has(e.source) && internalNodes.has(e.target)
          );
          const maxPossibleEdges = (leafCount * (leafCount - 1)) / 2;
          return maxPossibleEdges > 0 ? internalEdges.length / maxPossibleEdges : 0;
        };
        
        // Compute cluster connectivity (how connected this cluster is to others)
        const computeConnectivityFactor = (cid: string): number => {
          const children = getDirectChildren(cid);
          const parent = getParent(cid);
          return children.length + (parent ? 1 : 0);
        };
        
        // Compute edge crossing potential within cluster
        const computeEdgeCrossingPotential = (cid: string): number => {
          const internalNodes = new Set(getDescendantLeafNodes(cid));
          const internalEdges = allEdges.filter(e => 
            internalNodes.has(e.source) && internalNodes.has(e.target)
          );
          // Higher potential when many edges exist between few nodes
          return leafCount > 0 ? internalEdges.length / leafCount : 0;
        };
        
        const edgeDensity = computeInternalEdgeDensity(cid);
        const connectivity = computeConnectivityFactor(cid);
        const crossingPotential = computeEdgeCrossingPotential(cid);
        
        // Dynamic base padding that scales with cluster depth - significantly increased for better separation
        const basePadding = Math.max(120, 160 - (depth * 15)); // More padding for top-level clusters
        
        // Dynamic per-node spacing based on cluster size - significantly increased to prevent icon overlap
        const perNodeSpacing = leafCount <= 2 ? 40 : leafCount <= 5 ? 35 : 30;
        
        // Dynamic per-edge spacing based on boundary complexity - greatly increased for edge label separation
        const perEdgeSpacing = boundary <= 2 ? 55 : boundary <= 5 ? 50 : 45;
        
        // Additional spacing for cluster label length - greatly increased multiplier for maximum separation
        const labelSpacing = Math.max(0, (labelLength - 10) * 5);
        
        // Dynamic edge density spacing - prevents internal edge overlap
        const edgeDensitySpacing = edgeDensity * 100; // Scale up significantly for dense clusters
        
        // Dynamic connectivity spacing - more connected clusters need more space
        const connectivitySpacing = connectivity * 30;
        
        // Dynamic crossing potential spacing - prevents edge crossings
        const crossingSpacing = crossingPotential * 80;
        
        // Calculate total padding with all dynamic factors
        const pad = basePadding + 
                   (leafCount * perNodeSpacing) + 
                   (boundary * perEdgeSpacing) + 
                   labelSpacing +
                   edgeDensitySpacing +
                   connectivitySpacing +
                   crossingSpacing;
        
        // Dynamic bounds based on cluster complexity - greatly increased bounds for maximum separation
        const minPadding = Math.max(120, basePadding);
        const maxPadding = Math.min(800, 400 + (leafCount * 35) + (edgeDensity * 200));
        
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
          nodesep: params?.nodesep ?? 120,
          ranksep: params?.ranksep ?? 180,
        });
        g.setDefaultEdgeLabel(() => ({}));
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
        while (current && current.parent && current.parent.length > 0) {
          d++;
          current = clusterMap.get(current.parent[0]);
        }
        return d;
      };
      const clustersByDepth: Record<number, string[]> = {};
      for (const c of allClusters) {
        const depth = getDepth(c.id);
        clustersByDepth[depth] = clustersByDepth[depth] || [];
        clustersByDepth[depth].push(c.id);
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
          const directLeaves = (clusterMap.get(cid)?.nodes || []).filter((nid) => nodeMap.has(nid));
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
            nodesep: Math.max(250, 220 + (depth * 25)), // Dynamic node separation based on depth - increased for better edge routing
            ranksep: Math.max(350, 300 + (depth * 40)), // Dynamic rank separation based on depth - increased for edge separation
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
        allClusters.flatMap((c) => getDescendantLeafNodes(c.id))
      );
      const unclusteredNodes = allNodes.filter((n) => !clusteredLeafIds.has(n.id));
      type Block = { id: string; width: number; height: number; isPseudo?: boolean };
      const topBlocks: Block[] = [];
      // Add top-level cluster blocks
      for (const top of topLevelClusters) {
        const rect = clusterRect[top.id] || { width: 400, height: 300, x: 0, y: 0 };
        // Add extra separation margin for inter-cluster breathing room
        const separation = 80; // increased from 40
        topBlocks.push({ id: top.id, width: rect.width + separation, height: rect.height + separation });
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
          const rect = clusterRect[cluster.id] || { width: 400, height: 300 };
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
        const meta = graphJson.clusters.find((c) => c.id === cid);
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
            label: meta?.label || cid,
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
        const pos = blockPositions[top.id];
        if (!pos) continue;
        // Normalize cluster box (remove the extra separation margin we added to size)
        const rect = clusterRect[top.id];
        const offsetX = pos.x + (pos.width - rect.width) / 2;
        const offsetY = pos.y + (pos.height - rect.height) / 2;
        placeClusterRecursive(top.id, offsetX, offsetY);
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
      setEdges(allEdges.map((e) => ({ ...e, type: "openArrow", data: { isDarkMode } })));
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
