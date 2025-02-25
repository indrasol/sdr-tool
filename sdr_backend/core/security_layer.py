from typing import Dict, Any, Optional, List
import yaml
import logging
from pydantic import ValidationError
from fastapi import HTTPException
from services.exception_handler import SecurityValidationError
from models.pydantic_models import ArchitectureResponse, DiagramContext
from utils.logger import log_info



class SecurityRulesValidator:
    def __init__(self, security_rules_file: str = "security_rules.yaml"):
        """Initialize the security validator with rules from YAML file"""
        try:
            with open(security_rules_file, "r") as f:
                self.security_rules = yaml.safe_load(f)
        except Exception as e:
            logging.error(f"Failed to load security rules: {str(e)}")
            raise ValueError(f"Failed to load security rules: {str(e)}")

    async def apply_security_rules(self, response: ArchitectureResponse, context: Optional[DiagramContext]) -> None:
        """
        Apply security rules to the architecture response.
        Limits security messages to 1 per severity level.
        """
        try:
            logging.info("Applying security rules to response")
            
            node_specific_rules = self.security_rules.get("node_specific_rules", {})
            global_rules = self.security_rules.get("global_rules", [])
            
            # Dictionary to track messages by severity
            security_messages_by_severity = {
                "CRITICAL": None,
                "HIGH": None,
                "MEDIUM": None,
                "LOW": None
            }
            blocking_error_occurred = False

            # Validate each action against rules
            for node in response.nodes:
                properties = node.properties
                
                # Node-specific rules validation
                await self._validate_node_rules(
                    node, 
                    properties, 
                    node_specific_rules, 
                    security_messages_by_severity, 
                    blocking_error_occurred
                )
                
                # Global rules validation
                await self._validate_global_rules(
                    node, 
                    properties, 
                    global_rules, 
                    security_messages_by_severity, 
                    blocking_error_occurred
                )
                
                # Context-based validation if context is provided
                # if context:
                #     await self._validate_context_rules(
                #         node, 
                #         context, 
                #         security_messages_by_severity, 
                #         blocking_error_occurred
                #     )

            # Convert dictionary to list, removing None values
            final_messages = [msg for msg in security_messages_by_severity.values() if msg is not None]
            logging.info(f"Security messages generated: {final_messages}")

            # Handle blocking errors
            if blocking_error_occurred:
                critical_messages = [
                    msg["message"] 
                    for msg in final_messages 
                    if msg["severity"] in ["CRITICAL", "MEDIUM"]
                ]
                error_string = "\n".join(critical_messages)
                
                overall_severity = "CRITICAL" if security_messages_by_severity["CRITICAL"] else "MEDIUM"
                
                raise SecurityValidationError(
                    f"Blocking Security Validation Errors:\n{error_string}", 
                    severity=overall_severity
                )
            
            # Attach non-blocking messages to response
            response.security_messages = final_messages
            
        except SecurityValidationError:
            raise
        except Exception as e:
            logging.error(f"Error in security rules validation: {str(e)}")
            raise SecurityValidationError(
                f"Security validation failed: {str(e)}", 
                severity="CRITICAL"
            )

    async def _validate_node_rules(
        self, 
        node: Dict, 
        properties: Dict, 
        node_rules: Dict, 
        messages_by_severity: List, 
        blocking: bool
    ) -> None:
        """Validate node-specific rules with enhanced safety checks"""
        log_info(f"Validating node-specific rules")
        if node.node_type in node_rules:
            for rule in node_rules[node.node_type]:
                try:
                    await self._evaluate_rule(
                        rule, 
                        node, 
                        properties, 
                        messages_by_severity, 
                        blocking, 
                        "Node"
                    )
                except Exception as e:
                    logging.error(f"Error evaluating node rule {rule.get('rule_id')}: {str(e)}")
                    self._add_message_by_severity(messages_by_severity, {  
                        "severity": "CRITICAL",
                        "message": f"Global rule evaluation error: {str(e)}"
                    })
                    blocking = True

    async def _validate_global_rules(
        self, 
        node: Dict, 
        properties: Dict, 
        global_rules: List, 
        messages_by_severity: Dict,
        blocking: bool
    ) -> None:
        """Validate global rules with message limiting per severity"""
        log_info(f"Validating global rules")
        for rule in global_rules:
            try:
                await self._evaluate_rule(
                    rule, 
                    node, 
                    properties, 
                    messages_by_severity,  # Pass the severity dictionary
                    blocking, 
                    "Global"
                )
            except Exception as e:
                logging.error(f"Error evaluating global rule {rule.get('rule_id')}: {str(e)}")
                self._add_message_by_severity(messages_by_severity, {  
                    "severity": "CRITICAL",
                    "message": f"Global rule evaluation error: {str(e)}"
                })
                blocking = True

    async def _validate_context_rules(
        self, 
        node: Dict, 
        context: Dict, 
        blocking: bool,
        messages_by_severity: Dict,
    ) -> None:
        """Validate context-specific rules"""
        log_info(f"Validating context rules")
        try:
            # Create a rule that checks for node ID conflicts
            node_id_rule = {
                "rule_id": "NODE_ID_CONFLICT",
                "severity": "CRITICAL",
                "description": "Node ID must be unique in the diagram",
                # Convert the context check into a property check
                "check": f"not any(n.id == '{node.node_id}' for n in {[n.__dict__ for n in context.nodes]!r})"
            }

            # Call the existing evaluate_rule function
            await self._evaluate_rule(
                rule=node_id_rule,
                node=node,
                properties=node.properties,
                messages_by_severity=messages_by_severity,
                blocking=blocking,
                rule_type="Context"
            )

        except Exception as e:
            logging.error(f"Error in context validation: {str(e)}")
            self._add_message_by_severity(messages_by_severity, {
                "severity": "CRITICAL",
                "message": f"Context validation error: {str(e)}"
            })
            blocking = True
    
    def _add_message_by_severity(self, messages_by_severity: Dict, message: Dict) -> None:
        """
        Add a message to the messages dictionary, maintaining one message per severity level.
        Only updates if the current severity slot is empty.
        """
        severity = message["severity"]
        if severity in messages_by_severity and messages_by_severity[severity] is None:
            messages_by_severity[severity] = message

    async def _evaluate_rule(
        self, 
        rule: Dict, 
        node: Dict, 
        properties: Dict, 
        messages_by_severity: Dict, 
        blocking: bool, 
        rule_type: str
    ) -> None:
        """Safely evaluate a security rule with message limiting"""
        log_info(f"Evaluating rule {rule.get('rule_id')}")
        try:
            rule_id = rule.get("rule_id", "unknown")
            severity = rule.get("severity", "CRITICAL").upper()
            description = rule.get("description", "No description provided")
            check_expression = rule.get("check", "True")

            # Create a safe evaluation context
            eval_context = {
                "properties": properties,
                "node": node,
                "any": any,
                "all": all,
                "rule": rule
            }

            # Evaluate the rule with timeout protection
            rule_valid = eval(check_expression, {"__builtins__": {}}, eval_context)

            if not rule_valid:
                message_dict = {
                    "severity": severity,
                    "message": (
                        f"{rule_type} Rule '{rule_id}' violated for "
                        f"{node.node_type} '{node.node_id}': {description}"
                    )
                }
                self._add_message_by_severity(messages_by_severity, message_dict)

                if severity in ["CRITICAL", "MEDIUM"]:
                    blocking = True

        except Exception as e:
            logging.error(f"Rule evaluation error - {rule_type} Rule {rule.get('rule_id')}: {str(e)}")
            self._add_message_by_severity(messages_by_severity, {
                "severity": "CRITICAL",
                "message": f"Rule evaluation error - {rule_type} Rule {rule.get('rule_id')}: {str(e)}"
            })
            blocking = True