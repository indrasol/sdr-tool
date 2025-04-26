import os
import json
from supabase import create_client, Client
from datetime import datetime, timedelta
import re

# Get Supabase credentials from environment variables or set them directly
# Replace these with your actual Supabase URL and key
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

# Configuration
DIRECTORY_PATH = '/Users/rithingullapalli/Desktop/SDR/azure-icons'  # Replace with the actual directory path containing azure SVG files
BUCKET_NAME = "azure-icons"    # Replace with your Supabase storage bucket name

# Dictionary of detailed descriptions for azure services
descriptions = {
    "azure_monitor": "A comprehensive solution for collecting, analyzing, and acting on telemetry from cloud and on-premises environments.",
    "azure_monitor_logs": "A service for analyzing and querying log data collected from various Azure resources.",
    "azure_application_insights": "A tool for monitoring and diagnosing application performance and usage.",
    "azure_monitor_network": "A service for monitoring and diagnosing network performance and connectivity issues.",
    "azure_monitor_alert": "A service for configuring real-time alerts based on monitoring data and conditions.",
    "azure_monitor_autoscale": "A service for automatically scaling resources based on performance metrics and demand.",
    "azure_monitor_metrics": "A service for collecting and visualizing performance metrics from Azure resources.",
    "azure_monitor_workbooks": "A tool for creating customizable dashboards and reports for monitoring data.",
    "azure_monitor_health": "A service for monitoring the health and availability of Azure resources.",
    "azure_monitor_activity_log": "A service for tracking and auditing activities and operations within Azure.",
    "azure_data_factory": "A service for creating, scheduling, and orchestrating data workflows.",
    "azure_data_lake": "A scalable data storage and analytics service for big data.",
    "azure_synapse_analytics": "An integrated analytics service for data warehousing and big data analytics.",
    "azure_databricks": "A collaborative platform for data engineering, data science, and analytics.",
    "azure_event_hubs": "A real-time data streaming and event ingestion service.",
    "azure_service_bus": "A messaging service for integrating applications and services.",
    "azure_logic_apps": "A service for automating workflows and integrating apps, data, and services.",
    "azure_functions": "A serverless compute service for running event-driven code.",
    "azure_container_instances": "A service for running containers without managing servers.",
    "azure_kubernetes_service": "A managed Kubernetes service for deploying and managing containerized applications.",
    "azure_devops": "A suite of tools for planning, developing, delivering, and operating software.",
    "azure_boards": "A tool for managing work items, sprints, and backlogs in Azure DevOps.",
    "azure_repos": "A version control system for managing code repositories.",
    "azure_pipelines": "A CI/CD service for building, testing, and deploying applications.",
    "azure_test_plans": "A tool for planning, tracking, and managing tests in Azure DevOps.",
    "azure_artifacts": "A package management service for sharing code across teams.",
    "azure_machine_learning": "A platform for building, training, and deploying machine learning models.",
    "azure_cognitive_services": "A set of AI services for building intelligent applications.",
    "azure_bot_service": "A service for creating and managing conversational AI bots.",
    "azure_quantum": "A platform for quantum computing and quantum-inspired optimization.",
    "azure_speech": "A service for speech recognition, synthesis, and translation.",
    "azure_translator": "A service for real-time language translation.",
    "azure_computer_vision": "A service for analyzing and understanding images and videos.",
    "azure_text_analytics": "A service for extracting insights from text data.",
    "azure_anomaly_detector": "A service for detecting anomalies in time-series data.",
    "azure_form_recognizer": "A service for extracting information from forms and documents.",
    "azure_content_moderator": "A service for moderating text, images, and videos.",
    "azure_personalizer": "A service for creating personalized user experiences.",
    "azure_metrics_advisor": "A service for monitoring and diagnosing metrics anomalies.",
    "azure_openai": "A service for integrating OpenAI models into applications.",
    "azure_power_bi": "A business intelligence service for data visualization and insights.",
    "azure_security_center": "A unified security management and threat protection service.",
    "azure_defender": "A cloud-native security service for protecting Azure resources.",
    "azure_sentinel": "A cloud-native SIEM and SOAR solution for security operations.",
    "azure_identity": "A service for managing user identities and access control.",
    "azure_active_directory": "A directory service for managing identities and access.",
    "azure_api_management": "A service for publishing, securing, and analyzing APIs.",
    "azure_app_service": "A platform for hosting web apps, mobile apps, and APIs.",
    "azure_storage": "A scalable cloud storage service for data and applications.",
    "azure_backup": "A service for backing up and recovering data in the cloud.",
    "azure_site_recovery": "A disaster recovery service for business continuity.",
    "azure_virtual_machines": "A service for creating and managing virtual machines.",
    "azure_virtual_network": "A service for creating isolated network environments.",
    "azure_vpn_gateway": "A service for secure VPN connectivity to Azure networks.",
    "azure_expressroute": "A dedicated private network connection to Azure.",
    "azure_load_balancer": "A service for distributing traffic across resources.",
    "azure_application_gateway": "A web traffic load balancer with advanced features.",
    "azure_firewall": "A managed firewall service for protecting Azure networks.",
    "azure_ddos_protection": "A service for protecting against DDoS attacks.",
    "azure_network_watcher": "A tool for monitoring and diagnosing network performance.",
    "azure_cost_management": "A service for managing and optimizing Azure spending.",
    "azure_billing": "A service for managing billing and usage data.",
    "azure_policy": "A service for enforcing governance and compliance policies.",
    "azure_blueprints": "A service for defining and deploying Azure environments.",
    "azure_resource_graph": "A service for querying and exploring Azure resources.",
    "azure_monitor_action_groups": "A service for managing alert notifications and actions.",
    "azure_autoscale": "A service for automatically scaling resources based on demand.",
    "azure_advisor": "A personalized cloud consultant for optimization recommendations.",
    "azure_resource_health": "A service for monitoring the health of Azure resources.",
    "azure_service_health": "A service for tracking the status of Azure services.",
    "azure_log_analytics": "A service for collecting and analyzing log data.",
    "azure_network_performance_monitor": "A tool for monitoring network performance.",
    "azure_avs_vm": "A service for running VMware virtual machines natively on Azure.",
    "azure_arc_postgresql": "A service for managing PostgreSQL databases with Azure Arc.",
    "azure_arc_sql_managed_instance": "A service for managing SQL Managed Instances with Azure Arc.",
    "azure_system_topic": "A feature within Azure Event Grid for system-level event management.",
    "azure_automanaged_vm": "A service for managing virtual machines with automated configurations.",
    "azure_microsoft_defender_for_iot": "A security service for protecting IoT devices in Azure.",
    "azure_extra_privileged_identity_management": "An advanced service for managing privileged identities.",
    "azure_industrial_iot": "A service for industrial IoT solutions and data integration.",
    "azure_backup_center": "A centralized service for managing backups across Azure.",
    "azure_backup_vault": "A storage vault for securing backup data in Azure.",
    "azure_managed_service_fabric": "A managed service for building microservices and applications.",
    "azure_api_proxy": "A service for managing and routing API traffic.",
    "azure_virtual_router": "A service for virtual routing within Azure networks.",
    "azure_scvmm_management_servers": "A service for managing SCVMM servers in Azure."
}

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Function to upload file to Supabase storage and get signed URL
def upload_and_get_signed_url(file_path, bucket_name):
    """
    Uploads a file to Supabase storage and generates a signed URL with a one-year expiry.
    
    Args:
        file_path (str): The local path to the file to upload.
        bucket_name (str): The name of the Supabase storage bucket.
    Returns:
        str: The signed URL for the uploaded file.
    """
    # Extract file name
    file_name = os.path.basename(file_path)
    
    try:
        # Upload file to Supabase storage
        with open(file_path, 'rb') as f:
            # The upload method no longer returns a response with status_code
            # It returns the data directly or raises an exception on error
            supabase.storage.from_(bucket_name).upload(file_name, f.read())
        
        # Generate signed URL with one-year expiry
        expiry = int((datetime.now() + timedelta(days=365)).timestamp())
        signed_url_response = supabase.storage.from_(bucket_name).create_signed_url(file_name, expiry)
        
        if 'signedURL' not in signed_url_response:
            raise Exception(f"Failed to generate signed URL for {file_name}: {signed_url_response}")
        
        return signed_url_response['signedURL']
    except Exception as e:
        raise Exception(f"Failed to process {file_name}: {str(e)}")

