"""Cloud Resource Mapper

This module provides utilities for mapping cloud resources to appropriate metadata,
icons, and layer indices based on provider and service type.
"""

from __future__ import annotations
from typing import Dict, Any, Optional, List, Tuple
import re
from utils.logger import log_info, log_error

class CloudResourceMapper:
    """Maps cloud resources to appropriate metadata based on provider and service."""
    
    # Known cloud providers
    KNOWN_PROVIDERS = {
        "aws", "azure", "gcp", "google", "ibm", "oracle", "alibaba"
    }
    
    # Comprehensive cloud service type mappings
    CLOUD_SERVICE_TYPES = {
        "aws": {
            "compute": ["lambda", "ec2", "ecs", "fargate", "batch", "lightsail", "elastic-beanstalk", "app-runner"],
            "storage": ["s3", "ebs", "efs", "glacier", "storage-gateway", "backup", "snow"],
            "database": ["rds", "dynamodb", "documentdb", "neptune", "timestream", "keyspaces", "elasticache", "memorydb", "qldb"],
            "networking": ["vpc", "route53", "cloudfront", "api-gateway", "elb", "alb", "nlb", "direct-connect", "app-mesh"],
            "security": ["iam", "cognito", "kms", "waf", "shield", "guardduty", "securityhub", "inspector", "detective"],
            "integration": ["sns", "sqs", "eventbridge", "mq", "step-functions", "appsync", "sfn", "swf"],
            "ml": ["sagemaker", "comprehend", "rekognition", "forecast", "personalize", "polly", "textract"],
            "analytics": ["athena", "emr", "kinesis", "redshift", "quicksight", "glue", "data-pipeline", "lake-formation"],
            "monitoring": ["cloudwatch", "cloudtrail", "config", "xray", "systems-manager"],
            "devops": ["codebuild", "codecommit", "codedeploy", "codepipeline", "codestar", "cloud9"]
        },
        "azure": {
            "compute": ["functions", "vm", "aks", "app-service", "container-instances", "batch", "service-fabric"],
            "storage": ["storage", "files", "disk", "data-lake", "backup", "storagesync"],
            "database": ["sql", "cosmos-db", "postgresql", "mysql", "cache", "synapse", "data-explorer"],
            "networking": ["vnet", "load-balancer", "cdn", "dns", "api-management", "application-gateway", "frontdoor", "bastion"],
            "security": ["active-directory", "key-vault", "sentinel", "security-center", "ddos-protection", "information-protection"],
            "integration": ["service-bus", "event-grid", "event-hubs", "logic-apps", "api-management"],
            "ml": ["machine-learning", "cognitive-services", "bot-service", "genomics", "form-recognizer"],
            "analytics": ["synapse-analytics", "hdinsight", "databricks", "data-factory", "purview", "time-series-insights"],
            "monitoring": ["monitor", "application-insights", "log-analytics", "advisor"],
            "devops": ["devops", "pipelines", "repos", "artifacts", "boards", "test-plans"]
        },
        "gcp": {
            "compute": ["compute-engine", "kubernetes-engine", "app-engine", "cloud-functions", "cloud-run"],
            "storage": ["cloud-storage", "filestore", "persistent-disk", "transfer-service"],
            "database": ["cloud-sql", "cloud-spanner", "cloud-bigtable", "firestore", "memorystore"],
            "networking": ["vpc", "cloud-load-balancing", "cloud-cdn", "cloud-dns", "cloud-armor"],
            "security": ["iam", "kms", "security-command-center", "cloud-dlp", "identity-platform"],
            "integration": ["pub-sub", "cloud-tasks", "cloud-scheduler", "eventarc", "workflows"],
            "ml": ["ai-platform", "vision-ai", "speech-to-text", "natural-language", "automl"],
            "analytics": ["bigquery", "dataflow", "dataproc", "data-fusion", "looker"],
            "monitoring": ["cloud-monitoring", "cloud-logging", "cloud-trace", "cloud-profiler", "error-reporting"],
            "devops": ["cloud-build", "cloud-deploy", "artifact-registry", "cloud-source-repositories"]
        }
    }
    
    # Mapping from cloud service category to KIND
    CATEGORY_TO_KIND = {
        "compute": "COMPUTE",
        "storage": "DATA",
        "database": "DATA",
        "networking": "EDGE_NETWORK",
        "security": "IDENTITY",
        "integration": "INTEGRATION_MESSAGING",
        "ml": "AI_ML",
        "analytics": "PROCESSING_ANALYTICS",
        "monitoring": "OBSERVABILITY",
        "devops": "DEV_CI_CD"
    }
    
    # Default regions by provider
    DEFAULT_REGIONS = {
        "aws": "us-east-1",
        "azure": "eastus",
        "gcp": "us-central1",
        "google": "us-central1",
        "ibm": "us-south",
        "oracle": "us-phoenix-1",
        "alibaba": "us-west-1"
    }
    
    def extract_provider_service(self, token: str) -> Tuple[Optional[str], Optional[str]]:
        """Extract provider and service from token with format 'provider-service'.
        
        Args:
            token: A string in the format 'provider-service' (e.g., 'aws-lambda')
            
        Returns:
            Tuple of (provider, service) or (None, None) if no match
        """
        if not token or '-' not in token:
            return None, None
            
        parts = token.split('-', 1)
        if len(parts) != 2:
            return None, None
            
        provider, service = parts
        
        # Normalize provider name
        provider = provider.lower()
        if provider == "google":
            provider = "gcp"  # Normalize Google Cloud Platform provider name
            
        if provider not in self.KNOWN_PROVIDERS:
            return None, None
            
        return provider, service
    
    def detect_service_category(self, provider: str, service: str) -> str:
        """Detect service category based on provider and service name.
        
        Args:
            provider: Cloud provider name
            service: Service name
            
        Returns:
            Category name or 'other' if not found
        """
        if provider not in self.CLOUD_SERVICE_TYPES:
            return "other"
            
        for category, services in self.CLOUD_SERVICE_TYPES[provider].items():
            # Check for exact match first
            if service in services:
                return category
                
            # Then check if the service name contains any of the service patterns
            if any(s in service for s in services):
                return category
                
        return "other"
    
    def get_default_region(self, provider: str) -> str:
        """Get default region for provider.
        
        Args:
            provider: Cloud provider name
            
        Returns:
            Default region code
        """
        return self.DEFAULT_REGIONS.get(provider, "unknown")
    
    def map_cloud_resource(self, token: str) -> Dict[str, Any]:
        """Map cloud resource to enhanced metadata.
        
        Args:
            token: Resource token in format 'provider-service'
            
        Returns:
            Dictionary of metadata for the resource
        """
        provider, service = self.extract_provider_service(token)
        if not provider or not service:
            return {}
            
        # Find service category
        category = self.detect_service_category(provider, service)
        
        # Map category to KIND
        kind = self.CATEGORY_TO_KIND.get(category, "SERVICE")
        
        # Build enhanced metadata
        metadata = {
            "provider": provider,
            "service": service,
            "category": category,
            "region": self.get_default_region(provider),
            "layerIndex": self.get_layer_index_for_kind(kind),
            "iconifyId": f"custom:{provider}-{service}",
            "cloud": True  # Flag to indicate this is a cloud resource
        }
        
        return {
            "kind": kind,
            "layer": kind,  # Use kind as layer
            "metadata": metadata
        }
    
    def get_layer_index_for_kind(self, kind: str) -> int:
        """Get layer index for a given kind.
        
        Args:
            kind: Node kind
            
        Returns:
            Layer index (0-10)
        """
        kind_to_layer_map = {
            "CLIENT": 0,
            "EDGE_NETWORK": 1,
            "IDENTITY": 2,
            "SERVICE": 3,
            "INTEGRATION_MESSAGING": 4,
            "PROCESSING_ANALYTICS": 5,
            "COMPUTE": 5,
            "DATA": 6,
            "OBSERVABILITY": 7,
            "AI_ML": 8,
            "DEV_CI_CD": 9,
            "OTHER": 10
        }
        
        return kind_to_layer_map.get(kind, 3)  # Default to SERVICE layer (3) 