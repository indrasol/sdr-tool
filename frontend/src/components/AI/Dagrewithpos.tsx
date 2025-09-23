// import React, { useCallback, useEffect, useState } from "react";
// import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, Handle, Position, BaseEdge, EdgeLabelRenderer, getSmoothStepPath, MarkerType, type EdgeProps } from "@xyflow/react";
// import "@xyflow/react/dist/style.css";
// import "./Dagrewithpos.css";    
// import dagre from "dagre";
// // Your JSON response
// // import graphJson from "./graph.json";
// const graphJson=
// {
//   "nodes": [
//     {
//       "id": "igw",
//       "type": "custom",
//       "data": {
//         "label": "Internet Gateway",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/internet-gateway.png"
//       },
//       "position": {
//         "x": -0.995,
//         "y": -0.31999999999999995
//       }
//     },
//     {
//       "id": "nat",                                                    
//       "type": "custom",
//       "data": {
//         "label": "NAT Gateway",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/nat-gateway.png"
//       },
//       "position": {
//         "x": 1,     
//         "y": -0.31999999999999995
//       }
//     },
//     {
//       "id": "lb",
//       "type": "custom",
//       "data": {
//         "label": "Application Load Balancer",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/elastic-load-balancing.png"
//       },
//       "position": {
//         "x": 0.6325,
//         "y": -0.16249999999999998
//       }
//     },
//     {
//       "id": "waf",
//       "type": "custom",
//       "data": {
//         "label": "Web Application Firewall",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/security/waf.png"
//       },
//       "position": {
//         "x": 0.8949999999999999,
//         "y": -0.21499999999999997
//       }
//     },
//     {
//       "id": "dns",
//       "type": "custom",
//       "data": {
//         "label": "Route 53",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/route-53.png"
//       },
//       "position": {
//         "x": 0.6849999999999999,
//         "y": -0.10999999999999997
//       }
//     },
//     {
//       "id": "cdn",
//       "type": "custom",
//       "data": {
//         "label": "CloudFront",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/cloudfront.png"
//       },
//       "position": {
//         "x": 0.7374999999999999,
//         "y": -0.05749999999999998
//       }
//     },
//     {
//       "id": "web_server",
//       "type": "custom",
//       "data": {
//         "label": "Web Server",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/compute/ec2.png"
//       },
//       "position": {
//         "x": 0.15999999999999998,
//         "y": -0.004999999999999982
//       }
//     },
//     {
//       "id": "app_server",
//       "type": "custom",
//       "data": {
//         "label": "App Server",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/compute/ec2.png"
//       },
//       "position": {
//         "x": 0.37,
//         "y": 0.10000000000000002
//       }
//     },
//     {
//       "id": "api_gateway",
//       "type": "custom",
//       "data": {
//         "label": "API Gateway",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/compute/lambda.png"
//       },
//       "position": {
//         "x": -0.10250000000000001,
//         "y": 0.047500000000000014
//       }
//     },
//     {
//       "id": "kinesis",
//       "type": "custom",
//       "data": {
//         "label": "Kinesis Data Streams",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/analytics/kinesis.png"
//       },
      
//     },
//     {
//       "id": "queue",
//       "type": "custom",
//       "data": {
//         "label": "SQS Queue",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/integration/simple-queue-service-sqs.png"
//       },
//     },
//     {
//       "id": "sagemaker",
//       "type": "custom",
//       "data": {
//         "label": "Sagemaker",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/ml/sagemaker.png"
//       },
//     },
//     {
//       "id": "redshift",
//       "type": "custom",
//       "data": {
//         "label": "Redshift",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/database/redshift.png"
//       },
//     },
//     {
//       "id": "data_lake",
//       "type": "custom",
//       "data": {
//         "label": "Data Lake",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/storage/simple-storage-service-s3.png"
//       },
//     },
//     {
//       "id": "ddb",
//       "type": "custom",
//       "data": {
//         "label": "DynamoDB",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/database/dynamodb.png"
//       },
      
//     },
//     {
//       "id": "iam_role",
//       "type": "custom",
//       "data": {
//         "label": "IAM Role",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/security/identity-and-access-management-iam-role.png"
//       },
      
//     },
//     {
//       "id": "kms",
//       "type": "custom",
//       "data": {
//         "label": "KMS",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/security/key-management-service.png"
//       },
      
//     },
//     {
//       "id": "cloudwatch",
//       "type": "custom",
//       "data": {
//         "label": "CloudWatch",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/management/cloudwatch.png"
//       },
      
