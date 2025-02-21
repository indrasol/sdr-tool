def build_prompt(data: dict) -> str:
    """
    Construct a robust prompt for the LLM, ensuring security architecture recommendations are well-structured.
    """
    base = (
        "You are a security architecture expert specializing in API security, network protection, and compliance "
        "with industry standards such as GDPR, PCI-DSS, and ISO 27001. "
        "Your task is to analyze and improve an architecture based on the given inputs."
        "Always return a structured JSON response."
    )

    # Extracting context
    nodes_count = len(data.get("diagram_context", {}).get("nodes", []))
    edges_count = len(data.get("diagram_context", {}).get("edges", []))
    compliance_list = data.get("compliance_standards", [])
    compliance_str = ", ".join(compliance_list) if compliance_list else "None"

    context = (
        f"\n## Architecture Context:\n"
        f"- **Project ID:** {data.get('project_id', 'N/A')}\n"
        f"- **Nodes in Diagram:** {nodes_count}\n"
        f"- **Edges in Diagram:** {edges_count}\n"
        f"- **Compliance Requirements:** {compliance_str}\n"
    )

    # Query from user
    user_query = f"\n## User Query:\n- {data['user_input']}\n"

    # Expected Response Format
    response_format = """
    ## Expected JSON Response:
    ```json
    {
      "recommendations": [
        {
          "component": "API Gateway",
          "security_measures": [
            "Use OAuth 2.0 for authentication",
            "Implement rate limiting to prevent abuse",
            "Enable logging and monitoring"
          ],
          "compliance_alignment": ["GDPR", "ISO 27001"]
        }
      ],
      "summary": "Secure your API gateway using OAuth 2.0, rate limiting, and monitoring."
    }
    ```
    """

    # Final prompt
    return f"{base}\n{context}{user_query}\n{response_format}\nProvide a response strictly in the above JSON format."
