from typing import Dict, Any, List, Optional
from models.response_models import ResponseType
import re

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
    
    # Add to your existing PromptBuilder class
    async def build_dfd_prompt(
        self, 
        query: str, 
        conversation_history: List[Dict[str, Any]], 
        diagram_state: Optional[Dict[str, Any]]
    ) -> str:
        """
        Build a prompt for DFD and threat analysis.
        
        Args:
            query: The user's query
            conversation_history: List of previous exchanges
            diagram_state: Current state of the diagram
            
        Returns:
            A formatted prompt string
        """
        # Format conversation history
        formatted_history = await self._format_conversation_history(conversation_history)
        
        prompt = f"""
        You are Guardian AI, an expert cybersecurity architecture assistant specializing in threat modeling.
        You are analyzing a Data Flow Diagram (DFD) that represents system architecture and data flows.
        
        # DFD Context:
        The diagram shows components, boundaries, and data flows in the system.
        Threats have been identified based on STRIDE threat modeling methodology:
        - Spoofing: Impersonating something or someone else
        - Tampering: Modifying data or code
        - Repudiation: Claiming to not have performed an action
        - Information Disclosure: Exposing information to unauthorized individuals
        - Denial of Service: Denying or degrading service to users
        - Elevation of Privilege: Gaining capabilities without proper authorization
        
        # Conversation History:
        {formatted_history}
        
        # User Request:
        {query}
        
        Think deeply about the security implications of the DFD and the user's question.
        Consider potential threats, vulnerabilities, and security controls that should be in place.
        
        When providing your response, use this JSON structure:
        ```json
        {{
            "message": "Your detailed explanation or answer to the user's question",
            "confidence": 0.95,
            "threats_to_explain": [
                // IDs of specific threats to highlight and explain (if relevant)
            ],
            "recommendations": [
                // Security recommendations based on the identified threats
            ]
        }}
        ```
        
        Provide concrete, actionable security advice based on the DFD and identified threats.
        Focus on practical mitigations rather than theoretical concerns.
        """
        
        return prompt
    
    async def build_prompt_by_intent(
        self,
        intent: ResponseType,
        query: str,
        conversation_history: List[Dict[str, Any]],
        diagram_state: Optional[Dict[str, Any]] = None,
        view_mode: str = "AD"
    ) -> str:
        """
        Build a prompt based on the detected user intent.
        
        Args:
            intent: The classified intent of the user's query
            query: The user's query
            conversation_history: List of previous exchanges
            diagram_state: Current state of the architecture diagram
            view_mode: Current view mode (AD or DFD)
            
        Returns:
            A formatted prompt string
        """

        # Special handling for DFD view mode
        if view_mode == "DFD":
            return await self.build_dfd_prompt(query, conversation_history, diagram_state)

        
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