//     },
//     {
//       "id": "datadog",
//       "type": "custom",
//       "data": {
//         "label": "Datadog",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/saas/logging/datadog.png"
//       },
//       "position": {
//         "x": 0.3175,
//         "y": 0.15250000000000002
//       }
//     },
//     {
//       "id": "pipeline",
//       "type": "custom",
//       "data": {
//         "label": "CodePipeline",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/devtools/codepipeline.png"
//       },
//       "position": {
//         "x": -0.9425,
//         "y": -0.26749999999999996
//       }
//     },
//     {
//       "id": "build",
//       "type": "custom",
//       "data": {
//         "label": "CodeBuild",
//         "iconUrl": "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/devtools/codebuild.png"
//       },
//       "position": {
//         "x": -0.785,
//         "y": -0.10999999999999997
//       }
//     }
//   ],
//   "edges": [
//     {
//       "id": "dns_cdn",
//       "source": "dns",
//       "target": "cdn",
//       "label": "DNS Resolution"
//     },
//     {
//       "id": "cdn_waf",
//       "source": "cdn",
//       "target": "waf",
//       "label": "HTTPS 443 / TLS1.3"
//     },
//     {
//       "id": "waf_lb",
//       "source": "waf",
//       "target": "lb",
//       "label": "HTTPS 443 / TLS1.3"
//     },
//     {
//       "id": "lb_web_server",
//       "source": "lb",
//       "target": "web_server",
//       "label": "HTTPS 443 / TLS1.3"
//     },
//     {
//       "id": "lb_app_server",
//       "source": "lb",
//       "target": "app_server",
//       "label": "HTTPS 443 / TLS1.3"
//     },
//     {
//       "id": "web_server_api_gateway",
//       "source": "web_server",
//       "target": "api_gateway",
//       "label": "HTTPS 443 / TLS1.3"
//     },
//     {
//       "id": "api_gateway_kinesis",
//       "source": "api_gateway",
//       "target": "kinesis",
//       "label": "PutRecord API / TLS1.3"
//     },
//     {
//       "id": "kinesis_queue",
//       "source": "kinesis",
//       "target": "queue",
//       "label": "Kinesis Data Firehose"
//     },
//     {
//       "id": "queue_sagemaker",
//       "source": "queue",
//       "target": "sagemaker",
//       "label": "SQS Polling"
//     },
//     {
//       "id": "sagemaker_redshift",
//       "source": "sagemaker",
//       "target": "redshift",
//       "label": "Batch Transform"
//     },
//     {
//       "id": "redshift_data_lake",
//       "source": "redshift",
//       "target": "data_lake",
//       "label": "Copy Command"
//     },
//     {
//       "id": "sagemaker_ddb",
//       "source": "sagemaker",
//       "target": "ddb",
//       "label": "PutItem"
//     },
//     {
//       "id": "web_server_iam_role",
//       "source": "web_server",
//       "target": "iam_role",
//       "label": "AssumeRole"
//     },
//     {
//       "id": "app_server_kms",
//       "source": "app_server",
//       "target": "kms",
//       "label": "Encrypt/Decrypt"
//     },
//     {
//       "id": "web_server_cloudwatch",
//       "source": "web_server",
//       "target": "cloudwatch",
//       "label": "Logs"
//     },
//     {
//       "id": "app_server_datadog",
//       "source": "app_server",
//       "target": "datadog",
//       "label": "Metrics"
//     },
//     {
//       "id": "pipeline_build",
//       "source": "pipeline",
//       "target": "build",
//       "label": "Build Trigger"
//     },
//     {
//       "id": "build_lb",
//       "source": "build",
//       "target": "lb",
//       "label": "Deploy"
//     }
//   ],
//   "clusters": [
//     {
//       "id": "networking",
//       "label": "Networking",
//       "nodes": [
//         "igw",
//         "nat"
//       ],
//       "parent": [],
//       "hasTint": false
//     },
//     {
//       "id": "vpc",
//       "label": "VPC",
//       "nodes": [
//         "lb",
//         "waf"
//       ],
//       "parent": [
//         "networking"
//       ],
//       "hasTint": false
//     },
//     {
//       "id": "public_subnet",
//       "label": "Public Subnet",
//       "nodes": [
//         "dns",
//         "cdn"
//       ],
//       "parent": [
//         "vpc"
//       ]
//     },
//     {
//       "id": "private_subnet",
//       "label": "Private Subnet",
//       "nodes": [
//         "web_server",
//         "app_server",
//         "api_gateway"
//       ],
//       "parent": [
//         "vpc"
//       ]
//     },
//     {
//       "id": "data_processing",
//       "label": "Data Processing",
//       "nodes": ["ingestion","processing_and_analysis","storage"],
//       "parent": []
//     },
//     {
//       "id": "ingestion",
//       "label": "Ingestion",
//       "nodes": ["kinesis","queue"],
//       "parent": ["data_processing"]
//     },
//     {
//       "id": "processing_and_analysis",
//       "label": "Processing and Analysis",
//       "nodes": ["sagemaker","redshift"],
//       "parent": ["data_processing"]
//     },
//     {
//       "id": "storage",
//       "label": "Storage",
//       "nodes": ["data_lake","ddb"],
//       "parent": ["data_processing"]
//     },
//     {
//       "id": "security_&_iam",
//       "label": "Security & IAM",
//       "nodes": [
//         "iam_role",
//         "kms"
//       ],
//       "parent": []
//     },
//     {
//       "id": "monitoring_&_logging",
//       "label": "Monitoring & Logging",
//       "nodes": [
//         "cloudwatch",
//         "datadog"
//       ],
//       "parent": []
//     },
//     {
//       "id": "ci/cd",
//       "label": "CI/CD",
//       "nodes": [
//         "pipeline",
//         "build"
//       ],
//       "parent": []
//     }

//   ]
// }
 
// // Edge color (from SampleDiagram.tsx)
// const EDGE_COLOR = "#1F2937";

// // ✅ Dagre layout
// function layoutWithDagreImproved(nodes, edges, direction = "LR") {
//   const g = new dagre.graphlib.Graph();
//   g.setDefaultEdgeLabel(() => ({}));
//   // Increase nodesep and ranksep for more grid-like spacing
//   g.setGraph({
//     rankdir: direction,
//     nodesep: 420, // even more gap between nodes and clusters
//     ranksep: 480, // even more vertical gap
//     marginx: 160,  // more outer margin
//     marginy: 160,
//   });
//   // Dynamically sort clusters for contiguous layout based on parent-child relationships
//   function getClusterDependencies(clusters) {
//     const deps = {};
//     for (const c of clusters) {
//       deps[c.id] = [];
//       // If a cluster declares a parent, it depends on its parent
//       if (c.parent) deps[c.id].push(...c.parent);
//       // If a cluster's nodes include other clusters, it depends on them (nesting)
//       for (const n of c.nodes) {
//         if (clusters.some(cl => cl.id === n)) {
//           deps[c.id].push(n);
//         }
//       }
//     }
//     return deps;
//   }
//   //ensures parent clusters are always laid out before their children.
//   function topoSortClusters(clusters) {
//     const deps = getClusterDependencies(clusters);
//     const visited = new Set();
//     const result = [];
//     function visit(id) {
//       if (visited.has(id)) return;
//       visited.add(id);
//       for (const dep of deps[id]) visit(dep);
//       result.push(id);
//     }
//     for (const c of clusters) visit(c.id);
//     return result.reverse(); // parents before children
//   }
//   const clusterOrder = topoSortClusters(graphJson.clusters);
//   const clusterNodeIds = clusterOrder.flatMap(clusterId => {
//     const cluster = graphJson.clusters.find(c => c.id === clusterId);
//     return cluster ? cluster.nodes : [];
//   });
//   // Non-cluster nodes
//   const nonClusterNodes = nodes.filter(n => !clusterNodeIds.includes(n.id));
//   // Cluster nodes in order
//   const sortedClusterNodes = clusterNodeIds.map(id => nodes.find(n => n.id === id)).filter(Boolean);
//   // Final node order for Dagre
//   const sortedNodes = [...sortedClusterNodes, ...nonClusterNodes];
//   // Dynamically align main pipeline nodes (nodes in the longest path) in a single rank
//   function findLongestPathNodes(nodes, edges) {
//     // Build adjacency list
//     const adj = {};
//     nodes.forEach(n => { adj[n.id] = []; });
//     edges.forEach(e => { adj[e.source].push(e.target); });
//     // DFS to find longest path
//     let maxPath = [];
//     function dfs(nodeId, path, visited) {
//       if (path.length > maxPath.length) maxPath = [...path];
//       for (const next of adj[nodeId] || []) {
//         if (!visited.has(next)) {
//           visited.add(next);
//           dfs(next, [...path, next], visited);
//           visited.delete(next);
//         }
//       }
//     }
//     nodes.forEach(n => {
//       dfs(n.id, [n.id], new Set([n.id]));
//     });
//     return maxPath;
//   }
//   const mainPipelineIds = findLongestPathNodes(sortedNodes, edges);
//   // Dynamically measure label width for each node
//   function measureTextWidth(text, font = '800 28px Inter, Arial, sans-serif') {
//     if (typeof window !== 'undefined' && window.document) {
//       const canvas = document.createElement('canvas');
//       const context = canvas.getContext('2d');
//       context.font = font;
//       return context.measureText(text).width + 32; // add padding
//     }
//     // fallback for SSR
//     return Math.max(180, text.length * 18);
//   }
//   sortedNodes.forEach((n) => {
//     const ICON_SIZE = 340;
//     const LABEL_H = 60; // room for label under icon
//     const labelWidth = n.data && n.data.label ? measureTextWidth(n.data.label) : ICON_SIZE;
//     const w = Math.max(labelWidth, ICON_SIZE);
//     const h = ICON_SIZE + LABEL_H;
//     // Assign same rank to main pipeline nodes for lane alignment
//     if (mainPipelineIds.includes(n.id)) {
//       g.setNode(n.id, { width: w, height: h, rank: 0 });
//     } else {
//       g.setNode(n.id, { width: w, height: h });
//     }
//   });
//   edges.forEach((e) => g.setEdge(e.source, e.target));
//   dagre.layout(g);
//   // Center the main pipeline vertically
//   const mainPipelineYs = mainPipelineIds.map(id => {
//     const nodeWithPos = g.node(id);
//     return nodeWithPos ? nodeWithPos.y : null;
//   }).filter(y => y !== null);
//   const minY = Math.min(...mainPipelineYs);
//   const maxY = Math.max(...mainPipelineYs);
//   const pipelineCenterY = (minY + maxY) / 2;
//   // Calculate diagram vertical center
//   const allYs = sortedNodes.map(n => {
//     const nodeWithPos = g.node(n.id);
//     return nodeWithPos ? nodeWithPos.y : null;
//   }).filter(y => y !== null);
//   const diagramCenterY = (Math.min(...allYs) + Math.max(...allYs)) / 2;
//   const verticalOffset = diagramCenterY - pipelineCenterY;
//   // First, apply vertical centering as before
//   let layoutedNodes = sortedNodes.map((n) => {
//     const nodeWithPos = g.node(n.id);
//     if (!nodeWithPos) return n;
//     const isMainPipeline = mainPipelineIds.includes(n.id);
//     const y = isMainPipeline ? nodeWithPos.y + verticalOffset : nodeWithPos.y;
//     return {
//       ...n,
//       width: nodeWithPos.width,
//       height: nodeWithPos.height,
//       position: { x: nodeWithPos.x, y },
//       sourcePosition: direction === "LR" ? Position.Right : Position.Bottom,
//       targetPosition: direction === "LR" ? Position.Left : Position.Top,
//     };
//   });
//   // Normalize so minimum y is zero
//   const minYFinal = Math.min(...layoutedNodes.map(n => n.position.y));
//   if (minYFinal < 0) {
//     layoutedNodes = layoutedNodes.map(n => ({
//       ...n,
//       position: { ...n.position, y: n.position.y - minYFinal + 20 }, // add a margin
//     }));
//   }
//   return { nodes: layoutedNodes, edges };
// }
// // 👉 Ensure top-level clusters (no parent) render as individual, non-overlapping groups
// function separateTopLevelClusters(layoutedNodes, clusters, direction = "LR") {
//   // Identify top-level clusters
//   const topLevelClusters = (clusters || []).filter(
//     (c) => !Array.isArray(c.parent) || c.parent.length === 0
//   );
//   if (!topLevelClusters.length) return layoutedNodes;

