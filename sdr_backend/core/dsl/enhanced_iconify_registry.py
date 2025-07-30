# Enhanced Iconify Registry for Backend V2
# Provides smart icon resolution with comprehensive mappings

# Provider-specific icon mappings
PROVIDER_ICON_MAPPINGS = {
    "aws": {
        # Compute
        "lambda": "logos:aws-lambda",
        "ec2": "simple-icons:amazonec2", 
        "ecs": "simple-icons:amazonecs",
        "fargate": "simple-icons:awsfargate",
        
        # Storage
        "s3": "simple-icons:amazons3",
        "rds": "simple-icons:amazonrds",
        "dynamodb": "simple-icons:amazondynamodb",
        
        # Security
        "iam": "simple-icons:identity",
        "cognito": "logos:aws-cognito",
        "secrets_manager": "mdi:key-variant",
        
        # Networking
        "vpc": "mdi:cloud-outline",
        "cloudfront": "simple-icons:amazoncloudfront",
        "api_gateway": "logos:aws-api-gateway",
        "load_balancer": "mdi:scale-balance",

        # Queues
        "sqs": "logos:aws-simple-queue-service",
        "sns": "logos:aws-simple-notification-service",
        "event_bridge": "logos:aws-eventbridge",
        "kinesis": "logos:aws-kinesis",
        "step_functions": "logos:aws-step-functions",
        "step_functions": "logos:aws-step-functions",
    },
    
    "azure": {
        # Compute
        "app_service": "simple-icons:microsoftazure",
        "functions": "mdi:function-variant",
        "container_instances": "mdi:kubernetes",
        
        # Storage
        "storage_account": "mdi:database-outline",
        "cosmos_db": "simple-icons:azurecosmosdb",
        
        # Security
        "active_directory": "simple-icons:azureactivedirectory",
        "key_vault": "mdi:key-variant",
        
        # Networking
        "virtual_network": "mdi:cloud-outline",
        "application_gateway": "mdi:gateway",
        "traffic_manager": "mdi:traffic-cone"
    },
    
    "gcp": {
        # Compute
        "compute_engine": "logos:google-cloud",
        "cloud_functions": "logos:google-cloud-functions",
        "cloud_run": "logos:google-cloud-run",
        
        # Storage
        "cloud_storage": "logos:google-cloud-storage",
        "firestore": "logos:firebase",
        "cloud_sql": "mdi:database",
        
        # Security
        "identity_access": "mdi:account-key",
        "secret_manager": "mdi:key-variant",
        
        # Networking
        "vpc": "mdi:cloud-outline",
        "cloud_cdn": "mdi:web",
        "load_balancer": "mdi:scale-balance"
    }
}

# Technology-specific icons
TECHNOLOGY_ICON_MAPPINGS = {
    # Languages & Frameworks
    "nodejs": "logos:nodejs-icon",
    "python": "logos:python", 
    "java": "logos:java",
    "dotnet": "logos:dotnet",
    "react": "logos:react",
    "angular": "logos:angular-icon",
    "vue": "logos:vue",
    
    # Databases
    "postgresql": "logos:postgresql",
    "mysql": "logos:mysql",
    "mongodb": "logos:mongodb",
    "redis": "logos:redis",
    "elasticsearch": "logos:elasticsearch",
    
    # Infrastructure
    "docker": "logos:docker-icon",
    "kubernetes": "logos:kubernetes",
    "terraform": "logos:terraform-icon",
    "ansible": "logos:ansible",
    "jenkins": "logos:jenkins",
    
    # Monitoring & Observability
    "prometheus": "logos:prometheus",
    "grafana": "logos:grafana",
    "datadog": "logos:datadog",
    "newrelic": "logos:new-relic",
    
    # Message Brokers
    "kafka": "logos:apache-kafka",
    "rabbitmq": "logos:rabbitmq-icon",
    
    # Web Servers
    "nginx": "logos:nginx",
    "apache": "logos:apache"
}

