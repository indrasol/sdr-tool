
import { ToolbarItem } from './ToolbarTypes';
import {
  Search, Square, LayoutGrid, Circle, Type,
  Database, Cloud, Server, Folder, File, Settings,
  Users, Shield, Network as NetworkIcon, Code, Lock, Globe,
  HardDrive, Cpu, Layers, GitBranch, Terminal,
  Key, Zap, Smartphone, Tablet, Router,
  MonitorSmartphone, Workflow, Boxes, BookOpen,
  ArrowUpRight, ArrowDownLeft, User, ChevronDown, ChevronUp,
  // Additional icons for architecture and cloud
  CloudCog, CloudLightning, Warehouse, Factory, Building,
  Landmark, Castle, House, MapPin, Compass, Earth,
  ServerCrash, ServerOff, Scale, Satellite,
  Share2, Signal, Store, Truck, Upload, Download,
  Webcam, Wifi, Wrench, TreePine, TreeDeciduous, Mountain,
  ScanLine, Radio, Radar, PanelLeft, PanelRight, Package,
  Microchip, MessageSquare, Map, Mail, Laptop, LampDesk,
  Activity, AlertTriangle, AlignCenter, AlignJustify, AlignLeft,
  Anchor, AppWindow, Archive, ArrowRightLeft, Asterisk,
  AtSign, Barcode, Bell, BellRing, Binary, Bluetooth,
  Bomb, Braces, Brain, Briefcase, Bus, Calculator,
  CalendarDays, Camera, Coins, ChevronRightSquare, CircuitBoard,
  Cog, Component, Container, CreditCard, Crosshair,
  // Additional AWS specific icons
  ExternalLink, FileCode, FileText, FileJson, Gauge,
  GitPullRequest, Hammer, HardHat, Headphones, HeartPulse,
  Home, Infinity, Lightbulb, LineChart, Link,
  ListChecks, LocateFixed, Mailbox, Maximize,
  Minimize, Monitor, Pencil, PhoneCall, Pipette,
  Play, Power, Printer, QrCode, Receipt,
  Repeat, Save, Scissors, ScrollText, Send,
  ServerIcon, Share, ShieldAlert, ShieldCheck, ShieldQuestion,
  Shuffle, SplineIcon, StickyNote, Table, Tag,
  Trash, TrendingUp, Triangle, UndoDot, Unlink,
  Unlock, Video, Volume, Wallet, Wand2,
  WebhookIcon,
  Globe2,
  LayoutDashboard,
  Network,
  TrafficCone,
  KeyRound,
  KeySquare,
  Code2,
  HardDriveDownload,
  FolderSearch2,
  MessageSquareCode,
  Plug,
  MonitorDot,
  Rocket,
  BarChart3,
  Webhook,
  ClipboardList,
  Settings2,
  LayoutList,
  FolderKanban,
  FileBarChart,
  MessageCircleCode,
  RefreshCw,
  LogOut,
  LockKeyhole,
  ServerCog,
  CloudDrizzle
} from 'lucide-react';

// export const toolbarItems: ToolbarItem[] = [
// AWS Compute
// { icon: Server, label: 'EC2 Instance', category: 'Compute', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['server', 'virtual machine'] },
// { icon: Scale, label: 'EC2 Auto Scaling', category: 'Compute', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['scaling', 'auto scaling'] },
// { icon: Layers, label: 'Elastic Beanstalk', category: 'Compute', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['paas', 'platform'] },
// { icon: Container, label: 'ECS', category: 'Containers', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['container', 'docker'] },
// { icon: Boxes, label: 'EKS', category: 'Containers', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['kubernetes', 'k8s'] },
// { icon: Cpu, label: 'Lambda', category: 'Serverless', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['serverless', 'function'] },
// { icon: Maximize, label: 'Fargate', category: 'Containers', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['serverless', 'container'] },
// { icon: MessageSquare, label: 'SES', category: 'Messaging', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['email', 'messaging'] },

