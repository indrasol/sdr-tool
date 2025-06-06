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
DIRECTORY_PATH = '/Users/rithingullapalli/Desktop/SDR/databasetype-icons'  # Replace with the actual directory path containing Application SVG files
BUCKET_NAME = "databasetype-icons"    # Replace with your Supabase storage bucket name

# Dictionary of detailed descriptions for Application services
descriptions = {
    "databasetype_sql_database": "Manages structured data in tables using SQL, ensuring data integrity and supporting transactions. Examples: MySQL, PostgreSQL.",
    "databasetype_no_sql_database": "Stores data in flexible, schema-less documents like JSON. Suitable for hierarchical data. Examples: MongoDB, CouchDB.",
    "databasetype_columnar_store": "Stores data in wide columns for scalability and performance in big data applications. Examples: Cassandra, HBase.",
    "databasetype_graph_database": "Models data as graphs to efficiently query and analyze relationships. Examples: Neo4j, Amazon Neptune.",
    "databasetype_time_series_database": "Optimized for storing and querying time-stamped data like logs and metrics. Examples: InfluxDB, TimescaleDB.",
    "databasetype_newsql_database": "Provides distributed scalability with transactional consistency and SQL support. Examples: CockroachDB, Spanner.",
    "databasetype_in_memory_database": "Keeps data in memory for high-speed access and processing. Examples: SAP HANA, Redis.",
    "databasetype_object_database": "Manages data as objects, aligning with object-oriented programming. Examples: db4o, ObjectDB.",
    "databasetype_multi_model_database": "Handles multiple data models like document, graph, and key-value. Examples: ArangoDB, OrientDB."
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
    Extracts and normalizes the node type from an SVG file name with a "network_" prefix.
    Example: 'network_athena.svg' -> 'network_athena'
    
    Args:
        file_name (str): The name of the SVG file.
    Returns:
        str or None: The normalized node type with "network_" prefix, or None if the file doesn't match the expected pattern.
    """
    if file_name.endswith('.svg'):
        # Remove 'gcp_' prefix and '.svg' suffix
        service_name = file_name[:-4]
        # Normalize: replace hyphens with underscores, convert to lowercase
        node_type = service_name.replace('-', '_').lower()
        # Re-add 'application_' prefix
        return f"{node_type}"
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
        readable_name = node_type[4:].replace('-', '_').title()
        return f"{readable_name} Database Type."

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
            print(f"Could not parse node type from '{file_name}'. Expected format: 'network_[service_name].svg'")

    # Create the JSON structure
    output_data = {"network": node_types}

    # Save to a JSON file
    output_file = 'databasetype_node_types_with_urls.json'
    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)
    print(f"Database Type node types JSON file '{output_file}' generated successfully.")

# Run the main function
process_files_and_generate_json()