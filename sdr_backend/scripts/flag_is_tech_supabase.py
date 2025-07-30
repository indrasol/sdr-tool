#!/usr/bin/env python3
"""
Batch-labels tech_taxonomy rows with is_tech flag using deterministic rules.
Filters: is_tech IS NULL AND source = 'mdi' AND provider NOT IN ('aws','azure','gcp')
Safe to re-run; stops when no more matching rows.
"""
import os
import signal
import sys
import logging
import time
from typing import List
from supabase import create_client, Client  # supabase-py v2.x
from tqdm import tqdm
from dotenv import load_dotenv

# load_dotenv()

# ---------- 0. CONFIG ---------- #
BATCH = 1000

# Comprehensive set of tech keywords (lowercased) compiled from IT glossaries
# These are used to check for substring matches in normalized row fields
TECH_KEYWORDS = set([

    # Tech Companies & Startups (2025 leaders)
    # "nvidia", "microsoft", "apple", "broadcom", "tsmc", "oracle", "adobe", "salesforce", "cisco", "qualcomm", "amd", "ibm", "intel",
    # "applied materials", "intuit", "servicenow", "palo alto networks", "uber", "netflix", "tesla", "alibaba", "tencent", "meta",
    # "facebook", "alphabet", "perplexity ai", "flutterflow", "cohere", "beehiiv", "photoroom", "supabase", "otter", "anduril",
    # "openai", "databricks", "kensho technologies", "cash app", "alertmedia", "bigcommerce", "hibob", "achieve", "zoro", "augury",
    # "accenture", "taglogy", "icreativez", "waymo", "spacex", "foxconn", "cshark", "dataart", "spacemaker", "eyeware tech", "rejolut",
    # "homelight", "pantheon platform", "guideline", "rippling", "yipitdata", "snapdocs", "karat", "trialspark",

    # # Programming Languages
    # "python", "java", "javascript", "c++", "c#", "typescript", "go", "golang", "rust", "php", "r", "kotlin", "swift", "sql", "c",
    # "scala", "dart", "ruby", "perl", "matlab", "fortran", "pascal", "vba", "basic",

    # # Frameworks & Libraries
    # "express.js", "ruby on rails", "asp.net core", "django", "laravel", "spring boot", "node.js", "angularjs", "react", ".net core",
    # "spring", "tensorflow", "angular", "vue.js", "flask", "fastapi", "langchain", "trpc", "autogen", "asyncio", "htmx", "zustand",
    # "tailwind css", "pytorch", "scikit-learn", "keras", "theano", "caffe", "apache mahout", "apache spark", "paddlepaddle", "mxnet",
    # "jax", "onnx", "huggingface transformers", "ext js", "sencha",

    # # Databases & Data Storage
    # "mysql", "mariadb", "microsoft sql server", "oracle dbms", "postgres", "mongodb", "redis", "ibm db2", "sqlite", "cassandra",
    # "elasticsearch", "snowflake", "influxdb", "rocksdb", "couchdb", "drizzle", "gemstone",

    # # Operating Systems
    # "windows", "macos", "android", "linux", "ubuntu", "chrome os", "fedora", "ios", "unix", "solaris", "boss",

    # # Web Browsers
    # "chrome", "safari", "edge", "firefox", "opera", "arc", "brave", "vivaldi", "tor", "samsung internet", "internet explorer",

    # # Cloud Platforms (excluding AWS, Azure, GCP)
    # "alibaba cloud", "ibm cloud", "oracle cloud infrastructure", "salesforce service cloud", "tencent cloud", "digitalocean", "hetzner",
    # "vmware cloud", "ovhcloud",

    # # DevOps Tools
    # "git", "gitlab", "github", "bitbucket", "maven", "jenkins", "chef", "puppet", "ansible", "docker", "kubernetes", "terraform",
    # "prometheus", "nagios", "datadog", "elk stack", "elasticsearch", "logstash", "kibana", "snyk", "xray", "jira", "raygun", "trello",
    # "gradle", "katalon testops", "azure devops", "workona", "browserstack",

    # # AI/ML Frameworks
    # "tensorflow", "pytorch", "scikit-learn", "keras", "jax", "mxnet", "paddlepaddle", "theano", "caffe", "apache mahout", "apache spark",
    # "deepspeed", "onnx runtime", "intel ai reference",

    # # ───────────────────────── Infrastructure & Cloud ─────────────────────────
    # # Generic
    # "server", "vm", "virtual machine", "container", "docker", "kubernetes",
    # "autoscaling", "load balancer", "firewall", "gateway", "reverse proxy",
    # "vpn", "vpc", "subnet", "nat", "edge", "cdn", "dns", "ipv4", "ipv6",

    # # AWS core (top 45 services) :contentReference[oaicite:0]{index=0}
    # "ec2", "s3", "lambda", "dynamodb", "rds", "aurora", "route 53",
    # "cloudfront", "api gateway", "app sync", "elastic beanstalk", "sns",
    # "sqs", "eventbridge", "step functions", "kinesis", "emr", "glue",
    # "athena", "redshift", "eks", "ecs", "fargate", "bedrock", "sage maker",
    # "quicksight", "cloudwatch", "cloudtrail", "guardduty", "inspector",
    # "waf", "shield", "kms", "iam", "secrets manager", "ssm parameter store",
    # "cognito", "pinpoint", "amplify", "global accelerator",

    # # Azure services (A‑Z directory) :contentReference[oaicite:1]{index=1}
    # "azure vm", "aks", "app service", "functions", "service bus", "event hub",
    # "storage account", "blob storage", "queue storage", "cosmos db",
    # "sql database", "managed postgres", "front door", "cdn endpoint",
    # "api management", "logic apps", "data factory", "synapse analytics",
    # "monitor", "application insights", "key vault", "ad b2c", "devops",

    # # GCP services (terms/services list) :contentReference[oaicite:2]{index=2}
    # "compute engine", "cloud run", "app engine", "cloud functions",
    # "cloud storage", "bigquery", "spanner", "cloud sql", "firestore",
    # "bigtable", "pub/sub", "dataflow", "dataproc", "vertex ai", "memorystore",
    # "artifact registry", "cloud endpoints", "workflows", "cloud logging",

    # # Other clouds
    # "digitalocean", "hetzner", "ibm cloud", "oracle cloud infrastructure",
    # "alibaba cloud", "tencent cloud", "ovhcloud", "vmware cloud",

    # ───────────────────────── Data & Databases ─────────────────────────
    "database", "sql", "nosql", "data warehouse", "data lake", "etl",
    "mysql", "postgres", "postgresql", "mariadb", "mssql", "oracle dbms",
    "sqlite", "mongodb", "cassandra", "couchdb", "dynamodb", "redis",
    "memcached", "rocksdb", "influxdb", "timescaledb", "snowflake",
    "redshift", "bigquery", "databricks", "athena", "hive", "spark sql",
    "drizzle", "bigtable", "spanner",

    # Vector DBs (2025 landscape) :contentReference[oaicite:3]{index=3}
    "pinecone", "weaviate", "milvus", "qdrant", "chromadb", "faiss",
    "vespa", "vald", "lancedb", "redis vector", "pgvector", "astra db",
    "tigris", "zilliz", "elastic vector", "opensearch vector", "vectordb",

    # Graph / Stream / Queue
    "neo4j", "dgraph", "gremlin", "tinkerpop", "janusgraph",
    "kafka", "redpanda", "rabbitmq", "activemq", "nats", "zeromq",
    "pulsar", "eventbridge", "pub/sub", "kinesis",

    # ───────────────────────── Programming Languages ─────────────────────────
    "python", "java", "javascript", "typescript", "go", "golang", "c",
    "c++", "c#", "rust", "php", "ruby", "scala", "swift", "kotlin", "dart",
    "r", "matlab", "fortran", "perl", "lua", "haskell", "clojure", "erlang",
    "elixir", "f#", "powershell", "bash", "zig", "wasm", "webassembly", "sql",

    # ───────────────────────── Frameworks & Libraries ─────────────────────────
    "react", "next.js", "angular", "vue", "svelte", "ember", "lit",
    "django", "flask", "fastapi", "express.js", "node.js", "nestjs",
    "spring boot", "spring", "asp.net core", "laravel", "ruby on rails",
    "phoenix", "gin", "htmx", "tailwind css", "bootstrap", "material ui",
    "langchain", "trpc", "grpc", "protobuf", "openapi", "swagger",
    "pytorch", "tensorflow", "keras", "jax", "onnx runtime", "mxnet",
    "spark", "flink", "beam", "hadoop", "airflow", "prefect", "dagster",
    "dvc", "mlflow", "ray", "deepspeed", "autogen", "openvino",

    # ───────────────────────── DevOps & CI/CD ─────────────────────────
    "git", "github", "gitlab", "bitbucket", "svn", "mercurial", "jenkins",
    "circleci", "travis ci", "argo cd", "spinnaker", "teamcity",
    "azure devops", "github actions", "docker compose", "helm", "terraform",
    "pulumi", "ansible", "chef", "puppet", "saltstack", "packer", "vagrant",
    "prometheus", "grafana", "loki", "thanos", "jaeger", "zipkin",
    "opentelemetry", "datadog", "new relic", "sentry", "dynatrace", "splunk",

    # ───────────────────────── Security & Identity ─────────────────────────
    "oauth", "openid", "saml", "jwt", "iam", "keycloak", "okta", "auth0",
    "vault", "secret manager", "kms", "certificate manager", "tls", "ssl",
    "waf", "shield", "guardduty", "inspector", "sonarqube", "snyk",
    "owasp", "zap", "burp", "nist", "cwe", "cve", "mitre", "siem",

    # ───────────────────────── AI / ML / LLM Ecosystem ─────────────────────────
    "vertex ai", "bedrock", "openai", "chatgpt", "claude", "llama",
    "huggingface", "stable diffusion", "diffusers", "vectorstore",
    "embedding", "inference endpoint", "retrieval augmented generation",
    "rag", "faiss", "ann", "milvus", "pinecone", "chromadb",

    # ───────────────────────── Messaging / Realtime / Collaboration ───────────
    "websocket", "socket.io", "mqtt", "stomp", "signalr", "kafka",
    "rabbitmq", "pulsar", "nats", "redis streams", "pubnub", "ably",
    "supabase realtime", "liveblocks",

    # ───────────────────────── Operating Systems & Browsers ───────────────────
    "linux", "ubuntu", "debian", "red hat", "centos", "fedora", "alpine",
    "windows", "windows server", "macos", "ios", "android", "chrome os",
    "unix", "solaris", "freebsd", "openbsd", "netbsd",
    "chrome", "edge", "safari", "firefox", "opera", "brave", "vivaldi",

    # ───────────────────────── Edge / Serverless / PaaS ───────────────────────
    "serverless", "faas", "cloudflare workers", "pages", "vercel",
    "netlify", "render", "fly.io", "deno deploy", "heroku", "supabase",
    "appwrite", "back4app",

    # ───────────────────────── Misc. Tech Terms (catch‑alls) ──────────────────
    "api", "sdk", "cli", "ide", "ci", "cd", "devops", "ops", "observability",
    "microservice", "monolith", "event driven", "event sourcing", "cqrs",
    "webhook", "cron", "scheduler", "job", "worker", "daemon", "orchestration",
    "virtualization", "hypervisor", "container registry", "artifact",
    "image", "snapshot", "replica", "cluster", "node", "pod", "pipeline",
    "blue green deploy", "canary deploy", "backup", "restore", "snapshot",
    "encryption", "compression", "serialization", "deserialization",
    "tokenization", "hashing", "sharding", "partition", "cache", "ttl",
    "latency", "throughput", "bandwidth", "qos", "sla", "slo", "sla",

    # ───────────────────────── Hardware (often needed in arch diagrams) ───────
    "cpu", "gpu", "ram", "ssd", "hdd", "nvme", "nic", "ethernet", "switch",
    "router", "firewall appliance", "load balancer appliance", "ups",
    "edge device", "iot device", "sensor", "switch", "router", "firewall",

    # tech_arch_keywords - core vocabulary for software‑architecture detection

    # ───────────── Infrastructure / Compute / Networking ─────────────
    "server", "application server", "web server", "app service", "compute engine",
    "vm", "virtual machine", "container", "docker", "kubernetes", "eks", "aks",
    "ecs", "fargate", "cloud run", "app engine", "lambda", "cloud function",
    "faas", "serverless", "autoscaling", "scaling group", "load balancer",
    "elb", "alb", "nlb", "front door", "api gateway", "cloud endpoints",
    "ingress", "ingress controller", "edge", "cdn", "cloudfront", "cache",
    "cloudflare workers", "reverse proxy", "gateway", "service mesh", "istio",
    "linkerd", "cilium", "vpc", "subnet", "nat", "eip", "route 53", "dns",
    "ipv4", "ipv6", "vpn", "direct connect", "expressroute", "peering",
    "bastion host", "jump box", "firewall", "security group", "network acl",

    # ───────────── Data & Storage ─────────────
    "database", "relational database", "sql database", "nosql database",
    "data warehouse", "data lake", "data mart", "object storage",
    "block storage", "file storage", "efs", "fsx", "ebs", "s3", "blob storage",
    "cloud storage", "bigquery", "redshift", "snowflake", "athena", "hive",
    "lake formation", "glue catalog", "glue", "data catalog", "etl", "elt",
    "batch job", "spark", "dataproc", "dataflow", "streaming job",
    "kinesis data streams", "kinesis firehose", "data pipeline",

    # Vector / Embedding stores
    "vector store", "vector db", "pinecone", "milvus", "weaviate",
    "chromadb", "qdrant", "faiss", "pgvector", "astra db", "opensearch vector",

    # ───────────── Messaging & Integration ─────────────
    "message queue", "messaging", "event bus", "service bus", "event hub",
    "pubsub", "pub/sub", "sns", "sqs", "rabbitmq", "kafka", "pulsar",
    "nats", "redpanda", "activemq", "stream", "topic", "eventbridge",
    "websocket", "mqtt", "grpc", "rest", "graphql", "openapi", "protobuf",
    "http", "https", "socket", "webhook", "notification service",

    # ───────────── Security & Identity ─────────────
    "iam", "identity and access management", "policy", "role", "permission",
    "authentication", "authorization", "oauth", "openid", "saml", "jwt",
    "cognito", "keycloak", "ad b2c", "auth0", "okta", "secret manager",
    "secrets manager", "parameter store", "vault", "kms", "hsm",
    "certificate manager", "pkcs", "waf", "shield", "guardduty", "inspector",
    "zero trust", "mfa", "sso", "ddos protection",

    # ───────────── Observability & Operations ─────────────
    "monitor", "monitoring", "metrics", "logging", "log aggregation",
    "log analytics", "cloudwatch", "stackdriver", "cloud logging", "loki",
    "prometheus", "grafana", "x-ray", "apm", "tracing", "opentelemetry",
    "jaeger", "zipkin", "alert", "alerting", "pagerduty", "status page",
    "health check", "dashboard", "insights", "application insights",

    # ───────────── DevOps / CI‑CD runtime pieces (architecture‑level) ─────────
    "artifact registry", "container registry", "ecr", "acr", "gcr",
    "ci pipeline", "cd pipeline", "code pipeline", "build server",
    "build agent", "deployment pipeline", "blue green deploy", "canary deploy",
    "infrastructure as code", "terraform", "cloudformation", "pulumi",
    "helm", "chart", "kustomize", "argo cd", "flux",

    # ───────────── Architectural Patterns / Logical Components ─────────
    "microservice", "monolith", "service", "bounded context",
    "api layer", "integration layer", "persistence layer", "domain layer",
    "presentation layer", "frontend", "backend", "orchestrator", "scheduler",
    "worker", "job", "daemon", "batch processor", "stream processor",
    "controller", "adapter", "facade", "gateway pattern", "anti corruption",
    "event sourcing", "cqrs", "saga", "command bus", "query bus",
    "aggregate", "repository pattern", "unit of work", "message broker",
    "event store", "cache layer", "redis cache", "edge cache",
    "object pool", "circuit breaker", "bulkhead", "rate limiter",
    "idempotent consumer",

    # ───────────── Serverless / PaaS (architecture level) ─────────────
    "function", "trigger", "queue trigger", "http trigger", "cron trigger",
    "step functions", "state machine", "workflow", "orchestration workflow",
    "logic app", "cloud workflow", "pipes", "event driven",

    # ───────────── AI‑Native Architectural Blocks ─────────────
    "rag", "retrieval augmented generation", "embedding service",
    "embedding model", "inference endpoint", "model serving", "feature store",
    "feature vector", "vector search", "llm router", "prompt router",
    "model gateway", "model api", "model registry", "model monitor",

    # ───────────── Misc core tech nouns that appear on diagrams ─────────────
    "service discovery", "config service", "configuration service",
    "secret store", "session store", "object storage", "queue", "topic",
    "scheduler", "cron", "timer", "blob", "bucket", "snapshot", "replica",
    "cluster", "node", "pod", "namespace", "autoscaler", "operator",
    "sidecar", "init container", "daemon set", "stateful set",
    "edge device", "iot gateway",

])