// // AWS Storage
// { icon: Folder, label: 'S3', category: 'Storage', color: 'white', bgColor: '#5DA93C', provider: 'AWS', tags: ['storage', 'object'] },
// { icon: HardDrive, label: 'EBS', category: 'Storage', color: 'white', bgColor: '#5DA93C', provider: 'AWS', tags: ['storage', 'block'] },
// { icon: Archive, label: 'EFS', category: 'Storage', color: 'white', bgColor: '#5DA93C', provider: 'AWS', tags: ['storage', 'file'] },
// { icon: Folder, label: 'S3 Glacier', category: 'Storage', color: 'white', bgColor: '#5DA93C', provider: 'AWS', tags: ['storage', 'archive'] },
// { icon: Database, label: 'Storage Gateway', category: 'Storage', color: 'white', bgColor: '#5DA93C', provider: 'AWS', tags: ['storage', 'hybrid'] },

// // AWS Database
// { icon: Database, label: 'RDS', category: 'Database', color: 'white', bgColor: '#3046DF', provider: 'AWS', tags: ['database', 'sql'] },
// { icon: Database, label: 'DynamoDB', category: 'Database', color: 'white', bgColor: '#3046DF', provider: 'AWS', tags: ['database', 'nosql'] },
// { icon: Database, label: 'ElastiCache', category: 'Database', color: 'white', bgColor: '#3046DF', provider: 'AWS', tags: ['cache', 'in-memory'] },
// { icon: Database, label: 'Neptune', category: 'Database', color: 'white', bgColor: '#3046DF', provider: 'AWS', tags: ['database', 'graph'] },
// { icon: Database, label: 'Redshift', category: 'Database', color: 'white', bgColor: '#3046DF', provider: 'AWS', tags: ['database', 'data warehouse'] },
// { icon: Database, label: 'DocumentDB', category: 'Database', color: 'white', bgColor: '#3046DF', provider: 'AWS', tags: ['database', 'mongodb'] },
// { icon: Database, label: 'Timestream', category: 'Database', color: 'white', bgColor: '#3046DF', provider: 'AWS', tags: ['database', 'time series'] },

// // AWS Networking
// { icon: Globe, label: 'Route 53', category: 'Network', color: 'white', bgColor: '#8356DB', provider: 'AWS', tags: ['dns', 'routing'] },
// { icon: Cloud, label: 'CloudFront', category: 'Network', color: 'white', bgColor: '#8356DB', provider: 'AWS', tags: ['cdn', 'edge'] },
// { icon: NetworkIcon, label: 'VPC', category: 'Network', color: 'white', bgColor: '#8356DB', provider: 'AWS', tags: ['network', 'virtual'] },
// { icon: Share2, label: 'ELB', category: 'Network', color: 'white', bgColor: '#8356DB', provider: 'AWS', tags: ['load balancer'] },
// { icon: Router, label: 'Direct Connect', category: 'Network', color: 'white', bgColor: '#8356DB', provider: 'AWS', tags: ['dedicated', 'connection'] },
// { icon: Globe, label: 'API Gateway', category: 'Network', color: 'white', bgColor: '#8356DB', provider: 'AWS', tags: ['api', 'gateway'] },
// { icon: Share2, label: 'App Mesh', category: 'Network', color: 'white', bgColor: '#8356DB', provider: 'AWS', tags: ['service mesh'] },
// { icon: NetworkIcon, label: 'Transit Gateway', category: 'Network', color: 'white', bgColor: '#8356DB', provider: 'AWS', tags: ['networking', 'transit'] },

// // AWS Security
// { icon: Lock, label: 'IAM', category: 'Security', color: 'white', bgColor: '#D93653', provider: 'AWS', tags: ['identity', 'access'] },
// { icon: Shield, label: 'WAF', category: 'Security', color: 'white', bgColor: '#D93653', provider: 'AWS', tags: ['firewall', 'web'] },
// { icon: ShieldCheck, label: 'Shield', category: 'Security', color: 'white', bgColor: '#D93653', provider: 'AWS', tags: ['ddos', 'protection'] },
// { icon: Key, label: 'KMS', category: 'Security', color: 'white', bgColor: '#D93653', provider: 'AWS', tags: ['key', 'encryption'] },
// { icon: Unlock, label: 'Secrets Manager', category: 'Security', color: 'white', bgColor: '#D93653', provider: 'AWS', tags: ['secrets', 'credentials'] },
// { icon: AlertTriangle, label: 'Inspector', category: 'Security', color: 'white', bgColor: '#D93653', provider: 'AWS', tags: ['security', 'assessment'] },
// { icon: Users, label: 'Cognito', category: 'Security', color: 'white', bgColor: '#D93653', provider: 'AWS', tags: ['identity', 'user'] },
// { icon: Anchor, label: 'Certificate Manager', category: 'Security', color: 'white', bgColor: '#D93653', provider: 'AWS', tags: ['ssl', 'certificates'] },

