from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
import json
from utils.logger import log_info

# Import our custom models and services
from models.diagram_models import DiagramRequest, DiagramResponse, Node, Edge
from models.diagram_models import Cluster
from services.diagrams_service import parse_diagrams_code
from services.auth_handler import verify_token
from core.llm.llm_gateway_v1 import LLMService
from core.prompt_engineering.diagram_prompt_builder import generate_diagram_code_prompt, generate_intent_classification_prompt
from services.diagrams_service import compute_layout
# Initialize the router
router = APIRouter()

# Service instances
llm_service = LLMService()


async def call_llm(query: str) -> str:
    """Call LLM to generate diagrams code based on the query."""
    
    # First, check if the query is actually about architecture diagrams
    intent_request = DiagramRequest(query=query)
    intent_prompt = generate_intent_classification_prompt(intent_request)
    
    # Call LLM to classify the intent
    intent_response = await llm_service.generate_llm_response(
        prompt=intent_prompt,
        model_name="gpt-4o",
        model_provider="openai",
        temperature=0.1,
        max_tokens=10  # Intent classification needs very few tokens
    )
    
    # Get the intent classification result
    intent = intent_response.get("content", "").strip().lower()
    log_info(f"Intent: {intent}")
    
    # If not an architecture diagram request, return an error
    if intent != "architecture_diagram":
        raise HTTPException(
            status_code=400, 
            detail="Query does not appear to be requesting an architecture diagram."
        )
    
    # Generate the prompt for diagram code generation
    code_prompt = generate_diagram_code_prompt(intent_request)
    
    # Call LLM to generate the diagram code
    code_response = await llm_service.generate_llm_response(
        prompt=code_prompt,
        model_name="gpt-4o",
        model_provider="openai",
        temperature=0.7,
        max_tokens=2000  # Generous limit for code generation
    )
    
    # Return the generated code
    return code_response.get("content", "")


@router.post("/generate-diagram", response_model=DiagramResponse)
async def generate_diagram(
    request: DiagramRequest,
    # current_user: dict = Depends(verify_token)
) -> DiagramResponse:
    """
    Generate an architecture diagram based on a natural language query.
    
    The endpoint:
    1. Validates that the query is about architecture diagrams
    2. Calls an LLM to generate Python code using the 'diagrams' library
    3. Parses the code to extract nodes and edges
    4. Returns a graph representation compatible with frontend visualization
    
    Args:
        request: Contains the natural language query describing the desired diagram
        current_user: The authenticated user (from token verification)
        
    Returns:
        DiagramResponse: Contains lists of nodes and edges for frontend rendering
    """
    try:
        # Call LLM to generate diagrams code
        diagrams_code = await call_llm(request.query)
        #log_info(f"Diagrams code: {diagrams_code}")
#         diagrams_code = """
# ```python
# from diagrams import Diagram, Cluster, Edge
# from diagrams.aws.compute import EC2, Lambda
# from diagrams.aws.database import RDS, Dynamodb, Redshift
# from diagrams.aws.integration import SQS
# from diagrams.aws.network import ELB, Route53, VPC, CloudFront, NATGateway, InternetGateway
# from diagrams.aws.security import WAF, IAMRole, Cognito, KMS
# from diagrams.aws.storage import S3
# from diagrams.aws.management import Cloudwatch
# from diagrams.aws.analytics import Kinesis
# from diagrams.aws.ml import Sagemaker
# from diagrams.saas.logging import Datadog
# from diagrams.aws.devtools import Codepipeline, Codebuild

# with Diagram("AWS Data Processing Pipeline", show=False, direction="TB"):
#     with Cluster("Networking"):
#         igw = InternetGateway("Internet Gateway")
#         nat = NATGateway("NAT Gateway")
#         with Cluster("VPC"):
#             lb = ELB("Application Load Balancer")
#             waf = WAF("Web Application Firewall")

#             with Cluster("Public Subnet"):
#                 dns = Route53("Route 53")
#                 cdn = CloudFront("CloudFront")

#             with Cluster("Private Subnet"):
#                 web_server = EC2("Web Server")
#                 app_server = EC2("App Server")
#                 api_gateway = Lambda("API Gateway")