//   // Helper: recursively gather node ids for a cluster (via explicit children and via parent references)
//   function gatherNodeIds(clusterId) {
//     const cluster = clusters.find((c) => c.id === clusterId);
//     if (!cluster) return [];
//     let ids = [];

//     // 1) Traverse explicit children listed in `nodes`
//     for (const id of (cluster.nodes || [])) {
//       const childCluster = clusters.find((c) => c.id === id);
//       if (childCluster) {
//         ids = ids.concat(gatherNodeIds(childCluster.id));
//       } else {
//         ids.push(id);
//       }
//     }

//     // 2) Also traverse clusters that declare this one as a parent
//     const childrenByParent = (clusters || []).filter(
//       (c) => Array.isArray(c.parent) && c.parent.includes(clusterId)
//     );
//     for (const child of childrenByParent) {
//       ids = ids.concat(gatherNodeIds(child.id));
//     }

//     // De-duplicate
//     return Array.from(new Set(ids));
//   }

//   // Build initial boxes from laid out node positions
//   function boxForIds(ids) {
//     const children = layoutedNodes.filter((n) => ids.includes(n.id));
//     if (!children.length) return null;
//     const minX = Math.min(...children.map((n) => n.position.x));
//     const minY = Math.min(...children.map((n) => n.position.y));
//     const maxX = Math.max(
//       ...children.map((n) => n.position.x + (n.width ?? 180))
//     );
//     const maxY = Math.max(
//       ...children.map((n) => n.position.y + (n.height ?? 70))
//     );
//     return { minX, minY, maxX, maxY };
//   }

//   // Working copy of nodes that we will translate
//   let adjusted = [...layoutedNodes];

//   // Compute cluster entries with boxes (inflated by visual margins used in rendering)
//   let entries = topLevelClusters
//     .map((c) => {
//       const ids = gatherNodeIds(c.id);
//       const box = boxForIds(ids);
//       if (!box) return null;
//       // Inflate by the same margins applied in buildClusterNodes so we separate borders, not just children
//       const TOP_LEVEL_MARGIN_X = 180;
//       const TOP_LEVEL_MARGIN_Y = 180 + 18; // include badge offset
//       return {
//         id: c.id,
//         ids,
//         minX: box.minX - TOP_LEVEL_MARGIN_X,
//         minY: box.minY - TOP_LEVEL_MARGIN_Y,
//         maxX: box.maxX + TOP_LEVEL_MARGIN_X,
//         maxY: box.maxY + TOP_LEVEL_MARGIN_Y,
//       };
//     })
//     .filter(Boolean);

//   // Minimum visual separation between top-level clusters
//   const GAP = 280;

//   // Helper to check 2D overlap between two cluster boxes
//   function boxesOverlap(a, b) {
//     const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
//     const overlapY = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
//     return overlapX > 0 && overlapY > 0;
//   }

//   // Helper to move an entry and all its child nodes
//   function moveEntry(entry, dx, dy) {
//     adjusted = adjusted.map((n) =>
//       entry.ids.includes(n.id)
//         ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } }
//         : n
//     );
//     entry.minX += dx; entry.maxX += dx;
//     entry.minY += dy; entry.maxY += dy;
//   }

//   // Resolve pairwise overlaps iteratively until none remain
//   let changed = true;
//   while (changed) {
//     changed = false;
//     // Keep a stable order along the primary axis for determinism
//     entries.sort((a, b) => (direction === "LR" ? a.minX - b.minX : a.minY - b.minY));

//     for (let i = 0; i < entries.length; i++) {
//       for (let j = i + 1; j < entries.length; j++) {
//         const a = entries[i];
//         const b = entries[j];
//         if (!a || !b) continue;
//         if (boxesOverlap(a, b)) {
//           if (direction === "LR") {
//             const dx = (a.maxX + GAP) - b.minX;
//             if (dx > 0) moveEntry(b, dx, 0);
//           } else {
//             const dy = (a.maxY + GAP) - b.minY;
//             if (dy > 0) moveEntry(b, 0, dy);
//           }
//           changed = true;
//         }
//       }
//     }
//   }

