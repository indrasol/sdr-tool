#!/usr/bin/env python
"""
Populate public.tech_taxonomy with Simple-Icons and Iconify “logos” sets.
Runs idempotently via supabase.upsert(on_conflict="token").
"""

import os, re, time, requests, unicodedata
from typing import Dict, Iterable, List, Tuple
from supabase import create_client, Client
from tqdm import tqdm
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
_KIND_RULES: Tuple[Tuple[re.Pattern, Tuple[str, str]], ...] = (
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
    for patt, (kind, sub) in _KIND_RULES:
        if patt.search(token):
            return kind, sub
    return "Service", "generic"           # fallback

SLUGIFY = re.compile(r"[^a-z0-9]+")


# ────────────────────────────────────────────────────────────
# 2.  Simple-Icons JSON
# ────────────────────────────────────────────────────────────
def iter_simple_icons() -> Iterable[Dict]:
    url = ("https://raw.githubusercontent.com/"
           "simple-icons/simple-icons/develop/data/simple-icons.json")
    icons = requests.get(url, timeout=30).json()
    for icon in icons:
        token = icon.get("slug")
        if not token:                                      # fall-back if slug missing
            token = SLUGIFY.sub("-", icon["title"].lower()).strip("-")
        kind, sub = guess_kind_subkind(token)
        yield dict(
            token        = token,
            display_name = icon["title"],
            kind         = kind,
            subkind      = sub,
            provider     = None,
            iconify_id   = f"simple-icons:{token}",
            aliases      = [],
            source       = "simple-icons",
        )

# ────────────────────────────────────────────────────────────
# 3.  Iconify “logos” collections
# ────────────────────────────────────────────────────────────
# ICONIFY_COLLECTIONS = ["logos", "logos-aws", "logos-azure", "logos-gcp"]

# def fetch_collection(col: str) -> Dict:
#     url = f"https://raw.githubusercontent.com/iconify/icon-sets/master/json/{col}.json"
#     return requests.get(url, timeout=30).json()

# def iter_iconify() -> Iterable[Dict]:
#     for col in ICONIFY_COLLECTIONS:
#         print(f"→ downloading {col}.json")
#         icons_json = fetch_collection(col)
#         for tok in icons_json["icons"].keys():
#             token = tok.lower()
#             kind, sub = guess_kind_subkind(token)
#             provider = (
#                 "aws" if col.endswith("aws") else
#                 "azure" if col.endswith("azure") else
#                 "gcp" if col.endswith("gcp") else None
#             )
#             yield dict(
#                 token        = token,
#                 display_name = token.replace("-", " ").title(),
#                 kind         = kind,
#                 subkind      = sub,
#                 provider     = provider,
#                 iconify_id   = f"{col}:{tok}",
#                 aliases      = [],
#                 source       = col,
#             )

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
if __name__ == "__main__":
    print("⏳  Importing Simple-Icons")
    upsert_rows(iter_simple_icons())

    print("⏳  Importing Iconify logo collections")
    upsert_rows(iter_iconify())

    print("✅  tech_taxonomy seed complete")
