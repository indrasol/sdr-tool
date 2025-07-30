# Cloud Architecture Icons Integration Guide

This document outlines the implementation of the cloud architecture icons and classification system across the frontend and backend of our application.

## Overview

The system provides:

1. Cloud provider-specific icon rendering
2. Auto-classification of cloud services by provider and category
3. Proper layer assignment for cloud resources
4. LLM prompt enhancements for cloud-specific architecture generation

## Key Components

### 1. Backend: Cloud Resource Mapper

Located at `sdr_backend/core/ir/enrich/cloud_resource_mapper.py`, this component:

- Detects cloud resources with the `{provider}-{service}` naming convention
- Maps cloud services to appropriate metadata, including:
  - Provider (aws, azure, gcp)
  - Category (compute, storage, database)
  - Layer and layerIndex
  - Custom iconifyId format: `custom:{provider}-{service}`

### 2. Backend: Enhanced Taxonomy Mapper

Located at `sdr_backend/core/ir/enrich/taxonomy_mapper.py`, this component:

- Integrates with the Cloud Resource Mapper
- Identifies cloud resources during node classification
- Assigns appropriate kinds, layers, and iconify IDs based on cloud provider and service

### 3. Backend: Cloud-Aware Prompt Builder

Located at `sdr_backend/core/prompt_engineering/cloud_prompt_builder.py`, this component:

- Extends the base PromptBuilderV2
- Detects cloud-related queries
- Injects cloud-specific style guides and examples
- Promotes proper naming conventions for AWS, Azure, and GCP resources

### 4. Frontend: Smart Icon Component

Located at `frontend/src/components/AI/components/SmartIcon.tsx`, this component:

- Handles `custom:{provider}-{service}` icon references
- Falls back to standard icons when custom ones are not available
- Supports auto-generation of cloud provider icons based on provider and node name

### 5. Frontend: API Adapter

Located at `frontend/src/utils/apiAdapters.ts`, this component:

- Transforms backend data structures to frontend-compatible formats
- Preserves cloud-specific metadata
- Applies fallback values when needed

## Integration Flow

1. **LLM Generation:** 
   - User asks for a cloud architecture diagram
   - Cloud-aware prompt builder detects the request and enhances prompt with cloud-specific examples
   - LLM generates D2 diagram with proper cloud resource naming (e.g., `aws-lambda`, `azure-functions`)

2. **Backend Processing:**
   - Generated D2 is parsed into a DSL diagram
   - IR Builder converts to IR graph
   - During enrichment, Cloud Resource Mapper identifies cloud services
   - Taxonomy mapper assigns appropriate kinds, layers, and iconify IDs
   - Enhanced IR graph is sent to frontend

3. **Frontend Rendering:**
   - API adapter transforms backend data to ReactFlow format
   - SmartIcon component renders cloud icons with proper provider-specific styling
   - LayerVisualizer organizes nodes into appropriate layers based on backend-assigned layerIndex

## Configuration Options

### Cloud Provider Detection

In `cloud_resource_mapper.py`, the `KNOWN_PROVIDERS` set defines recognized cloud providers:

```python
KNOWN_PROVIDERS = {
    "aws", "azure", "gcp", "google", "ibm", "oracle", "alibaba"
}
```

### Cloud Service Categories

In `cloud_resource_mapper.py`, the `CLOUD_SERVICE_TYPES` dictionary maps providers and services to categories:

```python
CLOUD_SERVICE_TYPES = {
    "aws": {
        "compute": ["lambda", "ec2", "ecs", "fargate", "batch", "lightsail"],
        "storage": ["s3", "ebs", "efs", "glacier", "storage-gateway"],
        # ...
    },
    # ... other providers
}
```

### Layer Assignments

In `cloud_resource_mapper.py`, the `CATEGORY_TO_KIND` dictionary maps service categories to IR node kinds:

```python
CATEGORY_TO_KIND = {
    "compute": "COMPUTE",
    "storage": "DATA",
    "database": "DATA",
    # ...
}
```

