from __future__ import annotations

"""core/intent_classification/intent_classifier_v2.py

Light-weight intent classification service for Design-Service v2.
Derives from the proven v1 classifier but trimmed down to match the
new 6-intent taxonomy and to keep Phase-1 scope reasonable.

Later phases can re-introduce advanced metrics and LLM fallback. For
now we stick to pattern + embedding similarity which already covers
>90 % of traffic.
"""

from typing import Dict, Any, List, Tuple, Optional
import os
import re
import json
import time

import numpy as np
import faiss
from enum import Enum
from datetime import datetime
from pathlib import Path
from core.intent_classification.text_utils import normalise

from sentence_transformers import SentenceTransformer

from utils.logger import log_info, log_error
from config.settings import ML_MODELS_DIR, TRANSFORMER_MODEL_TOKEN
from huggingface_hub import login

# Local models / enums
from models.response_models_v2 import IntentV2

# Optional LLM fallback
try:
    from core.llm.llm_gateway_v2 import LLMGatewayV2
except Exception:
    LLMGatewayV2 = None  # type: ignore


# ---------------------------------------------------------------------------
#  Embedding model setup helpers (copied from v1 with minor tweaks)
# ---------------------------------------------------------------------------

_DEFAULT_MODEL = "all-MiniLM-L6-v2"
_FALLBACK_MODELS = ["distilbert-base-nli-stsb-mean-tokens"]
_MAX_RETRIES = 3


def _download_transformer(model_name: str, cache_dir: str) -> SentenceTransformer:
    for attempt in range(_MAX_RETRIES):
        try:
            log_info(f"Downloading {model_name} (attempt {attempt + 1})")
            m = SentenceTransformer(model_name, cache_folder=cache_dir)
            log_info(f"Downloaded {model_name}")
            return m
        except Exception as e:
            wait = 2 ** attempt
            log_info(f"Failed: {e}. Retrying in {wait}s …")
            time.sleep(wait)
    raise RuntimeError(f"Unable to download embedding model {model_name}")


# ---------------------------------------------------------------------------
#  Cloud Provider Enum - NEW
# ---------------------------------------------------------------------------

class CloudProvider(str, Enum):
    """Enum for cloud providers detected in user queries."""
    AWS = "aws"
    AZURE = "azure"
    GCP = "gcp"
    MULTI = "multi"
    NONE = "none"


# ---------------------------------------------------------------------------
#  Classifier implementation
# ---------------------------------------------------------------------------

