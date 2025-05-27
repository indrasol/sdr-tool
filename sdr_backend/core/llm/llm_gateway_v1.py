import anthropic
import json
import re
import os
from typing import Dict, Any, Optional, List, Union, Literal
from config.settings import ANTHROPIC_API_KEY, OPENAI_API_KEY, GROK_API_KEY
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from utils.logger import log_info
import asyncio
from openai import OpenAI
from utils.llm_metrics import track_llm_metrics
from functools import wraps
import time
from core.prompt_engineering.prompt_builder import PromptBuilder
from core.llm.model_mapping import MODEL_MAPPING

# Constants
MAX_TOKENS = 4096  # Default max tokens
TEMPERATURE = 0.7  # Default temperature

class LLMService:
    """
    Service for interacting with various LLM providers (Anthropic, OpenAI, Grok).
    
    Provides methods for generating responses with built-in retry
    mechanisms for resilience and dynamic model selection.
    """
    def __init__(self):
        """
        Initialize the LLM service with connections to various providers.
        """
        self.anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY)
        self.grok_client = OpenAI(api_key=GROK_API_KEY, base_url="https://api.x.ai/v1")

    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((anthropic.APIError, anthropic.APITimeoutError))
    )
    @track_llm_metrics(endpoint="generate_response")
    async def generate_response(
        self, 
        prompt: str, 
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: Optional[bool] = None,
        timeout: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Generate a response to the given prompt using the Anthropic API.
        
        Args:
            prompt: The prompt to send to the model
            temperature: The temperature to use for generation (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            stream: Whether to force streaming for this request
            timeout: Optional timeout in seconds
            
        Returns:
            A dictionary containing the response text and usage information:
            {
                "content": "The response text",
                "usage": {
                    "input_tokens": 123,
                    "output_tokens": 456
                },
                "model_used": "claude-3-7-sonnet-20250219",
                "success": true
            }
        """
        # Resolve the model name from our mapping
        models = MODEL_MAPPING["anthropic"]
        model = models["default"]
        
        # Determine if this is likely a long-running request
        estimated_tokens = len(prompt.split()) + (max_tokens or MAX_TOKENS)
        is_long_request = estimated_tokens > 8000
        
        # For long requests, automatically use streaming unless explicitly set
        if is_long_request and stream is None:
            stream = True
            log_info(f"Automatically enabling streaming for potentially long response ({estimated_tokens} estimated tokens)")
        
        # Configure client options
        client_options = {}
        if timeout is not None:
            client_options["timeout"] = timeout
        
        try:
            if stream:
                # Using streaming
                full_response = ""
                response_chunks = []
                
                # Initialize usage metrics
                usage = {
                    "input_tokens": 0,
                    "output_tokens": 0
                }
                
                # Create streaming request
                stream_obj = self.anthropic_client.messages.create(
                    model=model,
                    max_tokens=max_tokens or MAX_TOKENS,
                    temperature=temperature or TEMPERATURE,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    stream=True,
                    **client_options
                )
                
                for chunk in stream_obj:
                    if chunk.type == 'content_block_start' and hasattr(chunk.content_block, 'type') and chunk.content_block.type == 'text':
                        continue
                    elif chunk.type == 'content_block_delta' and chunk.delta.type == 'text':
                        text_chunk = chunk.delta.text
                        full_response += text_chunk
                        response_chunks.append(text_chunk)
                    
                    # Capture usage if present in the chunk
                    if hasattr(chunk, 'usage'):
                        usage = {
                            "input_tokens": getattr(chunk.usage, 'input_tokens', 0),
                            "output_tokens": getattr(chunk.usage, 'output_tokens', 0)
                        }
                    
                    # Allow asyncio to yield control occasionally
                    await asyncio.sleep(0)
                
                # Make an estimate if usage wasn't provided
                if not usage["input_tokens"] and not usage["output_tokens"]:
                    estimated_tokens = len(prompt.split())
                    usage = {
                        "input_tokens": estimated_tokens,
                        "output_tokens": len(full_response.split()) * 1.3
                    }
                
                return {
                    "content": full_response,
                    "usage": usage,
                    "model_used": model,
                    "success": True
                }
            else:
                # Using non-streaming
                message = self.anthropic_client.messages.create(
                    model=model,
                    max_tokens=max_tokens or MAX_TOKENS,
                    temperature=temperature or TEMPERATURE,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    **client_options
                )
                
                content = message.content[0].text if message.content else ""
                
                # Extract usage information
                usage = {
                    "input_tokens": message.usage.input_tokens if hasattr(message, 'usage') and hasattr(message.usage, 'input_tokens') else 0,
                    "output_tokens": message.usage.output_tokens if hasattr(message, 'usage') and hasattr(message.usage, 'output_tokens') else 0
                }
                
                return {
                    "content": content,
                    "usage": usage,
                    "model_used": model,
                    "success": True
                }
        
        except Exception as e:
            log_info(f"Unexpected error in generate_response: {str(e)}")
            return {
                "content": f"Error: Unexpected error occurred: {str(e)}",
                "usage": {"input_tokens": 0, "output_tokens": 0},
                "model_used": model,
                "error": str(e),
                "error_type": "Unexpected error",
                "success": False
            }
    
    # @retry(
    #     stop=stop_after_attempt(3),
    #     wait=wait_exponential(multiplier=1, min=2, max=10),
    #     retry=retry_if_exception_type((anthropic.APIError, anthropic.APITimeoutError))
    # )
    # @track_llm_metrics(endpoint="structured_response")
    # async def generate_structured_response(
    #     self, 
    #     prompt: str, 
    #     with_thinking: bool = False,  # Kept for backward compatibility but ignored
    #     temperature: Optional[float] = None,
    #     max_tokens: Optional[int] = None,
    #     stream: Optional[bool] = None,
    #     timeout: Optional[float] = None
    # ) -> Dict[str, Any]:
    #     """
    #     Generate a structured JSON response from the LLM.
        
    #     Args:
    #         prompt: The prompt to send to the LLM
    #         with_thinking: Ignored parameter, kept for backward compatibility
    #         temperature: Optional temperature setting
    #         max_tokens: Optional max tokens limit
    #         stream: Whether to force streaming for this request
    #         timeout: Optional timeout in seconds
            
    #     Returns:
    #         A dictionary parsed from the JSON response, with usage information
    #     """
    #     # Initialize variables
    #     usage = {"input_tokens": 0, "output_tokens": 0}
    #     response_text = ""
        
    #     # Determine if this is likely a long-running request
    #     estimated_tokens = len(prompt.split()) + (max_tokens or MAX_TOKENS)
    #     is_long_request = estimated_tokens > 8000
        
    #     # For long requests, automatically use streaming unless explicitly set
    #     if is_long_request and stream is None:
    #         stream = True
    #         log_info(f"Automatically enabling streaming for potentially long structured response ({estimated_tokens} estimated tokens)")
        
    #     # Configure client options
    #     client_options = {}
    #     if timeout is not None:
    #         client_options["timeout"] = timeout
        
    #     formatted_prompt = f"""
    #     {prompt}
        
    #     Please respond with a valid JSON object that follows the structure specified above.
    #     Do not include any text outside of the JSON structure.
    #     Ensure the JSON is properly formatted and enclosed in triple backticks with json format indicator.
        
    #     Example format:
    #     ```json
    #     {{
    #         "message": "Your detailed response here",
    #         "confidence": 0.95
    #         // Additional fields as specified
    #     }}
    #     ```
    #     """
        
    #     try:
    #         if stream:
    #             # Handle streaming for long requests
    #             response_text = ""
    #             usage = {
    #                 "input_tokens": 0,
    #                 "output_tokens": 0
    #             }
    #             stream_obj = self.anthropic_client.messages.create(
    #                 model=model,
    #                 max_tokens=max_tokens or MAX_TOKENS,
    #                 temperature=temperature or TEMPERATURE,
    #                 messages=[
    #                     {"role": "user", "content": formatted_prompt}
    #                 ],
    #                 stream=True,
    #                 **client_options
    #             )
                
    #             for chunk in stream_obj:
    #                 if chunk.type == 'content_block_delta' and chunk.delta.type == 'text':
    #                     response_text += chunk.delta.text
    #                 # Capture usage if present
    #                 if hasattr(chunk, 'usage'):
    #                     if hasattr(chunk.usage, 'input_tokens'):
    #                         usage["input_tokens"] = chunk.usage.input_tokens
    #                     if hasattr(chunk.usage, 'output_tokens'):
    #                         usage["output_tokens"] = chunk.usage.output_tokens
    #                 await asyncio.sleep(0)
    #         else:
    #             # Non-streaming for shorter requests
    #             message = self.anthropic_client.messages.create(
    #                 model=model,
    #                 max_tokens=max_tokens or MAX_TOKENS,
    #                 temperature=temperature or TEMPERATURE,
    #                 messages=[
    #                     {"role": "user", "content": formatted_prompt}
    #                 ],
    #                 **client_options
    #             )
    #             response_text = message.content[0].text
                
    #             # Capture usage information
    #             usage = {
    #                 "input_tokens": message.usage.input_tokens if hasattr(message, 'usage') and hasattr(message.usage, 'input_tokens') else 0,
    #                 "output_tokens": message.usage.output_tokens if hasattr(message, 'usage') and hasattr(message.usage, 'output_tokens') else 0
    #             }
                
    #         # Extract JSON from the response
    #         extracted_json = self._extract_json(response_text)
    #         log_info(f"Extracted Json : {extracted_json}")
            
    #         # Add usage information
    #         extracted_json["usage"] = usage
    #         extracted_json["model_used"] = model
    #         extracted_json["success"] = True
            
    #         return extracted_json
            
    #     except anthropic.APITimeoutError as e:
    #         log_info(f"API timeout error in generate_structured_response: {str(e)}")
    #         # If we weren't streaming, try with streaming as fallback
    #         if not stream:
    #             log_info("Retrying with streaming enabled due to timeout")
    #             return await self.generate_structured_response(
    #                 prompt=prompt,
    #                 temperature=temperature,
    #                 max_tokens=max_tokens,
    #                 stream=True,
    #                 timeout=timeout
    #             )
    #         return {
    #             "message": f"Error: API timeout error occurred: {str(e)}",
    #             "error": str(e),
    #             "error_type": "API timeout",
    #             "success": False
    #         }
    #     except ValueError as e:
    #         log_info(f"Value error in generate_structured_response: {str(e)}")
    #         if "operations that may take longer than 10 minutes" in str(e):
    #             log_info("Retrying with streaming due to potential long operation")
    #             # Retry with streaming explicitly enabled
    #             return await self.generate_structured_response(
    #                 prompt=prompt,
    #                 temperature=temperature,
    #                 max_tokens=max_tokens,
    #                 stream=True,
    #                 timeout=timeout
    #             )
    #         return {
    #             "message": f"Error: Value error occurred: {str(e)}",
    #             "error": str(e),
    #             "error_type": "Value error",
    #             "success": False
    #         }
    #     except Exception as e:
    #         log_info(f"Unexpected error in generate_structured_response: {str(e)}")
    #         return {
    #             "message": f"Error: Unexpected error occurred: {str(e)}",
    #             "error": str(e),
    #             "error_type": "Unexpected error",
    #             "success": False
    #         }
    
    # def _extract_json(self, response_text: str) -> Dict[str, Any]:
    #     """
    #     Extract JSON from LLM response text.
        
    #     Handles various formats that the LLM might return JSON in,
    #     including nested JSON inside message fields and truncated JSON.
    #     """
    #     # Try to find JSON within code blocks
    #     json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', response_text, re.DOTALL)
        
    #     if json_match:
    #         json_str = json_match.group(1)
    #     else:
    #         # If no JSON in code blocks, try to find JSON-like structure
    #         json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
    #         if json_match:
    #             json_str = json_match.group(0)
    #         else:
    #             # Fallback if no JSON-like structure found
    #             return {"message": response_text, "confidence": 0.5}
        
    #     try:
    #         # Try to parse as is first
    #         json_data = json.loads(json_str)
            
    #         # Handle the case where JSON contains nested JSON in a message field
    #         if isinstance(json_data, dict) and "message" in json_data and isinstance(json_data["message"], str):
    #             log_info(f"Found message field with text length: {len(json_data['message'])}")
                
    #             # Check for code blocks in message
    #             nested_json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', json_data["message"], re.DOTALL)
    #             if nested_json_match:
    #                 try:
    #                     nested_json_str = nested_json_match.group(1)
    #                     nested_json = json.loads(nested_json_str)
                        
    #                     # If nested JSON has a "threats" field, merge it with the original
    #                     if "threats" in nested_json and isinstance(nested_json["threats"], list):
    #                         log_info(f"Found nested JSON with {len(nested_json['threats'])} threats in message field")
    #                         json_data["threats"] = nested_json["threats"]
                            
    #                         # Also copy severity counts if available
    #                         if "severity_counts" in nested_json and isinstance(nested_json["severity_counts"], dict):
    #                             json_data["severity_counts"] = nested_json["severity_counts"]
    #                 except json.JSONDecodeError as nested_e:
    #                     # The nested JSON might be truncated - try to extract threats array
    #                     log_info(f"Error parsing nested JSON in message, attempting to extract threats array: {str(nested_e)}")
    #                     threats_match = re.search(r'"threats"\s*:\s*\[(.*?)(?:\]\s*}|$)', nested_json_match.group(1), re.DOTALL)
    #                     if threats_match:
    #                         try:
    #                             # Extract threats array with proper JSON wrapping
    #                             threats_str = '{"threats":[' + threats_match.group(1) + ']}'
    #                             # Fix potential truncation by adding closing brackets if needed
    #                             if not threats_str.endswith("]}"):
    #                                 last_complete_threat = threats_str.rfind("},")
    #                                 if last_complete_threat > 0:
    #                                     threats_str = threats_str[:last_complete_threat+1] + "]}"
                                
    #                             threats_data = json.loads(threats_str)
    #                             if "threats" in threats_data and len(threats_data["threats"]) > 0:
    #                                 log_info(f"Successfully extracted {len(threats_data['threats'])} threats from truncated JSON")
    #                                 json_data["threats"] = threats_data["threats"]
    #                         except Exception as e:
    #                             log_info(f"Failed to extract threats array from truncated JSON: {str(e)}")
    #                 except Exception as e:
    #                     log_info(f"Error processing nested JSON in message: {str(e)}")
    #             else:
    #                 # Try to extract threats array directly from the message text
    #                 threats_match = re.search(r'"threats"\s*:\s*\[(.*?)(?:\]\s*}|$)', json_data["message"], re.DOTALL)
    #                 if threats_match:
    #                     try:
    #                         threats_str = '{"threats":[' + threats_match.group(1) + ']}'
    #                         # Fix potential truncation by adding closing brackets if needed
    #                         if not threats_str.endswith("]}"):
    #                             last_complete_threat = threats_str.rfind("},")
    #                             if last_complete_threat > 0:
    #                                 threats_str = threats_str[:last_complete_threat+1] + "]}"
                            
    #                         threats_data = json.loads(threats_str)
    #                         if "threats" in threats_data and len(threats_data["threats"]) > 0:
    #                             log_info(f"Extracted {len(threats_data['threats'])} threats directly from message text")
    #                             json_data["threats"] = threats_data["threats"]
    #                     except Exception as e:
    #                         log_info(f"Failed to extract threats directly from message text: {str(e)}")
                    
    #                 # Also extract severity counts if available
    #                 severity_match = re.search(r'"severity_counts"\s*:\s*(\{[^}]+\})', json_data["message"], re.DOTALL)
    #                 if severity_match:
    #                     try:
    #                         severity_str = severity_match.group(1)
    #                         severity_data = json.loads(severity_str)
    #                         json_data["severity_counts"] = severity_data
    #                         log_info(f"Extracted severity counts from message text")
    #                     except Exception as e:
    #                         log_info(f"Failed to extract severity counts from message text: {str(e)}")
            
    #         return json_data
    #     except json.JSONDecodeError as e:
    #         log_info(f"Initial JSON decode error: {str(e)}, attempting recovery...")
            
    #         # Try to fix common JSON issues
    #         fixed_json_str = self._fix_json_string(json_str)
            
    #         # Try to extract the threats array directly if the JSON is truncated
    #         threats_match = re.search(r'"threats"\s*:\s*\[(.*?)(?:\]\s*}|$)', json_str, re.DOTALL)
    #         severity_match = re.search(r'"severity_counts"\s*:\s*(\{[^}]+\})', json_str, re.DOTALL)
    #         message_match = re.search(r'"message"\s*:\s*"([^"]+)"', json_str, re.DOTALL)
            
    #         if threats_match or severity_match:
    #             recovered_data = {"message": "", "confidence": 0.5}
                
    #             # Extract message if available
    #             if message_match:
    #                 try:
    #                     recovered_data["message"] = message_match.group(1)
    #                 except Exception as msg_e:
    #                     log_info(f"Failed to extract message: {str(msg_e)}")
                
    #             # Extract threats array
    #             if threats_match:
    #                 try:
    #                     threats_str = '{"threats":[' + threats_match.group(1) + ']}'
    #                     # Fix potential truncation
    #                     if not threats_str.endswith("]}"):
    #                         last_complete_threat = threats_str.rfind("},")
    #                         if last_complete_threat > 0:
    #                             threats_str = threats_str[:last_complete_threat+1] + "]}"
                        
    #                     threats_data = json.loads(threats_str)
    #                     if "threats" in threats_data and len(threats_data["threats"]) > 0:
    #                         log_info(f"Recovered {len(threats_data['threats'])} threats from truncated JSON")
    #                         recovered_data["threats"] = threats_data["threats"]
    #                 except Exception as t_e:
    #                     log_info(f"Failed to recover threats array: {str(t_e)}")
                
    #             # Extract severity counts
    #             if severity_match:
    #                 try:
    #                     severity_str = '{' + severity_match.group(1) + '}'
    #                     severity_str = severity_str.replace('{', '{"severity_counts":{')
    #                     severity_str = severity_str.replace('}', '}}')
    #                     severity_data = json.loads(severity_str)
    #                     if "severity_counts" in severity_data:
    #                         log_info(f"Recovered severity counts from truncated JSON")
    #                         recovered_data["severity_counts"] = severity_data["severity_counts"]
    #                 except Exception as s_e:
    #                     log_info(f"Failed to recover severity counts: {str(s_e)}")
                
    #             # If we recovered any threats, return the recovered data
    #             if "threats" in recovered_data:
    #                 log_info(f"Returning recovered data with {len(recovered_data.get('threats', []))} threats")
    #                 return recovered_data
            
    #         # Standard fix attempt if recovery failed
    #         try:
    #             return json.loads(fixed_json_str)
    #         except json.JSONDecodeError:
    #             # Fallback for parsing failures
    #             log_info(f"JSON decode error after fixes: {str(e)}. Response: {response_text[:200]}...")
    #             return {"message": response_text, "confidence": 0.5}
    
    # def _fix_json_string(self, json_str: str) -> str:
    #     """
    #     Attempt to fix common JSON formatting issues.
    #     """
    #     # Remove trailing commas in objects and arrays
    #     json_str = re.sub(r',\s*}', '}', json_str)
    #     json_str = re.sub(r',\s*]', ']', json_str)
        
    #     # Replace single quotes with double quotes (if not within double quotes)
    #     in_string = False
    #     result = []
    #     i = 0
    #     while i < len(json_str):
    #         if json_str[i] == '"':
    #             in_string = not in_string
            
    #         if not in_string and json_str[i] == "'":
    #             result.append('"')
    #         else:
    #             result.append(json_str[i])
            
    #         i += 1
            
    #     return ''.join(result)
            
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), retry=retry_if_exception_type(Exception))
    @track_llm_metrics(endpoint="analyze_diagram")
    async def analyze_diagram(self, diagram_content: dict, model_provider: str = "openai", model_name: str = "gpt-4.1") -> Dict[str, Any]:
        """
        Analyze diagram content (nodes and edges) to create a full narrative
        
        Args:
            diagram_content: Dictionary containing nodes and edges
            model_provider: Which LLM provider to use (openai or anthropic)
            model_name: Which model to use
            
        Returns:
            Dictionary with data flow description and metadata
        """
        prompt_builder = PromptBuilder()
        log_info("Entered Analyze Diagram")
        system_prompt, user_prompt = await prompt_builder.build_analyze_diagram_prompt(diagram_content)
        
        try:
            if model_provider == "openai": 
                # Use our new generate_openai_response method
                response = await self.generate_openai_response(
                    prompt=user_prompt,
                    system_prompt=system_prompt,
                    model_name=model_name,
                    temperature=0.1,
                    max_tokens=2500
                )

            elif model_provider == "anthropic": 
                # Use our new generate_openai_response method
                response = await self.generate_anthropic_response(
                    prompt=user_prompt,
                    system_prompt=system_prompt,
                    model_name=model_name,
                    temperature=0.1,
                    max_tokens=2500
                )
            else:
                # Default to OpenAI if provider not specified
                response = await self.generate_openai_response(
                    prompt=user_prompt,
                    system_prompt=system_prompt,
                    model_name="gpt-4.1",
                    temperature=0.1,
                    max_tokens=2500
                )
            
            if response["success"]:
                return {
                    "data_flow_description": response["content"],
                    "usage": response["usage"],
                    "model_used": response["model_used"],
                    "success": True
                }
            else:
                return {
                    "data_flow_description": f"Error analyzing diagram: {response.get('error', 'Unknown error')}",
                    "error": response.get("error", "Unknown error"),
                    "success": False
                }
                
        except Exception as e:
            error_message = str(e)
            log_info(f"Error in analyze_diagram: {error_message}")
            
            return {
                "data_flow_description": f"Error analyzing diagram: {str(e)}",
                "error": str(e),
                "success": False
            }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(Exception)
    )
    @track_llm_metrics(endpoint="generate_openai")
    async def generate_openai_response(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        model_name: str = "gpt-4.1",
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: Optional[bool] = None,
        timeout: Optional[float] = 60 # 1 minute
    ) -> Dict[str, Any]:
        """
        Generate a response using OpenAI API.
        
        Args:
            prompt: The prompt to send to the model
            system_prompt: Optional system prompt to include
            model_name: The OpenAI model to use (defaults to gpt-4.1-mini)
            temperature: The temperature for generation (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            stream: Whether to use streaming for the request
            timeout: Optional timeout in seconds
            
        Returns:
            A dictionary containing the response text and usage information:
            {
                "content": "The response text",
                "usage": {
                    "prompt_tokens": 123,
                    "completion_tokens": 456,
                    "total_tokens": 579
                },
                "model_used": "gpt-4.1-mini",
                "success": true
            }
        """
        # Set default system prompt if not provided
        if system_prompt is None or system_prompt == "":
            system_prompt = "You are a helpful assistant that provides accurate and concise responses."
        
        # Create messages array with proper checks
        messages = []
        if system_prompt and isinstance(system_prompt, str):
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        # Determine which client to use based on the model
        client = self.openai_client
        
        # Handle model selection more safely
        try:
            models = MODEL_MAPPING["openai"]
            # Use the model name directly if it's not in our mapping
            if model_name in models:
                model = models[model_name]
            else:
                model = model_name
        except (KeyError, TypeError) as e:
            log_info(f"Error in model mapping: {str(e)}, using model_name directly")
            model = model_name
            
        log_info(f"Using OpenAI compatible model: {model}")
            
        # Determine if this is likely a long-running request
        estimated_tokens = len(prompt.split()) + (max_tokens or MAX_TOKENS)
        is_long_request = estimated_tokens > 7000
        
        # For long requests, automatically use streaming unless explicitly set
        if is_long_request and stream is None:
            stream = True
            log_info(f"Automatically enabling streaming for potentially long OpenAI response ({estimated_tokens} estimated tokens)")
            
        try:
            if stream:
                # Handle streaming response
                full_response = ""
                log_info(f"Entered Open AI stream")
                
                try:
                    # Create streaming request
                    stream_response = client.chat.completions.create(
                        model=model,
                        messages=messages,
                        temperature=temperature or TEMPERATURE,
                        max_tokens=max_tokens or MAX_TOKENS,
                        stream=True,
                        timeout=timeout or 60  # Use provided timeout or default to 1 minute
                    )
                    
                    # Process the streaming response according to OpenAI docs
                    for chunk in stream_response:
                        # Only extract content if the delta contains it
                        if (hasattr(chunk, 'choices') and 
                            len(chunk.choices) > 0 and 
                            hasattr(chunk.choices[0], 'delta') and 
                            hasattr(chunk.choices[0].delta, 'content') and 
                            chunk.choices[0].delta.content is not None):
                            
                            content_delta = chunk.choices[0].delta.content
                            full_response += content_delta
                        
                        # Allow asyncio to yield control occasionally
                        await asyncio.sleep(0)
                    
                    estimated_input_tokens = int(len(prompt.split()) * 1.33) + int(len(system_prompt.split()) * 1.33)
                    estimated_output_tokens = int(len(full_response.split()) * 1.33)
                    
                    usage = {
                        "prompt_tokens": estimated_input_tokens,
                        "completion_tokens": estimated_output_tokens,
                        "total_tokens": estimated_input_tokens + estimated_output_tokens
                    }
                    
                    log_info(f"OpenAI streaming response completed. Estimated {usage['total_tokens']} tokens used.")
                    
                    return {
                        "content": full_response,
                        "usage": usage,
                        "model_used": model,
                        "success": True
                    }
                except Exception as stream_e:
                    log_info(f"Error in streaming request: {str(stream_e)}")
                    raise stream_e  # Re-raise to let the retry decorator handle it
            
            else:
                log_info(f"Entered Open AI Non stream")
                # Make the non-streaming request
                completion = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature or TEMPERATURE,
                    max_tokens=max_tokens or MAX_TOKENS,
                    timeout=timeout or 60  # Use provided timeout or default to 1 minute
                )
                log_info(f"non stream openai raw response : ")
            
                # Extract content from the response
                content = ""
                if hasattr(completion, 'choices') and len(completion.choices) > 0:
                    choice = completion.choices[0]
                    if hasattr(choice, 'message') and hasattr(choice.message, 'content'):
                        content = choice.message.content
                    else:
                        log_info("Missing message.content in completion response")
                else:
                    log_info("No choices in completion response")

                # Extract usage statistics
                usage = {
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0
                }
                if hasattr(completion, 'usage'):
                    usage = {
                        "prompt_tokens": getattr(completion.usage, 'prompt_tokens', 0),
                        "completion_tokens": getattr(completion.usage, 'completion_tokens', 0),
                        "total_tokens": getattr(completion.usage, 'total_tokens', 0)
                    }
                else:
                    # Fallback if usage stats aren't available
                    estimated_input_tokens = int(len(prompt.split()) * 1.33) + int(len(system_prompt.split()) * 1.33)
                    estimated_output_tokens = int(len(content.split()) * 1.33)
                    usage = {
                        "prompt_tokens": estimated_input_tokens,
                        "completion_tokens": estimated_output_tokens,
                        "total_tokens": estimated_input_tokens + estimated_output_tokens
                    }
            
                log_info(f"OpenAI response generated successfully. Used {usage['total_tokens']} tokens.")
                log_info(f"Openai Response : {content}")
                
                return {
                    "content": content,
                    "usage": usage,
                    "model_used": model,
                    "success": True
                }
        except Exception as e:
            error_message = str(e)
            log_info(f"Error in generate_openai_response: {error_message}")
            
            # If we're not already streaming, try with streaming as a fallback
            if not stream:
                try:
                    log_info("Attempting fallback to streaming due to error")
                    return await self.generate_openai_response(
                        prompt=prompt,
                        system_prompt=system_prompt,
                        model_name=model_name,  # Use model_name, not model
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=True,
                        timeout=timeout
                    )
                except Exception as fallback_error:
                    log_info(f"Streaming fallback also failed: {str(fallback_error)}")
            
            # Return a proper error response
            return {
                "content": f"Error generating response: {str(e)}",
                "error": str(e),
                "error_type": "API Error",
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                "model_used": model,
                "success": False
            }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((anthropic.APIError, anthropic.APITimeoutError))
    )
    @track_llm_metrics(endpoint="generate_anthropic")
    async def generate_anthropic_response(
        self, 
        prompt: str, 
        model_name: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: Optional[bool] = None,
        timeout: Optional[float] = 60
    ) -> Dict[str, Any]:
        """
        Generate a response using Anthropic Claude API.
        
        Args:
            prompt: The prompt to send to the model
            system_prompt: Optional system prompt to include
            model_name: The Anthropic model to use (defaults to claude-3-7-sonnet)
            temperature: The temperature for generation (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            stream: Whether to use streaming for the request
            timeout: Optional timeout in seconds
            
        Returns:
            Dictionary containing the response and metadata
        """
        # Resolve the model name from our mapping if needed
        client = self.anthropic_client
        models = MODEL_MAPPING["anthropic"]
        
        model = models[model_name]
        
        # Set default system prompt if not provided
        if system_prompt is None or system_prompt == "":
            system_prompt = "You are a helpful assistant that provides accurate and concise responses."
        
        # Create the API request parameters
        api_params = {
            "model": model,
            "max_tokens": max_tokens or MAX_TOKENS,
            "temperature": temperature or TEMPERATURE,
            "messages": [{"role": "user", "content": prompt}]
        }
        log_info(f"API Request : {api_params}")
        
        # Add system parameter for Claude if provided (Claude requires it as a separate parameter)
        if system_prompt and isinstance(system_prompt, str):
            api_params["system"] = system_prompt
            
        log_info(f"Using Anthropic model: {model}")
        
       # Determine if this is likely a long-running request
        estimated_tokens = len(prompt.split()) + (max_tokens or MAX_TOKENS)
        is_long_request = estimated_tokens > 8000
        
        # For long requests, automatically use streaming unless explicitly set
        if is_long_request and stream is None:
            stream = True
            log_info(f"Automatically enabling streaming for potentially long response ({estimated_tokens} estimated tokens)")
        
        # Configure client options
        client_options = {}
        if timeout is not None:
            client_options["timeout"] = timeout
        
        try:
            if stream:
                # Using streaming
                full_response = ""
                response_chunks = []
                
                # Initialize usage metrics
                usage = {
                    "input_tokens": 0,
                    "output_tokens": 0
                }
                
                # Create streaming request
                stream_obj = client.messages.create(
                    **api_params,
                    stream=True,
                    **client_options
                )
                
                
                for chunk in stream_obj:
                    if chunk.type == 'content_block_start' and hasattr(chunk.content_block, 'type') and chunk.content_block.type == 'text':
                        continue
                    elif chunk.type == 'content_block_delta' and chunk.delta.type == 'text':
                        text_chunk = chunk.delta.text
                        full_response += text_chunk
                        response_chunks.append(text_chunk)
                    
                    # log_info(f"streaming reponse : {full_response}")
                    
                    # Capture usage if present in the chunk
                    if hasattr(chunk, 'usage'):
                        usage = {
                            "input_tokens": getattr(chunk.usage, 'input_tokens', 0),
                            "output_tokens": getattr(chunk.usage, 'output_tokens', 0)
                        }
                    
                    # Allow asyncio to yield control occasionally
                    await asyncio.sleep(0)
                
                log_info(f"Streaming Response : {full_response}")
                # Make an estimate if usage wasn't provided
                if not usage["input_tokens"] and not usage["output_tokens"]:
                    estimated_tokens = len(prompt.split())
                    usage = {
                        "input_tokens": estimated_tokens,
                        "output_tokens": len(full_response.split()) * 1.3
                    }
                log_info(f"Anthropic Response : {full_response}")
                
                return {
                    "content": full_response,
                    "usage": usage,
                    "model_used": model,
                    "success": True
                }
            else:
                # Using non-streaming
                message = client.messages.create(
                    **api_params,
                    **client_options
                )
                
                content = message.content[0].text if message.content else ""
                
                # Extract usage information
                usage = {
                    "input_tokens": message.usage.input_tokens if hasattr(message, 'usage') and hasattr(message.usage, 'input_tokens') else 0,
                    "output_tokens": message.usage.output_tokens if hasattr(message, 'usage') and hasattr(message.usage, 'output_tokens') else 0
                }
                
                return {
                    "content": content,
                    "usage": usage,
                    "model_used": model,
                    "success": True
                }
        
        except Exception as e:
            log_info(f"Unexpected error in generate_response: {str(e)}")
            return {
                "content": f"Error: Unexpected error occurred: {str(e)}",
                "usage": {"input_tokens": 0, "output_tokens": 0},
                "model_used": model_name,
                "success": False,
                "error": str(e)
            }
    
    async def generate_llm_response(
        self, 
        prompt: str, 
        model_name: str,
        system_prompt: Optional[str] = None,
        model_provider: str = "anthropic",
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: Optional[bool] = None,
        timeout: Optional[float] = 60
    ) -> Dict[str, Any]:
        

        if model_provider == "anthropic":
            log_info(f"Model name : {model_name}")
            response = await self.generate_anthropic_response(
                prompt=prompt, 
                model_name = model_name,
                temperature = temperature,
                max_tokens = max_tokens,
                stream = stream,
                timeout = timeout
            )
        elif model_provider == "openai":
            response = await self.generate_openai_response(
                prompt=prompt, 
                model_name = model_name,
                temperature = temperature,
                max_tokens = max_tokens,
                stream = stream,
                timeout = timeout
            )
        return response
        

        