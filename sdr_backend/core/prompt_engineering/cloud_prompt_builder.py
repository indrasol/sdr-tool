"""Cloud-Aware Prompt Builder

Extends the base PromptBuilderV2 with cloud-specific prompting capabilities.
This module detects when cloud architectures are requested and enhances
prompts with provider-specific best practices and examples.
"""

from __future__ import annotations

"""core/prompt_engineering/cloud_prompt_builder.py

Cloud-aware extension of the PromptBuilderV2 base class that
injects cloud-specific style guides and examples based on the 
detected cloud provider.
"""

from typing import Dict, Any, List, Optional
from core.ir.enrich import taxonomy_client

from utils.logger import log_info
from models.response_models_v2 import IntentV2
from core.prompt_engineering.prompt_builder_v2 import PromptBuilderV2
from core.intent_classification.intent_classifier_v2 import CloudProvider


# AWS-specific style pack enhancements
AWS_STYLE_PACK = """
### AWS Architecture Style Guide ###

REQUIRED AWS BUILDING BLOCKS
• Account boundary & AWS Identity and Access Management (IAM) roles/policies
• AWS Virtual Private Cloud (VPC) with public/private subnets, Internet Gateway, NAT Gateway
• Security controls: AWS Web Application Firewall (WAF), AWS Shield, AWS Security Groups, AWS GuardDuty, AWS Key Management Service (KMS)
• Observability: AWS CloudWatch, AWS X-Ray, AWS CloudTrail
• Integration: AWS API Gateway, AWS EventBridge, AWS Simple Queue Service (SQS), AWS Simple Notification Service (SNS)

ARCHITECTURE BEST PRACTICES
• Place internet-facing AWS Elastic Load Balancer (ELB)/Network Load Balancer (NLB) in public subnets; application tiers in private.
• Prefer managed databases (AWS Relational Database Service, AWS DynamoDB) & caching (AWS ElastiCache).
• Use serverless compute (AWS Lambda, AWS Fargate) for stateless workloads.
• Encrypt data at rest with AWS Key Management Service and enforce TLS for data in transit.

EXAMPLE FLOWS (labels obey naming rules):
  load_balancer: "AWS Elastic Load Balancer" -> fargate: "AWS Fargate" -> postgresql: "AWS RDS - PostgreSQL"
  api_gateway: "AWS API Gateway" -> lambda: "AWS Lambda" -> database: "AWS DynamoDB"
  web: "Web Client" -> load_balancer: "AWS Elastic Load Balancer" -> sqs: "AWS Simple Queue Service" -> lambda: "AWS Lambda" -> sns: "AWS Simple Notification Service"
"""

# Azure-specific style pack enhancements
AZURE_STYLE_PACK = """
### Azure Architecture Style Guide ###

REQUIRED AZURE COMPONENTS
• Resource Group boundary & Azure AD for identity
• Virtual Network with subnets, NSGs, Azure Firewall / WAF
• Compute: Azure App Service, Azure Functions, AKS, VM Scale Sets
• Data: Azure SQL, Azure Cosmos DB, Azure Storage, Azure Cache for Redis
• Integration: API Management, Event Grid, Service Bus
• Security: Key Vault, Azure Defender, Private Endpoints

ARCHITECTURE BEST PRACTICES
• Deploy public-facing endpoints via Azure Application Gateway or Front Door.
• Use Private Link / Service Endpoints for PaaS data services.
• Store secrets in Azure Key Vault; use Managed Identities.
• Enable monitoring with Azure Monitor and Log Analytics.

EXAMPLE FLOWS:
  app_gw: "Azure Application Gateway" -> aks: "Azure Kubernetes Service" -> cosmos: "Azure Cosmos DB"
  apim: "Azure API Management" -> functions: "Azure Functions" -> blob_store: "Azure Storage"
"""

# GCP-specific style pack enhancements
GCP_STYLE_PACK = """
### Google Cloud Architecture Style Guide ###

REQUIRED GCP COMPONENTS
• VPC networks, subnetworks, Cloud NAT / Cloud Router
• Security controls: Cloud Armor, IAM Roles, Secret Manager, SCC
• Compute: Google Kubernetes Engine, Cloud Run, Cloud Functions, Compute Engine
• Data: Cloud SQL, Cloud Spanner, Firestore, BigQuery, Cloud Storage
• Integration: API Gateway, Pub/Sub, Eventarc, Cloud Tasks
• Monitoring: Cloud Logging, Cloud Monitoring, Cloud Trace

ARCHITECTURE BEST PRACTICES
• Use regional managed services to maximise availability zones.
• Employ IAM least-privilege and VPC Service Controls.
• Enable Cloud NAT for outbound traffic from private subnets.

EXAMPLE FLOWS:
  lb: "Google Cloud Load Balancing" -> gke: "Google Kubernetes Engine" -> cloud_sql: "Google Cloud SQL"
  api_gw: "Google Cloud API Gateway" -> cloud_run: "Google Cloud Run" -> firestore: "Google Cloud Firestore"
"""

