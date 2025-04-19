import anthropic
import json
import re
from typing import Dict, Any, Optional, Tuple
from config.settings import ANTHROPIC_API_KEY, OPENAI_API_KEY, GROK_API_KEY
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import logging
from utils.logger import log_info
import asyncio
from openai import OpenAI
from utils.llm_metrics import track_llm_metrics

# Constants
MAX_TOKENS = 4096  # Default max tokens
TEMPERATURE = 0.7  # Default temperature
DEFAULT_THINKING_BUDGET = 4096  # Default thinking budget

class LLMService:
    """
    Service for interacting with LLM.
    
    Provides methods for generating responses with built-in retry
    mechanisms for resilience.
    """
    def __init__(self):
        """
        Initialize the LLM service.
        
        Args:
            api_key: The API key for the LLM provider
            model: The model identifier to use
        # """
        # self.client = anthropic.Client(api_key=ANTHROPIC_API_KEY)
        self.anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.openai_api_key = OPENAI_API_KEY
        self.grok_api_key = GROK_API_KEY
        
        # Initialize OpenAI clients - we're using openai==1.10.0 and httpx<0.25.0 which are compatible
        try:
            self.openai_client = OpenAI(api_key=OPENAI_API_KEY)
            self.grok_client = OpenAI(api_key=GROK_API_KEY, base_url="https://api.x.ai/v1")
        except TypeError as e:
            # Log the error and try initializing without unsupported parameters
            log_info(f"Error initializing OpenAI clients: {str(e)}")
            from openai import Client
            self.openai_client = Client(api_key=OPENAI_API_KEY)
            self.grok_client = Client(api_key=GROK_API_KEY, base_url="https://api.x.ai/v1")

        self.model = "claude-3-7-sonnet-20250219"
        # Default thinking budget - minimum allowed is 1,024 tokens
        self.default_thinking_budget = 4096  # Starting with a modest budget
    
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
                    model=self.model,
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
                    "model_used": self.model,
                    "success": True
                }
            else:
                # Using non-streaming
                message = self.anthropic_client.messages.create(
                    model=self.model,
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
                    "model_used": self.model,
                    "success": True
                }
        
        except Exception as e:
            log_info(f"Unexpected error in generate_response: {str(e)}")
            return {
                "content": f"Error: Unexpected error occurred: {str(e)}",
                "usage": {"input_tokens": 0, "output_tokens": 0},
                "model_used": self.model,
                "success": False,
                "error": str(e),
                "error_type": "Unexpected error"
            }
    
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((anthropic.APIError, anthropic.APITimeoutError))
    )
    @track_llm_metrics(endpoint="generate_with_thinking")
    async def generate_response_with_thinking(
        self, 
        prompt: str, 
        thinking_budget: Optional[int] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        stream: Optional[bool] = None,
        timeout: Optional[float] = None
    ) -> Tuple[str, str, Dict[str, Any]]:
        """
        Generate a response with explicit extended thinking.
        
        Args:
            prompt: The prompt to send to the LLM
            thinking_budget: Optional token budget for thinking (min 1,024)
            max_tokens: Optional max tokens limit for final response
            temperature: Optional temperature setting
            stream: Whether to force streaming for this request
            timeout: Optional timeout in seconds
            
        Returns:
            A tuple containing (thinking_process, final_response, metadata)
            metadata includes usage statistics and other information
        """
        # Initialize variables to avoid "referenced before assignment" errors
        thinking = ""
        final_response = ""
        has_redacted_thinking = False
        usage = {"input_tokens": 0, "output_tokens": 0}
        
        # Ensure we have at least a minimum thinking budget
        if not thinking_budget or thinking_budget < 1024:
            log_info(f"Thinking budget {thinking_budget} is below minimum. Using 1,024 tokens.")
            thinking_budget = 1024
        
        # Ensure max_tokens is significantly larger than thinking_budget
        # Claude API requires max_tokens > thinking_budget
        if not max_tokens:
            # Add a buffer to ensure max_tokens is larger than thinking_budget
            max_tokens = thinking_budget + MAX_TOKENS  # Add default MAX_TOKENS for final response
        
        # Always validate that max_tokens is greater than thinking_budget
        if max_tokens <= thinking_budget:
            # Ensure max_tokens is larger than thinking_budget by at least 1,000 tokens
            buffer = 1000
            max_tokens = thinking_budget + buffer
            log_info(f"Adjusted max_tokens to {max_tokens} (thinking_budget {thinking_budget} + buffer {buffer})")
        
        log_info(f"Using thinking_budget: {thinking_budget}, max_tokens: {max_tokens}")
        
        # Determine if this is likely a long-running request
        estimated_tokens = len(prompt.split()) + thinking_budget + max_tokens
        is_long_request = estimated_tokens > 8000
        
        # For long requests, automatically use streaming unless explicitly set
        if is_long_request and stream is None:
            stream = True
            log_info(f"Automatically enabling streaming for thinking ({estimated_tokens} estimated tokens)")
        
        # Force streaming if explicitly requested
        if stream is True:
            is_long_request = True
        
        try:
            # Configure client options
            client_options = {}
            if timeout is not None:
                client_options["timeout"] = timeout
            
            # When using thinking, temperature must be set to 1
            # as per the error message and documentation
            temperature = 1.0
            
            # Use Anthropic's official extended thinking support
            if is_long_request:
                # Handle streaming with thinking
                metadata = {"has_redacted_thinking": False, "signatures": []}
                
                log_info(f"Creating stream with thinking budget: {thinking_budget}, max_tokens: {max_tokens}")
                stream_obj = self.anthropic_client.messages.create(
                    model=self.model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    thinking={"type": "enabled", "budget_tokens": thinking_budget},
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    stream=True,
                    **client_options
                )

                log_info(f"Stream created successfully: {type(stream_obj)}")
                
                # To track the text being collected from each content block
                current_content_block_text = ""
                
                for chunk_idx, chunk in enumerate(stream_obj):
                    # Log first few chunks for debugging
                    # if chunk_idx < 5 or chunk_idx % 50 == 0:
                        # log_info(f"Chunk #{chunk_idx}: type={chunk.type}")
                    
                    # Process thinking chunks
                    if chunk.type == 'thinking':
                        thinking += chunk.thinking
                        if hasattr(chunk, 'signature'):
                            metadata["signatures"].append(chunk.signature)
                    
                    # Process redacted thinking
                    elif chunk.type == 'redacted_thinking':
                        thinking += "[Redacted thinking block]"
                        metadata["has_redacted_thinking"] = True
                        if hasattr(chunk, 'data'):
                            metadata["redacted_data"] = chunk.data
                    
                    # Handle content_block_delta chunks - critical for response text
                    elif chunk.type == 'content_block_delta':
                        # Log detailed structure of first few deltas to debug
                        if chunk_idx < 3:
                            log_info(f"Content delta structure: {dir(chunk)}")
                            if hasattr(chunk, 'delta'):
                                log_info(f"Delta structure: {dir(chunk.delta)}")
                                log_info(f"Delta type: {getattr(chunk.delta, 'type', 'unknown')}")
                        
                        # Extract text from delta
                        if hasattr(chunk, 'delta'):
                            # Check for text type
                            if hasattr(chunk.delta, 'type') and chunk.delta.type == 'text':
                                if hasattr(chunk.delta, 'text'):
                                    delta_text = chunk.delta.text
                                    current_content_block_text += delta_text
                                    if chunk_idx < 3:
                                        log_info(f"Added delta text: '{delta_text[:30]}...'")
                            
                            # Direct attribute access for text
                            elif hasattr(chunk.delta, 'text'):
                                delta_text = chunk.delta.text
                                current_content_block_text += delta_text
                                if chunk_idx < 3:
                                    log_info(f"Added direct delta text: '{delta_text[:30]}...'")
                    
                    # End of content block - add accumulated text to final response
                    elif chunk.type == 'content_block_stop':
                        if current_content_block_text:
                            final_response += current_content_block_text
                            log_info(f"Added complete content block: {len(current_content_block_text)} chars")
                            current_content_block_text = ""  # Reset for next block
                    
                    # Handle message_start which can contain complete content
                    elif chunk.type == 'message_start':
                        if hasattr(chunk, 'message') and hasattr(chunk.message, 'content'):
                            for content_item in chunk.message.content:
                                if isinstance(content_item, dict) and content_item.get('type') == 'text':
                                    message_text = content_item.get('text', '')
                                    final_response += message_text
                                    log_info(f"Added message text: {len(message_text)} chars")
                    
                    # Yield control to event loop
                    await asyncio.sleep(0)
                
                # Add any remaining content block text
                if current_content_block_text:
                    final_response += current_content_block_text
                    log_info(f"Added remaining content block: {len(current_content_block_text)} chars")
                
                # Capture usage information if available
                if hasattr(chunk, 'usage'):
                    if hasattr(chunk.usage, 'input_tokens'):
                        usage["input_tokens"] = chunk.usage.input_tokens
                    if hasattr(chunk.usage, 'output_tokens'):
                        usage["output_tokens"] = chunk.usage.output_tokens
                
                await asyncio.sleep(0)  # Yield control occasionally
            
            # If thinking is longer than 60 characters and ends with "...", mark as redacted
            if len(thinking) > 60 and thinking.strip().endswith("..."):
                has_redacted_thinking = True
                log_info("Thinking appears to be truncated. Marking as redacted.")
            
            # Extract any tool signatures if present in the tools
            # for tool_use in tool_uses:
            #     signature_match = re.search(r'signature:\s*([a-zA-Z0-9+/=]+)', tool_use)
            #     if signature_match:
            #         signatures.append(signature_match.group(1))
            
            # If usage wasn't captured in streaming, make a rough estimate
            if not usage["input_tokens"] and not usage["output_tokens"]:
                # Make rough estimates of token counts
                input_tokens = len(prompt.split())
                thinking_tokens = len(thinking.split())
                response_tokens = len(final_response.split())
                
                usage = {
                    "input_tokens": input_tokens,
                    "output_tokens": thinking_tokens + response_tokens
                }
            
            # Return the thinking process, final response, and metadata
            metadata = {
                "usage": {
                    "input_tokens": usage.get("input_tokens", 0),
                    "output_tokens": usage.get("output_tokens", 0)
                },
                "has_redacted_thinking": has_redacted_thinking,
                "model_used": self.model,
                # "signatures": signatures,
                "success": True
            }
            
            return thinking, final_response, metadata
            
        except anthropic.APITimeoutError as e:
            log_info(f"API timeout error in extended thinking: {str(e)}")
            # If we weren't streaming, try with streaming as fallback
            if not stream:
                log_info("Retrying with streaming enabled for extended thinking")
                return await self.generate_response_with_thinking(
                    prompt=prompt,
                    thinking_budget=thinking_budget,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    stream=True,
                    timeout=timeout
                )
            else:
                # If already using streaming and still timing out, generate error response
                error_message = f"API timeout error in extended thinking: {str(e)}"
                
                # Report what we collected so far if anything
                if thinking:
                    log_info(f"Returning partial thinking ({len(thinking.split())} words) due to timeout")
                    
                    # Make rough estimates of token counts
                    input_tokens = len(prompt.split())
                    thinking_tokens = len(thinking.split())
                    response_tokens = 0  # No final response in timeout case
                    
                    usage = {
                        "input_tokens": input_tokens,
                        "output_tokens": thinking_tokens + response_tokens
                    }
                    
                    metadata = {
                        "usage": usage,
                        "has_redacted_thinking": True,  # Mark as redacted due to timeout
                        "error": str(e),
                        "error_type": "API timeout",
                        "model_used": self.model,
                        "success": False
                    }
                    
                    return thinking, error_message, metadata
                else:
                    # If no thinking collected, return minimal error response
                    usage = {
                        "input_tokens": len(prompt.split()),
                        "output_tokens": 0
                    }
                    
                    metadata = {
                        "usage": usage,
                        "has_redacted_thinking": False,
                        "error": str(e),
                        "error_type": "API timeout",
                        "model_used": self.model,
                        "success": False
                    }
                    
                    return "", error_message, metadata
                    
        except ValueError as e:
            log_info(f"Value error in extended thinking: {str(e)}")
            if "operations that may take longer than 10 minutes" in str(e):
                log_info("Retrying with streaming due to potential long operation")
                # Retry with streaming explicitly enabled
                return await self.generate_response_with_thinking(
                    prompt=prompt,
                    thinking_budget=thinking_budget,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    stream=True,
                    timeout=timeout
                )
            else:
                # For other value errors, return error
                error_message = f"Value error in extended thinking: {str(e)}"
                
                # Make rough estimates of token counts
                input_tokens = len(prompt.split())
                thinking_tokens = len(thinking.split()) if thinking else 0
                response_tokens = len(final_response.split()) if final_response else 0
                
                usage = {
                    "input_tokens": input_tokens,
                    "output_tokens": thinking_tokens + response_tokens
                }
                
                # Ensure has_redacted_thinking is defined - it should be initialized at the start of the function already
                metadata = {
                    "usage": usage,
                    "has_redacted_thinking": has_redacted_thinking,
                    "error": str(e),
                    "error_type": "Value error",
                    "model_used": self.model,
                    "success": False
                }
                
                return thinking, error_message, metadata
                
        except Exception as e:
            log_info(f"Unexpected error in extended thinking: {str(e)}")
            error_message = f"Error in extended thinking: {str(e)}"
            
            # Return whatever thinking we have with error metadata
            input_tokens = len(prompt.split())
            thinking_tokens = len(thinking.split()) if thinking else 0
            
            usage = {
                "input_tokens": input_tokens,
                "output_tokens": thinking_tokens
            }
            
            metadata = {
                "usage": usage,
                "has_redacted_thinking": has_redacted_thinking,
                "error": str(e),
                "error_type": "Unexpected error",
                "model_used": self.model,
                "success": False
            }
            
            return thinking, error_message, metadata
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((anthropic.APIError, anthropic.APITimeoutError))
    )
    @track_llm_metrics(endpoint="structured_response")
    async def generate_structured_response(
        self, 
        prompt: str, 
        with_thinking: bool = False,
        thinking_budget: Optional[int] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: Optional[bool] = None,
        timeout: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Generate a structured JSON response from the LLM, optionally with thinking.
        
        Args:
            prompt: The prompt to send to the LLM
            with_thinking: Whether to include thinking steps
            thinking_budget: Optional token budget for thinking (min 1,024)
            temperature: Optional temperature setting
            max_tokens: Optional max tokens limit
            stream: Whether to force streaming for this request
            timeout: Optional timeout in seconds
            
        Returns:
            A dictionary parsed from the JSON response, with thinking and usage information if requested
        """

        # Initialize variables that might be used before assignment
        usage = {"input_tokens": 0, "output_tokens": 0}
        response_text = ""
        thinking = ""
        final_response = ""
        has_redacted_thinking = False
        
        # Ensure thinking budget is adequate if with_thinking is enabled
        if with_thinking:
            if not thinking_budget or thinking_budget < 1024:
                log_info(f"Thinking budget {thinking_budget} is below minimum. Using 1,024 tokens.")
                thinking_budget = 1024
            
            # Ensure max_tokens is larger than thinking_budget as required by Claude API
            if not max_tokens:
                max_tokens = thinking_budget + MAX_TOKENS  # Default tokens for response
            
            # Always validate that max_tokens is greater than thinking_budget
            if max_tokens <= thinking_budget:
                buffer = 1000
                max_tokens = thinking_budget + buffer
                log_info(f"Adjusted max_tokens to {max_tokens} (thinking_budget {thinking_budget} + buffer {buffer})")
            
            log_info(f"Using thinking_budget: {thinking_budget}, max_tokens: {max_tokens}")
        
        # log_info(f"Recieved Prompt : {prompt}")
        # Determine if this is likely a long-running request
        estimated_tokens = len(prompt.split()) + (max_tokens or MAX_TOKENS)
        is_long_request = estimated_tokens > 8000
        
        # For long requests, automatically use streaming unless explicitly set
        if is_long_request and stream is None:
            stream = True
            log_info(f"Automatically enabling streaming for potentially long structured response ({estimated_tokens} estimated tokens)")
        
        # Force streaming if explicitly requested
        if stream is True:
            is_long_request = True
        
        # Configure client options
        client_options = {}
        if timeout is not None:
            client_options["timeout"] = timeout
        
        if not with_thinking:
            # Original structured response without thinking
            formatted_prompt = f"""
            {prompt}
            
            Please respond with a valid JSON object that follows the structure specified above.
            Do not include any text outside of the JSON structure.
            Ensure the JSON is properly formatted and enclosed in triple backticks with json format indicator.
            
            Example format:
            ```json
            {{
                "message": "Your detailed response here",
                "confidence": 0.95
                // Additional fields as specified
            }}
            ```
            """
            
            try:
                if is_long_request:
                    # Handle streaming for long requests
                    response_text = ""
                    usage = {
                        "input_tokens": 0,
                        "output_tokens": 0
                    }
                    stream_obj = self.anthropic_client.messages.create(
                        model=self.model,
                        max_tokens=max_tokens or MAX_TOKENS,
                        temperature=temperature or TEMPERATURE,
                        messages=[
                            {"role": "user", "content": formatted_prompt}
                        ],
                        stream=True,
                        **client_options
                    )
                    
                    for chunk in stream_obj:
                        if chunk.type == 'content_block_delta' and chunk.delta.type == 'text':
                            response_text += chunk.delta.text
                        # Capture usage if present
                        if hasattr(chunk, 'usage'):
                            if hasattr(chunk.usage, 'input_tokens'):
                                usage["input_tokens"] = chunk.usage.input_tokens
                            if hasattr(chunk.usage, 'output_tokens'):
                                usage["output_tokens"] = chunk.usage.output_tokens
                        await asyncio.sleep(0)
                else:
                    # Non-streaming for shorter requests
                    message = self.anthropic_client.messages.create(
                        model=self.model,
                        max_tokens=max_tokens or MAX_TOKENS,
                        temperature=temperature or TEMPERATURE,
                        messages=[
                            {"role": "user", "content": formatted_prompt}
                        ],
                        **client_options
                    )
                    response_text = message.content[0].text
                    
                    # Capture usage information
                    usage = {
                        "input_tokens": message.usage.input_tokens if hasattr(message, 'usage') and hasattr(message.usage, 'input_tokens') else 0,
                        "output_tokens": message.usage.output_tokens if hasattr(message, 'usage') and hasattr(message.usage, 'output_tokens') else 0
                    }
                    
                # Extract JSON from the response
                extracted_json = self._extract_json(response_text)
                log_info(f"Extracted Json : {extracted_json}")
                
                # Add usage information
                extracted_json["usage"] = usage
                extracted_json["model_used"] = self.model
                extracted_json["success"] = True
                
                return extracted_json
                
            except anthropic.APITimeoutError as e:
                log_info(f"API timeout error in generate_structured_response: {str(e)}")
                # If we weren't streaming, try with streaming as fallback
                if not is_long_request:
                    log_info("Retrying with streaming enabled due to timeout")
                    return await self.generate_structured_response(
                        prompt=prompt,
                        with_thinking=with_thinking,
                        thinking_budget=thinking_budget,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=True,
                        timeout=timeout
                    )
                return {
                    "message": f"Error: API timeout error occurred: {str(e)}",
                    "error": str(e),
                    "error_type": "API timeout",
                    "success": False
                }
            except ValueError as e:
                log_info(f"Value error in generate_structured_response: {str(e)}")
                if "operations that may take longer than 10 minutes" in str(e):
                    log_info("Retrying with streaming due to potential long operation")
                    # Retry with streaming explicitly enabled
                    return await self.generate_structured_response(
                        prompt=prompt,
                        with_thinking=with_thinking,
                        thinking_budget=thinking_budget,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=True,
                        timeout=timeout
                    )
                return {
                    "message": f"Error: Value error occurred: {str(e)}",
                    "error": str(e),
                    "error_type": "Value error",
                    "success": False
                }
            except Exception as e:
                log_info(f"Unexpected error in generate_structured_response: {str(e)}")
                return {
                    "message": f"Error: Unexpected error occurred: {str(e)}",
                    "error": str(e),
                    "error_type": "Unexpected error",
                    "success": False
                }
        else:
            # Use extended thinking for structured response
            thinking, final_response, metadata = await self.generate_response_with_thinking(
                f"""
                {prompt}
                
                After thinking through this carefully, please respond with a valid JSON object that follows the structure specified.
                Ensure the JSON is properly formatted and enclosed in triple backticks with json format indicator.
                
                Example format:
                ```json
                {{
                    "message": "Your detailed response here",
                    "confidence": 0.95
                    // Additional fields as specified
                }}
                ```
                """,
                thinking_budget=thinking_budget,
                max_tokens=max_tokens or MAX_TOKENS,
                temperature=temperature or TEMPERATURE,
                stream=stream,
                timeout=timeout
            )
            
            # Extract JSON from the final response
            json_data = self._extract_json(final_response)
            log_info(f"thinking response json data : {json_data}")
            
            # Add thinking to the JSON response
            json_data["thinking"] = thinking
            
            # Add metadata about redacted thinking if present
            if metadata.get("has_redacted_thinking", False):
                json_data["has_redacted_thinking"] = True
            else:
                json_data["has_redacted_thinking"] = False
            
            if "signatures" in metadata and metadata["signatures"]:
                json_data["signature"] = metadata["signatures"][0]
            
            # Add usage information from metadata
            if "usage" in metadata:
                json_data["usage"] = metadata["usage"]
            else:
                json_data["usage"] = {"input_tokens": 0, "output_tokens": 0}
            
            # Add model information
            json_data["model_used"] = metadata.get("model_used", self.model)
            json_data["success"] = True
            
            return json_data
    
    def _extract_json(self, response_text: str) -> Dict[str, Any]:
        """
        Extract JSON from LLM response text.
        
        Handles various formats that the LLM might return JSON in,
        including nested JSON inside message fields and truncated JSON.
        """
        # Try to find JSON within code blocks
        json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', response_text, re.DOTALL)
        
        if json_match:
            json_str = json_match.group(1)
        else:
            # If no JSON in code blocks, try to find JSON-like structure
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                # Fallback if no JSON-like structure found
                return {"message": response_text, "confidence": 0.5}
        
        try:
            # Try to parse as is first
            json_data = json.loads(json_str)
            
            # Handle the case where JSON contains nested JSON in a message field
            if isinstance(json_data, dict) and "message" in json_data and isinstance(json_data["message"], str):
                log_info(f"Found message field with text length: {len(json_data['message'])}")
                
                # Check for code blocks in message
                nested_json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', json_data["message"], re.DOTALL)
                if nested_json_match:
                    try:
                        nested_json_str = nested_json_match.group(1)
                        nested_json = json.loads(nested_json_str)
                        
                        # If nested JSON has a "threats" field, merge it with the original
                        if "threats" in nested_json and isinstance(nested_json["threats"], list):
                            log_info(f"Found nested JSON with {len(nested_json['threats'])} threats in message field")
                            json_data["threats"] = nested_json["threats"]
                            
                            # Also copy severity counts if available
                            if "severity_counts" in nested_json and isinstance(nested_json["severity_counts"], dict):
                                json_data["severity_counts"] = nested_json["severity_counts"]
                    except json.JSONDecodeError as nested_e:
                        # The nested JSON might be truncated - try to extract threats array
                        log_info(f"Error parsing nested JSON in message, attempting to extract threats array: {str(nested_e)}")
                        threats_match = re.search(r'"threats"\s*:\s*\[(.*?)(?:\]\s*}|$)', nested_json_match.group(1), re.DOTALL)
                        if threats_match:
                            try:
                                # Extract threats array with proper JSON wrapping
                                threats_str = '{"threats":[' + threats_match.group(1) + ']}'
                                # Fix potential truncation by adding closing brackets if needed
                                if not threats_str.endswith("]}"):
                                    last_complete_threat = threats_str.rfind("},")
                                    if last_complete_threat > 0:
                                        threats_str = threats_str[:last_complete_threat+1] + "]}"
                                
                                threats_data = json.loads(threats_str)
                                if "threats" in threats_data and len(threats_data["threats"]) > 0:
                                    log_info(f"Successfully extracted {len(threats_data['threats'])} threats from truncated JSON")
                                    json_data["threats"] = threats_data["threats"]
                            except Exception as e:
                                log_info(f"Failed to extract threats array from truncated JSON: {str(e)}")
                    except Exception as e:
                        log_info(f"Error processing nested JSON in message: {str(e)}")
                else:
                    # Try to extract threats array directly from the message text
                    threats_match = re.search(r'"threats"\s*:\s*\[(.*?)(?:\]\s*}|$)', json_data["message"], re.DOTALL)
                    if threats_match:
                        try:
                            threats_str = '{"threats":[' + threats_match.group(1) + ']}'
                            # Fix potential truncation by adding closing brackets if needed
                            if not threats_str.endswith("]}"):
                                last_complete_threat = threats_str.rfind("},")
                                if last_complete_threat > 0:
                                    threats_str = threats_str[:last_complete_threat+1] + "]}"
                            
                            threats_data = json.loads(threats_str)
                            if "threats" in threats_data and len(threats_data["threats"]) > 0:
                                log_info(f"Extracted {len(threats_data['threats'])} threats directly from message text")
                                json_data["threats"] = threats_data["threats"]
                        except Exception as e:
                            log_info(f"Failed to extract threats directly from message text: {str(e)}")
                    
                    # Also extract severity counts if available
                    severity_match = re.search(r'"severity_counts"\s*:\s*(\{[^}]+\})', json_data["message"], re.DOTALL)
                    if severity_match:
                        try:
                            severity_str = severity_match.group(1)
                            severity_data = json.loads(severity_str)
                            json_data["severity_counts"] = severity_data
                            log_info(f"Extracted severity counts from message text")
                        except Exception as e:
                            log_info(f"Failed to extract severity counts from message text: {str(e)}")
            
            return json_data
        except json.JSONDecodeError as e:
            log_info(f"Initial JSON decode error: {str(e)}, attempting recovery...")
            
            # Try to fix common JSON issues
            fixed_json_str = self._fix_json_string(json_str)
            
            # Try to extract the threats array directly if the JSON is truncated
            threats_match = re.search(r'"threats"\s*:\s*\[(.*?)(?:\]\s*}|$)', json_str, re.DOTALL)
            severity_match = re.search(r'"severity_counts"\s*:\s*(\{[^}]+\})', json_str, re.DOTALL)
            message_match = re.search(r'"message"\s*:\s*"([^"]+)"', json_str, re.DOTALL)
            
            if threats_match or severity_match:
                recovered_data = {"message": "", "confidence": 0.5}
                
                # Extract message if available
                if message_match:
                    try:
                        recovered_data["message"] = message_match.group(1)
                    except Exception as msg_e:
                        log_info(f"Failed to extract message: {str(msg_e)}")
                
                # Extract threats array
                if threats_match:
                    try:
                        threats_str = '{"threats":[' + threats_match.group(1) + ']}'
                        # Fix potential truncation
                        if not threats_str.endswith("]}"):
                            last_complete_threat = threats_str.rfind("},")
                            if last_complete_threat > 0:
                                threats_str = threats_str[:last_complete_threat+1] + "]}"
                        
                        threats_data = json.loads(threats_str)
                        if "threats" in threats_data and len(threats_data["threats"]) > 0:
                            log_info(f"Recovered {len(threats_data['threats'])} threats from truncated JSON")
                            recovered_data["threats"] = threats_data["threats"]
                    except Exception as t_e:
                        log_info(f"Failed to recover threats array: {str(t_e)}")
                
                # Extract severity counts
                if severity_match:
                    try:
                        severity_str = '{' + severity_match.group(1) + '}'
                        severity_str = severity_str.replace('{', '{"severity_counts":{')
                        severity_str = severity_str.replace('}', '}}')
                        severity_data = json.loads(severity_str)
                        if "severity_counts" in severity_data:
                            log_info(f"Recovered severity counts from truncated JSON")
                            recovered_data["severity_counts"] = severity_data["severity_counts"]
                    except Exception as s_e:
                        log_info(f"Failed to recover severity counts: {str(s_e)}")
                
                # If we recovered any threats, return the recovered data
                if "threats" in recovered_data:
                    log_info(f"Returning recovered data with {len(recovered_data.get('threats', []))} threats")
                    return recovered_data
            
            # Standard fix attempt if recovery failed
            try:
                return json.loads(fixed_json_str)
            except json.JSONDecodeError:
                # Fallback for parsing failures
                log_info(f"JSON decode error after fixes: {str(e)}. Response: {response_text[:200]}...")
                return {"message": response_text, "confidence": 0.5}
    
    def _fix_json_string(self, json_str: str) -> str:
        """
        Attempt to fix common JSON formatting issues.
        """
        # Remove trailing commas in objects and arrays
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)
        
        # Replace single quotes with double quotes (if not within double quotes)
        in_string = False
        result = []
        i = 0
        while i < len(json_str):
            if json_str[i] == '"':
                in_string = not in_string
            
            if not in_string and json_str[i] == "'":
                result.append('"')
            else:
                result.append(json_str[i])
            
            i += 1
            
        return ''.join(result)
            
    async def determine_thinking_budget(self, task_complexity: str, diagram_state: Dict[str, Any]) -> int:
            """
            Determine an appropriate thinking budget based on task complexity.
            
            Args:
                task_complexity: Complexity level ("low", "medium", "high", "very_high")
                diagram_state: Current state of the architecture diagram
                
            Returns:
                Token budget for thinking
            """
            # Base budget - minimum allowed is 1,024
            base_budget = 1024
            
            # Scale based on complexity
            complexity_multipliers = {
                "low": 1,
                "medium": 2,
                "high": 4,
                "very_high": 8
            }
            
            multiplier = complexity_multipliers.get(task_complexity, 2)
            
            # Adjust based on diagram complexity if available
            diagram_size_adjustment = 0
            if diagram_state and "nodes" in diagram_state:
                nodes_count = len(diagram_state.get("nodes", []))
                edges_count = len(diagram_state.get("edges", []))
                
                # Add more budget for complex diagrams
                if nodes_count + edges_count > 20:
                    diagram_size_adjustment = 2048
                elif nodes_count + edges_count > 10:
                    diagram_size_adjustment = 1024
            
            # Calculate final budget
            budget = base_budget * multiplier + diagram_size_adjustment
            
            # Cap at reasonable limits to avoid excessive token usage
            # For very complex tasks that might need >32K, recommend batch processing
            if budget > 32768:
                log_info("Thinking budget exceeds 32K tokens, consider using batch processing")
                budget = 32768
            
            log_info(f"Determined thinking budget: {budget} tokens for {task_complexity} complexity")
            return budget


    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), retry=retry_if_exception_type(Exception))
    @track_llm_metrics(endpoint="analyze_diagram")
    async def analyze_diagram(self, diagram_content: dict, llm : str = "openai") -> Dict[str, Any]:
        """
        Analyze diagram content (nodes and edges) to create a full narrative
        
        Args:
            diagram_content: Dictionary containing nodes and edges
            llm: Which LLM to use (openai or grok)
            
        Returns:
            Dictionary with data flow description and metadata
        """
        # Enhanced system prompt with specific instructions for detailed analysis
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


        # GPT-3.5-Turbo is cost-efficient for this task
        if llm == "openai":
            client = self.openai_client
            model = "gpt-4.1-mini"
        elif llm == "grok":
            client = self.grok_client
            model = "grok-3-mini-beta"
        
        try:
            # Check rate limits if applicable
            if hasattr(self, 'rate_counter') and hasattr(self, 'rate_limit') and self.rate_counter >= self.rate_limit:
                log_info("Rate limit exceeded")
                return {
                    "data_flow_description": "Rate limit exceeded. Please try again later.",
                    "error": "Rate limit exceeded",
                    "success": False
                }

            # Use the standard chat completions API
            completion = await asyncio.to_thread(
                client.chat.completions.create,
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,  # Lower temperature for more focused, consistent output
                max_tokens=2500    # Increased token limit for more detailed responses
            )

            # Increment rate counter if it exists
            if hasattr(self, 'rate_counter'):
                self.rate_counter += 1
            
            # Extract content from response
            content = completion.choices[0].message.content
            
            # Get usage statistics
            usage = {
                "prompt_tokens": completion.usage.prompt_tokens,
                "completion_tokens": completion.usage.completion_tokens,
                "total_tokens": completion.usage.total_tokens
            }
            
            log_info(f"Diagram analysis completed successfully. Used {usage['total_tokens']} tokens.")
            
            return {
                "data_flow_description": content,
                "usage": usage,
                "model_used": model,
                "success": True
            }
            
        except Exception as e:
            error_message = str(e)
            log_info(f"Error in analyze_diagram: {error_message}")
            
            # Handle specific error types
            if "rate_limit" in error_message.lower():
                error_type = "Rate limit exceeded"
            elif "context_length" in error_message.lower():
                error_type = "Input diagram too large"
            else:
                error_type = "Processing error"
            
            return {
                "data_flow_description": f"Error analyzing diagram: {str(e)}",
                "error": str(e),
                "success": False
            }