//   return adjusted;
// }
// // ✅ Prevent overlaps among child clusters inside the same parent cluster (e.g., within VPC or Data Processing)
// function separateNestedClusters(layoutedNodes, clusters, direction = "LR") {
//   if (!Array.isArray(clusters) || clusters.length === 0) return layoutedNodes;

//   // Helper: recursively gather node ids for a cluster (via explicit children and via parent references)
//   function gatherNodeIds(clusterId) {
//     const cluster = clusters.find((c) => c.id === clusterId);
//     if (!cluster) return [];
//     let ids = [];
//     for (const id of (cluster.nodes || [])) {
//       const childCluster = clusters.find((c) => c.id === id);
//       if (childCluster) {
//         ids = ids.concat(gatherNodeIds(childCluster.id));
//       } else {
//         ids.push(id);
//       }
//     }
//     const childrenByParent = (clusters || []).filter(
//       (c) => Array.isArray(c.parent) && c.parent.includes(clusterId)
//     );
//     for (const child of childrenByParent) {
//       ids = ids.concat(gatherNodeIds(child.id));
//     }
//     return Array.from(new Set(ids));
//   }

//   function boxForIds(ids) {
//     const children = layoutedNodes.filter((n) => ids.includes(n.id));
//     if (!children.length) return null;
//     const minX = Math.min(...children.map((n) => n.position.x));
//     const minY = Math.min(...children.map((n) => n.position.y));
//     const maxX = Math.max(...children.map((n) => n.position.x + (n.width ?? 180)));
//     const maxY = Math.max(...children.map((n) => n.position.y + (n.height ?? 70)));
//     return { minX, minY, maxX, maxY };
//   }

//   let adjusted = [...layoutedNodes];

//   // For every parent cluster that has child clusters, resolve overlaps between the child cluster boxes
//   const parentClusters = clusters.filter((c) => {
//     const childClusters = clusters.filter(
//       (cl) => Array.isArray(cl.parent) && cl.parent.includes(c.id)
//     );
//     return childClusters.length > 1; // only matters if 2+ child clusters
//   });

//   const GAP = 220; // minimum separation between sibling clusters inside a parent
//   const CHILD_MARGIN_X = 140; // approximate inner margins used when rendering
//   const CHILD_MARGIN_Y = 140 + 18;

//   function moveIds(ids, dx, dy) {
//     adjusted = adjusted.map((n) =>
//       ids.includes(n.id)
//         ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } }
//         : n
//     );
//   }

//   for (const parent of parentClusters) {
//     // Build entries for each child cluster of this parent
//     const childClusters = clusters.filter(
//       (cl) => Array.isArray(cl.parent) && cl.parent.includes(parent.id)
//     );
//     let entries = childClusters
//       .map((child) => {
//         const ids = gatherNodeIds(child.id);
//         const box = boxForIds(ids);
//         if (!box) return null;
//         return {
//           id: child.id,
//           ids,
//           minX: box.minX - CHILD_MARGIN_X,
//           minY: box.minY - CHILD_MARGIN_Y,
//           maxX: box.maxX + CHILD_MARGIN_X,
//           maxY: box.maxY + CHILD_MARGIN_Y,
//         };
//       })
//       .filter(Boolean);

//     if (!entries.length) continue;

//     let changed = true;
//     while (changed) {
//       changed = false;
//       entries.sort((a, b) => (direction === "LR" ? a.minX - b.minX : a.minY - b.minY));
//       for (let i = 0; i < entries.length; i++) {
//         for (let j = i + 1; j < entries.length; j++) {
//           const a = entries[i];
//           const b = entries[j];
//           if (!a || !b) continue;

//           const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
//           const overlapY = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
//           const isOverlap = overlapX > 0 && overlapY > 0;
//           if (!isOverlap) continue;

//           if (direction === "LR") {
//             const dx = (a.maxX + GAP) - b.minX;
//             if (dx > 0) {
//               moveIds(b.ids, dx, 0);
//               b.minX += dx; b.maxX += dx;
//               changed = true;
//             }
//           } else {
//             const dy = (a.maxY + GAP) - b.minY;
//             if (dy > 0) {
//               moveIds(b.ids, 0, dy);
//               b.minY += dy; b.maxY += dy;
//               changed = true;
//             }
//           }
//         }
//       }
//     }
//   }

//   return adjusted;
// }
// // ✅ Build clusters as parent nodes (fixed)
// function buildClusterNodes(layoutedNodes, clusters) {
//   // Helper to recursively collect all descendant node IDs for a cluster
//   function getDescendantNodeIdsAndClusters(clusterId) {
//     const cluster = clusters.find(c => c.id === clusterId);
//     if (!cluster) return [];
//     let ids = [];
//     for (const id of cluster.nodes) {
//       const childCluster = clusters.find(c => c.id === id);
//       if (childCluster) {
//         ids.push(id); // include the child cluster itself
//         ids = ids.concat(getDescendantNodeIdsAndClusters(childCluster.id));
//       } else {
//         ids.push(id);
//       }
//     }
//     return ids;
//   }
//   // 🎨 Use a fixed standard palette and assign colors randomly, reusing as needed
//   const STANDARD_PALETTE = [
//     "#FFD700", // Gold
//     "#FF69B4", // Hot Pink
//     "#87CEEB", // Sky Blue
//     "#32CD32", // Lime Green
//     "#1E90FF", // Blue
//     "#BA55D3"  // Medium Orchid
//   ];
//   // Shuffle utility
//   function shuffleArray(array: string[]): string[] {
//     const arr = [...array];
//     for (let i = arr.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [arr[i], arr[j]] = [arr[j], arr[i]];
//     }
//     return arr;
//   }
//   // Assign a color to each cluster, cycling through palette if needed
//   const shuffledPalette = shuffleArray(STANDARD_PALETTE);
//   const clusterColorMap: { [id: string]: string } = {};
//   clusters.forEach((c, i) => {
//     clusterColorMap[c.id] = shuffledPalette[i % shuffledPalette.length];
//   });
//   function getClusterColor(clusterId: string) {
//     return clusterColorMap[clusterId] || "#FFD700";
//   }
//   const clusterBoxes = {};
//   // First pass: compute bounding boxes
//   clusters.forEach((c) => {
//     const descendantNodeIds = getDescendantNodeIdsAndClusters(c.id);
//     let children = layoutedNodes.filter((n) => descendantNodeIds.includes(n.id));
//     // 🆕 If no direct children, but cluster has child clusters, use their boxes
//     if (children.length === 0) {
//       const childClusterIds = clusters
//         .filter(cl => Array.isArray(cl.parent) && cl.parent.includes(c.id))
//         .map(cl => cl.id);
//       // Inflate by the child's own visual margins so parent respects child borders
//       const CHILD_MARGIN = 140; // must match baseMargin below
//       const BADGE_OFFSET = 18;
//       children = childClusterIds.filter(childId => clusterBoxes[childId]).map(childId => {
//         const box = clusterBoxes[childId];
//         const minX = box.minX - CHILD_MARGIN;
//         const minY = box.minY - CHILD_MARGIN - BADGE_OFFSET;
//         const maxX = box.maxX + CHILD_MARGIN;
//         const maxY = box.maxY + CHILD_MARGIN + BADGE_OFFSET;
//         return {
//           id: childId,
//           position: { x: minX, y: minY },
//           width: maxX - minX,
//           height: maxY - minY
//         };
//       });
//     }
//     if (children.length === 0) return; // truly empty cluster, skip
//     const CLUSTER_GAP = 32;
//     const minX = Math.min(...children.map((n) => n.position.x)) - CLUSTER_GAP;
//     const minY = Math.min(...children.map((n) => n.position.y)) - CLUSTER_GAP;
//     // Use dynamically measured node width for cluster sizing
//     const maxX = Math.max(...children.map((n) => n.position.x + (n.width ?? 180))) + CLUSTER_GAP;
//     const maxY = Math.max(...children.map((n) => n.position.y + (n.height ?? 70))) + CLUSTER_GAP;
//     clusterBoxes[c.id] = { minX, minY, maxX, maxY };