#     with Cluster("Data Processing"):
#         with Cluster("Ingestion"):
#             kinesis = Kinesis("Kinesis Data Streams")
#             queue = SQS("SQS Queue")

#         with Cluster("Processing and Analysis"):
#             sagemaker = Sagemaker("Sagemaker")
#             redshift = Redshift("Redshift")

#         with Cluster("Storage"):
#             data_lake = S3("Data Lake")
#             ddb = Dynamodb("DynamoDB")

#     with Cluster("Security & IAM"):
#         iam_role = IAMRole("IAM Role")
#         kms = KMS("KMS")

#     with Cluster("Monitoring & Logging"):
#         cloudwatch = Cloudwatch("CloudWatch")
#         datadog = Datadog("Datadog")

#     with Cluster("CI/CD"):
#         pipeline = Codepipeline("CodePipeline")
#         build = Codebuild("CodeBuild")

#     # Network and Access
#     dns >> Edge(label="DNS Resolution") >> cdn
#     cdn >> Edge(label="HTTPS 443 / TLS1.3") >> waf
#     waf >> Edge(label="HTTPS 443 / TLS1.3") >> lb
#     lb >> Edge(label="HTTPS 443 / TLS1.3") >> web_server
#     lb >> Edge(label="HTTPS 443 / TLS1.3") >> app_server
#     web_server >> Edge(label="HTTPS 443 / TLS1.3") >> api_gateway

#     # Data Ingestion
#     api_gateway >> Edge(label="PutRecord API / TLS1.3") >> kinesis
#     kinesis >> Edge(label="Kinesis Data Firehose") >> queue

#     # Processing and Analysis
#     queue >> Edge(label="SQS Polling") >> sagemaker
#     sagemaker >> Edge(label="Batch Transform") >> redshift

#     # Storage
#     redshift >> Edge(label="Copy Command") >> data_lake
#     sagemaker >> Edge(label="PutItem") >> ddb

#     # Security & IAM
#     web_server >> Edge(label="AssumeRole") >> iam_role
#     app_server >> Edge(label="Encrypt/Decrypt") >> kms

#     # Monitoring & Logging
#     web_server >> Edge(label="Logs") >> cloudwatch
#     app_server >> Edge(label="Metrics") >> datadog

#     # CI/CD
#     pipeline >> Edge(label="Build Trigger") >> build
#     build >> Edge(label="Deploy") >> lb
# """
        
        # Parse the generated code to extract nodes and edges
        graph = parse_diagrams_code(diagrams_code)
        
        # Convert to Pydantic models
        nodes = [
            Node(
                id=n['id'], 
                data=n['data'],
                type="custom"
            ) for n in graph['nodes']
        ]
        #log_info(f"Nodes: {nodes}")
        
        edges = [
            Edge(
                id=e['id'], 
                label=e.get('label', e.get('operator', '')),
                source=e['source'], 
                target=e['target']
            ) for e in graph['edges']
        ]
        #log_info(f"Edges: {edges}")
        # NEW: convert clusters
        clusters = [
            Cluster(
                cluster_id=c['cluster_id'],
                cluster_label=c['cluster_label'],
                cluster_nodes=c['cluster_nodes'],
                cluster_parent=c.get('cluster_parent', [])
            ) for c in graph.get('clusters', [])
        ]
        #log_info(f"Clusters: {clusters}")
        positions = compute_layout([n.dict() for n in nodes], [e.dict() for e in edges])
        #log_info(f"Layout: {positions}")
        # Update nodes with positions
        for node in nodes:
            if node.id in positions:
                node.position = positions[node.id]

        # Return updated graph
        #log_info(f"Response nodes: {nodes}, edges: {edges}, clusters: {clusters}")
        return DiagramResponse(nodes=nodes, edges=edges, clusters=clusters)
        
    except Exception as e:
        # Log the error and return a user-friendly message
        raise HTTPException(
            status_code=500,
            detail=f"Error generating diagram: {str(e)}"
        )





# from fastapi import APIRouter, Depends, HTTPException
# from typing import Dict, Any
# import json
# from utils.logger import log_info

