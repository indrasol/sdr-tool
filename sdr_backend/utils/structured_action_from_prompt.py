from utils.llm_model import get_openai_model_chain, get_prompt_template
from typing import Dict, Any
from utils.logger import log_info
from utils.response_utils import get_clean_response_for_invoke
import json


async def get_structured_action_from_prompt(enhanced_prompt: str) -> Dict[str, Any]:
    log_info(f"Entering structured action from prompt")

    """
    Queries the LLM to extract and structure the user request.
    
    The function identifies the action ('add', 'modify', 'update', 'remove' etc. related to any node interactions) and
    returns structured details about the corresponding node in a more
    robust way, including error handling and parsing the response.

    Args:
        enhanced_prompt (str): The prompt that contains the user request for action.
        
    Returns:
        dict: A dictionary containing the structured action and node details,
              with keys 'action' and 'node_details'.
    """

    system_message = """
    You are an AI specialized in extracting action and reactflow compatible node details from the {enhanced_prompt}. 
    Extract and structure the user's request from the prompt.
    Identify the action (one of 'add', 'modify', 'remove') and the
    associated node details (e.g., node name, attributes, values).
    Respond in a structured format with 'action' and 'node_details' keys.

    Only return the JSON formatted response.
    """
    user_message = enhanced_prompt
    try:
        log_info(f"Enhanced prompt from get_structured_action_from_prompt: {enhanced_prompt}")
        prompt = get_prompt_template(system_message, user_message)
        log_info(f"Prompt from get_structured_action_from_prompt: {prompt}")
        chain = get_openai_model_chain(model_name="gpt-4o", temperature=0.3, prompt=prompt)
        response =  chain.invoke({
            "enhanced_prompt": enhanced_prompt
        })
        log_info(f"Response from get_structured_action_from_prompt: {response}")

        cleaned_response = await get_clean_response_for_invoke(response)
        log_info(f"Cleaned response from get_structured_action_from_prompt: {cleaned_response}")

        # Extracting and parsing the structured response
        structured_response = json.loads(cleaned_response)
        log_info(f"Structured Response Output: {structured_response}")

        # Check if response is in expected structure
        if not structured_response:
            raise ValueError("The LLM response is empty or malformed.")
        
        # Return the parsed structured response
        return {
            "action": structured_response["action"],
            "node_details": structured_response["node_details"]
        }


    except ValueError as e:
        # Handle response parsing issues
        return {"error": f"Response parsing error: {str(e)}"}
    except Exception as e:
        # Handle any other errors
        return {"error": f"Unexpected error: {str(e)}"}
    

async def get_expert_response_from_prompt(enhanced_prompt: str) -> dict:
    try:

        system_message = """
        You are an AI expert and specialized in cybersecurity and software architecture.
        You are given a {enhanced_prompt} and you need to respond with a detailed response.
        Try to give the best possible answer to the user's question.
        Use web search like google, wikipedia, etc. to give the best possible answer if its in the context of cybersecurity and software architecture.
        For cyber security questions, try to use best practices like NIST, CIS, MITRE, NVD, OWASP, etc., if you can't find the answer in the context of the enhanced prompt.
        The response should be in a way that is easy to understand and use.
        Respond in a clean easy to undersatnd simpel natural language.

        Only return the JSON formatted response.
        """
        user_message = enhanced_prompt
        prompt = get_prompt_template(system_message, user_message)
        chain = get_openai_model_chain(model_name="gpt-4o", temperature=0.3, prompt=prompt)
        response =  chain.invoke({
            "enhanced_prompt": enhanced_prompt
        })
        # Example: Call the LLM API or use some other expert service
        expert_response = await get_clean_response_for_invoke(response)
        # log_info(f"Expert response: {expert_response}")
        return {"response": expert_response}
        # return expert_response
    except Exception as e:
        return {"error": str(e)}
    