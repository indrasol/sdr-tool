from tenacity import retry, stop_after_attempt, wait_exponential
from typing import Any, Dict
import httpx
from  config.settings import OPENAI_API_KEY, ANTHROPIC_API_KEY
from services.exception_handler import RateLimitError, LLMError
import json
import asyncio
from utils.logger import log_info
import anthropic
import logging
from models.pydantic_models import DiagramContext

class LLMGateway:
    def __init__(self):
        self.openai_url = "https://api.openai.com/v1/chat/completions"
        self.anthropic_api_key = ANTHROPIC_API_KEY
        self.openai_api_key = OPENAI_API_KEY
        self.anthropic_client = anthropic.Anthropic(
            # defaults to os.environ.get("ANTHROPIC_API_KEY")
            # api_key=ANTHROPIC_API_KEY
        )
        self.rate_limit = 100  # Requests per minute
        self.rate_counter = 0
        self.conversation_history = []
        self.schema_example = {
            "nodes": [{
                "action": "add",
                "node_type": "firewall",
                "node_id": "node-1",
                "properties": {
                    "properties_type": "firewall",
                    "node_type": "firewall",
                    "security_level": "high",
                    "encryption": True,
                    "access_control": ["admin", "security"],
                    "compliance": ["PCI-DSS"],
                    "rules": ["allow https from 0.0.0.0/0"],
                    "log_retention_days": 90
                },
                "position": [10.5, 20.3]
            }],
            "edges": [{
                "edge_type": "encrypted",
                "source": "node-1",
                "target": "node-2",
                "label": "HTTPS/TLS",
                "properties": {
                    "protocol": "HTTPS",
                    "encryption": "TLS 1.3",
                    "security_controls": ["mTLS", "certificate_pinning"]
                }
            }],
            "explanation": "Security architecture changes explanation...",
            "references": ["NIST SP 800-41", "OWASP ASVS 4.0.3"],
            "confidence": 0.92,
            "security_messages": [
                {
                    "severity": "CRITICAL",
                    "message": "Security validation message"
                }
            ]
        }
    
    def clear_conversation(self) -> None:
        """
        Clear conversation history.
        """
        self.conversation_history = []
    
    def _build_security_analysis_system_prompt(self) -> str:
        """
        Build the comprehensive system prompt with strict JSON response format.
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

            CRITICAL RESPONSE FORMAT REQUIREMENTS:
            1. You MUST return responses in valid JSON format only.
            2. Response MUST strictly follow this structure:
            {
                "identified_gaps": [
                    "Clear description of gap 1",
                    "Clear description of gap 2",
                    ...
                ],
                "recommendations": [
                    "Detailed recommendation 1",
                    "Detailed recommendation 2",
                    ...
                ]
            }

            FORMAT RULES:
            - Each gap and recommendation MUST be a complete, self-contained string
            - DO NOT use nested objects or arrays
            - DO NOT include categories or groupings
            - Each recommendation should be a specific, actionable item
            - Include the context (e.g., "Implement OAuth 2.0 for user authentication" instead of just "Implement OAuth 2.0")
            """

    async def _build_security_analysis_prompt(self, diagram_context: DiagramContext) -> Dict[str, Any]:
        """
        Build enhanced prompt with context and specific requirements.
        """
        try:
            # Build context section
            context = (
                f"## System Architecture Context:\n"
                f"- Total Nodes: {len(diagram_context.nodes)}\n"
                f"- Total Connections: {len(diagram_context.edges)}\n"
            )
            
            # Add detailed architecture information
            context += "\n## Component Details:\n"
            for node in diagram_context.nodes:
                context += (
                    f"Node '{node.id}':\n"
                    f"- Type: {node.type}\n"
                    f"- Properties: {json.dumps(node.properties)}\n"
                )

            for edge in diagram_context.edges:
                context += (
                    f"Connection '{edge.id}':\n"
                    f"- From: {edge.source} To: {edge.target}\n"
                    f"- Type: {edge.type}\n"
                )

            # Build user message with specific instructions
            user_message = (
                f"{context}\n\n"
                "## Security Analysis Requirements:\n"
                "1. Analyze the provided architecture for security gaps\n"
                "2. For each identified gap, provide a specific, actionable recommendation\n"
                "3. Ensure recommendations are detailed and self-contained\n"
                "4. Consider authentication, authorization, data protection, network security, and monitoring aspects\n\n"
                "## Response Guidelines:\n"
                "- Each gap should be a clear, specific security concern\n"
                "- Each recommendation should be an actionable, detailed solution\n"
                "- Include implementation context in each recommendation\n"
                "- Avoid generic advice; focus on the specific architecture provided\n"
            )
            
            return {
                "context": context,
                "user_message": user_message
            }
            
        except Exception as e:
            logging.error(f"Error building prompt: {str(e)}")
            raise ValueError(f"Failed to build prompt: {str(e)}")
            

    def _build_generic_query_system_prompt(self) -> str:
        """
        Build the comprehensive system prompt including JSON response requirements.
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

            IMPORTANT RESPONSE REQUIREMENTS:
            1. You MUST return responses in valid JSON format only.
            2. For architecture modifications, response MUST include:
            
            - Root level MUST contain: "nodes", "edges", "explanation", "references", "confidence", "security_messages"

            - Each node in "nodes" array MUST have:
                - "action": MUST be one of ["add", "modify", "remove", "connect"]
                - "node_type": String describing node type
                - "node_id": MUST follow pattern "node-X" for nodes or "connection-X" for connections
                - "properties": Object containing node configuration
                - "position": Array of two numbers [x, y] for coordinates

            - Each edge in "edges" array MUST have:
                - "edge_type": Type of connection (e.g., "encrypted", "secure_channel")
                - "source": ID of source node (must match existing node_id)
                - "target": ID of target node (must match existing node_id)
                - "label": Optional description of the connection
                - "properties": Object containing connection properties like protocol and encryption

            - Properties object MUST have:
                - "properties_type": MUST match node_type or be "generic"
                - "node_type": Same as parent node_type
                - "security_level": "high", "medium", or "low"
                - "encryption": boolean
                - "access_control": array of strings
                - "compliance": array of compliance standards

            - For Firewall properties additionally include:
                - "rules": array of firewall rules
                - "log_retention_days": number

            - For API Gateway properties additionally include:
                - "authentication_methods": array of auth methods
                - "rate_limiting": boolean
                - "api_security_controls": array of controls

            - "security_messages" MUST be array of objects with:
                - "severity": one of ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]
                - "message": string

            - ALL node operations MUST follow these rules:
                - Node IDs format:
                    - Add/modify/remove: 'node-X' (e.g., 'node-1')
                - Properties MUST include 'properties_type':
                    - Use 'firewall', 'database', 'api', 'storage' for respective types
                    - Use 'generic' for other types
                - Security messages MUST be list of dicts with 'severity' and 'message'
                - Severity levels MUST be: 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'

            Example of valid architecture response structure:
            {schema_example}

            3. For expert advice, response MUST include:
            - 'expert_message': Detailed advice
            - 'justification': Reasoning behind advice
            """
    
    async def _build_generic_query_prompt(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build enhanced prompt with context and requirements.
        """
        try:
            # Extract context information
            nodes_count = len(data.get("diagram_context", {}).get("nodes", []))
            edges_count = len(data.get("diagram_context", {}).get("edges", []))
            compliance_list = data.get("compliance_standards", [])
            compliance_str = ", ".join(compliance_list) if compliance_list else "None"
            
            # Build context section
            context = (
                f"## Architecture Context:\n"
                f"- Project ID: {data.get('project_id', 'N/A')}\n"
                f"- Current Nodes: {nodes_count}\n"
                f"- Current Connections: {edges_count}\n"
                f"- Required Compliance: {compliance_str}\n"
            )
            
            # Add current architecture details if available
            if "diagram_context" in data:
                context += "\n## Current Architecture:\n"
                for node in data["diagram_context"].get("nodes", []):
                    context += (
                        f"Node '{node.id}': "
                        f"- Type={node.type}, "
                        f"- Properties={json.dumps(node.properties, {})}\n"
                    )

            # Build final user message
            user_message = (
                f"{context}\n"
                f"## User Query:\n{data.get('query')}\n"
            )
            
            return {
                "context": context,
                "user_message": user_message
            }
            
        except Exception as e:
            logging.error(f"Error building prompt: {str(e)}")
            raise ValueError(f"Failed to build prompt: {str(e)}")
    

    # OpenAI
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def get_openai_response(self, prompt: str) -> Dict[str, Any]:
        url = self.openai_url
        api_key = self.openai_api_key
        client = httpx.AsyncClient(timeout=30.0)
        
        try :
            # Prepare request payload
            payload = {
                "model": "gpt-4",  
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a cybersecurity and software architecture expert specializing in API security, "
                            "network protection, and compliance (GDPR, PCI-DSS, ISO 27001), software development, "
                            "threat modeling, incident response, and Industry standard Securirty practices(NVD, CISA, CISA KEVIR, MITRE, etc.) etc.., "
                            "Always return responses in **structured JSON format**."
                        )
                    },
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.5,
                "max_tokens": 1000,
            }
            # Check rate limit
            if self.rate_counter >= self.rate_limit:
                raise RateLimitError("Rate limit exceeded. Please slow down your requests.")
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            # Log the request (optional for debugging)
            log_info(f"Sending request to OpenAI: {payload}")
            
            # Make API call
            response = await client.post(
                url,
                json=payload,
                headers=headers
            )
            # Update rate counter
            self.rate_counter += 1
            return response.json()
        except httpx.RequestError as e:
            raise LLMError(f"Network error: {str(e)}")
        except json.JSONDecodeError as e:
            raise LLMError(f"Invalid JSON response: {str(e)}")
        finally:
            # Reset rate counter after 1 minute
            if self.rate_counter > 0:
                await asyncio.sleep(60)

    # Claude
    async def get_claude_response(self, processed_request: Dict[str, Any], query_type: str = "generic_query") -> Dict[str, Any]:
        try:    
            # Build enhanced prompt
            if query_type == "generic_query":
                prompt_data = await self._build_generic_query_prompt(processed_request)
                # Prepare messages for the API call
            elif query_type == "security_analysis":
                prompt_data = await self._build_security_analysis_prompt(processed_request)
                # Prepare messages for the API call

            messages = [
                {
                    "role": "user",
                    "content": prompt_data["user_message"]
                }
            ]

            # If there's conversation history, include it
            messages.extend(self.conversation_history)
            log_info(f"Conversations: {messages}")

            # Generate response from LLM
            response = self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4096,
                system=self._build_generic_query_system_prompt() if query_type == "generic_query" else self._build_security_analysis_system_prompt(),
                messages = messages,
                temperature=0.3,
                # response_format={"type": "json_object"}
            )
            response_content = response.content[0].text
            log_info(f"Claude response: {response_content}")
            json_response = json.loads(response_content)  # Validate JSON structure

            # response = assistant_response.content[0].text
            self.conversation_history.append({
                "role": "assistant",
                "content": response_content
            })

            # Clear the conversation history if needed
            # self.clear_conversation()


            return json_response
        except json.JSONDecodeError as e:
            raise LLMError(f"Invalid JSON response: {str(e)}")
        except Exception as e:
            raise ValueError(f"Failed to get LLM response: {str(e)}")
    
    
    
    async def generate_response(self, processed_request: Dict[str, Any], model: str = "clude",query_type: str = "generic_query") -> Dict[str, Any]:
        """
        Generates a structured response from OpenAI's LLM.
        
        Args:
            prompt (str): The input prompt for the model.
            
        Returns:
            dict: Parsed JSON response from LLM
        """
        try:
            if model == "openai":
                log_info(f"Generating response from OpenAI")
                # Oopen AI 
                response = await self.get_openai_response(processed_request)
                log_info(f"OpenAI response: {response}")
            elif model == "claude":
                log_info(f"Generating response from Claude")
                # Claude
                response = await self.get_claude_response(processed_request, query_type=query_type)
                log_info(f"Claude response: {response}")

            return response
        except Exception as e:
            raise LLMError(f"Error generating response: {str(e)}")

llm_gateway = LLMGateway()