# Category-based icons with comprehensive mappings
CATEGORY_ICON_MAPPINGS = {
    # Core categories
    "client": "mdi:monitor-shimmer",
    "process": "mdi:server",
    "server": "mdi:server",
    "database": "mdi:database",
    "security": "mdi:shield-lock",
    "network": "mdi:router-network",
    "application": "mdi:application-braces",
    "service": "mdi:cube-outline",
    "function": "mdi:lambda",
    "data_warehouse": "mdi:warehouse",
    "data_lake": "mdi:database-outline",
    "data_share": "mdi:database-outline",
    "data_factory": "mdi:database-outline",
    "vector": "mdi:vector-arrange-above",
    "data_lake": "mdi:database-outline",
    "storage": "mdi:harddisk",
    "queue": "mdi:queue",
    "cache": "mdi:lightning-bolt",
    "external": "mdi:web",
    "realtime_engine": "mdi:lightning-bolt-circle",
    "realtime_gateway": "mdi:flash-auto",
    "pinecone": "simple-icons:pinecone",
    "weaviate": "simple-icons:weaviate",
    "milvus": "simple-icons:milvus",
    "qdrant": "simple-icons:qdrant",
    "chroma": "simple-icons:chromadb",
    "vespa": "simple-icons:vespaengine",
    "snowflake": "logos:snowflake-icon",
    "bigquery": "logos:google-bigquery",
    "redshift": "logos:amazon-redshift",
    "vector_store": "mdi:vector-arrange-above",
    
    # Specific application services
    "chat_service": "mdi:message-text",
    "leaderboard": "mdi:trophy",
    "analytics": "mdi:chart-line",
    "user_auth": "mdi:shield-account",
    "payment_gateway": "mdi:credit-card",
    "monitoring": "mdi:chart-line",
    "encryption_service": "mdi:lock-outline",
    "waf": "mdi:security-network",
    "secrets_manager": "mdi:key-variant",
    "audit_logs": "mdi:file-document-outline",
    
    # Specific databases
    "player_db": "mdi:database",
    "game_db": "mdi:database", 
    "leaderboard_db": "mdi:database",
    "chat_db": "mdi:database",
    
    # Specific services and components
    "session_cache": "mdi:lightning-bolt",
    "realtime_engine": "mdi:rocket-launch",
    "matchmaking": "mdi:account-group",
    "game_server": "mdi:server",
    "game_client": "mdi:gamepad-variant",
    "logging": "mdi:file-document-outline",
    "metrics": "mdi:chart-bar",
    "siem": "mdi:security",
    "cdn": "mdi:web",
    "firewall": "mdi:security-network",
    "load_balancer": "mdi:scale-balance",
    
    # Extended categories
    "api": "mdi:api",
    "authentication": "mdi:shield-account",
    "authorization": "mdi:shield-key",
    "encryption": "mdi:lock-outline",
    "firewall": "mdi:security-network",
    "load_balancer": "mdi:scale-balance",
    "cdn": "mdi:web",
    "proxy": "mdi:swap-horizontal",
    "gateway": "mdi:gateway",
    "logging": "mdi:file-document-outline",
    "backup": "mdi:backup-restore",
    
    # Container & Orchestration
    "container": "mdi:kubernetes",
    "orchestrator": "mdi:sitemap",
    "scheduler": "mdi:calendar-clock",
    
    # Data & Analytics
    "data_warehouse": "mdi:warehouse",
    "etl": "mdi:shuffle-variant",
    "stream_processing": "mdi:water",
    
    # Communication
    "message_queue": "mdi:message-processing",
    "notification": "mdi:bell-outline",
    "email": "mdi:email-outline",
    "sms": "mdi:message-text",
    
    # Development
    "ci_cd": "mdi:source-branch",
    "testing": "mdi:test-tube",
    "deployment": "mdi:rocket-launch",
    
    # Gaming specific (based on console logs)
    "game": "mdi:gamepad-variant",
    "player": "mdi:account-group",
    "match": "mdi:trophy-variant"
}

