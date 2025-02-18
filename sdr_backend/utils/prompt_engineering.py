
from utils.llm_model import get_openai_model_chain, get_prompt_template
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

    user_message = user_input
    prompt = get_prompt_template(system_message, user_message)
    log_info(f"Prompt: {prompt}")
    chain = get_openai_model_chain(model_name="gpt-4o", temperature=0.3, prompt=prompt)
    response =  chain.invoke({
        "user_input": user_input
    })
    log_info(f"Enhanced Prompt Output: {response}")
        
    # Parse LLM output
    try:
        # Extract content from AIMessage
        response_content = response.content if hasattr(response, 'content') else str(response)
        log_info(f"Response content: {response_content}")

        # Clean the response string
        cleaned_response = response_content.strip()
        if cleaned_response.startswith('```json'): cleaned_response = cleaned_response[7:] # Remove json
        if cleaned_response.endswith('```'): cleaned_response = cleaned_response[:-3] # Remove closing
        cleaned_response = cleaned_response.strip()

        log_info(f"Cleaned response: {cleaned_response}")

        output = json.loads(cleaned_response)
        log_info(f"Output: {output}")
        return output
    except json.JSONDecodeError:
        return {
            "enhanced_prompt": "Error processing request. Please try again.",
            "category": "error"
        }

# async def evaluate_and_enhance_prompt(message: str) -> Dict[str, Any]:
#     """
#     Evaluate the user's prompt using LangSmith and generate an enhanced system prompt.
#     The enhanced prompt will be automatically generated based on the evaluation results.
#     """
#     # Create the prompt template with escaped curly braces for JSON
#     PROMPT_EVALUATION_TEMPLATE = PromptTemplate.from_template("""
#         You are an expert in refining user queries for AI models in the context of software architecture and cybersecurity. 
#         Your task is to evaluate the user's {message} and rewrite it into a more structured, detailed, and clear prompt that eliminates any ambiguity and prepares it for processing by an AI model.

#         Ensure that the Refined prompt meets below expectations to be more specific and clear:
#             - Identifies the list of **type of actions** (e.g., add, modify, remove, generate new diagram or answer with expertise as general query) needs to be done for the each node.
#             - Specifies any relevant **architectural components** (e.g., nodes, servers, databases) (if relevant).
#             - Specifies the **type of software architecture** (if mentioned).
#             - Includes **security considerations** such as threat modeling or secure design (if relevant)
#             - Is **structured**, **detailed**, and **clear** about the desired output format.
#             - Output a response in **JSON format** containing **detailed flow explanation**,**diagram updates - list of types of actions needed with specifying component node details with respect to the each action**.
#             - Clearly defines the **expected output format** as a below example **JSON structure**.:
#                 "{{\n"
#                 '  "description": "<summary of the entire flow>",\n'
#                 '  "diagram_updates": [\n'
#                 "    {{\n"
#                 '      "action": "<type of action>",\n'
#                 '      "nodeType": "<Type of node>",\n'
#                 '      "nodeName": "<Name of the node>",\n'
#                 '      "connectionFrom": "<source node>",\n'
#                 '      "connectTo": "<target node>"\n'
#                 "    }}\n"
#                 "  ]\n"
#                 "}}\n\n"
                                                              
#         Final Ouput expectations should include below in structured JSON format:
#             -  **Intent Clarification**: The output should clarify if the user intends to **add**, **remove**, **update**, or **generate** a new component or diagram.
#             -  **Refined Prompt**: The refined prompt rephrased the user's message meeting teh above mentioned guidelines.
#             -  **Entities Extraction**: The output includes a list of **technical components** or **security concepts** mentioned by the user if any.
#             -  **Confidence Score**: A confidence score between 0.0 and 1.0 is provided, indicating the AI model's certainty in its understanding and the quality of the refined prompt.

#         Example of Required Output JSON Format:
#         {{
#             "intent": "<intention of the user>",
#             "confidence_score": <confidence score between 0.0 and 1.0>,
#             "identified_entities": "<list of technical components extracted from the user's message if any>",
#             "refined_prompt": "<rephrased **refined prompt** meeting the above mentioned guidelines>"
#         }}
#         """)
#     try:
#         langsmith_logger.info("--------------------------------")
#         evaluation_chain = PROMPT_EVALUATION_TEMPLATE | model
#         langsmith_logger.info({"stage": "evaluation"})
        
