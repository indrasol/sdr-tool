# Frontend Cloud Icon Integration Testing

This document explains how to test the cloud icon integration in the frontend application.

## Overview

The frontend has been enhanced to support cloud provider-specific icons using the `custom:` prefix with Iconify. This document covers how to verify that this integration works correctly.

## Prerequisites

1. Ensure the backend is running with the updated cloud-aware components:
   - Cloud Resource Mapper
   - Enhanced Taxonomy Mapper
   - Cloud-Aware Prompt Builder

2. Ensure the frontend has the necessary components:
   - Enhanced SmartIcon component
   - API adapters for backend-to-frontend transformation
   - Custom icon collection loaded from Supabase

## Manual Testing Steps

### 1. Testing Custom Icon Loading

1. Open your browser's developer console
2. Navigate to the application
3. Look for messages related to custom icon collection:
   ```
   [iconify] custom collection loaded (X icons)
   ```
4. If you see an error message, check the Supabase URL in `custom.ts`

### 2. Testing Cloud Architecture Generation

1. Navigate to the model-with-ai page
2. Enter a cloud-specific query:
   ```
   Create an AWS serverless architecture with Lambda, API Gateway, DynamoDB, and S3
   ```
3. Wait for the diagram to render
4. Verify that:
   - AWS service nodes have appropriate icons
   - Nodes are placed in the correct layers
   - Node IDs follow the `aws-{service}` pattern

### 3. Testing Custom Icon Rendering

1. Inspect the React component tree using browser developer tools
2. Find a cloud service node (e.g., "aws-lambda")
3. Verify that:
   - The node's data contains `iconifyId: "custom:aws-lambda"`
   - The SmartIcon component receives and uses this ID
   - The icon is visible in the diagram

### 4. Testing Provider Auto-Detection

1. Create a new node with a provider but without the provider prefix:
   ```
   Add a Lambda function for user authentication
   ```
2. Verify that:
   - The system correctly identifies it as an AWS Lambda function
   - The node receives the correct `custom:aws-lambda` icon
   - The node is placed in the Compute layer

### 5. Testing Multi-Cloud Support

1. Create a diagram with multiple cloud providers:
   ```
   Create a hybrid cloud architecture with AWS Lambda, Azure Functions, and Google Cloud Storage
   ```
2. Verify that:
   - Each provider's services get the correct icon
   - Services are placed in appropriate layers
   - Icons follow the naming convention for each provider

## Automated Testing

### Jest Test Structure

We can add automated tests for the cloud icon integration:

```typescript
// frontend/src/components/AI/hooks/__tests__/useCloudIconRenderer.test.tsx

import { render, screen } from '@testing-library/react';
import React from 'react';
import { adaptBackendNodes } from '../../../../utils/apiAdapters';
import SmartIcon from '../../components/SmartIcon';

// Mock sample backend response
const mockBackendNodes = [
  {
    id: "aws-lambda",
    name: "AWS Lambda Function",
    kind: "COMPUTE",
    layer: "COMPUTE",
    metadata: {
      iconifyId: "custom:aws-lambda",
      layerIndex: 5,
      provider: "aws"
    }
  },
  // Add more sample nodes...
];

describe('Cloud Icon Renderer', () => {
  test('adapts backend cloud nodes correctly', () => {
    const adaptedNodes = adaptBackendNodes(mockBackendNodes);
    
    // Verify AWS Lambda node
    const lambdaNode = adaptedNodes.find(node => node.id === 'aws-lambda');
    expect(lambdaNode).toBeDefined();
    expect(lambdaNode?.data.iconifyId).toBe('custom:aws-lambda');
    expect(lambdaNode?.data.provider).toBe('aws');
  });
  
  // Add more tests...
});
```

### Running Tests

To run the tests:

```bash
cd frontend
npm test -- -t "Cloud Icon Renderer"
```

## Troubleshooting

### Icons Not Loading

If custom cloud icons aren't loading, check:

1. **Network Requests**: 
   - Look for requests to the Supabase URL in `custom.ts`
   - Check for 404 errors or CORS issues

2. **Console Errors**:
   - Look for errors related to Iconify
   - Check for warnings about missing icons

3. **SmartIcon Component**:
   - Add temporary logging to verify the `iconifyId` is received
   - Check if fallback icons are being used instead

### Wrong Layer Assignment

If cloud resources appear in the wrong layers:

1. Check the node data in React DevTools:
   - Verify `layerIndex` is set correctly
   - Check that `kind` matches the expected value

2. Look at backend response:
   - Check if `metadata.layerIndex` is properly set
   - Verify the node kind matches the expected category

3. Check the API adapter:
   - Ensure it correctly maps backend `metadata.layerIndex` to frontend `data.layerIndex`

## Expected Results

When working correctly, you should see:

1. AWS services with AWS-specific icons in their respective layers:
   - Lambda functions in the Compute layer
   - DynamoDB tables in the Data layer
   - API Gateway in the Edge Network layer

2. Azure services with Azure-specific icons:
   - Azure Functions in the Compute layer
   - Cosmos DB in the Data layer
   - App Service in the Service layer

3. GCP services with GCP-specific icons:
   - Cloud Functions in the Compute layer
   - BigQuery in the Data layer
   - Cloud Run in the Compute layer 