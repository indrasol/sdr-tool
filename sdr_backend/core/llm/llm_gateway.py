# from tenacity import retry, stop_after_attempt, wait_exponential
# from typing import Dict, Optional, Any
# import httpx
# from config.settings import OPENAI_API_KEY, ANTHROPIC_API_KEY
# from services.exception_handler import RateLimitError, LLMError
# import json
# import asyncio
# import time
# from datetime import datetime
# from utils.logger import log_info
# import anthropic
# import logging
# from core.cache.session_manager import SessionManager
# from core.llm.prompt_engineer import PromptEngineer

# class LLMGateway:
#     def __init__(self, default_model: str = "claude"):
#         """Initialize LLM Gateway with API connections and default model."""
#         self.openai_url = "https://api.openai.com/v1/chat/completions"
#         self.anthropic_api_key = ANTHROPIC_API_KEY
#         self.openai_api_key = OPENAI_API_KEY
#         self.anthropic_client = anthropic.Anthropic()
#         self.rate_limit = 100  # Requests per minute
#         self.rate_counter = 0
#         self.default_model = default_model
#         self.prompt_engineer = PromptEngineer()
#         self.conversation_history = []
#         self.session_manager = SessionManager()

#     def clear_conversation(self) -> None:
#         """Clear conversation history."""
#         self.conversation_history = []

#     @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), reraise=True)
#     async def get_openai_response(self, prompt: str, intent_type: str) -> Dict[str, Any]:
#         """Get response from OpenAI."""
#         client = httpx.AsyncClient(timeout=30.0)
#         system_prompt = self.prompt_engineer.build_system_prompt_for_intent(intent_type)
#         payload = {
#             "model": "gpt-4",
#             "messages": [
#                 {"role": "system", "content": system_prompt},
#                 {"role": "user", "content": prompt}
#             ],
#             "temperature": 0.5,
#             "max_tokens": 1500,
#             "response_format": {"type": "json_object"}
#         }
#         if self.rate_counter >= self.rate_limit:
#             raise RateLimitError("Rate limit exceeded.")
#         headers = {"Authorization": f"Bearer {self.openai_api_key}", "Content-Type": "application/json"}
#         response = await client.post(self.openai_url, json=payload, headers=headers)
#         self.rate_counter += 1
#         response_json = response.json()
#         content = response_json.get("choices", [{}])[0].get("message", {}).get("content", "{}")
#         try:
#             return json.loads(content)
#         except json.JSONDecodeError:
#             return {"error": "Failed to parse JSON response", "raw_content": content}

#     async def get_claude_response(self, processed_request: Dict[str, Any], intent_type: str) -> Dict[str, Any]:
#         """Get response from Claude."""
#         system_prompt = self.prompt_engineer.build_system_prompt_for_intent(intent_type)
#         user_message = processed_request.get("user_message", "")
#         messages = [{"role": "user", "content": user_message}] + self.conversation_history
#         temperature = 0.3
#         if intent_type == "diagram_modification":
#             temperature = 0.2
#         elif intent_type == "expert_advice":
#             temperature = 0.4
#         response = self.anthropic_client.messages.create(
#             model="claude-3-5-sonnet-20241022",
#             max_tokens=4096,
#             system=system_prompt,
#             messages=messages,
#             temperature=temperature,
#             response_format={"type": "json_object"}
#         )
#         response_content = response.content[0].text
#         try:
#             json_response = json.loads(response_content)
#             self.conversation_history.append({"role": "assistant", "content": response_content})
#             return json_response
#         except json.JSONDecodeError:
#             return {"error": "Invalid JSON response", "raw_content": response_content[:200] + "..."}
        

#     async def generate_response(self, processed_request: Dict[str, Any], intent_type: str, session_id: Optional[str] = None, model: Optional[str] = None) -> Dict[str, Any]:
#         """Generate a response using the specified or default LLM."""
#         model = model or self.default_model
#         enhanced_prompt = await self.prompt_engineer.build_prompt_by_intent(processed_request, intent_type, session_id)
        
#         if model == "openai":
#             response = await self.get_openai_response(enhanced_prompt["user_message"], intent_type)
#         elif model == "claude":
#             response = await self.get_claude_response(enhanced_prompt, intent_type)
#         else:
#             raise ValueError(f"Unsupported model: {model}")
        
#         # Basic validation (e.g., ensure response is a dict)
#         if not isinstance(response, dict):
#             raise ValueError("Invalid response format from LLM")

#         return response

# # Singleton instance
# llm_gateway = LLMGateway()