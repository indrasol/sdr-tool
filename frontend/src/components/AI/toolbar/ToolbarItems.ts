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

// Import the GCP icons
import { convertGCPIconsToToolbarItems } from '../icons/GCPIconsLoader';

// Import the AWS icons
import { convertAWSIconsToToolbarItems } from '../icons/AWSIconsLoader';

// Import the Azure icons
import { convertAzureIconsToToolbarItems } from '../icons/AzureIconsLoader';

// Import the Application icons
import { convertApplicationIconsToToolbarItems } from '../icons/ApplicationIconsLoader';

// Import the Client icons
import { convertClientIconsToToolbarItems } from '../icons/ClientIconsLoader';

// Import the Network icons
import { convertNetworkIconsToToolbarItems } from '../icons/NetworkIconsLoader';

// Get GCP icons from JSON
const gcpToolbarItems: ToolbarItem[] = convertGCPIconsToToolbarItems();

// Get AWS icons from JSON
const awsToolbarItems: ToolbarItem[] = convertAWSIconsToToolbarItems();

// Get Azure icons from JSON
const azureToolbarItems: ToolbarItem[] = convertAzureIconsToToolbarItems();

// Get Application icons from JSON
const applicationToolbarItems: ToolbarItem[] = convertApplicationIconsToToolbarItems();

// Get Client icons from JSON
const clientToolbarItems: ToolbarItem[] = convertClientIconsToToolbarItems();

// Get Network icons from JSON
const networkToolbarItems: ToolbarItem[] = convertNetworkIconsToToolbarItems();

