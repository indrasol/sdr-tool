from typing import Dict, Any, List, Optional
from models.response_models import ResponseType
import re
from utils.logger import log_info

class PromptBuilder:
    """
    Service for dynamically building prompts based on user intent and context.
    
    Creates specialized prompts for different types of user queries, incorporating
    conversation history and diagram state. Optimized for working with extended thinking.
    """
    
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
        # Convert diagram state to a readable format
        diagram_description = await self._format_diagram_state(diagram_state)
        
        # Format conversation history
        formatted_history = await self._format_conversation_history(conversation_history)
        
        # Using more open-ended thinking instructions as recommended in Anthropic docs
        prompt = f"""
        You are Guardian AI, an expert cybersecurity architecture assistant that helps users design secure architectures.
        
        # Current Diagram State:
        {diagram_description}
        
        # Conversation History:
        {formatted_history}
        
        # User Request:
        {query}
        
        Think deeply about this architecture request. Consider multiple approaches, security implications,
        and best practices. Explore different options before settling on your recommendation.
        
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
        
        # Extract context from the latest conversation if available
        context_from_conversation = ""
        if conversation_history and len(conversation_history) > 0:
            latest_exchange = conversation_history[-1]
            if "query" in latest_exchange:
                context_from_conversation = f"Recent context: {latest_exchange['query']}"
        
        # Check if data flow description is available
        if not data_flow_description:
            # If no data flow description is provided, generate a minimal diagram state description
            # but note that this approach is not preferred and is only a fallback
            diagram_description = await self._format_diagram_state(diagram_state)
            data_flow_section = f"""
            # Current Architecture Implementation:
            {diagram_description}
            
            Note: No detailed data flow analysis is available. The threat analysis may be limited.
            Analyze the above architecture carefully to understand the actual implementation before identifying threats.
            """
        else:
            # Use the provided data flow description
            data_flow_section = f"""
            # Detailed Architecture and Data Flow Analysis:
            {data_flow_description}
            """
        
        prompt = f"""
        You are Guardian AI, an expert cybersecurity architecture assistant specializing in threat modeling.
        Your task is to analyze a real architecture implementation and identify realistic threats based on the actual data flows and security controls present.
        
        {data_flow_section}
        
        {context_from_conversation}
        
        ## Analysis Instructions:
        
        1. FIRST, thoroughly analyze the architecture and data flow description provided above:
           - Identify all components and their purposes
           - Map out the actual data flow paths and how they interact
           - Note any existing security measures or controls already in place
           - Understand the boundaries and trust zones present in the implementation
           
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
        
        3. THIRD, for each identified realistic threat:
           - Assess its severity (HIGH, MEDIUM, or LOW) based on:
             * Impact: The potential damage if the threat is realized
             * Likelihood: The probability of the threat being exploited given the current implementation
           - Provide specific, actionable mitigation steps that address the vulnerability
           - Target only the specific components that are actually vulnerable
        
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
                        "threat_type": "SPOOFING|TAMPERING|REPUDIATION|INFORMATION_DISCLOSURE|DENIAL_OF_SERVICE|ELEVATION_OF_PRIVILEGE",
                        "attack_vector": "Description of how the attack would occur against the current implementation",
                        "impact": "Description of the specific impact this would have on the system"
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
        diagram_state: Optional[Dict[str, Any]]
    ) -> str:
        """
        Build a prompt for generating a Data Flow Diagram (DFD) from system context.
        
        Args:
            conversation_history: List of previous exchanges
            diagram_state: Current state of the architecture diagram
            
        Returns:
            A formatted prompt string for DFD generation
        """
        # Format the diagram state and conversation history
        diagram_description = await self._format_diagram_state(diagram_state)
        formatted_history = await self._format_conversation_history(conversation_history)
        
        # Extract context from the latest conversation if available
        context_from_conversation = ""
        if conversation_history and len(conversation_history) > 0:
            latest_exchange = conversation_history[-1]
            if "query" in latest_exchange:
                context_from_conversation = f"Recent context: {latest_exchange['query']}"
        
        # Define the enhanced prompt
        prompt = f"""
        You are Guardian AI, an expert assistant specialized in secure software architecture and threat modeling.

        Your task is to analyze the current system design to produce a detailed and accurate **Data Flow Diagram (DFD)** in JSON format.
        
        # Current Diagram State:
        {diagram_description}
        
        {context_from_conversation}
        
        ## Core DFD Components:
        - **External Entity**: Rectangle, type `external_entity` - Users/systems that interact with the system
        - **Process**: Circle, type `process` - Functions that transform data
        - **Data Store**: Cylinder, type `datastore` - Storage components like databases/files
        - **Trust Boundary**: Dashed Rectangle, type `trust_boundary` - Separation between different trust levels
        
        ## Output Format (JSON Only):
        Return a well-formed JSON using this structure that aligns with our DFDModelResponse:

        ```json
        {{
          "message": "Brief explanation of the diagram",
          "confidence": 0.95,
          "elements": [
            {{
              "id": "unique_element_id",
              "type": "external_entity | process | datastore",
              "label": "Descriptive Name",
              "properties": {{ 
                "shape": "rectangle | circle | cylinder",
                "position": {{ "x": 100, "y": 200 }},
                "description": "Brief description"
              }}
            }}
          ],
          "edges": [
            {{
              "id": "edge_id",
              "source": "source_element_id",
              "target": "target_element_id",
              "label": "Data being transferred",
              "properties": {{ 
                "data_type": "Data type description"
              }}
            }}
          ],
          "boundaries": [
            {{
              "id": "boundary_id",
              "label": "Boundary Name",
              "element_ids": ["element_id_1", "element_id_2"],
              "properties": {{ 
                "shape": "dashed_rectangle",
                "position": {{ "x": 500, "y": 1000 }}
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
        for exchange in conversation_history[-5:]:
            query = exchange.get("query", "")
            response = exchange.get("response", {}).get("message", "")
            formatted += f"User: {query}\nAI: {response}\n\n"
        
        return formatted