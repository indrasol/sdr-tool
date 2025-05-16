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
DIRECTORY_PATH = '/Users/rithingullapalli/Desktop/SDR/database-icons'  # Replace with the actual directory path containing Application SVG files
BUCKET_NAME = "database-icons"    # Replace with your Supabase storage bucket name

# Dictionary of detailed descriptions for Application services
descriptions = {
    "database_mysql": "MySQL is an open-source relational database management system (RDBMS) based on Structured Query Language (SQL). It is widely used for web applications and supports a variety of data types and storage engines.",
    "database_oracledb": "Oracle Database is a multi-model database management system produced and marketed by Oracle Corporation. It supports a wide range of data types and is known for its robustness and scalability in enterprise environments.",
    "database_postgresql": "PostgreSQL is a powerful, open-source object-relational database system that uses and extends the SQL language. It is highly extensible and standards-compliant, suitable for a variety of applications.",
    "database_redis_cache": "Redis is an open-source, in-memory data structure store used as a database, cache, and message broker. It supports various data structures such as strings, hashes, lists, and sets with high performance.",
    "database_sqlite": "SQLite is a lightweight, serverless, self-contained relational database management system. It is widely used in embedded systems and mobile applications due to its simplicity and small footprint.",
    "database_riak": "Riak is a distributed NoSQL database designed to deliver maximum data availability by distributing data across multiple servers. It is highly fault-tolerant and scalable.",
    "database_mongodb": "MongoDB is a cross-platform, document-oriented database that provides high performance, high availability, and easy scalability. It works on the concept of collections and documents.",
    "database_sql_server": "Microsoft SQL Server is a relational database management system developed by Microsoft. It provides a wide range of features including business intelligence, analytics, and integration services.",
    "database_cassandra": "Apache Cassandra is a free and open-source distributed wide column store NoSQL database designed to handle large amounts of data across many commodity servers, providing high availability with no single point of failure.",
    "database_couchdb": "Apache CouchDB is an open-source document-oriented NoSQL database that uses JSON to store data, JavaScript as its query language using MapReduce, and HTTP for an API.",
    "database_mariadb": "MariaDB is a community-developed, commercially supported fork of the MySQL relational database management system, intended to remain free and open-source software under the GNU GPL.",
    "database_firebase": "Firebase is a platform developed by Google for creating mobile and web applications. It includes a real-time NoSQL database that synchronizes data between clients and servers.",
    "database_ravendb": "RavenDB is an open-source document-oriented database written in C#, designed to handle high-performance, scalable data storage with a focus on ease of use and developer productivity.",
    "database_neo4j": "Neo4j is a highly scalable, robust native graph database that helps organizations build intelligent applications leveraging relationships and graph structures.",
    "database_arangodb": "ArangoDB is a native multi-model database system developed by ArangoDB Inc. It supports three data models with one database core and a unified query language AQL (ArangoDB Query Language).",
    "database_janusgraph": "JanusGraph is an open-source, distributed graph database optimized for storing and querying large graphs with billions of vertices and edges distributed across a multi-machine cluster.",
    "database_leveldb": "LevelDB is a fast key-value storage library written at Google that provides an ordered mapping from string keys to string values, designed for high performance and simplicity.",
    "database_influxdb": "InfluxDB is an open-source time series database designed to handle high write and query loads, optimized for metrics, events, and real-time analytics.",
    "database_objectdb": "ObjectDB is a powerful Object-Oriented Database (OODBMS) written in Java, designed to store and manage Java objects natively without the need for an ORM layer.",
    "database_db4o": "db4o (database for objects) is an open-source object database for Java and .NET developers, allowing the storage and retrieval of objects without a separate schema.",
    "database_timescaledb": "TimescaleDB is an open-source time-series database designed to scale smoothly for time-series data, built as an extension on PostgreSQL.",
    "database_hbase": "Apache HBase is an open-source, distributed, scalable, big data store that runs on top of Hadoop HDFS. It provides random, real-time read/write access to data in large tables.",
    "database_cockroachdb": "CockroachDB is a distributed SQL database designed for global, cloud-native applications, offering resilience against single-point-of-failure and horizontal scalability.",
    "database_elasticsearch": "Elasticsearch is a distributed, RESTful search and analytics engine capable of addressing a growing number of use cases, built on Apache Lucene.",
    "database_apache_solr": "Apache Solr is an open-source enterprise search platform built on Apache Lucene, providing full-text search, hit highlighting, faceted search, and dynamic clustering.",
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
        readable_name = node_type[4:].replace('_', ' ').title()
        return f"{readable_name} Database."

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
    output_data = {"database": node_types}

    # Save to a JSON file
    output_file = 'database_node_types_with_urls.json'
    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)
    print(f"database node types JSON file '{output_file}' generated successfully.")

# Run the main function
process_files_and_generate_json()