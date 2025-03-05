import json
from typing import Dict, Optional, Any
from utils.logger import log_info
from core.cache.session_manager import SessionManager

class PromptEngineer:
    def __init__(self):
        """Initialize the PromptEngineer with no dependencies."""
        self.session_manager = SessionManager()
        pass

    def build_base_system_prompt(self) -> str:
        """Build the base system prompt with expertise details."""
        return """You are an expert secure software architecture designer and cybersecurity consultant with extensive experience in:

            1. Security Architecture Design:
            - Secure system design patterns
            - Zero trust architecture
            - Defense in depth strategies
            - Microservices security
            - Cloud security architecture

            2. Compliance & Standards:
            - GDPR, CCPA, HIPAA
            - PCI-DSS
            - ISO 27001/27002
            - SOC 2
            - NIST frameworks

            3. Security Controls & Practices:
            - Authentication & Authorization
            - Encryption (at rest and in transit)
            - Secure communication protocols
            - API security
            - Security logging and monitoring
            - Access control systems

            4. Threat Intelligence:
            - MITRE ATT&CK framework
            - OWASP Top 10
            - CWE/CVE knowledge
            - NVD database expertise
            - CISA KEV catalog

            5. Security Assessment:
            - Threat modeling (STRIDE, PASTA)
            - Risk assessment
            - Security requirements analysis
            - Secure SDLC integration
            """

    def build_system_prompt_for_intent(self, intent_type: str) -> str:
        """Build a system prompt tailored to the intent type."""
        base_prompt = self.build_base_system_prompt()
        
        if intent_type == "diagram_modification":
            return base_prompt + """
            Your task is to modify the provided system architecture diagram based on the user's request.

            **IMPORTANT RESPONSE FORMAT:**
            Return responses in valid JSON matching this structure:
            {
                "response_type": "architecture",
                "status": "success",
                "nodes_to_add": [
                    {
                        "id": "node-X",
                        "name": "Human-readable name",
                        "type": "firewall|database|api_gateway|etc",
                        "properties": {
                            "security_level": "high|medium|low",
                            "other_property": "value"
                        }
                    }
                ],
                "nodes_to_update": [
                    {
                        "id": "existing-node-id",
                        "name": "Updated name if changing",
                        "type": "component_type",
                        "properties": {
                            "property_to_change": "new_value"
                        }
                    }
                ],
                "nodes_to_remove": ["node-id-1"],
                "edges_to_add": [
                    {
                        "id": "edge-X",
                        "source": "node-id-1",
                        "target": "node-id-2",
                        "type": "connection_type",
                        "label": "Description",
                        "properties": {
                            "protocol": "value"
                        }
                    }
                ],
                "edges_to_update": [],
                "edges_to_remove": [],
                "explanation": "Detailed explanation of changes",
                "security_messages": [
                    {
                        "severity": "CRITICAL|HIGH|MEDIUM|LOW",
                        "message": "Security implication",
                        "affected_components": ["node-id-1"],
                        "recommendation": "Action to take"
                    }
                ]
            }

            **EXAMPLE:**
            For "Add a firewall":
            {
                "response_type": "architecture",
                "status": "success",
                "nodes_to_add": [
                    {
                        "id": "node-1",
                        "name": "Firewall",
                        "type": "firewall",
                        "properties": {
                            "security_level": "high",
                            "encryption": "true"
                        }
                    }
                ],
                "nodes_to_update": [],
                "nodes_to_remove": [],
                "edges_to_add": [],
                "edges_to_update": [],
                "edges_to_remove": [],
                "explanation": "Added a firewall to enhance network security.",
                "security_messages": []
            }

            **CRITICAL RULES:**
            1. Every node must have 'id' and 'name'.
            2. Use unique 'id's (e.g., 'node-1').
            3. Only update/remove existing nodes.
            4. Include an 'explanation' for all changes.
            5. Add 'security_messages' for any security concerns.
            """
        elif intent_type == "diagram_query":
            return base_prompt + """
            Your task is to analyze the provided system architecture diagram and answer the user's question.

            **IMPORTANT RESPONSE FORMAT:**
            Return responses in valid JSON matching this structure:
            {
                "response_type": "expert",
                "status": "success",
                "title": "Diagram Analysis",
                "content": "Primary answer to the query",
                "sections": [
                    {
                        "heading": "Component Analysis",
                        "content": "Details about components"
                    }
                ],
                "references": ["Reference 1"]
            }

            **EXAMPLE:**
            For "What components are in the diagram?":
            {
                "response_type": "expert",
                "status": "success",
                "title": "Diagram Component Overview",
                "content": "The diagram includes a firewall and a database.",
                "sections": [
                    {
                        "heading": "Components",
                        "content": "Firewall (node-1), Database (node-2)"
                    }
                ],
                "references": []
            }
            """
        elif intent_type == "expert_advice":
            return base_prompt + """
            Your task is to provide expert security and architecture advice.

            **IMPORTANT RESPONSE FORMAT:**
            Return responses in valid JSON matching this structure:
            {
                "response_type": "expert",
                "status": "success",
                "title": "Descriptive title",
                "content": "Primary advice",
                "sections": [
                    {
                        "heading": "Recommendations",
                        "content": "Detailed recommendations"
                    }
                ],
                "references": ["Reference 1"]
            }

            **EXAMPLE:**
            For "Best practices for API security?":
            {
                "response_type": "expert",
                "status": "success",
                "title": "API Security Best Practices",
                "content": "Use OAuth 2.0 and rate limiting.",
                "sections": [
                    {
                        "heading": "Recommendations",
                        "content": "Implement OAuth 2.0 for authentication."
                    }
                ],
                "references": ["OWASP API Security Top 10"]
            }
            """
        else:
            return base_prompt + """
            Return responses in valid JSON appropriate to the query type.
            """

    async def build_prompt_by_intent(self, data: Dict[str, Any], intent_type: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Build an enhanced prompt based on intent."""
        try:
            query = data.get('query', '')
            diagram_context = data.get('diagram_context', {})

            # Fetch session data if provided
            session_data = None
            conversation_history = []
            if session_id:
                try:
                    session_data = await self.session_manager.get_session(session_id)
                    conversation_history = session_data.get('conversation_history', [])
                except Exception as e:
                    log_info(f"Error retrieving session data: {str(e)}")

            # Build context
            context = ""
            if intent_type in ["diagram_modification", "diagram_query"]:
                nodes = diagram_context.get('nodes', [])
                edges = diagram_context.get('edges', [])
                context += f"## Architecture Context:\n- Total Nodes: {len(nodes)}\n- Total Connections: {len(edges)}\n"
                if intent_type == "diagram_modification":
                    context += "\n## Current Architecture Details:\n"
                    for node in nodes:
                        context += f"- {node.get('id', 'unknown')} ({node.get('type', 'unknown')}): {json.dumps(node.get('properties', {}))}\n"
                    context += "\n## Connections:\n"
                    for edge in edges:
                        context += f"- {edge.get('source', 'unknown')} → {edge.get('target', 'unknown')} ({edge.get('type', 'standard')})\n"
                elif intent_type == "diagram_query":
                    context += "\n## Components:\n"
                    for node in nodes:
                        context += f"- {node.get('id', 'unknown')} ({node.get('type', 'unknown')})\n"
            elif intent_type == "expert_advice" and "diagram" in query.lower():
                nodes = diagram_context.get('nodes', [])
                context += f"## Architecture Summary:\n- {len(nodes)} components\n"

            # Add conversation history
            if conversation_history:
                context += "\n## Recent Conversation:\n"
                for entry in conversation_history[-3:]:
                    user_msg = entry.get('user', '')
                    system_msg = entry.get('assistant', {})
                    system_response = system_msg.get('explanation', system_msg.get('content', str(system_msg)))[:100] + '...'
                    context += f"User: {user_msg}\nSystem: {system_response}\n"

            # Intent-specific instructions
            instructions = {
                "diagram_modification": "Modify the architecture diagram and return a JSON response with changes.",
                "diagram_query": "Analyze the diagram and answer the query in a JSON response.",
                "expert_advice": "Provide expert advice in a JSON response."
            }.get(intent_type, "Respond appropriately.")

            user_message = f"{context}\n## Instructions:\n{instructions}\n\n## Query:\n{query}"
            return {"context": context, "user_message": user_message, "intent_type": intent_type}
        except Exception as e:
            log_info(f"Error building prompt: {str(e)}")
            raise ValueError(f"Failed to build prompt: {str(e)}")