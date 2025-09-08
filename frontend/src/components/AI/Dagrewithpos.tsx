import React, { useCallback, useEffect, useState } from "react";
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./Dagrewithpos.css";    
import dagre from "dagre";
// Your JSON response
// import graphJson from "./graph.json";
const graphJson=
{
  "nodes": [
    {
      "id": "igw",
      "type": "custom",
      "data": {
        "label": "Internet Gateway",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/internet-gateway.png"
      },
      "position": {
        "x": -0.995,
        "y": -0.31999999999999995
      }
    },
    {
      "id": "nat",
      "type": "custom",
      "data": {
        "label": "NAT Gateway",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/nat-gateway.png"
      },
      "position": {
        "x": 1,
        "y": -0.31999999999999995
      }
    },
    {
      "id": "lb",
      "type": "custom",
      "data": {
        "label": "Application Load Balancer",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/elastic-load-balancing.png"
      },
      "position": {
        "x": 0.6325,
        "y": -0.16249999999999998
      }
    },
    {
      "id": "waf",
      "type": "custom",
      "data": {
        "label": "Web Application Firewall",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/security/waf.png"
      },
      "position": {
        "x": 0.8949999999999999,
        "y": -0.21499999999999997
      }
    },
    {
      "id": "dns",
      "type": "custom",
      "data": {
        "label": "Route 53",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/route-53.png"
      },
      "position": {
        "x": 0.6849999999999999,
        "y": -0.10999999999999997
      }
    },
    {
      "id": "cdn",
      "type": "custom",
      "data": {
        "label": "CloudFront",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/cloudfront.png"
      },
      "position": {
        "x": 0.7374999999999999,
        "y": -0.05749999999999998
      }
    },
    {
      "id": "web_server",
      "type": "custom",
      "data": {
        "label": "Web Server",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/compute/ec2.png"
      },
      "position": {
        "x": 0.15999999999999998,
        "y": -0.004999999999999982
      }
    },
    {
      "id": "app_server",
      "type": "custom",
      "data": {
        "label": "App Server",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/compute/ec2.png"
      },
      "position": {
        "x": 0.37,
        "y": 0.10000000000000002
      }
    },
    {
      "id": "api_gateway",
      "type": "custom",
      "data": {
        "label": "API Gateway",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/compute/lambda.png"
      },
      "position": {
        "x": -0.10250000000000001,
        "y": 0.047500000000000014
      }
    },
    {
      "id": "kinesis",
      "type": "custom",
      "data": {
        "label": "Kinesis Data Streams",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/analytics/kinesis.png"
      },
      
    },
    {
      "id": "queue",
      "type": "custom",
      "data": {
        "label": "SQS Queue",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/integration/simple-queue-service-sqs.png"
      },
    },
    {
      "id": "sagemaker",
      "type": "custom",
      "data": {
        "label": "Sagemaker",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/ml/sagemaker.png"
      },
    },
    {
      "id": "redshift",
      "type": "custom",
      "data": {
        "label": "Redshift",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/database/redshift.png"
      },
    },
    {
      "id": "data_lake",
      "type": "custom",
      "data": {
        "label": "Data Lake",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/storage/simple-storage-service-s3.png"
      },
    },
    {
      "id": "ddb",
      "type": "custom",
      "data": {
        "label": "DynamoDB",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/database/dynamodb.png"
      },
      
    },
    {
      "id": "iam_role",
      "type": "custom",
      "data": {
        "label": "IAM Role",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/security/identity-and-access-management-iam-role.png"
      },
      
    },
    {
      "id": "kms",
      "type": "custom",
      "data": {
        "label": "KMS",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/security/key-management-service.png"
      },
      
    },
    {
      "id": "cloudwatch",
      "type": "custom",
      "data": {
        "label": "CloudWatch",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/management/cloudwatch.png"
      },
      
    },
    {
      "id": "datadog",
      "type": "custom",
      "data": {
        "label": "Datadog",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/saas/logging/datadog.png"
      },
      "position": {
        "x": 0.3175,
        "y": 0.15250000000000002
      }
    },
    {
      "id": "pipeline",
      "type": "custom",
      "data": {
        "label": "CodePipeline",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/devtools/codepipeline.png"
      },
      "position": {
        "x": -0.9425,
        "y": -0.26749999999999996
      }
    },
    {
      "id": "build",
      "type": "custom",
      "data": {
        "label": "CodeBuild",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/devtools/codebuild.png"
      },
      "position": {
        "x": -0.785,
        "y": -0.10999999999999997
      }
    }
  ],
  "edges": [
    {
      "id": "dns_cdn",
      "source": "dns",
      "target": "cdn",
      "label": "DNS Resolution"
    },
    {
      "id": "cdn_waf",
      "source": "cdn",
      "target": "waf",
      "label": "HTTPS 443 / TLS1.3"
    },
    {
      "id": "waf_lb",
      "source": "waf",
      "target": "lb",
      "label": "HTTPS 443 / TLS1.3"
    },
    {
      "id": "lb_web_server",
      "source": "lb",
      "target": "web_server",
      "label": "HTTPS 443 / TLS1.3"
    },
    {
      "id": "lb_app_server",
      "source": "lb",
      "target": "app_server",
      "label": "HTTPS 443 / TLS1.3"
    },
    {
      "id": "web_server_api_gateway",
      "source": "web_server",
      "target": "api_gateway",
      "label": "HTTPS 443 / TLS1.3"
    },
    {
      "id": "api_gateway_kinesis",
      "source": "api_gateway",
      "target": "kinesis",
      "label": "PutRecord API / TLS1.3"
    },
    {
      "id": "kinesis_queue",
      "source": "kinesis",
      "target": "queue",
      "label": "Kinesis Data Firehose"
    },
    {
      "id": "queue_sagemaker",
      "source": "queue",
      "target": "sagemaker",
      "label": "SQS Polling"
    },
    {
      "id": "sagemaker_redshift",
      "source": "sagemaker",
      "target": "redshift",
      "label": "Batch Transform"
    },
    {
      "id": "redshift_data_lake",
      "source": "redshift",
      "target": "data_lake",
      "label": "Copy Command"
    },
    {
      "id": "sagemaker_ddb",
      "source": "sagemaker",
      "target": "ddb",
      "label": "PutItem"
    },
    {
      "id": "web_server_iam_role",
      "source": "web_server",
      "target": "iam_role",
      "label": "AssumeRole"
    },
    {
      "id": "app_server_kms",
      "source": "app_server",
      "target": "kms",
      "label": "Encrypt/Decrypt"
    },
    {
      "id": "web_server_cloudwatch",
      "source": "web_server",
      "target": "cloudwatch",
      "label": "Logs"
    },
    {
      "id": "app_server_datadog",
      "source": "app_server",
      "target": "datadog",
      "label": "Metrics"
    },
    {
      "id": "pipeline_build",
      "source": "pipeline",
      "target": "build",
      "label": "Build Trigger"
    },
    {
      "id": "build_lb",
      "source": "build",
      "target": "lb",
      "label": "Deploy"
    }
  ],
  "clusters": [
    {
      "id": "networking",
      "label": "Networking",
      "nodes": [
        "igw",
        "nat"
      ],
      "parent": [],
      "hasTint": false
    },
    {
      "id": "vpc",
      "label": "VPC",
      "nodes": [
        "lb",
        "waf"
      ],
      "parent": [
        "networking"
      ],
      "hasTint": false
    },
    {
      "id": "public_subnet",
      "label": "Public Subnet",
      "nodes": [
        "dns",
        "cdn"
      ],
      "parent": [
        "vpc"
      ]
    },
    {
      "id": "private_subnet",
      "label": "Private Subnet",
      "nodes": [
        "web_server",
        "app_server",
        "api_gateway"
      ],
      "parent": [
        "vpc"
      ]
    },
    {
      "id": "data_processing",
      "label": "Data Processing",
      "nodes": ["ingestion","processing_and_analysis","storage"],
      "parent": []
    },
    {
      "id": "ingestion",
      "label": "Ingestion",
      "nodes": ["kinesis","queue"],
      "parent": ["data_processing"]
    },
    {
      "id": "processing_and_analysis",
      "label": "Processing and Analysis",
      "nodes": ["sagemaker","redshift"],
      "parent": ["data_processing"]
    },
    {
      "id": "storage",
      "label": "Storage",
      "nodes": ["data_lake","ddb"],
      "parent": ["data_processing"]
    },
    {
      "id": "security_&_iam",
      "label": "Security & IAM",
      "nodes": [
        "iam_role",
        "kms"
      ],
      "parent": []
    },
    {
      "id": "monitoring_&_logging",
      "label": "Monitoring & Logging",
      "nodes": [
        "cloudwatch",
        "datadog"
      ],
      "parent": []
    },
    {
      "id": "ci/cd",
      "label": "CI/CD",
      "nodes": [
        "pipeline",
        "build"
      ],
      "parent": []
    },
    {
      "id": "unconnected",
      "label": "Services",
      "nodes": [
        "igw",
        "nat"
      ],
      "parent": [
        "networking"
      ]
    }
  ]
}
 
