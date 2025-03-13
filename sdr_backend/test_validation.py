# import json
# from pydantic import ValidationError
# from models.pydantic_models import ArchitectureResponse  # Replace with your actual import

# llm_response_json_str = """
# {
#     "actions": [{
#         "action": "add",
#         "node_type": "firewall",
#         "node_id": "node-1",
#         "properties": {
#             "properties_type": "firewall",
#             "node_type": "firewall",
#             "security_level": "high",
#             "encryption": true,
#             "access_control": ["admin", "security"],
#             "compliance": ["PCI-DSS"],
#             "rules": ["allow https from 0.0.0.0/0"],
#             "log_retention_days": 90
#         },
#         "position": [10.5, 20.3]
#     }],
#     "explanation": "Added a firewall to secure the network. This firewall has a high security level with encryption enabled. It is compliant with PCI-DSS and allows https traffic from all IPs. The logs are retained for 90 days.",
#     "references": ["NIST SP 800-41", "OWASP ASVS 4.0.3"],
#     "confidence": 0.92,
#     "security_messages": ["Severity: CRITICAL - Firewall 'node-1' log retention must be at least 30 days for 'high' security."]
# }
# """

# llm_response = json.loads(llm_response_json_str)

# try:
#     validated_response = ArchitectureResponse(**llm_response)
#     print("Validation successful!")
#     print(validated_response)
# except ValidationError as e:
#     print("Validation Error!")
#     print(e)
# except Exception as e:
#     print("Other Error!")
#     print(e)