# # Import our custom models and services
# from models.diagram_models import DiagramRequest, DiagramResponse, Node, Edge
# from models.diagram_models import Cluster
# from services.diagrams_service import parse_diagrams_code
# from services.auth_handler import verify_token
# from core.llm.llm_gateway_v1 import LLMService
# from core.prompt_engineering.diagram_prompt_builder import generate_diagram_code_prompt, generate_intent_classification_prompt
# from services.diagrams_service import compute_layout
# # Initialize the router
# router = APIRouter()

# # Service instances
# llm_service = LLMService()


# async def call_llm(query: str) -> str:
#     """Call LLM to generate diagrams code based on the query."""
    
#     # First, check if the query is actually about architecture diagrams
#     intent_request = DiagramRequest(query=query)
#     intent_prompt = generate_intent_classification_prompt(intent_request)
    
#     # Call LLM to classify the intent
#     intent_response = await llm_service.generate_llm_response(
#         prompt=intent_prompt,
#         model_name="gpt-4o",
#         model_provider="openai",
#         temperature=0.1,
#         max_tokens=10  # Intent classification needs very few tokens
#     )
    
#     # Get the intent classification result
#     intent = intent_response.get("content", "").strip().lower()
#     log_info(f"Intent: {intent}")
    
#     # If not an architecture diagram request, return an error
#     if intent != "architecture_diagram":
#         raise HTTPException(
#             status_code=400, 
#             detail="Query does not appear to be requesting an architecture diagram."
#         )
    
#     # Generate the prompt for diagram code generation
#     code_prompt = generate_diagram_code_prompt(intent_request)
    
#     # Call LLM to generate the diagram code
#     code_response = await llm_service.generate_llm_response(
#         prompt=code_prompt,
#         model_name="gpt-4o",
#         model_provider="openai",
#         temperature=0.7,
#         max_tokens=2000  # Generous limit for code generation
#     )
    
#     # Return the generated code
#     return code_response.get("content", "")


# @router.post("/generate-diagram", response_model=DiagramResponse)
# async def generate_diagram(
#     request: DiagramRequest,
#     # current_user: dict = Depends(verify_token)
# ) -> DiagramResponse:
#     """
#     Generate an architecture diagram based on a natural language query.
    
#     The endpoint:
#     1. Validates that the query is about architecture diagrams
#     2. Calls an LLM to generate Python code using the 'diagrams' library
#     3. Parses the code to extract nodes and edges
#     4. Returns a graph representation compatible with frontend visualization
    
#     Args:
#         request: Contains the natural language query describing the desired diagram
#         current_user: The authenticated user (from token verification)
        
#     Returns:
#         DiagramResponse: Contains lists of nodes and edges for frontend rendering
#     """
#     try:
#         # Call LLM to generate diagrams code
#         # diagrams_code = await call_llm(request.query)
#         # log_info(f"Diagrams code: {diagrams_code}")
#         diagrams_code = """
# ```python
# from diagrams import Diagram, Cluster, Edge
# from diagrams.aws.compute import EC2, Lambda
# from diagrams.aws.database import RDS, Dynamodb, Redshift
# from diagrams.aws.integration import SQS
# from diagrams.aws.network import ELB, Route53, VPC, CloudFront, NATGateway, InternetGateway
# from diagrams.aws.security import WAF, IAMRole, Cognito, KMS
# from diagrams.aws.storage import S3
# from diagrams.aws.management import Cloudwatch
# from diagrams.aws.analytics import Kinesis
# from diagrams.aws.ml import Sagemaker
# from diagrams.saas.logging import Datadog
# from diagrams.aws.devtools import Codepipeline, Codebuild

# with Diagram("AWS Data Processing Pipeline", show=False, direction="TB"):
#     with Cluster("Networking"):
#         igw = InternetGateway("Internet Gateway")
#         nat = NATGateway("NAT Gateway")
#         with Cluster("VPC"):
#             lb = ELB("Application Load Balancer")
#             waf = WAF("Web Application Firewall")

#             with Cluster("Public Subnet"):
#                 dns = Route53("Route 53")
#                 cdn = CloudFront("CloudFront")