// Original toolbar items
const originalToolbarItems: ToolbarItem[] = [
  // Gateway
  { 
    icon: Share2, 
    label: 'API Gateway', 
    category: 'Gateway', 
    color: 'white', 
    bgColor: '#ED7615', 
    provider: 'AWS', 
    tags: ['gateway', 'network'],
    description: 'An API Gateway that manages, secures and routes API requests. Provides a single entry point for external clients to access services.'
  },
  { 
    icon: Network, 
    label: 'Load Balancer', 
    category: 'Gateway', 
    color: 'white', 
    bgColor: '#ED7615', 
    provider: 'AWS', 
    tags: ['traffic', 'balancing'],
    description: 'Distributes incoming network traffic across multiple servers to ensure high availability and reliability. Essential for scaling applications.'
  },
  { 
    icon: Router, 
    label: 'Reverse Proxy', 
    category: 'Gateway', 
    color: 'white', 
    bgColor: '#ED7615', 
    provider: 'AWS', 
    tags: ['proxy', 'routing'],
    description: 'A server that sits between client devices and backend servers, forwarding client requests to appropriate servers. Used for security and routing.'
  },
  { icon: TrafficCone, label: 'Rate Limiter', category: 'Gateway', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['security', 'throttling'] },
  { icon: Globe, label: 'CDN', category: 'Gateway', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['cache', 'distribution'] },
  { icon: CloudCog, label: 'Edge Service', category: 'Gateway', color: 'white', bgColor: '#ED7615', provider: 'AWS', tags: ['edge', 'latency'] },

  // Application
  { 
    icon: Server, 
    label: 'Web Server', 
    category: 'Application', 
    color: 'white', 
    bgColor: '#009688', 
    provider: 'Azure', 
    tags: ['backend', 'api'],
    description: 'Serves web content or hosts applications. Handles HTTP requests and delivers responses to clients. Core component of web applications.'
  },
  { 
    icon: Boxes, 
    label: 'Microservice', 
    category: 'Application', 
    color: 'white', 
    bgColor: '#009688', 
    provider: 'Azure', 
    tags: ['service', 'logic'],
    description: 'Small, independently deployable service focused on a specific business capability. Part of a microservices architecture.'
  },
  { icon: Code2, label: 'API Service', category: 'Application', color: 'white', bgColor: '#009688', provider: 'Azure', tags: ['endpoint', 'rest'] },
  { icon: Repeat, label: 'Background Worker', category: 'Application', color: 'white', bgColor: '#009688', provider: 'Azure', tags: ['async', 'processing'] },
  { icon: Rocket, label: 'App Server', category: 'Application', color: 'white', bgColor: '#009688', provider: 'Azure', tags: ['runtime', 'execution'] },
  { icon: Settings2, label: 'Orchestrator', category: 'Application', color: 'white', bgColor: '#009688', provider: 'Azure', tags: ['workflow', 'durable'] },
  { icon: LayoutList, label: 'Job Scheduler', category: 'Application', color: 'white', bgColor: '#009688', provider: 'Azure', tags: ['cron', 'jobs'] },

  // Database
  { 
    icon: Database, 
    label: 'SQL Database', 
    category: 'Database', 
    color: 'white', 
    bgColor: '#4CAF50', 
    provider: 'Azure', 
    tags: ['relational', 'storage'],
    description: 'Relational database management system for structured data storage. Used for data with defined relationships and schema.'
  },
  { 
    icon: HardDriveDownload, 
    label: 'NoSQL DB', 
    category: 'Database', 
    color: 'white', 
    bgColor: '#4CAF50', 
    provider: 'Azure', 
    tags: ['nosql', 'document'],
    description: 'Non-relational database for flexible, schema-less data storage. Good for unstructured data, document storage, or high-scale applications.'
  },
  { icon: CloudLightning, label: 'Cache Store', category: 'Database', color: 'white', bgColor: '#4CAF50', provider: 'Azure', tags: ['redis', 'memory'] },
  { icon: FolderSearch2, label: 'Blob Storage', category: 'Database', color: 'white', bgColor: '#4CAF50', provider: 'Azure', tags: ['files', 'objects'] },
  { icon: BarChart3, label: 'Analytics DB', category: 'Database', color: 'white', bgColor: '#4CAF50', provider: 'Azure', tags: ['analytics', 'bigdata'] },
  { icon: FolderKanban, label: 'Data Lake', category: 'Database', color: 'white', bgColor: '#4CAF50', provider: 'Azure', tags: ['lake', 'storage'] },
  { icon: FileBarChart, label: 'Data Warehouse', category: 'Database', color: 'white', bgColor: '#4CAF50', provider: 'Azure', tags: ['warehouse', 'analytics'] },

  // Monitoring & DevOps
  { 
    icon: Activity, 
    label: 'Monitoring', 
    category: 'DevOps', 
    color: 'white', 
    bgColor: '#607D8B', 
    provider: 'Azure', 
    tags: ['logs', 'metrics'],
    description: 'System for tracking application health, performance metrics, and logs. Essential for maintaining service reliability and troubleshooting.'
  },
  { icon: MonitorDot, label: 'Dashboard', category: 'DevOps', color: 'white', bgColor: '#607D8B', provider: 'Azure', tags: ['visibility', 'health'] },
  { icon: GitBranch, label: 'CI/CD Pipeline', category: 'DevOps', color: 'white', bgColor: '#607D8B', provider: 'Azure', tags: ['build', 'deploy'] },
  { icon: Terminal, label: 'IaC', category: 'DevOps', color: 'white', bgColor: '#607D8B', provider: 'Azure', tags: ['terraform', 'automation'] },
  { icon: ClipboardList, label: 'Incident Tracker', category: 'DevOps', color: 'white', bgColor: '#607D8B', provider: 'Azure', tags: ['incidents', 'support'] },
  { icon: RefreshCw, label: 'Auto Scaling', category: 'DevOps', color: 'white', bgColor: '#607D8B', provider: 'Azure', tags: ['scale', 'autoscale'] },
  { icon: LogOut, label: 'Backup Service', category: 'DevOps', color: 'white', bgColor: '#607D8B', provider: 'Azure', tags: ['backup', 'recovery'] },

  // Azure
  { 
    icon: CloudCog, 
    label: 'VM', 
    category: 'Azure', 
    color: 'white', 
    bgColor: '#0072C6', 
    provider: 'Azure', 
    tags: ['compute', 'virtual machine'],
    description: 'Azure Virtual Machines - On-demand, scalable computing resources. Provides flexibility of virtualization without buying hardware.'
  },
  { icon: CloudLightning, label: 'Azure Functions', category: 'Azure', color: 'white', bgColor: '#0072C6', provider: 'Azure', tags: ['serverless', 'functions'] },
  { icon: CloudCog, label: 'AKS', category: 'Azure', color: 'white', bgColor: '#0072C6', provider: 'Azure', tags: ['kubernetes', 'cluster'] },
  { icon: Database, label: 'Cosmos DB', category: 'Azure', color: 'white', bgColor: '#0072C6', provider: 'Azure', tags: ['nosql', 'cosmos'] },
  { icon: BarChart3, label: 'Application Insights', category: 'Azure', color: 'white', bgColor: '#0072C6', provider: 'Azure', tags: ['telemetry', 'monitoring'] },
  { icon: Network, label: 'Virtual Network', category: 'Azure', color: 'white', bgColor: '#0072C6', provider: 'Azure', tags: ['vnet', 'networking'] },
  { icon: FolderSearch2, label: 'Data Factory', category: 'Azure', color: 'white', bgColor: '#0072C6', provider: 'Azure', tags: ['etl', 'integration'] }
];

// Export combined toolbar items, replacing the basic AWS, Azure, and GCP icons with the icons from JSON
export const toolbarItems: ToolbarItem[] = [
  ...originalToolbarItems.filter(item => 
    item.category !== 'GCP' && 
    item.category !== 'AWS' && 
    item.category !== 'Azure' && 
    item.category !== 'Application' &&
    item.category !== 'Client' &&
    item.category !== 'Gateway' &&
    item.category !== 'Database' &&
    item.category !== 'DevOps' &&
    item.category !== 'Network'
  ),
  ...clientToolbarItems,
  ...awsToolbarItems,
  ...azureToolbarItems,
  ...gcpToolbarItems,
  ...applicationToolbarItems,
  ...networkToolbarItems
];