// ✅ Dagre layout
function layoutWithDagreImproved(nodes, edges, direction = "LR") {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  // Increase nodesep and ranksep for more grid-like spacing
  g.setGraph({
    rankdir: direction,
    nodesep: 420, // even more gap between nodes and clusters
    ranksep: 480, // even more vertical gap
    marginx: 160,  // more outer margin
    marginy: 160,
  });
  // Dynamically sort clusters for contiguous layout based on parent-child relationships
  function getClusterDependencies(clusters) {
    const deps = {};
    for (const c of clusters) {
      deps[c.id] = [];
      // If a cluster declares a parent, it depends on its parent
      if (c.parent) deps[c.id].push(...c.parent);
      // If a cluster's nodes include other clusters, it depends on them (nesting)
      for (const n of c.nodes) {
        if (clusters.some(cl => cl.id === n)) {
          deps[c.id].push(n);
        }
      }
    }
    return deps;
  }
  //ensures parent clusters are always laid out before their children.
  function topoSortClusters(clusters) {
    const deps = getClusterDependencies(clusters);
    const visited = new Set();
    const result = [];
    function visit(id) {
      if (visited.has(id)) return;
      visited.add(id);
      for (const dep of deps[id]) visit(dep);
      result.push(id);
    }
    for (const c of clusters) visit(c.id);
    return result.reverse(); // parents before children
  }
  const clusterOrder = topoSortClusters(graphJson.clusters);
  const clusterNodeIds = clusterOrder.flatMap(clusterId => {
    const cluster = graphJson.clusters.find(c => c.id === clusterId);
    return cluster ? cluster.nodes : [];
  });
  // Non-cluster nodes
  const nonClusterNodes = nodes.filter(n => !clusterNodeIds.includes(n.id));
  // Cluster nodes in order
  const sortedClusterNodes = clusterNodeIds.map(id => nodes.find(n => n.id === id)).filter(Boolean);
  // Final node order for Dagre
  const sortedNodes = [...sortedClusterNodes, ...nonClusterNodes];
  // Dynamically align main pipeline nodes (nodes in the longest path) in a single rank
  function findLongestPathNodes(nodes, edges) {
    // Build adjacency list
    const adj = {};
    nodes.forEach(n => { adj[n.id] = []; });
    edges.forEach(e => { adj[e.source].push(e.target); });
    // DFS to find longest path
    let maxPath = [];
    function dfs(nodeId, path, visited) {
      if (path.length > maxPath.length) maxPath = [...path];
      for (const next of adj[nodeId] || []) {
        if (!visited.has(next)) {
          visited.add(next);
          dfs(next, [...path, next], visited);
          visited.delete(next);
        }
      }
    }
    nodes.forEach(n => {
      dfs(n.id, [n.id], new Set([n.id]));
    });
    return maxPath;
  }
  const mainPipelineIds = findLongestPathNodes(sortedNodes, edges);
  // Dynamically measure label width for each node
  function measureTextWidth(text, font = '800 28px Inter, Arial, sans-serif') {
    if (typeof window !== 'undefined' && window.document) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = font;
      return context.measureText(text).width + 32; // add padding
    }
    // fallback for SSR
    return Math.max(180, text.length * 18);
  }
  sortedNodes.forEach((n) => {
    const labelWidth = n.data && n.data.label ? measureTextWidth(n.data.label) : 180;
    const w = Math.max(labelWidth, 180);
    const h = n.height ?? 70;
    // Assign same rank to main pipeline nodes for lane alignment
    if (mainPipelineIds.includes(n.id)) {
      g.setNode(n.id, { width: w, height: h, rank: 0 });
    } else {
      g.setNode(n.id, { width: w, height: h });
    }
  });
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  // Center the main pipeline vertically
  const mainPipelineYs = mainPipelineIds.map(id => {
    const nodeWithPos = g.node(id);
    return nodeWithPos ? nodeWithPos.y : null;
  }).filter(y => y !== null);
  const minY = Math.min(...mainPipelineYs);
  const maxY = Math.max(...mainPipelineYs);
  const pipelineCenterY = (minY + maxY) / 2;
  // Calculate diagram vertical center
  const allYs = sortedNodes.map(n => {
    const nodeWithPos = g.node(n.id);
    return nodeWithPos ? nodeWithPos.y : null;
  }).filter(y => y !== null);
  const diagramCenterY = (Math.min(...allYs) + Math.max(...allYs)) / 2;
  const verticalOffset = diagramCenterY - pipelineCenterY;
  // First, apply vertical centering as before
  let layoutedNodes = sortedNodes.map((n) => {
    const nodeWithPos = g.node(n.id);
    if (!nodeWithPos) return n;
    const isMainPipeline = mainPipelineIds.includes(n.id);
    const y = isMainPipeline ? nodeWithPos.y + verticalOffset : nodeWithPos.y;
    return {
      ...n,
      width: nodeWithPos.width,
      height: nodeWithPos.height,
      position: { x: nodeWithPos.x, y },
      sourcePosition: direction === "LR" ? Position.Right : Position.Bottom,
      targetPosition: direction === "LR" ? Position.Left : Position.Top,
    };
  });
  // Normalize so minimum y is zero
  const minYFinal = Math.min(...layoutedNodes.map(n => n.position.y));
  if (minYFinal < 0) {
    layoutedNodes = layoutedNodes.map(n => ({
      ...n,
      position: { ...n.position, y: n.position.y - minYFinal + 20 }, // add a margin
    }));
  }
  return { nodes: layoutedNodes, edges };
}
// ✅ Build clusters as parent nodes (fixed)
function buildClusterNodes(layoutedNodes, clusters) {
  // Helper to recursively collect all descendant node IDs for a cluster
  function getDescendantNodeIdsAndClusters(clusterId) {
    const cluster = clusters.find(c => c.id === clusterId);
    if (!cluster) return [];
    let ids = [];
    for (const id of cluster.nodes) {
      const childCluster = clusters.find(c => c.id === id);
      if (childCluster) {
        ids.push(id); // include the child cluster itself
        ids = ids.concat(getDescendantNodeIdsAndClusters(childCluster.id));
      } else {
        ids.push(id);
      }
    }
    return ids;
  }
  // 🎨 Use a fixed standard palette and assign colors randomly, reusing as needed
  const STANDARD_PALETTE = [
    "#FFD700", // Gold
    "#FF69B4", // Hot Pink
    "#87CEEB", // Sky Blue
    "#32CD32", // Lime Green
    "#1E90FF", // Blue
    "#BA55D3"  // Medium Orchid
  ];
  // Shuffle utility
  function shuffleArray(array: string[]): string[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  // Assign a color to each cluster, cycling through palette if needed
  const shuffledPalette = shuffleArray(STANDARD_PALETTE);
  const clusterColorMap: { [id: string]: string } = {};
  clusters.forEach((c, i) => {
    clusterColorMap[c.id] = shuffledPalette[i % shuffledPalette.length];
  });
  function getClusterColor(clusterId: string) {
    return clusterColorMap[clusterId] || "#FFD700";
  }
  const clusterBoxes = {};
  // First pass: compute bounding boxes
  clusters.forEach((c) => {
    const descendantNodeIds = getDescendantNodeIdsAndClusters(c.id);
    let children = layoutedNodes.filter((n) => descendantNodeIds.includes(n.id));
    // 🆕 If no direct children, but cluster has child clusters, use their boxes
    if (children.length === 0) {
      const childClusterIds = clusters
        .filter(cl => Array.isArray(cl.parent) && cl.parent.includes(c.id))
        .map(cl => cl.id);
      children = childClusterIds.filter(childId => clusterBoxes[childId]).map(childId => ({
        id: childId,
        position: { x: clusterBoxes[childId].minX, y: clusterBoxes[childId].minY },
        width: clusterBoxes[childId].maxX - clusterBoxes[childId].minX,
        height: clusterBoxes[childId].maxY - clusterBoxes[childId].minY
      }));
    }
    if (children.length === 0) return; // truly empty cluster, skip
    const CLUSTER_GAP = 32;
    const minX = Math.min(...children.map((n) => n.position.x)) - CLUSTER_GAP;
    const minY = Math.min(...children.map((n) => n.position.y)) - CLUSTER_GAP;
    // Use dynamically measured node width for cluster sizing
    const maxX = Math.max(...children.map((n) => n.position.x + (n.width ?? 180))) + CLUSTER_GAP;
    const maxY = Math.max(...children.map((n) => n.position.y + (n.height ?? 70))) + CLUSTER_GAP;
    clusterBoxes[c.id] = { minX, minY, maxX, maxY };

    // 🔥 Ensure top-level clusters (no parent) remain independent
    const hasParent = Array.isArray(c.parent) && c.parent.length > 0;
    if (!hasParent) {
      clusterBoxes[c.id] = {
        minX,
        minY,
        maxX,
        maxY
      };
    }
if (!hasParent) {
  clusterBoxes[c.id] = {
    minX,
    minY,
    maxX,
    maxY
  };
}
  });
  // Second pass: expand parent clusters to include child clusters
  function expandClusterBoxToIncludeDescendants(clusterId) {
    if (!clusterBoxes[clusterId]) return;
    
    const childClusterIds = clusters
      .filter(cl => Array.isArray(cl.parent) && cl.parent.includes(clusterId))
      .map(cl => cl.id);
    childClusterIds.forEach(childId => {
      expandClusterBoxToIncludeDescendants(childId);
      if (!clusterBoxes[childId]) return;
      clusterBoxes[clusterId].minX = Math.min(clusterBoxes[clusterId].minX, clusterBoxes[childId].minX);
      clusterBoxes[clusterId].minY = Math.min(clusterBoxes[clusterId].minY, clusterBoxes[childId].minY);
      clusterBoxes[clusterId].maxX = Math.max(clusterBoxes[clusterId].maxX, clusterBoxes[childId].maxX);
      clusterBoxes[clusterId].maxY = Math.max(clusterBoxes[clusterId].maxY, clusterBoxes[childId].maxY);
    });
  }
  clusters.forEach(c => expandClusterBoxToIncludeDescendants(c.id));
  // 🎨 Margins & rendering
  const baseMargin = 90;
  const topLevelMargin = 180;
  return clusters.map((c, idx) => {
    const box = clusterBoxes[c.id];
    if (!box) return null;
    const hasParent = Array.isArray(c.parent) && c.parent.length > 0;
    const margin = hasParent ? baseMargin : topLevelMargin;
    const color = getClusterColor(c.id);
    const tilt = hasParent ? ((idx % 2 === 0) ? -3 : 3) : 0;

    // Fully dynamic: use only hasTint from cluster data
    const hasTint = c.hasTint !== false;
    return {
      id: c.id,
      type: "cluster",
      data: { label: c.label, hasParent, color, tilt, hasTint },
      position: { x: box.minX - margin, y: box.minY - margin - 18 },
      style: {
        width: box.maxX - box.minX + margin * 2,
        height: box.maxY - box.minY + margin * 2 + 18,
        zIndex: -1,
        pointerEvents: "none"
      }
    };
  }).filter(Boolean);
}
const CustomNode = ({ data }) => {
  const direction = data?.direction || "LR";
  const targetPos = direction === "LR" ? Position.Left : Position.Top;
  const sourcePos = direction === "LR" ? Position.Right : Position.Bottom;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Icon = the actual node bounding box */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 170, height: 170, minWidth: 170, minHeight: 170 }}>
        {/* Incoming edge handle */}
        <Handle
          type="target"
          position={targetPos}
          id="left"
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        {data.iconUrl && (
          <img src={data.iconUrl} alt={data.label} style={{ width: 340, height: 340, objectFit: "contain" }} />
        )}
        <Handle
          type="source"
          position={sourcePos}
          id="right"
          style={{ opacity: 0, width: 0, height: 0 }}
        />
      </div>
      {/* Label BELOW, outside the bounding box */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          marginTop: 8,
          textAlign: "center",
          lineHeight: 1.2,
          display: 'inline-block',
          whiteSpace: "nowrap",
          overflow: "visible",
          textOverflow: "unset",
          pointerEvents: "none", // won’t interfere with edges
        }}
      >
        {data.label}
      </div>
    </div>
  );
};
// ✅ Cluster Node renderer
// Utility to convert hex to rgba with alpha
function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const ClusterNode = ({ data }) => {
  return (
    <div
      style={{
        border: `4px solid ${data.color}`,
        borderRadius: 24,
        background: data.hasTint === false ? "#fff" : hexToRgba(data.color, 0.13),
        minWidth: 420,
        minHeight: 220,
        width: "100%",
        height: "100%",
        padding: 28,
        position: "relative",
        zIndex: 0,
        boxShadow: `0 6px 32px 0 ${data.color}22, 0 2px 12px 0 rgba(90,107,138,0.07)`,
        pointerEvents: "none",
        transition: "background 0.2s, transform 0.2s, box-shadow 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          position: "absolute",
          top: 18,
          left: 28,
          background: "#fff", // White background for badge
          border: `2px solid ${data.color}`,
          borderRadius: 16,
          padding: "10px 36px 10px 36px",
          fontWeight: 900,
          fontSize: 34,
          color: '#222',
          boxShadow: `0 1px 8px 0 ${data.color}22`,
          pointerEvents: "auto",
          minHeight: 56,
        }}
      >
        {data.label}
      </div>
    </div>
  );
};
const nodeTypes = { custom: CustomNode, cluster: ClusterNode };
export default function DagreFlow() {
  const [direction, setDirection] = useState("TB");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  useEffect(() => {
    // Debug: Log graphJson, nodes, edges, clusters
    console.log('graphJson', graphJson);
    console.log('graphJson.nodes', graphJson.nodes);
    console.log('graphJson.edges', graphJson.edges);
    console.log('graphJson.clusters', graphJson.clusters);
    // Filter out edges without clear direction or with missing endpoints
    const filteredEdges = (graphJson.edges || []).filter(e => e.source && e.target && e.source !== e.target);
    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutWithDagreImproved(
      graphJson.nodes,
      filteredEdges,
      direction
    );
    // Attach parentNode to children (support recursive parent lookup)
    function findParentClusterId(nodeId) {
      // collect all clusters that include this node
      const containingClusters = graphJson.clusters.filter(c => c.nodes.includes(nodeId));
      if (containingClusters.length === 0) return undefined;
    
      // pick the deepest cluster
      const deepestCluster = containingClusters.sort(
        (a, b) => (a.parent?.length || 0) - (b.parent?.length || 0)
      ).pop();
    
      // ❌ If cluster has no parent, treat it as top-level (don’t assign parentNode)
      if (!deepestCluster?.parent || deepestCluster.parent.length === 0) {
        return undefined;
      }
      return deepestCluster.id;
    }
    

    const withParents = layoutedNodes.map((n) => {
      const parentId = findParentClusterId(n.id);
      if (parentId) {
        return { ...n, parentNode: parentId, extent: "parent" };
      } else {
        return { ...n, parentNode: undefined };   // ✅ keep top-level nodes independent
      }
    });
    
    const clusterNodes = buildClusterNodes(withParents, graphJson.clusters);
    console.log('withParents', withParents);
    console.log('clusterNodes', clusterNodes);
    setNodes([...withParents, ...clusterNodes]);
    console.log('layoutedEdges', layoutedEdges);
    setEdges(layoutedEdges);
  }, [direction]);
  const toggleLayout = useCallback(() => {
    setDirection((d) => (d === "TB" ? "LR" : "TB"));
  }, []);
  return (
    <div style={{ width: "100%", height: "100vh", position: 'relative' }}>
      <button
        onClick={toggleLayout}
        style={{
          position: "absolute",
          zIndex: 10,
          right: 20,
          top: 20,
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid #aaa",
          background: "#f7f7f7",
          cursor: "pointer",
        }}
      >
        Toggle Layout ({direction === "TB" ? "Vertical" : "Horizontal"})
      </button>
      {/* Lane labels overlay */}
      <div style={{
        position: 'absolute',
        top: 120,
        right: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 52,
        zIndex: 20,
        pointerEvents: 'none',
      }}>

      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges.map(e => ({
          ...e,
          type: "beizer",   // ✅ smooth AWS-style edges
          style: {
            stroke: "#000000",    // pure black like AWS docs
            strokeWidth: 3,       // bold line
          },
          markerEnd: {
            type: "arrowclosed",
            color: "#000000",     // black arrow
            width: 30,            // bigger head
            height: 30,
          },
          labelStyle: {
            fontSize: 28,
            fontWeight: 500,
            fill: "#000000",
            background: "white",
            padding: "4px 8px",   // ✅ spacing around text
            borderRadius: 4,
          },
          labelBgStyle: {
            fill: "white",        // white background under text
            fillOpacity: 1,
          },
          labelBgPadding: [8, 4], // ✅ adds gap between edge and label
          labelBgBorderRadius: 4,
        }))}
        

        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
