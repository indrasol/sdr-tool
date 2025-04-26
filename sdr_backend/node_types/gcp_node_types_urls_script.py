import os
import json
from supabase import create_client, Client
from datetime import datetime, timedelta

# Get Supabase credentials from environment variables or set them directly
# Replace these with your actual Supabase URL and key
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

# Configuration
DIRECTORY_PATH = '/Users/rithingullapalli/Desktop/SDR/gcp-icons'  # Replace with the actual directory path containing GCP SVG files
BUCKET_NAME = "gcp-icons"    # Replace with your Supabase storage bucket name

# Dictionary of detailed descriptions for GCP services
descriptions = {
    "gcp_bigquery": "A fully managed, serverless data warehouse for large-scale data analytics.",
    "gcp_cloud_storage": "A scalable, durable object storage service for unstructured data.",
    "gcp_compute_engine": "A virtual machine service for running scalable compute workloads.",
    "gcp_cloud_functions": "A serverless compute service for running event-driven code.",
    "gcp_app_engine": "A platform for building scalable web applications and APIs.",
    "gcp_cloud_run": "A managed service for running containerized applications.",
    "gcp_kubernetes_engine": "A managed Kubernetes service for orchestrating containerized applications.",
    "gcp_cloud_sql": "A fully managed relational database service for MySQL, PostgreSQL, and SQL Server.",
    "gcp_spanner": "A globally distributed, horizontally scalable relational database service.",
    "gcp_firestore": "A NoSQL document database for mobile, web, and server applications.",
    "gcp_pubsub": "A messaging service for real-time event streaming and data integration.",
    "gcp_dataflow": "A fully managed service for stream and batch data processing.",
    "gcp_dataproc": "A managed service for running Apache Spark and Hadoop workloads.",
    "gcp_ai_platform": "A suite of tools for building, deploying, and scaling machine learning models.",
    "gcp_vertex_ai": "A unified platform for machine learning development and deployment.",
    "gcp_cloud_armor": "A DDoS protection and web application firewall service.",
    "gcp_cloud_cdn": "A content delivery network for fast, reliable delivery of web content.",
    "gcp_cloud_load_balancing": "A managed load balancing service for distributing traffic across instances.",
    "gcp_cloud_build": "A continuous integration and delivery platform for building and deploying applications.",
    "gcp_cloud_scheduler": "A managed cron job service for automating tasks.",
    "gcp_cloud_tasks": "A task queue service for managing asynchronous task execution.",
    "gcp_cloud_monitoring": "A service for monitoring, logging, and diagnosing application performance.",
    "gcp_cloud_logging": "A centralized logging service for collecting and analyzing log data.",
    "gcp_cloud_trace": "A distributed tracing service for understanding application latency.",
    "gcp_cloud_profiler": "A service for profiling CPU and memory usage in applications.",
    "gcp_cloud_identity": "A service for managing user identities and access control.",
    "gcp_cloud_iam": "A service for fine-grained access control and permissions management.",
    "gcp_cloud_kms": "A key management service for creating and managing encryption keys.",
    "gcp_secret_manager": "A service for securely storing and managing sensitive information like API keys and passwords."
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
    Extracts and normalizes the node type from an SVG file name with a "gcp_" prefix.
    Example: 'gcp_bigquery.svg' -> 'gcp_bigquery'
    
    Args:
        file_name (str): The name of the SVG file.
    Returns:
        str or None: The normalized node type with "gcp_" prefix, or None if the file doesn't match the expected pattern.
    """
    if file_name.endswith('.svg'):
        # Remove 'gcp_' prefix and '.svg' suffix
        service_name = file_name[:-4]
        # Normalize: replace hyphens with underscores, convert to lowercase
        node_type = service_name.replace('-', '_').lower()
        # Re-add 'gcp_' prefix
        return f"gcp_{node_type}"
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
        return f"GCP {readable_name} service."

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
            print(f"Could not parse node type from '{file_name}'. Expected format: 'gcp_[service_name].svg'")

    # Create the JSON structure
    output_data = {"gcp": node_types}

    # Save to a JSON file
    output_file = 'gcp_node_types_with_urls.json'
    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)
    print(f"GCP node types JSON file '{output_file}' generated successfully.")

# Run the main function
process_files_and_generate_json()