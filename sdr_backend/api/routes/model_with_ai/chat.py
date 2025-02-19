from fastapi import APIRouter, HTTPException

from utils.logger import log_info, log_error
import json

# Utils
from utils.prompt_engineering import enhance_prompt
from utils.structured_action_from_prompt import get_structured_action_from_prompt, get_expert_response_from_prompt
from utils.node_linking import auto_link_with_user_nodes

# Models
from models.user_request import UserRequest
router = APIRouter()


@router.post("/chat")
async def process_chat(request: UserRequest): 
    """
    Full flow with context:
    - Accept current node context.
    - Enhance prompt using LLM.
    - Extract structured action.
    - Modify user-drawn diagram as per user's input.
    """
    user_defined_nodes = {node.id: node.model_dump() for node in request.diagram_context.nodes}
    edges = [edge.model_dump() for edge in request.diagram_context.edges]

    try:
        
        log_info(f"Received chat request: {request.user_input}")
        log_info(f"Diagram state: {request.diagram_context}")

        # Evaluate and enhance the prompt
        enhanced_output = await enhance_prompt(request.user_input)
        enhanced_prompt = enhanced_output["enhanced_prompt"]
        category = enhanced_output["category"]
        log_info(f"Enhanced Prompt: {enhanced_prompt}")
        log_info(f"Category: {category}")
        
        # LLM response - node interaction
        if category == "node_interaction":
            structured_response = await get_structured_action_from_prompt(enhanced_prompt, user_defined_nodes)

            if "error" in structured_response:
                return {"status": "error", "message": structured_response["error"]}

            action = structured_response["action"]
            node_details = structured_response["node_details"]

            log_info(f"Action: {action}")
            log_info(f"Node Details: {node_details}")
            
            # Pass the action and details to modify the diagram
            response = auto_link_with_user_nodes(node_details, action, user_defined_nodes, edges)
            return response
        
        # LLM response - expert query
        elif category == "expert_query":
            # Get expert response from LLM or another service based on enhanced prompt
            expert_response = await get_expert_response_from_prompt(enhanced_prompt)
            expert_response_cleaned = json.loads(expert_response["response"])
            log_info(f"Expert response: {type(expert_response_cleaned)}")
            log_info(f"Expert response: {expert_response_cleaned}")

            if "error" in expert_response:
                return {"status": "error", "message": expert_response_cleaned["error"]}
            
            return {"status": "success", "expert_message" : expert_response_cleaned}

        # Out of context
        else:
            return {"status": "error", "message": "Out of context"}
            
    except Exception as e:
        log_error(f"Error processing chat request: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    



# Sampele tests

# NODE INTERACTION

# ADD
# Add a Firewall Protection node and an Intrusion Detection System.

#  MODIFY
#Scenario 1: give full  node name
# Update Firewall Protection node to Firewall.

#Scenario 2: give partial node name
# Update Firewall node to firewall.

# REMOVE
# Remove the Intrusion Detection System node.   

# EXPERT QUERY
# How to make kubernetes fit in secured architecture