//     // 🔥 Ensure top-level clusters (no parent) remain independent
//     const hasParent = Array.isArray(c.parent) && c.parent.length > 0;
//     if (!hasParent) {
//       clusterBoxes[c.id] = {
//         minX,
//         minY,
//         maxX,
//         maxY
//       };
//     }
// if (!hasParent) {
//   clusterBoxes[c.id] = {
//     minX,
//     minY,
//     maxX,
//     maxY
//   };
// }
//   });
//   // Second pass: expand parent clusters to include child clusters + their margins
//   function expandClusterBoxToIncludeDescendants(clusterId) {
//     if (!clusterBoxes[clusterId]) return;
//     const CHILD_MARGIN = 140; // must match baseMargin below
//     const BADGE_OFFSET = 18;
//     const childClusterIds = clusters
//       .filter(cl => Array.isArray(cl.parent) && cl.parent.includes(clusterId))
//       .map(cl => cl.id);
//     childClusterIds.forEach(childId => {
//       expandClusterBoxToIncludeDescendants(childId);
//       if (!clusterBoxes[childId]) return;
//       const childMinX = clusterBoxes[childId].minX - CHILD_MARGIN;
//       const childMinY = clusterBoxes[childId].minY - CHILD_MARGIN - BADGE_OFFSET;
//       const childMaxX = clusterBoxes[childId].maxX + CHILD_MARGIN;
//       const childMaxY = clusterBoxes[childId].maxY + CHILD_MARGIN + BADGE_OFFSET;
//       clusterBoxes[clusterId].minX = Math.min(clusterBoxes[clusterId].minX, childMinX);
//       clusterBoxes[clusterId].minY = Math.min(clusterBoxes[clusterId].minY, childMinY);
//       clusterBoxes[clusterId].maxX = Math.max(clusterBoxes[clusterId].maxX, childMaxX);
//       clusterBoxes[clusterId].maxY = Math.max(clusterBoxes[clusterId].maxY, childMaxY);
//     });
//   }
//   clusters.forEach(c => expandClusterBoxToIncludeDescendants(c.id));
//   // 🎨 Margins & rendering
//   const baseMargin = 90; // extra inner padding so children don't touch borders
//   const topLevelMargin = 60; // more breathing room for top-level clusters like VPC
//   return clusters.map((c, idx) => {
//     const box = clusterBoxes[c.id];
//     if (!box) return null;
//     const hasParent = Array.isArray(c.parent) && c.parent.length > 0;
//     const margin = hasParent ? baseMargin : topLevelMargin;
//     const color = getClusterColor(c.id);
//     const tilt = hasParent ? ((idx % 2 === 0) ? -3 : 3) : 0;

//     // Fully dynamic: use only hasTint from cluster data
//     const hasTint = c.hasTint !== false;
//     return {
//       id: c.id,
//       type: "cluster",
//       data: { label: c.label, hasParent, color, tilt, hasTint },
//       position: { x: box.minX - margin, y: box.minY - margin - 18 },
//       style: {
//         width: box.maxX - box.minX + margin * 2,
//         height: box.maxY - box.minY + margin * 2 + 18,
//         zIndex: -1,
//         pointerEvents: "none"
//       }
//     };
//   }).filter(Boolean);
// }

// // ============= Custom edge with gap under label (from SampleDiagram.tsx) =============
// const GAP_SIDE_PADDING = 8;
// function measurePathLength(d: string): number {
//   const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
//   path.setAttribute("d", d);
//   return path.getTotalLength();
// }
// const GapEdge: React.FC<EdgeProps> = (props) => {
//   const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, label, labelStyle } = props;

//   const [edgePath, labelX, labelY] = React.useMemo(
//     () => getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }),
//     [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]
//   );

//   const [totalLen, setTotalLen] = React.useState<number>(0);
//   React.useLayoutEffect(() => {
//     try { setTotalLen(measurePathLength(edgePath)); } catch { setTotalLen(0); }
//   }, [edgePath]);

//   const labelRef = React.useRef<HTMLDivElement>(null);
//   const [labelW, setLabelW] = React.useState<number>(0);
//   React.useLayoutEffect(() => {
//     const w = labelRef.current?.offsetWidth ?? 0;
//     if (w && Math.abs(w - labelW) > 0.5) setLabelW(w);
//   }, [label, labelStyle, labelW]);

//   const gap = Math.max(0, labelW ? labelW + GAP_SIDE_PADDING * 2 : 0);
//   const draw = totalLen > gap ? (totalLen - gap) / 2 : 0;
//   const dashArray = totalLen && gap ? `${draw} ${gap} ${draw}` : undefined;

//   return (
//     <>
//       <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeDasharray: dashArray, strokeLinecap: "round" }} />
//       {!!label && (
//         <EdgeLabelRenderer>
//           <div
//             ref={labelRef}
//             style={{
//               position: "absolute",
//               transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
//               pointerEvents: "all",
//               background: "transparent",
//               padding: 0,
//               margin: 0,
//               ...labelStyle,
//             }}
//           >
//             {label}
//           </div>
//         </EdgeLabelRenderer>
//       )}
//     </>
//   );
// };
// const edgeTypes = { gap: GapEdge };
// const CustomNode = ({ data }) => {
//   const direction = data?.direction || "LR";
//   const targetPos = direction === "LR" ? Position.Left : Position.Top;
//   const sourcePos = direction === "LR" ? Position.Right : Position.Bottom;
//   return (
//     <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
//       {/* Icon = the actual node bounding box */}
//       <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 340, height: 340, minWidth: 340, minHeight: 340 }}>
//         {/* Incoming edge handle */}
//         <Handle
//           type="target"
//           position={targetPos}
//           id="left"
//           style={{ opacity: 0, width: 0, height: 0 }}
//         />
//         {data.iconUrl && (
//           <img src={data.iconUrl} alt={data.label} style={{ width: 340, height: 340, objectFit: "contain" }} />
//         )}
//         <Handle
//           type="source"
//           position={sourcePos}
//           id="right"
//           style={{ opacity: 0, width: 0, height: 0 }}
//         />
//       </div>
//       {/* Label BELOW, outside the bounding box */}
//       <div
//         style={{
//           fontSize: 28,
//           fontWeight: 800,
//           marginTop: 8,
//           textAlign: "center",
//           lineHeight: 1.2,
//           display: 'inline-block',
//           whiteSpace: "nowrap",
//           overflow: "visible",
//           textOverflow: "unset",
//           pointerEvents: "none", // won’t interfere with edges
//         }}
//       >
//         {data.label}
//       </div>
//     </div>
//   );
// };
// // ✅ Cluster Node renderer
// // Utility to convert hex to rgba with alpha
// function hexToRgba(hex: string, alpha: number) {
//   let c = hex.replace('#', '');
//   if (c.length === 3) {
//     c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
//   }
//   const num = parseInt(c, 16);
//   const r = (num >> 16) & 255;
//   const g = (num >> 8) & 255;
//   const b = num & 255;
//   return `rgba(${r},${g},${b},${alpha})`;
// }

