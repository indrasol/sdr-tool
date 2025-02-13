from fastapi import APIRouter, HTTPException
from config.settings import OPENAI_API_KEY
from openai import Client
from models.architecture_request import ArchitectureRequest
from models.architecture_response import ArchitectureResponse
from utils.validate_prompt import validate_prompt
import json
import uuid

router = APIRouter()

# Function to call OpenAI and get structured architecture response
# def generate_architecture_with_llm(prompt: str) -> dict:
#     try:
#         system_prompt = """You are an AI expert in designing secure software architectures. 
#         When given a tech stack, generate a structured JSON output that describes the architecture in the following format:

#         {
#             "architecture": [
#                 {
#                     "component": "API Gateway",
#                     "description": "Handles authentication, security, and load balancing.",
#                     "technology": "Amazon API Gateway"
#                 },
#                 {
#                     "component": "Microservices",
#                     "description": "Decoupled services communicating via REST or messaging queues.",
#                     "technology": "Spring Boot, Node.js"
#                 },
#                 {
#                     "component": "Redis",
#                     "description": "Used as caching and session storage.",
#                     "technology": "Redis"
#                 }
#             ]
#         }

#         Always return a valid JSON response, and do not include any extra text outside of JSON format.
#         """
#         client = Client(api_key=OPENAI_API_KEY)
#         response = client.chat.completions.create(
#             model="gpt-4",
#             messages=[
#                 {"role": "system", "content": system_prompt},
#                 {"role": "user", "content": prompt},
#             ]
#         )
#         # print(f"LLM Response: {response}")
#         print(type(response.choices[0].message))
#         print("Message Object Type:", type(response.choices[0].message))
#         print("Message Content Type:", type(response.choices[0].message.content))
#         print("Message Content:", response.choices[0].message.content)

#             # Extract content correctly
#         architecture_json_str = response.choices[0].message.content.strip()

#         # 🚨 Check if the response is **not JSON** and handle errors
#         try:
#             architecture_json = json.loads(architecture_json_str)
#         except json.JSONDecodeError:
#             print("🚨 Error: LLM response is not valid JSON.")
#             return {"error": "Invalid response from AI. Expected JSON format."}

#         return architecture_json

#     except Exception as e:
#         print("🚨 Exception occurred:", e)
#         return {"error": str(e)}

def generate_architecture_with_llm(prompt: str):
    """
    Calls OpenAI API to generate a structured architecture JSON.
    """
    try:
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
            {"role": "user", "content": prompt}
        ]
        )

        try:
            # Extract and parse JSON response
            architecture_json = response.choices[0].message.content
            print("Raw LLM Response:", architecture_json)
            parsed_json = json.loads(architecture_json)
            return validate_and_format_response(parsed_json)
        except json.JSONDecodeError:
            print("🚨 JSON Decode Error:", str(e))
            raise HTTPException(status_code=500, detail="Invalid JSON response from LLM")
    except Exception as e:
        print("Exception occurred:", e)
        return {"error": str(e)}
        

def validate_and_format_response(data):
    """
    Validates and ensures the JSON is in ReactFlow-compatible format.
    """
    print("Data received from LLM:", data)
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    # Ensure IDs are unique
    for node in nodes:
        node["id"] = str(uuid.uuid4())  # Unique ID for each node

    for edge in edges:
        edge["id"] = str(uuid.uuid4())  # Unique ID for each edge
    # for idx, node in enumerate(data.get("components", [])):
    #     node_id = str(uuid.uuid4())  # Unique ID
    #     nodes.append({
    #         "id": node_id,
    #         "type": node.get("type", "default"),
    #         "position": {"x": idx * 200, "y": 100},  # Example layout
    #         "data": {"label": node.get("name", "Unnamed Node")}
    #     })

    #     # Create edges
    #     for target in node.get("connections", []):
    #         edges.append({
    #             "id": str(uuid.uuid4()),
    #             "source": node_id,
    #             "target": target,
    #             "type": "smoothstep"
    #         })

    return {"status": "success", "architecture": {"nodes": nodes, "edges": edges}}

# API endpoint
@router.post("/generate_architecture", response_model=ArchitectureResponse)
async def generate_architecture(request: ArchitectureRequest):
    if not validate_prompt(request.prompt):
        raise HTTPException(status_code=400, detail="Invalid prompt. Ensure it's related to architecture.")

    architecture = generate_architecture_with_llm(request.prompt)

    if not architecture:
        raise HTTPException(status_code=500, detail="Failed to generate architecture.")

    return {"status": "success", "architecture": architecture}