#         chain_result = await evaluation_chain.ainvoke({"message": message})
#         langsmith_logger.info("--------------------------------")
#         langsmith_logger.info(f"chain result: {chain_result}")
#         langsmith_logger.info("--------------------------------")
#         # evaluation_result = evaluation_chain.run(message=message)
        
#         try:
#             # Extract content from AIMessage
#             evaluation_result = chain_result.content if hasattr(chain_result, 'content') else str(chain_result)
            
#             langsmith_logger.info(f"evaluation result: {evaluation_result}")
#             langsmith_logger.info("--------------------------------")

#              # Clean the response string
#             cleaned_response = evaluation_result.strip()
#             if cleaned_response.startswith('```json'):
#                 cleaned_response = cleaned_response[7:]  # Remove ```json
#             if cleaned_response.endswith('```'):
#                 cleaned_response = cleaned_response[:-3]  # Remove closing ```
#             cleaned_response = cleaned_response.strip()

#             # Replace escaped newlines and backslashes
#             cleaned_response = cleaned_response.replace('\\n', ' ')
#             cleaned_response = cleaned_response.replace('\\', '')
#             cleaned_response = cleaned_response.replace('n{n', '{')
#             cleaned_response = cleaned_response.replace('}n', '}')

#             # Replace escaped backslashes
#             # cleaned_response = cleaned_response.replace('\\', '')
#             langsmith_logger.info("--------------------------------")
            
#             langsmith_logger.info(f"cleaned response: {cleaned_response}")
#             langsmith_logger.info("--------------------------------")
#             parsed_eval = json.loads(cleaned_response)
#             logger.info(f"parsed_eval: {parsed_eval}")
#             langsmith_logger.info("--------------------------------")
            
#             # Validate the evaluation response
#             required_fields = ["intent", "confidence_score", "identified_entities", "refined_prompt"]
#             if not all(field in parsed_eval for field in required_fields):
#                 raise ValueError("Missing required fields in evaluation response")
            
#             # Log the enhanced system prompt
#             logger.info(f"Generated refined prompt: {parsed_eval['refined_prompt']}")
#             # langsmith_logger.log_response(parsed_eval['system_prompt'], {"stage": "prompt_enhancement"})
            
#             return {
#                 "intent": parsed_eval["intent"],
#                 "confidence": parsed_eval["confidence_score"],
#                 "entities": parsed_eval["identified_entities"],
#                 "enhanced_prompt": parsed_eval["refined_prompt"],
#                 "original_message": message
#             }
            
#         except json.JSONDecodeError as e:
#             logger.error(f"Failed to parse evaluation result: {e}")
#             raise ValueError(f"Invalid evaluation response format: {e}")
            
#     except Exception as e:
#         logger.error(f"Error in prompt evaluation: {e}")
#         raise ValueError(f"Failed to evaluate prompt: {e}")


# ARCHITECTURE_PROMPT = """
# Analyze the following architecture modification request and provide a response that exactly matches the specified JSON format:
# User Request: {message}
# Current Architecture Context: {diagram_state}

# You must respond with a JSON object containing exactly these fields:
# {
#     "text_response": "A clear explanation of the architectural changes",
#     "diagram_update": {
#         "action": "add_node/remove_node/modify_node",
#         "nodeType": "type of node",
#         "nodeName": "name of node",
#         "connectionFrom": "source node",
#         "connectTo": "target node"
#     }
# }

# Ensure all fields are filled with appropriate values. The action must be one of: add_node, remove_node, or modify_node.
# """

# SECURITY_PROMPT = """
# Analyze the following security-related request and provide a response that exactly matches the specified JSON format:
# User Request: {message}
# Current Architecture Context: {diagram_state}

# You must respond with a JSON object containing exactly these fields:
# {
#     "text_response": "A detailed security analysis",
#     "diagram_update": {
#         "action": "add_node",
#         "nodeType": "SecurityComponent",
#         "nodeName": "name of security component",
#         "connectionFrom": "source node",
#         "connectTo": "target node"
#     }
# }
# """

# GENERAL_PROMPT = """
# Analyze the following general architecture request and provide a response that exactly matches the specified JSON format:
# User Request: {message}
# Current Architecture Context: {diagram_state}

# You must respond with a JSON object containing exactly these fields:
# {
#     "text_response": "A detailed response to the query",
#     "diagram_update": {
#         "action": "add_node",
#         "nodeType": "Component",
#         "nodeName": "name of component",
#         "connectionFrom": "source node",
#         "connectTo": "target node"
#     }
# }
# """