// const ClusterNode = ({ data }) => {
//   return (
//     <div
//       style={{
//         border: `4px solid ${data.color}`,
//         borderRadius: 24,
//         background: data.hasTint === false ? "#fff" : hexToRgba(data.color, 0.13),
//         minWidth: 420,
//         minHeight: 220,
//         width: "100%",
//         height: "100%",
//         padding: 28,
//         position: "relative",
//         zIndex: 0,
//         boxShadow: `0 6px 32px 0 ${data.color}22, 0 2px 12px 0 rgba(90,107,138,0.07)`,
//         pointerEvents: "none",
//         transition: "background 0.2s, transform 0.2s, box-shadow 0.2s",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         flexDirection: "column",
//       }}
//     >
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           position: "absolute",
//           top: 18,
//           left: 28,
//           background: "#fff", // White background for badge
//           border: `2px solid ${data.color}`,
//           borderRadius: 16,
//           padding: "10px 36px 10px 36px",
//           fontWeight: 900,
//           fontSize: 34,
//           color: '#222',
//           boxShadow: `0 1px 8px 0 ${data.color}22`,
//           pointerEvents: "auto",
//           minHeight: 56,
//         }}
//       >
//         {data.label}
//       </div>
//     </div>
//   );
// };
// const nodeTypes = { custom: CustomNode, cluster: ClusterNode };
// export default function DagreFlow() {
//   const [direction, setDirection] = useState("LR");
//   const [nodes, setNodes, onNodesChange] = useNodesState([]);
//   const [edges, setEdges, onEdgesChange] = useEdgesState([]);
//   const [rfInstance, setRfInstance] = useState<any>(null);
//   // Tweak these to control how large the diagram appears after fitting
//   const FIT_PADDING = 0.08;        // lower = bigger diagram
//   const SCALE_BOOST = 1.12;        // slight zoom-in after fit

//   // Helper: compute bounds of all rendered nodes
//   const computeNodeBounds = useCallback((list: any[]) => {
//     if (!list || list.length === 0) return null;
//     let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
//     for (const n of list) {
//       const w = (n?.width ?? 180);
//       const h = (n?.height ?? 70);
//       const x1 = n?.position?.x ?? 0;
//       const y1 = n?.position?.y ?? 0;
//       const x2 = x1 + w;
//       const y2 = y1 + h;
//       if (x1 < minX) minX = x1;
//       if (y1 < minY) minY = y1;
//       if (x2 > maxX) maxX = x2;
//       if (y2 > maxY) maxY = y2;
//     }
//     return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
//   }, []);

//   const centerGraph = useCallback(() => {
//     if (!rfInstance || !nodes.length) return;
//     const b = computeNodeBounds(nodes);
//     if (!b) return;
//     try {
//       const vp = rfInstance.getViewport ? rfInstance.getViewport() : { zoom: undefined };
//       const nextZoom = Math.min((vp?.zoom ?? 1) * SCALE_BOOST, 2);
//       rfInstance.setCenter(b.cx, b.cy, { zoom: nextZoom, duration: 250 });
//     } catch {}
//   }, [rfInstance, nodes, computeNodeBounds]);
//   useEffect(() => {
//     // Debug: Log graphJson, nodes, edges, clusters
//     console.log('graphJson', graphJson);
//     console.log('graphJson.nodes', graphJson.nodes);
//     console.log('graphJson.edges', graphJson.edges);
//     console.log('graphJson.clusters', graphJson.clusters);
//     // Filter out edges without clear direction or with missing endpoints
//     const filteredEdges = (graphJson.edges || []).filter(e => e.source && e.target && e.source !== e.target);
//     const { nodes: layoutedNodes, edges: layoutedEdges } = layoutWithDagreImproved(
//       graphJson.nodes,
//       filteredEdges,
//       direction
//     );
//     // Ensure top-level clusters do not appear nested by separating them visually
//     let separatedNodes = separateTopLevelClusters(layoutedNodes, graphJson.clusters, direction);
//     // Also separate overlapping child clusters within the same parent (e.g., inside VPC or Data Processing)
//     separatedNodes = separateNestedClusters(separatedNodes, graphJson.clusters, direction);
//     // Attach parentNode to children (support recursive parent lookup)
//     function findParentClusterId(nodeId) {
//       // collect all clusters that include this node
//       const containingClusters = graphJson.clusters.filter(c => c.nodes.includes(nodeId));
//       if (containingClusters.length === 0) return undefined;
    
//       // pick the deepest cluster
//       const deepestCluster = containingClusters.sort(
//         (a, b) => (a.parent?.length || 0) - (b.parent?.length || 0)
//       ).pop();
    
//       // ❌ If cluster has no parent, treat it as top-level (don’t assign parentNode)
//       if (!deepestCluster?.parent || deepestCluster.parent.length === 0) {
//         return undefined;
//       }
//       return deepestCluster.id;
//     }
    

//     const withParents = separatedNodes.map((n) => {
//       const parentId = findParentClusterId(n.id);
//       if (parentId) {
//         return { ...n, parentNode: parentId, extent: "parent" };
//       } else {
//         return { ...n, parentNode: undefined };   // ✅ keep top-level nodes independent
//       }
//     });
    
//     const clusterNodes = buildClusterNodes(withParents, graphJson.clusters);
//     console.log('withParents', withParents);
//     console.log('clusterNodes', clusterNodes);
//     setNodes([...withParents, ...clusterNodes]);

//     // Assign per-pair offsets so parallel edges don't overlap (works best in LR)
//     function distributeOffsets(edges) {
//       const groups = new Map();
//       edges.forEach((e) => {
//         const key = `${e.source}->${e.target}`;
//         if (!groups.has(key)) groups.set(key, []);
//         groups.get(key).push(e);
//       });
//       const result = [];
//       const BASE = 60;    // base distance before first turn
//       const STEP = 28;    // additional separation between parallel edges
//       groups.forEach((list) => {
//         // Sorting keeps stable visual order
//         list.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
//         list.forEach((e, idx) => {
//           result.push({
//             ...e,
//             pathOptions: { offset: BASE + idx * STEP, borderRadius: 18 },
//           });
//         });
//       });
//       return result;
//     }

