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
      "id": "repo",
      "type": "custom",
      "data": {
        "label": "Git Repo",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/azure/devops/repos.png"
      },
      "position": {
        "x": -1,
        "y": -0.38738738738738737
      }
    },
    {
      "id": "ci_cd",
      "type": "custom",
      "data": {
        "label": "CI/CD Pipeline",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/azure/devops/pipelines.png"
      },
      "position": {
        "x": 0.7837837837837835,
        "y": -0.38738738738738737
      }
    },
    {
      "id": "artifacts",
      "type": "custom",
      "data": {
        "label": "Container Artifacts",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/azure/devops/artifacts.png"
      },
      "position": {
        "x": 0.5855855855855854,
        "y": -0.18918918918918917
      }
    },
    {
      "id": "aks",
      "type": "custom",
      "data": {
        "label": "AKS Cluster",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/azure/compute/kubernetes-services.png"
      },
      "position": {
        "x": 0.38738738738738726,
        "y": 0.009009009009009
      }
    },
    {
      "id": "api_gateway",
      "type": "custom",
      "data": {
        "label": "API Gateway",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/azure/network/ApiManagementService.png"
      },
      "position": {
        "x": -0.9009009009009009,
        "y": -0.2882882882882883
      }
    },
    {
      "id": "cosmos_db",
      "type": "custom",
      "data": {
        "label": "Cosmos DB",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/azure/database/cosmos-db.png"
      },
      "position": {
        "x": -0.20720720720720726,
        "y": 0.4054054054054053
      }
    },
    {
      "id": "redis_cache",
      "type": "custom",
      "data": {
        "label": "Redis Cache",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/azure/cache/CacheForRedis.png"
      },
      "position": {
        "x": -0.20720720720720726,
        "y": 0.30630630630630623
      }
    },
    {
      "id": "container_registry",
      "type": "custom",
      "data": {
        "label": "Azure Container Registry",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/azure/storage/blob-storage.png"
      },
      "position": {
        "x": 0.48648648648648635,
        "y": -0.09009009009009009
      }
    },
    {
      "id": "event_grid",
      "type": "custom",
      "data": {
        "label": "Event Grid",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/azure/analytics/EventGrid.png"
      },
      "position": {
        "x": 0.09009009009009,
        "y": 0.30630630630630623
      }
    },
    {
      "id": "monitor",
      "type": "custom",
      "data": {
        "label": "Azure Monitor",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/azure/monitor/monitor.png"
      },
      "position": {
        "x": -0.009009009009009087,
        "y": 0.20720720720720717
      }
    },
    {
      "id": "azure_ad",
      "type": "custom",
      "data": {
        "label": "Azure AD",
        "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/azure/identity/active-directory.png"
      },
      "position": {
        "x": -0.009009009009009087,
        "y": 0.10810810810810809
      }
    }
  ],
  "edges": [
    {
      "id": "repo_ci_cd",
      "source": "repo",
      "target": "ci_cd",
      "label": "Code Commit"
    },
    {
      "id": "ci_cd_artifacts",
      "source": "ci_cd",
      "target": "artifacts",
      "label": "Build and Deploy"
    },
    {
      "id": "artifacts_container_registry",
      "source": "artifacts",
      "target": "container_registry",
      "label": "Deploy Containers"
    },
    {
      "id": "container_registry_aks",
      "source": "container_registry",
      "target": "aks",
      "label": "Pull Images over HTTPS"
    },
    {
      "id": "aks_api_gateway",
      "source": "aks",
      "target": "api_gateway",
      "label": "HTTPS 443 / API Calls"
    },
    {
      "id": "api_gateway_cosmos_db",
      "source": "api_gateway",
      "target": "cosmos_db",
      "label": "HTTPS 443 / NoSQL Queries"
    },
    {
      "id": "api_gateway_redis_cache",
      "source": "api_gateway",
      "target": "redis_cache",
      "label": "TLS 6379 / Caching"
    },
    {
      "id": "aks_event_grid",
      "source": "aks",
      "target": "event_grid",
      "label": "Event Publish"
    },
    {
      "id": "event_grid_aks",
      "source": "event_grid",
      "target": "aks",
      "label": "Event Subscription"
    },
    {
      "id": "aks_monitor",
      "source": "aks",
      "target": "monitor",
      "label": "Logs and Metrics"
    },
    {
      "id": "api_gateway_monitor",
      "source": "api_gateway",
      "target": "monitor",
      "label": "Logs and Metrics"
    },
    {
      "id": "cosmos_db_monitor",
      "source": "cosmos_db",
      "target": "monitor",
      "label": "Logs and Metrics"
    },
    {
      "id": "redis_cache_monitor",
      "source": "redis_cache",
      "target": "monitor",
      "label": "Logs and Metrics"
    },
    {
      "id": "aks_azure_ad",
      "source": "aks",
      "target": "azure_ad",
      "label": "IAM Authentication"
    },
    {
      "id": "api_gateway_azure_ad",
      "source": "api_gateway",
      "target": "azure_ad",
      "label": "IAM Authentication"
    }
  ],
  "clusters": [
    {
      "id": "azure_devops_ci/cd",
      "label": "Azure DevOps CI/CD",
      "nodes": [
        "repo",
        "ci_cd",
        "artifacts"
      ],
      "parent": []
    },
    {
      "id": "kubernetes_cluster",
      "label": "Kubernetes Cluster",
      "nodes": [
        "aks"
      ],
      "parent": []
    },
    {
      "id": "networking_and_api_management",
      "label": "Networking and API Management",
      "nodes": [
        "api_gateway"
      ],
      "parent": []
    },
    {
      "id": "data_storage",
      "label": "Data Storage",
      "nodes": [
        "cosmos_db",
        "redis_cache",
        "container_registry"
      ],
      "parent": []
    },
    {
      "id": "event_handling",
      "label": "Event Handling",
      "nodes": [
        "event_grid"
      ],
      "parent": []
    },
    {
      "id": "monitoring_and_logging",
      "label": "Monitoring and Logging",
      "nodes": [
        "monitor"
      ],
      "parent": []
    },
    {
      "id": "identity_and_access_management",
      "label": "Identity and Access Management",
      "nodes": [
        "azure_ad"
      ],
      "parent": []
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
  sortedNodes.forEach((n) => {
    const w = n.width ?? 180;
    const h = n.height ?? 70;
    // Assign same rank to main pipeline nodes for lane alignment
    if (mainPipelineIds.includes(n.id)) {
      g.setNode(n.id, { width: w, height: h, rank: 0 });
    } else {
      g.setNode(n.id, { width: w, height: h });
    }
  });
  sortedNodes.forEach((n) => {
    const w = n.width ?? 180;
    const h = n.height ?? 70;
    g.setNode(n.id, { width: w, height: h });
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
 
    return {
      id: c.id,
      type: "cluster",
      data: { label: c.label, hasParent, color, tilt, hasTint: c.hasTint !== false },
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
          fontSize: 32,
          fontWeight: 800,
          marginTop: 3,
          textAlign: "center",
          lineHeight: 1.2,
          width: "100%",
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
 
const ClusterNode = ({ data }) => (
  <div
    style={{
      border: ["VPC", "Networking"].includes(data.label) ? "4px solid #bbb" : `4px solid ${data.color}`,
      borderRadius: 24,
      background: data.hasTint === false ? "none" : hexToRgba(data.color, 0.13),
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
      margin: data.hasParent ? 16 : 0,
      outline: data.hasParent ? undefined : '3px solid #fff',
    }}
  >
    <div style={{
      display: "flex",
      alignItems: "center",
      position: "absolute",
      top: 18,
      left: 28,
      background: "#fff",
      border: ["VPC", "Networking"].includes(data.label) ? "2px solid #bbb" : `2px solid ${data.color}`,
      borderRadius: 16,
      padding: "10px 36px 10px 36px",
      fontWeight: 900,
      fontSize: 34,
      color: ["VPC", "Networking"].includes(data.label) ? "#444" : '#222',
      boxShadow: ["VPC", "Networking"].includes(data.label) ? `0 1px 8px 0 #bbb22` : `0 1px 8px 0 ${data.color}22`,
      pointerEvents: "auto",
      minHeight: 56,
    }}>
      {data.label}
    </div>
  </div>
);
const nodeTypes = { custom: CustomNode, cluster: ClusterNode };
export default function DagreFlow() {
  const [direction, setDirection] = useState("TB");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState<any>(null);
  // Tweak these to control how large the diagram appears after fitting
  const FIT_PADDING = 0.08;        // lower = bigger diagram
  const SCALE_BOOST = 1.12;        // slight zoom-in after fit

  // Helper: compute bounds of all rendered nodes
  const computeNodeBounds = useCallback((list: any[]) => {
    if (!list || list.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of list) {
      const w = (n?.width ?? 180);
      const h = (n?.height ?? 70);
      const x1 = n?.position?.x ?? 0;
      const y1 = n?.position?.y ?? 0;
      const x2 = x1 + w;
      const y2 = y1 + h;
      if (x1 < minX) minX = x1;
      if (y1 < minY) minY = y1;
      if (x2 > maxX) maxX = x2;
      if (y2 > maxY) maxY = y2;
    }
    return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
  }, []);

  const centerGraph = useCallback(() => {
    if (!rfInstance || !nodes.length) return;
    const b = computeNodeBounds(nodes);
    if (!b) return;
    try {
      const vp = rfInstance.getViewport ? rfInstance.getViewport() : { zoom: undefined };
      const nextZoom = Math.min((vp?.zoom ?? 1) * SCALE_BOOST, 2);
      rfInstance.setCenter(b.cx, b.cy, { zoom: nextZoom, duration: 250 });
    } catch {}
  }, [rfInstance, nodes, computeNodeBounds]);
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

  // Ensure the diagram always fits the viewport after data/layout changes
  useEffect(() => {
    if (!nodes.length || !rfInstance) return;
    // Wait for nodes to render and be measured before fitting
    const r1 = requestAnimationFrame(() => {
      try {
        rfInstance.fitView({ padding: FIT_PADDING, duration: 250 });
        // Center explicitly in case edges/labels skew the bounding box
        const r2 = requestAnimationFrame(centerGraph);
        // store nested frame id on window to cancel safely if needed
        (window as any).__rf_r2 = r2;
      } catch {}
    });
    return () => cancelAnimationFrame(r1);
  }, [nodes.length, edges.length, direction, rfInstance, centerGraph]);

  // Refit on window resize so it adapts to any screen/browser size
  useEffect(() => {
    const onResize = () => {
      try {
        rfInstance?.fitView({ padding: FIT_PADDING });
        centerGraph();
      } catch {}
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [rfInstance, centerGraph]);
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
          type: "smoothstep",
          sourceHandle: "right",
          targetHandle: "left",
          style: {
            stroke: "#000000",
            opacity: 1,
            fill: "none",
            strokeWidth: 6,
            borderRadius: 0,
            filter: "drop-shadow(0px 0px 3px rgba(0,0,0,1))",
          },
          labelStyle: {
            fontSize: 28,
            fontWeight: 700,
            fill: "#000",
            dominantBaseline: "middle",
            dy: -24,   // ⬆️ Increased offset: shift label 24px above the edge line for better clarity. Adjust as needed.
          },
          labelBgStyle: {
            fill: "none",   // ✅ no background box
            stroke: "none",
          },
          markerEnd: {
            type: "arrowclosed",
            color: "#000000",
            width: 32,
            height: 32,
          },
        }))}
        minZoom={0.05}
        maxZoom={2}
        fitView
        fitViewOptions={{ padding: FIT_PADDING }}
        onInit={(instance) => {
          setRfInstance(instance);
          try { instance.fitView({ padding: FIT_PADDING }); } catch {}
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