# Multi-cloud specific style pack enhancements
MULTI_CLOUD_STYLE_PACK = """
### Multi-Cloud Architecture Style Guide ###

MULTI-CLOUD PATTERNS:
  • Clearly label which services belong to which cloud
  • Use consistent prefixing: "AWS", "Azure", "GCP"
  • Include: Cloud boundaries, VPC/VNet peering, multi-cloud gateways
  • Consider: Cloud-agnostic control planes, service meshes
  
HYBRID ARCHITECTURE:
  • On-premises components labeled clearly
  • Show interconnects/VPN connections between clouds
  • Include common identity providers across clouds
  
MULTI-CLOUD EXAMPLES:
  • Data flow: aws_s3: "AWS S3" -> azure_function: "Azure Function" -> gcp_bigquery: "GCP BigQuery"
  • Kubernetes: aws_eks: "AWS EKS" -> azure_aks: "Azure AKS" -> multi_mesh: "Service Mesh"
  • Cross-cloud: aws_region: "AWS Region" { vpc: "AWS VPC" } -> azure_region: "Azure Region" { vnet: "Azure VNet" }
"""

# Generic cloud service naming rules applied to all providers
NAMING_RULES = """
### CLOUD SERVICE NAMING RULES ###
1. Prefix every service label with its provider ("AWS ", "Azure ", "Google Cloud ", etc.).
2. Use the COMPLETE official marketing product name – NEVER use acronyms alone:
   - ❌ "AWS SQS" → ✅ "AWS Simple Queue Service"
   - ❌ "AWS SNS" → ✅ "AWS Simple Notification Service"
   - ❌ "AWS ALB" → ✅ "AWS Elastic Load Balancer"
   - ❌ "AWS EC2" → ✅ "AWS EC2"
   - ❌ "AWS S3" → ✅ "AWS Simple Storage Service"
   - ❌ "AWS RDS" → ✅ "AWS RDS"
3. For managed service variants, include the variant keyword (e.g., "AWS RDS - PostgreSQL").
4. Use the *token* slug (see SERVICE DICTIONARY) as the node-id; label must remain the full display name.
5. If a required service is missing in the dictionary, fall back to its official provider documentation name.
"""