#             with Cluster("Private Subnet"):
#                 web_server = EC2("Web Server")
#                 app_server = EC2("App Server")
#                 api_gateway = Lambda("API Gateway")

#     with Cluster("Data Processing"):
#         with Cluster("Ingestion"):
#             kinesis = Kinesis("Kinesis Data Streams")
#             queue = SQS("SQS Queue")

#         with Cluster("Processing and Analysis"):
#             sagemaker = Sagemaker("Sagemaker")
#             redshift = Redshift("Redshift")

#         with Cluster("Storage"):
#             data_lake = S3("Data Lake")
#             ddb = Dynamodb("DynamoDB")

#     with Cluster("Security & IAM"):
#         iam_role = IAMRole("IAM Role")
#         kms = KMS("KMS")

#     with Cluster("Monitoring & Logging"):
#         cloudwatch = Cloudwatch("CloudWatch")
#         datadog = Datadog("Datadog")

#     with Cluster("CI/CD"):
#         pipeline = Codepipeline("CodePipeline")
#         build = Codebuild("CodeBuild")

#     # Network and Access
#     dns >> Edge(label="DNS Resolution") >> cdn
#     cdn >> Edge(label="HTTPS 443 / TLS1.3") >> waf
#     waf >> Edge(label="HTTPS 443 / TLS1.3") >> lb
#     lb >> Edge(label="HTTPS 443 / TLS1.3") >> web_server
#     lb >> Edge(label="HTTPS 443 / TLS1.3") >> app_server
#     web_server >> Edge(label="HTTPS 443 / TLS1.3") >> api_gateway

#     # Data Ingestion
#     api_gateway >> Edge(label="PutRecord API / TLS1.3") >> kinesis
#     kinesis >> Edge(label="Kinesis Data Firehose") >> queue

#     # Processing and Analysis
#     queue >> Edge(label="SQS Polling") >> sagemaker
#     sagemaker >> Edge(label="Batch Transform") >> redshift

#     # Storage
#     redshift >> Edge(label="Copy Command") >> data_lake
#     sagemaker >> Edge(label="PutItem") >> ddb

#     # Security & IAM
#     web_server >> Edge(label="AssumeRole") >> iam_role
#     app_server >> Edge(label="Encrypt/Decrypt") >> kms

#     # Monitoring & Logging
#     web_server >> Edge(label="Logs") >> cloudwatch
#     app_server >> Edge(label="Metrics") >> datadog

#     # CI/CD
#     pipeline >> Edge(label="Build Trigger") >> build
#     build >> Edge(label="Deploy") >> lb
# """
        
#         # Parse the generated code to extract nodes and edges
#         graph = parse_diagrams_code(diagrams_code)
        
#         # Convert to Pydantic models
#         nodes = [
#             Node(
#                 id=n['id'], 
#                 data=n['data'],
#                 type="custom"
#             ) for n in graph['nodes']
#         ]
#         log_info(f"Nodes: {nodes}")
        
#         edges = [
#             Edge(
#                 id=e['id'], 
#                 source=e['source'], 
#                 target=e['target']
#             ) for e in graph['edges']
#         ]
#         log_info(f"Edges: {edges}")
#         # NEW: convert clusters
#         clusters = [
#             Cluster(
#                 cluster_id=c['cluster_id'],
#                 cluster_label=c['cluster_label'],
#                 cluster_nodes=c['cluster_nodes'],
#                 cluster_parent=c.get('cluster_parent', [])
#             ) for c in graph.get('clusters', [])
#         ]
#         log_info(f"Clusters: {clusters}")
#         positions = compute_layout([n.dict() for n in nodes], [e.dict() for e in edges])
#         log_info(f"Layout: {positions}")
#         # Update nodes with positions
#         for node in nodes:
#             if node.id in positions:
#                 node.position = positions[node.id]

#         # Return updated graph
#         log_info(f"Response nodes: {nodes}, edges: {edges}, clusters: {clusters}")
#         return DiagramResponse(nodes=nodes, edges=edges, clusters=clusters)
        
#     except Exception as e:
#         # Log the error and return a user-friendly message
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error generating diagram: {str(e)}"
#         )