// // AWS Management
// { icon: Settings, label: 'CloudWatch', category: 'DevOps', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['monitoring', 'logs'] },
// { icon: CloudCog, label: 'CloudFormation', category: 'DevOps', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['iac', 'templates'] },
// { icon: Settings, label: 'Systems Manager', category: 'DevOps', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['management', 'automation'] },
// { icon: Gauge, label: 'Trusted Advisor', category: 'DevOps', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['recommendations', 'best practices'] },
// { icon: GitBranch, label: 'CodeCommit', category: 'DevOps', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['git', 'repository'] },
// { icon: Workflow, label: 'CodePipeline', category: 'DevOps', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['cicd', 'pipeline'] },
// { icon: Code, label: 'CodeBuild', category: 'DevOps', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['build', 'ci'] },
// { icon: Workflow, label: 'CodeDeploy', category: 'DevOps', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['deployment', 'cd'] },

// // AWS Analytics
// { icon: LineChart, label: 'Kinesis', category: 'Analytics', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['streaming', 'data'] },
// { icon: Cpu, label: 'EMR', category: 'Analytics', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['hadoop', 'spark'] },
// { icon: Table, label: 'Athena', category: 'Analytics', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['query', 'sql'] },
// { icon: LineChart, label: 'QuickSight', category: 'Analytics', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['bi', 'visualization'] },
// { icon: Workflow, label: 'Data Pipeline', category: 'Analytics', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['etl', 'workflow'] },
// { icon: Brain, label: 'Glue', category: 'Analytics', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['etl', 'catalog'] },
// { icon: Cloud, label: 'Lake Formation', category: 'Analytics', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['data lake'] },

// // AWS Application Integration
// { icon: MessageSquare, label: 'SNS', category: 'Messaging', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['notification', 'pub/sub'] },
// { icon: Mailbox, label: 'SQS', category: 'Messaging', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['queue', 'messaging'] },
// { icon: Workflow, label: 'Step Functions', category: 'Serverless', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['workflow', 'state machine'] },
// { icon: Workflow, label: 'AppFlow', category: 'DevOps', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['integration', 'saas'] },
// { icon: Workflow, label: 'EventBridge', category: 'Serverless', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['events', 'bus'] },
// { icon: Shuffle, label: 'MQ', category: 'Messaging', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['messaging', 'broker'] },

// // AWS IoT
// { icon: Cpu, label: 'IoT Core', category: 'IoT', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['iot', 'devices'] },
// { icon: Workflow, label: 'IoT Greengrass', category: 'IoT', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['iot', 'edge'] },
// { icon: LineChart, label: 'IoT Analytics', category: 'IoT', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['iot', 'data'] },
// { icon: Workflow, label: 'IoT Events', category: 'IoT', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['iot', 'events'] },
// { icon: Smartphone, label: 'IoT 1-Click', category: 'IoT', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['iot', 'simple'] },

// // AWS Machine Learning
// { icon: Brain, label: 'SageMaker', category: 'Analytics', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['ml', 'ai'] },
// { icon: Webcam, label: 'Rekognition', category: 'Analytics', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['ml', 'vision'] },
// { icon: Wand2, label: 'Comprehend', category: 'Analytics', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['ml', 'nlp'] },
// { icon: Headphones, label: 'Transcribe', category: 'Analytics', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['ml', 'speech'] },
// { icon: MessageSquare, label: 'Polly', category: 'Analytics', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['ml', 'text-to-speech'] },
// { icon: Globe, label: 'Translate', category: 'Analytics', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['ml', 'translation'] },
// { icon: Brain, label: 'Lex', category: 'Analytics', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['ml', 'chatbot'] },
// { icon: Lightbulb, label: 'Personalize', category: 'Analytics', color: 'white', bgColor: '#6610F2', provider: 'AWS', tags: ['ml', 'recommendations'] },

