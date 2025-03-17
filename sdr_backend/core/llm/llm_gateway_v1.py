import anthropic
import json
import re
from typing import Dict, Any, Optional, Tuple
from config.settings import ANTHROPIC_API_KEY
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import logging
from utils.logger import log_info
import asyncio

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
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.model = "claude-3-7-sonnet-20250219"
        # Default thinking budget - minimum allowed is 1,024 tokens
        self.default_thinking_budget = 4096  # Starting with a modest budget
    
    async def generate_response(
        self, 
        prompt: str, 
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: Optional[bool] = None,
        timeout: Optional[float] = None
    ) -> str:
        """
        Generate a text response from the LLM without using extended thinking.
        
        Args:
            prompt: The prompt to send to the LLM
            temperature: Optional temperature setting to override default
            max_tokens: Optional token limit to override default
            stream: Whether to use streaming for longer operations
            timeout: Optional timeout in seconds
            
        Returns:
            The generated text response
        """
        # Estimate if this is likely to be a long-running request
        # A rough heuristic: prompt length + max tokens > threshold
        estimated_tokens = len(prompt.split()) + (max_tokens or MAX_TOKENS)
        is_long_request = estimated_tokens > 8000  # A reasonable threshold
        
        # For long requests, automatically use streaming unless explicitly set
        if is_long_request and stream is None:
            stream = True
            log_info(f"Automatically enabling streaming for potentially long request ({estimated_tokens} estimated tokens)")
            
        try:
            # Configure client options
            client_options = {}
            if timeout is not None:
                client_options["timeout"] = timeout
            
            if stream:
                full_response = ""
                stream_obj = self.client.messages.create(
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
                    if chunk.type == 'content_block_delta' and chunk.delta.type == 'text':
                        full_response += chunk.delta.text
                    await asyncio.sleep(0)
                return full_response
            else:
                message = self.client.messages.create(
                    model=self.model,
                    max_tokens=max_tokens or MAX_TOKENS,
                    temperature=temperature or TEMPERATURE,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    **client_options
                )
                return message.content[0].text
            
        except anthropic.APITimeoutError as e:
            log_info(f"API timeout error: {str(e)}")
            # If we weren't streaming, try with streaming as fallback
            if not stream:
                log_info("Retrying with streaming enabled due to timeout")
                return await self.generate_response(
                    prompt=prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=True,
                    timeout=timeout
                )
            raise
        except ValueError as e:
            log_info(f"Value error: {str(e)}")
            if "operations that may take longer than 10 minutes" in str(e):
                log_info("Retrying with streaming enabled due to long operation warning")
                return await self.generate_response(
                    prompt=prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=True,
                    timeout=timeout
                )
            raise
        except Exception as e:
            log_info(f"Unexpected error: {str(e)}")
            raise
    
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((anthropic.APIError, anthropic.APITimeoutError))
    )
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
            max_tokens: Optional max tokens limit
            temperature: Optional temperature setting
            stream: Whether to force streaming mode
            timeout: Optional timeout in seconds
            
        Returns:
            Tuple of (thinking_process, final_response, metadata)
        """
        # Ensure thinking budget meets the minimum requirement
        budget = max(thinking_budget or self.default_thinking_budget, 1024)
        
        # Set max_tokens, ensuring it's greater than the thinking budget
        tokens = max_tokens if max_tokens is not None else MAX_TOKENS
        if tokens <= budget:
            tokens = budget + 1000  # Ensure room for the actual response
        
        log_info(f"Generating response with thinking. Budget: {budget}, Max tokens: {tokens}")
        
        # Determine if this is likely a long-running request
        estimated_tokens = len(prompt.split()) + tokens
        is_long_request = estimated_tokens > 8000
        
        # For long requests, automatically use streaming unless explicitly set
        if is_long_request and stream is None:
            stream = True
            log_info(f"Automatically enabling streaming for potentially long thinking request ({estimated_tokens} estimated tokens)")
        
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
                thinking = ""
                final_response = ""
                metadata = {"has_redacted_thinking": False, "signatures": []}
                
                log_info(f"Creating stream with thinking budget: {budget}")
                stream_obj = self.client.messages.create(
                    model=self.model,
                    max_tokens=tokens,
                    temperature=temperature,
                    thinking={"type": "enabled", "budget_tokens": budget},
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
                
                log_info(f"Thinking length: {len(thinking)}")
                log_info(f"Final response length: {len(final_response)}")
                
                # If we still have an empty response, try to extract from message object
                if not final_response:
                    log_info("WARNING: Final response is empty, will use fallback extraction")
                    message = self.client.messages.create(
                        model=self.model,
                        max_tokens=tokens,
                        temperature=temperature,
                        messages=[
                            {"role": "user", "content": prompt}
                        ],
                        **client_options
                    )
                    
                    # Extract text from normal response
                    if hasattr(message, 'content'):
                        for content_item in message.content:
                            if hasattr(content_item, 'type') and content_item.type == 'text':
                                if hasattr(content_item, 'text'):
                                    final_response = content_item.text
                                    log_info(f"Used fallback response extraction: {len(final_response)} chars")
                
                
                log_info(f"Final Response : {final_response}")
                return thinking, final_response, metadata
            else:
                # Non-streaming approach (unchanged)
                message = self.client.messages.create(
                    model=self.model,
                    max_tokens=tokens,
                    temperature=temperature,
                    thinking={"type": "enabled", "budget_tokens": budget},
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    **client_options
                )
                
                # Extract thinking and response
                thinking = ""
                final_response = ""
                metadata = {"has_redacted_thinking": False, "signatures": []}
                
                for content_block in message.content:
                    if content_block.type == "thinking":
                        thinking = content_block.thinking
                        if hasattr(content_block, "signature"):
                            metadata["signatures"].append(content_block.signature)
                    elif content_block.type == "redacted_thinking":
                        thinking += "[Redacted thinking block]"
                        metadata["has_redacted_thinking"] = True
                        if hasattr(content_block, "data"):
                            metadata["redacted_data"] = content_block.data
                    elif content_block.type == "text":
                        final_response = content_block.text
                
                return thinking, final_response, metadata
            
        except anthropic.APITimeoutError as e:
            log_info(f"API timeout error in generate_response_with_thinking: {str(e)}")
            # If we weren't streaming, try with streaming as fallback
            if not is_long_request:
                log_info("Retrying with streaming enabled due to timeout")
                return await self.generate_response_with_thinking(
                    prompt=prompt,
                    thinking_budget=thinking_budget,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    stream=True,
                    timeout=timeout
                )
            raise
        except ValueError as e:
            log_info(f"Value error in generate_response_with_thinking: {str(e)}")
            # Check for the specific error about long operations
            if "operations that may take longer than 10 minutes" in str(e):
                log_info("Retrying with streaming enabled due to potential long operation")
                return await self.generate_response_with_thinking(
                    prompt=prompt,
                    thinking_budget=thinking_budget,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    stream=True,
                    timeout=timeout
                )
            raise
        except Exception as e:
            log_info(f"Error generating response with thinking: {str(e)}")
            # Fall back to emulating thinking with standard response
            log_info("Falling back to standard response emulating thinking")
            thinking_prompt = f"""
            {prompt}
            
            Think through this problem step by step before giving your final answer. 
            First, provide your detailed thinking in a section labeled <thinking>...</thinking>.
            Then, provide your final response.
            """
            
            # Try with streaming for the fallback if this was likely a long request
            if is_long_request:
                response_text = await self.generate_response(
                    thinking_prompt,
                    temperature=temperature,
                    max_tokens=tokens,
                    stream=True,
                    timeout=timeout
                )
            else:
                message = self.client.messages.create(
                    model=self.model,
                    max_tokens=tokens,
                    temperature=temperature,
                    messages=[
                        {"role": "user", "content": thinking_prompt}
                    ],
                    **client_options
                )
                response_text = message.content[0].text
            
            # Extract thinking and response
            thinking_match = re.search(r'<thinking>(.*?)</thinking>', response_text, re.DOTALL)
            thinking = thinking_match.group(1).strip() if thinking_match else ""
            
            # Get the final response (everything after </thinking> tag)
            final_response = re.sub(r'.*?</thinking>', '', response_text, flags=re.DOTALL).strip()
            if not final_response and not thinking:
                final_response = response_text  # Fallback if no thinking tags present
                
            return thinking, final_response, {"has_redacted_thinking": False, "signatures": []}
        
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((anthropic.APIError, anthropic.APITimeoutError))
    )
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
            A dictionary parsed from the JSON response, with thinking if requested
        """

        log_info(f"Recieved Prompt : {prompt}")
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
                    stream_obj = self.client.messages.create(
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
                        await asyncio.sleep(0)
                else:
                    # Non-streaming for shorter requests
                    message = self.client.messages.create(
                        model=self.model,
                        max_tokens=max_tokens or MAX_TOKENS,
                        temperature=temperature or TEMPERATURE,
                        messages=[
                            {"role": "user", "content": formatted_prompt}
                        ],
                        **client_options
                    )
                    response_text = message.content[0].text
                    
                # Extract JSON from the response
                return self._extract_json(response_text)
                
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
                raise
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
                raise
            except Exception as e:
                log_info(f"Unexpected error in generate_structured_response: {str(e)}")
                raise
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
            
            if "signatures" in metadata and metadata["signatures"]:
                json_data["signature"] = metadata["signatures"][0]
            
            return json_data
    
    def _extract_json(self, response_text: str) -> Dict[str, Any]:
        """
        Extract JSON from LLM response text.
        
        Handles various formats that the LLM might return JSON in.
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
            return json.loads(json_str)
        except json.JSONDecodeError:
            # Try to fix common JSON issues
            fixed_json_str = self._fix_json_string(json_str)
            try:
                return json.loads(fixed_json_str)
            except json.JSONDecodeError:
                # Fallback for parsing failures
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
