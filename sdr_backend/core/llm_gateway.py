from tenacity import retry, stop_after_attempt, wait_exponential
from typing import Any, Dict
import httpx
from  config.settings import OPENAI_API_KEY
from services.exception_handler import RateLimitError, LLMError
import json
import asyncio
from utils.logger import log_info

class LLMGateway:
    def __init__(self):
        self.base_url = "https://api.openai.com"
        self.api_key = OPENAI_API_KEY
        self.client = httpx.AsyncClient(timeout=30.0)
        self.rate_limit = 100  # Requests per minute
        self.rate_counter = 0

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def generate(self, prompt: str) -> Dict[str, Any]:
        """
        Generates a structured response from OpenAI's LLM.
        
        Args:
            prompt (str): The input prompt for the model.
            
        Returns:
            dict: Parsed JSON response from LLM
        """
        try:
            # Check rate limit
            if self.rate_counter >= self.rate_limit:
                raise RateLimitError("Rate limit exceeded. Please slow down your requests.")
            
            # Prepare request payload
            payload = {
                "model": "gpt-4",  
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a cybersecurity and software architecture expert specializing in API security, "
                            "network protection, and compliance (GDPR, PCI-DSS, ISO 27001), software development, "
                            "threat modeling, incident response," 
                            "Industry standard Securirty practices(NVD, CISA, CISA KEVIR, MITRE, etc.) etc.., "
                            "Always return responses in structured JSON format."
                        )
                    },
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.5,
                "max_tokens": 1000,
                "response_format": "json"  # Ensures JSON output (GPT-4 Turbo supports this)
            }

        
            # payload = {
            #     "prompt": prompt,
            #     "temperature": 0.7,
            #     "max_tokens": 1000,
            #     "context": context or {}
            # }
            log_info(f"API KEY: {self.api_key}")
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            # Log the request (optional for debugging)
            log_info(f"Sending request to OpenAI: {json.dumps(payload, indent=2)}")
            
            # Make API call
            response = await self.client.post(
                f"{self.base_url}/v1/chat/completions",
                json=payload,
                headers=headers
            )
            
            # Update rate counter
            self.rate_counter += 1
            
            # Handle errors
            if response.status_code != 200:
                raise LLMError(f"API Error: {response.status_code} - {response.text}")
            
            # return response
            # return self._parse_response(response.json())
            return response.json()
        except httpx.RequestError as e:
            raise LLMError(f"Network error: {str(e)}")
        except json.JSONDecodeError as e:
            raise LLMError(f"Invalid JSON response: {str(e)}")
        finally:
            # Reset rate counter after 1 minute
            if self.rate_counter > 0:
                await asyncio.sleep(60)
                self.rate_counter = 0

llm_gateway = LLMGateway()