def resolve_icon(node_type: str, provider: str = None, technology: str = None) -> str:
    """
    Smart icon resolution with comprehensive fallback chain.
    
    Args:
        node_type: The node type (e.g., 'chat_service', 'database', 'leaderboard')
        provider: Optional provider context (e.g., 'aws', 'azure', 'gcp')
        technology: Optional technology context (e.g., 'postgresql', 'redis')
    
    Returns:
        Iconify icon identifier string
    """
    # Priority 1: Provider-specific icon
    if provider and PROVIDER_ICON_MAPPINGS.get(provider, {}).get(node_type):
        return PROVIDER_ICON_MAPPINGS[provider][node_type]
    
    # Priority 2: Technology-specific icon
    if technology and TECHNOLOGY_ICON_MAPPINGS.get(technology):
        return TECHNOLOGY_ICON_MAPPINGS[technology]
    
    # Priority 3: Direct technology match with nodeType
    if TECHNOLOGY_ICON_MAPPINGS.get(node_type):
        return TECHNOLOGY_ICON_MAPPINGS[node_type]
    
    # Priority 4: Category icon (direct match)
    if CATEGORY_ICON_MAPPINGS.get(node_type):
        return CATEGORY_ICON_MAPPINGS[node_type]
    
    # Priority 5: Pattern-based fallbacks
    node_lower = node_type.lower()
    
    # Database patterns
    if any(term in node_lower for term in ['database', 'db', '_db', 'data_store', 'storage']):
        return CATEGORY_ICON_MAPPINGS["database"]
    
    # API/Gateway patterns  
    if any(term in node_lower for term in ['api', 'gateway', 'endpoint']):
        return CATEGORY_ICON_MAPPINGS["api"]
    
    # Authentication/Security patterns
    if any(term in node_lower for term in ['auth', 'security', 'login', 'credential']):
        return CATEGORY_ICON_MAPPINGS["authentication"]
    
    # Load balancer patterns
    if any(term in node_lower for term in ['load', 'balancer', 'lb']):
        return CATEGORY_ICON_MAPPINGS["load_balancer"]
    
    # Cache patterns
    if any(term in node_lower for term in ['cache', 'redis', 'memcache']):
        return CATEGORY_ICON_MAPPINGS["cache"]
    
    # Server / engine patterns (generic compute)
    if any(term in node_lower for term in ['server', 'engine', 'broker']):
        return CATEGORY_ICON_MAPPINGS["process"]

    # Client / UI patterns
    if any(term in node_lower for term in ['client', 'frontend', 'ui']):
        return CATEGORY_ICON_MAPPINGS["client"]

    # Generic *service* patterns
    if node_lower.endswith('service') or node_lower.endswith('_svc') or 'service' in node_lower:
        return CATEGORY_ICON_MAPPINGS["application"]

    # Monitoring patterns
    if any(term in node_lower for term in ['monitor', 'metric', 'log', 'alert']):
        return CATEGORY_ICON_MAPPINGS["monitoring"]
    
    # Queue/Message patterns
    if any(term in node_lower for term in ['queue', 'message', 'kafka', 'rabbitmq']):
        return CATEGORY_ICON_MAPPINGS["message_queue"]
    
    # Ultimate fallback
    return CATEGORY_ICON_MAPPINGS["application"]

# Preload common icons for performance
PRELOAD_ICONS = [
    "mdi:server",
    "mdi:database", 
    "mdi:shield-lock",
    "mdi:monitor-shimmer",
    "mdi:application",
    "logos:aws",
    "logos:microsoft-azure",
    "logos:google-cloud",
    "mdi:kubernetes",
    "logos:docker-icon"
] 