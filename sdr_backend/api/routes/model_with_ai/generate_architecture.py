from fastapi import APIRouter, HTTPException
from config.settings import OPENAI_API_KEY
from openai import Client
from models.architecture_request import ArchitectureRequest
from models.architecture_response import ArchitectureResponse
from utils.validate_prompt import validate_prompt
from langsmith import trace  # trace decorator for logging
import json
import uuid
from fastapi.responses import JSONResponse

router = APIRouter()

# Domain keywords to check if the query is relevant
DOMAIN_KEYWORDS = [
    "architecture", "tech stack", "threat", "security", "design", "diagram"
]

# @trace  # Logs and traces function execution in LangSmith
def refine_prompt_with_langsmith(prompt: str) -> str:
    """
    Refines the user prompt using LangSmith for clarity.
    If the prompt does not mention any domain-related keywords,
    returns a marker indicating an out-of-context query.
    """
    refinement_system_prompt = """
    You are an expert in refining user queries for AI models.
    Your task is to rewrite the input prompt to be:
    - More structured
    - More detailed
    - Clear about the desired output format
    - Free of ambiguity

    Ensure that the refined prompt specifies:
    - The software architecture type (if mentioned)
    - Security considerations (e.g., threat modeling, secure design)
    - Expected output as a JSON structure

    Output only the improved prompt without any extra text.
    """
    try:
        print("----------------------------------")
        print("Entering Refine Prompt with LangSmith")
        client = Client(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": refinement_system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        refined_prompt = response.choices[0].message.content
        print("----------------------------------")
        print("Refined Prompt:", refined_prompt)
        print("----------------------------------")
        # Check if any domain keywords exist in the refined prompt.
        if not any(keyword in refined_prompt.lower() for keyword in DOMAIN_KEYWORDS):
            return "OUT_OF_CONTEXT"
        return refined_prompt
    except Exception as e:
        print("LangSmith Refinement Error:", e)
        # In case of error, fallback to the original prompt
        return prompt


def generate_architecture_with_llm(prompt: str):
    """
    Calls OpenAI API to generate a structured architecture JSON.
    """
    try:
        # Refine the user prompt
        refined_prompt = refine_prompt_with_langsmith(prompt)
        if refined_prompt == "OUT_OF_CONTEXT":
            return JSONResponse(content={"message": "Please ask related to the technical context"})
        
        system_prompt = """
        You are an AI expert in designing secure software architectures.
        Your task is to generate architecture in JSON format ONLY.
        Do NOT include any explanations, extra text, or markdown formatting.
        Strictly return a valid JSON object with the structure:
        
        {
            "nodes": [
                {"id": "1", "type": "securityService", "data": {"label": "Firewall"}},
                {"id": "2", "type": "authenticationService", "data": {"label": "Auth Service"}}
            ],
            "edges": [
                {"id": "e1-2", "source": "1", "target": "2", "animated": true}
            ]
        }

        Ensure the JSON is well-formed.
        """
        client = Client(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content":  system_prompt},
            {"role": "user", "content": refined_prompt}
        ]
        )

        try:
            # Extract and parse JSON response
            architecture_json = response.choices[0].message.content
            print("Raw LLM Response:", architecture_json)
            parsed_json = json.loads(architecture_json)
            return validate_and_format_response(parsed_json)
        except json.JSONDecodeError:
            print("JSON Decode Error:", str(e))
            raise HTTPException(status_code=500, detail="Invalid JSON response from LLM")
    except Exception as e:
        print("Exception occurred:", e)
        return HTTPException(status_code=500, detail=str(e))
        

def validate_and_format_response(data):
    """
    Validates and ensures the JSON is in ReactFlow-compatible format if the query is 
    related to architecture generation/updating. If the JSON is not in the expected format,
    it returns a chat-like response with expert details.
    """
    print("Data received from LLM:", data)
    # Check if expected keys for ReactFlow are present:
    if "nodes" in data and "edges" in data:
        nodes = data.get("nodes", [])
        edges = data.get("edges", [])
        # nodes = data.get("nodes", [])
        # edges = data.get("edges", [])

        # Ensure unique IDs without breaking connections
        node_ids = set()
        for node in nodes:
            if "id" not in node or not isinstance(node["id"], str):
                node["id"] = str(uuid.uuid4())  
            node_ids.add(node["id"])

        valid_edges = []
        for edge in edges:
            if "id" not in edge or not isinstance(edge["id"], str):
                edge["id"] = str(uuid.uuid4())  
            if edge.get("source") in node_ids and edge.get("target") in node_ids:
                valid_edges.append(edge)
            if edge["source"] not in node_ids or edge["target"] not in node_ids:
                print(f"Invalid edge detected: {edge}")
                continue  # Skip invalid edges

        return {"nodes": nodes, "edges": edges}
    else:
        # If not architecture-specific format, assume it's a chat response.
        # Return the original message or a default message.
        message = data.get("message", "Unable to generate a structured architecture. Please ask related to the technical context.")
        return {"message": message}

# API endpoint
@router.post("/generate_architecture", response_model=ArchitectureResponse)
async def generate_architecture(request: ArchitectureRequest):
    if not validate_prompt(request.prompt):
        raise HTTPException(status_code=400, detail="Invalid prompt. Ensure it's related to architecture.")

    architecture = generate_architecture_with_llm(request.prompt)

    if not architecture:
        raise HTTPException(status_code=500, detail="Failed to generate architecture.")

    return {"status": "success", "architecture": architecture}