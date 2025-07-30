#!/usr/bin/env python
"""
Populate public.tech_taxonomy with Simple-Icons and Iconify “logos” sets.
Runs idempotently via supabase.upsert(on_conflict="token").
"""

import os, re, time, requests, json
from typing import Dict, Iterable, List, Tuple
from supabase import create_client, Client
from tqdm import tqdm
import unicodedata
from pathlib import Path
# from config.settings import SUPABASE_URL, SUPABASE_SERVICE_KEY

# ────────────────────────────────────────────────────────────
# 0.  Environment / client
# ────────────────────────────────────────────────────────────
SUPABASE_URL  = os.getenv("SUPABASEURLST")
SUPABASE_KEY  = os.getenv("SUPABASEAPIKEYST")
print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"SUPABASE_KEY: {SUPABASE_KEY}")
if not (SUPABASE_URL and SUPABASE_KEY):
    raise SystemExit("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ────────────────────────────────────────────────────────────
# 1.  Heuristics  →  (kind, subkind) guess
# ────────────────────────────────────────────────────────────
# ============================================================
#  CLOUD RULES  (>90% coverage for AWS / Azure / GCP services)
#  Put these FIRST in _KIND_RULES (order matters!)
# ============================================================
_KIND_RULES: Tuple[Tuple[re.Pattern, Tuple[str, str]], ...] = (

    # ---------- AWS ----------
    (re.compile(r"^aws-(aurora|rds|neptune|timestream|redshift)\b", re.I),          ("Database",      "sql")),
    (re.compile(r"^aws-(dynamodb|keyspaces)\b", re.I),                               ("Database",      "nosql")),
    (re.compile(r"^aws-(documentdb)\b", re.I),                                       ("Database",      "mongodb")),
    (re.compile(r"^aws-(memorydb|elasticache)\b", re.I),                             ("Cache",         "redis")),
    (re.compile(r"^aws-(s3|glacier|efs|fsx)\b", re.I),                               ("BlobStore",     "object")),
    (re.compile(r"^aws-(opensearch|elasticsearch)\b", re.I),                         ("Search",        "elasticsearch")),
    (re.compile(r"^aws-(msk|kafka)\b", re.I),                                        ("Queue",         "kafka")),
    (re.compile(r"^aws-(sqs|mq|kinesis)\b", re.I),                                   ("Queue",         "generic")),
    (re.compile(r"^aws-(sns|eventbridge)\b", re.I),                                  ("Topic",         "generic")),
    (re.compile(r"^aws-(iot-core|greengrass)\b", re.I),                              ("Gateway",       "iot")),
    (re.compile(r"^aws-(lambda)\b", re.I),                                           ("Function",      "lambda")),
    (re.compile(r"^aws-(ecs|fargate|batch)\b", re.I),                                ("Service",       "container")),
    (re.compile(r"^aws-(eks)\b", re.I),                                              ("ContainerPlatform","kubernetes")),
    (re.compile(r"^aws-(app-runner|elastic-beanstalk|lightsail)\b", re.I),           ("Service",       "paas")),
    (re.compile(r"^aws-(cloudfront)\b", re.I),                                       ("CDN",           "generic")),
    (re.compile(r"^aws-(route-53|direct-connect|transit-gateway|vpc|vpn|elb|alb|nlb|global-accelerator)\b", re.I),
                                                                                     ("Network",       "generic")),
    (re.compile(r"^aws-(api-gateway|app-mesh|cloud-map|endpoints)\b", re.I),         ("Gateway",       "generic")),
    (re.compile(r"^aws-(shield|waf)\b", re.I),                                       ("WAF",           "generic")),
    (re.compile(r"^aws-(cognito|iam|organizations|sso)\b", re.I),                    ("Auth",          "generic")),
    (re.compile(r"^aws-(kms|secrets-manager|parameter-store|certificatemanager)\b", re.I),
                                                                                     ("SecretStore",   "generic")),
    (re.compile(r"^aws-(cloudwatch|xray|cloudtrail|config)\b", re.I),                ("Monitoring",    "generic")),
    (re.compile(r"^aws-(athena|glue|emr|data-pipeline|lake-formation|quicksight)\b", re.I),
                                                                                     ("ETL",           "data")),
    (re.compile(r"^aws-(sagemaker|bedrock|comprehend|rekognition|transcribe|textract|translate)\b", re.I),
                                                                                     ("MLModel",       "platform")),

    # ---------- AZURE ----------
    (re.compile(r"^azure-(sql|postgres|mysql|cosmos-db|synapse|databricks)\b", re.I), ("Database",      "generic")),
    (re.compile(r"^azure-(table-storage|blob-storage|data-lake|files|queue-storage)\b", re.I),
                                                                                      ("BlobStore",     "object")),
    (re.compile(r"^azure-(service-bus|event-hubs|event-grid|queue-storage)\b", re.I), ("Queue",         "generic")),
    (re.compile(r"^azure-(iot-hub|iot-central|device-provisioning)\b", re.I),         ("Gateway",       "iot")),
    (re.compile(r"^azure-(functions)\b", re.I),                                       ("Function",      "azure_functions")),
    (re.compile(r"^azure-(aks|container-apps|container-instances)\b", re.I),          ("ContainerPlatform","kubernetes")),
    (re.compile(r"^azure-(app-service|batch|spring-apps)\b", re.I),                   ("Service",       "paas")),
    (re.compile(r"^azure-(cdn|front-door|traffic-manager|application-gateway|load-balancer|vpn-gateway|expressroute|vnet)\b", re.I),
                                                                                      ("Network",       "generic")),
    (re.compile(r"^azure-(firewall|waf|ddos-protection)\b", re.I),                    ("WAF",           "generic")),
    (re.compile(r"^azure-(api-management)\b", re.I),                                   ("Gateway",       "generic")),
    (re.compile(r"^azure-(active-directory|entra|key-vault|defender|sentinel|policy)\b", re.I),
                                                                                      ("Auth",          "generic")),
    (re.compile(r"^azure-(key-vault)\b", re.I),                                       ("SecretStore",   "generic")),
    (re.compile(r"^azure-(monitor|log-analytics|application-insights)\b", re.I),      ("Monitoring",    "generic")),
    (re.compile(r"^azure-(data-factory|synapse|databricks|stream-analytics)\b", re.I),("ETL",           "data")),
    (re.compile(r"^azure-(ml|cognitive|openai)\b", re.I),                              ("MLModel",       "platform")),

    # ---------- GCP ----------
    (re.compile(r"^gcp-(cloud-sql|spanner|alloydb|memorystore)\b", re.I),             ("Database",      "sql")),
    (re.compile(r"^gcp-(datastore|firestore|bigtable)\b", re.I),                      ("Database",      "nosql")),
    (re.compile(r"^gcp-(bigquery|dataplex|data-fusion)\b", re.I),                     ("DataWarehouse", "generic")),
    (re.compile(r"^gcp-(storage|filestore|gcs)\b", re.I),                             ("BlobStore",     "object")),
    (re.compile(r"^gcp-(pubsub|eventarc)\b", re.I),                                   ("Queue",         "generic")),
    (re.compile(r"^gcp-(iot-core)\b", re.I),                                          ("Gateway",       "iot")),
    (re.compile(r"^gcp-(cloud-functions)\b", re.I),                                    ("Function",      "cloud_functions")),
    (re.compile(r"^gcp-(cloud-run|app-engine)\b", re.I),                              ("Service",       "serverless")),
    (re.compile(r"^gcp-(gke|anthos)\b", re.I),                                        ("ContainerPlatform","kubernetes")),
    (re.compile(r"^gcp-(batch|composer|dataproc)\b", re.I),                            ("ETL",           "data")),
    (re.compile(r"^gcp-(cloud-cdn|cloud-armor|load-balancing|vpc|vpn|interconnect|dns|cloud-endpoints)\b", re.I),
                                                                                      ("Network",       "generic")),
    (re.compile(r"^gcp-(cloud-armor)\b", re.I),                                       ("WAF",           "generic")),
    (re.compile(r"^gcp-(api-gateway|apigee)\b", re.I),                                ("Gateway",       "generic")),
    (re.compile(r"^gcp-(iam|kms|secret-manager|access-context-manager|cloud-dlp|security-command-center)\b", re.I),
                                                                                      ("Auth",          "generic")),
    (re.compile(r"^gcp-(secret-manager|kms)\b", re.I),                                ("SecretStore",   "generic")),
    (re.compile(r"^gcp-(cloud-logging|cloud-monitoring|trace|error-reporting|profiler|debugger|stackdriver)\b", re.I),
                                                                                      ("Monitoring",    "generic")),
    (re.compile(r"^gcp-(vertex-ai|automl|dialogflow)\b", re.I),                       ("MLModel",       "platform")),

    # ---------- Datastores ----------
    (re.compile(r"\b(postgres|aurora|pgvector)\b"),           ("Database",     "postgres")),
    (re.compile(r"\b(mysql|maria(db)?|aurora-mysql)\b"),      ("Database",     "mysql")),
    (re.compile(r"\b(sql[\s\-]?server|mssql)\b"),             ("Database",     "sqlserver")),
    (re.compile(r"\b(oracle)\b"),                             ("Database",     "oracle")),
    (re.compile(r"\b(dynamo(db)?|cosmos[-\s]?db|firestore)\b"),("Database",     "nosql")),
    (re.compile(r"\b(mongo(db)?)\b"),                          ("Database",     "mongodb")),
    (re.compile(r"\b(cassandra|scylla)\b"),                    ("Database",     "cassandra")),
    (re.compile(r"\b(elastic(search)?|opensearch)\b"),         ("Search",       "elasticsearch")),
    (re.compile(r"\b(clickhouse|redshift|bigquery|snowflake)\b"),("DataWarehouse","generic")),
    (re.compile(r"\b(neo4j|tigergraph|dgraph)\b"),             ("Database",     "graph")),
    (re.compile(r"\b(rocksdb|leveldb|badger)\b"),              ("Database",     "kvstore")),

    # ---------- Vector / ML stores ----------
    (re.compile(r"\b(pinecone|weaviate|qdrant|milvus|chroma)\b"),("VectorStore","generic")),
    (re.compile(r"\b(lancedb|vespa|pgvector|redisearch)\b"),    ("VectorStore","generic")),
    (re.compile(r"\b(feature\s*store|feast)\b"),                ("FeatureStore","generic")),

    # ---------- Caches / KV ----------
    (re.compile(r"\b(redis|keydb|memcached)\b"),                ("Cache",       "redis")),
    (re.compile(r"\b(hazelcast|ehcache|ignite)\b"),             ("Cache",       "generic")),

    # ---------- Messaging / Streaming ----------
    (re.compile(r"\b(kafka|pulsar|redpanda|nats)\b"),           ("Queue",       "kafka")),
    (re.compile(r"\b(rabbitmq|activemq|ibm[-\s]?mq)\b"),        ("Queue",       "rabbitmq")),
    (re.compile(r"\b(sqs|pub/sub|pubsub|eventbridge|event[-\s]?hub|kinesis)\b"),
                                                              ("Queue",       "generic")),
    (re.compile(r"\b(sns|topic)\b"),                            ("Topic",       "generic")),
    (re.compile(r"\b(event\s*bus|message\s*bus)\b"),            ("EventBus",    "generic")),
    (re.compile(r"\b(streaming|flink|beam|spark\s*streaming)\b"),("ETL",        "stream")),

    # ---------- Compute / Containers ----------
    (re.compile(r"\b(lambda|cloud\s*function|azure\s*function|faas)\b"),
                                                              ("Function",     "generic")),
    (re.compile(r"\b(fargate|app\s*service|cloud\s*run|app\s*engine)\b"),
                                                              ("Service",      "serverless")),
    (re.compile(r"\b(kubernetes|eks|gke|aks|openshift|nomad)\b"),("ContainerPlatform","kubernetes")),
    (re.compile(r"\b(docker|containerd|podman)\b"),             ("ContainerPlatform","docker")),
    (re.compile(r"\b(batch|glue|databricks|synapse)\b"),        ("ETL",         "batch")),
    (re.compile(r"\b(airflow|dagster|prefect|astronomer)\b"),   ("ETL",         "workflow")),
    (re.compile(r"\b(step\s*functions|orchestrat(or|ion)|argo)\b"),
                                                              ("Orchestrator", "generic")),

    # ---------- Security / Identity ----------
    (re.compile(r"\b(auth0|okta|keycloak|cognito|iam|sso|idp)\b"),
                                                              ("Auth",         "generic")),
    (re.compile(r"\b(secrets?(_|-)?(manager|store)|vault|parameter\s*store)\b"),
                                                              ("SecretStore",  "generic")),
    (re.compile(r"\b(cert(ificate)?_?authority|acm)\b"),        ("CertAuthority","generic")),
    (re.compile(r"\b(waf|firewall|shield|ddos|defender)\b"),    ("WAF",         "generic")),
    (re.compile(r"\b(api\s*gateway|traefik|kong|nginx|apigee|tyk)\b"),
                                                              ("Gateway",      "generic")),
    (re.compile(r"\b(load[_\s-]?balancer|alb|nlb|ingress)\b"),  ("LB",          "generic")),

    # ---------- CDN / Edge ----------
    (re.compile(r"\b(cloudfront|fastly|cloudflare|akamai|cdn)\b"),("CDN",      "generic")),
    (re.compile(r"\b(edge\s+cache|edge\s+compute)\b"),            ("Service",  "edge")),

    # ---------- Observability ----------
    (re.compile(r"\b(prometheus|grafana|datadog|newrelic|appdynamics|splunk|dynatrace)\b"),
                                                              ("Monitoring",   "generic")),
    (re.compile(r"\b(opentelemetry|jaeger|zipkin|tempo|tracing)\b"),
                                                              ("Tracing",      "generic")),
    (re.compile(r"\b(log(ging)?|loki|cloudwatch|elk|logstash|filebeat)\b"),
                                                              ("Logging",      "generic")),
    (re.compile(r"\b(alert(manager)?|pagerduty|opsgenie|victorops)\b"),
                                                              ("Alerting",     "generic")),
    (re.compile(r"\b(si(em)?|security\s*hub|audit\s*log)\b"),   ("Monitoring",  "security")),

    # ---------- Analytics / BI ----------
    (re.compile(r"\b(look(er)?|tableau|powerbi|mode\s*analytics|metabase)\b"),
                                                              ("Analytics",    "bi")),
    (re.compile(r"\b(db[t]?|transform|elt)\b"),                 ("ETL",         "transform")),
    (re.compile(r"\b(warehouse|lakehouse|data\s+lake)\b"),      ("DataWarehouse","generic")),

    # ---------- ML / AI ----------
    (re.compile(r"\b(vertex\s*ai|sagemaker|azure\s*ml|bedrock|comprehend)\b"),
                                                              ("MLModel",      "platform")),
    (re.compile(r"\b(openai|anthropic|claude|cohere|mistral|llama)\b"),
                                                              ("MLModel",      "llm_api")),
    (re.compile(r"\b(huggingface|replicate|modal)\b"),          ("MLModel",      "hosting")),
    (re.compile(r"\b(inference|embedding|rerank(er)?)\b"),      ("MLModel",      "inference")),

    # ---------- Networking ----------
    (re.compile(r"\b(vpc|subnet|nat|vpn|peering|route\s*53|dns)\b"),
                                                              ("Network",      "generic")),
    (re.compile(r"\b(api|rest|graphql|grpc)\b"),                ("Gateway",      "generic")),

    # ---------- DevOps / CI-CD ----------
    (re.compile(r"\b(jenkins|github\s*actions|gitlab\s*(ci|cd)|circleci|argo\s*cd)\b"),
                                                              ("Orchestrator", "cicd")),
    (re.compile(r"\b(terraform|pulumi|crossplane|ansible|chef|salt(stack)?)\b"),
                                                              ("Orchestrator", "iac")),
    (re.compile(r"\b(pack(er)?|helm|kustomize)\b"),             ("Orchestrator", "packaging")),

    # ---------- Misc SaaS & External ----------
    (re.compile(r"\b(stripe|paypal|adyen|razorpay|braintree)\b"),("ExternalService","payment")),
    (re.compile(r"\b(sendgrid|postmark|mailgun|ses|smtp)\b"),   ("ExternalService","email")),
    (re.compile(r"\b(twilio|plivo|nexmo|vonage|sms)\b"),        ("ExternalService","sms")),
    (re.compile(r"\b(slack|teams|discord|mattermost)\b"),       ("ExternalService","chatops")),
    (re.compile(r"\b(shopify|salesforce|zendesk|intercom)\b"),  ("ExternalService","saas")),
    (re.compile(r"\b(algolia|typesense)\b"),                    ("Search",        "saas")),

    # ---------- Fallbacks ----------
    (re.compile(r"(redis|memcache|cache)"),                     ("Cache",        "generic")),
    (re.compile(r"(database|db)"),                              ("Database",     "generic")),
    (re.compile(r"(queue|mq|broker)"),                          ("Queue",        "generic")),
    (re.compile(r"(cdn)"),                                      ("CDN",          "generic")),
    (re.compile(r"(function|serverless)"),                      ("Function",     "generic")),
    (re.compile(r"(monitor|metric|observability)"),             ("Monitoring",   "generic")),
)



def guess_kind_subkind(token: str) -> Tuple[str, str | None]:

    t = token.lower()

    # 1) exact match
    for patt, (kind, sub) in _KIND_RULES:
        if patt.search(token):
            return kind, sub
    # 2) light-weight semantic fallbacks (still before provider catch-all)
    if "database" in t or t.endswith("-db"):
        return "Database", "generic"
    if "queue" in t or "mq" in t or "broker" in t:
        return "Queue", "generic"
    if "cache" in t:
        return "Cache", "generic"
    if "cdn" in t:
        return "CDN", "generic"
    if "function" in t or "serverless" in t or "lambda" in t:
        return "Function", "generic"
    if "monitor" in t or "metric" in t or "observab" in t:
        return "Monitoring", "generic"

    # 3) provider-specific catch-alls (so you can color/shape them differently)
    if t.startswith("aws-"):
        return "Service", "aws_generic"
    if t.startswith("azure-"):
        return "Service", "azure_generic"
    if t.startswith("gcp-"):
        return "Service", "gcp_generic"

    # 4) ultimate fallback
    return "Service", "generic"

SLUGIFY = re.compile(r"[^a-z0-9]+")

def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return SLUGIFY.sub("-", text.lower()).strip("-")

def first_cap(words: list[str]) -> str:
    return " ".join(w.capitalize() for w in words if w)


AWS_STOPWORDS   = {"arch", "amazon", "aws", "for", "of", "the", "controller", "sdk"}
AZURE_STOPWORDS = {"icon", "service", "svg"}        # plus numeric prefixes
GCP_STOPWORDS   = {"svg"}

# ────────────────────────────────────────────────────────────
# 1.  AWS
# ────────────────────────────────────────────────────────────
def iter_aws_icons(aws_dir: Path) -> Iterable[Dict]:
    provider = "aws"
    for file in aws_dir.glob("*.svg"):
        name = file.stem  # Arch_Amazon-API-Gateway_64
        # remove leading "Arch_" and trailing "_64"
        name = re.sub(r"^Arch_", "", name, flags=re.I)
        name = re.sub(r"_\d+$", "", name)

        # split on -, _ to words
        parts = re.split(r"[-_]", name)
        # drop stopwords
        words = [p for p in parts if p.lower() not in AWS_STOPWORDS]

        base   = slugify("-".join(words))             # api-gateway
        token  = f"aws-{base}"                        # ← prefix

        display = first_cap(words)
        kind, sub = guess_kind_subkind(base)

        yield {
            "token":        token,
            "display_name": display or "AWS Service",
            "kind":         kind,
            "subkind":      sub,
            "provider":     provider,
            "iconify_id":   f"custom:aws-{base}",
            "aliases":      [display, base],
            "source":       "aws-local",
        }

# ────────────────────────────────────────────────────────────
# 2.  Azure
# ────────────────────────────────────────────────────────────
def iter_azure_icons(azure_dir: Path) -> Iterable[Dict]:
    provider = "azure"
    for file in azure_dir.glob("*.svg"):
        stem = file.stem                        # 00021-icon-service-Solutions
        stem = re.sub(r"^\d+\-?", "", stem)
        stem = stem.replace("icon-service-", "").replace("icon-service", "")
        parts  = re.split(r"[-_]", stem)
        words  = [p for p in parts if p and p.lower() not in AZURE_STOPWORDS]
        base   = slugify("-".join(words))        # solutions
        token  = f"azure-{base}"
        display= first_cap(words)
        kind, sub = guess_kind_subkind(base)

        yield {
            "token":        token,
            "display_name": display or "Azure Service",
            "kind":         kind,
            "subkind":      sub,
            "provider":     provider,
            "iconify_id":   f"custom:azure-{base}",
            "aliases":      [display, base],
            "source":       "azure-local",
        }


# ────────────────────────────────────────────────────────────
# 3.  GCP
# ────────────────────────────────────────────────────────────
def iter_gcp_icons(gcp_dir: Path) -> Iterable[Dict]:
    provider = "gcp"
    for file in gcp_dir.glob("*.svg"):
        stem   = file.stem                       # bigquery
        parts  = re.split(r"[-_]", stem)
        words  = [p for p in parts if p and p.lower() not in GCP_STOPWORDS]
        base   = slugify("-".join(words))        # bigquery
        token  = f"gcp-{base}"
        display= first_cap(words)
        kind, sub = guess_kind_subkind(base)

        yield {
            "token":        token,
            "display_name": display or "GCP Service",
            "kind":         kind,
            "subkind":      sub,
            "provider":     provider,
            "iconify_id":   f"custom:gcp-{base}",
            "aliases":      [display, base],
            "source":       "gcp-local",
        }



# ────────────────────────────────────────────────────────────
# 4.  Supabase upsert in ≤500-row batches
# ────────────────────────────────────────────────────────────
def batched(iterable, size=500):
    buf: List[Dict] = []
    for item in iterable:
        buf.append(item)
        if len(buf) == size:
            yield buf
            buf = []
    if buf:
        yield buf

# ── helper ----------------------------------------------
def uniq_by_token(rows: Iterable[Dict]) -> List[Dict]:
    seen: Dict[str, Dict] = {}
    for r in rows:
        tok = r["token"]
        if tok in seen:                      # merge aliases if duplicate
            seen[tok]["aliases"] += r["aliases"]
        else:
            seen[tok] = r
    return list(seen.values())

# ── upsert ----------------------------------------------
def upsert_rows(rows: Iterable[Dict]):
    deduped = uniq_by_token(rows)            # ① compress whole iterable
    for chunk in batched(deduped, 500):      # ② then batch ≤500 rows
        supabase.table("tech_taxonomy") \
            .upsert(chunk, on_conflict="token") \
            .execute()
        time.sleep(0.1)

# ────────────────────────────────────────────────────────────
# 5.  Main
# ────────────────────────────────────────────────────────────

AWS_DIR   = Path("/Users/rithingullapalli/Desktop/SDR/aws-icons")
AZURE_DIR = Path("/Users/rithingullapalli/Desktop/SDR/azure-icons")
GCP_DIR   = Path("/Users/rithingullapalli/Desktop/SDR/gcp-icons")

if __name__ == "__main__":

    # sanity checks
    for p in (AWS_DIR, AZURE_DIR, GCP_DIR):
        if not p.exists():
            raise SystemExit(f"Path not found: {p}")
        
    print("⏳  Importing AWS icons")
    upsert_rows(iter_aws_icons(AWS_DIR))

    print("⏳  Importing Azure icons")
    upsert_rows(iter_azure_icons(AZURE_DIR))

    print("⏳  Importing GCP icons")
    upsert_rows(iter_gcp_icons(GCP_DIR))

    print("✅  tech_taxonomy seed complete")
