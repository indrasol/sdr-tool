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
        Build a prompt for architecture-related queries.
        
        Args:
            query: The user's query
            conversation_history: List of previous exchanges
            diagram_state: Current state of the architecture diagram
            
        Returns:
            A formatted prompt string
        """

        # Detect cloud provider from the query
        provider = await self.detect_cloud_provider(query)

        # Filter node types based on context
        if provider:
            relevant_node_types = {
                "application": node_types["application"],
                "client": node_types["client"],
                "network": node_types["network"],
                provider: node_types[provider],
                "default": node_types["default"]  # Include defaults for fallback
            }
        else:
            relevant_node_types = {
                "application": node_types["application"],
                "client": node_types["client"],
                "network": node_types["network"],
                "default": node_types["default"]  # Include defaults for fallback
            }

        nodes_types_str = json.dumps(relevant_node_types)
        log_info(f"Node Types : {relevant_node_types}")
        # Convert diagram state to a readable format
        diagram_description = await self._format_diagram_state(diagram_state)
        
        # Format conversation history
        formatted_history = await self._format_conversation_history(conversation_history)
        
        # Using more open-ended thinking instructions as recommended in Anthropic docs
        prompt = f"""
        You are Guardian AI, an expert cybersecurity architecture assistant that helps users design secure architectures.
        
        # PRIMARY DIRECTIVE:
        The most critical aspect of your role is to select the EXACT CORRECT NODE AND NODE TYPE for each component.
        Each node MUST have the proper type corresponding to its technology (e.g., "database_postgresql" for PostgreSQL).
        Using incorrect node types (e.g., "application_cache" for Redis) will cause errors in visualization.
        
        # Current Diagram State:
        {diagram_description}
        
        # Conversation History:
        {formatted_history}
        
        # User Request:
        {query}

        # Available Node Types:
        {nodes_types_str}
        
        # Instructions:
        Analyze the user’s request carefully, considering security best practices, scalability, and architectural patterns. Select node types from the 'Available Node Types' dictionary to build the architecture.

        - **Node Type Selection**:
            - Use the most appropriate node types from the following sections based on the user’s request:
                - `"application"`: General application components (e.g., web servers, APIs).
                - `"aws"`, `"gcp"`, `"azure"`: Cloud-specific services when a provider is specified (e.g., "AWS", "GCP", "Azure").
                - `"database"`: Specific database systems when a database is requested (e.g., "MySQL", "MongoDB").
                - `"databasetype"`: Abstract database types (e.g., "SQL", "NoSQL") only if the user explicitly requests to represent database types separately.
                - `"network"`: Network components (e.g., firewalls, VPNs).
                - `"client"`: Client-side components (e.g., mobile apps, browsers).
            - IMPORTANT DATABASE RULES:
                - For any database component, you MUST select from the `"database_*"` prefixed node types
                - Redis MUST always use "database_redis_cache" (never "application_cache")
                - PostgreSQL MUST always use "database_postgresql" (never any other database type)
                - Match the exact technology name to its dedicated node type (e.g., MongoDB → "database_mongodb")
            - Refer to the `description` field in the node types to match the user's intent (e.g., "database_mongodb" for a document-oriented NoSQL database).
        
        - **Database Handling**:
             - If a specific database is named (e.g., "use MongoDB"), select the matching `"database"` node (e.g., `"database_mongodb"`).
            - If a type is specified (e.g., "use a SQL database"), pick a `"database"` node matching that type (e.g., `"database_postgresql"` for SQL).
            - If a cloud provider is mentioned, prefer managed database services (e.g., `"aws_dynamodb"` for AWS NoSQL).
            - **When No Database is Specified**:
                - Infer a database if the app typically requires storage (e.g., web apps, games).
                - Choose based on use case:
                - Structured data (e.g., e-commerce): `"database_postgresql"` or `"database_mysql"`.
                - Scalable/flexible data (e.g., social media): `"database_mongodb"` or `"database_cassandra"`.
                - Real-time data (e.g., games): `"database_redis_cache"` or `"database_firebase"`.
                - Time-series data (e.g., IoT): `"database_influxdb"` or `"database_timescaledb"`.
                - Analytics (e.g., reporting): `"aws_redshift"` or `"gcp_bigquery"`.
                - Default to `{node_types['default']['database']}` if unclear, with an explanation.
            - Suggest security features (e.g., encryption) and nodes (e.g., `"network_waf"`) for sensitive data.
        
        - **Cloud Provider Logic**:
            - If a cloud provider is specified, prioritize node types from that provider’s specific (e.g., "aws_lambda" for AWS serverless).
            - If no provider is specified, use generic nodes from `"application"`, `"database"`, `"network"`, or `"client"` as appropriate.

        - **Security Considerations**:
            - Prioritize node types with built-in security features (e.g., managed database services like "aws_rds" with encryption, or "network_firewall" for traffic filtering).
            - Suggest additional security components (e.g., "network_waf" or "aws_waf") if relevant to the architecture.

        - **Defaults and Ambiguity**:
            - If no exact match exists or the request is vague, use default node types:
                - Application: `{node_types['default']['application']}`
                - AWS: `{node_types['default']['aws']}`
                - GCP: `{node_types['default']['gcp']}`
                - Azure: `{node_types['default']['azure']}`
                - Network: `{node_types['default']['network']}`
                - Client: `{node_types['default']['client']}`
                - Database: `{node_types['default']['database']}`
                - Databasetype: `{node_types['default']['databasetype']}`
            - Explain assumptions in the `message` field if the request is ambiguous.

        - **Node and Edge IDs**:
            - Assign unique IDs to new nodes (e.g., "node1", "node2") and edges (e.g., "edge1", "edge2").

       # Examples:
        - **Request**: "Add a web server"
            - Node: `"application_web_server"` (generic web hosting).
        - **Request**: "Use AWS for hosting a web app"
            - Node: `"aws_elastic_beanstalk"` (AWS platform for web apps).
        - **Request**: "Add a SQL database"
            - Node: `"database_mysql"` (SQL database based on description).
        - **Request**: "Use a NoSQL database on GCP"
            - Node: `"gcp_firestore"` (GCP NoSQL database).
        - **Request**: "Add a secure database on AWS"
            - Node: `"aws_rds"` (managed relational database with security features).
        - **Request**: "Show database type as SQL"
            - Node: `"databasetype_sql_database"`.
        - **Request**: "Build a social media platform on AWS"
            - Nodes: `"aws_elastic_beanstalk"`, `"aws_dynamodb"` (scalable NoSQL), `"network_waf"`.
            - Message: "DynamoDB selected for scalability with unstructured social data."
        - **Request**: "Add a database for IoT sensor data"
            - Node: `"database_influxdb"` (time-series optimized).
            - Message: "InfluxDB suits time-series IoT data."
        - **Request**: "Create a reporting dashboard on GCP"
            - Nodes: `"gcp_cloud_run"`, `"gcp_bigquery"` (analytics), `"network_firewall"`.
            - Message: "BigQuery chosen for analytical queries.
        - **Request**: "Create a game app"
            - Nodes: `"application_web_server"`, `"database_redis_cache"` (real-time data), `"network_firewall"`.
            - Message: "Redis chosen for fast, real-time game data access."
        - **Request**: "Design an e-commerce app"
            - Nodes: `"application_web_server"`, `"database_postgresql"` (structured transactions), `"network_firewall"`.
            - Message: "PostgreSQL ensures consistency for transactions."
       
        # Database Mapping Examples (CRITICAL):
            - **"Add Redis cache"**: MUST use `"database_redis_cache"` (NOT application_cache)
            - **"Add PostgreSQL database"**: MUST use `"database_postgresql"` (NOT database_db4o)
            - **"Add MySQL"**: MUST use `"database_mysql"`
            - **"Add MongoDB"**: MUST use `"database_mongodb"`
            - **"Add Cassandra"**: MUST use `"database_cassandra"`
            - **"Redis for session caching"**: MUST use `"database_redis_cache"`
            - **"Postgres for transactional data"**: MUST use `"database_postgresql"`
            
        - **FINAL VALIDATION: Check Database Node Types**:
            Before returning your final response, perform these validation checks:
            1. For each database node, verify that its type matches the correct database type from the mapping list
            2. Check specifically that:
               - Any node with "Redis" or "Cache" in its label uses "database_redis_cache" type
               - Any node with "PostgreSQL" or "Postgres" in its label uses "database_postgresql" type
               - Any node with "MySQL" in its label uses "database_mysql" type
               - Any node with "MongoDB" in its label uses "database_mongodb" type
            3. DO NOT use generic types like "application_cache" for specific database technologies
            4. Fix any mismatches before returning your response
        
        Respond with this JSON structure:
        
        When providing your response, use this JSON structure:
        ```json
        {{
            "message": "Your detailed explanation of the architectural changes",
            "confidence": 0.95,
            "diagram_updates": {{
                // Any updates to existing diagram elements
            }},
            "nodes_to_add": [
                // New nodes to add to the diagram, each with id, type, position, and data
                {{
                    "id": "unique_id",
                    "type": "node_type",
                    "position": {{ "x": 100, "y": 200 }},
                    "data": {{ "label": "Node Label", "description": "Node description" }}
                }}
            ],
            "edges_to_add": [
                // New edges to add to the diagram, each with id, source, target, and type
                {{
                    "id": "edge_id",
                    "source": "source_node_id",
                    "target": "target_node_id",
                    "type": "edge_type"
                }}
            ],
            "elements_to_remove": [
                // IDs of elements to remove from the diagram
                "node_id_to_remove"
            ]
        }}
        ```
        
        Focus on providing a secure architecture that follows best practices. If the user's request is ambiguous,
        make reasonable assumptions based on common security patterns, but explain your assumptions.
        """
        
        return prompt
    
    async def build_expert_prompt(
        self, 
        query: str, 
        conversation_history: List[Dict[str, Any]], 
        diagram_state: Optional[Dict[str, Any]]
    ) -> str:
        """
        Build a prompt for expert knowledge queries.
        
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
        You are Guardian AI, an expert cybersecurity architecture assistant. You provide in-depth knowledge about
        cybersecurity concepts, technologies, and best practices.
        
        # Current Diagram State:
        {diagram_description}
        
        # Conversation History:
        {formatted_history}
        
        # User Question:
        {query}
        
        Think thoroughly about this security question. Consider relevant security principles, standards, technologies,
        and approaches. Analyze the question from multiple perspectives before formulating your response.
        
        Provide a comprehensive expert response that includes the following JSON structure:
        ```json
        {{
            "message": "Your detailed expert explanation",
            "confidence": 0.95,
            "references": [
                // Optional references to sources, standards, or best practices
                {{"title": "NIST SP 800-53", "url": "https://example.com/nist-800-53"}}
            ],
            "related_concepts": [
                // Optional related security concepts that might be relevant
                "Zero Trust Architecture", "Defense in Depth"
            ]
        }}
        ```
        
        Provide accurate, up-to-date information about cybersecurity concepts, focusing on practical implications
        for the user's architecture. Cite relevant standards, frameworks, or best practices where appropriate.
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