class IntentClassifierV2:
    """Intent classifier returning the six v2 intents."""

    # -------------------------------
    #  Patterns per intent
    # -------------------------------
    _DSL_CREATE_PATTERNS = [
        r"\b(add|create|design|generate|draft|plan|build|produce|spin\s*up)\b.*"
        r"(diagram|architecture|microservices?|service|component|node|database)",
        r"\b(start|begin)\b.*\b(diagram|architecture)\b",
        r"\bnew\s+(diagram|architecture|design)",
    ]

    _DSL_UPDATE_PATTERNS = [
        r"\b(update|modify|change|remove|delete|connect)\b.*(node|edge|component|connection)",
        r"rename\s+node",
        r"rearrange\s+diagram",
    ]

    _VIEW_TOGGLE_PATTERNS = [
        r"\b(show|switch|toggle)\b.*\b(dfd|data flow|architecture|layers?)\b",
        r"view\s+(dfd|architecture)",
    ]

    _EXPERT_QA_PATTERNS = [
        r"\b(what|how|why|explain|best practices|recommend)\b",
        r"security\s+(implications|risks|controls)",
    ]

    _CLARIFY_PATTERNS = [
        r"\b(clarify|not sure|confused)\b",
        r"\b(what next|help me)\b",
    ]

    _OUT_OF_SCOPE_PATTERNS = [
        r"\b(weather|joke|movie|sports|hello|hi)\b",
    ]

    
    # Regexes are case-insensitive via lowercase input; used word boundaries to avoid false positives (e.g., "s3" but not "pass3").
    # Included full names and acronyms for robustness, handling optional spaces (e.g., "amazon s3" or "aws s3").
    _AWS_PATTERNS = [
        r"\baws\b",
        r"\bamazon\s+web\s+services\b",
        r"\bamazon\s+cloud\b",
        r"\bon\s+aws\b",        # Match phrases like "on AWS"
        r"\bwith\s+aws\b",      # Match phrases like "with AWS"
        r"\busing\s+aws\b",     # Match phrases like "using AWS"
        r"\bin\s+aws\b",        # Match phrases like "in AWS"
        r"\bfor\s+aws\b",       # Match phrases like "for AWS" 
        r"\bto\s+aws\b",        # Match phrases like "to AWS"
        r"\s+aws\b",            # Match any word followed by AWS (more permissive)
        r"\bs3\b",
        r"\bamazon\s+s3\b",     # Full name variant
        r"\blambda\b",
        r"\bdynamodb\b",
        r"\bec2\b",
        r"\bamazon\s+ec2\b",
        r"\brds\b",
        r"\bamazon\s+rds\b",
        r"\beks\b",
        r"\belastic\s+kubernetes\s+service\b",
        r"\biam\b",             # Identity and Access Management
        r"\bcloudwatch\b",
        r"\bsqs\b",             # Simple Queue Service
        r"\bsns\b",             # Simple Notification Service
        r"\bvpc\b",             # Virtual Private Cloud
        r"\bcloudformation\b",
        r"\broute\s+53\b",
        r"\belastic\s+beanstalk\b",
        r"\bathena\b",
        r"\bglue\b",
        r"\bkinesis\b",
        r"\bredshift\b"
    ]

    
    # Focused on acronyms and full names with variations (e.g., "azure ad" or "microsoft azure active directory").
    # Kept concise to maintain performance in regex matching loops.
    _AZURE_PATTERNS = [
        r"\bazure\b",
        r"\bmicrosoft\s+azure\b",
        r"\bmicrosoft\s+cloud\b",
        r"\bapp\s+service\b",
        r"\bazure\s+app\s+service\b",
        r"\bazure\s+functions\b",
        r"\bcosmos\s+db\b",
        r"\bazure\s+cosmos\s+db\b",
        r"\bblob\s+storage\b",
        r"\bazure\s+blob\s+storage\b",
        r"\bactive\s+directory\b",
        r"\bazure\s+ad\b",
        r"\bazure\s+active\s+directory\b",
        r"\bvirtual\s+machines\b",
        r"\bazure\s+vms?\b",
        r"\bazure\s+sql\b",
        r"\bazure\s+sql\s+database\b",
        r"\baks\b",
        r"\bazure\s+kubernetes\s+service\b",
        r"\bazure\s+monitor\b",
        r"\bazure\s+devops\b",
        r"\bvirtual\s+network\b",
        r"\bazure\s+vnet\b"
    ]

    
    # Handled acronyms and full names (e.g., "gke" or "google kubernetes engine").
    # Prioritized high-usage ones from GCP's product catalog for relevance in SaaS intents.
    _GCP_PATTERNS = [
        r"\bgcp\b",
        r"\bgoogle\s+cloud\b",
        r"\bgoogle\s+cloud\s+platform\b",
        r"\bcloud\s+run\b",
        r"\bgoogle\s+cloud\s+run\b",
        r"\bcloud\s+functions\b",
        r"\bgoogle\s+cloud\s+functions\b",
        r"\bbigquery\b",
        r"\bgoogle\s+bigquery\b",
        r"\bgke\b",
        r"\bgoogle\s+kubernetes\s+engine\b",
        r"\bspanner\b",
        r"\bcloud\s+spanner\b",
        r"\bfirestore\b",
        r"\bcloud\s+firestore\b",
        r"\bcompute\s+engine\b",
        r"\bgoogle\s+compute\s+engine\b",
        r"\bapp\s+engine\b",
        r"\bgoogle\s+app\s+engine\b",
        r"\bcloud\s+storage\b",
        r"\bgoogle\s+cloud\s+storage\b",
        r"\bpub\s*/\s*sub\b",  # Handles "pub/sub" or "pub-sub"
        r"\bcloud\s+pub\s*/\s*sub\b",
        r"\bdataflow\b",
        r"\bcloud\s+dataflow\b",
        r"\bvertex\s+ai\b"
    ]

    
    # Differentiated from hybrid (private + public) but kept original inclusions; added variations for robustness (e.g., "multi cloud" without hyphen).
    # Useful for detecting intents like "deploy multi-cloud" in your SaaS.
    _MULTI_CLOUD_PATTERNS = [
        r"\bmulti[\s\-]cloud\b",
        r"\bmulticloud\b",  # No hyphen variant
        r"\bhybrid[\s\-]cloud\b",
        r"\bcross[\s\-]cloud\b",
        r"\bmultiple\s+clouds\b",
        r"\bmultiple\s+cloud\s+providers\b",
        r"\bfederated\s+cloud\b",
        r"\bfederated\s+cloud\s+computing\b",
        r"\bdistributed\s+cloud\b",
        r"\bdistributed\s+cloud\s+computing\b",
        r"\bdecentralized\s+cloud\b",
        r"\bcloud\s+federation\b",
        r"\bintercloud\b",
        r"\binter[\s\-]cloud\b",
        r"\bpolycloud\b",  # Emerging term for multi-cloud
        r"\busing\s+multiple\s+clouds\b"
    ]

    _PATTERN_TABLE: Dict[IntentV2, List[str]] = {
        IntentV2.DSL_CREATE: _DSL_CREATE_PATTERNS,
        IntentV2.DSL_UPDATE: _DSL_UPDATE_PATTERNS,
        IntentV2.VIEW_TOGGLE: _VIEW_TOGGLE_PATTERNS,
        IntentV2.EXPERT_QA: _EXPERT_QA_PATTERNS,
        IntentV2.CLARIFY: _CLARIFY_PATTERNS,
        IntentV2.OUT_OF_SCOPE: _OUT_OF_SCOPE_PATTERNS,
    }

    _PROVIDER_PATTERN_TABLE: Dict[CloudProvider, List[str]] = {
        CloudProvider.AWS: _AWS_PATTERNS,
        CloudProvider.AZURE: _AZURE_PATTERNS,
        CloudProvider.GCP: _GCP_PATTERNS,
        CloudProvider.MULTI: _MULTI_CLOUD_PATTERNS,
    }

    _DEFAULT_EXAMPLES: Dict[IntentV2, List[str]] = {
        IntentV2.DSL_CREATE: [
            "Create a new PostgreSQL database",
            "Generate the initial architecture diagram",
            "Set up a new MySQL instance in the cloud",
            "Initialize a Redis cache cluster",
            "Build a new VPC network",
            "Provision an S3 bucket for storage",
            "Create a Kubernetes cluster",
            "Generate a data flow diagram from scratch",
            "Set up an API gateway endpoint",
            "Initialize a serverless function",
            "Provision a virtual machine instance",
            "Create a new security group",
        ],
        IntentV2.DSL_UPDATE: [
            "Connect the API gateway to the auth service",
            "Remove the old firewall node",
            "Rename web_server_1 to web_frontend",
            "Add a web server to the diagram",
            "Link the database to the backend service",
            "Delete the unused load balancer",
            "Modify the VPC subnet configuration",
            "Update the security group rules",
            "Attach an EBS volume to the EC2 instance",
            "Scale up the Kubernetes pods",
            "Reconfigure the API endpoint permissions",
            "Merge two network diagrams",
            "Adjust the data flow arrows",
        ],
        IntentV2.VIEW_TOGGLE: [
            "Switch to DFD view",
            "Show me the data-flow diagram",
            "Toggle architecture view",
            "Display the component diagram",
            "Switch to sequence view",
            "Show the deployment diagram",
            "Toggle to UML class view",
            "View the network topology",
            "Switch to ER diagram mode",
            "Display the infrastructure overview",
            "Toggle between logical and physical views",
        ],
        IntentV2.EXPERT_QA: [
            "What is zero trust?",
            "Explain TLS mutual authentication",
            "Best practices for API security?",
            "How does IAM work in AWS?",
            "What are the pillars of the Well-Architected Framework?",
            "Explain data encryption at rest vs. in transit",
            "Best practices for VPC security?",
            "What is a DDoS attack and how to mitigate it?",
            "How to implement multi-factor authentication?",
            "Explain compliance standards like GDPR in cloud?",
            "Best practices for container security?",
            "What is shared responsibility model in cloud?",
            "How to secure serverless functions?",
        ],
        IntentV2.CLARIFY: [
            "I'm not sure what to do",
            "Can you clarify?",
            "What should I do next?",
            "Help me understand this step",
            "Explain how to proceed",
            "What's the best way to start?",
            "I need more details on this",
            "Guide me through the process",
            "What does this mean?",
            "How do I fix this error?",
        ],
        IntentV2.OUT_OF_SCOPE: [
            "Tell me a joke",
            "Who won the game yesterday?",
            "What's the weather like?",
            "Recommend a movie",
            "What's for dinner?",
            "Tell me about history",
            "Play some music",
            "What's the stock market today?",
            "Give me a recipe",
            "How's your day?",
            "Predict the future",
        ],
    }

    # Expanded cloud examples: Incorporated service-specific phrases from official docs and architectures (e.g., AWS VPC/EC2 from AWS refs, Azure VMs/AKS from Azure patterns, GCP GKE/BigQuery from GCP examples, multi-cloud hybrids from multi-cloud searches). Aimed for 10-15 per provider to improve classifier robustness with varied intents like create, design, add, connect.
    _CLOUD_EXAMPLES: Dict[CloudProvider, List[str]] = {
        CloudProvider.AWS: [
            "Create an AWS architecture diagram",
            "Design a AWS microservices architecture",
            "Add an S3 bucket to the diagram",
            "Connect Lambda to DynamoDB",
            "Draw an EC2 instance with EBS storage",
            "Set up a VPC with subnets and security groups",
            "Deploy an Elastic Load Balancer for high availability",
            "Configure IAM roles for secure access",
            "Integrate CloudWatch for monitoring",
            "Add Route 53 for DNS management",
            "Design a serverless architecture with API Gateway",
            "Connect RDS database to EC2",
            "Set up CloudFormation templates",
            "Draw a multi-tier web application",
            "Add Athena for data querying",
            "Configure Kinesis for real-time streaming",
        ],
        CloudProvider.AZURE: [
            "Create an Azure architecture diagram",
            "Design a Azure microservices architecture",
            "Add an Azure App Service to the diagram",
            "Connect Azure Functions to Cosmos DB",
            "Draw an Azure Virtual Machine with Blob storage",
            "Set up a Virtual Network with subnets",
            "Deploy Azure Kubernetes Service cluster",
            "Configure Azure Active Directory for authentication",
            "Integrate Azure Monitor for logging",
            "Add Azure SQL Database instance",
            "Design a serverless workflow with Logic Apps",
            "Connect Azure VM to App Service",
            "Set up Azure DevOps pipelines",
            "Draw a data flow with Azure Data Factory",
            "Add Azure Blob Storage for files",
            "Configure Azure Front Door for global routing",
        ],
        CloudProvider.GCP: [
            "Create a GCP architecture diagram",
            "Design a GCP microservices architecture",
            "Add a Cloud Run service to the diagram",
            "Connect Cloud Functions to BigQuery",
            "Draw a GKE cluster with Cloud Storage",
            "Set up a VPC network with firewall rules",
            "Deploy Google Kubernetes Engine pods",
            "Configure Identity and Access Management policies",
            "Integrate Cloud Monitoring for alerts",
            "Add Cloud SQL database",
            "Design a serverless app with App Engine",
            "Connect Compute Engine VM to Cloud Run",
            "Set up Cloud Build for CI/CD",
            "Draw a data pipeline with Dataflow",
            "Add Pub/Sub for messaging",
            "Configure Vertex AI for ML models",
        ],
        CloudProvider.MULTI: [
            "Create a multi-cloud architecture with AWS and Azure",
            "Design a hybrid cloud solution",
            "Draw a cross-cloud architecture connecting AWS S3 to Azure Functions",
            "Show a diagram with services from multiple cloud providers",
            "Set up hybrid with GCP and on-premises",
            "Connect AWS Lambda to GCP BigQuery",
            "Design a multi-cloud microservices setup",
            "Add Azure VM linked to AWS EC2",
            "Integrate multi-cloud monitoring with Prometheus",
            "Draw a federated identity across clouds",
            "Configure cross-cloud data replication",
            "Build a resilient hybrid with AWS and GCP",
            "Connect Azure Cosmos DB to GCP Cloud Storage",
            "Design a polycloud architecture for redundancy",
            "Show multi-cloud networking with VPNs",
        ],
    }

    def __init__(self, model_name: str = _DEFAULT_MODEL, cache_dir: Optional[str] = None):
        self.cache_dir = cache_dir or ML_MODELS_DIR
        Path(self.cache_dir).mkdir(parents=True, exist_ok=True)

        # Authenticate to HF if token provided
        if TRANSFORMER_MODEL_TOKEN:
            login(token=TRANSFORMER_MODEL_TOKEN)

        # Load embedding model with fallback
        self.embedding_model = None
        for candidate in [model_name] + _FALLBACK_MODELS:
            try:
                self.embedding_model = _download_transformer(candidate, self.cache_dir)
                break
            except Exception as e:
                log_info(f"Embedding model {candidate} failed: {e}")
        if self.embedding_model is None:
            raise RuntimeError("No embedding model could be loaded")

        # Build initial example index
        self.examples = self._DEFAULT_EXAMPLES.copy()
        
        # Add cloud provider examples to the index
        self._provider_lookup: Dict[str, CloudProvider] = {}
        self._add_provider_examples()
        
        self._build_faiss_index()

        # Lazy LLM gateway to avoid startup penalty when not needed
        self._llm: LLMGatewayV2 | None = LLMGatewayV2() if LLMGatewayV2 else None
        
        # Provider prior probability from history
        self._provider_priors: Dict[str, float] = {
            CloudProvider.AWS.value: 0.0,
            CloudProvider.AZURE.value: 0.0,
            CloudProvider.GCP.value: 0.0,
            CloudProvider.MULTI.value: 0.0,
            CloudProvider.NONE.value: 1.0,  # Initially bias toward no provider
        }

    def _add_provider_examples(self):
        """Add cloud provider examples to the intent examples."""
        for provider, examples in self._CLOUD_EXAMPLES.items():
            # For each provider example, add entries to help vector classification
            for example in examples:
                # Add to each intent that involves diagram manipulation
                for intent in [IntentV2.DSL_CREATE, IntentV2.DSL_UPDATE]:
                    if intent not in self.examples:
                        self.examples[intent] = []
                    # Store example with provider mapping
                    self.examples[intent].append(example)
                    self._provider_lookup[example] = provider

    # ------------------------------------------------------------------
    #  Public API
    # ------------------------------------------------------------------

    async def classify(
        self,
        query: str,
        conversation_history: List[Dict[str, Any]] = None,
        pattern_threshold: float = 0.6,
        vector_threshold: float = 0.7,
    ) -> Tuple[IntentV2, float, CloudProvider, str]:
        """Return (intent, confidence, provider, source) for a user query."""
        query_lower = normalise(query)
        
        # Update provider priors from history if available
        if conversation_history:
            self._update_provider_priors(conversation_history)

        # Pre-processing: Check for explicit provider mentions with high confidence
        explicit_provider = None
        if re.search(r"\bon\s+aws\b|\baws\s+|using\s+aws|\baws\b", query_lower, re.IGNORECASE):
            explicit_provider = CloudProvider.AWS
            log_info(f"Explicit AWS mention detected in query: '{query}'")
        elif re.search(r"\bon\s+azure\b|\bazure\s+|using\s+azure|\bazure\b", query_lower, re.IGNORECASE):
            explicit_provider = CloudProvider.AZURE
            log_info(f"Explicit Azure mention detected in query: '{query}'")
        elif re.search(r"\bon\s+gcp\b|\bgcp\s+|using\s+gcp|\bgcp\b|\bgoogle\s+cloud\b", query_lower, re.IGNORECASE):
            explicit_provider = CloudProvider.GCP
            log_info(f"Explicit GCP mention detected in query: '{query}'")

        # Run the detailed provider detection
        provider, provider_confidence = self._detect_provider(query_lower)
        
        # Override with explicit provider if detected in pre-processing
        if explicit_provider and provider == CloudProvider.NONE:
            log_info(f"Overriding NONE provider with explicit {explicit_provider.value} mention")
            provider = explicit_provider
            provider_confidence = 0.9  # High confidence for explicit mentions

        # 1️⃣ Pattern pass (fast-path)
        intent, confidence = self._pattern_classify(query_lower)
        if confidence >= pattern_threshold:
            return intent, confidence, provider, "pattern"

        # 2️⃣ Vector similarity
        intent_vec, conf_vec = self._vector_classify(query_lower, k=3)
        if conf_vec >= vector_threshold:
            return intent_vec, conf_vec, provider, "vector"

        # 3️⃣ LLM fallback (best-effort)
        if self._llm is not None:
            try:
                intent_llm, conf_llm = await self._llm_classify_llm(query)
                if intent_llm != IntentV2.CLARIFY:
                    return intent_llm, conf_llm, provider, "llm"
            except Exception as e:
                log_info(f"LLM fallback classify failed: {e}")

        # 4️⃣ Default fallback – clarify
        return IntentV2.CLARIFY, 0.4, provider, "fallback"

    # ------------------------------------------------------------------
    #  Internal helpers
    # ------------------------------------------------------------------

    def _pattern_classify(self, text: str) -> Tuple[IntentV2, float]:
        """Regex-based heuristic classification."""
        best_intent = IntentV2.CLARIFY
        best_score = 0.0
        for intent, patterns in self._PATTERN_TABLE.items():
            matches = any(re.search(p, text, re.IGNORECASE) for p in patterns)
            if matches:
                # Normalize by number of patterns to get rough confidence
                score = 1.0
                if score > best_score:
                    best_intent, best_score = intent, score
        return best_intent, best_score * 0.8  # Add 20% penalty for non-canonical forms

    def _detect_provider(self, text: str) -> Tuple[CloudProvider, float]:
        """Detect cloud provider from text using patterns."""
        provider_scores = {provider: 0.0 for provider in CloudProvider}
        
        # We now rely on text already being normalized by the normalise function
        # The normalise function handles common misspellings and domain-specific terms
        
        log_info(f"Provider detection for normalized text: '{text}'")
        
        # Check for pattern matches in normalized text
        for provider, patterns in self._PROVIDER_PATTERN_TABLE.items():
            provider_matches = []
            for p in patterns:
                if re.search(p, text, re.IGNORECASE):
                    provider_matches.append(p)
            
            matches = len(provider_matches)
            if matches:
                score = min(1.0, matches / max(1, len(patterns)))
                provider_scores[provider] = max(provider_scores[provider], score)
                log_info(f"Provider '{provider.value}' matched {matches} patterns: {provider_matches[:5]}")
        
        
        # Apply priors to smooth scores
        raw_scores = provider_scores.copy()
        for provider in provider_scores:
            prior = self._provider_priors.get(provider.value, 0.0)
            provider_scores[provider] = 0.7 * provider_scores[provider] + 0.3 * prior
        
        if raw_scores != provider_scores:
            log_info(f"Provider scores after applying priors: {provider_scores}")
        
        # Get best provider with score
        best_provider = CloudProvider.NONE
        best_score = 0.0
        
        for provider, score in provider_scores.items():
            if score > best_score:
                best_provider, best_score = provider, score
        
        # Lower the threshold for detection - if we see any mention of AWS/Azure/GCP,
        # it's likely the user wants that provider even with typos elsewhere
        if best_score > 0.1 and best_provider != CloudProvider.NONE:
            original_score = best_score
            best_score = max(best_score, 0.6)  # Boost confidence if any provider detected
            log_info(f"Boosting provider confidence for {best_provider.value} from {original_score} to {best_score}")
        
        # If multiple providers detected, check for multi-cloud patterns
        if sum(1 for score in provider_scores.values() if score > 0.4) > 1:
            # Check specific multi patterns
            multi_matches = sum(1 for p in self._MULTI_CLOUD_PATTERNS if re.search(p, text, re.IGNORECASE))
            if multi_matches or provider_scores[CloudProvider.MULTI] > 0.4:
                best_provider = CloudProvider.MULTI
                best_score = max(best_score, 0.7)  # Boost confidence for multi-cloud detection
                log_info(f"Multiple providers detected - switching to MULTI cloud with score {best_score}")
        
        log_info(f"Final provider detection: {best_provider.value} with confidence {best_score}")
        return best_provider, best_score

    def _update_provider_priors(self, conversation_history: List[Dict[str, Any]]):
        """Update provider priors based on conversation history."""
        # Simple approach: check for provider mentions in recent messages
        providers_mentioned = {provider: 0 for provider in CloudProvider}
        total_messages = len(conversation_history)
        
        if total_messages == 0:
            return
        
        # Examine last 5 messages at most
        for entry in conversation_history[-5:]:
            content = entry.get("content", "").lower()
            
            for provider, patterns in self._PROVIDER_PATTERN_TABLE.items():
                if any(re.search(p, content, re.IGNORECASE) for p in patterns):
                    providers_mentioned[provider] += 1
        
        # Calculate priors
        total_mentions = sum(providers_mentioned.values()) or 1
        decay = 0.8  # Decay factor for existing priors
        
        # Update priors with exponential decay
        for provider in CloudProvider:
            if provider == CloudProvider.NONE:
                continue
                
            mention_weight = providers_mentioned.get(provider, 0) / total_mentions
            self._provider_priors[provider.value] = (
                decay * self._provider_priors.get(provider.value, 0.0) + 
                (1 - decay) * mention_weight
            )
            
        # Ensure NONE is inverse of the sum of others, with minimum floor
        others_sum = sum(self._provider_priors[p.value] for p in CloudProvider if p != CloudProvider.NONE)
        self._provider_priors[CloudProvider.NONE.value] = max(0.1, 1.0 - others_sum)
        
        log_info(f"Updated provider priors: {self._provider_priors}")

    def _build_faiss_index(self):
        """Create a FAISS index from example embeddings."""
        corpus = []
        self._intent_lookup: List[IntentV2] = []
        for intent, examples in self.examples.items():
            corpus.extend(examples)
            self._intent_lookup.extend([intent] * len(examples))

        if not corpus:
            self.index = None
            self.embeddings = None
            return

        self.embeddings = self.embedding_model.encode(corpus, normalize_embeddings=True)
        dim = self.embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(self.embeddings)

    def _vector_classify(self, text: str, k: int = 3) -> Tuple[IntentV2, float]:
        if not self.index or self.index.ntotal == 0:
            return IntentV2.CLARIFY, 0.0

        query_emb = self.embedding_model.encode([text], normalize_embeddings=True)
        sims, idx = self.index.search(query_emb, min(k, self.index.ntotal))

        intent_scores: Dict[IntentV2, float] = {}
        for sim, i in zip(sims[0], idx[0]):
            if i < len(self._intent_lookup):
                intent = self._intent_lookup[i]
                intent_scores[intent] = intent_scores.get(intent, 0.0) + float(sim)

        if not intent_scores:
            return IntentV2.CLARIFY, 0.0

        best_intent, best_score = max(intent_scores.items(), key=lambda kv: kv[1])
        total = sum(intent_scores.values()) or 1.0
        confidence = best_score / total
        return best_intent, confidence

    # ------------------------------------------------------------------
    #  LLM fallback helper
    # ------------------------------------------------------------------

    async def _llm_classify_llm(self, query: str) -> Tuple[IntentV2, float]:
        """Ask a small model to choose the best intent label."""
        prompt = (
            "You are a routing assistant. Map the given USER_QUERY to one of the "
            "intent names from the following list exactly: DSL_CREATE, DSL_UPDATE, "
            "VIEW_TOGGLE, EXPERT_QA, CLARIFY, OUT_OF_SCOPE.\n" 
            "Return only a JSON object like {\"intent\": \"...\"}.\n\n" 
            f"USER_QUERY: {query}"
        )

        resp = await self._llm.generate_expert_answer(prompt)  # reuse low-temp settings
        content = (resp.get("content") or "{}").strip()
        import json

        try:
            data = json.loads(content)
            intent_raw = str(data.get("intent", "")).strip().upper()
            intent = IntentV2(intent_raw) if intent_raw in IntentV2.__members__ else IntentV2.CLARIFY
            confidence = 0.8 if intent != IntentV2.CLARIFY else 0.5
            return intent, confidence
        except Exception:
            return IntentV2.CLARIFY, 0.5 