//     const edgesWithOffsets = distributeOffsets(layoutedEdges);
//     console.log('layoutedEdges', edgesWithOffsets);
//     // Apply SampleDiagram.tsx edge rendering (gap under label, styles, marker)
//     const styledEdges = edgesWithOffsets.map((e) => ({
//       ...e,
//       type: "gap",
//       sourceHandle: direction === "LR" ? "right" : "bottom",
//       targetHandle: direction === "LR" ? "left" : "top",
//       style: {
//         stroke: EDGE_COLOR,
//         opacity: 1,
//         fill: "none",
//         strokeWidth: 4,
//         filter: "drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.2))",
//       },
//       labelStyle: {
//         fontSize: 14,
//         fontWeight: 600,
//         color: "#111827",
//         fill: "#111827",
//       },
//       labelBgStyle: { fill: "transparent", stroke: "transparent" },
//       labelBgPadding: [0, 0] as any,
//       labelBgBorderRadius: 0,
//       markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR, width: 26, height: 26 },
//     }));
//     setEdges(styledEdges);
//   }, [direction]);

//   // Ensure the diagram always fits the viewport after data/layout changes
//   useEffect(() => {
//     if (!nodes.length || !rfInstance) return;
//     // Wait for nodes to render and be measured before fitting
//     const r1 = requestAnimationFrame(() => {
//       try {
//         rfInstance.fitView({ padding: FIT_PADDING, duration: 250 });
//         // Center explicitly in case edges/labels skew the bounding box
//         const r2 = requestAnimationFrame(centerGraph);
//         // store nested frame id on window to cancel safely if needed
//         (window as any).__rf_r2 = r2;
//       } catch {}
//     });
//     return () => cancelAnimationFrame(r1);
//   }, [nodes.length, edges.length, direction, rfInstance, centerGraph]);

//   // Refit on window resize so it adapts to any screen/browser size
//   useEffect(() => {
//     const onResize = () => {
//       try {
//         rfInstance?.fitView({ padding: FIT_PADDING });
//         centerGraph();
//       } catch {}
//     };
//     window.addEventListener('resize', onResize);
//     return () => window.removeEventListener('resize', onResize);
//   }, [rfInstance, centerGraph]);
//   const toggleLayout = useCallback(() => {
//     setDirection((d) => (d === "TB" ? "LR" : "TB"));
//   }, []);
//   return (
//     <div style={{ width: "100%", height: "100vh", position: 'relative' }}>
//       <button
//         onClick={toggleLayout}
//         style={{
//           position: "absolute",
//           zIndex: 10,
//           right: 20,
//           top: 20,
//           padding: "6px 12px",
//           borderRadius: 6,
//           border: "1px solid #aaa",
//           background: "#f7f7f7",
//           cursor: "pointer",
//         }}
//       >
//         Toggle Layout ({direction === "TB" ? "Vertical" : "Horizontal"})
//       </button>
//       {/* Lane labels overlay */}
//       <div style={{
//         position: 'absolute',
//         top: 120,
//         right: 32,
//         display: 'flex',
//         flexDirection: 'column',
//         gap: 52,
//         zIndex: 20,
//         pointerEvents: 'none',
//       }}>

//       </div>
//       <ReactFlow
//         nodes={nodes}
//         edges={edges}
//         minZoom={0.05}
//         maxZoom={2}
//         fitView
//         fitViewOptions={{ padding: FIT_PADDING }}
//         onInit={(instance) => {
//           setRfInstance(instance);
//           try { instance.fitView({ padding: FIT_PADDING }); } catch {}
//         }}
//         onNodesChange={onNodesChange}
//         onEdgesChange={onEdgesChange}
//         nodeTypes={nodeTypes}
//         edgeTypes={edgeTypes}
//         defaultEdgeOptions={{ interactionWidth: 24 }}
//       >
//         <MiniMap />
//         <Controls />
//         <Background />
//       </ReactFlow>
//     </div>
//   );
// }

// App.jsx
import React, { useMemo } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

