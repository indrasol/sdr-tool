# from models.pydantic_models import ArchitectureResponse, DiagramContext, FirewallProperties, DatabaseProperties, APIProperties, StorageProperties
# from services.exception_handler import SecurityValidationError
# import yaml
# from utils.logger import log_info

# async def apply_security_rules(response: ArchitectureResponse, context: DiagramContext):
#     """Enforce security rules on generated actions and format security messages as List[Dict[str, str]]."""

#     with open("security_rules.yaml", "r") as f:
#         security_rules_config = yaml.safe_load(f)

#     log_info(f"Entered apply_security_rules with response: {response}")

#     node_specific_rules = security_rules_config.get("node_specific_rules", {})
#     global_rules = security_rules_config.get("global_rules", [])

#     security_messages = [] # Changed to security_messages to match desired output and Pydantic model
#     blocking_error_occurred = False # Flag to track if any critical or medium errors occurred

#     for action in response.actions:
#         properties = action.properties

#        # -------- Node-Specific Rules --------
#         if action.node_type in node_specific_rules:
#             rules_for_node_type = node_specific_rules[action.node_type]
#             for rule_config in rules_for_node_type:
#                 rule_id = rule_config["rule_id"]
#                 severity = rule_config["severity"]
#                 description = rule_config["description"]
#                 check_expression = rule_config["check"]

#                 # Evaluate the check expression
#                 rule_valid = eval(check_expression, {}, {"properties": properties, "any": any, "all": all, "rule": rule_config}) # Pass properties and built-in functions

#                 if not rule_valid:
#                     # Create dictionary for security message
#                     message_dict = {
#                         "severity": severity.upper(), # Severity in uppercase as string
#                         "message": f"Rule '{rule_id}' violated for {action.node_type} '{action.node_id}': {description}" # Descriptive message
#                     }
#                     security_messages.append(message_dict) # Append dictionary to security_messages

#                     if severity in ["critical", "medium"]: # Check severity for blocking errors
#                         blocking_error_occurred = True

#         # -------- Global Rules --------
#         for rule_config in global_rules:
#             rule_id = rule_config["rule_id"]
#             severity = rule_config["severity"]
#             description = rule_config["description"]
#             check_expression = rule_config["check"]

#             # Evaluate the check expression
#             rule_valid = eval(check_expression, {}, {"properties": properties, "any": any, "all": all, "rule": rule_config}) # Pass properties and built-in functions

#             if not rule_valid:
#                 # Create dictionary for security message
#                 message_dict = {
#                     "severity": severity.upper(), # Severity in uppercase as string
#                     "message": f"Global Rule '{rule_id}' violated for {action.node_type} '{action.node_id}': {description}" # Descriptive message
#                 }
#                 security_messages.append(message_dict) # Append dictionary to security_messages

#                 if severity in ["critical", "medium"]: # Check severity for blocking errors
#                     blocking_error_occurred = True
    
#     log_info(f"security_messages before: {security_messages}")


#     if blocking_error_occurred: # Raise exception only if critical or medium errors occurred
#             error_string_list = [msg["message"] for msg in security_messages if msg["severity"] in ["CRITICAL", "MEDIUM"]] # Extract messages for critical/medium errors
#             error_string = "\n".join(error_string_list)
#             log_info(f"inside blocking_error_occurred: {error_string}")

#             # Determine overall severity - if any message is CRITICAL, overall is CRITICAL, else MEDIUM
#             overall_severity = "CRITICAL" if any(msg["severity"] == "CRITICAL" for msg in security_messages) else "MEDIUM"
#             raise SecurityValidationError(f"Blocking Security Validation Errors:\n{error_string}", severity=overall_severity) # Pass severity to exception
#     elif security_messages: # If there are any security_messages (warnings/info) but no blocking errors
#         response.security_messages = security_messages # Assign the list of dictionaries to response.security_messages
#         log_info(f"inside elif security_messages: {security_messages}")

#         log_info(f"security_messages after: {security_messages}") # Log the list of dictionaries


#     return None # Indicate successful application of rules (or warnings only)