# Function to extract and normalize node type from file name
def get_node_type(file_name):
    """
    Extracts and normalizes the node type from an SVG file name with a "azure_" prefix.
    Example: 'azure_athena.svg' -> 'azure_athena'
    
    Args:
        file_name (str): The name of the SVG file.
    Returns:
        str or None: The normalized node type with "azure_" prefix, or None if the file doesn't match the expected pattern.
    """
    match = re.match(r'\d{5}-icon-service-(.+?)\.svg', file_name)
    if match:
        service_name = match.group(1)
        # Normalize: replace hyphens with underscores, convert to lowercase
        node_type = service_name.replace('-', '_').lower()
        return f"azure_{node_type}"
    return None

# Function to generate a description for the node type
def generate_description(node_type):
    """
    Generates a description for the node type using a predefined dictionary.
    Falls back to a generic description if the node type is not found in the dictionary.
    
    Args:
        node_type (str): The normalized node type.
    Returns:
        str: The description of the service, or a generic description if not found.
    """
    if node_type in descriptions:
        return descriptions[node_type]
    else:
        # Generate a generic description
        readable_name = node_type[4:].replace('_', ' ').title()
        return f"azure {readable_name} service."

# Main function to process files, upload to Supabase, and generate JSON
def process_files_and_generate_json():
    """
    Reads .svg files from a directory, uploads them to Supabase storage, generates signed URLs,
    and creates a JSON file with node types, descriptions, and signed URLs.
    """
    # Check if the directory exists
    if not os.path.isdir(DIRECTORY_PATH):
        print(f"Error: Directory '{DIRECTORY_PATH}' does not exist.")
        return

    # Get list of .svg files in the directory
    svg_files = [f for f in os.listdir(DIRECTORY_PATH) if f.endswith('.svg')]
    if not svg_files:
        print(f"No .svg files found in '{DIRECTORY_PATH}'.")
        return

    # Process each file and build the node types list
    node_types = []
    for file_name in svg_files:
        node_type = get_node_type(file_name)
        if node_type:
            description = generate_description(node_type)
            file_path = os.path.join(DIRECTORY_PATH, file_name)
            try:
                signed_url = upload_and_get_signed_url(file_path, BUCKET_NAME)
                node_types.append({
                    "name": node_type,
                    "description": description,
                    "icon_url": signed_url
                })
                print(f"Uploaded and generated signed URL for {file_name}")
            except Exception as e:
                print(f"Error processing {file_name}: {e}")
        else:
            print(f"Could not parse node type from '{file_name}'. Expected format: 'azure_[service_name].svg'")

    # Create the JSON structure
    output_data = {"azure": node_types}

    # Save to a JSON file
    output_file = 'azure_node_types_with_urls.json'
    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)
    print(f"azure node types JSON file '{output_file}' generated successfully.")

# Run the main function
process_files_and_generate_json()