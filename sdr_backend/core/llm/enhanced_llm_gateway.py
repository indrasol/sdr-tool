from tenacity import retry, stop_after_attempt, wait_exponential
from typing import Any, Dict, List, Optional, Union
import httpx
from config.settings import OPENAI_API_KEY, ANTHROPIC_API_KEY
from services.exception_handler import RateLimitError, LLMError
import json
import asyncio
import time
from datetime import datetime
from utils.logger import log_info
import anthropic
import logging
from core.cache.session_manager import session_manager
from services.new_validation_handler import _validate_diagram_modification_response, _validate_diagram_query_response, _validate_expert_advice_response


class LLMGateway:
    def __init__(self):
        """Initialize the LLM Gateway with API connections and configuration."""
        self.openai_url = "https://api.openai.com/v1/chat/completions"
        self.anthropic_api_key = ANTHROPIC_API_KEY
        self.openai_api_key = OPENAI_API_KEY
        self.anthropic_client = anthropic.Anthropic()
        self.rate_limit = 100  # Requests per minute
        self.rate_counter = 0
        self.conversation_history = []
        
        # Response schemas for different intents aligned with Pydantic models
        self.expert_response_schema = {
            "response_type": "expert",
            "status": "success",
            "title": "Expert Security Advice",
            "content": "Your detailed expert advice with recommendations here...",
            "sections": [
                {"heading": "Overview", "content": "Summary of the advice..."},
                {"heading": "Recommendations", "content": "Specific recommendations..."}
            ],
            "references": ["NIST SP 800-53", "OWASP ASVS 4.0"]
        }
        
        self.architecture_response_schema = {
            "response_type": "architecture",
            "status": "success",
            "nodes_to_add": [{
                "id": "node-1",
                "name": "Firewall",
                "type": "firewall",
                "properties": {
                    "security_level": "high",
                    "encryption": "true",
                    "access_control": "admin,security",
                    "compliance": "PCI-DSS"
                }
            }],
            "nodes_to_update": [{
                "id": "node-2",
                "name": "API Gateway",
                "type": "api_gateway",
                "properties": {
                    "security_level": "high",
                    "authentication_methods": "OAuth2.0,API keys"
                }
            }],
            "nodes_to_remove": ["node-3"],
            "edges_to_add": [{
                "id": "edge-1",
                "source": "node-1",
                "target": "node-2",
                "type": "encrypted",
                "label": "HTTPS/TLS",
                "properties": {
                    "protocol": "HTTPS",
                    "encryption": "TLS 1.3"
                }
            }],
            "edges_to_update": [],
            "edges_to_remove": [],
            "explanation": "Security architecture changes explanation...",
            "security_messages": [
                {
                    "severity": "CRITICAL",
                    "message": "Security validation message",
                    "affected_components": ["node-1", "node-2"],
                    "recommendation": "Implement proper authentication"
                }
            ]
        }
        
        self.diagram_query_response_schema = {
            "response_type": "expert",
            "status": "success",
            "title": "Diagram Analysis",
            "content": "Detailed explanation about the diagram architecture...",
            "sections": [
                {"heading": "Components", "content": "Analysis of key components..."},
                {"heading": "Connections", "content": "Analysis of connections..."}
            ],
            "references": ["Relevant reference 1", "Relevant reference 2"]
        }
    
    def clear_conversation(self) -> None:
        """Clear conversation history."""
        self.conversation_history = []
    
    def _build_base_system_prompt(self) -> str:
        """
        Build the base system prompt with common expertise information.
        """
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

    def _build_system_prompt_for_intent(self, intent_type: str) -> str:
        """
        Build a system prompt tailored to the specific intent type.
        
        Args:
            intent_type: The classified intent ("diagram_modification", "diagram_query", or "expert_advice")
            
        Returns:
            A system prompt string optimized for the intent
        """
        base_prompt = self._build_base_system_prompt()
        
        if intent_type == "diagram_modification":
            return base_prompt + """
            Your task is to modify the provided system architecture diagram based on the user's request.
            
            IMPORTANT RESPONSE FORMAT:
            You MUST return responses in valid JSON format following this structure:
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
                "nodes_to_remove": ["node-id-1", "node-id-2"],
                "edges_to_add": [
                    {
                        "id": "edge-X",
                        "source": "node-id-1",
                        "target": "node-id-2",
                        "type": "connection_type",
                        "label": "Description of connection",
                        "properties": {
                            "property": "value"
                        }
                    }
                ],
                "edges_to_update": [],
                "edges_to_remove": [],
                "explanation": "Detailed explanation of changes",
                "security_messages": [
                    {
                        "severity": "CRITICAL|HIGH|MEDIUM|LOW",
                        "message": "Security message",
                        "affected_components": ["node-id-1", "node-id-2"],
                        "recommendation": "Security recommendation"
                    }
                ]
            }
            
            CRITICAL RULES FOR ARCHITECTURE MODIFICATIONS:
            1. Every node MUST have both 'id' and 'name' fields
            2. Node 'id' should be a technical identifier (e.g., "node-1"), while 'name' should be human-readable (e.g., "Application Firewall")
            3. Categorize all node changes into nodes_to_add, nodes_to_update, or nodes_to_remove
            4. When adding nodes, generate unique IDs in the format "node-X"
            5. Only include nodes to update or remove that exist in the current architecture
            6. For updates, only include the properties that need to change
            7. Properties should be key-value pairs with string values
            8. For edges, 'source' and 'target' must reference valid node IDs, and 'label' should describe the connection
            9. Always include an "explanation" field with a detailed description of all changes
            10. Include security_messages for any security implications, with appropriate severity level
            """
            
        elif intent_type == "diagram_query":
            return base_prompt + """
            Your task is to analyze the provided system architecture diagram and answer the user's question about it.
            
            IMPORTANT RESPONSE FORMAT:
            You MUST return responses in valid JSON format following this structure:
            {
                "response_type": "expert",
                "status": "success",
                "title": "Diagram Analysis",
                "content": "Primary answer to the query with key insights",
                "sections": [
                    {
                        "heading": "Component Analysis",
                        "content": "Detailed discussion of components"
                    },
                    {
                        "heading": "Security Assessment",
                        "content": "Analysis of security aspects"
                    }
                ],
                "references": ["Reference 1", "Reference 2"]
            }
            
            CRITICAL RULES:
            1. Analyze the architecture carefully before responding
            2. Include a concise answer in the "content" field
            3. Use "sections" to organize longer explanations by topic
            4. When referencing specific nodes, use both their ID and name (e.g., "node-1 (Application Server)")
            5. Include relevant security standards or best practices in "references"
            6. Ensure the "title" field is descriptive of your answer
            """
            
        elif intent_type == "expert_advice":
            return base_prompt + """
            Your task is to provide expert security and architecture advice based on the user's question.
            
            IMPORTANT RESPONSE FORMAT:
            You MUST return responses in valid JSON format following this structure:
            {
                "response_type": "expert",
                "status": "success",
                "title": "Brief descriptive title of your advice",
                "content": "Primary advice with key recommendations",
                "sections": [
                    {
                        "heading": "Background",
                        "content": "Context and background information"
                    },
                    {
                        "heading": "Recommendations",
                        "content": "Detailed recommendations"
                    },
                    {
                        "heading": "Implementation Steps",
                        "content": "How to implement the recommendations"
                    }
                ],
                "references": ["Reference 1", "Reference 2"]
            }
            
            CRITICAL RULES:
            1. Provide specific, actionable advice in the "content" field
            2. Use "sections" to organize your detailed advice by topic
            3. Include relevant compliance standards or frameworks in "references"
            4. Ensure the "title" field is concise but descriptive
            5. Base all recommendations on industry standards and best practices
            6. If multiple approaches exist, explain the tradeoffs in a dedicated section
            """
            
        else:  # fallback to generic
            return base_prompt + """
            IMPORTANT RESPONSE FORMAT:
            You MUST return responses in valid JSON format appropriate to the query type.
            Based on the context and query, determine if the response requires:
            
            1. Architecture modifications:
            {
                "response_type": "architecture",
                "status": "success",
                "nodes_to_add": [...],
                "nodes_to_update": [...],
                "nodes_to_remove": [...],
                "edges_to_add": [...],
                "edges_to_update": [...],
                "edges_to_remove": [...],
                "explanation": "Detailed explanation",
                "security_messages": [...]
            }
            
            2. Expert advice:
            {
                "response_type": "expert",
                "status": "success",
                "title": "Brief title",
                "content": "Primary advice",
                "sections": [{"heading": "Topic", "content": "Details"}],
                "references": ["References"]
            }
            
            Choose the most appropriate format and ensure your response follows its structure exactly.
            """

    async def _build_prompt_by_intent(self, 
                                      data: Dict[str, Any], 
                                      intent_type: str,
                                      session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Build an enhanced prompt based on the classified intent type.
        
        Args:
            data: The request data containing query and context
            intent_type: The classified intent
            session_id: Optional session ID to retrieve history
            
        Returns:
            Dict containing the context and user message
        """
        try:
            query = data.get('query', '')
            diagram_context = data.get('diagram_context', {})
            
            # Get session data if session_id is provided
            session_data = None
            conversation_history = []
            if session_id:
                try:
                    session_data = session_manager.get_session(session_id)
                    conversation_history = session_data.get('conversation_history', [])
                except Exception as e:
                    log_info(f"Error retrieving session data: {str(e)}")
            
            # Build context based on intent type
            context = ""
            
            # Add architecture context for diagram-related intents
            if intent_type in ["diagram_modification", "diagram_query"]:
                # Extract architecture information
                nodes = diagram_context.get('nodes', [])
                edges = diagram_context.get('edges', [])
                
                context += f"## Architecture Context:\n"
                context += f"- Total Nodes: {len(nodes)}\n"
                context += f"- Total Connections: {len(edges)}\n"
                
                # Add detail level based on intent
                if intent_type == "diagram_modification":
                    # For modifications, include complete node details
                    context += "\n## Current Architecture Details:\n"
                    for node in nodes:
                        node_id = node.get('id', 'unknown')
                        node_type = node.get('type', 'unknown')
                        props = json.dumps(node.get('properties', {}), indent=2)
                        context += f"### Node '{node_id}':\n"
                        context += f"- Type: {node_type}\n"
                        context += f"- Properties: {props}\n\n"
                    
                    # Include connections for comprehensive understanding
                    context += "## Current Connections:\n"
                    for edge in edges:
                        source = edge.get('source', 'unknown')
                        target = edge.get('target', 'unknown')
                        edge_type = edge.get('type', 'standard')
                        context += f"- {source} → {target} ({edge_type})\n"
                
                elif intent_type == "diagram_query":
                    # For queries, include a more summarized view
                    context += "\n## Architecture Components:\n"
                    for node in nodes:
                        node_id = node.get('id', 'unknown')
                        node_type = node.get('type', 'unknown')
                        context += f"- Node '{node_id}' (Type: {node_type})\n"
                    
                    context += "\n## Component Relationships:\n"
                    for edge in edges:
                        source = edge.get('source', 'unknown')
                        target = edge.get('target', 'unknown')
                        context += f"- {source} is connected to {target}\n"
            
            # For expert advice, include minimal architecture context if relevant
            elif intent_type == "expert_advice":
                if "diagram" in query.lower() or "architecture" in query.lower():
                    # If the query references the architecture, include a summary
                    nodes = diagram_context.get('nodes', [])
                    context += f"## Current Architecture Summary:\n"
                    context += f"- System has {len(nodes)} components\n"
                    
                    # Group nodes by type for a high-level overview
                    node_types = {}
                    for node in nodes:
                        node_type = node.get('type', 'unknown')
                        if node_type in node_types:
                            node_types[node_type] += 1
                        else:
                            node_types[node_type] = 1
                    
                    for node_type, count in node_types.items():
                        context += f"- {count} {node_type} component(s)\n"
            
            # Add recent conversation history for all intents
            if conversation_history:
                context += "\n## Recent Conversation:\n"
                # Get the last 3 exchanges (at most)
                recent_history = conversation_history[-3:] if len(conversation_history) > 3 else conversation_history
                for entry in recent_history:
                    user_msg = entry.get('user', '')
                    system_msg = entry.get('assistant', {})
                    
                    # Extract relevant parts from system message based on type
                    if isinstance(system_msg, dict):
                        if 'expert_message' in system_msg:
                            system_response = system_msg.get('expert_message', '')[:100] + '...'
                        elif 'explanation' in system_msg:
                            system_response = system_msg.get('explanation', '')[:100] + '...'
                        elif 'answer' in system_msg:
                            system_response = system_msg.get('answer', '')[:100] + '...'
                        else:
                            system_response = str(system_msg)[:100] + '...'
                    else:
                        system_response = str(system_msg)[:100] + '...'
                    
                    context += f"User: {user_msg}\n"
                    context += f"System: {system_response}\n\n"
            
            # Add intent-specific instructions
            if intent_type == "diagram_modification":
                instructions = """
                ## Instructions:
                I need you to modify the architecture diagram based on my request.
                
                Please provide a complete JSON response that includes:
                1. Any nodes to add, modify, or remove
                2. Any connections to add, modify, or remove
                3. An explanation of the changes you've made
                4. Any security implications of these changes
                
                For each node or connection, provide all required properties and ensure IDs are consistent.
                """
            elif intent_type == "diagram_query":
                instructions = """
                ## Instructions:
                I need you to analyze the architecture diagram and answer my question.
                
                Please provide a complete JSON response that includes:
                1. A detailed answer to my question based on the architecture
                2. References to specific components in the architecture
                3. Any relevant best practices or standards that apply
                """
            elif intent_type == "expert_advice":
                instructions = """
                ## Instructions:
                I need your expert advice on security architecture.
                
                Please provide a complete JSON response that includes:
                1. Detailed recommendations addressing my question
                2. Justification for your recommendations
                3. References to relevant standards or best practices
                """
            else:
                instructions = "## Instructions:\nPlease respond to my query with appropriate expert advice."
            
            # Build final user message
            user_message = f"{context}\n{instructions}\n\n## User Query:\n{query}"
            
            return {
                "context": context,
                "user_message": user_message,
                "intent_type": intent_type
            }
            
        except Exception as e:
            log_error = f"Error building intent-based prompt: {str(e)}"
            logging.error(log_error)
            raise ValueError(log_error)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def get_openai_response(self, prompt: str, intent_type: str = "generic_query") -> Dict[str, Any]:
        """
        Get a response from OpenAI with retry logic.
        
        Args:
            prompt: The prompt to send to OpenAI
            intent_type: The type of intent for customizing the system prompt
            
        Returns:
            The parsed JSON response
        """
        url = self.openai_url
        api_key = self.openai_api_key
        client = httpx.AsyncClient(timeout=30.0)
        
        try:
            # Build system prompt based on intent
            system_prompt = self._build_system_prompt_for_intent(intent_type)
            
            # Prepare request payload
            payload = {
                "model": "gpt-4",  
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.5,
                "max_tokens": 1500,
                "response_format": {"type": "json_object"}
            }
            
            # Check rate limit
            if self.rate_counter >= self.rate_limit:
                raise RateLimitError("Rate limit exceeded. Please slow down your requests.")
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            # Log the request (optional for debugging)
            log_info(f"Sending request to OpenAI with intent {intent_type}")
            
            # Make API call
            response = await client.post(
                url,
                json=payload,
                headers=headers
            )
            
            # Update rate counter
            self.rate_counter += 1
            
            # Parse and validate response
            response_json = response.json()
            content = response_json.get("choices", [{}])[0].get("message", {}).get("content", "{}")
            
            try:
                parsed_content = json.loads(content)
                return parsed_content
            except json.JSONDecodeError:
                # If we can't parse the JSON, return the raw content as an error
                return {
                    "error": "Failed to parse JSON response",
                    "raw_content": content
                }
                
        except httpx.RequestError as e:
            raise LLMError(f"Network error: {str(e)}")
        except json.JSONDecodeError as e:
            raise LLMError(f"Invalid JSON response: {str(e)}")
        finally:
            # Reset rate counter after 1 minute
            if self.rate_counter > 0:
                await asyncio.sleep(60)
                self.rate_counter = 0

    async def get_claude_response(self, 
                                 processed_request: Dict[str, Any], 
                                 intent_type: str = "generic_query",
                                 temperature: float = 0.3) -> Dict[str, Any]:
        """
        Get a response from Claude with intent-specific prompting.
        
        Args:
            processed_request: The processed request with user message
            intent_type: The classified intent type
            temperature: The temperature setting for the model
            
        Returns:
            The parsed JSON response
        """
        try:
            # Build system prompt based on intent
            system_prompt = self._build_system_prompt_for_intent(intent_type)
            
            # Extract user message from processed request
            user_message = processed_request.get("user_message", "")
            
            # Include conversation history if present
            messages = [
                {
                    "role": "user",
                    "content": user_message
                }
            ]
            
            # Include conversation history
            messages.extend(self.conversation_history)
            
            # Log conversation context
            log_info(f"Generating Claude response with intent: {intent_type}")
            
            # Use different temperature settings based on intent
            if intent_type == "diagram_modification":
                # Lower temperature for more precise diagram modifications
                temperature = 0.2
            elif intent_type == "expert_advice":
                # Higher temperature for more creative advice
                temperature = 0.4
            
            # Generate response from Claude
            response = self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4096,
                system=system_prompt,
                messages=messages,
                temperature=temperature,
                response_format={"type": "json_object"}
            )
            
            # Extract and parse response
            response_content = response.content[0].text
            log_info(f"Claude response received (first 100 chars): {response_content[:100]}...")
            
            try:
                # Parse JSON response
                json_response = json.loads(response_content)
                
                # Add the response to conversation history
                self.conversation_history.append({
                    "role": "assistant",
                    "content": response_content
                })
                
                # Validate response structure based on intent
                if intent_type == "diagram_modification":
                    await _validate_diagram_modification_response(json_response)
                elif intent_type == "diagram_query":
                    await _validate_diagram_query_response(json_response)
                elif intent_type == "expert_advice":
                    await _validate_expert_advice_response(json_response)
                
                return json_response
                
            except json.JSONDecodeError as e:
                # Handle invalid JSON response
                log_info(f"Invalid JSON response from Claude: {str(e)}")
                return {
                    "error": "Invalid JSON response",
                    "message": "The model returned an improperly formatted response",
                    "raw_content": response_content[:200] + "..."
                }
                
        except Exception as e:
            log_info(f"Error getting Claude response: {str(e)}")
            raise LLMError(f"Failed to get Claude response: {str(e)}")
    
    
    
    async def generate_response(self, 
                               processed_request: Dict[str, Any], 
                               model: str = "claude",
                               intent_type: str = "generic_query",
                               session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a structured response from the specified LLM based on intent.
        
        Args:
            processed_request: The processed request data
            model: The LLM to use ("claude" or "openai")
            intent_type: The classified intent type
            session_id: Optional session ID for context retrieval
            
        Returns:
            Structured JSON response conforming to Pydantic models
        """
        try:
            # Build prompt based on intent
            enhanced_prompt = await self._build_prompt_by_intent(
                processed_request, 
                intent_type,
                session_id
            )
            
            log_info(f"Using model: {model} for intent: {intent_type}")
            
            if model == "openai":
                # Generate response from OpenAI
                response = await self.get_openai_response(
                    enhanced_prompt["user_message"],
                    intent_type
                )
            elif model == "claude":
                # Generate response from Claude
                response = await self.get_claude_response(
                    enhanced_prompt,
                    intent_type
                )
            else:
                raise ValueError(f"Unsupported model: {model}")
            
            # Add session_id and timestamp to conform to BaseResponse
            if session_id:
                response["session_id"] = session_id
            else:
                response["session_id"] = "temporary-" + str(int(time.time()))
                
            if "timestamp" not in response:
                response["timestamp"] = datetime.now().isoformat()
            
            # Update session if session_id is provided
            if session_id:
                try:
                    session_manager.update_session(
                        session_id=session_id,
                        user_query=processed_request.get('query', ''),
                        system_response=response
                    )
                    log_info(f"Session {session_id} updated with new response")
                except Exception as e:
                    log_info(f"Warning: Failed to update session: {str(e)}")
            
            return response
            
        except Exception as e:
            log_info(f"Error generating response: {str(e)}")
            
            # Current timestamp for error responses
            timestamp = datetime.now().isoformat()
            error_session_id = session_id if session_id else "error-" + str(int(time.time()))
            
            # Provide a fallback response based on intent type
            if intent_type == "diagram_modification":
                return {
                    "response_type": "architecture",
                    "status": "error",
                    "session_id": error_session_id,
                    "timestamp": timestamp,
                    "explanation": f"Error generating diagram modifications: {str(e)}",
                    "nodes_to_add": [],
                    "nodes_to_update": [],
                    "nodes_to_remove": [],
                    "edges_to_add": [],
                    "edges_to_update": [],
                    "edges_to_remove": [],
                    "security_messages": [
                        {
                            "severity": "HIGH",
                            "message": "Failed to process architecture modifications",
                            "recommendation": "Please try rephrasing your request"
                        }
                    ]
                }
            elif intent_type == "diagram_query" or intent_type == "expert_advice":
                return {
                    "response_type": "expert",
                    "status": "error",
                    "session_id": error_session_id,
                    "timestamp": timestamp,
                    "title": "Error Processing Request",
                    "content": f"I encountered an error while processing your request: {str(e)}",
                    "sections": [
                        {
                            "heading": "Error Details",
                            "content": "The system was unable to process your request properly. This might be due to an internal error or an issue with the query format."
                        },
                        {
                            "heading": "Suggestions",
                            "content": "Please try rephrasing your question or breaking it into smaller, more specific queries."
                        }
                    ],
                    "references": []
                }
            else:
                return {
                    "response_type": "error",
                    "status": "error",
                    "session_id": error_session_id,
                    "timestamp": timestamp,
                    "title": "Processing Error",
                    "content": f"An unexpected error occurred: {str(e)}",
                    "sections": [],
                    "references": []
                }

# Create a singleton instance
llm_gateway = LLMGateway()