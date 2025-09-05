from typing import Any, Dict, List, Optional
from textwrap import dedent
from datetime import datetime

from models.diagram_models import DiagramRequest
from utils.logger import log_info

def generate_intent_classification_prompt(request: DiagramRequest) -> str:
    """
    Generate an intent classification prompt for the given user query.
    """
    log_info(f"Generating intent classification prompt for: {request.query}")
    prompt = f"""
    You are a senior software architect assistant. 
    Your task is to decide whether the USER is requesting to *create or generate an architecture diagram* 
    (for example: network diagram, system architecture, data-flow diagram, component diagram, etc.) 
    or whether the USER is asking something unrelated.

    Output *exactly* one of the following two labels (without quotes, backticks, or additional text):
      architecture_diagram  —  if the query is about designing, drawing, creating, generating, or updating an architecture / diagram.
      other                 —  for any other type of request (chit-chat, weather, generic questions, etc.).

    Examples:
    1. USER: 'Generate a cloud architecture diagram for a three-tier web app on AWS.'
       OUTPUT: architecture_diagram
    2. USER: 'What's the weather like today in Paris?'
       OUTPUT: other
    3. USER: 'Design a microservices architecture with Kubernetes and a PostgreSQL database.'
       OUTPUT: architecture_diagram
    4. USER: 'Tell me a joke about databases.'
       OUTPUT: other

    Now classify this query:
    USER: {request.query}
    OUTPUT:"""
    
    return prompt

def generate_diagram_code_prompt(request: DiagramRequest) -> str:
    """
    Generate a diagram code prompt for the given user query.
    """
    log_info(f"Generating diagram code prompt for: {request.query}")
    prompt = f"""
    You are an expert software architect and security specialist specializing in the 'diagrams' library (mingrammer/diagrams). Design COMPLETE, PRODUCTION-READY secure system architecture diagrams for AI-based SaaS products, ensuring scalability and best practices like network segmentation, IAM least privilege, encryption, load balancing, monitoring, and caching layers (e.g., integrating FastAPI APIs, Supabase DBs, Redis caches).

    IMPORTANT IMPORT RULES (follow exactly):
    - Import only node classes from modules documented at: https://diagrams.mingrammer.com/docs/nodes/ (including onprem, aws, azure, gcp, ibm, alibaba, oracle, k8s, saas, and others listed there).
    - Use full canonical node names (e.g., from diagrams.aws.analytics import ElasticsearchService) — no aliases, wildcards, or namespace imports (e.g., no 'import diagrams.aws').
    - If no exact node exists, map to the closest documented one and add a single-line comment above the import explaining the mapping.
    - No external/third-party or local imports beyond these.
    - **Also import `Edge` from `diagrams` and use it for EVERY connection.**

    Task: Generate valid Python code using 'diagrams' to visualize a COMPLETE, PRODUCTION-READY secure architecture from this query: {request.query}. Include ALL necessary components for the application type (e.g., frontend/UI, backend APIs, databases, caching, auth/security gateways, monitoring/logging, CI/CD, networking/VPC—tailored to SaaS needs like AI inference pipelines). Avoid single-node or incomplete designs; focus on end-to-end flows with security (e.g., private subnets, WAF).

    CRITICAL EDGE-LABEL REQUIREMENTS:
    - **Every edge MUST be labeled** using `Edge(label="...")` and connected like: `A >> Edge(label="HTTPS 443 / TLS1.3") >> B`.
    - Labels must be **derived from {request.query}** and the architecture context, describing protocol, port, data type, or action (e.g., "HTTPS 443", "gRPC mTLS", "JWT Auth", "Inference Request", "Pub/Sub", "Async Queue", "VPC Peering", "KMS Encrypt/Decrypt").
    - **No unlabeled edges allowed** (no bare `>>` or `-` without an `Edge(...)` in between). If multiple targets are connected, use a separate `Edge(label=...)` for each.
    - Prefer concrete terms over generic ones; include security qualifiers where relevant (e.g., "mTLS", "IAM Role", "KMS CMK", "at-rest AES-256", "WAF allowlist").

    Requirements:
    1. Parse {request.query} for app type, components, flows, and security needs.
    2. Map to documented nodes from allowed providers, ensuring production completeness (e.g., add auto-scaling groups, Redis for queues).
    3. Design secure connections with logical clustering for scalability, **always using labeled `Edge(...)` objects**.
    4. Structure: Imports first (including `from diagrams import Diagram, Cluster, Edge` as needed), then a single `Diagram()` block with `show=False` and `direction="TB"` (or appropriate).
    5. No execution code (e.g., no `Diagram.show()`).

    Step-by-Step:
    1. Identify full component set and production security requirements.
    2. Select/map nodes and providers for comprehensive coverage.
    3. Define data flows, groupings (use `Cluster`), and monitoring layers.
    4. Apply defense-in-depth (e.g., encryption in transit, least privilege).
    5. For each flow, specify an `Edge(label="...")` that clearly states protocol/port/data/security.

    Output: ONLY the Python code, starting with `from diagrams import Diagram` and allowed imports.

    Few-Shot Examples (edge labels shown for style; real outputs must be more complete):

    Query: "Simple web service"
    ```python
    from diagrams import Diagram, Edge
    from diagrams.aws.compute import EC2
    from diagrams.aws.database import RDS

    with Diagram("Web Service", show=False, direction="TB"):
        EC2("app") >> Edge(label="ORM over TLS 3306") >> RDS("db")
    ```
    
    Query: "Clustered system with load balancer"
    ```python
    from diagrams import Cluster, Diagram, Edge
    from diagrams.aws.compute import EC2
    from diagrams.aws.network import ELB

    with Diagram("Cluster", show=False, direction="TB"):
        with Cluster("App Cluster"):
            nodes = [EC2("node1"), EC2("node2")]
        ELB("lb") >> Edge(label="HTTP/1.1 80 -> 8080") >> nodes[0]
        ELB("lb") >> Edge(label="HTTP/1.1 80 -> 8080") >> nodes[1]
    ```
    
    Query: "Secure microservices architecture"
    ```python
    from diagrams import Diagram, Edge
    from diagrams.aws.compute import EC2
    from diagrams.aws.database import RDS
    from diagrams.aws.network import ELB

    with Diagram("Grouped Workers", show=False, direction="TB"):
        workers = [
            EC2("worker1"),
            EC2("worker2"),
            EC2("worker3"),
            EC2("worker4"),
            EC2("worker5"),
        ]
        lb = ELB("waf+alb")
        db = RDS("events")
        
        for worker in workers:
            lb >> Edge(label="HTTPS 443 / mTLS") >> worker
            worker >> Edge(label="JDBC TLS 3306") >> db
    ```

    Now, generate the secure architecture diagram code for: {request.query}

    Output only the Python code in the exact format shown above, with proper imports, diagram structure, and labeled edges for EVERY connection.
    """
    return prompt