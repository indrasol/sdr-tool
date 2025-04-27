import os
import re
import json

# Configuration
DIRECTORY_PATH = '/Users/rithingullapalli/Desktop/SDR/aws-icons'  # Replace with the actual directory path

# Dictionary of detailed descriptions for AWS services with "aws_" prefix
descriptions = {
    "aws_athena": "A query service for analyzing data in Amazon S3 using SQL.",
    "aws_cloudsearch": "A managed service for adding search capabilities to applications.",
    "aws_data_firehose": "A service for delivering real-time streaming data to destinations.",
    "aws_datazone": "A data management service for organizing and governing data.",
    "aws_emr": "A big data processing service using frameworks like Hadoop and Spark.",
    "aws_finspace": "A service for managing and analyzing financial data.",
    "aws_kinesis": "A platform for processing real-time streaming data.",
    "aws_kinesis_video_streams": "A service for processing and analyzing video streams.",
    "aws_managed_service_for_prometheus": "A monitoring service compatible with Prometheus.",
    "aws_opensearch_service": "A managed search and analytics service.",
    "aws_quicksight": "A business intelligence service for creating interactive dashboards.",
    "aws_redshift": "A fully managed data warehouse service.",
    "aws_sagemaker": "A machine learning platform for building and deploying models.",
    "aws_clean_rooms": "A service for secure data collaboration across organizations.",
    "aws_data_exchange": "A marketplace for finding, subscribing to, and using third-party data.",
    "aws_appflow": "An integration service for transferring data between SaaS apps and AWS.",
    "aws_eventbridge": "A serverless event bus for connecting applications using events.",
    "aws_entity_resolution": "A service for matching and linking related records.",
    "aws_glue": "A data integration service for ETL processes.",
    "aws_lake_formation": "A service for building and managing data lakes.",
    "aws_mq": "A managed message broker service supporting multiple protocols.",
    "aws_simple_notification_service": "A messaging service for sending notifications.",
    "aws_simple_queue_service": "A managed message queue service.",
    "aws_appsync": "A managed GraphQL service for building APIs.",
    "aws_b2b_data_interchange": "A service for exchanging EDI data with trading partners.",
    "aws_step_functions": "A serverless orchestration service for coordinating workflows.",
    "aws_augmented_ai": "A service for integrating human review into AI workflows.",
    "aws_bedrock": "A service for building applications with foundation models.",
    "aws_codeguru": "A tool for automated code reviews and performance optimization.",
    "aws_codewhisperer": "An AI-powered coding assistant.",
    "aws_comprehend": "A natural language processing service for text analysis.",
    "aws_devops_guru": "A service for improving application performance and reliability.",
    "aws_elastic_inference": "A service for adding ML inference acceleration to applications.",
    "aws_forecast": "A time-series forecasting service.",
    "aws_fraud_detector": "A service for detecting fraudulent activities.",
    "aws_kendra": "An intelligent search service powered by machine learning.",
    "aws_lex": "A service for building conversational interfaces.",
    "aws_lookout_for_vision": "A service for detecting defects using computer vision.",
    "aws_monitron": "A service for monitoring equipment health.",
    "aws_personalize": "A service for creating personalized recommendations.",
    "aws_polly": "A text-to-speech service.",
    "aws_connect": "A cloud-based contact center service.",
    "aws_healthlake": "A service for storing and analyzing healthcare data.",
    "aws_iot_device_defender": "A security service for IoT devices.",
    "aws_iot_device_management": "A service for managing IoT devices at scale.",
    "aws_iot_events": "A service for detecting and responding to IoT events.",
    "aws_iot_sitewise": "A service for collecting and analyzing industrial IoT data.",
    "aws_iot_things_graph": "A service for building IoT applications with visual workflows.",
    "aws_lambda": "A serverless compute service for running code.",
    "aws_data_pipeline": "A service for orchestrating data workflows.",
    "aws_dynamodb": "A NoSQL database service.",
    "aws_s3": "A scalable object storage service.",
    "aws_cloudwatch": "A monitoring and observability service.",
    "aws_ec2": "A virtual server compute service.",
    "aws_elastic_beanstalk": "A platform for deploying and scaling applications.",
    "aws_ecs": "A container orchestration service.",
    "aws_eks": "A managed Kubernetes service.",
    "aws_fargate": "A serverless compute engine for containers.",
    "aws_rds": "A managed relational database service.",
    "aws_aurora": "A MySQL and PostgreSQL-compatible relational database.",
    "aws_elasticache": "An in-memory caching service.",
    "aws_memorydb": "A Redis-compatible in-memory database.",
    "aws_neptune": "A managed graph database service.",
    "aws_timestream": "A time-series database service."
}

# Function to extract and normalize node type from file name
def get_node_type(file_name):
    """
    Extracts and normalizes the node type from an SVG file name with "aws_" prefix.
    Example: 'Arch_Amazon-Athena_64.svg' -> 'aws_athena'
    """
    match = re.search(r'Arch_(.*?)_64\.svg', file_name)
    if match:
        service_name = match.group(1)
        # Normalize: replace hyphens with underscores, convert to lowercase
        node_type = service_name.replace('-', '_').lower()
        # Remove 'amazon_' or 'aws_' prefix for consistency
        node_type = re.sub(r'^amazon_', '', node_type)
        node_type = re.sub(r'^aws_', '', node_type)
        # Add "aws_" prefix
        node_type = f"aws_{node_type}"
        return node_type
    return None

# Function to generate a description for the node type
def generate_description(node_type):
    """
    Generates a description for the node type using a predefined dictionary.
    Falls back to a generic description if not found.
    """
    if node_type in descriptions:
        return descriptions[node_type]
    else:
        # Assign default description using the node_type name
        default_description = f"{node_type} service"
        return default_description

# Main function to process files and generate JSON
def process_files_and_generate_json():
    """
    Reads .svg files from a directory, processes them, and generates a JSON file with node types and descriptions.
    """
    # Check if directory exists
    if not os.path.isdir(DIRECTORY_PATH):
        print(f"Error: Directory '{DIRECTORY_PATH}' does not exist.")
        return

    # Get list of .svg files
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
            node_types.append({"name": node_type, "description": description})
        else:
            print(f"Could not parse node type from '{file_name}'.")

    # Create the JSON structure
    output_data = {"aws": node_types}

    # Save to a JSON file
    with open('aws_node_types.json', 'w') as f:
        json.dump(output_data, f, indent=2)
    print("AWS node types JSON file 'aws_node_types.json' generated successfully.")




process_files_and_generate_json()