
# from utils.llm_model import get_openai_model_chain, get_prompt_template
import json
from utils.logger import log_info

prompt_map = {
    "Add": "You want to add a component. Describe it with its role in secure architecture.",
    "Update": "You want to update a component. Specify the changes needed.",
    "Remove": "You want to remove a component. Confirm and specify its dependencies.",
    "Query": "Provide an expert answer about secure software architecture."
}

async def enhance_prompt(user_input: str) -> str:
    """
    Uses LLM to enhance the user input dynamically for better response generation.
    Handles:
    - Node interactions (add, update, remove, query).
    - Expert software architecture and cybersecurity questions.
    - Out-of-context requests.
    """

    system_message = """
    You are an advanced AI assistant that optimizes {user_input} in a more detailed and structured way for better response handling based on the user intent.
    
    **Instructions:**
    1. **Node Interaction Requests**  
       - If the user asks to add, modify, update, remove, or query a node, rewrite the request with better robust and precise structure.
       - Example: "Add a node about Firewall Protection" → "Create a node labeled 'Firewall Protection'."
    
    2. **Expert Software Architecture and Cybersecurity Questions**  
       - If the user asks a general question about software architecture and cybersecurity, refine it into a clear expert-level query.
       - Example: "Tell me about zero-trust" → "Explain the Zero Trust security model in depth, including its principles and real-world applications."
    
    3. **Out-of-Context Requests**  
       - If the user input is not related to cybersecurity or node interactions, respond with:
         **'I'm here to assist with cybersecurity and node-based interactions. Could you please clarify your request?'**
    
    **Output Format:**  
    - Return a JSON response with:
      - `"enhanced_prompt"`: <The improved user request.>
      - `"category"`: <"node_interaction", "expert_query", or "out_of_context"`
    """

    return system_message