# ---------- 1. CLIENT ---------- #
SUPABASE_URL = os.getenv("SUPABASEURLST")
SUPABASE_KEY = os.getenv("SUPABASEAPIKEYST")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------- 2. DB HELPERS (REST) ---------- #
def fetch_batch(limit=BATCH):
    """Return list[dict] of rows to label."""
    response = (
        supabase.table("tech_taxonomy")
        .select("token, display_name, iconify_id, aliases")
        .eq("is_tech", "TRUE")  # is_tech IS NULL
        .eq("source", "mdi")  # source = 'mdi'
        .eq("kind", "Service") # kind = 'Service'
        # .eq("subkind", "generic") # subkind = 'generic'
        # .not_.in_("provider", ("aws", "azure", "gcp"))  # provider NOT IN (...)
        .limit(limit)
        .execute()
    )
    return response.data  # list of dicts

CHUNK = 1000
def chunked(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i:i+size]

def bulk_update(labels):
    true_tokens  = [l["token"] for l in labels if l["is_tech"]]
    false_tokens = [l["token"] for l in labels if not l["is_tech"]]

    for batch in chunked(true_tokens, CHUNK):
        resp = supabase.table("tech_taxonomy") \
                .update({"is_tech": True}) \
                .in_("token", batch) \
                .execute()
        if resp.count == 0:
            logging.error("PATCH touched 0 rows – check filter column!")
            sys.exit(1)

    for batch in chunked(false_tokens, CHUNK):
        supabase.table("tech_taxonomy") \
                .update({"is_tech": False}) \
                .in_("token", batch) \
                .execute()
        if resp.count == 0:
            logging.error("PATCH touched 0 rows – check filter column!")
            sys.exit(1)
        
