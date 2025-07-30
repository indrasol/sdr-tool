# Cloud Architecture Test Examples

This document contains example user requests for cloud-specific architecture visualizations. Use these examples to test the enhanced cloud architecture visualization capabilities.

## AWS Architecture Examples

### 1. Serverless Web Application

```
Create a serverless web application architecture on AWS with the following components:
- React frontend hosted on S3
- CloudFront distribution for content delivery
- API Gateway for backend APIs
- Lambda functions for business logic
- DynamoDB for data storage
- Cognito for user authentication
```

### 2. Microservices on ECS

```
Design a microservices architecture on AWS with:
- Multiple microservices running in ECS containers
- Application Load Balancer for traffic distribution
- API Gateway as the entry point
- RDS PostgreSQL for structured data
- ElastiCache Redis for caching
- Amazon MQ for service communication
- CloudWatch for monitoring
```

### 3. Data Processing Pipeline

```
Create an AWS data processing pipeline architecture with:
- S3 bucket for raw data storage
- Kinesis for data streaming
- Lambda for data transformation
- Glue for ETL jobs
- Redshift for data warehousing
- QuickSight for visualization
- CloudWatch for pipeline monitoring
```

## Azure Architecture Examples

### 1. Web Application with Azure PaaS

```
Design a web application on Azure using platform services:
- Azure App Service for web hosting
- Azure Functions for backend processing
- Azure SQL Database for data storage
- Azure Storage for file storage
- Azure CDN for content delivery
- Azure Active Directory for authentication
- Application Insights for monitoring
```

### 2. Microservices on AKS

```
Create a microservices architecture on Azure Kubernetes Service with:
- AKS cluster for container orchestration
- Azure Container Registry for container storage
- API Management for API gateway
- Cosmos DB for NoSQL data
- Azure Redis Cache for caching
- Event Grid for event handling
- Azure Monitor for observability
```

### 3. Big Data Solution

```
Design a big data solution on Azure with:
- Azure Data Lake Storage for raw data
- Azure Databricks for data processing
- Azure Synapse Analytics for data warehousing
- Event Hubs for real-time ingestion
- Azure Machine Learning for predictive analytics
- Power BI for visualization
- Azure Key Vault for secrets management
```

## Google Cloud Platform (GCP) Examples

### 1. Cloud-Native Web Application

```
Create a cloud-native web application on GCP with:
- Cloud Run for containerized services
- Cloud Load Balancing for traffic distribution
- Firebase for authentication and real-time database
- Cloud SQL for structured data
- Cloud Storage for static assets
- Cloud CDN for content delivery
- Cloud Monitoring for observability
```

### 2. Microservices on GKE

```
Design a microservices architecture on Google Kubernetes Engine with:
- GKE for container orchestration
- Cloud Build for CI/CD
- Cloud Endpoints for API management
- Cloud Spanner for database
- Memorystore for caching
- Pub/Sub for messaging
- Cloud Operations for monitoring and logging
```

### 3. ML-Powered Data Pipeline

```
Create a machine learning data pipeline on GCP with:
- Cloud Storage for data lake
- Dataflow for data processing
- BigQuery for data warehousing
- AI Platform for model training
- Cloud Functions for triggers
- Cloud Composer for orchestration
- Data Studio for visualization
```

## Multi-Cloud Architecture Examples

### 1. Hybrid AWS and Azure Solution

```
Design a hybrid cloud architecture spanning AWS and Azure:
- AWS S3 for primary storage
- Azure Blob Storage for backup
- AWS Lambda for processing
- Azure Logic Apps for workflow
- AWS Cognito for customer-facing authentication
- Azure Active Directory for employee authentication
- AWS CloudWatch and Azure Monitor for observability
```

### 2. GCP and AWS Data Pipeline

```
Create a multi-cloud data pipeline between GCP and AWS:
- GCP BigQuery for data warehousing
- AWS Glue for ETL processes
- GCP Pub/Sub for real-time streaming
- AWS Lambda for transformations
- GCP AI Platform for ML model training
- AWS SageMaker for model deployment
- Multi-cloud monitoring with Prometheus
```

### 3. Three-Cloud Resilient System

```
Design a highly resilient system spanning AWS, Azure, and GCP:
- Primary workloads on AWS EKS
- Disaster recovery on Azure AKS
- Data backup on GCP Cloud Storage
- Global load balancing across all three clouds
- Multi-cloud networking with Transit Gateway
- Consistent identity management across clouds
- Centralized monitoring and alerting
``` 