## Usage Examples

### Creating an AWS Architecture

```
User: Create an AWS serverless architecture for an e-commerce application with Lambda, DynamoDB, and S3

LLM (enhanced with cloud-specific prompting):
direction: right

client: "Web Client" {
  shape: rectangle
}

aws-cloudfront: "CloudFront CDN" {
  shape: rectangle
}

aws-api-gateway: "API Gateway" {
  shape: rectangle
}

aws-lambda-catalog: "Product Catalog Service" {
  shape: rectangle
}

aws-lambda-orders: "Order Processing" {
  shape: rectangle
}

aws-dynamodb-products: "Products Table" {
  shape: cylinder
}

aws-dynamodb-orders: "Orders Table" {
  shape: cylinder
}

aws-s3-content: "Product Images" {
  shape: cylinder
}

client -> aws-cloudfront: "Request"
aws-cloudfront -> aws-api-gateway: "Route Request"
aws-api-gateway -> aws-lambda-catalog: "GET /products"
aws-api-gateway -> aws-lambda-orders: "POST /orders"
aws-lambda-catalog -> aws-dynamodb-products: "Query"
aws-lambda-catalog -> aws-s3-content: "Get Images"
aws-lambda-orders -> aws-dynamodb-orders: "Save Order"
```

### Frontend Transformation

This D2 will be transformed in the backend to add metadata:

```json
{
  "id": "aws-lambda-catalog",
  "name": "Product Catalog Service",
  "kind": "COMPUTE",
  "layer": "COMPUTE",
  "metadata": {
    "layerIndex": 5,
    "iconifyId": "custom:aws-lambda",
    "provider": "aws",
    "service": "lambda",
    "category": "compute",
    "cloud": true
  }
}
```

The frontend will then render it with:
- The proper layer (Compute = 5)
- The proper icon (`custom:aws-lambda`)
- Cloud provider styling and indicators

## Testing

You can run the integration test to validate the system:

```bash
cd /Users/rithingullapalli/Desktop/SDR/sdr-tool/sdr_backend
python -m tests.cloud_icons_test
```

The test will:
1. Validate cloud resource identification
2. Test taxonomy integration
3. Test the full enrichment pipeline
4. Output an enriched graph for inspection

## Troubleshooting

### Missing Icons

If cloud icons are not rendering:

1. Verify the iconify custom collection is loaded:
   - Check the console for messages from `frontend/src/iconify/custom.ts`
   - Ensure the Supabase URL is accessible

2. Verify the icon IDs are correct:
   - Icons should use the format `custom:{provider}-{service}`
   - Example: `custom:aws-lambda`, `custom:azure-functions`

3. Check the React component tree:
   - SmartIcon should receive `iconifyId` with the proper format
   - Console errors might indicate icon loading failures

### Incorrect Layer Assignment

If cloud resources appear in the wrong layers:

1. Check the `KIND_TO_LAYER_INDEX` mapping in `taxonomy_mapper.py`
2. Verify `CATEGORY_TO_KIND` mapping in `cloud_resource_mapper.py`
3. Inspect the enriched node metadata to confirm `layerIndex` is set correctly

### LLM Not Generating Cloud-Specific Syntax

If the LLM outputs don't use provider-service formatting:

1. Verify `CloudAwarePromptBuilder` is being used instead of base `PromptBuilderV2`
2. Check the cloud provider detection patterns in `cloud_prompt_builder.py`
3. Ensure the LLM model is receiving the enhanced prompt with cloud examples

## Further Enhancements

1. **Multi-Provider Integration**: Add support for hybrid cloud architectures
2. **Custom Icon Editor**: Add UI for uploading and managing custom cloud icons
3. **Provider-Specific Layout Rules**: Customize layout algorithms based on cloud provider patterns
4. **Cost Annotations**: Add cost information to cloud resource nodes
5. **Region Visualization**: Visual indicators for multi-region deployments 