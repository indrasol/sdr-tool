from utils.logger import log_info
from utils.llm_model import get_openai_model_chain, get_prompt_template
import json

async def get_clean_response_for_invoke(response):
    """
    Clean and format the response string from the LLM invoke.
    
    Args:
        response (str): The raw response string from the LLM
        
    Returns:
        str: Cleaned and formatted response string ready for JSON parsing
    """

     # Extract content from AIMessage
    response_content = response.content if hasattr(response, 'content') else str(response)
    log_info(f"Response content: {response_content}")

    # Clean the response string
    cleaned_response = response_content.strip()
    if cleaned_response.startswith('```json'): cleaned_response = cleaned_response[7:] # Remove json
    if cleaned_response.endswith('```'): cleaned_response = cleaned_response[:-3] # Remove closing
    cleaned_response = cleaned_response.strip()
    # Additional cleaning
    cleaned_response = cleaned_response.strip()
    cleaned_response = cleaned_response.replace('\\n', ' ')
    cleaned_response = cleaned_response.replace('\\', '')
    cleaned_response = cleaned_response.replace('n{n', '{')
    cleaned_response = cleaned_response.replace('}n', '}')
    return cleaned_response