class CloudAwarePromptBuilder(PromptBuilderV2):
    """Cloud-aware prompt builder that extends the base V2 builder."""

    # Map of cloud providers to their style pack enhancements
    _CLOUD_STYLE_PACKS = {
        CloudProvider.AWS: AWS_STYLE_PACK,
        CloudProvider.AZURE: AZURE_STYLE_PACK,
        CloudProvider.GCP: GCP_STYLE_PACK,
        CloudProvider.MULTI: MULTI_CLOUD_STYLE_PACK,
    }

    # ------------------------------------------------------------------
    #  Provider dictionary helper
    # ------------------------------------------------------------------

    def _service_dictionary(self, provider_key: str, limit: int = 400) -> str:
        """Return provider-filtered dictionary lines: Display Name -> token."""
        tax = taxonomy_client.load_taxonomy()
        rows = [r for r in tax.values() if r.get("provider") == provider_key]
        if not rows:
            return "- none -"
        rows = sorted(rows, key=lambda r: r.get("display_name") or r["token"])[:limit]
        return "\n".join(f"{r.get('display_name') or r['token']}  ->  {r['token']}" for r in rows)

    # ------------------------------------------------------------------
    #  Public API
    # ------------------------------------------------------------------

    async def build_prompt_by_intent(
        self,
        intent: IntentV2,
        query: str,
        provider: CloudProvider = CloudProvider.NONE,
        conversation_history: List[Dict[str, Any]] = None,
        current_dsl: str = None,
    ) -> str:
        """Build a prompt enhanced with cloud-specific guidance if provider is detected."""
        log_info(f"Building {intent} prompt with {provider} provider")
        
        if intent in (IntentV2.DSL_CREATE, IntentV2.DSL_UPDATE):
            # Apply cloud enhancement if provider is specified
            if provider != CloudProvider.NONE and provider in self._CLOUD_STYLE_PACKS:
                if intent == IntentV2.DSL_CREATE:
                    return await self._cloud_dsl_create_prompt(query, provider, conversation_history or [])
                elif intent == IntentV2.DSL_UPDATE:
                    return await self._cloud_dsl_update_prompt(query, provider, conversation_history or [], current_dsl or "")
        
        # Fall back to base implementation
        return await super().build_prompt_by_intent(
            intent, 
            query, 
            conversation_history or [],
            current_dsl
        )

    # ------------------------------------------------------------------
    #  Dedicated cloud DSL builders
    # ------------------------------------------------------------------

    async def _cloud_dsl_create_prompt(
        self,
        query: str,
        provider: CloudProvider,
        conversation_history: List[Dict[str, Any]],
    ) -> str:
        """Create prompt for a *new* diagram with provider-specific guidance."""

        from core.prompt_engineering.prompt_builder_v2 import STYLE_PACK  # local import to avoid cycle

        log_info(f"Entered _cloud_dsl_create_prompt")
        history_txt = self._format_conversation_history(conversation_history)

        provider_key = provider.value.lower()

        svc_dict = self._service_dictionary(provider_key)

        cloud_style = self._CLOUD_STYLE_PACKS.get(provider, "")

        prompt = f"""{STYLE_PACK}

{NAMING_RULES}

{cloud_style}

### SERVICE DICTIONARY – {provider.value.upper()} ###
{svc_dict}

### TASK ###
Create a comprehensive {provider.value.upper()} architecture diagram based on the USER REQUEST below.

CRITICAL REQUIREMENTS:
• FIRST LINE **must** be "direction: right" to enforce left-to-right flow
• ALWAYS use FULL {provider.value.upper()} service names
  - For example: "AWS Simple Queue Service" instead of "AWS SQS"
  - For example: "AWS Simple Notification Service" instead of "AWS SNS"
• Use ONLY official {provider.value.upper()} service names from the dictionary above
• Include common {provider.value.upper()} infrastructure primitives (networking, security, monitoring) 
• Reflect best practices hinted in the style guide above (e.g., Virtual Private Cloud with private subnets)
• Add supporting services like authentication, databases, caching, logging
• Maintain clear data flow with informative edge labels

### CONTEXT (latest ≤ 5 messages) ###
{history_txt}

### USER REQUEST ###
{query}

### OUTPUT ###
Complete D2 architecture diagram code only. No markdown, no prose.
"""
        return prompt

    async def _cloud_dsl_update_prompt(
        self,
        query: str,
        provider: CloudProvider,
        conversation_history: List[Dict[str, Any]],
        current_dsl: str,
    ) -> str:
        """Create prompt for updating an existing diagram with cloud guidance."""

        from core.prompt_engineering.prompt_builder_v2 import STYLE_PACK

        log_info(f"Entered _cloud_dsl_update_prompt")

        history_txt = self._format_conversation_history(conversation_history)

        provider_key = provider.value.lower()

        svc_dict = self._service_dictionary(provider_key)

        cloud_style = self._CLOUD_STYLE_PACKS.get(provider, "")

        prompt = f"""{STYLE_PACK}

{NAMING_RULES}

{cloud_style}

### SERVICE DICTIONARY – {provider.value.upper()} ###
{svc_dict}

### CURRENT DIAGRAM (read-only) ###
```d2
{current_dsl}
```

### TASK ###
Update the diagram so it fulfils the USER REQUEST, following {provider.value.upper()} best practices.
• FIRST LINE must remain "direction: right"
• Keep existing node-ids whenever possible
• Remove obsolete components if implied by the request
• ALWAYS use FULL {provider.value.upper()} service names - NEVER use acronyms alone
  - For example: "AWS Simple Queue Service" instead of "AWS SQS"
  - For example: "AWS Simple Notification Service" instead of "AWS SNS"
  - EXPAND acronyms in service names without exception
• Use ONLY official {provider.value.upper()} service names from the dictionary
• Ensure security/networking components are appropriate

### CONTEXT (latest ≤ 5 messages) ###
{history_txt}

### USER REQUEST ###
{query}

### OUTPUT ###
Updated D2 diagram code only – no diff, no prose.
"""
        return prompt 