// // Azure services
// { icon: Server, label: 'Azure VM', category: 'Compute', color: 'white', bgColor: '#008AD7', provider: 'Azure', tags: ['vm', 'server'] },
// { icon: Boxes, label: 'Azure Kubernetes', category: 'Containers', color: 'white', bgColor: '#008AD7', provider: 'Azure', tags: ['kubernetes', 'container'] },
// { icon: Folder, label: 'Azure Blob Storage', category: 'Storage', color: 'white', bgColor: '#008AD7', provider: 'Azure', tags: ['storage', 'blob'] },
// { icon: Database, label: 'Azure SQL', category: 'Database', color: 'white', bgColor: '#008AD7', provider: 'Azure', tags: ['database', 'sql'] },
// { icon: Database, label: 'Azure Cosmos DB', category: 'Database', color: 'white', bgColor: '#008AD7', provider: 'Azure', tags: ['database', 'nosql'] },
// { icon: Code, label: 'Azure Functions', category: 'Serverless', color: 'white', bgColor: '#008AD7', provider: 'Azure', tags: ['serverless', 'function'] },
// { icon: Workflow, label: 'Azure Logic Apps', category: 'DevOps', color: 'white', bgColor: '#008AD7', provider: 'Azure', tags: ['workflow', 'integration'] },
// { icon: AppWindow, label: 'Azure App Service', category: 'Compute', color: 'white', bgColor: '#008AD7', provider: 'Azure', tags: ['web', 'app'] },

// // GCP services
// { icon: Server, label: 'GCP Compute Engine', category: 'Compute', color: 'white', bgColor: '#4285F4', provider: 'GCP', tags: ['vm', 'server'] },
// { icon: Boxes, label: 'GCP Kubernetes Engine', category: 'Containers', color: 'white', bgColor: '#4285F4', provider: 'GCP', tags: ['kubernetes', 'container'] },
// { icon: Folder, label: 'GCP Cloud Storage', category: 'Storage', color: 'white', bgColor: '#4285F4', provider: 'GCP', tags: ['storage', 'object'] },
// { icon: Database, label: 'GCP BigQuery', category: 'Database', color: 'white', bgColor: '#4285F4', provider: 'GCP', tags: ['database', 'warehouse'] },
// { icon: Database, label: 'GCP Firestore', category: 'Database', color: 'white', bgColor: '#4285F4', provider: 'GCP', tags: ['database', 'nosql'] },
// { icon: Code, label: 'GCP Cloud Functions', category: 'Serverless', color: 'white', bgColor: '#4285F4', provider: 'GCP', tags: ['serverless', 'function'] },
// { icon: Workflow, label: 'GCP Cloud Composer', category: 'DevOps', color: 'white', bgColor: '#4285F4', provider: 'GCP', tags: ['workflow', 'airflow'] },
// { icon: AppWindow, label: 'GCP App Engine', category: 'Compute', color: 'white', bgColor: '#4285F4', provider: 'GCP', tags: ['app', 'paas'] },

// // Generic components
// { icon: Globe, label: 'Internet', category: 'Network', color: 'white', bgColor: '#0078D7', provider: 'Generic', tags: ['internet', 'global'] },
// { icon: User, label: 'User', category: 'General', color: 'white', bgColor: '#6C757D', provider: 'Generic', tags: ['user', 'person'] },
// { icon: Users, label: 'User Group', category: 'General', color: 'white', bgColor: '#6C757D', provider: 'Generic', tags: ['users', 'group'] },
// { icon: Building, label: 'Data Center', category: 'Infrastructure', color: 'white', bgColor: '#198754', provider: 'Generic', tags: ['datacenter', 'facility'] },
// { icon: Router, label: 'Router', category: 'Network', color: 'white', bgColor: '#0078D7', provider: 'Generic', tags: ['router', 'networking'] },
// { icon: Lock, label: 'Firewall', category: 'Security', color: 'white', bgColor: '#D93653', provider: 'Generic', tags: ['firewall', 'security'] },
// { icon: Smartphone, label: 'Mobile Device', category: 'IoT', color: 'white', bgColor: '#6610F2', provider: 'Generic', tags: ['mobile', 'device'] },
// { icon: Laptop, label: 'Laptop', category: 'IoT', color: 'white', bgColor: '#6610F2', provider: 'Generic', tags: ['laptop', 'computer'] },

