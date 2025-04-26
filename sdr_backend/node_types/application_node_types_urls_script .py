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
DIRECTORY_PATH = '/Users/rithingullapalli/Desktop/SDR/application-icons'  # Replace with the actual directory path containing Application SVG files
BUCKET_NAME = "application-icons"    # Replace with your Supabase storage bucket name

# Dictionary of detailed descriptions for Application services
descriptions = {
    "web_server": "Hosts web applications, serving HTTP requests (e.g., Nginx, Apache).",
    "database": "Stores and manages structured or unstructured data (e.g., SQL, NoSQL).",
    "api_gateway": "Centralizes and routes API requests, often with rate limiting and authentication.",
    "load_balancer": "Distributes incoming traffic across multiple servers for scalability and reliability.",
    "cache": "Stores frequently accessed data for low-latency retrieval (e.g., Redis, Memcached).",
    "message_queue": "Facilitates asynchronous communication between services (e.g., RabbitMQ, Kafka).",
    "authentication": "Handles user identity verification and access control (e.g., OAuth, LDAP).",
    "firewall": "Filters and monitors network traffic to enforce security policies.",
    "proxy": "Intercepts and forwards requests, often for caching or security (e.g., reverse proxy).",
    "container": "Runs isolated application instances with dependencies (e.g., Docker).",
    "microservice": "A small, independent service that performs a specific function within a larger application.",
    "faas": "A serverless computing service that executes code in response to events without managing servers.",
    "monitoring": "Collects and analyzes metrics and logs to monitor application performance and health.",
    "logging": "Centralizes and manages log data from various sources for analysis and troubleshooting."
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
    Extracts and normalizes the node type from an SVG file name with a "application_" prefix.
    Example: 'application_athena.svg' -> 'application_athena'
    
    Args:
        file_name (str): The name of the SVG file.
    Returns:
        str or None: The normalized node type with "application_" prefix, or None if the file doesn't match the expected pattern.
    """
    if file_name.endswith('.svg'):
        # Remove 'gcp_' prefix and '.svg' suffix
        service_name = file_name[:-4]
        # Normalize: replace hyphens with underscores, convert to lowercase
        node_type = service_name.replace('-', '_').lower()
        # Re-add 'application_' prefix
        return f"application_{node_type}"
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
        return f"Application {readable_name} service."

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
            print(f"Could not parse node type from '{file_name}'. Expected format: 'application_[service_name].svg'")

    # Create the JSON structure
    output_data = {"application": node_types}

    # Save to a JSON file
    output_file = 'application_node_types_with_urls.json'
    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)
    print(f"Application node types JSON file '{output_file}' generated successfully.")

# Run the main function
process_files_and_generate_json()