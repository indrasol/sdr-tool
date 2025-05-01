node_types = {
    "application": [
      {"name": "application_web_server", "description": "Hosts web applications, serving HTTP requests (e.g., Nginx, Apache)."},
      {"name": "application_database", "description": "Stores and manages structured or unstructured data (e.g., SQL, NoSQL)."},
      {"name": "application_api_gateway", "description": "Centralizes and routes API requests, often with rate limiting and authentication."},
      {"name": "application_load_balancer", "description": "Distributes incoming traffic across multiple servers for scalability and reliability."},
      {"name": "application_cache", "description": "Stores frequently accessed data for low-latency retrieval (e.g., Redis, Memcached)."},
      {"name": "application_message_queue", "description": "Facilitates asynchronous communication between services (e.g., RabbitMQ, Kafka)."},
      {"name": "application_authentication", "description": "Handles user identity verification and access control (e.g., OAuth, LDAP)."},
      {"name": "application_proxy", "description": "Intercepts and forwards requests, often for caching or security (e.g., reverse proxy)."},
      {"name": "application_container", "description": "Runs isolated application instances with dependencies (e.g., Docker)."},
      {"name": "application_microservice", "description": "A small, independent service that performs a specific function within a larger application."},
      {"name": "application_faas", "description": "A serverless computing service that executes code in response to events without managing servers."},
      {"name": "application_monitoring", "description": "Collects and analyzes metrics and logs to monitor application performance and health."},
      {"name": "application_logging", "description": "Centralizes and manages log data from various sources for analysis and troubleshooting."}
    ],
    "client": [
    {
      "name": "client_mobile_app",
      "description": "Mobile application client that runs on smartphones and tablets, providing user interface for interacting with backend services."
    },
    {
      "name": "client_web_browser",
      "description": "Web browser client that runs in standard browsers, providing web-based interface for accessing application services."
    },
    {
      "name": "client_desktop_app",
      "description": "Desktop application client that runs natively on user computers, offering rich functionality with direct system access."
      
    },
    {
      "name": "client_iot_device",
      "description": "Internet of Things device client that connects physical devices to the network, enabling monitoring and control of hardware."
      
    },
    {
      "name": "client_kiosk",
      "description": "Kiosk client application designed for public-facing self-service terminals with restricted functionality."
    },
    {
      "name": "client_external_clients",
      "description": "External clients are clients that are not part of the main application, but are used to access the application."
      
    }
  ],
    "aws": [
    {
      "name": "aws_pinpoint_apis",
      "description": "aws_pinpoint_apis service"
    },
    {
      "name": "aws_iot_events",
      "description": "A service for detecting and responding to IoT events."
    },
    {
      "name": "aws_elemental_mediastore",
      "description": "aws_elemental_mediastore service"
    },
    {
      "name": "aws_parallel_computing_service",
      "description": "aws_parallel_computing_service service"
    },
    {
      "name": "aws_iot_device_defender",
      "description": "A security service for IoT devices."
    },
    {
      "name": "aws_elastic_beanstalk",
      "description": "A platform for deploying and scaling applications."
    },
    {
      "name": "aws_signer",
      "description": "aws_signer service"
    },
    {
      "name": "aws_fsx_for_wfs",
      "description": "aws_fsx_for_wfs service"
    },
    {
      "name": "aws_backint_agent",
      "description": "aws_backint_agent service"
    },
    {
      "name": "aws_entity_resolution",
      "description": "A service for matching and linking related records."
    },
    {
      "name": "aws_deeplens",
      "description": "aws_deeplens service"
    },
    {
      "name": "aws_bedrock",
      "description": "A service for building applications with foundation models."
    },
    {
      "name": "aws_red_hat_openshift_service_on_aws",
      "description": "aws_red_hat_openshift_service_on_aws service"
    },
    {
      "name": "aws_file_cache",
      "description": "aws_file_cache service"
    },
    {
      "name": "aws_elastic_container_registry",
      "description": "aws_elastic_container_registry service"
    },
    {
      "name": "aws_managed_service_for_apache_flink",
      "description": "aws_managed_service_for_apache_flink service"
    },
    {
      "name": "aws_privatelink",
      "description": "aws_privatelink service"
    },
    {
      "name": "aws_neptune",
      "description": "A managed graph database service."
    },
    {
      "name": "aws_managed_services",
      "description": "aws_managed_services service"
    },
    {
      "name": "aws_snowball_edge",
      "description": "aws_snowball_edge service"
    },
    {
      "name": "aws_distro_for_opentelemetry",
      "description": "aws_distro_for_opentelemetry service"
    },
    {
      "name": "aws_iq",
      "description": "aws_iq service"
    },
    {
      "name": "aws_resilience_hub",
      "description": "aws_resilience_hub service"
    },
    {
      "name": "aws_corretto",
      "description": "aws_corretto service"
    },
    {
      "name": "aws_deepracer",
      "description": "aws_deepracer service"
    },
    {
      "name": "aws_finspace",
      "description": "A service for managing and analyzing financial data."
    },
    {
      "name": "aws_iot_twinmaker",
      "description": "aws_iot_twinmaker service"
    },
    {
      "name": "aws_serverless_application_repository",
      "description": "aws_serverless_application_repository service"
    },
    {
      "name": "aws_wickr",
      "description": "aws_wickr service"
    },
    {
      "name": "aws_elastic_kubernetes_service",
      "description": "aws_elastic_kubernetes_service service"
    },
    {
      "name": "aws_waf",
      "description": "aws_waf service"
    },
    {
      "name": "aws_guardduty",
      "description": "aws_guardduty service"
    },
    {
      "name": "aws_apache_mxnet_on_aws",
      "description": "aws_apache_mxnet_on_aws service"
    },
    {
      "name": "aws_professional_services",
      "description": "aws_professional_services service"
    },
    {
      "name": "aws_elemental_server",
      "description": "aws_elemental_server service"
    },
    {
      "name": "aws_elastic_fabric_adapter",
      "description": "aws_elastic_fabric_adapter service"
    },
    {
      "name": "aws_polly",
      "description": "A text-to-speech service."
    },
    {
      "name": "aws_fsx_for_openzfs",
      "description": "aws_fsx_for_openzfs service"
    },
    {
      "name": "aws_timestream",
      "description": "A time-series database service."
    },
    {
      "name": "aws_gamelift",
      "description": "aws_gamelift service"
    },
    {
      "name": "aws_wavelength",
      "description": "aws_wavelength service"
    },
    {
      "name": "aws_fargate",
      "description": "A serverless compute engine for containers."
    },
    {
      "name": "aws_iot_button",
      "description": "aws_iot_button service"
    },
    {
      "name": "aws_snowball",
      "description": "aws_snowball service"
    },
    {
      "name": "aws_marketplace_dark",
      "description": "aws_marketplace_dark service"
    },
    {
      "name": "aws_cloudhsm",
      "description": "aws_cloudhsm service"
    },
    {
      "name": "aws_appfabric",
      "description": "aws_appfabric service"
    },
    {
      "name": "aws_pinpoint",
      "description": "aws_pinpoint service"
    },
    {
      "name": "aws_chatbot",
      "description": "aws_chatbot service"
    },
    {
      "name": "aws_amplify",
      "description": "aws_amplify service"
    },
    {
      "name": "aws_vpc_lattice",
      "description": "aws_vpc_lattice service"
    },
    {
      "name": "aws_elemental_medialive",
      "description": "aws_elemental_medialive service"
    },
    {
      "name": "aws_x_ray",
      "description": "aws_x_ray service"
    },
    {
      "name": "aws_elastic_vmware_service",
      "description": "aws_elastic_vmware_service service"
    },
    {
      "name": "aws_outposts_servers",
      "description": "aws_outposts_servers service"
    },
    {
      "name": "aws_oracle_database_at_aws",
      "description": "aws_oracle_database_at_aws service"
    },
    {
      "name": "aws_codecatalyst",
      "description": "aws_codecatalyst service"
    },
    {
      "name": "aws_workdocs",
      "description": "aws_workdocs service"
    },
    {
      "name": "aws_eventbridge",
      "description": "A serverless event bus for connecting applications using events."
    },
    {
      "name": "aws_glue_databrew",
      "description": "aws_glue_databrew service"
    },
    {
      "name": "aws_elemental_appliances_&_software",
      "description": "aws_elemental_appliances_&_software service"
    },
    {
      "name": "aws_nice_enginframe",
      "description": "aws_nice_enginframe service"
    },
    {
      "name": "aws_healthlake",
      "description": "A service for storing and analyzing healthcare data."
    },
    {
      "name": "aws_audit_manager",
      "description": "aws_audit_manager service"
    },
    {
      "name": "aws_cloud_development_kit",
      "description": "aws_cloud_development_kit service"
    },
    {
      "name": "aws_chime_sdk",
      "description": "aws_chime_sdk service"
    },
    {
      "name": "aws_healthscribe",
      "description": "aws_healthscribe service"
    },
    {
      "name": "aws_detective",
      "description": "aws_detective service"
    },
    {
      "name": "aws_healthomics",
      "description": "aws_healthomics service"
    },
    {
      "name": "aws_thinkbox_deadline",
      "description": "aws_thinkbox_deadline service"
    },
    {
      "name": "aws_shield",
      "description": "aws_shield service"
    },
    {
      "name": "aws_cloud_wan",
      "description": "aws_cloud_wan service"
    },
    {
      "name": "aws_supply_chain",
      "description": "aws_supply_chain service"
    },
    {
      "name": "aws_codeartifact",
      "description": "aws_codeartifact service"
    },
    {
      "name": "aws_macie",
      "description": "aws_macie service"
    },
    {
      "name": "aws_firewall_manager",
      "description": "aws_firewall_manager service"
    },
    {
      "name": "aws_connect",
      "description": "A cloud-based contact center service."
    },
    {
      "name": "aws_freertos",
      "description": "aws_freertos service"
    },
    {
      "name": "aws_network_firewall",
      "description": "aws_network_firewall service"
    },
    {
      "name": "aws_user_notifications",
      "description": "aws_user_notifications service"
    },
    {
      "name": "aws_api_gateway",
      "description": "aws_api_gateway service"
    },
    {
      "name": "aws_cloudsearch",
      "description": "A managed service for adding search capabilities to applications."
    },
    {
      "name": "aws_inspector",
      "description": "aws_inspector service"
    },
    {
      "name": "aws_eks_distro",
      "description": "aws_eks_distro service"
    },
    {
      "name": "aws_rekognition",
      "description": "aws_rekognition service"
    },
    {
      "name": "aws_managed_workflows_for_apache_airflow",
      "description": "aws_managed_workflows_for_apache_airflow service"
    },
    {
      "name": "aws_elemental_link",
      "description": "aws_elemental_link service"
    },
    {
      "name": "aws_codepipeline",
      "description": "aws_codepipeline service"
    },
    {
      "name": "aws_workspaces_family",
      "description": "aws_workspaces_family service"
    },
    {
      "name": "aws_repost_private",
      "description": "aws_repost_private service"
    },
    {
      "name": "aws_artifact",
      "description": "aws_artifact service"
    },
    {
      "name": "aws_forecast",
      "description": "A time-series forecasting service."
    },
    {
      "name": "aws_simspace_weaver",
      "description": "aws_simspace_weaver service"
    },
    {
      "name": "aws_thinkbox_stoke",
      "description": "aws_thinkbox_stoke service"
    },
    {
      "name": "aws_control_tower",
      "description": "aws_control_tower service"
    },
    {
      "name": "aws_health_dashboard",
      "description": "aws_health_dashboard service"
    },
    {
      "name": "aws_storage_gateway",
      "description": "aws_storage_gateway service"
    },
    {
      "name": "aws_identity_and_access_management",
      "description": "aws_identity_and_access_management service"
    },
    {
      "name": "aws_command_line_interface",
      "description": "aws_command_line_interface service"
    },
    {
      "name": "aws_augmented_ai_a2i",
      "description": "aws_augmented_ai_a2i service"
    },
    {
      "name": "aws_reserved_instance_reporting",
      "description": "aws_reserved_instance_reporting service"
    },
    {
      "name": "aws_opensearch_service",
      "description": "A managed search and analytics service."
    },
    {
      "name": "aws_nova",
      "description": "aws_nova service"
    },
    {
      "name": "aws_nitro_enclaves",
      "description": "aws_nitro_enclaves service"
    },
    {
      "name": "aws_site_to_site_vpn",
      "description": "aws_site_to_site_vpn service"
    },
    {
      "name": "aws_cost_explorer",
      "description": "aws_cost_explorer service"
    },
    {
      "name": "aws_lookout_for_equipment",
      "description": "aws_lookout_for_equipment service"
    },
    {
      "name": "aws_ground_station",
      "description": "aws_ground_station service"
    },
    {
      "name": "aws_savings_plans",
      "description": "aws_savings_plans service"
    },
    {
      "name": "aws_application_auto_scaling",
      "description": "aws_application_auto_scaling service"
    },
    {
      "name": "aws_elemental_mediaconnect",
      "description": "aws_elemental_mediaconnect service"
    },
    {
      "name": "aws_iot_sitewise",
      "description": "A service for collecting and analyzing industrial IoT data."
    },
    {
      "name": "aws_auto_scaling",
      "description": "aws_auto_scaling service"
    },
    {
      "name": "aws_infrastructure_composer",
      "description": "aws_infrastructure_composer service"
    },
    {
      "name": "aws_rds",
      "description": "A managed relational database service."
    },
    {
      "name": "aws_parallel_cluster",
      "description": "aws_parallel_cluster service"
    },
    {
      "name": "aws_resource_explorer",
      "description": "aws_resource_explorer service"
    },
    {
      "name": "aws_ecs_anywhere",
      "description": "aws_ecs_anywhere service"
    },
    {
      "name": "aws_well_architected_tool",
      "description": "aws_well_architected_tool service"
    },
    {
      "name": "aws_memorydb",
      "description": "A Redis-compatible in-memory database."
    },
    {
      "name": "aws_redshift",
      "description": "A fully managed data warehouse service."
    },
    {
      "name": "aws_elasticache",
      "description": "An in-memory caching service."
    },
    {
      "name": "aws_quicksight",
      "description": "A business intelligence service for creating interactive dashboards."
    },
    {
      "name": "aws_private_5g",
      "description": "aws_private_5g service"
    },
    {
      "name": "aws_simple_storage_service_glacier",
      "description": "aws_simple_storage_service_glacier service"
    },
    {
      "name": "aws_cloudtrail",
      "description": "aws_cloudtrail service"
    },
    {
      "name": "aws_cloud_directory",
      "description": "aws_cloud_directory service"
    },
    {
      "name": "aws_backup",
      "description": "aws_backup service"
    },
    {
      "name": "aws_app_studio",
      "description": "aws_app_studio service"
    },
    {
      "name": "aws_appsync",
      "description": "A managed GraphQL service for building APIs."
    },
    {
      "name": "aws_cognito",
      "description": "aws_cognito service"
    },
    {
      "name": "aws_elastic_container_service",
      "description": "aws_elastic_container_service service"
    },
    {
      "name": "aws_sagemaker_studio_lab",
      "description": "aws_sagemaker_studio_lab service"
    },
    {
      "name": "aws_open_3d_engine",
      "description": "aws_open_3d_engine service"
    },
    {
      "name": "aws_emr",
      "description": "A big data processing service using frameworks like Hadoop and Spark."
    },
    {
      "name": "aws_personalize",
      "description": "A service for creating personalized recommendations."
    },
    {
      "name": "aws_quantum_ledger_database",
      "description": "aws_quantum_ledger_database service"
    },
    {
      "name": "aws_glue",
      "description": "A data integration service for ETL processes."
    },
    {
      "name": "aws_compute_optimizer",
      "description": "aws_compute_optimizer service"
    },
    {
      "name": "aws_pytorch_on_aws",
      "description": "aws_pytorch_on_aws service"
    },
    {
      "name": "aws_resource_access_manager",
      "description": "aws_resource_access_manager service"
    },
    {
      "name": "aws_proton",
      "description": "aws_proton service"
    },
    {
      "name": "aws_textract",
      "description": "aws_textract service"
    },
    {
      "name": "aws_bottlerocket",
      "description": "aws_bottlerocket service"
    },
    {
      "name": "aws_security_hub",
      "description": "aws_security_hub service"
    },
    {
      "name": "aws_data_transfer_terminal",
      "description": "aws_data_transfer_terminal service"
    },
    {
      "name": "aws_elastic_inference",
      "description": "A service for adding ML inference acceleration to applications."
    },
    {
      "name": "aws_application_migration_service",
      "description": "aws_application_migration_service service"
    },
    {
      "name": "aws_elastic_load_balancing",
      "description": "aws_elastic_load_balancing service"
    },
    {
      "name": "aws_application_discovery_service",
      "description": "aws_application_discovery_service service"
    },
    {
      "name": "aws_lookout_for_metrics",
      "description": "aws_lookout_for_metrics service"
    },
    {
      "name": "aws_simple_notification_service",
      "description": "A messaging service for sending notifications."
    },
    {
      "name": "aws_security_lake",
      "description": "aws_security_lake service"
    },
    {
      "name": "aws_repost",
      "description": "aws_repost service"
    },
    {
      "name": "aws_cloudformation",
      "description": "aws_cloudformation service"
    },
    {
      "name": "aws_s3_on_outposts",
      "description": "aws_s3_on_outposts service"
    },
    {
      "name": "aws_comprehend_medical",
      "description": "aws_comprehend_medical service"
    },
    {
      "name": "aws_thinkbox_sequoia",
      "description": "aws_thinkbox_sequoia service"
    },
    {
      "name": "aws_managed_grafana",
      "description": "aws_managed_grafana service"
    },
    {
      "name": "aws_launch_wizard",
      "description": "aws_launch_wizard service"
    },
    {
      "name": "aws_interactive_video_service",
      "description": "aws_interactive_video_service service"
    },
    {
      "name": "aws_outposts_rack",
      "description": "aws_outposts_rack service"
    },
    {
      "name": "aws_athena",
      "description": "A query service for analyzing data in Amazon S3 using SQL."
    },
    {
      "name": "aws_iot_core",
      "description": "aws_iot_core service"
    },
    {
      "name": "aws_lake_formation",
      "description": "A service for building and managing data lakes."
    },
    {
      "name": "aws_migration_evaluator",
      "description": "aws_migration_evaluator service"
    },
    {
      "name": "aws_thinkbox_xmesh",
      "description": "aws_thinkbox_xmesh service"
    },
    {
      "name": "aws_management_console",
      "description": "aws_management_console service"
    },
    {
      "name": "aws_migration_hub",
      "description": "aws_migration_hub service"
    },
    {
      "name": "aws_efs",
      "description": "aws_efs service"
    },
    {
      "name": "aws_dynamodb",
      "description": "A NoSQL database service."
    },
    {
      "name": "aws_iot_expresslink",
      "description": "aws_iot_expresslink service"
    },
    {
      "name": "aws_codeguru",
      "description": "A tool for automated code reviews and performance optimization."
    },
    {
      "name": "aws_organizations",
      "description": "aws_organizations service"
    },
    {
      "name": "aws_data_exchange",
      "description": "A marketplace for finding, subscribing to, and using third-party data."
    },
    {
      "name": "aws_comprehend",
      "description": "A natural language processing service for text analysis."
    },
    {
      "name": "aws_kendra",
      "description": "An intelligent search service powered by machine learning."
    },
    {
      "name": "aws_tools_and_sdks",
      "description": "aws_tools_and_sdks service"
    },
    {
      "name": "aws_data_firehose",
      "description": "A service for delivering real-time streaming data to destinations."
    },
    {
      "name": "aws_outposts_family",
      "description": "aws_outposts_family service"
    },
    {
      "name": "aws_console_mobile_application",
      "description": "aws_console_mobile_application service"
    },
    {
      "name": "aws_thinkbox_frost",
      "description": "aws_thinkbox_frost service"
    },
    {
      "name": "aws_dcv",
      "description": "aws_dcv service"
    },
    {
      "name": "aws_training_certification",
      "description": "aws_training_certification service"
    },
    {
      "name": "aws_lightsail_for_research",
      "description": "aws_lightsail_for_research service"
    },
    {
      "name": "aws_activate",
      "description": "aws_activate service"
    },
    {
      "name": "aws_tensorflow_on_aws",
      "description": "aws_tensorflow_on_aws service"
    },
    {
      "name": "aws_aurora",
      "description": "A MySQL and PostgreSQL-compatible relational database."
    },
    {
      "name": "aws_elemental_live",
      "description": "aws_elemental_live service"
    },
    {
      "name": "aws_braket",
      "description": "aws_braket service"
    },
    {
      "name": "aws_sagemaker_ground_truth",
      "description": "aws_sagemaker_ground_truth service"
    },
    {
      "name": "aws_lex",
      "description": "A service for building conversational interfaces."
    },
    {
      "name": "aws_license_manager",
      "description": "aws_license_manager service"
    },
    {
      "name": "aws_key_management_service",
      "description": "aws_key_management_service service"
    },
    {
      "name": "aws_batch",
      "description": "aws_batch service"
    },
    {
      "name": "aws_panorama",
      "description": "aws_panorama service"
    },
    {
      "name": "aws_private_certificate_authority",
      "description": "aws_private_certificate_authority service"
    },
    {
      "name": "aws_certificate_manager",
      "description": "aws_certificate_manager service"
    },
    {
      "name": "aws_service_management_connector",
      "description": "aws_service_management_connector service"
    },
    {
      "name": "aws_healthimaging",
      "description": "aws_healthimaging service"
    },
    {
      "name": "aws_kinesis_data_streams",
      "description": "aws_kinesis_data_streams service"
    },
    {
      "name": "aws_elastic_disaster_recovery",
      "description": "aws_elastic_disaster_recovery service"
    },
    {
      "name": "aws_cost_and_usage_report",
      "description": "aws_cost_and_usage_report service"
    },
    {
      "name": "aws_eks_anywhere",
      "description": "aws_eks_anywhere service"
    },
    {
      "name": "aws_ec2_auto_scaling",
      "description": "aws_ec2_auto_scaling service"
    },
    {
      "name": "aws_elemental_conductor",
      "description": "aws_elemental_conductor service"
    },
    {
      "name": "aws_keyspaces",
      "description": "aws_keyspaces service"
    },
    {
      "name": "aws_fraud_detector",
      "description": "A service for detecting fraudulent activities."
    },
    {
      "name": "aws_elemental_delta",
      "description": "aws_elemental_delta service"
    },
    {
      "name": "aws_verified_permissions",
      "description": "aws_verified_permissions service"
    },
    {
      "name": "aws_cloudshell",
      "description": "aws_cloudshell service"
    },
    {
      "name": "aws_virtual_private_cloud",
      "description": "aws_virtual_private_cloud service"
    },
    {
      "name": "aws_simple_queue_service",
      "description": "A managed message queue service."
    },
    {
      "name": "aws_simple_storage_service",
      "description": "aws_simple_storage_service service"
    },
    {
      "name": "aws_elemental_mediaconvert",
      "description": "aws_elemental_mediaconvert service"
    },
    {
      "name": "aws_simple_email_service",
      "description": "aws_simple_email_service service"
    },
    {
      "name": "aws_codedeploy",
      "description": "aws_codedeploy service"
    },
    {
      "name": "aws_kinesis",
      "description": "A platform for processing real-time streaming data."
    },
    {
      "name": "aws_elastic_block_store",
      "description": "aws_elastic_block_store service"
    },
    {
      "name": "aws_device_farm",
      "description": "aws_device_farm service"
    },
    {
      "name": "aws_neuron",
      "description": "aws_neuron service"
    },
    {
      "name": "aws_iot_device_management",
      "description": "A service for managing IoT devices at scale."
    },
    {
      "name": "aws_route_53",
      "description": "aws_route_53 service"
    },
    {
      "name": "aws_codewhisperer",
      "description": "An AI-powered coding assistant."
    },
    {
      "name": "aws_appflow",
      "description": "An integration service for transferring data between SaaS apps and AWS."
    },
    {
      "name": "aws_deadline_cloud",
      "description": "aws_deadline_cloud service"
    },
    {
      "name": "aws_datazone",
      "description": "A data management service for organizing and governing data."
    },
    {
      "name": "aws_codebuild",
      "description": "aws_codebuild service"
    },
    {
      "name": "aws_ec2",
      "description": "A virtual server compute service."
    },
    {
      "name": "aws_mainframe_modernization",
      "description": "aws_mainframe_modernization service"
    },
    {
      "name": "aws_translate",
      "description": "aws_translate service"
    },
    {
      "name": "aws_iam_identity_center",
      "description": "aws_iam_identity_center service"
    },
    {
      "name": "aws_clean_rooms",
      "description": "A service for secure data collaboration across organizations."
    },
    {
      "name": "aws_app_runner",
      "description": "aws_app_runner service"
    },
    {
      "name": "aws_cloud9",
      "description": "aws_cloud9 service"
    },
    {
      "name": "aws_marketplace_light",
      "description": "aws_marketplace_light service"
    },
    {
      "name": "aws_client_vpn",
      "description": "aws_client_vpn service"
    },
    {
      "name": "aws_systems_manager",
      "description": "aws_systems_manager service"
    },
    {
      "name": "aws_app_mesh",
      "description": "aws_app_mesh service"
    },
    {
      "name": "aws_express_workflows",
      "description": "aws_express_workflows service"
    },
    {
      "name": "aws_workmail",
      "description": "aws_workmail service"
    },
    {
      "name": "aws_support",
      "description": "aws_support service"
    },
    {
      "name": "aws_lightsail",
      "description": "aws_lightsail service"
    },
    {
      "name": "aws_telco_network_builder",
      "description": "aws_telco_network_builder service"
    },
    {
      "name": "aws_fault_injection_service",
      "description": "aws_fault_injection_service service"
    },
    {
      "name": "aws_thinkbox_krakatoa",
      "description": "aws_thinkbox_krakatoa service"
    },
    {
      "name": "aws_deep_learning_containers",
      "description": "aws_deep_learning_containers service"
    },
    {
      "name": "aws_trusted_advisor",
      "description": "aws_trusted_advisor service"
    },
    {
      "name": "aws_application_recovery_controller",
      "description": "aws_application_recovery_controller service"
    },
    {
      "name": "aws_cloudwatch",
      "description": "A monitoring and observability service."
    },
    {
      "name": "aws_chime",
      "description": "aws_chime service"
    },
    {
      "name": "aws_elastic_transcoder",
      "description": "aws_elastic_transcoder service"
    },
    {
      "name": "aws_alexa_for_business",
      "description": "aws_alexa_for_business service"
    },
    {
      "name": "aws_iot_analytics",
      "description": "aws_iot_analytics service"
    },
    {
      "name": "aws_fsx_for_netapp_ontap",
      "description": "aws_fsx_for_netapp_ontap service"
    },
    {
      "name": "aws_lookout_for_vision",
      "description": "A service for detecting defects using computer vision."
    },
    {
      "name": "aws_elemental_mediapackage",
      "description": "aws_elemental_mediapackage service"
    },
    {
      "name": "aws_direct_connect",
      "description": "aws_direct_connect service"
    },
    {
      "name": "aws_security_incident_response",
      "description": "aws_security_incident_response service"
    },
    {
      "name": "aws_iot_fleetwise",
      "description": "aws_iot_fleetwise service"
    },
    {
      "name": "aws_lambda",
      "description": "A serverless compute service for running code."
    },
    {
      "name": "aws_database_migration_service",
      "description": "aws_database_migration_service service"
    },
    {
      "name": "aws_kinesis_video_streams",
      "description": "A service for processing and analyzing video streams."
    },
    {
      "name": "aws_fsx",
      "description": "aws_fsx service"
    },
    {
      "name": "aws_codecommit",
      "description": "aws_codecommit service"
    },
    {
      "name": "aws_iot_greengrass",
      "description": "aws_iot_greengrass service"
    },
    {
      "name": "aws_devops_guru",
      "description": "A service for improving application performance and reliability."
    },
    {
      "name": "aws_payment_cryptography",
      "description": "aws_payment_cryptography service"
    },
    {
      "name": "aws_robomaker",
      "description": "aws_robomaker service"
    },
    {
      "name": "aws_sagemaker_ai",
      "description": "aws_sagemaker_ai service"
    },
    {
      "name": "aws_eks_cloud",
      "description": "aws_eks_cloud service"
    },
    {
      "name": "aws_datasync",
      "description": "aws_datasync service"
    },
    {
      "name": "aws_ec2_image_builder",
      "description": "aws_ec2_image_builder service"
    },
    {
      "name": "aws_config",
      "description": "aws_config service"
    },
    {
      "name": "aws_secrets_manager",
      "description": "aws_secrets_manager service"
    },
    {
      "name": "aws_managed_service_for_prometheus",
      "description": "A monitoring service compatible with Prometheus."
    },
    {
      "name": "aws_global_accelerator",
      "description": "aws_global_accelerator service"
    },
    {
      "name": "aws_deep_learning_amis",
      "description": "aws_deep_learning_amis service"
    },
    {
      "name": "aws_verified_access",
      "description": "aws_verified_access service"
    },
    {
      "name": "aws_managed_streaming_for_apache_kafka",
      "description": "aws_managed_streaming_for_apache_kafka service"
    },
    {
      "name": "aws_step_functions",
      "description": "A serverless orchestration service for coordinating workflows."
    },
    {
      "name": "aws_fsx_for_lustre",
      "description": "aws_fsx_for_lustre service"
    },
    {
      "name": "aws_cloud_control_api",
      "description": "aws_cloud_control_api service"
    },
    {
      "name": "aws_transit_gateway",
      "description": "aws_transit_gateway service"
    },
    {
      "name": "aws_appstream_2",
      "description": "aws_appstream_2 service"
    },
    {
      "name": "aws_appconfig",
      "description": "aws_appconfig service"
    },
    {
      "name": "aws_elemental_mediatailor",
      "description": "aws_elemental_mediatailor service"
    },
    {
      "name": "aws_location_service",
      "description": "aws_location_service service"
    },
    {
      "name": "aws_budgets",
      "description": "aws_budgets service"
    },
    {
      "name": "aws_local_zones",
      "description": "aws_local_zones service"
    },
    {
      "name": "aws_workdocs_sdk",
      "description": "aws_workdocs_sdk service"
    },
    {
      "name": "aws_deepcomposer",
      "description": "aws_deepcomposer service"
    },
    {
      "name": "aws_transfer_family",
      "description": "aws_transfer_family service"
    },
    {
      "name": "aws_cloudfront",
      "description": "aws_cloudfront service"
    },
    {
      "name": "aws_transcribe",
      "description": "aws_transcribe service"
    },
    {
      "name": "aws_cloud_map",
      "description": "aws_cloud_map service"
    },
    {
      "name": "aws_service_catalog",
      "description": "aws_service_catalog service"
    },
    {
      "name": "aws_monitron",
      "description": "A service for monitoring equipment health."
    },
    {
      "name": "aws_billing_conductor",
      "description": "aws_billing_conductor service"
    },
    {
      "name": "aws_documentdb",
      "description": "aws_documentdb service"
    },
    {
      "name": "aws_b2b_data_interchange",
      "description": "A service for exchanging EDI data with trading partners."
    },
    {
      "name": "aws_q",
      "description": "aws_q service"
    },
    {
      "name": "aws_mq",
      "description": "A managed message broker service supporting multiple protocols."
    },
    {
      "name": "aws_end_user_messaging",
      "description": "aws_end_user_messaging service"
    },
    {
      "name": "aws_sagemaker",
      "description": "A machine learning platform for building and deploying models."
    },
    {
      "name": "aws_managed_blockchain",
      "description": "aws_managed_blockchain service"
    },
    {
      "name": "aws_directory_service",
      "description": "aws_directory_service service"
    }
  ],
    "gcp": [
    {
      "name": "gcp_virtual_private_cloud",
      "description": "GCP Virtual Private Cloud service."
    },
    {
      "name": "gcp_artifact_registry",
      "description": "GCP Artifact Registry service."
    },
    {
      "name": "gcp_transfer",
      "description": "GCP Transfer service."
    },
    {
      "name": "gcp_filestore",
      "description": "GCP Filestore service."
    },
    {
      "name": "gcp_automl_video_intelligence",
      "description": "GCP Automl Video Intelligence service."
    },
    {
      "name": "gcp_vertexai",
      "description": "GCP Vertexai service."
    },
    {
      "name": "gcp_os_inventory_management",
      "description": "GCP Os Inventory Management service."
    },
    {
      "name": "gcp_cloud_tpu",
      "description": "GCP Cloud Tpu service."
    },
    {
      "name": "gcp_datastream",
      "description": "GCP Datastream service."
    },
    {
      "name": "gcp_cloud_for_marketing",
      "description": "GCP Cloud For Marketing service."
    },
    {
      "name": "gcp_cloud_optimization_ai",
      "description": "GCP Cloud Optimization Ai service."
    },
    {
      "name": "gcp_binary_authorization",
      "description": "GCP Binary Authorization service."
    },
    {
      "name": "gcp_connectors",
      "description": "GCP Connectors service."
    },
    {
      "name": "gcp_partner_portal",
      "description": "GCP Partner Portal service."
    },
    {
      "name": "gcp_configuration_management",
      "description": "GCP Configuration Management service."
    },
    {
      "name": "gcp_os_configuration_management",
      "description": "GCP Os Configuration Management service."
    },
    {
      "name": "gcp_cloud_security_scanner",
      "description": "GCP Cloud Security Scanner service."
    },
    {
      "name": "gcp_financial_services_marketplace",
      "description": "GCP Financial Services Marketplace service."
    },
    {
      "name": "gcp_debugger",
      "description": "GCP Debugger service."
    },
    {
      "name": "gcp_compute_engine",
      "description": "A virtual machine service for running scalable compute workloads."
    },
    {
      "name": "gcp_private_service_connect",
      "description": "GCP Private Service Connect service."
    },
    {
      "name": "gcp_cloud_test_lab",
      "description": "GCP Cloud Test Lab service."
    },
    {
      "name": "gcp_automl_natural_language",
      "description": "GCP Automl Natural Language service."
    },
    {
      "name": "gcp_my_cloud",
      "description": "GCP My Cloud service."
    },
    {
      "name": "gcp_bare_metal_solutions",
      "description": "GCP Bare Metal Solutions service."
    },
    {
      "name": "gcp_key_access_justifications",
      "description": "GCP Key Access Justifications service."
    },
    {
      "name": "gcp_anthos",
      "description": "GCP Anthos service."
    },
    {
      "name": "gcp_app_engine",
      "description": "A platform for building scalable web applications and APIs."
    },
    {
      "name": "gcp_developer_portal",
      "description": "GCP Developer Portal service."
    },
    {
      "name": "gcp_risk_manager",
      "description": "GCP Risk Manager service."
    },
    {
      "name": "gcp_transfer_appliance",
      "description": "GCP Transfer Appliance service."
    },
    {
      "name": "gcp_home",
      "description": "GCP Home service."
    },
    {
      "name": "gcp_cloud_external_ip_addresses",
      "description": "GCP Cloud External Ip Addresses service."
    },
    {
      "name": "gcp_advanced_solutions_lab",
      "description": "GCP Advanced Solutions Lab service."
    },
    {
      "name": "gcp_gke_on_prem",
      "description": "GCP Gke On Prem service."
    },
    {
      "name": "gcp_advanced_agent_modeling",
      "description": "GCP Advanced Agent Modeling service."
    },
    {
      "name": "gcp_dialogflow_cx",
      "description": "GCP Dialogflow Cx service."
    },
    {
      "name": "gcp_data_studio",
      "description": "GCP Data Studio service."
    },
    {
      "name": "gcp_cloud_deployment_manager",
      "description": "GCP Cloud Deployment Manager service."
    },
    {
      "name": "gcp_game_servers",
      "description": "GCP Game Servers service."
    },
    {
      "name": "gcp_policy_analyzer",
      "description": "GCP Policy Analyzer service."
    },
    {
      "name": "gcp_cloud_healthcare_marketplace",
      "description": "GCP Cloud Healthcare Marketplace service."
    },
    {
      "name": "gcp_stream_suite",
      "description": "GCP Stream Suite service."
    },
    {
      "name": "gcp_cloud_ops",
      "description": "GCP Cloud Ops service."
    },
    {
      "name": "gcp_dataproc_metastore",
      "description": "GCP Dataproc Metastore service."
    },
    {
      "name": "gcp_google_kubernetes_engine",
      "description": "GCP Google Kubernetes Engine service."
    },
    {
      "name": "gcp_cloud_vision_api",
      "description": "GCP Cloud Vision Api service."
    },
    {
      "name": "gcp_datastore",
      "description": "GCP Datastore service."
    },
    {
      "name": "gcp_cloud_build",
      "description": "A continuous integration and delivery platform for building and deploying applications."
    },
    {
      "name": "gcp_iot_core",
      "description": "GCP Iot Core service."
    },
    {
      "name": "gcp_healthcare_nlp_api",
      "description": "GCP Healthcare Nlp Api service."
    },
    {
      "name": "gcp_firestore",
      "description": "A NoSQL document database for mobile, web, and server applications."
    },
    {
      "name": "gcp_cloud_cdn",
      "description": "A content delivery network for fast, reliable delivery of web content."
    },
    {
      "name": "gcp_cloud_shell",
      "description": "GCP Cloud Shell service."
    },
    {
      "name": "gcp_visual_inspection",
      "description": "GCP Visual Inspection service."
    },
    {
      "name": "gcp_cloud_optimization_ai___fleet_routing_api",
      "description": "GCP Cloud Optimization Ai   Fleet Routing Api service."
    },
    {
      "name": "gcp_stackdriver",
      "description": "GCP Stackdriver service."
    },
    {
      "name": "gcp_certificate_authority_service",
      "description": "GCP Certificate Authority Service service."
    },
    {
      "name": "gcp_permissions",
      "description": "GCP Permissions service."
    },
    {
      "name": "gcp_real_world_insights",
      "description": "GCP Real World Insights service."
    },
    {
      "name": "gcp_dataproc",
      "description": "A managed service for running Apache Spark and Hadoop workloads."
    },
    {
      "name": "gcp_cloud_ids",
      "description": "GCP Cloud Ids service."
    },
    {
      "name": "gcp_error_reporting",
      "description": "GCP Error Reporting service."
    },
    {
      "name": "gcp_cloud_monitoring",
      "description": "A service for monitoring, logging, and diagnosing application performance."
    },
    {
      "name": "gcp_local_ssd",
      "description": "GCP Local Ssd service."
    },
    {
      "name": "gcp_certificate_manager",
      "description": "GCP Certificate Manager service."
    },
    {
      "name": "gcp_ai_platform",
      "description": "A suite of tools for building, deploying, and scaling machine learning models."
    },
    {
      "name": "gcp_data_transfer",
      "description": "GCP Data Transfer service."
    },
    {
      "name": "gcp_dataprep",
      "description": "GCP Dataprep service."
    },
    {
      "name": "gcp_data_layers",
      "description": "GCP Data Layers service."
    },
    {
      "name": "gcp_network_intelligence_center",
      "description": "GCP Network Intelligence Center service."
    },
    {
      "name": "gcp_cloud_domains",
      "description": "GCP Cloud Domains service."
    },
    {
      "name": "gcp_memorystore",
      "description": "GCP Memorystore service."
    },
    {
      "name": "gcp_api_monetization",
      "description": "GCP Api Monetization service."
    },
    {
      "name": "gcp_release_notes",
      "description": "GCP Release Notes service."
    },
    {
      "name": "gcp_web_security_scanner",
      "description": "GCP Web Security Scanner service."
    },
    {
      "name": "gcp_anthos_service_mesh",
      "description": "GCP Anthos Service Mesh service."
    },
    {
      "name": "gcp_network_tiers",
      "description": "GCP Network Tiers service."
    },
    {
      "name": "gcp_container_optimized_os",
      "description": "GCP Container Optimized Os service."
    },
    {
      "name": "gcp_traffic_director",
      "description": "GCP Traffic Director service."
    },
    {
      "name": "gcp_cloud_tasks",
      "description": "A task queue service for managing asynchronous task execution."
    },
    {
      "name": "gcp_performance_dashboard",
      "description": "GCP Performance Dashboard service."
    },
    {
      "name": "gcp_cloud_run_for_anthos",
      "description": "GCP Cloud Run For Anthos service."
    },
    {
      "name": "gcp_automl_translation",
      "description": "GCP Automl Translation service."
    },
    {
      "name": "gcp_launcher",
      "description": "GCP Launcher service."
    },
    {
      "name": "gcp_administration",
      "description": "GCP Administration service."
    },
    {
      "name": "gcp_retail_api",
      "description": "GCP Retail Api service."
    },
    {
      "name": "gcp_cloud_routes",
      "description": "GCP Cloud Routes service."
    },
    {
      "name": "gcp_workflows",
      "description": "GCP Workflows service."
    },
    {
      "name": "gcp_automl_tables",
      "description": "GCP Automl Tables service."
    },
    {
      "name": "gcp_cloud_armor",
      "description": "A DDoS protection and web application firewall service."
    },
    {
      "name": "gcp_managed_service_for_microsoft_active_directory",
      "description": "GCP Managed Service For Microsoft Active Directory service."
    },
    {
      "name": "gcp_quotas",
      "description": "GCP Quotas service."
    },
    {
      "name": "gcp_cloud_hsm",
      "description": "GCP Cloud Hsm service."
    },
    {
      "name": "gcp_data_labeling",
      "description": "GCP Data Labeling service."
    },
    {
      "name": "gcp_phishing_protection",
      "description": "GCP Phishing Protection service."
    },
    {
      "name": "gcp_catalog",
      "description": "GCP Catalog service."
    },
    {
      "name": "gcp_identity_platform",
      "description": "GCP Identity Platform service."
    },
    {
      "name": "gcp_cloud_router",
      "description": "GCP Cloud Router service."
    },
    {
      "name": "gcp_cloud_healthcare_api",
      "description": "GCP Cloud Healthcare Api service."
    },
    {
      "name": "gcp_cloud_scheduler",
      "description": "A managed cron job service for automating tasks."
    },
    {
      "name": "gcp_google_maps_platform",
      "description": "GCP Google Maps Platform service."
    },
    {
      "name": "gcp_support",
      "description": "GCP Support service."
    },
    {
      "name": "gcp_network_topology",
      "description": "GCP Network Topology service."
    },
    {
      "name": "gcp_eventarc",
      "description": "GCP Eventarc service."
    },
    {
      "name": "gcp_fleet_engine",
      "description": "GCP Fleet Engine service."
    },
    {
      "name": "gcp_cloud_translation_api",
      "description": "GCP Cloud Translation Api service."
    },
    {
      "name": "gcp_security_command_center",
      "description": "GCP Security Command Center service."
    },
    {
      "name": "gcp_tensorflow_enterprise",
      "description": "GCP Tensorflow Enterprise service."
    },
    {
      "name": "gcp_cloud_api_gateway",
      "description": "GCP Cloud Api Gateway service."
    },
    {
      "name": "gcp_dataflow",
      "description": "A fully managed service for stream and batch data processing."
    },
    {
      "name": "gcp_analytics_hub",
      "description": "GCP Analytics Hub service."
    },
    {
      "name": "gcp_agent_assist",
      "description": "GCP Agent Assist service."
    },
    {
      "name": "gcp_premium_network_tier",
      "description": "GCP Premium Network Tier service."
    },
    {
      "name": "gcp_anthos_config_management",
      "description": "GCP Anthos Config Management service."
    },
    {
      "name": "gcp_cloud_run",
      "description": "A managed service for running containerized applications."
    },
    {
      "name": "gcp_batch",
      "description": "GCP Batch service."
    },
    {
      "name": "gcp_cloud_composer",
      "description": "GCP Cloud Composer service."
    },
    {
      "name": "gcp_dialogflow_insights",
      "description": "GCP Dialogflow Insights service."
    },
    {
      "name": "gcp_data_qna",
      "description": "GCP Data Qna service."
    },
    {
      "name": "gcp_cloud_endpoints",
      "description": "GCP Cloud Endpoints service."
    },
    {
      "name": "gcp_google_cloud_marketplace",
      "description": "GCP Google Cloud Marketplace service."
    },
    {
      "name": "gcp_cloud_network",
      "description": "GCP Cloud Network service."
    },
    {
      "name": "gcp_gce_systems_management",
      "description": "GCP Gce Systems Management service."
    },
    {
      "name": "gcp_cloud_apis",
      "description": "GCP Cloud Apis service."
    },
    {
      "name": "gcp_cloud_deploy",
      "description": "GCP Cloud Deploy service."
    },
    {
      "name": "gcp_profiler",
      "description": "GCP Profiler service."
    },
    {
      "name": "gcp_tools_for_powershell",
      "description": "GCP Tools For Powershell service."
    },
    {
      "name": "gcp_persistent_disk",
      "description": "GCP Persistent Disk service."
    },
    {
      "name": "gcp_api_analytics",
      "description": "GCP Api Analytics service."
    },
    {
      "name": "gcp_text_to_speech",
      "description": "GCP Text To Speech service."
    },
    {
      "name": "gcp_pubsub",
      "description": "A messaging service for real-time event streaming and data integration."
    },
    {
      "name": "gcp_cloud_interconnect",
      "description": "GCP Cloud Interconnect service."
    },
    {
      "name": "gcp_identity_and_access_management",
      "description": "GCP Identity And Access Management service."
    },
    {
      "name": "gcp_speech_to_text",
      "description": "GCP Speech To Text service."
    },
    {
      "name": "gcp_billing",
      "description": "GCP Billing service."
    },
    {
      "name": "gcp_recommendations_ai",
      "description": "GCP Recommendations Ai service."
    },
    {
      "name": "gcp_producer_portal",
      "description": "GCP Producer Portal service."
    },
    {
      "name": "gcp_vmware_engine",
      "description": "GCP Vmware Engine service."
    },
    {
      "name": "gcp_cloud_load_balancing",
      "description": "A managed load balancing service for distributing traffic across instances."
    },
    {
      "name": "gcp_security",
      "description": "GCP Security service."
    },
    {
      "name": "gcp_security_health_advisor",
      "description": "GCP Security Health Advisor service."
    },
    {
      "name": "gcp_cloud_firewall_rules",
      "description": "GCP Cloud Firewall Rules service."
    },
    {
      "name": "gcp_workload_identity_pool",
      "description": "GCP Workload Identity Pool service."
    },
    {
      "name": "gcp_cloud_sql",
      "description": "A fully managed relational database service for MySQL, PostgreSQL, and SQL Server."
    },
    {
      "name": "gcp_identity_aware_proxy",
      "description": "GCP Identity Aware Proxy service."
    },
    {
      "name": "gcp_datapol",
      "description": "GCP Datapol service."
    },
    {
      "name": "gcp_datashare",
      "description": "GCP Datashare service."
    },
    {
      "name": "gcp_cloud_data_fusion",
      "description": "GCP Cloud Data Fusion service."
    },
    {
      "name": "gcp_api",
      "description": "GCP Api service."
    },
    {
      "name": "gcp_network_security",
      "description": "GCP Network Security service."
    },
    {
      "name": "gcp_cloud_media_edge",
      "description": "GCP Cloud Media Edge service."
    },
    {
      "name": "gcp_container_registry",
      "description": "GCP Container Registry service."
    },
    {
      "name": "gcp_user_preferences",
      "description": "GCP User Preferences service."
    },
    {
      "name": "gcp_cloud_logging",
      "description": "A centralized logging service for collecting and analyzing log data."
    },
    {
      "name": "gcp_asset_inventory",
      "description": "GCP Asset Inventory service."
    },
    {
      "name": "gcp_database_migration_service",
      "description": "GCP Database Migration Service service."
    },
    {
      "name": "gcp_service_discovery",
      "description": "GCP Service Discovery service."
    },
    {
      "name": "gcp_migrate_for_compute_engine",
      "description": "GCP Migrate For Compute Engine service."
    },
    {
      "name": "gcp_cloud_spanner",
      "description": "GCP Cloud Spanner service."
    },
    {
      "name": "gcp_beyondcorp",
      "description": "GCP Beyondcorp service."
    },
    {
      "name": "gcp_cloud_code",
      "description": "GCP Cloud Code service."
    },
    {
      "name": "gcp_cloud_nat",
      "description": "GCP Cloud Nat service."
    },
    {
      "name": "gcp_ai_platform_unified",
      "description": "GCP Ai Platform Unified service."
    },
    {
      "name": "gcp_cloud_asset_inventory",
      "description": "GCP Cloud Asset Inventory service."
    },
    {
      "name": "gcp_cloud_natural_language_api",
      "description": "GCP Cloud Natural Language Api service."
    },
    {
      "name": "gcp_kuberun",
      "description": "GCP Kuberun service."
    },
    {
      "name": "gcp_cloud_functions",
      "description": "A serverless compute service for running event-driven code."
    },
    {
      "name": "gcp_runtime_config",
      "description": "GCP Runtime Config service."
    },
    {
      "name": "gcp_cloud_gpu",
      "description": "GCP Cloud Gpu service."
    },
    {
      "name": "gcp_assured_workloads",
      "description": "GCP Assured Workloads service."
    },
    {
      "name": "gcp_quantum_engine",
      "description": "GCP Quantum Engine service."
    },
    {
      "name": "gcp_genomics",
      "description": "GCP Genomics service."
    },
    {
      "name": "gcp_bigquery",
      "description": "A fully managed, serverless data warehouse for large-scale data analytics."
    },
    {
      "name": "gcp_key_management_service",
      "description": "GCP Key Management Service service."
    },
    {
      "name": "gcp_cloud_dns",
      "description": "GCP Cloud Dns service."
    },
    {
      "name": "gcp_web_risk",
      "description": "GCP Web Risk service."
    },
    {
      "name": "gcp_apigee_api_platform",
      "description": "GCP Apigee Api Platform service."
    },
    {
      "name": "gcp_early_access_center",
      "description": "GCP Early Access Center service."
    },
    {
      "name": "gcp_security_key_enforcement",
      "description": "GCP Security Key Enforcement service."
    },
    {
      "name": "gcp_secret_manager",
      "description": "A service for securely storing and managing sensitive information like API keys and passwords."
    },
    {
      "name": "gcp_connectivity_test",
      "description": "GCP Connectivity Test service."
    },
    {
      "name": "gcp_onboarding",
      "description": "GCP Onboarding service."
    },
    {
      "name": "gcp_document_ai",
      "description": "GCP Document Ai service."
    },
    {
      "name": "gcp_cloud_jobs_api",
      "description": "GCP Cloud Jobs Api service."
    },
    {
      "name": "gcp_cloud_ekm",
      "description": "GCP Cloud Ekm service."
    },
    {
      "name": "gcp_data_catalog",
      "description": "GCP Data Catalog service."
    },
    {
      "name": "gcp_dataplex",
      "description": "GCP Dataplex service."
    },
    {
      "name": "gcp_cloud_vpn",
      "description": "GCP Cloud Vpn service."
    },
    {
      "name": "gcp_migrate_for_anthos",
      "description": "GCP Migrate For Anthos service."
    },
    {
      "name": "gcp_automl",
      "description": "GCP Automl service."
    },
    {
      "name": "gcp_dialogflow",
      "description": "GCP Dialogflow service."
    },
    {
      "name": "gcp_cloud_generic",
      "description": "GCP Cloud Generic service."
    },
    {
      "name": "gcp_media_translation_api",
      "description": "GCP Media Translation Api service."
    },
    {
      "name": "gcp_cloud_inference_api",
      "description": "GCP Cloud Inference Api service."
    },
    {
      "name": "gcp_iot_edge",
      "description": "GCP Iot Edge service."
    },
    {
      "name": "gcp_video_intelligence_api",
      "description": "GCP Video Intelligence Api service."
    },
    {
      "name": "gcp_network_connectivity_center",
      "description": "GCP Network Connectivity Center service."
    },
    {
      "name": "gcp_cloud_audit_logs",
      "description": "GCP Cloud Audit Logs service."
    },
    {
      "name": "gcp_datalab",
      "description": "GCP Datalab service."
    },
    {
      "name": "gcp_data_loss_prevention_api",
      "description": "GCP Data Loss Prevention Api service."
    },
    {
      "name": "gcp_ai_hub",
      "description": "GCP Ai Hub service."
    },
    {
      "name": "gcp_standard_network_tier",
      "description": "GCP Standard Network Tier service."
    },
    {
      "name": "gcp_access_context_manager",
      "description": "GCP Access Context Manager service."
    },
    {
      "name": "gcp_automl_vision",
      "description": "GCP Automl Vision service."
    },
    {
      "name": "gcp_project",
      "description": "GCP Project service."
    },
    {
      "name": "gcp_cloud_storage",
      "description": "A scalable, durable object storage service for unstructured data."
    },
    {
      "name": "gcp_partner_interconnect",
      "description": "GCP Partner Interconnect service."
    },
    {
      "name": "gcp_os_patch_management",
      "description": "GCP Os Patch Management service."
    },
    {
      "name": "gcp_looker",
      "description": "GCP Looker service."
    },
    {
      "name": "gcp_apigee_sense",
      "description": "GCP Apigee Sense service."
    },
    {
      "name": "gcp_trace",
      "description": "GCP Trace service."
    },
    {
      "name": "gcp_free_trial",
      "description": "GCP Free Trial service."
    },
    {
      "name": "gcp_private_connectivity",
      "description": "GCP Private Connectivity service."
    },
    {
      "name": "gcp_contact_center_ai",
      "description": "GCP Contact Center Ai service."
    },
    {
      "name": "gcp_bigtable",
      "description": "GCP Bigtable service."
    }
  ],
    "azure": [
    {
      "name": "azure_azure_support_center_blue",
      "description": "Azure Azure Support Center Blue service."
    },
    {
      "name": "azure_versions",
      "description": "Azure Versions service."
    },
    {
      "name": "azure_batch_ai",
      "description": "Azure Batch Ai service."
    },
    {
      "name": "azure_time_series_insights_access_policies",
      "description": "Azure Time Series Insights Access Policies service."
    },
    {
      "name": "azure_app_configuration",
      "description": "Azure App Configuration service."
    },
    {
      "name": "azure_load_balancers",
      "description": "Azure Load Balancers service."
    },
    {
      "name": "azure_vm_image_version",
      "description": "Azure Vm Image Version service."
    },
    {
      "name": "azure_alerts",
      "description": "Azure Alerts service."
    },
    {
      "name": "azure_application_gateways",
      "description": "Azure Application Gateways service."
    },
    {
      "name": "azure_azure_center_for_sap",
      "description": "Azure Azure Center For Sap service."
    },
    {
      "name": "azure_code_optimization",
      "description": "Azure Code Optimization service."
    },
    {
      "name": "azure_media_file",
      "description": "Azure Media File service."
    },
    {
      "name": "azure_arc_sql_managed_instance",
      "description": "A service for managing SQL Managed Instances with Azure Arc."
    },
    {
      "name": "azure_data_share_invitations",
      "description": "Azure Data Share Invitations service."
    },
    {
      "name": "azure_azure_service_bus",
      "description": "Azure Azure Service Bus service."
    },
    {
      "name": "azure_counter",
      "description": "Azure Counter service."
    },
    {
      "name": "azure_resource_graph_explorer",
      "description": "Azure Resource Graph Explorer service."
    },
    {
      "name": "azure_image_definitions",
      "description": "Azure Image Definitions service."
    },
    {
      "name": "azure_file",
      "description": "Azure File service."
    },
    {
      "name": "azure_notification_hubs",
      "description": "Azure Notification Hubs service."
    },
    {
      "name": "azure_public_ip_addresses",
      "description": "Azure Public Ip Addresses service."
    },
    {
      "name": "azure_azure_database_migration_services",
      "description": "Azure Azure Database Migration Services service."
    },
    {
      "name": "azure_azure_communications_gateway",
      "description": "Azure Azure Communications Gateway service."
    },
    {
      "name": "azure_notification_hub_namespaces",
      "description": "Azure Notification Hub Namespaces service."
    },
    {
      "name": "azure_application_insights",
      "description": "A tool for monitoring and diagnosing application performance and usage."
    },
    {
      "name": "azure_ssd",
      "description": "Azure Ssd service."
    },
    {
      "name": "azure_azure_synapse_analytics",
      "description": "Azure Azure Synapse Analytics service."
    },
    {
      "name": "azure_vm_app_versions",
      "description": "Azure Vm App Versions service."
    },
    {
      "name": "azure_restore_points",
      "description": "Azure Restore Points service."
    },
    {
      "name": "azure_event_grid_subscriptions",
      "description": "Azure Event Grid Subscriptions service."
    },
    {
      "name": "azure_search",
      "description": "Azure Search service."
    },
    {
      "name": "azure_windows10_core_services",
      "description": "Azure Windows10 Core Services service."
    },
    {
      "name": "azure_peerings",
      "description": "Azure Peerings service."
    },
    {
      "name": "azure_intune_trends",
      "description": "Azure Intune Trends service."
    },
    {
      "name": "azure_user_subscriptions",
      "description": "Azure User Subscriptions service."
    },
    {
      "name": "azure_entra_connect_health",
      "description": "Azure Entra Connect Health service."
    },
    {
      "name": "azure_integration_service_environments",
      "description": "Azure Integration Service Environments service."
    },
    {
      "name": "azure_sendgrid_accounts",
      "description": "Azure Sendgrid Accounts service."
    },
    {
      "name": "azure_machine_learning",
      "description": "A platform for building, training, and deploying machine learning models."
    },
    {
      "name": "azure_image_versions",
      "description": "Azure Image Versions service."
    },
    {
      "name": "azure_device_provisioning_services",
      "description": "Azure Device Provisioning Services service."
    },
    {
      "name": "azure_restore_points_collections",
      "description": "Azure Restore Points Collections service."
    },
    {
      "name": "azure_dedicated_hsm",
      "description": "Azure Dedicated Hsm service."
    },
    {
      "name": "azure_ssis_lift_and_shift_ir",
      "description": "Azure Ssis Lift And Shift Ir service."
    },
    {
      "name": "azure_exchange_access",
      "description": "Azure Exchange Access service."
    },
    {
      "name": "azure_aks_automatic",
      "description": "Azure Aks Automatic service."
    },
    {
      "name": "azure_cost_export",
      "description": "Azure Cost Export service."
    },
    {
      "name": "azure_customer_lockbox_for_microsoft_azure",
      "description": "Azure Customer Lockbox For Microsoft Azure service."
    },
    {
      "name": "azure_serverless_search",
      "description": "Azure Serverless Search service."
    },
    {
      "name": "azure_devices",
      "description": "Azure Devices service."
    },
    {
      "name": "azure_firewalls",
      "description": "Azure Firewalls service."
    },
    {
      "name": "azure_entra_identity_custom_roles",
      "description": "Azure Entra Identity Custom Roles service."
    },
    {
      "name": "azure_azure_iot_operations",
      "description": "Azure Azure Iot Operations service."
    },
    {
      "name": "azure_api_connections",
      "description": "Azure Api Connections service."
    },
    {
      "name": "azure_folder_website",
      "description": "Azure Folder Website service."
    },
    {
      "name": "azure_time_series_insights_environments",
      "description": "Azure Time Series Insights Environments service."
    },
    {
      "name": "azure_virtual_wans",
      "description": "Azure Virtual Wans service."
    },
    {
      "name": "azure_mission_landing_zone",
      "description": "Azure Mission Landing Zone service."
    },
    {
      "name": "azure_managed_service_fabric",
      "description": "A managed service for building microservices and applications."
    },
    {
      "name": "azure_azure_hpc_workbenches",
      "description": "Azure Azure Hpc Workbenches service."
    },
    {
      "name": "azure_disks_(classic)",
      "description": "Azure Disks (Classic) service."
    },
    {
      "name": "azure_storsimple_data_managers",
      "description": "Azure Storsimple Data Managers service."
    },
    {
      "name": "azure_app_service_plans",
      "description": "Azure App Service Plans service."
    },
    {
      "name": "azure_iot_central_applications",
      "description": "Azure Iot Central Applications service."
    },
    {
      "name": "azure_managed_devops_pools",
      "description": "Azure Managed Devops Pools service."
    },
    {
      "name": "azure_image",
      "description": "Azure Image service."
    },
    {
      "name": "azure_application_gateway_containers",
      "description": "Azure Application Gateway Containers service."
    },
    {
      "name": "azure_entra_internet_access",
      "description": "Azure Entra Internet Access service."
    },
    {
      "name": "azure_consortium",
      "description": "Azure Consortium service."
    },
    {
      "name": "azure_defender_programable_board",
      "description": "Azure Defender Programable Board service."
    },
    {
      "name": "azure_central_service_instance_for_sap",
      "description": "Azure Central Service Instance For Sap service."
    },
    {
      "name": "azure_arc_machines",
      "description": "Azure Arc Machines service."
    },
    {
      "name": "azure_cloudtest",
      "description": "Azure Cloudtest service."
    },
    {
      "name": "azure_dns_security_policy",
      "description": "Azure Dns Security Policy service."
    },
    {
      "name": "azure_marketplace",
      "description": "Azure Marketplace service."
    },
    {
      "name": "azure_azure_database_mysql_server",
      "description": "Azure Azure Database Mysql Server service."
    },
    {
      "name": "azure_globe_success",
      "description": "Azure Globe Success service."
    },
    {
      "name": "azure_azure_purview_accounts",
      "description": "Azure Azure Purview Accounts service."
    },
    {
      "name": "azure_azure_object_understanding",
      "description": "Azure Azure Object Understanding service."
    },
    {
      "name": "azure_security",
      "description": "Azure Security service."
    },
    {
      "name": "azure_auto_scale",
      "description": "Azure Auto Scale service."
    },
    {
      "name": "azure_defender_hmi",
      "description": "Azure Defender Hmi service."
    },
    {
      "name": "azure_arc_data_services",
      "description": "Azure Arc Data Services service."
    },
    {
      "name": "azure_scheduler_job_collections",
      "description": "Azure Scheduler Job Collections service."
    },
    {
      "name": "azure_app_service_domains",
      "description": "Azure App Service Domains service."
    },
    {
      "name": "azure_lab_services",
      "description": "Azure Lab Services service."
    },
    {
      "name": "azure_private_endpoints",
      "description": "Azure Private Endpoints service."
    },
    {
      "name": "azure_signalr",
      "description": "Azure Signalr service."
    },
    {
      "name": "azure_storage_sync_services",
      "description": "Azure Storage Sync Services service."
    },
    {
      "name": "azure_website_power",
      "description": "Azure Website Power service."
    },
    {
      "name": "azure_iot_hub",
      "description": "Azure Iot Hub service."
    },
    {
      "name": "azure_sonic_dash",
      "description": "Azure Sonic Dash service."
    },
    {
      "name": "azure_search_grid",
      "description": "Azure Search Grid service."
    },
    {
      "name": "azure_event_grid_topics",
      "description": "Azure Event Grid Topics service."
    },
    {
      "name": "azure_stack_hci_premium",
      "description": "Azure Stack Hci Premium service."
    },
    {
      "name": "azure_tfs_vc_repository",
      "description": "Azure Tfs Vc Repository service."
    },
    {
      "name": "azure_preview_features",
      "description": "Azure Preview Features service."
    },
    {
      "name": "azure_virtual_machines_(classic)",
      "description": "Azure Virtual Machines (Classic) service."
    },
    {
      "name": "azure_entra_privleged_identity_management",
      "description": "Azure Entra Privleged Identity Management service."
    },
    {
      "name": "azure_azure_quotas",
      "description": "Azure Azure Quotas service."
    },
    {
      "name": "azure_azure_blockchain_service",
      "description": "Azure Azure Blockchain Service service."
    },
    {
      "name": "azure_oracle_database",
      "description": "Azure Oracle Database service."
    },
    {
      "name": "azure_virtual_wan_hub",
      "description": "Azure Virtual Wan Hub service."
    },
    {
      "name": "azure_client_apps",
      "description": "Azure Client Apps service."
    },
    {
      "name": "azure_machine_learning_studio_web_service_plans",
      "description": "Azure Machine Learning Studio Web Service Plans service."
    },
    {
      "name": "azure_storage_actions",
      "description": "Azure Storage Actions service."
    },
    {
      "name": "azure_software_as_a_service",
      "description": "Azure Software As A Service service."
    },
    {
      "name": "azure_blockchain_applications",
      "description": "Azure Blockchain Applications service."
    },
    {
      "name": "azure_exchange_on_premises_access",
      "description": "Azure Exchange On Premises Access service."
    },
    {
      "name": "azure_users",
      "description": "Azure Users service."
    },
    {
      "name": "azure_files",
      "description": "Azure Files service."
    },
    {
      "name": "azure_security_baselines",
      "description": "Azure Security Baselines service."
    },
    {
      "name": "azure_language",
      "description": "Azure Language service."
    },
    {
      "name": "azure_custom_ip_prefix",
      "description": "Azure Custom Ip Prefix service."
    },
    {
      "name": "azure_public_ip_addresses_(classic)",
      "description": "Azure Public Ip Addresses (Classic) service."
    },
    {
      "name": "azure_blob_page",
      "description": "Azure Blob Page service."
    },
    {
      "name": "azure_azure_monitor_pipeline",
      "description": "Azure Azure Monitor Pipeline service."
    },
    {
      "name": "azure_ip_address_manager",
      "description": "Azure Ip Address Manager service."
    },
    {
      "name": "azure_azure_migrate",
      "description": "Azure Azure Migrate service."
    },
    {
      "name": "azure_business_process_tracking",
      "description": "Azure Business Process Tracking service."
    },
    {
      "name": "azure_keys",
      "description": "Azure Keys service."
    },
    {
      "name": "azure_machine_learning_studio_workspaces",
      "description": "Azure Machine Learning Studio Workspaces service."
    },
    {
      "name": "azure_cubes",
      "description": "Azure Cubes service."
    },
    {
      "name": "azure_api_proxy",
      "description": "A service for managing and routing API traffic."
    },
    {
      "name": "azure_azure_sql_server_stretch_databases",
      "description": "Azure Azure Sql Server Stretch Databases service."
    },
    {
      "name": "azure_traffic_manager_profiles",
      "description": "Azure Traffic Manager Profiles service."
    },
    {
      "name": "azure_storage_functions",
      "description": "Azure Storage Functions service."
    },
    {
      "name": "azure_storage_explorer",
      "description": "Azure Storage Explorer service."
    },
    {
      "name": "azure_azurite",
      "description": "Azure Azurite service."
    },
    {
      "name": "azure_azure_lighthouse",
      "description": "Azure Azure Lighthouse service."
    },
    {
      "name": "azure_azure_media_service",
      "description": "Azure Azure Media Service service."
    },
    {
      "name": "azure_location",
      "description": "Azure Location service."
    },
    {
      "name": "azure_azure_workbooks",
      "description": "Azure Azure Workbooks service."
    },
    {
      "name": "azure_expressroute_direct",
      "description": "Azure Expressroute Direct service."
    },
    {
      "name": "azure_connected_vehicle_platform",
      "description": "Azure Connected Vehicle Platform service."
    },
    {
      "name": "azure_download",
      "description": "Azure Download service."
    },
    {
      "name": "azure_azure_hybrid_center",
      "description": "Azure Azure Hybrid Center service."
    },
    {
      "name": "azure_reserved_capacity",
      "description": "Azure Reserved Capacity service."
    },
    {
      "name": "azure_speech_services",
      "description": "Azure Speech Services service."
    },
    {
      "name": "azure_folder_blank",
      "description": "Azure Folder Blank service."
    },
    {
      "name": "azure_azure_managed_redis",
      "description": "Azure Azure Managed Redis service."
    },
    {
      "name": "azure_azure_databricks",
      "description": "Azure Azure Databricks service."
    },
    {
      "name": "azure_troubleshoot",
      "description": "Azure Troubleshoot service."
    },
    {
      "name": "azure_form_recognizers",
      "description": "Azure Form Recognizers service."
    },
    {
      "name": "azure_extensions",
      "description": "Azure Extensions service."
    },
    {
      "name": "azure_azure_monitor_dashboard",
      "description": "Azure Azure Monitor Dashboard service."
    },
    {
      "name": "azure_defender_external_management",
      "description": "Azure Defender External Management service."
    },
    {
      "name": "azure_biz_talk",
      "description": "Azure Biz Talk service."
    },
    {
      "name": "azure_entra_identity_risky_signins",
      "description": "Azure Entra Identity Risky Signins service."
    },
    {
      "name": "azure_network_interfaces",
      "description": "Azure Network Interfaces service."
    },
    {
      "name": "azure_resources_provider",
      "description": "Azure Resources Provider service."
    },
    {
      "name": "azure_dns_zones",
      "description": "Azure Dns Zones service."
    },
    {
      "name": "azure_input_output",
      "description": "Azure Input Output service."
    },
    {
      "name": "azure_express_route_traffic_collector",
      "description": "Azure Express Route Traffic Collector service."
    },
    {
      "name": "azure_expressroute_circuits",
      "description": "Azure Expressroute Circuits service."
    },
    {
      "name": "azure_recent",
      "description": "Azure Recent service."
    },
    {
      "name": "azure_azure_api_for_fhir",
      "description": "Azure Azure Api For Fhir service."
    },
    {
      "name": "azure_video_analyzers",
      "description": "Azure Video Analyzers service."
    },
    {
      "name": "azure_qna_makers",
      "description": "Azure Qna Makers service."
    },
    {
      "name": "azure_device_update_iot_hub",
      "description": "Azure Device Update Iot Hub service."
    },
    {
      "name": "azure_time_series_data_sets",
      "description": "Azure Time Series Data Sets service."
    },
    {
      "name": "azure_virtual_router",
      "description": "A service for virtual routing within Azure networks."
    },
    {
      "name": "azure_ai_at_edge",
      "description": "Azure Ai At Edge service."
    },
    {
      "name": "azure_azure_firewall_policy",
      "description": "Azure Azure Firewall Policy service."
    },
    {
      "name": "azure_detonation",
      "description": "Azure Detonation service."
    },
    {
      "name": "azure_defender_relay",
      "description": "Azure Defender Relay service."
    },
    {
      "name": "azure_partner_registration",
      "description": "Azure Partner Registration service."
    },
    {
      "name": "azure_edge_storage_accelerator",
      "description": "Azure Edge Storage Accelerator service."
    },
    {
      "name": "azure_capacity_reservation_groups",
      "description": "Azure Capacity Reservation Groups service."
    },
    {
      "name": "azure_os_images_(classic)",
      "description": "Azure Os Images (Classic) service."
    },
    {
      "name": "azure_connections",
      "description": "Azure Connections service."
    },
    {
      "name": "azure_ai_studio",
      "description": "Azure Ai Studio service."
    },
    {
      "name": "azure_azure_edge_hardware_center",
      "description": "Azure Azure Edge Hardware Center service."
    },
    {
      "name": "azure_entra_connect",
      "description": "Azure Entra Connect service."
    },
    {
      "name": "azure_network_managers",
      "description": "Azure Network Managers service."
    },
    {
      "name": "azure_resource_group_list",
      "description": "Azure Resource Group List service."
    },
    {
      "name": "azure_azure_backup_center",
      "description": "Azure Azure Backup Center service."
    },
    {
      "name": "azure_azure_experimentation_studio",
      "description": "Azure Azure Experimentation Studio service."
    },
    {
      "name": "azure_storage_accounts",
      "description": "Azure Storage Accounts service."
    },
    {
      "name": "azure_front_door_and_cdn_profiles",
      "description": "Azure Front Door And Cdn Profiles service."
    },
    {
      "name": "azure_endpoint_analytics",
      "description": "Azure Endpoint Analytics service."
    },
    {
      "name": "azure_workspace_gateway",
      "description": "Azure Workspace Gateway service."
    },
    {
      "name": "azure_web_test",
      "description": "Azure Web Test service."
    },
    {
      "name": "azure_open_supply_chain_platform",
      "description": "Azure Open Supply Chain Platform service."
    },
    {
      "name": "azure_network_security_perimeters",
      "description": "Azure Network Security Perimeters service."
    },
    {
      "name": "azure_mobile",
      "description": "Azure Mobile service."
    },
    {
      "name": "azure_mobile_engagement",
      "description": "Azure Mobile Engagement service."
    },
    {
      "name": "azure_container_services_(deprecated)",
      "description": "Azure Container Services (Deprecated) service."
    },
    {
      "name": "azure_defender_industrial_robot",
      "description": "Azure Defender Industrial Robot service."
    },
    {
      "name": "azure_event_hubs",
      "description": "A real-time data streaming and event ingestion service."
    },
    {
      "name": "azure_fhir_service",
      "description": "Azure Fhir Service service."
    },
    {
      "name": "azure_connected_cache",
      "description": "Azure Connected Cache service."
    },
    {
      "name": "azure_solutions",
      "description": "Azure Solutions service."
    },
    {
      "name": "azure_production_ready_database",
      "description": "Azure Production Ready Database service."
    },
    {
      "name": "azure_private_link_service",
      "description": "Azure Private Link Service service."
    },
    {
      "name": "azure_service_catalog_mad",
      "description": "Azure Service Catalog Mad service."
    },
    {
      "name": "azure_education",
      "description": "Azure Education service."
    },
    {
      "name": "azure_subnet",
      "description": "Azure Subnet service."
    },
    {
      "name": "azure_kubernetes_services",
      "description": "Azure Kubernetes Services service."
    },
    {
      "name": "azure_industrial_iot",
      "description": "A service for industrial IoT solutions and data integration."
    },
    {
      "name": "azure_hd_insight_clusters",
      "description": "Azure Hd Insight Clusters service."
    },
    {
      "name": "azure_quickstart_center",
      "description": "Azure Quickstart Center service."
    },
    {
      "name": "azure_resource_guard",
      "description": "Azure Resource Guard service."
    },
    {
      "name": "azure_availability_sets",
      "description": "Azure Availability Sets service."
    },
    {
      "name": "azure_web_application_firewall_policies(waf)",
      "description": "Azure Web Application Firewall Policies(Waf) service."
    },
    {
      "name": "azure_entra_domain_services",
      "description": "Azure Entra Domain Services service."
    },
    {
      "name": "azure_azure_stack_edge",
      "description": "Azure Azure Stack Edge service."
    },
    {
      "name": "azure_verification_as_a_service",
      "description": "Azure Verification As A Service service."
    },
    {
      "name": "azure_azure_vmware_solution",
      "description": "Azure Azure Vmware Solution service."
    },
    {
      "name": "azure_powershell",
      "description": "Azure Powershell service."
    },
    {
      "name": "azure_azure_database_postgresql_server_group",
      "description": "Azure Azure Database Postgresql Server Group service."
    },
    {
      "name": "azure_template_specs",
      "description": "Azure Template Specs service."
    },
    {
      "name": "azure_virtual_networks",
      "description": "Azure Virtual Networks service."
    },
    {
      "name": "azure_azure_a",
      "description": "Azure Azure A service."
    },
    {
      "name": "azure_identity_governance",
      "description": "Azure Identity Governance service."
    },
    {
      "name": "azure_server_farm",
      "description": "Azure Server Farm service."
    },
    {
      "name": "azure_azure_stack_hci_sizer",
      "description": "Azure Azure Stack Hci Sizer service."
    },
    {
      "name": "azure_help_and_support",
      "description": "Azure Help And Support service."
    },
    {
      "name": "azure_azure_network_function_manager_functions",
      "description": "Azure Azure Network Function Manager Functions service."
    },
    {
      "name": "azure_azure_programmable_connectivity",
      "description": "Azure Azure Programmable Connectivity service."
    },
    {
      "name": "azure_cost_management_and_billing",
      "description": "Azure Cost Management And Billing service."
    },
    {
      "name": "azure_heart",
      "description": "Azure Heart service."
    },
    {
      "name": "azure_defender_slot",
      "description": "Azure Defender Slot service."
    },
    {
      "name": "azure_log_streaming",
      "description": "Azure Log Streaming service."
    },
    {
      "name": "azure_cost_management",
      "description": "A service for managing and optimizing Azure spending."
    },
    {
      "name": "azure_user_settings",
      "description": "Azure User Settings service."
    },
    {
      "name": "azure_peering_service",
      "description": "Azure Peering Service service."
    },
    {
      "name": "azure_azure_spring_apps",
      "description": "Azure Azure Spring Apps service."
    },
    {
      "name": "azure_dns_private_resolver",
      "description": "Azure Dns Private Resolver service."
    },
    {
      "name": "azure_azure_sql_edge",
      "description": "Azure Azure Sql Edge service."
    },
    {
      "name": "azure_defender_web_guiding_system",
      "description": "Azure Defender Web Guiding System service."
    },
    {
      "name": "azure_maintenance_configuration",
      "description": "Azure Maintenance Configuration service."
    },
    {
      "name": "azure_automation_accounts",
      "description": "Azure Automation Accounts service."
    },
    {
      "name": "azure_marketplace_management",
      "description": "Azure Marketplace Management service."
    },
    {
      "name": "azure_app_services",
      "description": "Azure App Services service."
    },
    {
      "name": "azure_azure_netapp_files",
      "description": "Azure Azure Netapp Files service."
    },
    {
      "name": "azure_genomics_accounts",
      "description": "Azure Genomics Accounts service."
    },
    {
      "name": "azure_azure_deployment_environments",
      "description": "Azure Azure Deployment Environments service."
    },
    {
      "name": "azure_cost_analysis",
      "description": "Azure Cost Analysis service."
    },
    {
      "name": "azure_defender_cm_local_manager",
      "description": "Azure Defender Cm Local Manager service."
    },
    {
      "name": "azure_device_security_apple",
      "description": "Azure Device Security Apple service."
    },
    {
      "name": "azure_journey_hub",
      "description": "Azure Journey Hub service."
    },
    {
      "name": "azure_intune_for_education",
      "description": "Azure Intune For Education service."
    },
    {
      "name": "azure_windows_notification_services",
      "description": "Azure Windows Notification Services service."
    },
    {
      "name": "azure_iot_edge",
      "description": "Azure Iot Edge service."
    },
    {
      "name": "azure_device_configuration",
      "description": "Azure Device Configuration service."
    },
    {
      "name": "azure_event_grid_domains",
      "description": "Azure Event Grid Domains service."
    },
    {
      "name": "azure_on_premises_data_gateways",
      "description": "Azure On Premises Data Gateways service."
    },
    {
      "name": "azure_host_groups",
      "description": "Azure Host Groups service."
    },
    {
      "name": "azure_outbound_connection",
      "description": "Azure Outbound Connection service."
    },
    {
      "name": "azure_defender_industrial_printer",
      "description": "Azure Defender Industrial Printer service."
    },
    {
      "name": "azure_region_management",
      "description": "Azure Region Management service."
    },
    {
      "name": "azure_ceres",
      "description": "Azure Ceres service."
    },
    {
      "name": "azure_private_link",
      "description": "Azure Private Link service."
    },
    {
      "name": "azure_diagnostics_settings",
      "description": "Azure Diagnostics Settings service."
    },
    {
      "name": "azure_batch_accounts",
      "description": "Azure Batch Accounts service."
    },
    {
      "name": "azure_savings_plans",
      "description": "Azure Savings Plans service."
    },
    {
      "name": "azure_spot_vmss",
      "description": "Azure Spot Vmss service."
    },
    {
      "name": "azure_service_endpoint_policies",
      "description": "Azure Service Endpoint Policies service."
    },
    {
      "name": "azure_administrative_units",
      "description": "Azure Administrative Units service."
    },
    {
      "name": "azure_azure_applied_ai_services",
      "description": "Azure Azure Applied Ai Services service."
    },
    {
      "name": "azure_defender_plc",
      "description": "Azure Defender Plc service."
    },
    {
      "name": "azure_arc_kubernetes",
      "description": "Azure Arc Kubernetes service."
    },
    {
      "name": "azure_data_lake_storage_gen1",
      "description": "Azure Data Lake Storage Gen1 service."
    },
    {
      "name": "azure_management_portal",
      "description": "Azure Management Portal service."
    },
    {
      "name": "azure_event_hub_clusters",
      "description": "Azure Event Hub Clusters service."
    },
    {
      "name": "azure_service_fabric_clusters",
      "description": "Azure Service Fabric Clusters service."
    },
    {
      "name": "azure_computer_vision",
      "description": "A service for analyzing and understanding images and videos."
    },
    {
      "name": "azure_instance_pools",
      "description": "Azure Instance Pools service."
    },
    {
      "name": "azure_local_network_gateways",
      "description": "Azure Local Network Gateways service."
    },
    {
      "name": "azure_extendedsecurityupdates",
      "description": "Azure Extendedsecurityupdates service."
    },
    {
      "name": "azure_edge_management",
      "description": "Azure Edge Management service."
    },
    {
      "name": "azure_key_vaults",
      "description": "Azure Key Vaults service."
    },
    {
      "name": "azure_relays",
      "description": "Azure Relays service."
    },
    {
      "name": "azure_controls",
      "description": "Azure Controls service."
    },
    {
      "name": "azure_multi_factor_authentication",
      "description": "Azure Multi Factor Authentication service."
    },
    {
      "name": "azure_managed_identities",
      "description": "Azure Managed Identities service."
    },
    {
      "name": "azure_bastions",
      "description": "Azure Bastions service."
    },
    {
      "name": "azure_media",
      "description": "Azure Media service."
    },
    {
      "name": "azure_application_group",
      "description": "Azure Application Group service."
    },
    {
      "name": "azure_vpnclientwindows",
      "description": "Azure Vpnclientwindows service."
    },
    {
      "name": "azure_device_enrollment",
      "description": "Azure Device Enrollment service."
    },
    {
      "name": "azure_container_instances",
      "description": "A service for running containers without managing servers."
    },
    {
      "name": "azure_managed_desktop",
      "description": "Azure Managed Desktop service."
    },
    {
      "name": "azure_azure_storage_mover",
      "description": "Azure Azure Storage Mover service."
    },
    {
      "name": "azure_vm_images_(classic)",
      "description": "Azure Vm Images (Classic) service."
    },
    {
      "name": "azure_azure_chaos_studio",
      "description": "Azure Azure Chaos Studio service."
    },
    {
      "name": "azure_integration_environments",
      "description": "Azure Integration Environments service."
    },
    {
      "name": "azure_elastic_job_agents",
      "description": "Azure Elastic Job Agents service."
    },
    {
      "name": "azure_logic_apps_custom_connector",
      "description": "Azure Logic Apps Custom Connector service."
    },
    {
      "name": "azure_host_pools",
      "description": "Azure Host Pools service."
    },
    {
      "name": "azure_activity_log",
      "description": "Azure Activity Log service."
    },
    {
      "name": "azure_load_balancer_hub",
      "description": "Azure Load Balancer Hub service."
    },
    {
      "name": "azure_api_center",
      "description": "Azure Api Center service."
    },
    {
      "name": "azure_feature_previews",
      "description": "Azure Feature Previews service."
    },
    {
      "name": "azure_update_management_center",
      "description": "Azure Update Management Center service."
    },
    {
      "name": "azure_azure_sentinel",
      "description": "Azure Azure Sentinel service."
    },
    {
      "name": "azure_resource_explorer",
      "description": "Azure Resource Explorer service."
    },
    {
      "name": "azure_reserved_ip_addresses_(classic)",
      "description": "Azure Reserved Ip Addresses (Classic) service."
    },
    {
      "name": "azure_automanaged_vm",
      "description": "A service for managing virtual machines with automated configurations."
    },
    {
      "name": "azure_elastic_san",
      "description": "Azure Elastic San service."
    },
    {
      "name": "azure_azure_fileshares",
      "description": "Azure Azure Fileshares service."
    },
    {
      "name": "azure_learn",
      "description": "Azure Learn service."
    },
    {
      "name": "azure_intune_app_protection",
      "description": "Azure Intune App Protection service."
    },
    {
      "name": "azure_managed_file_shares",
      "description": "Azure Managed File Shares service."
    },
    {
      "name": "azure_tenant_status",
      "description": "Azure Tenant Status service."
    },
    {
      "name": "azure_controls_horizontal",
      "description": "Azure Controls Horizontal service."
    },
    {
      "name": "azure_container_apps_environments",
      "description": "Azure Container Apps Environments service."
    },
    {
      "name": "azure_private_link_services",
      "description": "Azure Private Link Services service."
    },
    {
      "name": "azure_data_lake_store_gen1",
      "description": "Azure Data Lake Store Gen1 service."
    },
    {
      "name": "azure_defender_engineering_station",
      "description": "Azure Defender Engineering Station service."
    },
    {
      "name": "azure_azure_operator_nexus",
      "description": "Azure Azure Operator Nexus service."
    },
    {
      "name": "azure_web_app_+_database",
      "description": "Azure Web App + Database service."
    },
    {
      "name": "azure_image_templates",
      "description": "Azure Image Templates service."
    },
    {
      "name": "azure_cognitive_services_decisions",
      "description": "Azure Cognitive Services Decisions service."
    },
    {
      "name": "azure_applens",
      "description": "Azure Applens service."
    },
    {
      "name": "azure_devops_starter",
      "description": "Azure Devops Starter service."
    },
    {
      "name": "azure_arc_postgresql ",
      "description": "Azure Arc Postgresql  service."
    },
    {
      "name": "azure_conditional_access",
      "description": "Azure Conditional Access service."
    },
    {
      "name": "azure_app_compliance_automation",
      "description": "Azure App Compliance Automation service."
    },
    {
      "name": "azure_azure_operator_service_manager",
      "description": "Azure Azure Operator Service Manager service."
    },
    {
      "name": "azure_machine_learning_studio_(classic)_web_services",
      "description": "Azure Machine Learning Studio (Classic) Web Services service."
    },
    {
      "name": "azure_icm_troubleshooting",
      "description": "Azure Icm Troubleshooting service."
    },
    {
      "name": "azure_power_up",
      "description": "Azure Power Up service."
    },
    {
      "name": "azure_metrics_advisor",
      "description": "A service for monitoring and diagnosing metrics anomalies."
    },
    {
      "name": "azure_digital_twins",
      "description": "Azure Digital Twins service."
    },
    {
      "name": "azure_log_analytics_workspaces",
      "description": "Azure Log Analytics Workspaces service."
    },
    {
      "name": "azure_defender_historian",
      "description": "Azure Defender Historian service."
    },
    {
      "name": "azure_module",
      "description": "Azure Module service."
    },
    {
      "name": "azure_azure_cosmos_db",
      "description": "Azure Azure Cosmos Db service."
    },
    {
      "name": "azure_confidential_ledgers",
      "description": "Azure Confidential Ledgers service."
    },
    {
      "name": "azure_ddos_protection_plans",
      "description": "Azure Ddos Protection Plans service."
    },
    {
      "name": "azure_content_moderators",
      "description": "Azure Content Moderators service."
    },
    {
      "name": "azure_breeze",
      "description": "Azure Breeze service."
    },
    {
      "name": "azure_mobile_networks",
      "description": "Azure Mobile Networks service."
    },
    {
      "name": "azure_error",
      "description": "Azure Error service."
    },
    {
      "name": "azure_gear",
      "description": "Azure Gear service."
    },
    {
      "name": "azure_app_space",
      "description": "Azure App Space service."
    },
    {
      "name": "azure_website_staging",
      "description": "Azure Website Staging service."
    },
    {
      "name": "azure_offers",
      "description": "Azure Offers service."
    },
    {
      "name": "azure_azure_video_indexer",
      "description": "Azure Azure Video Indexer service."
    },
    {
      "name": "azure_backup_vault",
      "description": "A storage vault for securing backup data in Azure."
    },
    {
      "name": "azure_azure_data_catalog",
      "description": "Azure Azure Data Catalog service."
    },
    {
      "name": "azure_storage_queue",
      "description": "Azure Storage Queue service."
    },
    {
      "name": "azure_azure_orbital",
      "description": "Azure Azure Orbital service."
    },
    {
      "name": "azure_metrics",
      "description": "Azure Metrics service."
    },
    {
      "name": "azure_azure_monitors_for_sap_solutions",
      "description": "Azure Azure Monitors For Sap Solutions service."
    },
    {
      "name": "azure_application_security_groups",
      "description": "Azure Application Security Groups service."
    },
    {
      "name": "azure_azure_load_testing",
      "description": "Azure Azure Load Testing service."
    },
    {
      "name": "azure_azure_communication_services",
      "description": "Azure Azure Communication Services service."
    },
    {
      "name": "azure_storage_azure_files",
      "description": "Azure Storage Azure Files service."
    },
    {
      "name": "azure_sql_elastic_pools",
      "description": "Azure Sql Elastic Pools service."
    },
    {
      "name": "azure_anomaly_detector",
      "description": "A service for detecting anomalies in time-series data."
    },
    {
      "name": "azure_language_understanding",
      "description": "Azure Language Understanding service."
    },
    {
      "name": "azure_analysis_services",
      "description": "Azure Analysis Services service."
    },
    {
      "name": "azure_mindaro",
      "description": "Azure Mindaro service."
    },
    {
      "name": "azure_branch",
      "description": "Azure Branch service."
    },
    {
      "name": "azure_dev_console",
      "description": "Azure Dev Console service."
    },
    {
      "name": "azure_custom_vision",
      "description": "Azure Custom Vision service."
    },
    {
      "name": "azure_azure_maps_accounts",
      "description": "Azure Azure Maps Accounts service."
    },
    {
      "name": "azure_partner_namespace",
      "description": "Azure Partner Namespace service."
    },
    {
      "name": "azure_remote_rendering",
      "description": "Azure Remote Rendering service."
    },
    {
      "name": "azure_wac_installer",
      "description": "Azure Wac Installer service."
    },
    {
      "name": "azure_sql_managed_instance",
      "description": "Azure Sql Managed Instance service."
    },
    {
      "name": "azure_monitor",
      "description": "A comprehensive solution for collecting, analyzing, and acting on telemetry from cloud and on-premises environments."
    },
    {
      "name": "azure_atm_multistack",
      "description": "Azure Atm Multistack service."
    },
    {
      "name": "azure_database_instance_for_sap",
      "description": "Azure Database Instance For Sap service."
    },
    {
      "name": "azure_nat",
      "description": "Azure Nat service."
    },
    {
      "name": "azure_dashboard",
      "description": "Azure Dashboard service."
    },
    {
      "name": "azure_tag",
      "description": "Azure Tag service."
    },
    {
      "name": "azure_ip_groups",
      "description": "Azure Ip Groups service."
    },
    {
      "name": "azure_azure_ad_b2c",
      "description": "Azure Azure Ad B2C service."
    },
    {
      "name": "azure_face_apis",
      "description": "Azure Face Apis service."
    },
    {
      "name": "azure_stream_analytics_jobs",
      "description": "Azure Stream Analytics Jobs service."
    },
    {
      "name": "azure_defender_rtu",
      "description": "Azure Defender Rtu service."
    },
    {
      "name": "azure_microsoft_defender_for_iot",
      "description": "A security service for protecting IoT devices in Azure."
    },
    {
      "name": "azure_azure_dev_tunnels",
      "description": "Azure Azure Dev Tunnels service."
    },
    {
      "name": "azure_microsoft_dev_box",
      "description": "Azure Microsoft Dev Box service."
    },
    {
      "name": "azure_data_box",
      "description": "Azure Data Box service."
    },
    {
      "name": "azure_community_images",
      "description": "Azure Community Images service."
    },
    {
      "name": "azure_azure_data_explorer_clusters",
      "description": "Azure Azure Data Explorer Clusters service."
    },
    {
      "name": "azure_logic_apps",
      "description": "A service for automating workflows and integrating apps, data, and services."
    },
    {
      "name": "azure_bug",
      "description": "Azure Bug service."
    },
    {
      "name": "azure_universal_print",
      "description": "Azure Universal Print service."
    },
    {
      "name": "azure_entra_verified_id",
      "description": "Azure Entra Verified Id service."
    },
    {
      "name": "azure_azure_database_mariadb_server",
      "description": "Azure Azure Database Mariadb Server service."
    },
    {
      "name": "azure_storage_accounts_(classic)",
      "description": "Azure Storage Accounts (Classic) service."
    },
    {
      "name": "azure_medtech_service",
      "description": "Azure Medtech Service service."
    },
    {
      "name": "azure_data_collection_rules",
      "description": "Azure Data Collection Rules service."
    },
    {
      "name": "azure_spot_vm",
      "description": "Azure Spot Vm service."
    },
    {
      "name": "azure_workspaces",
      "description": "Azure Workspaces service."
    },
    {
      "name": "azure_network_security_groups",
      "description": "Azure Network Security Groups service."
    },
    {
      "name": "azure_resource_linked",
      "description": "Azure Resource Linked service."
    },
    {
      "name": "azure_power_bi_embedded",
      "description": "Azure Power Bi Embedded service."
    },
    {
      "name": "azure_enterprise_applications",
      "description": "Azure Enterprise Applications service."
    },
    {
      "name": "azure_modular_data_center",
      "description": "Azure Modular Data Center service."
    },
    {
      "name": "azure_time_series_insights_event_sources",
      "description": "Azure Time Series Insights Event Sources service."
    },
    {
      "name": "azure_advisor",
      "description": "A personalized cloud consultant for optimization recommendations."
    },
    {
      "name": "azure_microsoft_defender_easm",
      "description": "Azure Microsoft Defender Easm service."
    },
    {
      "name": "azure_cloud_services_(extended_support)",
      "description": "Azure Cloud Services (Extended Support) service."
    },
    {
      "name": "azure_managed_instance_apache_cassandra",
      "description": "Azure Managed Instance Apache Cassandra service."
    },
    {
      "name": "azure_azure_sql",
      "description": "Azure Azure Sql service."
    },
    {
      "name": "azure_function_apps",
      "description": "Azure Function Apps service."
    },
    {
      "name": "azure_multifactor_authentication",
      "description": "Azure Multifactor Authentication service."
    },
    {
      "name": "azure_table",
      "description": "Azure Table service."
    },
    {
      "name": "azure_defender_freezer_monitor",
      "description": "Azure Defender Freezer Monitor service."
    },
    {
      "name": "azure_sql_server_registries",
      "description": "Azure Sql Server Registries service."
    },
    {
      "name": "azure_app_registrations",
      "description": "Azure App Registrations service."
    },
    {
      "name": "azure_arc_sql_server",
      "description": "Azure Arc Sql Server service."
    },
    {
      "name": "azure_azure_cloud_shell",
      "description": "Azure Azure Cloud Shell service."
    },
    {
      "name": "azure_osconfig",
      "description": "Azure Osconfig service."
    },
    {
      "name": "azure_recovery_services_vaults",
      "description": "Azure Recovery Services Vaults service."
    },
    {
      "name": "azure_free_services",
      "description": "Azure Free Services service."
    },
    {
      "name": "azure_proximity_placement_groups",
      "description": "Azure Proximity Placement Groups service."
    },
    {
      "name": "azure_defender_dcs_controller",
      "description": "Azure Defender Dcs Controller service."
    },
    {
      "name": "azure_microsoft_defender_for_cloud",
      "description": "Azure Microsoft Defender For Cloud service."
    },
    {
      "name": "azure_entra_identity_licenses",
      "description": "Azure Entra Identity Licenses service."
    },
    {
      "name": "azure_disk_encryption_sets",
      "description": "Azure Disk Encryption Sets service."
    },
    {
      "name": "azure_entra_private_access",
      "description": "Azure Entra Private Access service."
    },
    {
      "name": "azure_defender_industrial_scale_system",
      "description": "Azure Defender Industrial Scale System service."
    },
    {
      "name": "azure_disks_snapshots",
      "description": "Azure Disks Snapshots service."
    },
    {
      "name": "azure_backlog",
      "description": "Azure Backlog service."
    },
    {
      "name": "azure_compute_fleet",
      "description": "Azure Compute Fleet service."
    },
    {
      "name": "azure_updates",
      "description": "Azure Updates service."
    },
    {
      "name": "azure_azure_operator_5g_core",
      "description": "Azure Azure Operator 5G Core service."
    },
    {
      "name": "azure_storsimple_device_managers",
      "description": "Azure Storsimple Device Managers service."
    },
    {
      "name": "azure_resource_management_private_link",
      "description": "Azure Resource Management Private Link service."
    },
    {
      "name": "azure_integration_accounts",
      "description": "Azure Integration Accounts service."
    },
    {
      "name": "azure_workspaces",
      "description": "Azure Workspaces service."
    },
    {
      "name": "azure_load_test",
      "description": "Azure Load Test service."
    },
    {
      "name": "azure_multi_tenancy",
      "description": "Azure Multi Tenancy service."
    },
    {
      "name": "azure_hosts",
      "description": "Azure Hosts service."
    },
    {
      "name": "azure_entra_identity_roles_and_administrators",
      "description": "Azure Entra Identity Roles And Administrators service."
    },
    {
      "name": "azure_bonsai",
      "description": "Azure Bonsai service."
    },
    {
      "name": "azure_blueprints",
      "description": "A service for defining and deploying Azure environments."
    },
    {
      "name": "azure_resource_groups",
      "description": "Azure Resource Groups service."
    },
    {
      "name": "azure_external_identities",
      "description": "Azure External Identities service."
    },
    {
      "name": "azure_data_lake_analytics",
      "description": "Azure Data Lake Analytics service."
    },
    {
      "name": "azure_azure_hcp_cache",
      "description": "Azure Azure Hcp Cache service."
    },
    {
      "name": "azure_service_health",
      "description": "A service for tracking the status of Azure services."
    },
    {
      "name": "azure_azure_arc",
      "description": "Azure Azure Arc service."
    },
    {
      "name": "azure_entra_id_protection",
      "description": "Azure Entra Id Protection service."
    },
    {
      "name": "azure_azure_firewall_manager",
      "description": "Azure Azure Firewall Manager service."
    },
    {
      "name": "azure_bot_services",
      "description": "Azure Bot Services service."
    },
    {
      "name": "azure_azure_sql_vm",
      "description": "Azure Azure Sql Vm service."
    },
    {
      "name": "azure_route_filters",
      "description": "Azure Route Filters service."
    },
    {
      "name": "azure_active_directory_connect_health",
      "description": "Azure Active Directory Connect Health service."
    },
    {
      "name": "azure_test_base",
      "description": "Azure Test Base service."
    },
    {
      "name": "azure_public_ip_prefixes",
      "description": "Azure Public Ip Prefixes service."
    },
    {
      "name": "azure_intune",
      "description": "Azure Intune service."
    },
    {
      "name": "azure_virtual_clusters",
      "description": "Azure Virtual Clusters service."
    },
    {
      "name": "azure_spatial_anchor_accounts",
      "description": "Azure Spatial Anchor Accounts service."
    },
    {
      "name": "azure_azure_information_protection",
      "description": "Azure Azure Information Protection service."
    },
    {
      "name": "azure_workflow",
      "description": "Azure Workflow service."
    },
    {
      "name": "azure_reservations",
      "description": "Azure Reservations service."
    },
    {
      "name": "azure_sql_server",
      "description": "Azure Sql Server service."
    },
    {
      "name": "azure_scheduler",
      "description": "Azure Scheduler service."
    },
    {
      "name": "azure_managed_database",
      "description": "Azure Managed Database service."
    },
    {
      "name": "azure_collaborative_service",
      "description": "Azure Collaborative Service service."
    },
    {
      "name": "azure_virtual_enclaves",
      "description": "Azure Virtual Enclaves service."
    },
    {
      "name": "azure_azureattestation",
      "description": "Azure Azureattestation service."
    },
    {
      "name": "azure_builds",
      "description": "Azure Builds service."
    },
    {
      "name": "azure_power",
      "description": "Azure Power service."
    },
    {
      "name": "azure_lab_accounts",
      "description": "Azure Lab Accounts service."
    },
    {
      "name": "azure_compliance",
      "description": "Azure Compliance service."
    },
    {
      "name": "azure_avs_vm",
      "description": "A service for running VMware virtual machines natively on Azure."
    },
    {
      "name": "azure_azure_token_service",
      "description": "Azure Azure Token Service service."
    },
    {
      "name": "azure_genomics",
      "description": "Azure Genomics service."
    },
    {
      "name": "azure_cognitive_services",
      "description": "A set of AI services for building intelligent applications."
    },
    {
      "name": "azure_cache",
      "description": "Azure Cache service."
    },
    {
      "name": "azure_my_customers",
      "description": "Azure My Customers service."
    },
    {
      "name": "azure_defender_industrial_packaging_system",
      "description": "Azure Defender Industrial Packaging System service."
    },
    {
      "name": "azure_disk_pool",
      "description": "Azure Disk Pool service."
    },
    {
      "name": "azure_system_topic",
      "description": "A feature within Azure Event Grid for system-level event management."
    },
    {
      "name": "azure_virtual_instance_for_sap",
      "description": "Azure Virtual Instance For Sap service."
    },
    {
      "name": "azure_entra_identity_risky_users",
      "description": "Azure Entra Identity Risky Users service."
    },
    {
      "name": "azure_globe_error",
      "description": "Azure Globe Error service."
    },
    {
      "name": "azure_hdi_aks_cluster",
      "description": "Azure Hdi Aks Cluster service."
    },
    {
      "name": "azure_fiji",
      "description": "Azure Fiji service."
    },
    {
      "name": "azure_virtual_networks_(classic)",
      "description": "Azure Virtual Networks (Classic) service."
    },
    {
      "name": "azure_bare_metal_infrastructure",
      "description": "Azure Bare Metal Infrastructure service."
    },
    {
      "name": "azure_all_resources",
      "description": "Azure All Resources service."
    },
    {
      "name": "azure_capacity",
      "description": "Azure Capacity service."
    },
    {
      "name": "azure_monitor_health_models",
      "description": "Azure Monitor Health Models service."
    },
    {
      "name": "azure_data_factories",
      "description": "Azure Data Factories service."
    },
    {
      "name": "azure_container_registries",
      "description": "Azure Container Registries service."
    },
    {
      "name": "azure_power_platform",
      "description": "Azure Power Platform service."
    },
    {
      "name": "azure_groups",
      "description": "Azure Groups service."
    },
    {
      "name": "azure_browser",
      "description": "Azure Browser service."
    },
    {
      "name": "azure_images",
      "description": "Azure Images service."
    },
    {
      "name": "azure_storage_container",
      "description": "Azure Storage Container service."
    },
    {
      "name": "azure_management_groups",
      "description": "Azure Management Groups service."
    },
    {
      "name": "azure_wac",
      "description": "Azure Wac service."
    },
    {
      "name": "azure_launch_portal",
      "description": "Azure Launch Portal service."
    },
    {
      "name": "azure_ftp",
      "description": "Azure Ftp service."
    },
    {
      "name": "azure_entra_managed_identities",
      "description": "Azure Entra Managed Identities service."
    },
    {
      "name": "azure_azure_network_function_manager",
      "description": "Azure Azure Network Function Manager service."
    },
    {
      "name": "azure_entra_connect_sync",
      "description": "Azure Entra Connect Sync service."
    },
    {
      "name": "azure_machinesazurearc",
      "description": "Azure Machinesazurearc service."
    },
    {
      "name": "azure_identity_secure_score",
      "description": "Azure Identity Secure Score service."
    },
    {
      "name": "azure_plans",
      "description": "Azure Plans service."
    },
    {
      "name": "azure_software_updates",
      "description": "Azure Software Updates service."
    },
    {
      "name": "azure_user_privacy",
      "description": "Azure User Privacy service."
    },
    {
      "name": "azure_aks_istio",
      "description": "Azure Aks Istio service."
    },
    {
      "name": "azure_azure_sphere",
      "description": "Azure Azure Sphere service."
    },
    {
      "name": "azure_translator_text",
      "description": "Azure Translator Text service."
    },
    {
      "name": "azure_subscriptions",
      "description": "Azure Subscriptions service."
    },
    {
      "name": "azure_web_jobs",
      "description": "Azure Web Jobs service."
    },
    {
      "name": "azure_api_management_services",
      "description": "Azure Api Management Services service."
    },
    {
      "name": "azure_defender_robot_controller",
      "description": "Azure Defender Robot Controller service."
    },
    {
      "name": "azure_azure_consumption_commitment",
      "description": "Azure Azure Consumption Commitment service."
    },
    {
      "name": "azure_service_providers",
      "description": "Azure Service Providers service."
    },
    {
      "name": "azure_aquila",
      "description": "Azure Aquila service."
    },
    {
      "name": "azure_globe_warning",
      "description": "Azure Globe Warning service."
    },
    {
      "name": "azure_defender_pneumatic_device",
      "description": "Azure Defender Pneumatic Device service."
    },
    {
      "name": "azure_azure_compute_galleries",
      "description": "Azure Azure Compute Galleries service."
    },
    {
      "name": "azure_kubernetes_fleet_manager",
      "description": "Azure Kubernetes Fleet Manager service."
    },
    {
      "name": "azure_azure_red_hat_openshift",
      "description": "Azure Azure Red Hat Openshift service."
    },
    {
      "name": "azure_immersive_readers",
      "description": "Azure Immersive Readers service."
    },
    {
      "name": "azure_device_security_windows",
      "description": "Azure Device Security Windows service."
    },
    {
      "name": "azure_rtos",
      "description": "Azure Rtos service."
    },
    {
      "name": "azure_dashboard_hub",
      "description": "Azure Dashboard Hub service."
    },
    {
      "name": "azure_web_slots",
      "description": "Azure Web Slots service."
    },
    {
      "name": "azure_external_id",
      "description": "Azure External Id service."
    },
    {
      "name": "azure_device_security_google",
      "description": "Azure Device Security Google service."
    },
    {
      "name": "azure_internet_analyzer_profiles",
      "description": "Azure Internet Analyzer Profiles service."
    },
    {
      "name": "azure_app_service_environments",
      "description": "Azure App Service Environments service."
    },
    {
      "name": "azure_cache_redis",
      "description": "Azure Cache Redis service."
    },
    {
      "name": "azure_virtual_machine",
      "description": "Azure Virtual Machine service."
    },
    {
      "name": "azure_policy",
      "description": "A service for enforcing governance and compliance policies."
    },
    {
      "name": "azure_blob_block",
      "description": "Azure Blob Block service."
    },
    {
      "name": "azure_information",
      "description": "Azure Information service."
    },
    {
      "name": "azure_guide",
      "description": "Azure Guide service."
    },
    {
      "name": "azure_compliance_center",
      "description": "Azure Compliance Center service."
    },
    {
      "name": "azure_cost_alerts",
      "description": "Azure Cost Alerts service."
    },
    {
      "name": "azure_partner_topic",
      "description": "Azure Partner Topic service."
    },
    {
      "name": "azure_virtual_network_gateways",
      "description": "Azure Virtual Network Gateways service."
    },
    {
      "name": "azure_operation_log_(classic)",
      "description": "Azure Operation Log (Classic) service."
    },
    {
      "name": "azure_app_service_certificates",
      "description": "Azure App Service Certificates service."
    },
    {
      "name": "azure_data_shares",
      "description": "Azure Data Shares service."
    },
    {
      "name": "azure_dns_multistack",
      "description": "Azure Dns Multistack service."
    },
    {
      "name": "azure_defender_sensor",
      "description": "Azure Defender Sensor service."
    },
    {
      "name": "azure_tenant_properties",
      "description": "Azure Tenant Properties service."
    },
    {
      "name": "azure_cdn_profiles",
      "description": "Azure Cdn Profiles service."
    },
    {
      "name": "azure_app_space_component",
      "description": "Azure App Space Component service."
    },
    {
      "name": "azure_sql_data_warehouses",
      "description": "Azure Sql Data Warehouses service."
    },
    {
      "name": "azure_log_analytics_query_pack",
      "description": "Azure Log Analytics Query Pack service."
    },
    {
      "name": "azure_route_tables",
      "description": "Azure Route Tables service."
    },
    {
      "name": "azure_mesh_applications",
      "description": "Azure Mesh Applications service."
    },
    {
      "name": "azure_scvmm_management_servers",
      "description": "A service for managing SCVMM servers in Azure."
    },
    {
      "name": "azure_network_watcher",
      "description": "A tool for monitoring and diagnosing network performance."
    },
    {
      "name": "azure_shared_image_galleries",
      "description": "Azure Shared Image Galleries service."
    },
    {
      "name": "azure_cognitive_search",
      "description": "Azure Cognitive Search service."
    },
    {
      "name": "azure_process_explorer",
      "description": "Azure Process Explorer service."
    },
    {
      "name": "azure_personalizers",
      "description": "Azure Personalizers service."
    },
    {
      "name": "azure_cost_budgets",
      "description": "Azure Cost Budgets service."
    },
    {
      "name": "azure_toolbox",
      "description": "Azure Toolbox service."
    },
    {
      "name": "azure_cloud_services_(classic)",
      "description": "Azure Cloud Services (Classic) service."
    },
    {
      "name": "azure_vm_app_definitions",
      "description": "Azure Vm App Definitions service."
    },
    {
      "name": "azure_tags",
      "description": "Azure Tags service."
    },
    {
      "name": "azure_azure_stack",
      "description": "Azure Azure Stack service."
    },
    {
      "name": "azure_azure_database_postgresql_server",
      "description": "Azure Azure Database Postgresql Server service."
    },
    {
      "name": "azure_ssh_keys",
      "description": "Azure Ssh Keys service."
    },
    {
      "name": "azure_azure_operator_insights",
      "description": "Azure Azure Operator Insights service."
    },
    {
      "name": "azure_workbooks",
      "description": "Azure Workbooks service."
    },
    {
      "name": "azure_sql_database_fleet_manager",
      "description": "Azure Sql Database Fleet Manager service."
    },
    {
      "name": "azure_azure_managed_grafana",
      "description": "Azure Azure Managed Grafana service."
    },
    {
      "name": "azure_defender_distributer_control_system",
      "description": "Azure Defender Distributer Control System service."
    },
    {
      "name": "azure_sql_database",
      "description": "Azure Sql Database service."
    },
    {
      "name": "azure_azure_sustainability",
      "description": "Azure Azure Sustainability service."
    },
    {
      "name": "azure_templates",
      "description": "Azure Templates service."
    },
    {
      "name": "azure_infrastructure_backup",
      "description": "Azure Infrastructure Backup service."
    },
    {
      "name": "azure_managed_applications_center",
      "description": "Azure Managed Applications Center service."
    },
    {
      "name": "azure_azure_devops",
      "description": "Azure Azure Devops service."
    },
    {
      "name": "azure_code",
      "description": "Azure Code service."
    },
    {
      "name": "azure_azure_databox_gateway",
      "description": "Azure Azure Databox Gateway service."
    },
    {
      "name": "azure_worker_container_app",
      "description": "Azure Worker Container App service."
    },
    {
      "name": "azure_static_apps",
      "description": "Azure Static Apps service."
    },
    {
      "name": "azure_entra_global_secure_access",
      "description": "Azure Entra Global Secure Access service."
    },
    {
      "name": "azure_defender_meter",
      "description": "Azure Defender Meter service."
    },
    {
      "name": "azure_device_compliance",
      "description": "Azure Device Compliance service."
    },
    {
      "name": "azure_azure_openai",
      "description": "Azure Azure Openai service."
    },
    {
      "name": "azure_verifiable_credentials",
      "description": "Azure Verifiable Credentials service."
    },
    {
      "name": "azure_targets_management",
      "description": "Azure Targets Management service."
    },
    {
      "name": "azure_change_analysis",
      "description": "Azure Change Analysis service."
    },
    {
      "name": "azure_commit",
      "description": "Azure Commit service."
    },
    {
      "name": "azure_load_testing",
      "description": "Azure Load Testing service."
    },
    {
      "name": "azure_content_safety",
      "description": "Azure Content Safety service."
    },
    {
      "name": "azure_virtual_visits_builder",
      "description": "Azure Virtual Visits Builder service."
    },
    {
      "name": "azure_resource_mover",
      "description": "Azure Resource Mover service."
    },
    {
      "name": "azure_abs_member",
      "description": "Azure Abs Member service."
    },
    {
      "name": "azure_disks",
      "description": "Azure Disks service."
    },
    {
      "name": "azure_import_export_jobs",
      "description": "Azure Import Export Jobs service."
    },
    {
      "name": "azure_azure_virtual_desktop",
      "description": "Azure Azure Virtual Desktop service."
    },
    {
      "name": "azure_defender_marquee",
      "description": "Azure Defender Marquee service."
    },
    {
      "name": "azure_vm_scale_sets",
      "description": "Azure Vm Scale Sets service."
    },
    {
      "name": "azure_devtest_labs",
      "description": "Azure Devtest Labs service."
    },
    {
      "name": "azure_ebooks",
      "description": "Azure Ebooks service."
    }
  ],
  "network": [
      {
        "name": "network_traffic_manager",
        "description": "Ork Network Traffic Manager Network."
      },
      {
        "name": "network_firewall",
        "description": "Network firewall for filtering and monitoring network traffic and enforcing security policies."
      },
      {
        "name": "network_ddos_protection",
        "description": "Ork Network Ddos Protection Network."
      },
      {
        "name": "network_router",
        "description": "Ork Network Router Network."
      },
      {
        "name": "network_security_svgrepo_com",
        "description": "Ork Network Security Svgrepo Com Network."
      },
      {
        "name": "network_switch",
        "description": "Ork Network Switch Network."
      },
      {
        "name": "network_load_testing",
        "description": "Ork Network Load Testing Network."
      },
      {
        "name": "network_api_management",
        "description": "Ork Network Api Management Network."
      },
      {
        "name": "network_dns",
        "description": "Ork Network Dns Network."
      },
      {
        "name": "network_subnet",
        "description": "Ork Network Subnet Network."
      },
      {
        "name": "network_waf",
        "description": "Ork Network Waf Network."
      },
      {
        "name": "network_internet",
        "description": "Ork Network Internet Network."
      },
      {
        "name": "network_vpn",
        "description": "Ork Network Vpn Network."
      },
      {
        "name": "network_virtual_network",
        "description": "Ork Network Virtual Network Network."
      },
      {
        "name": "network_cdn",
        "description": "Ork Network Cdn Network."
      },
      {
        "name": "network_service_mesh",
        "description": "Ork Network Service Mesh Network."
      }
    ],
    "default": {
      "application": "application_service",
      "aws": "aws_service",
      "gcp": "gcp_service",
      "azure": "azure_service",
      "network": "network",
      "client": "client"
    }
  }