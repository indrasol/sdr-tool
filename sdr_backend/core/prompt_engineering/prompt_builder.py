import json
from typing import Dict, Any, List, Optional
from models.response_models import ResponseType
import re
from utils.logger import log_info
import json
from core.prompt_engineering.node_types import node_types

class PromptBuilder:
    """
    Service for dynamically building prompts based on user intent and context.
    
    Creates specialized prompts for different types of user queries, incorporating
    conversation history and diagram state. Optimized for working with extended thinking.
    """

    async def detect_cloud_provider(self, query):
        providers = {
            "aws": ["aws", "amazon web services"],
            "gcp": ["gcp", "google cloud platform"],
            "azure": ["azure", "microsoft azure"]
        }
        query_lower = query.lower()
        for provider, keywords in providers.items():
            if any(keyword in query_lower for keyword in keywords):
                return provider
        return None
    
    async def build_architecture_prompt(
        self, 
        query: str, 
        conversation_history: List[Dict[str, Any]], 
        diagram_state: Optional[Dict[str, Any]]
    ) -> str:
        """
        Build a precise architecture prompt with explicit layer organization rules.
        
        Args:
            query: The user's query
            conversation_history: List of previous exchanges
            diagram_state: Current state of the architecture diagram
            
        Returns:
            A formatted prompt string with precise layer positioning logic
        """

        # Detect cloud provider from the query
        provider = await self.detect_cloud_provider(query)

        # Filter node types based on context
        if provider:
            relevant_node_types = {
                "application": node_types["application"],
                "client": node_types["client"],
                "network": node_types["network"],
                "database": node_types["database"],
                "databasetype": node_types.get("databasetype", {}),
                provider: node_types[provider],
                "default": node_types["default"]
            }
        else:
            relevant_node_types = {
                "application": node_types["application"],
                "client": node_types["client"],
                "network": node_types["network"],
                "database": node_types["database"],
                "databasetype": node_types.get("databasetype", {}),
                "default": node_types["default"]
            }

        nodes_types_str = json.dumps(relevant_node_types)
        log_info(f"Node Types : {relevant_node_types}")
        
        # Convert diagram state to a readable format
        diagram_description = await self._format_diagram_state(diagram_state)
        
        # Format conversation history
        formatted_history = await self._format_conversation_history(conversation_history)
        
        prompt = f"""
            You are Guardian AI, an expert cybersecurity architecture assistant. You MUST follow the exact LEFT-TO-RIGHT layer organization rules defined below.

            # Current Diagram State:
            {diagram_description}
            
            # Conversation History:
            {formatted_history}
            
            # User Request:
            {query}

            # Available Node Types:
            {nodes_types_str}
            
            # CRITICAL: EXACT LEFT-TO-RIGHT LAYER ORGANIZATION RULES
            
            ## Layer Classification by Node Type Prefix (LEFT-TO-RIGHT FLOW):
            
            ### 1. CLIENT ZONE (X: 50-250) - LEFTMOST - Flow Starting Points
            - **RULE**: Node type starts with "client_"
            - **EXAMPLES**: client_web_browser, client_mobile_app, client_desktop_app, client_iot_device
            - **POSITIONING**: 
            - X: 50 + (client_index * 150) (horizontal spread within zone)
            - Y: 150 (fixed - same row for all clients)
            - **PURPOSE**: External users/devices initiating requests (LEFTMOST in flow)
            
            ### 2. DMZ LAYER (X: 300-500) - LEFT-CENTER - Network Security Perimeter  
            - **RULE**: Node type starts with "network_"
            - **EXAMPLES**: network_cdn, network_waf, network_firewall, network_load_balancer
            - **POSITIONING**:
            - X: 300 + (network_index * 120) (horizontal spread within zone)
            - Y: 250 (fixed - same row for all DMZ components)
            - **PURPOSE**: Network security, traffic routing, and perimeter defense
            
            ### 3. APPLICATION LAYER (X: 550-900) - CENTER - Business Logic
            - **RULE**: Node type starts with "application_"
            - **EXAMPLES**: application_web_server, application_api_gateway, application_microservice, application_authentication
            - **POSITIONING**:
            - X: 550 + (application_index * 130) (horizontal spread within zone)
            - Y: 350 (fixed - same row for all application services)
            - **PURPOSE**: Application services, APIs, business logic, processing
            
            ### 4. DATA LAYER (X: 950-1300) - RIGHTMOST - Data Storage & Persistence
            - **RULE**: Node type starts with "database_" OR "databasetype_"
            - **EXAMPLES**: database_postgresql, database_redis_cache, database_mongodb, databasetype_sql_database
            - **POSITIONING**:
            - X: 950 + (database_index * 140) (horizontal spread within zone)
            - Y: 450 (fixed - same row for all databases)
            - **PURPOSE**: Data storage, caching, persistence, analytics (RIGHTMOST in flow)
            
            ### 5. CLOUD PROVIDER LAYERS (X: Based on Service Type)
            - **AWS NODES** (prefix "aws_"): Positioned based on service type:
            - Compute services (aws_ec2, aws_lambda): Application Layer (X: 550 + index * 130, Y: 350)
            - Database services (aws_rds, aws_dynamodb): Data Layer (X: 950 + index * 140, Y: 450)
            - Network services (aws_cloudfront, aws_elb): DMZ Layer (X: 300 + index * 120, Y: 250)
            - **GCP NODES** (prefix "gcp_"): Same logic as AWS
            - **AZURE NODES** (prefix "azure_"): Same logic as AWS
            
            ## LEFT-TO-RIGHT POSITIONING ALGORITHM - STEP BY STEP:
            
            ```python
            def calculate_position_lr_flow(node_type, existing_nodes):
                # Step 1: Determine layer by exact prefix matching (HORIZONTAL arrangement)
                if node_type.startswith("client_"):
                    layer = "CLIENT"
                    base_x = 50  # Starting X position for clients
                    fixed_y = 150  # Fixed Y position (same row)
                    x_spacing = 150  # Horizontal spacing between clients
                    
                elif node_type.startswith("network_"):
                    layer = "DMZ" 
                    base_x = 300  # Starting X position for DMZ
                    fixed_y = 250  # Fixed Y position (same row)
                    x_spacing = 120  # Horizontal spacing between DMZ components
                    
                elif node_type.startswith("application_"):
                    layer = "APPLICATION"
                    base_x = 550  # Starting X position for applications
                    fixed_y = 350  # Fixed Y position (same row)
                    x_spacing = 130  # Horizontal spacing between applications
                    
                elif node_type.startswith("database_") or node_type.startswith("databasetype_"):
                    layer = "DATA"
                    base_x = 950  # Starting X position for databases
                    fixed_y = 450  # Fixed Y position (same row)
                    x_spacing = 140  # Horizontal spacing between databases
                    
                elif node_type.startswith("aws_"):
                    # Determine AWS service layer (HORIZONTAL positioning)
                    if any(service in node_type for service in ["ec2", "lambda", "beanstalk", "ecs"]):
                        layer = "APPLICATION"
                        base_x = 550  # Application layer start
                        fixed_y = 350  # Application layer row
                        x_spacing = 130
                    elif any(service in node_type for service in ["rds", "dynamodb", "redshift", "s3"]):
                        layer = "DATA" 
                        base_x = 950  # Data layer start
                        fixed_y = 450  # Data layer row
                        x_spacing = 140
                    elif any(service in node_type for service in ["cloudfront", "elb", "alb", "vpc"]):
                        layer = "DMZ"
                        base_x = 300  # DMZ layer start
                        fixed_y = 250  # DMZ layer row
                        x_spacing = 120
                    
                elif node_type.startswith("gcp_"):
                    # Same logic for GCP services (HORIZONTAL positioning)
                    if any(service in node_type for service in ["compute", "run", "functions", "kubernetes"]):
                        layer = "APPLICATION"
                        base_x = 550
                        fixed_y = 350
                        x_spacing = 130
                    elif any(service in node_type for service in ["sql", "firestore", "bigquery", "storage"]):
                        layer = "DATA"
                        base_x = 950
                        fixed_y = 450
                        x_spacing = 140
                    elif any(service in node_type for service in ["cdn", "load_balancer", "vpc"]):
                        layer = "DMZ"
                        base_x = 300
                        fixed_y = 250
                        x_spacing = 120
                    
                elif node_type.startswith("azure_"):
                    # Same logic for Azure services (HORIZONTAL positioning)
                    if any(service in node_type for service in ["vm", "functions", "app_service", "kubernetes"]):
                        layer = "APPLICATION" 
                        base_x = 550
                        fixed_y = 350
                        x_spacing = 130
                    elif any(service in node_type for service in ["sql", "cosmos", "storage", "synapse"]):
                        layer = "DATA"
                        base_x = 950
                        fixed_y = 450
                        x_spacing = 140
                    elif any(service in node_type for service in ["cdn", "load_balancer", "firewall"]):
                        layer = "DMZ"
                        base_x = 300
                        fixed_y = 250
                        x_spacing = 120
                
                # Step 2: Count existing nodes in same layer (for horizontal positioning)
                same_layer_count = count_nodes_in_layer(existing_nodes, layer)
                
                # Step 3: Calculate final position (HORIZONTAL arrangement within layer)
                final_x = base_x + (same_layer_count * x_spacing)  # Horizontal spread within layer
                final_y = fixed_y  # Fixed Y position for layer
                
                return {{"x": final_x, "y": final_y}}
            ```
            
            ## DATABASE NODE TYPE ENFORCEMENT (UNCHANGED):
            
            **CRITICAL DATABASE RULES - NO EXCEPTIONS:**
            1. **Redis**: MUST use "database_redis_cache" (NEVER "application_cache")
            2. **PostgreSQL**: MUST use "database_postgresql" 
            3. **MySQL**: MUST use "database_mysql"
            4. **MongoDB**: MUST use "database_mongodb"
            5. **Vector Databases**: MUST use "database_*_vector_database" format
            6. **Any cache service**: MUST use "database_*_cache" format
            
            **Database Detection Logic:**
            ```
            IF user mentions: "Redis", "cache", "session storage" 
            → MUST use "database_redis_cache"
            
            IF user mentions: "PostgreSQL", "Postgres", "SQL database"
            → MUST use "database_postgresql"
            
            IF user mentions: "vector database", "embeddings", "similarity search"
            → MUST use "database_pinecone_vector_database" (default) or specific vector DB
            ```
            
            ## STANDARD LEFT-TO-RIGHT ARCHITECTURE FLOW PATTERNS:
            
            ### Typical Left-to-Right Flow Sequence (HORIZONTAL within layers):
            ```
            CLIENT ZONE → DMZ LAYER → APPLICATION LAYER → DATA LAYER
            (LEFTMOST)   (LEFT-CENTER)   (CENTER)        (RIGHTMOST)
            
            client_web_browser → network_cdn → application_web_server → database_postgresql
            
            X: 50, Y: 150 → X: 300, Y: 250 → X: 550, Y: 350 → X: 950, Y: 450
            
            Additional nodes in same layer spread horizontally:
            client_mobile_app (X: 200, Y: 150) - next to web browser
            network_waf (X: 420, Y: 250) - next to CDN  
            application_api_gateway (X: 680, Y: 350) - next to web server
            database_redis_cache (X: 1090, Y: 450) - next to PostgreSQL
            ```
            
            ### Edge Connection Rules (LEFT-TO-RIGHT):
            1. **Client to DMZ**: Clients (leftmost) always connect to first DMZ component
            2. **DMZ Chain**: network_cdn → network_waf → network_load_balancer (same X, different Y)
            3. **DMZ to Application**: Last DMZ component connects to first application component  
            4. **Application to Data**: Application services connect to appropriate databases (rightmost)
            5. **Monitoring**: Connect to multiple layers but don't break main left-to-right flow
            
            ## RESPONSE FORMAT REQUIREMENTS:
            
            You MUST respond with this exact JSON structure using LEFT-TO-RIGHT positioning:
            
            ```json
            {{
                "message": "Explanation of architecture with LEFT-TO-RIGHT layer organization details without measurements. Do not mention anything related to Layer organization. Message should be purely architecture based explanation in a friendly way",
                "confidence": 0.95,
                "diagram_updates": {{}},
                "nodes_to_add": [
                    {{
                        "id": "node1",
                        "type": "client_web_browser",
                        "position": {{ "x": 50, "y": 150 }},
                        "data": {{ 
                            "label": "Web Browser",
                            "description": "Client web browser",
                            "layer": "CLIENT"
                        }}
                    }},
                    {{
                        "id": "node2", 
                        "type": "network_cdn",
                        "position": {{ "x": 300, "y": 250 }},
                        "data": {{
                            "label": "CDN",
                            "description": "Content Delivery Network", 
                            "layer": "DMZ"
                        }}
                    }},
                    {{
                        "id": "node3",
                        "type": "application_web_server", 
                        "position": {{ "x": 550, "y": 350 }},
                        "data": {{
                            "label": "Web Server",
                            "description": "Application web server",
                            "layer": "APPLICATION" 
                        }}
                    }},
                    {{
                        "id": "node4",
                        "type": "database_postgresql",
                        "position": {{ "x": 950, "y": 450 }},
                        "data": {{
                            "label": "PostgreSQL", 
                            "description": "Primary database",
                            "layer": "DATA"
                        }}
                    }}
                ],
                "edges_to_add": [
                    {{
                        "id": "edge1",
                        "source": "node1", 
                        "target": "node2",
                        "type": "smoothstep"
                    }},
                    {{
                        "id": "edge2",
                        "source": "node2",
                        "target": "node3", 
                        "type": "smoothstep"
                    }},
                    {{
                        "id": "edge3",
                        "source": "node3",
                        "target": "node4",
                        "type": "smoothstep"
                    }}
                ],
                "elements_to_remove": []
            }}
            ```
            
            ## VALIDATION CHECKLIST - MANDATORY (HORIZONTAL ARRANGEMENT):
            
            Before responding, verify:
            **Layer Assignment**: Each node is in correct LEFT-TO-RIGHT layer based on prefix
            **Database Types**: All database nodes use "database_" or "databasetype_" prefix
            **Client Position**: All "client_" nodes in LEFTMOST zone (X: 50+, Y: 150)
            **DMZ Position**: Only "network_" nodes in LEFT-CENTER (X: 300+, Y: 250)
            **Application Position**: Only "application_" nodes in CENTER (X: 550+, Y: 350)
            **Data Position**: Only "database_" nodes in RIGHTMOST (X: 950+, Y: 450)
            **Cloud Service Placement**: AWS/GCP/Azure nodes in appropriate X positions based on service type
            **Flow Logic**: Proper LEFT-TO-RIGHT connection sequence from client to data
            **Horizontal Spacing**: Proper X-axis spacing within same layer (150px, 120px, 130px, 140px spacing)
            **Fixed Row Heights**: All nodes in same layer use same Y coordinate (150, 250, 350, 450)
            
            ## EXAMPLES OF CORRECT LEFT-TO-RIGHT HORIZONTAL LAYER PLACEMENT:
            
            **E-commerce Architecture (HORIZONTAL ARRANGEMENT):**
            - CLIENT (Y=150): client_web_browser (50, 150), client_mobile_app (200, 150)
            - DMZ (Y=250): network_cdn (300, 250), network_waf (420, 250), network_load_balancer (540, 250)
            - APPLICATION (Y=350): application_web_server (550, 350), application_api_gateway (680, 350), application_microservice (810, 350)
            - DATA (Y=450): database_postgresql (950, 450), database_redis_cache (1090, 450)
            
            **AWS Cloud Architecture (HORIZONTAL ARRANGEMENT):**
            - CLIENT (Y=150): client_web_browser (50, 150)
            - DMZ (Y=250): aws_cloudfront (300, 250), aws_waf (420, 250), aws_elb (540, 250)
            - APPLICATION (Y=350): aws_ec2 (550, 350), aws_lambda (680, 350)
            - DATA (Y=450): aws_rds (950, 450), aws_dynamodb (1090, 450)
            
            **Multi-Cloud Architecture (HORIZONTAL ARRANGEMENT):**
            - CLIENT (Y=150): client_web_browser (50, 150), client_mobile_app (200, 150)
            - DMZ (Y=250): network_cdn (300, 250), azure_firewall (420, 250)
            - APPLICATION (Y=350): gcp_compute_engine (550, 350), aws_lambda (680, 350), azure_vm (810, 350)
            - DATA (Y=450): gcp_firestore (950, 450), aws_rds (1090, 450), azure_cosmos (1230, 450)
            
            ## CRITICAL FLOW VISUALIZATION:
            
            ```
            LEFT-TO-RIGHT ARCHITECTURE FLOW (HORIZONTAL ARRANGEMENT):
            
            CLIENT ZONE     DMZ LAYER      APPLICATION     DATA LAYER
            (X: 50+)       (X: 300+)      (X: 550+)       (X: 950+)
            (Y: 150)       (Y: 250)       (Y: 350)        (Y: 450)
            ┌─────────┐    ┌─────────┐    ┌─────────┐     ┌─────────┐
            │[Browser]│───▶│[CDN][WAF]│───▶│[Server] │───▶ │[DB][Cache]│
            │[Mobile] │    │[LB]     │    │[API][MS]│     │[Vector] │
            └─────────┘    └─────────┘    └─────────┘     └─────────┘
            LEFTMOST      LEFT-CENTER       CENTER        RIGHTMOST
            
            Horizontal arrangement within each layer:
            - Clients spread horizontally: Web Browser (50,150), Mobile (200,150)
            - DMZ spread horizontally: CDN (300,250), WAF (420,250), LB (540,250)  
            - Apps spread horizontally: Server (550,350), API (680,350), MS (810,350)
            - Data spread horizontally: DB (950,450), Cache (1090,450), Vector (1230,450)
            ```
            
            FOLLOW THESE LEFT-TO-RIGHT RULES EXACTLY. NO DEVIATIONS. NO HALLUCINATIONS.
            """
        
        return prompt
    
    async def build_clarification_prompt(
        self, 
        query: str, 
        conversation_history: List[Dict[str, Any]], 
        diagram_state: Optional[Dict[str, Any]]
    ) -> str:
        """
        Build a prompt for queries requiring clarification.
        
        Args:
            query: The user's query
            conversation_history: List of previous exchanges
            diagram_state: Current state of the architecture diagram
            
        Returns:
            A formatted prompt string
        """
        # Convert diagram state to a readable format
        diagram_description = await self._format_diagram_state(diagram_state)
        
        # Format conversation history
        formatted_history = await self._format_conversation_history(conversation_history)
        
        prompt = f"""
        You are Guardian AI, an expert cybersecurity architecture assistant. You need to ask clarifying questions
        when user requests are ambiguous or lack necessary details.
        
        # Current Diagram State:
        {diagram_description}
        
        # Conversation History:
        {formatted_history}
        
        # User Request:
        {query}
        
        This request requires more information. Think about what specific details would help you provide a better response.
        Consider what might be unclear or ambiguous about the request, and what additional context would be helpful.
        
        Generate a response that includes the following JSON structure:
        ```json
        {{
            "message": "Your polite request for clarification",
            "confidence": 0.95,
            "questions": [
                // 2-3 specific questions that would help clarify the user's intent
                "Could you specify which part of the architecture you'd like to modify?",
                "What security requirements are you trying to address with this change?"
            ]
        }}
        ```
        
        Be specific in your questions, focusing on the particular information needed to provide a helpful response.
        Limit to 2-3 focused questions rather than asking for many details at once.
        """
        
        return prompt
    
    async def build_out_of_context_prompt(
        self, 
        query: str, 
        conversation_history: List[Dict[str, Any]]
    ) -> str:
        """
        Build a prompt for out-of-context queries.
        
        Args:
            query: The user's query
            conversation_history: List of previous exchanges
            
        Returns:
            A formatted prompt string
        """
        # Format conversation history
        formatted_history = await self._format_conversation_history(conversation_history)
        
        prompt = f"""
        You are Guardian AI, an expert cybersecurity architecture assistant. You help users design secure architectures,
        but sometimes receive queries outside your expertise.
        
        # Conversation History:
        {formatted_history}
        
        # User Request:
        {query}
        
        Consider whether this query is related to cybersecurity architecture design. 
        If it's not, think about how to politely redirect the conversation.
        
        Generate a response that includes the following JSON structure:
        ```json
        {{
            "message": "Your polite explanation that the query is outside your focus area",
            "confidence": 0.95,
            "suggestion": "A suggested alternative query that would be in-context"
        }}
        ```
        
        Gently redirect the user to topics related to cybersecurity architecture design, without being dismissive
        of their question.
        """
        
        return prompt
    
    async def build_threat_prompt(
        self, 
        conversation_history: List[Dict[str, Any]], 
        diagram_state: Optional[Dict[str, Any]],
        data_flow_description: Optional[str] = None
    ) -> str:
        """
        Build a prompt for realistic threat analysis using STRIDE methodology based on the current implementation.
        
        Args:
            conversation_history: List of previous exchanges
            diagram_state: Current state of the diagram (used only for reference)
            data_flow_description: Detailed data flow analysis from the analyze_diagram function
            
        Returns:
            A formatted prompt string for threat analysis
        """
        # Format conversation history
        formatted_history = await self._format_conversation_history(conversation_history)
        
        # Check if data flow description is available
        if not data_flow_description:
            # If no data flow description is provided, generate a minimal diagram state description
            # but note that this approach is not preferred and is only a fallback
            diagram_description = await self._format_diagram_state(diagram_state)
            data_flow_desc = f"""
            # Current Architecture Implementation:
            {diagram_description}
            
            Note: No detailed data flow analysis is available. The threat analysis may be limited.
            Analyze the above architecture carefully to understand the actual implementation before identifying threats.
            """
        else:
            # Use the provided data flow description
            data_flow_desc = f"""
            # Detailed Architecture and Data Flow Analysis:
            {data_flow_description}
            """
        
        prompt = f"""
        You are Guardian AI, an expert cybersecurity architecture assistant specializing in threat modeling.
        Your task is to Analyze the provided architecture and data flow description ONLY. 
        You must identify threats exclusively within the scope of the described components and flows. 
        Do not assume any implicit behavior, inferred logic, or unstated components. 
        If a threat is not clearly supported by the described system behavior, do not include it.
        
        {data_flow_desc}
        
        {formatted_history}
        
        ## Analysis Instructions:
        
        1. FIRST, thoroughly analyze the architecture and data flow description provided above:
           - Identify all components and their purposes
           - Map out the actual data flow paths and how they interact
           - Note any existing security measures or controls already in place
           - Understand the boundaries and trust zones present in the implementation
           - Identify components assumed secure or out of scope to prevent false positives
           
        2. SECOND, identify ONLY actual threats that apply to this specific implementation:
           - Focus on realistic threats that apply to the current architecture, not hypothetical ones
           - Consider the STRIDE threat model categories as a framework:
              * Spoofing: Impersonating something or someone else
              * Tampering: Modifying data or code without authorization
              * Repudiation: Claiming to not have performed an action
              * Information Disclosure: Exposing information to unauthorized individuals
              * Denial of Service: Denying or degrading service to users
              * Elevation of Privilege: Gaining capabilities without proper authorization
           - Include threats ONLY if they are relevant to the actual components and data flows analyzed
           - Do NOT generate threats for components that are properly secured or for which threats aren't applicable
           - Avoid duplication by merging similar threats across components when applicable
        
        3. THIRD, for each identified realistic threat:
           - Assess its severity (HIGH, MEDIUM, or LOW) based on:
             * Impact: The potential damage if the threat is realized
             * Likelihood: The probability of the threat being exploited given the current implementation
           - Provide specific, actionable mitigation steps that address the vulnerability
           - Target only the specific components that are actually vulnerable
           - (Optional) If applicable, include external references like CWE or CVSS score to help prioritize mitigation
        
        4. FOURTH, ensure the following structured reasoning process is followed before output:
           - List any assumptions made about the system
+          - Mention any gaps in information that might affect completeness of threat identification
+          - Clarify if any STRIDE categories were intentionally skipped due to lack of relevance

        
        IMPORTANT: Based on the detailed architecture and data flow analysis above, your response MUST:
        
        1. ONLY identify threats that are actually present in the implementation described
        2. Follow the JSON structure EXACTLY as shown below:
        ```json
        {{
            "message": "Summary of identified threats based on the actual architecture implementation",
            "confidence": 0.95,
            "severity_counts": {{
                "HIGH": 0,
                "MEDIUM": 0,
                "LOW": 0
            }},
            "threats": [
                {{
                    "id": "THREAT-001",
                    "description": "Detailed description of a specific, realistic threat that exists in the current implementation",
                    "mitigation": "Specific, actionable mitigation steps that address this vulnerability",
                    "severity": "HIGH|MEDIUM|LOW",
                    "target_elements": ["element_id_1", "element_id_2"],
                    "properties": {{
                        "confidence" : 0.95,
                        "threat_type": "SPOOFING|TAMPERING|REPUDIATION|INFORMATION_DISCLOSURE|DENIAL_OF_SERVICE|ELEVATION_OF_PRIVILEGE",
                        "attack_vector": "Description of how the attack would occur against the current implementation",
                        "impact": "Description of the specific impact this would have on the system"
                        "target_elements_labels": ["Node Label 1", "Node Label 2"]
                    }}
                }}
            ]
        }}
        ```
        
        IMPORTANT: Do NOT include generic threats or hypothetical vulnerabilities not relevant to the actual implementation. If a component is already properly secured or a particular threat category doesn't apply, do not force threats where none exist.
        
        If you find no significant threats in a particular category or for a particular component, that is a valid finding. Quality of threat identification is more important than quantity.
        
        Ensure each identified threat:
        - Is specific to the actual implementation described
        - Has a unique ID (THREAT-001, THREAT-002, etc.)
        - Is appropriately categorized by one of the STRIDE threat types
        - Has specific, actionable mitigation steps
        - Targets only the specific vulnerable component(s) in the architecture
        - Includes a clear description of the attack vector and potential impact
        
        Accurately count and categorize the total number of HIGH, MEDIUM, and LOW severity threats.
        """
        
        return prompt
    
    
    
    async def build_dfd_prompt(
        self,
        conversation_history: List[Dict[str, Any]],
        data_flow_description: str
    ) -> str:
        """
        Build a prompt for creating a Threat Model Data Flow Diagram (DFD).
        
        Args:
            conversation_history: List of previous exchanges
            data_flow_description: Detailed data flow description of the current system design
            
        Returns:
            A formatted prompt string for DFD generation
        """
        # Format conversation history
        formatted_conversation_history = await self._format_conversation_history(conversation_history)
        
        prompt = f"""
            You are Guardian AI, an expert in cybersecurity threat modeling and secure software design. Your goal is to map a system's data flow into a structured Threat Model Data Flow Diagram (DFD).

            You will receive:
            1. A natural language **data_flow_description** derived from a system design.
            2. A **formatted_conversation_history** for added context.
            3. (Optionally) Node metadata, trust zones, or labels from architecture diagrams.

            ---
            inputs : 
            {data_flow_description}
        
            {formatted_conversation_history}

            ##  Mapping Heuristics (use these rules as guidelines):
            - If a component interacts with a user, external service, or untrusted source → `external_entity`
            - If a component performs any logic or data transformation → `process`
            - If a component stores data persistently → `datastore`
            - If two components reside in different trust zones or cross security boundaries → define a `trust_boundary`
            - If a node has elevated access (admin rights, DB write access), annotate with `"privilege": "elevated"` or `"admin"`

            ---

            ## ⚙️ Output Format: Return ONLY JSON

            ```json
            {{
            "message": "Brief explanation of how the DFD was derived",
            "confidence": 0.94,
            "elements": [
                {{
                "id": "external_user_1",
                "type": "external_entity",
                "label": "Customer",
                "properties": {{
                    "shape": "rectangle",
                    "position": {{ "x": 100, "y": 100 }},
                    "description": "Customer using the web portal",
                    "trust_zone": "external",
                    "privilege": "standard"
                }}
                }},
                {{
                "id": "auth_service",
                "type": "process",
                "label": "Authentication Service",
                "properties": {{
                    "shape": "circle",
                    "position": {{ "x": 300, "y": 100 }},
                    "description": "Validates user credentials and issues tokens",
                    "trust_zone": "internal",
                    "privilege": "elevated"
                }}
                }},
                {{
                "id": "user_db",
                "type": "datastore",
                "label": "User Database",
                "properties": {{
                    "shape": "cylinder",
                    "position": {{ "x": 500, "y": 200 }},
                    "description": "Stores user data and credentials",
                    "trust_zone": "secure_segment",
                    "privilege": "admin"
                }}
                }}
            ],
            "edges": [
                {{
                "id": "login_request",
                "source": "external_user_1",
                "target": "auth_service",
                "label": "Login Credentials",
                "properties": {{
                    "data_type": "PII"
                    }}
                }},
                {{
                "id": "token_issue",
                "source": "auth_service",
                "target": "external_user_1",
                "label": "JWT Token",
                "properties": {{
                    "data_type": "Auth token"
                }}
                }}
            ],
            "boundaries": [
                {{
                "id": "boundary_internal",
                "label": "Internal Network Zone",
                "element_ids": ["auth_service", "user_db"],
                "properties": {{
                    "shape": "dashed_rectangle",
                    "position": {{ "x": 250, "y": 50 }}
                }}
                }}
            ]
            }}
            ```

            Use descriptive unique IDs for all elements, edges, and boundaries.
            Position elements logically with good spacing between them.
            Only output the JSON with no explanation before or after.
            """
        return prompt
    
    async def build_prompt_by_intent(
        self,
        intent: ResponseType,
        query: str,
        conversation_history: List[Dict[str, Any]],
        diagram_state: Optional[Dict[str, Any]] = None,
        view_mode: str = "AD",
        data_flow_description: Optional[str] = None
    ) -> str:
        """
        Build a prompt based on the detected user intent.
        
        Args:
            intent: The classified intent of the user's query
            query: The user's query
            conversation_history: List of previous exchanges
            diagram_state: Current state of the architecture diagram
            view_mode: Current view mode (AD or DFD)
            data_flow_description: Optional detailed data flow analysis 
            
        Returns:
            A formatted prompt string
        """

        # Special handling for DFD view mode
        if view_mode == "DFD":
            return await self.build_dfd_prompt(conversation_history, diagram_state)
            
        if intent == ResponseType.ARCHITECTURE:
            return await self.build_architecture_prompt(query, conversation_history, diagram_state)
        elif intent == ResponseType.EXPERT:
            return await self.build_expert_prompt(query, conversation_history, diagram_state)
        elif intent == ResponseType.CLARIFICATION:
            return await self.build_clarification_prompt(query, conversation_history, diagram_state)
        elif intent == ResponseType.OUT_OF_CONTEXT:
            return await self.build_out_of_context_prompt(query, conversation_history)
        else:
            # Default to clarification if intent is unclear
            return await self.build_clarification_prompt(query, conversation_history, diagram_state)
    
    async def build_analyze_diagram_prompt(self, diagram_content: dict) -> tuple:
        system_prompt = (
            "You are a specialized architecture analysis assistant that excels at interpreting "
            "network diagrams and translating them into clear, comprehensive text descriptions. "
            "Your expertise is in identifying data flows, system components, and their interactions.\n\n"
            "When analyzing a diagram, follow these steps:\n"
            "1. Identify all nodes (components) and their types/categories\n"
            "2. Track all connections between nodes (edges) and their directionality\n"
            "3. Determine the logical flow of data through the system\n"
            "4. Explain the role and purpose of each component\n"
            "5. Highlight any security boundaries or important patterns\n"
            "6. Describe the complete end-to-end data flow journey\n\n"
            "Your output should be clear, technical, and thorough."
        )

        # Create a structured reasoning prompt
        user_prompt = (
            "Here is an architecture diagram in JSON format that contains 'nodes' and 'edges':\n"
            f"```json\n{json.dumps(diagram_content, indent=2)}\n```\n\n"
            "Please analyze this diagram and provide a comprehensive description of the data flow.\n\n"
            "First, analyze the nodes to understand each component:\n"
            "- What are all the components in the system?\n"
            "- What is each component's role and purpose?\n"
            "- What category or type is each component?\n\n"
            "Next, analyze the edges to understand connections:\n"
            "- How are components connected to each other?\n"
            "- What is the direction of data flow?\n"
            "- Are there any special edges (animated, colored differently)?\n\n"
            "Then, trace the complete data flow paths through the system:\n"
            "- Where does data originate?\n"
            "- What processing occurs at each step?\n"
            "- Where does data ultimately end up?\n\n"
            "Finally, provide a complete narrative that describes the entire architecture and data flow."
        )
        return (system_prompt, user_prompt)
        
    
    async def _format_diagram_state(self, diagram_state: Optional[Dict[str, Any]]) -> str:
        """
        Format the diagram state for inclusion in prompts.
        
        Args:
            diagram_state: The current state of the architecture diagram
            
        Returns:
            A formatted string description of the diagram
        """
        if not diagram_state:
            return "No diagram exists yet. The canvas is empty."
        
        nodes = diagram_state.get("nodes", [])
        edges = diagram_state.get("edges", [])
        
        if not nodes:
            return "No diagram exists yet. The canvas is empty."
        
        nodes_description = "Diagram nodes:\n"
        for node in nodes:
            node_id = node.get("id", "unknown_id")
            node_type = node.get("type", "unknown")
            node_label = node.get("data", {}).get("label", "Unlabeled")
            nodes_description += f"- {node_id}: {node_label} (Type: {node_type})\n"
        log_info(f"Nodes in prompt builder: {nodes_description}")
        edges_description = "Connections:\n"
        if edges:
            for edge in edges:
                edge_id = edge.get("id", "unknown_id")
                source = edge.get("source", "unknown")
                target = edge.get("target", "unknown")
                edge_type = edge.get("type", "default")
                edges_description += f"- {edge_id}: {source} → {target} (Type: {edge_type})\n"
        else:
            edges_description += "- No connections exist yet.\n"
        
        return f"{nodes_description}\n{edges_description}"
    
    async def _format_conversation_history(self, conversation_history: List[Dict[str, Any]]) -> str:
        """
        Format the conversation history for inclusion in prompts.
        
        Args:
            conversation_history: List of previous exchanges
            
        Returns:
            A formatted string of the conversation history
        """
        if not conversation_history:
            return "No previous conversation."
        
        formatted = "Previous messages:\n"
        # Limit history to last 5 exchanges to keep prompt size manageable
        for exchange in conversation_history[-7:]:
            query = exchange.get("query", "")
            response = exchange.get("response", {}).get("message", "")
            formatted += f"User: {query}\nAI: {response}\n\n"
        
        return formatted
