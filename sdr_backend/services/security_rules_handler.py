from models.pydantic_models import ArchitectureResponse, DiagramContext, FirewallProperties, DatabaseProperties, APIProperties, StorageProperties
from services.exception_handler import SecurityValidationError
import yaml

async def apply_security_rules(response: ArchitectureResponse, context: DiagramContext):
    """Enforce security rules on generated actions"""

    with open("security_rules.yaml", "r") as f:
        security_rules_config = yaml.safe_load(f)

    node_specific_rules = security_rules_config.get("node_specific_rules", {})
    global_rules = security_rules_config.get("global_rules", [])

    validation_messages = [] # Renamed to validation_messages to hold both errors and warnings
    blocking_error_occurred = False # Flag to track if any critical or medium errors occurred

    for action in response.actions:
        properties = action.properties

       # -------- Node-Specific Rules --------
        if action.node_type in node_specific_rules:
            rules_for_node_type = node_specific_rules[action.node_type]
            for rule_config in rules_for_node_type:
                rule_id = rule_config["rule_id"]
                severity = rule_config["severity"]
                description = rule_config["description"]
                check_expression = rule_config["check"]

                # Evaluate the check expression
                rule_valid = eval(check_expression, {}, {"properties": properties, "any": any, "all": all, "rule": rule_config}) # Pass properties and built-in functions

                if not rule_valid:
                    message = f"Severity: {severity.upper()} - Rule '{rule_id}' violated for {action.node_type} '{action.node_id}': {description}" # Include severity in message
                    validation_messages.append(message) # Collect all messages

                    if severity in ["critical", "medium"]: # Check severity for blocking errors
                        blocking_error_occurred = True

        # -------- Global Rules --------
        for rule_config in global_rules:
            rule_id = rule_config["rule_id"]
            severity = rule_config["severity"]
            description = rule_config["description"]
            check_expression = rule_config["check"]

            # Evaluate the check expression
            rule_valid = eval(check_expression, {}, {"properties": properties, "any": any, "all": all, "rule": rule_config}) # Pass properties and built-in functions

            if not rule_valid:
                message = f"Severity: {severity.upper()} - Global Rule '{rule_id}' violated for {action.node_type} '{action.node_id}': {description}" # Include severity
                validation_messages.append(message) # Collect all messages

                if severity in ["critical", "medium"]: # Check severity for blocking errors
                    blocking_error_occurred = True


    if blocking_error_occurred: # Raise exception only if critical or medium errors occurred
            error_string = "\n".join([msg for msg in validation_messages if "CRITICAL" in msg.upper() or "MEDIUM" in msg.upper()]) # Only include critical/medium errors in exception
            raise SecurityValidationError(f"Blocking Security Validation Errors:\n{error_string}")
    elif validation_messages: # If there are any validation messages (warnings/info) but no blocking errors
        response.security_validation_errors = validation_messages # Assign all messages to security_validation_errors (renamed field in next step)


    return None # Indicate successful application of rules (or warnings only)