//
// 🔹 Your static JSON graph
//
const graph = {
  nodes: [
    {
      id: "igw",
      type: "custom",
      data: {
        label: "Internet Gateway",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/internet-gateway.png",
      },
    },
    {
      id: "nat",
      type: "custom",
      data: {
        label: "NAT Gateway",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/nat-gateway.png",
      },
    },
    {
      id: "lb",
      type: "custom",
      data: {
        label: "Application Load Balancer",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/elastic-load-balancing.png",
      },
    },
    {
      id: "waf",
      type: "custom",
      data: {
        label: "Web Application Firewall",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/security/waf.png",
      },
    },
    {
      id: "dns",
      type: "custom",
      data: {
        label: "Route 53",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/route-53.png",
      },
    },
    {
      id: "cdn",
      type: "custom",
      data: {
        label: "CloudFront",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/network/cloudfront.png",
      },
    },
    {
      id: "web_server",
      type: "custom",
      data: {
        label: "Web Server",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/compute/ec2.png",
      },
    },
    {
      id: "app_server",
      type: "custom",
      data: {
        label: "App Server",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/compute/ec2.png",
      },
    },
    {
      id: "api_gateway",
      type: "custom",
      data: {
        label: "API Gateway",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/compute/lambda.png",
      },
    },
    {
      id: "kinesis",
      type: "custom",
      data: {
        label: "Kinesis Data Streams",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/analytics/kinesis.png",
      },
    },
    {
      id: "queue",
      type: "custom",
      data: {
        label: "SQS Queue",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/integration/simple-queue-service-sqs.png",
      },
    },
    {
      id: "sagemaker",
      type: "custom",
      data: {
        label: "Sagemaker",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/ml/sagemaker.png",
      },
    },
    {
      id: "redshift",
      type: "custom",
      data: {
        label: "Redshift",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/database/redshift.png",
      },
    },
    {
      id: "data_lake",
      type: "custom",
      data: {
        label: "Data Lake",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/storage/simple-storage-service-s3.png",
      },
    },
    {
      id: "ddb",
      type: "custom",
      data: {
        label: "DynamoDB",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/database/dynamodb.png",
      },
    },
    {
      id: "iam_role",
      type: "custom",
      data: {
        label: "IAM Role",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/security/identity-and-access-management-iam-role.png",
      },
    },
    {
      id: "kms",
      type: "custom",
      data: {
        label: "KMS",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/security/key-management-service.png",
      },
    },
    {
      id: "cloudwatch",
      type: "custom",
      data: {
        label: "CloudWatch",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/management/cloudwatch.png",
      },
    },
    {
      id: "datadog",
      type: "custom",
      data: {
        label: "Datadog",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/saas/logging/datadog.png",
      },
    },
    {
      id: "pipeline",
      type: "custom",
      data: {
        label: "CodePipeline",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/devtools/codepipeline.png",
      },
    },
    {
      id: "build",
      type: "custom",
      data: {
        label: "CodeBuild",
        iconUrl:
          "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/aws/devtools/codebuild.png",
      },
    },
  ],
  edges: [
    { id: "dns_cdn", source: "dns", target: "cdn", label: "DNS Resolution" },
    { id: "cdn_waf", source: "cdn", target: "waf", label: "HTTPS 443 / TLS1.3" },
    { id: "waf_lb", source: "waf", target: "lb", label: "HTTPS 443 / TLS1.3" },
    { id: "lb_web_server", source: "lb", target: "web_server", label: "HTTPS 443 / TLS1.3" },
    { id: "lb_app_server", source: "lb", target: "app_server", label: "HTTPS 443 / TLS1.3" },
    { id: "web_server_api_gateway", source: "web_server", target: "api_gateway", label: "HTTPS 443 / TLS1.3" },
    { id: "api_gateway_kinesis", source: "api_gateway", target: "kinesis", label: "PutRecord API / TLS1.3" },
    { id: "kinesis_queue", source: "kinesis", target: "queue", label: "Kinesis Data Firehose" },
    { id: "queue_sagemaker", source: "queue", target: "sagemaker", label: "SQS Polling" },
    { id: "sagemaker_redshift", source: "sagemaker", target: "redshift", label: "Batch Transform" },
    { id: "redshift_data_lake", source: "redshift", target: "data_lake", label: "Copy Command" },
    { id: "sagemaker_ddb", source: "sagemaker", target: "ddb", label: "PutItem" },
    { id: "web_server_iam_role", source: "web_server", target: "iam_role", label: "AssumeRole" },
    { id: "app_server_kms", source: "app_server", target: "kms", label: "Encrypt/Decrypt" },
    { id: "web_server_cloudwatch", source: "web_server", target: "cloudwatch", label: "Logs" },
    { id: "app_server_datadog", source: "app_server", target: "datadog", label: "Metrics" },
    { id: "pipeline_build", source: "pipeline", target: "build", label: "Build Trigger" },
    { id: "build_lb", source: "build", target: "lb", label: "Deploy" },
  ],
  clusters: [
    { id: "networking", label: "Networking", nodes: ["igw", "nat"], parent: [] },
    { id: "vpc", label: "VPC", nodes: ["lb", "waf"], parent: ["networking"] },
    { id: "public_subnet", label: "Public Subnet", nodes: ["dns", "cdn"], parent: ["vpc"] },
    { id: "private_subnet", label: "Private Subnet", nodes: ["web_server", "app_server", "api_gateway"], parent: ["vpc"] },
    { id: "data_processing", label: "Data Processing", nodes: ["ingestion", "processing_and_analysis", "storage"], parent: [] },
    { id: "ingestion", label: "Ingestion", nodes: ["kinesis", "queue"], parent: ["data_processing"] },
    { id: "processing_and_analysis", label: "Processing and Analysis", nodes: ["sagemaker", "redshift"], parent: ["data_processing"] },
    { id: "storage", label: "Storage", nodes: ["data_lake", "ddb"], parent: ["data_processing"] },
    { id: "security_&_iam", label: "Security & IAM", nodes: ["iam_role", "kms"], parent: [] },
    { id: "monitoring_&_logging", label: "Monitoring & Logging", nodes: ["cloudwatch", "datadog"], parent: [] },
    { id: "ci/cd", label: "CI/CD", nodes: ["pipeline", "build"], parent: [] },
  ],
};

//
// 🔹 Cluster Colors
//
const clusterColors = {
  networking: "rgba(255, 0, 34, 0.15)",
  vpc: "rgba(0, 128, 255, 0.15)",
  public_subnet: "rgba(0, 200, 255, 0.10)",
  private_subnet: "rgba(0, 255, 200, 0.10)",
  data_processing: "rgba(0, 255, 128, 0.10)",
  ingestion: "rgba(128, 0, 255, 0.10)",
  processing_and_analysis: "rgba(200, 0, 255, 0.10)",
  storage: "rgba(0, 255, 64, 0.10)",
  security_iam: "rgba(255, 0, 0, 0.10)",
  monitoring_logging: "rgba(255, 255, 0, 0.10)",
  ci_cd: "rgba(255, 128, 0, 0.10)",
};

//
// 🔹 Custom Node for AWS services
//
function CustomNode({ data }) {
  return (
    <div className="flex flex-col items-center p-2 bg-gray-900 rounded-xl shadow-md">
      <img src={data.iconUrl} alt={data.label} className="w-10 h-10" />
      <span className="text-xs text-white mt-1">{data.label}</span>
    </div>
  );
}

//
// 🔹 Cluster Node
//
function GroupNode({ data }) {
  return (
    <div className="p-1">
      <div className="text-xs font-bold text-gray-200 mb-1">{data.label}</div>
    </div>
  );
}

//
// 🔹 Dagre Layout
//
const nodeWidth = 120;
const nodeHeight = 80;

function getLayoutedElements(nodes, edges, clusters, direction = "LR") {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  // only leaf nodes (not clusters)
  nodes.forEach((n) => {
    dagreGraph.setNode(n.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((e) => dagreGraph.setEdge(e.source, e.target));
  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((n) => {
    const nodeWithPos = dagreGraph.node(n.id);
    if (!nodeWithPos) return n;

    return {
      ...n,
      position: { x: nodeWithPos.x, y: nodeWithPos.y },
      sourcePosition: direction === "LR" ? "right" : "bottom",
      targetPosition: direction === "LR" ? "left" : "top",
    };
  });

  return { nodes: addClusterBounds(layoutedNodes, clusters), edges };
}

function addClusterBounds(nodes, clusters) {
  const clusterNodes = [];

  clusters.forEach((cluster) => {
    const children = nodes.filter((n) => cluster.nodes.includes(n.id));
    if (children.length === 0) return;

    const minX = Math.min(...children.map((n) => n.position.x));
    const minY = Math.min(...children.map((n) => n.position.y));
    const maxX = Math.max(...children.map((n) => n.position.x + (n.width || nodeWidth)));
    const maxY = Math.max(...children.map((n) => n.position.y + (n.height || nodeHeight)));

    const color = clusterColors[cluster.id] || "rgba(255,255,255,0.05)";

    clusterNodes.push({
      id: cluster.id,
      type: "group",
      data: { label: cluster.label },
      position: { x: minX - 120, y: minY - 100 },
      style: {
        width: maxX - minX + 240,
        height: maxY - minY + 200,
        border: "2px dashed rgba(255,255,255,0.4)",
        borderRadius: 12,
        backgroundColor: color,
      },
    });

    children.forEach((child) => {
      child.parentNode = cluster.id;
      child.extent = "parent";
      child.position = {
        x: child.position.x - (minX - 120),
        y: child.position.y - (minY - 100),
      };
    });
  });

  return [...nodes, ...clusterNodes];
}

//
// 🔹 Main App
//
export default function App() {
  const { nodes, edges } = useMemo(() => {
    const baseNodes = graph.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      data: n.data,
      position: { x: 0, y: 0 },
    }));

    const baseEdges = graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      type: "smoothstep",
      animated: true,
    }));

    return getLayoutedElements(baseNodes, baseEdges, graph.clusters, "LR");
  }, []);

  const nodeTypes = { custom: CustomNode, group: GroupNode };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

