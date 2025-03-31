# services/mapper_service.py
from typing import Dict, Any, List, Tuple
import re
from utils.logger import log_info

class ADToPytmMapper:

    def __init__(self):
        # Define keywords for mapping (case-insensitive)
        self.actor_keywords = ['user', 'customer', 'actor', 'admin', 'operator', 'client', 'browser', 'end user', 'person', 'consumer']
        self.datastore_keywords = ['db', 'database', 'sql', 'mongo', 'redis', 'storage', 's3', 'blob', 'cache', 'postgres', 'mysql', 'dynamodb', 'data store', 'repository']
        self.server_keywords = ['api', 'server', 'service', 'backend', 'app', 'application', 'node', 'worker', 'web server', 'app server', 'microservice', 'container', 'service']
        self.lambda_keywords = ['lambda', 'function', 'faas', 'azure function', 'google cloud function', 'serverless']
        self.process_keywords = ['process', 'daemon', 'job', 'task', 'batch', 'cron']
        self.external_entity_keywords = ['third party', 'external', 'partner', 'integration', 'api gateway', 'payment gateway']
        self.boundary_keywords = ['internet', 'external', 'dmz', 'vpc', 'network', 'internal', 'zone', 'tier', 'public', 'private', 'security group', 'trust boundary']
        # Network components that are often represented in diagrams
        self.network_keywords = ['firewall', 'load balancer', 'cdn', 'router', 'switch', 'gateway', 'proxy', 'waf', 'vpn']
        # Add more specific keywords as needed

    def _infer_element_type(self, label: str) -> str:
        """Infers pytm element type from node label."""
        if not label or not isinstance(label, str):
            log_info(f"Invalid label for type inference: {label}, defaulting to Server")
            return "Server"
            
        label_lower = label.lower().strip()
        
        # Check if this is a network component (special handling)
        if any(keyword in label_lower for keyword in self.network_keywords):
            # Network components might be servers (firewalls, CDNs), or external entities (proxies)
            # We'll classify them as servers, which is a reasonable default for threat modeling
            if 'firewall' in label_lower or 'waf' in label_lower:
                log_info(f"Detected '{label}' as network security component, mapping to Server type with security role")
                return "Server"  # Firewalls are typically treated as servers in threat models
            elif 'cdn' in label_lower or 'load balancer' in label_lower:
                log_info(f"Detected '{label}' as network infrastructure component, mapping to Server type")
                return "Server"
            else:
                log_info(f"Detected '{label}' as generic network component, mapping to ExternalEntity")
                return "ExternalEntity"
        
        # Check for exact matches first (more precise)
        if any(keyword == label_lower or keyword + 's' == label_lower for keyword in self.actor_keywords):
            log_info(f"Detected '{label}' as exact match to Actor keyword")
            return "Actor"
        if any(keyword == label_lower or keyword + 's' == label_lower for keyword in self.datastore_keywords):
            log_info(f"Detected '{label}' as exact match to Datastore keyword")
            return "Datastore"
        if any(keyword == label_lower or keyword + 's' == label_lower for keyword in self.lambda_keywords):
            log_info(f"Detected '{label}' as exact match to Lambda keyword")
            return "Lambda"
        if any(keyword == label_lower or keyword + 's' == label_lower for keyword in self.process_keywords):
            log_info(f"Detected '{label}' as exact match to Process keyword")
            return "Process"
        if any(keyword == label_lower or keyword + 's' == label_lower for keyword in self.external_entity_keywords):
            log_info(f"Detected '{label}' as exact match to ExternalEntity keyword")
            return "ExternalEntity"
            
        # Then check for partial matches (less precise, but still useful)
        if any(keyword in label_lower for keyword in self.actor_keywords):
            log_info(f"Detected '{label}' as Actor via keyword match")
            return "Actor"
        if any(keyword in label_lower for keyword in self.lambda_keywords):
            log_info(f"Detected '{label}' as Lambda via keyword match")
            return "Lambda"
        if any(keyword in label_lower for keyword in self.datastore_keywords):
            log_info(f"Detected '{label}' as Datastore via keyword match")
            return "Datastore"
        if any(keyword in label_lower for keyword in self.process_keywords):
            log_info(f"Detected '{label}' as Process via keyword match")
            return "Process"
        if any(keyword in label_lower for keyword in self.external_entity_keywords):
            log_info(f"Detected '{label}' as ExternalEntity via keyword match")
            return "ExternalEntity"
        if any(keyword in label_lower for keyword in self.server_keywords):
            log_info(f"Detected '{label}' as Server via keyword match")
            return "Server"
            
        # If we reach here, use server as default but log it
        log_info(f"Label '{label}' did not match specific keywords, defaulting to Server type")
        return "Server"  # Default guess

    def _get_node_label(self, node: Dict) -> str:
        """Safely extracts label from node data."""
        return node.get("data", {}).get("label", node.get("id", "unlabeled_node")).strip()

    def _sanitize_for_var(self, name: str) -> str:
        """Creates a safer Python variable name."""
        # Remove leading/trailing whitespace
        name = name.strip()
        # Replace invalid characters with underscore
        s = re.sub(r'\W|^(?=\d)', '_', name)
        # Ensure it's not empty and doesn't start with underscore if original didn't
        if not s or (s.startswith('_') and not name.startswith('_')):
            s = 'var_' + s
        # Ensure it's not a Python keyword (simple check)
        keywords = {'for', 'while', 'if', 'else', 'import', 'from', 'class', 'def'}
        if s in keywords:
            s += '_'
        return s

    def generate_pytm_model_code(self, diagram_state: Dict[str, Any]) -> str:
        """Generates pytm Python code string from AD state."""
        nodes = diagram_state.get("nodes", [])
        edges = diagram_state.get("edges", [])

        if not nodes:
            log_info("Cannot generate pytm code: No nodes found in Architecture Diagram")
            # Return minimal valid pytm code that does nothing
            return "from pytm import TM\ntm = TM('empty_tm')\ntm.process()\n"

        pytm_code_lines = [
            "from pytm import TM, Server, Datastore, Actor, Boundary, Dataflow, Lambda, Process, ExternalEntity",
            "# from pytm.pytm import Classification # If needed for data classification",
            "import uuid # Make uuid available if needed",
            "",
            "tm = TM('Generated Threat Model')",
            "tm.description = 'Threat model generated from architecture diagram'",
            "# tm.isOrdered = True # Optional",
            "# tm.threatsFile = 'path/to/custom/threats.json' # Optional",
            ""
        ]

        # --- 1. Define Boundaries ---
        pytm_code_lines.append("# Define Boundaries")
        # Define dynamically based on potential keywords or rely on assignment logic
        defined_boundaries = {
            'Internet / External': 'b_internet',
            'DMZ / Edge Tier': 'b_dmz',
            'Application Tier': 'b_app',
            'Data Tier': 'b_data',
            'Internal Network': 'b_internal' # Added another common one
        }
        for label, var_name in defined_boundaries.items():
            pytm_code_lines.append(f"{var_name} = Boundary('{label}')")
        pytm_code_lines.append("")

        # --- 2. Define Elements (Nodes) ---
        pytm_code_lines.append("# Define Elements (from AD Nodes)")
        element_vars = {} # Map AD node ID to pytm variable name
        var_name_counts = {} # To ensure unique var names

        for node in nodes:
            node_id = node.get("id")
            if not node_id:
                log_info(f"Skipping node due to missing ID: {node.get('data')}")
                continue

            label = self._get_node_label(node)
            if not label or label == 'unlabeled_node':
                 log_info(f"Skipping node {node_id} due to missing or default label.")
                 continue # Skip nodes without meaningful labels

            pytm_type = self._infer_element_type(label)
            base_var_name = self._sanitize_for_var(label)

            # Ensure unique variable name
            count = var_name_counts.get(base_var_name, 0) + 1
            var_name_counts[base_var_name] = count
            var_name = f"{base_var_name}_{count}" if count > 1 else base_var_name
            # Handle potential collision if a _1 name already exists naturally
            while var_name in element_vars.values():
                 count += 1
                 var_name_counts[base_var_name] = count
                 var_name = f"{base_var_name}_{count}"


            element_vars[node_id] = var_name

            # Define the element in code
            pytm_code_lines.append(f"{var_name} = {pytm_type}('{label}')") # Use original label for name

            # --- Add Common Properties (Refined) ---
            label_lower = label.lower()
            if pytm_type in ["Server", "Datastore", "Lambda"]:
                # Basic OS guessing
                os_guess = "Linux" # Default
                if "windows" in label_lower: os_guess = "Windows"
                elif "ubuntu" in label_lower: os_guess = "Ubuntu"
                elif "centos" in label_lower: os_guess = "CentOS"
                pytm_code_lines.append(f"{var_name}.OS = '{os_guess}'")
                pytm_code_lines.append(f"{var_name}.controls.isHardened = False # Default: Assume not hardened")
                if pytm_type == "Server":
                     pytm_code_lines.append(f"{var_name}.controls.sanitizesInput = True # Default: Assume basic sanitization")
                     pytm_code_lines.append(f"{var_name}.controls.encodesOutput = True # Default: Assume basic encoding")

            if pytm_type == "Datastore":
                 # Guess sensitivity based on keywords
                 sensitive_keywords = ['user', 'customer', 'account', 'credential', 'token', 'secret', 'pii', 'personal']
                 stores_sensitive = any(sk in label_lower for sk in sensitive_keywords)
                 pytm_code_lines.append(f"{var_name}.controls.storesSensitiveData = {stores_sensitive}")
                 is_sql = any(sql_kw in label_lower for sql_kw in ['sql', 'postgres', 'mysql', 'aurora'])
                 pytm_code_lines.append(f"{var_name}.isSQL = {is_sql}")

            # --- Boundary Assignment Logic (Refined Example) ---
            assigned_boundary_label = None
            
            # Process network segments and security domains more intelligently
            if pytm_type == "Actor" or "external" in label_lower or "internet" in label_lower:
                assigned_boundary_label = 'Internet / External'
            elif "firewall" in label_lower or "waf" in label_lower or "cdn" in label_lower or "load balancer" in label_lower:
                assigned_boundary_label = 'DMZ / Edge Tier'
            elif pytm_type == "Datastore" or any(kw in label_lower for kw in self.datastore_keywords):
                assigned_boundary_label = 'Data Tier'
            elif pytm_type == "Process" or pytm_type == "Lambda":
                # Processing jobs typically run in application tier
                assigned_boundary_label = 'Application Tier'
            elif pytm_type == "Server" and any(kw in label_lower for kw in ['api', 'service', 'backend', 'app']):
                assigned_boundary_label = 'Application Tier'
            elif "internal" in label_lower or "private" in label_lower:
                assigned_boundary_label = 'Internal Network'
            else:
                # More specific detection for remaining cases
                if "dmz" in label_lower or "edge" in label_lower or "proxy" in label_lower:
                    assigned_boundary_label = 'DMZ / Edge Tier'
                elif any(kw in label_lower for kw in self.server_keywords):
                    assigned_boundary_label = 'Application Tier'
                else:
                    assigned_boundary_label = 'Internal Network'  # Default internal
                    
            log_info(f"Assigned element '{label}' to boundary: {assigned_boundary_label}")

            if assigned_boundary_label in defined_boundaries:
                pytm_code_lines.append(f"{var_name}.inBoundary = {defined_boundaries[assigned_boundary_label]}")
            else:
                log_info(f"Could not assign boundary for element {label}")
                # Create a default boundary if needed
                default_boundary = 'b_internal'
                if default_boundary in defined_boundaries.values():
                    pytm_code_lines.append(f"{var_name}.inBoundary = {default_boundary}")
                else:
                    pytm_code_lines.append("# Could not determine appropriate boundary")
                    
            pytm_code_lines.append("")  # Newline for readability

        # --- 3. Define Dataflows (Edges) ---
        pytm_code_lines.append("# Define Dataflows (from AD Edges)")
        dataflow_vars = {}
        flow_name_counts = {}
        for edge in edges:
            edge_id = edge.get("id")
            source_id = edge.get("source")
            target_id = edge.get("target")

            if not edge_id or not source_id or not target_id:
                 log_info(f"Skipping edge due to missing ID/source/target: {edge}")
                 continue

            # Check if source and target elements were defined and mapped
            if source_id not in element_vars or target_id not in element_vars:
                log_info(f"Skipping edge {edge_id}: Source '{source_id}' or target '{target_id}' node not mapped.")
                continue

            source_var = element_vars[source_id]
            target_var = element_vars[target_id]

            # Retrieve original node labels for flow description
            try:
                source_node_label = self._get_node_label(next(n for n in nodes if n['id'] == source_id))
                target_node_label = self._get_node_label(next(n for n in nodes if n['id'] == target_id))
            except StopIteration:
                 log_info(f"Could not find source/target node data for edge {edge_id}, using IDs.")
                 source_node_label = source_id
                 target_node_label = target_id

            # Infer label/description for dataflow
            flow_label = f"Data from {source_node_label} to {target_node_label}"
            base_flow_name = self._sanitize_for_var(f"flow_{source_node_label}_to_{target_node_label}")

            # Ensure unique flow variable name
            count = flow_name_counts.get(base_flow_name, 0) + 1
            flow_name_counts[base_flow_name] = count
            flow_var_name = f"{base_flow_name}_{count}" if count > 1 else base_flow_name
            while flow_var_name in dataflow_vars.values():
                 count += 1
                 flow_name_counts[base_flow_name] = count
                 flow_var_name = f"{base_flow_name}_{count}"

            dataflow_vars[edge_id] = flow_var_name

            pytm_code_lines.append(f"{flow_var_name} = Dataflow({source_var}, {target_var}, '{flow_label}')")

            # --- Infer Dataflow Properties (Refined Example) ---
            protocol = "TCP" # Generic default
            is_encrypted = False # Default to false unless known secure
            is_authenticated = False # Default assumption, especially internal
            dst_port = None

            # Get inferred types
            source_type = self._infer_element_type(source_node_label)
            target_type = self._infer_element_type(target_node_label)
            target_label_lower = target_node_label.lower()

            # Logic based on source/target types and labels
            if source_type == "Actor" and target_type == "Server":
                 protocol = "HTTPS"
                 is_encrypted = True
                 is_authenticated = True # Assume web login/session
                 dst_port = 443
            elif target_type == "Datastore":
                 is_authenticated = True # Assume DB creds
                 if any(sql_kw in target_label_lower for sql_kw in ['sql', 'postgres', 'mysql', 'aurora']):
                     protocol = "SQL"
                     dst_port = 5432 if 'postgres' in target_label_lower else 3306 if 'mysql' in target_label_lower else 1433 if 'sql server' in target_label_lower else None
                 else:
                     protocol = "DB_Proto" # e.g., Redis proto, Mongo proto
                     dst_port = 6379 if 'redis' in target_label_lower else 27017 if 'mongo' in target_label_lower else None
                 # Internal DB connections often aren't encrypted by default
                 is_encrypted = False
            elif target_type == "Server" and source_type == "Server":
                 protocol = "HTTP" # Assume internal HTTP
                 is_encrypted = False
                 is_authenticated = True # Assume internal APIs require auth (e.g., JWT, API key)
                 dst_port = 8080 if 'api' in target_label_lower else 80 # Default internal ports
            elif target_type == "Lambda" or source_type == "Lambda":
                 protocol = "AWS_SDK" # Or Azure SDK etc.
                 is_encrypted = True # Assume SDK calls use TLS
                 is_authenticated = True # Assume IAM roles/creds

            pytm_code_lines.append(f"{flow_var_name}.protocol = '{protocol}'")
            pytm_code_lines.append(f"{flow_var_name}.isEncrypted = {is_encrypted}")
            pytm_code_lines.append(f"{flow_var_name}.controls.authenticatesSource = {is_authenticated}")
            if dst_port:
                pytm_code_lines.append(f"{flow_var_name}.dstPort = {dst_port}")
            pytm_code_lines.append("") # Newline

        # --- 4. Process Threats ---
        pytm_code_lines.append("# Process the threat model")
        pytm_code_lines.append("tm.process()")
        pytm_code_lines.append("")

        return "\n".join(pytm_code_lines)