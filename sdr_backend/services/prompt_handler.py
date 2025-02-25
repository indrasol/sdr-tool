from utils.logger import log_info
import json
async def build_prompt(data: dict, model: str = "claude") -> str:
    """
    Construct a robust prompt for the LLM, differentiating between node action and expert query responses.
    """
    log_info(f"Building prompt...")
    if model == "openai":
        base = (
            "You are a security architecture expert specializing in API security, network protection, and compliance "
        "with industry standards such as GDPR, PCI-DSS, and ISO 27001. "
        "Your task is to analyze user queries and provide appropriate security architecture guidance.\n"
        "You can respond in two ways:\n"
        "1. **Architecture Modification Recommendations (Node Actions):** If the user query implies a need to modify the security architecture diagram (e.g., 'How should I secure my API gateway?', 'Add a firewall to protect the database'), return a structured JSON response adhering to the schema of the ArchitectureResponse Pydantic model. This response **MUST ABSOLUTELY** include 'actions', 'explanation', 'references', 'confidence', and 'security_messages' fields.\n" # Stronger MUST ABSOLUTELY
        "2. **Expert Security Advice (Expert Response Message):** If the user query is a general security question or seeks expert advice that does not directly involve diagram modifications (e.g., 'What are common API security threats?', 'Explain GDPR compliance for databases'), return a JSON response with **two fields**: 'expert_advice' containing your expert advice as a string, and **'justification'** explaining the reasoning behind your advice.\n"
        "**You MUST ALWAYS return a structured JSON response in one of the two formats described above. Absolutely choose one of the formats and strictly adhere to it.** Choose the format that best suits the user query.\n" # Stronger MUST ALWAYS and ABSOLUTELY CHOOSE
        "When providing Architecture Modification Recommendations, the 'actions' array should contain 'add', 'modify', 'remove', or 'connect' actions. \n"
        "Each action MUST include 'action', 'node_type', 'node_id', 'properties', and 'position'.\n"
        "**VERY IMPORTANT: Node IDs must follow a specific format based on the action type:**\n" # Even stronger emphasis
        "- For **'add', 'modify', 'remove' actions**, the **'node_id' MUST ABSOLUTELY start with the prefix 'node-'**, followed by a number (e.g., 'node-1', 'node-2', 'node-42').\n" # Stronger MUST ABSOLUTELY
        "- For **'connect' actions**, the **'node_id' MUST ABSOLUTELY start with the prefix 'connection-'**, followed by a number (e.g., 'connection-1', 'connection-2').\n" # Stronger MUST ABSOLUTELY
        "The 'properties' field is crucial and MUST be a JSON object containing configuration details for the node. "
        "Within 'properties', you **MUST ABSOLUTELY** include a field called **'properties_type'** to specify the type of properties being defined.\n" # Stronger MUST ABSOLUTELY
        "**Crucially, the value of 'properties_type' MUST be ONLY one of the following LITERAL values, strictly in lowercase:**\n" # Stronger ONLY and STRICTLY
        "- If 'node_type' is 'firewall', then 'properties_type' MUST be **'firewall'**.\n"
        "- If 'node_type' is 'database', then 'properties_type' MUST be **'database'**.\n"
        "- If 'node_type' is 'api', then 'properties_type' MUST be **'api'**.\n"
        "- If 'node_type' is 'storage', then 'properties_type' MUST be **'storage'**.\n"
        "- **For 'node_type' such as 'API Gateway', 'connection', OR any other node type that does NOT fall into the above categories ('firewall', 'database', 'api', 'storage'), you MUST ABSOLUTELY set 'properties_type' to 'generic' (lowercase).**\n" # Stronger MUST ABSOLUTELY
        "When 'properties_type' is **'generic'**, you should still include basic security-related properties relevant to the 'node_type' in the 'properties' dictionary, such as 'security_level', 'encryption', 'access_control', and 'compliance', but you are not required to include type-specific properties like 'rules' for firewalls or 'encryption_type' for databases.\n" # Guidance for generic properties
        "Ensure that the 'properties' dictionary always includes 'node_type' as well, mirroring the 'node_type' from the action.\n" # Added instruction to include node_type in properties
        "The 'references' field should always be a list of relevant security standards or best practices (e.g., 'OWASP API Security Top 10', 'NIST SP 800-41', 'ISO 27001').\n" # Added references instruction
        "The 'confidence' score MUST be a float value between 0 and 1, indicating your confidence in the provided recommendations.\n" # Added confidence instruction
        "**VERY IMPORTANT: The 'security_messages' field MUST ALWAYS be a JSON list of dictionaries.  Each item in this list MUST be a dictionary.**\n" # Extremely strong and emphasized instruction for security_messages
        "**Each dictionary in the 'security_messages' list MUST have EXACTLY two keys: 'severity' and 'message'. Both 'severity' and 'sessage' MUST have string values.**\n" # Very specific key instructions
        "**The 'severity' value MUST be ONLY one of the following LITERAL strings: 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', or 'INFO'.**\n" # Stronger ONLY and LITERAL
        )

        # Extracting context (no changes)
        nodes_count = len(data.get("diagram_context", {}).get("nodes", []))
        edges_count = len(data.get("diagram_context", {}).get("edges", []))
        compliance_list = data.get("compliance_standards", [])
        compliance_str = ", ".join(compliance_list) if compliance_list else "None"
        log_info(f" prompt details: {nodes_count}, {edges_count}, {compliance_str}")

        context = ( # No changes
            f"\n## Architecture Context:\n"
            f"- **Project ID:** {data.get('project_id', 'N/A')}\n"
            f"- **Nodes in Diagram:** {nodes_count}\n"
            f"- **Edges in Diagram:** {edges_count}\n"
            f"- **Compliance Requirements:** {compliance_str}\n"
        )
        log_info(f" context: {context}")
        # Query from user (no changes)
        user_query = f"\n## User Query:\n- {data.get('query')}\n"
        log_info(f" user_query: {user_query}")

        # Example Response Formats (clarified and added Expert Response example and generic properties example, node_id and security_messages examples - MORE EXAMPLES)
        response_format = """
            "**Example JSON Response Structures:**\n"
            "**1. Architecture Modification Recommendations (ArchitectureResponse schema):**\n"
            "{\n"
            '  "actions": [\n'
            '    {\n'
            '      "action": "add",\n'
            '      "node_type": "firewall",\n'
            '      "node_id": "node-1",\n' # Example node_id for add action
            '      "properties": {\n'
            '        "properties_type": "firewall",
            '        "node_type": "firewall",
            '        "security_level": "high",\n'
            '        "encryption": true,\n'
            '        "access_control": ["admin", "security"],\n'
            '        "compliance": ["PCI-DSS"],\n'
            '        "rules": ["allow https from 0.0.0.0/0"],\n'
            '        "log_retention_days": 90\n'
            '      },\n'
            '      "position": [10.5, 20.3]\n'
            '    },\n'
            '    {\n'
            '      "action": "add",\n'
            '      "node_type": "API Gateway",\n'
            '      "node_id": "node-2",\n' # Example node_id for add action (generic)
            '      "properties": {\n'
            '        "properties_type": "generic",\n' # properties_type is "generic"
            '        "node_type": "API Gateway",\n'
            '        "security_level": "medium",\n'
            '        "encryption": true,\n'
            '        "access_control": ["developer", "admin"],\n'
            '        "compliance": ["ISO 27001"]\n'
            '      },\n'
            '      "position": [50.0, 100.0]\n'
            '    },\n'
            '    {\n'
            '      "action": "connect",\n'
            '      "node_type": "connection",\n'
            '      "node_id": "connection-1",\n' # Example connection_id for connect action
            '      "properties": {\n'
            '        "properties_type": "generic",\n'
            '        "node_type": "connection",\n'
            '        "source": "node-2",\n'
            '        "target": "node-1",\n'
            '        "protocol": "HTTPS"\n'
            '      },\n'
            '      "position": [0, 0]\n'
            '    }\n'
            '  ],\n'
            '  "explanation": "Added perimeter firewall and API Gateway...",\n'
            '  "references": ["NIST SP 800-41", "OWASP ASVS 4.0.3"],\n'
            '  "confidence": 0.95,\n'
            '  "security_messages": [\n' # Example security_messages - List of Dict[str, str] - EXAMPLE 1
            '    {\n'
            '      "Severity": "MEDIUM",\n'
            '      "Message": "API Gateway \'node-2\' should consider rate limiting."\n'
            '    },\n'
            '    {\n'
            '      "Severity": "INFO",\n'
            '      "Message": "API Gateway \'node-2\' could benefit from DDoS protection."\n'
            '    }\n'
            '  ]\n'
            "}\n\n"
            "**Example of different security_messages format:**\n" # Added another example for security_messages
            "{\n"
            '  "actions": [],\n'
            '  "explanation": "...",\n'
            '  "references": [],\n'
            '  "confidence": 0.88,\n'
            '  "security_messages": [\n' # Example security_messages - List of Dict[str, str] - EXAMPLE 2 (more messages, different severities)
            '    {\n'
            '      "severity": "CRITICAL",\n'
            '      "message": "Firewall \'node-1\' log retention MUST be at least 90 days for PCI-DSS compliance."\n'
            '    },\n'
            '    {\n'
            '      "severity": "HIGH",\n'
            '      "message": "Database \'node-3\' is missing encryption at rest, which is a major security vulnerability."\n'
            '    },\n'
            '    {\n'
            '      "severity": "LOW",\n'
            '      "message": "Consider adding descriptions to all API endpoints for better documentation."\n'
            '    }\n'
            '  ]\n'
            "}\n\n"
            "**2. Expert Security Advice (Expert Response Message schema):**\n" # Added Expert Response example
            "{\n"
            '  "expert_message": "Common API security threats include injection attacks, broken authentication, and data breaches. To mitigate these, implement input validation, strong authentication mechanisms, and encryption."\n'
            '  "justification": "These threats are consistently ranked as top API vulnerabilities by OWASP and other security organizations. Input validation prevents injection attacks by ensuring data integrity. Strong authentication and encryption protect against broken authentication and data breaches, respectively. Refer to OWASP API Security Top 10 for more details."\n' # Added justification
            "}\n\n"
            "**Remember to ALWAYS format 'security_messages' as a JSON list of dictionaries, with 'Severity' and 'Message' keys in each dictionary, as shown in the examples above.** Return a response **strictly following one of the two JSON formats above**, with no additional text. Choose the format that is most appropriate for the user query. Ensure all fields of the chosen schema are included in the JSON response." # Even stronger reminder about security_messages and strict format
        """

        # Final prompt (no changes)
        final_prompt = f"{base}\n{context}{user_query}\n{response_format}"
        # log_info(f"Final prompt: {final_prompt}")
        return final_prompt
    elif model == "claude":
        try:
            base_prompt = (
                "You are a security architecture expert specializing in API security, network protection, and compliance "
                "with industry standards such as GDPR, PCI-DSS, and ISO 27001. "
                "Your task is to analyze user queries and provide appropriate security architecture guidance.\n"
                "You can respond in two ways:\n"
                "1. **Architecture Modification Recommendations (Node Actions):** If the user query implies a need to modify "
                "the security architecture diagram, return a structured JSON response adhering to the ArchitectureResponse schema. "
                "This response **MUST ABSOLUTELY** include 'actions', 'explanation', 'references', 'confidence', and 'security_messages' fields.\n"
                "2. **Expert Security Advice (Expert Response Message):** If the user query is a general security question or "
                "seeks expert advice that does not directly involve diagram modifications, return a JSON response with "
                "'expert_message' and 'justification' fields.\n"
            )   
            # Extract context information
            nodes_count = len(data.get("diagram_context", {}).get("nodes", []))
            edges_count = len(data.get("diagram_context", {}).get("edges", []))
            compliance_list = data.get("compliance_standards", [])
            compliance_str = ", ".join(compliance_list) if compliance_list else "None"
            
            # Build context section
            context = (
                f"\n## Architecture Context:\n"
                f"- Project ID: {data.get('project_id', 'N/A')}\n"
                f"- Current Nodes: {nodes_count}\n"
                f"- Current Connections: {edges_count}\n"
                f"- Required Compliance: {compliance_str}\n"
            )
            
            # Add diagram-specific context if available
            if "diagram_context" in data:
                context += "\n## Current Architecture:\n"
                for node in data["diagram_context"].get("nodes", []):
                    context += f"- Node '{node.get('id')}': Type={node.get('type')}, "
                    context += f"Properties={json.dumps(node.get('properties', {}))}\n"
            
            # Add specific requirements
            requirements = (
                "\n## Response Requirements:\n"
                "1. Node IDs must follow these formats:\n"
                "   - For add/modify/remove: 'node-X' (e.g., 'node-1')\n"
                "   - For connections: 'connection-X' (e.g., 'connection-1')\n"
                "2. Properties must include 'properties_type' field:\n"
                "   - Use 'firewall', 'database', 'api', 'storage' for respective types\n"
                "   - Use 'generic' for other types\n"
                "3. Security messages must be list of dicts with 'severity' and 'message'\n"
                "4. Severity levels: 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'\n"
            )
            
            # Add user query
            user_query = f"\n## User Query:\n{data.get('query')}\n"
            
            # Combine all sections
            final_prompt = f"{base_prompt}\n{context}\n{requirements}\n{user_query}"
            
            return final_prompt
            
        except Exception as e:
            log_info(f"Error building prompt: {str(e)}")
            raise ValueError(f"Failed to build prompt: {str(e)}")