// // Additional components for complete diagram scenarios
// { icon: Type, label: 'Label', category: 'General', color: 'white', bgColor: '#6C757D', provider: 'Generic', tags: ['label', 'text'] },
// { icon: LayoutGrid, label: 'Group', category: 'General', color: 'white', bgColor: '#6C757D', provider: 'Generic', tags: ['group', 'box'] },
// { icon: ArrowRightLeft, label: 'Connection', category: 'General', color: 'white', bgColor: '#6C757D', provider: 'Generic', tags: ['connection', 'line'] },
// { icon: MapPin, label: 'Region', category: 'Infrastructure', color: 'white', bgColor: '#198754', provider: 'Generic', tags: ['region', 'location'] },
// { icon: Landmark, label: 'Enterprise', category: 'Infrastructure', color: 'white', bgColor: '#198754', provider: 'Generic', tags: ['enterprise', 'business'] },
// { icon: Home, label: 'On-Premises', category: 'Infrastructure', color: 'white', bgColor: '#198754', provider: 'Generic', tags: ['on-premises', 'local'] }
// ];

export const toolbarItems: ToolbarItem[] = [
  // Client
  { icon: LayoutDashboard, label: 'Web App', category: 'Client', color: 'white', bgColor: '#3046df', provider: 'AWS', tags: ['ui', 'frontend'] },
  { icon: Globe, label: 'Browser', category: 'Client', color: 'white', bgColor: '#3046df', provider: 'AWS', tags: ['ui', 'frontend'] },
  { icon: Smartphone, label: 'Mobile App', category: 'Client', color: 'white', bgColor: '#3046df', provider: 'AWS', tags: ['ui', 'frontend'] },
  { icon: Laptop, label: 'Desktop App', category: 'Client', color: 'white', bgColor: '#3046df', provider: 'AWS', tags: ['ui', 'frontend'] },
  { icon: Cpu, label: 'IoT Device', category: 'Client', color: 'white', bgColor: '#3046df', provider: 'AWS', tags: ['hardware', 'embedded'] },
  { icon: Satellite, label: 'External Clients', category: 'Client', color: 'white', bgColor: '#3046df', provider: 'AWS', tags: ['integration', 'external'] },
  { icon: Wifi, label: 'Internet', category: 'Client', color: 'white', bgColor: '#3046df', provider: 'AWS', tags: ['network', 'connectivity'] },


  // Gateway
  { icon: Share2, label: 'API Gateway', category: 'Gateway', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['gateway', 'network'] },
  { icon: Network, label: 'Load Balancer', category: 'Gateway', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['traffic', 'balancing'] },
  { icon: Router, label: 'Reverse Proxy', category: 'Gateway', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['proxy', 'routing'] },
  { icon: TrafficCone, label: 'Rate Limiter', category: 'Gateway', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['security', 'throttling'] },
  { icon: Globe, label: 'CDN', category: 'Gateway', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['cache', 'distribution'] },
  { icon: CloudCog, label: 'Edge Service', category: 'Gateway', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['edge', 'latency'] },

  // Security
  { icon: ShieldCheck, label: 'Auth Service', category: 'Security', color: 'white', bgColor: '#9C27B0', provider: 'AWS', tags: ['auth', 'security'] },
  { icon: KeyRound, label: 'IAM', category: 'Security', color: 'white', bgColor: '#9C27B0', provider: 'AWS', tags: ['identity', 'roles'] },
  { icon: ShieldAlert, label: 'WAF', category: 'Security', color: 'white', bgColor: '#9C27B0', provider: 'AWS', tags: ['firewall', 'protection'] },
  { icon: KeySquare, label: 'Secrets Manager', category: 'Security', color: 'white', bgColor: '#9C27B0', provider: 'AWS', tags: ['secrets', 'config'] },
  { icon: LockKeyhole, label: 'Encryption Service', category: 'Security', color: 'white', bgColor: '#9C27B0', provider: 'AWS', tags: ['encryption', 'kms'] },

  // Application
  { icon: Server, label: 'Web Server', category: 'Application', color: 'white', bgColor: '#009688', provider: 'Azure', tags: ['backend', 'api'] },
  { icon: Boxes, label: 'Microservice', category: 'Application', color: 'white', bgColor: '#009688', provider: 'Azure', tags: ['service', 'logic'] },
  { icon: Code2, label: 'API Service', category: 'Application', color: 'white', bgColor: '#009688', provider: 'Azure', tags: ['endpoint', 'rest'] },
  { icon: Repeat, label: 'Background Worker', category: 'Application', color: 'white', bgColor: '#009688', provider: 'Azure', tags: ['async', 'processing'] },
  { icon: Rocket, label: 'App Server', category: 'Application', color: 'white', bgColor: '#009688', provider: 'Azure', tags: ['runtime', 'execution'] },
  { icon: Settings2, label: 'Orchestrator', category: 'Application', color: 'white', bgColor: '#009688', provider: 'Azure', tags: ['workflow', 'durable'] },
  { icon: LayoutList, label: 'Job Scheduler', category: 'Application', color: 'white', bgColor: '#009688', provider: 'Azure', tags: ['cron', 'jobs'] },

  // Database
  { icon: Database, label: 'SQL Database', category: 'Database', color: 'white', bgColor: '#4CAF50', provider: 'Azure', tags: ['relational', 'storage'] },
  { icon: HardDriveDownload, label: 'NoSQL DB', category: 'Database', color: 'white', bgColor: '#4CAF50', provider: 'Azure', tags: ['nosql', 'document'] },
  { icon: CloudLightning, label: 'Cache Store', category: 'Database', color: 'white', bgColor: '#4CAF50', provider: 'Azure', tags: ['redis', 'memory'] },
  { icon: FolderSearch2, label: 'Blob Storage', category: 'Database', color: 'white', bgColor: '#4CAF50', provider: 'Azure', tags: ['files', 'objects'] },
  { icon: BarChart3, label: 'Analytics DB', category: 'Database', color: 'white', bgColor: '#4CAF50', provider: 'Azure', tags: ['analytics', 'bigdata'] },
  { icon: FolderKanban, label: 'Data Lake', category: 'Database', color: 'white', bgColor: '#4CAF50', provider: 'Azure', tags: ['lake', 'storage'] },
  { icon: FileBarChart, label: 'Data Warehouse', category: 'Database', color: 'white', bgColor: '#4CAF50', provider: 'Azure', tags: ['warehouse', 'analytics'] },

  // Integration
  { icon: MessageSquareCode, label: 'Message Queue', category: 'Integration', color: 'white', bgColor: '#FFC107', provider: 'GCP', tags: ['queue', 'broker'] },
  { icon: Send, label: 'Event Bus', category: 'Integration', color: 'white', bgColor: '#FFC107', provider: 'GCP', tags: ['events', 'pubsub'] },
  { icon: Plug, label: '3rd Party API', category: 'Integration', color: 'white', bgColor: '#FFC107', provider: 'GCP', tags: ['external', 'api'] },
  { icon: Webhook, label: 'Webhook Handler', category: 'Integration', color: 'white', bgColor: '#FFC107', provider: 'GCP', tags: ['events', 'http'] },
  { icon: MessageCircleCode, label: 'Event Processor', category: 'Integration', color: 'white', bgColor: '#FFC107', provider: 'GCP', tags: ['stream', 'handler'] },

  // Monitoring & DevOps
  { icon: Activity, label: 'Monitoring', category: 'DevOps', color: 'white', bgColor: '#607D8B', provider: 'Azure', tags: ['logs', 'metrics'] },
  { icon: MonitorDot, label: 'Dashboard', category: 'DevOps', color: 'white', bgColor: '#607D8B', provider: 'Azure', tags: ['visibility', 'health'] },
  { icon: GitBranch, label: 'CI/CD Pipeline', category: 'DevOps', color: 'white', bgColor: '#607D8B', provider: 'Azure', tags: ['build', 'deploy'] },
  { icon: Terminal, label: 'IaC', category: 'DevOps', color: 'white', bgColor: '#607D8B', provider: 'Azure', tags: ['terraform', 'automation'] },
  { icon: ClipboardList, label: 'Incident Tracker', category: 'DevOps', color: 'white', bgColor: '#607D8B', provider: 'Azure', tags: ['incidents', 'support'] },
  { icon: RefreshCw, label: 'Auto Scaling', category: 'DevOps', color: 'white', bgColor: '#607D8B', provider: 'Azure', tags: ['scale', 'autoscale'] },
  { icon: LogOut, label: 'Backup Service', category: 'DevOps', color: 'white', bgColor: '#607D8B', provider: 'Azure', tags: ['backup', 'recovery'] },

  // AWS
  { icon: ServerCog, label: 'EC2', category: 'AWS', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['compute', 'server'] },
  { icon: CloudDrizzle, label: 'S3', category: 'AWS', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['storage', 'objects'] },
  { icon: CloudLightning, label: 'Lambda', category: 'AWS', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['serverless', 'function'] },
  { icon: Database, label: 'RDS', category: 'AWS', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['relational', 'database'] },
  { icon: CloudCog, label: 'EKS', category: 'AWS', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['kubernetes', 'cluster'] },
  { icon: Database, label: 'DynamoDB', category: 'AWS', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['nosql', 'aws'] },
  { icon: ShieldCheck, label: 'Shield', category: 'AWS', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['ddos', 'protection'] },
  { icon: Boxes, label: 'Fargate', category: 'AWS', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['containers', 'compute'] },
  { icon: BarChart3, label: 'CloudWatch', category: 'AWS', color: 'white', bgColor: '#FF9900', provider: 'AWS', tags: ['monitoring', 'logs'] },

  // GCP
  { icon: CloudCog, label: 'Compute Engine', category: 'GCP', color: 'white', bgColor: '#EA4335', provider: 'GCP', tags: ['vm', 'compute'] },
  { icon: HardDriveDownload, label: 'Cloud Storage', category: 'GCP', color: 'white', bgColor: '#EA4335', provider: 'GCP', tags: ['storage', 'buckets'] },
  { icon: CloudLightning, label: 'Cloud Functions', category: 'GCP', color: 'white', bgColor: '#EA4335', provider: 'GCP', tags: ['functions', 'serverless'] },
  { icon: Database, label: 'Cloud SQL', category: 'GCP', color: 'white', bgColor: '#EA4335', provider: 'GCP', tags: ['sql', 'database'] },
  { icon: CloudCog, label: 'GKE', category: 'GCP', color: 'white', bgColor: '#EA4335', provider: 'GCP', tags: ['kubernetes', 'orchestration'] },
  { icon: Database, label: 'BigQuery', category: 'GCP', color: 'white', bgColor: '#EA4335', provider: 'GCP', tags: ['analytics', 'gcp'] },
  { icon: Terminal, label: 'Cloud Build', category: 'GCP', color: 'white', bgColor: '#EA4335', provider: 'GCP', tags: ['cicd', 'build'] },


  // Azure
  { icon: CloudCog, label: 'VM', category: 'Azure', color: 'white', bgColor: '#0072C6', provider: 'Azure', tags: ['compute', 'virtual machine'] },
  { icon: CloudLightning, label: 'Azure Functions', category: 'Azure', color: 'white', bgColor: '#0072C6', provider: 'Azure', tags: ['serverless', 'functions'] },
  { icon: CloudCog, label: 'AKS', category: 'Azure', color: 'white', bgColor: '#0072C6', provider: 'Azure', tags: ['kubernetes', 'cluster'] },
  { icon: Database, label: 'Cosmos DB', category: 'Azure', color: 'white', bgColor: '#0072C6', provider: 'Azure', tags: ['nosql', 'cosmos'] },
  { icon: BarChart3, label: 'Application Insights', category: 'Azure', color: 'white', bgColor: '#0072C6', provider: 'Azure', tags: ['telemetry', 'monitoring'] },
  { icon: Network, label: 'Virtual Network', category: 'Azure', color: 'white', bgColor: '#0072C6', provider: 'Azure', tags: ['vnet', 'networking'] },
  { icon: FolderSearch2, label: 'Data Factory', category: 'Azure', color: 'white', bgColor: '#0072C6', provider: 'Azure', tags: ['etl', 'integration'] }

];
