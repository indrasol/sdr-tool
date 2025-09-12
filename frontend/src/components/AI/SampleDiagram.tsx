import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
  } from "react";
  import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    BackgroundVariant,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    MarkerType,
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
    type EdgeProps,
    type Node as RFNode,
    type Edge as RFEdge,
    type ReactFlowProps,
  } from "@xyflow/react";
  import "@xyflow/react/dist/style.css";
  import dagre from "dagre";
   
  /* ============== utils ============== */
  function hexToRgba(hex: string, alpha = 0.13) {
    let c = hex.replace("#", "");
    if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }
   
  /* ============== sizes & colors ============== */
  const NODE_W = 320;
  const NODE_H = 320;
  const ICON = 280;
  const LABEL_H = 48;
  const TOTAL_H = NODE_H + LABEL_H + 16;
  const EDGE_COLOR = "#1F2937";
   
  /* ============== types ============== */
  type Dir = "LR" | "TB";
  interface NodeData extends Record<string, unknown> {
    label: string;
    iconUrl?: string;
    direction?: Dir;
    accentColor?: string;
    tint?: string;
  }
  type MyNode = RFNode<NodeData>;
  type MyEdge = RFEdge;
   
  const TypedReactFlow =
    ReactFlow as unknown as React.FC<ReactFlowProps<MyNode, MyEdge>>;
   
  /* ============== static data ============== */
  const graphJson = 
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
      }
  
    ]
  }
   
  /* ============== dagre layout ============== */
  function layoutWithDagre(nodes: MyNode[], edges: MyEdge[], direction: Dir = "LR") {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: direction, nodesep: 560, ranksep: 640, marginx: 200, marginy: 180 });
   
    function topoSortClusters() {
      const deps: Record<string, string[]> = {};
      for (const c of graphJson.clusters) {
        deps[c.id] = [];
        if (Array.isArray(c.parent)) deps[c.id].push(...c.parent);
        for (const n of c.nodes) if (graphJson.clusters.some((cl) => cl.id === n)) deps[c.id].push(n);
      }
      const seen = new Set<string>();
      const out: string[] = [];
      const visit = (id: string) => { if (!seen.has(id)) { seen.add(id); (deps[id] || []).forEach(visit); out.push(id); } };
      graphJson.clusters.forEach((c) => visit(c.id));
      return out.reverse();
    }
   
    const clusterOrder = topoSortClusters();
    const clusterNodeIds = Array.from(
      new Set(
        clusterOrder.flatMap((cid) => {
          const c = graphJson.clusters.find((x) => x.id === cid);
          return c ? c.nodes : [];
        })
      )
    );
   
    const nonClusterNodes = nodes.filter((n) => !clusterNodeIds.includes(n.id));
    const sortedClusterNodes = clusterNodeIds.map((id) => nodes.find((n) => n.id === id)).filter(Boolean) as MyNode[];
    const sortedNodes = [...sortedClusterNodes, ...nonClusterNodes];
    const uniqSortedNodes = Array.from(new Map(sortedNodes.map((n) => [n.id, n!])).values());
   
    const adj: Record<string, string[]> = {};
    uniqSortedNodes.forEach((n) => (adj[n.id] = []));
    edges.forEach((e) => { if (e.source && e.target && adj[e.source as string]) adj[e.source as string].push(e.target as string); });
    let best: string[] = [];
    function dfs(id: string, path: string[], seen: Set<string>) {
      if (path.length > best.length) best = [...path];
      for (const nxt of adj[id] || []) if (!seen.has(nxt)) { seen.add(nxt); dfs(nxt, [...path, nxt], seen); seen.delete(nxt); }
    }
    uniqSortedNodes.forEach((n) => dfs(n.id, [n.id], new Set([n.id])));
   
    uniqSortedNodes.forEach((n) => {
      const payload: dagre.Label = { width: NODE_W, height: TOTAL_H };
      g.setNode(n.id, best.includes(n.id) ? { ...payload, rank: "same" } : payload);
    });
   
    const idset = new Set(uniqSortedNodes.map((n) => n.id));
    const validEdges = (edges || []).filter(
      (e) => e.source && e.target && e.source !== e.target && idset.has(e.source as string) && idset.has(e.target as string)
    );
    validEdges.forEach((e) => g.setEdge(e.source as string, e.target as string));
   
    dagre.layout(g);
   
    let layoutedNodes: MyNode[] = uniqSortedNodes.map((n) => {
      const p = g.node(n.id) as any;
      const nd = (n.data as Partial<NodeData>) ?? {};
      const data: NodeData = { label: nd.label ?? String(n.id), iconUrl: nd.iconUrl, direction };
      return {
        ...n,
        width: NODE_W,
        height: TOTAL_H,
        position: { x: p?.x ?? 0, y: p?.y ?? 0 },
        data,
        sourcePosition: direction === "LR" ? Position.Right : Position.Bottom,
        targetPosition: direction === "LR" ? Position.Left : Position.Top,
      };
    });
   
    const minY = Math.min(...layoutedNodes.map((n) => n.position!.y));
    if (Number.isFinite(minY) && minY < 0) {
      layoutedNodes = layoutedNodes.map((n) => ({ ...n, position: { ...n.position!, y: n.position!.y - minY + 20 } }));
    }
   
    return { nodes: layoutedNodes, edges: validEdges };
  }
   
  /* ============== build cluster frames ============== */
  function buildClusterNodes(layoutedNodes: MyNode[], clusters: typeof graphJson.clusters): MyNode[] {
    const clusterIdSet = new Set(clusters.map((c) => c.id));
    const nodeById = new Map(layoutedNodes.map((n) => [n.id, n]));
   
    function getLeafDescendants(clusterId: string): string[] {
      const c = clusters.find((x) => x.id === clusterId);
      if (!c) return [];
      const out: string[] = [];
      for (const id of c.nodes) {
        if (clusterIdSet.has(id)) out.push(...getLeafDescendants(id));
        else out.push(id);
      }
      return out;
    }
   
    const PALETTE = ["#1E90FF", "#32CD32", "#BA55D3", "#FF69B4", "#87CEEB", "#FFD700", "#F59E0B", "#06B6D4", "#8B5CF6"];
    const colorOf = (id: string) =>
      PALETTE[Math.abs(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % PALETTE.length];
   
    const OVERRIDES: Record<string, string> = {
      networking: "#10B981",
      vpc: "#3B82F6",
      public_subnet: "#22C55E",
      private_subnet: "#6366F1",
      data_processing: "#F59E0B",
      ingestion: "#EF4444",
      processing_and_analysis: "#06B6D4",
      storage: "#8B5CF6",
      "security_&_iam": "#DC2626",
      "monitoring_&_logging": "#7C3AED",
      "ci/cd": "#E11D48",
      unconnected: "#9CA3AF",
    };
   
    const frames: MyNode[] = [];
   
    clusters.forEach((c) => {
      const leafIds = getLeafDescendants(c.id);
      const kids = leafIds.map((id) => nodeById.get(id)).filter(Boolean) as MyNode[];
      if (!kids.length) return;
   
      const GAP = 36;
      const minX = Math.min(...kids.map((n) => n.position!.x)) - GAP;
      const minY = Math.min(...kids.map((n) => n.position!.y)) - GAP;
      const maxX = Math.max(...kids.map((n) => n.position!.x + ((n as any).width ?? NODE_W))) + GAP;
      const maxY = Math.max(...kids.map((n) => n.position!.y + ((n as any).height ?? TOTAL_H))) + GAP;
   
      const hasParent = Array.isArray(c.parent) && c.parent.length > 0;
      const margin = hasParent ? 120 : 220;
   
      const accentColor = OVERRIDES[c.id] ?? colorOf(c.id);
      const tint = hexToRgba(accentColor, 0.13);
   
      const frameW = (maxX - minX) + margin * 2;
      const frameH = (maxY - minY) + margin * 2 + 18;
   
      frames.push({
        id: c.id,
        type: "cluster",
        position: { x: minX - margin, y: minY - margin - 18 },
        data: { label: c.label, accentColor, tint },
        width: frameW,
        height: frameH,
        draggable: false,
        selectable: false,
        // keep wrapper transparent; ClusterNode draws bg/border
        style: {
          width: frameW,
          height: frameH,
          pointerEvents: "none",
          background: "transparent",
          zIndex: -1,              // behind regular nodes
        },
      } as MyNode);
    });
   
    return frames;
  }
   
  /* ============== custom edge (gap under label) ============== */
  const GAP_SIDE_PADDING = 8;
  function measurePathLength(d: string): number {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    return path.getTotalLength();
  }
  const GapEdge: React.FC<EdgeProps> = (props) => {
    const {
      id, sourceX, sourceY, targetX, targetY,
      sourcePosition, targetPosition,
      markerEnd, style, label, labelStyle,
    } = props;
   
    const [edgePath, labelX, labelY] = useMemo(
      () =>
        getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }),
      [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]
    );
   
    const [totalLen, setTotalLen] = useState<number>(0);
    useLayoutEffect(() => {
      try { setTotalLen(measurePathLength(edgePath)); } catch { setTotalLen(0); }
    }, [edgePath]);
   
    const labelRef = useRef<HTMLDivElement>(null);
    const [labelW, setLabelW] = useState<number>(0);
    useLayoutEffect(() => {
      const w = labelRef.current?.offsetWidth ?? 0;
      if (w && Math.abs(w - labelW) > 0.5) setLabelW(w);
    }, [label, labelStyle, labelW]);
   
    const gap = Math.max(0, labelW ? labelW + GAP_SIDE_PADDING * 2 : 0);
    const draw = totalLen > gap ? (totalLen - gap) / 2 : 0;
    const dashArray = totalLen && gap ? `${draw} ${gap} ${draw}` : undefined;
   
    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          style={{ ...style, strokeDasharray: dashArray, strokeLinecap: "round" }}
        />
        {!!label && (
          <EdgeLabelRenderer>
            <div
              ref={labelRef}
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                pointerEvents: "all",
                background: "transparent",
                padding: 0,
                margin: 0,
                ...labelStyle,
              }}
            >
              {label}
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  };
  const edgeTypes = { gap: GapEdge };
   
  /* ============== node renderers ============== */
  const CustomNode: React.FC<{ data: NodeData }> = ({ data }) => {
    const dir: Dir = data?.direction || "LR";
    const sourcePos = dir === "LR" ? Position.Right : Position.Bottom;
    const targetPos = dir === "LR" ? Position.Left : Position.Top;
   
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: NODE_W,
            height: NODE_H,
            minWidth: NODE_W,
            minHeight: NODE_H,
            overflow: "hidden",
            borderRadius: 14,
            background: "transparent",
          }}
        >
          <Handle type="target" position={targetPos} id={targetPos === Position.Left ? "left" : "top"} style={{ opacity: 0, width: 0, height: 0 }} />
          <Handle type="source" position={sourcePos} id={sourcePos === Position.Right ? "right" : "bottom"} style={{ opacity: 0, width: 0, height: 0 }} />
          {data?.iconUrl && <img src={data.iconUrl as string} alt={data?.label || "Node"} style={{ width: ICON, height: ICON, objectFit: "contain" }} />}
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            marginTop: 8,
            textAlign: "center",
            lineHeight: 1.2,
            width: NODE_W,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            pointerEvents: "none",
            height: LABEL_H,
          }}
          title={data?.label as string}
        >
          {data?.label as string}
        </div>
      </div>
    );
  };
   
  const ClusterNode: React.FC<{ data: NodeData }> = ({ data }) => {
    const color = (data.accentColor as string) || "#D1D5DB";
    const tint = (data.tint as string) || hexToRgba(color, 0.13);
   
    const neutral = ["VPC", "Networking"].includes(String(data.label));
    const border = neutral ? "#BBBBBB" : color;
    const chipShadow = neutral ? "#BBBBBB22" : `${color}22`;
   
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          pointerEvents: "none",
          border: `4px solid ${border}`,
          borderRadius: 24,
          background: tint,                      // <-- the tint is drawn here
          boxShadow: `0 6px 32px 0 ${chipShadow}, 0 2px 12px 0 rgba(90,107,138,0.07)`,
        }}
      >
        {/* Label chip */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 24,
            background: "#fff",
            border: `2px solid ${border}`,
            borderRadius: 16,
            padding: "10px 28px",
            fontWeight: 900,
            fontSize: 18,
            color: "#111827",
            pointerEvents: "auto",
            boxShadow: `0 1px 8px 0 ${chipShadow}`,
          }}
        >
          {data?.label}
        </div>
      </div>
    );
  };
   
  const nodeTypes = { custom: CustomNode, cluster: ClusterNode };
   
  /* ============== component ============== */
  export default function SampleDiagram() {
    const [direction, setDirection] = useState<Dir>("LR");
    const [nodes, setNodes, onNodesChange] = useNodesState<MyNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<MyEdge>([]);
   
    useEffect(() => {
      const filteredEdges: MyEdge[] = (graphJson.edges || []).filter(
        (e) => e.source && e.target && e.source !== e.target
      ) as MyEdge[];
   
      const { nodes: laidNodes, edges: laidEdges } = layoutWithDagre(
        graphJson.nodes as unknown as MyNode[],
        filteredEdges,
        direction
      );
   
      function findParentClusterId(nodeId: string) {
        const containing = graphJson.clusters.filter((c) => c.nodes.includes(nodeId));
        if (!containing.length) return undefined;
        const deepest = containing.sort((a, b) => (a.parent?.length || 0) - (b.parent?.length || 0)).pop();
        return deepest?.id; // assign to that cluster; top-level frames remain standalone
      }
   
      const withParents: MyNode[] = laidNodes.map((n) => {
        const pid = findParentClusterId(n.id);
        return pid ? { ...n, parentId: pid, extent: "parent" as const } : { ...n, parentId: undefined };
      });
   
      // Frame nodes (absolute)
      const clusterFramesAbs: MyNode[] = buildClusterNodes(withParents, graphJson.clusters);
   
      // Adjust children to be relative to their frame
      const frameByIdAbs = new Map(clusterFramesAbs.map((f) => [f.id, f]));
      const childrenRel: MyNode[] = withParents.map((n) => {
        const pid = n.parentId as string | undefined;
        if (!pid) return n;
        const p = frameByIdAbs.get(pid);
        if (!p?.position) return n;
        return {
          ...n,
          position: { x: n.position!.x - p.position.x, y: n.position!.y - p.position.y },
        };
      });
   
      // Nest frames inside parent frames (relative)
      const parentOfCluster: Record<string, string | undefined> = Object.fromEntries(
        graphJson.clusters.map((c) => [
          c.id,
          c.parent && c.parent.length ? c.parent[c.parent.length - 1] : undefined,
        ])
      );
      const framesRel: MyNode[] = clusterFramesAbs.map((f) => {
        const pid = parentOfCluster[f.id];
        if (!pid) return f;
        const p = frameByIdAbs.get(pid);
        if (!p?.position) return f;
        return {
          ...f,
          parentId: pid,
          position: { x: f.position!.x - p.position.x, y: f.position!.y - p.position.y },
        };
      });
   
      // styled edges (gap under labels)
      const styledEdges: MyEdge[] = laidEdges.map((e) => ({
        ...e,
        type: "gap",
        sourceHandle: direction === "LR" ? "right" : "bottom",
        targetHandle: direction === "LR" ? "left" : "top",
        style: {
          stroke: EDGE_COLOR,
          opacity: 1,
          fill: "none",
          strokeWidth: 4,
          filter: "drop-shadow(0px 0px 1px rgba(0,0,0,0.2))",
        },
        labelStyle: {
          fontSize: 14,
          fontWeight: 600,
          color: "#111827",
          fill: "#111827",
        },
        labelBgStyle: { fill: "transparent", stroke: "transparent" },
        labelBgPadding: [0, 0] as any,
        labelBgBorderRadius: 0,
        markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR, width: 26, height: 26 },
      }));
   
      setNodes([...framesRel, ...childrenRel]); // frames first = behind
      setEdges(styledEdges);
    }, [direction, setNodes, setEdges]);
   
    const toggleLayout = useCallback(() => {
      setDirection((d) => (d === "TB" ? "LR" : "TB"));
    }, []);
   
    return (
      <div style={{ width: "100%", height: "100vh", position: "relative" }}>
        <button
          onClick={toggleLayout}
          style={{
            position: "absolute",
            zIndex: 10,
            right: 20,
            top: 20,
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid #D1D5DB",
            background: "#f7f7f7",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
          title="Toggle layout direction"
        >
          Layout: {direction === "LR" ? "Left → Right" : "Top ↓ Bottom"}
        </button>
   
        <TypedReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2, includeHiddenNodes: true }}
          panOnScroll
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          proOptions={{ hideAttribution: true }}
          minZoom={0.1}
          maxZoom={1.8}
          defaultEdgeOptions={{ interactionWidth: 24 }}
          snapToGrid
          snapGrid={[8, 8]}
        >
          <MiniMap
            nodeColor={(n) => (n.type === "cluster" ? "#CBD5E1" : "#94A3B8")}
            nodeStrokeColor="#475569"
            pannable
            zoomable
            style={{ height: 120 }}
          />
          <Controls position="bottom-right" />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </TypedReactFlow>
      </div>
    );
  }