# def bulk_update(labels: List[dict]):
#     if not labels:
#         return
#     ids_true = [l["token"] for l in labels if l["is_tech"]]
#     ids_false = [l["token"] for l in labels if not l["is_tech"]]

#     if ids_true:
#         supabase.table("tech_taxonomy").update({"is_tech": True}).in_("token", ids_true).execute()
#     if ids_false:
#         supabase.table("tech_taxonomy").update({"is_tech": False}).in_("token", ids_false).execute()

# ---------- 3. RULE-BASED LABELING ---------- #
def is_tech_row(row: dict) -> bool:
    """Deterministically check if row represents a tech concept based on keywords."""
    # Normalize texts: replace hyphens/underscores with spaces, lowercase
    normalized_texts = [
        row["token"].lower().replace("-", " ").replace("_", " "),
        row["display_name"].lower().replace("-", " ").replace("_", " "),
        row["iconify_id"].lower().replace("-", " ").replace("_", " "),
    ] + [alias.lower().replace("-", " ").replace("_", " ") for alias in row.get("aliases", [])]

    # Check for substring match with any tech keyword
    for text in normalized_texts:
        for kw in TECH_KEYWORDS:
            if kw in text:
                return True
    return False

def rule_based_labels(batch: List[dict]) -> List[dict]:
    """Process batch and return labels list."""
    labels = []
    for row in batch:
        is_tech = is_tech_row(row)
        labels.append({"token": row["token"], "is_tech": is_tech})
    return labels

# ---------- 4. MAIN ---------- #
def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    logging.info("Starting taxonomy is_tech rule-based labeller (Supabase REST)")

    def _sigint(sig, frame):
        logging.warning("Interrupted – exiting gracefully.")
        sys.exit(0)
    signal.signal(signal.SIGINT, _sigint)

    total_start = time.time()
    pbar = tqdm(total=0, unit="rows", unit_scale=True)

    while True:
        batch = fetch_batch()
        if not batch:  # done
            break

        labels = rule_based_labels(batch)
        bulk_update(labels)
        pbar.update(len(labels))

    pbar.close()
    logging.info("Finished – elapsed %.1fs", time.time() - total_start)

if __name__ == "__main__":
    main()