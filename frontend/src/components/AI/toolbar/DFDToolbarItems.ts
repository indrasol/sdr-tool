import { ToolbarItem } from './ToolbarTypes';
import {
  Circle,
  Square,
  Database,
  User,
  Globe,
  Server,
  Shield,
  AlertTriangle,
  ArrowRightCircle,
  Lock,
  Key,
  FileWarning,
  FileCheck,
  FileLock2,
  LayoutPanelTop,
  Workflow,
  FileSearch,
  MessageSquare,
  Landmark,
  Network,
  Minus,
  PlusCircle,
  Fingerprint,
  LockKeyhole,
  Layers
} from 'lucide-react';

// DFD-specific toolbar items for threat modeling
export const dfdToolbarItems: ToolbarItem[] = [
  // Core DFD Elements
  { 
    icon: Circle, 
    label: 'Process', 
    category: 'DFD Elements', 
    color: 'white', 
    bgColor: '#2563EB', 
    provider: 'DFD', 
    tags: ['process', 'function', 'operation'] 
  },
  { 
    icon: Square, 
    label: 'External Entity', 
    category: 'DFD Elements', 
    color: 'white', 
    bgColor: '#6B7280', 
    provider: 'DFD', 
    tags: ['entity', 'actor', 'external'] 
  },
  { 
    icon: Database, 
    label: 'Data Store', 
    category: 'DFD Elements', 
    color: 'white', 
    bgColor: '#0891B2', 
    provider: 'DFD', 
    tags: ['datastore', 'database', 'storage'] 
  },
  { 
    icon: ArrowRightCircle, 
    label: 'Data Flow', 
    category: 'DFD Elements', 
    color: 'white', 
    bgColor: '#6B7280', 
    provider: 'DFD', 
    tags: ['dataflow', 'flow', 'connection'] 
  },
  { 
    icon: LayoutPanelTop, 
    label: 'Trust Boundary', 
    category: 'DFD Elements', 
    color: 'white', 
    bgColor: '#DC2626', 
    provider: 'DFD', 
    tags: ['boundary', 'trust', 'zone'] 
  },

  // Common External Entities
  { 
    icon: User, 
    label: 'User', 
    category: 'External Entities', 
    color: 'white', 
    bgColor: '#6B7280', 
    provider: 'DFD', 
    tags: ['user', 'person', 'actor'] 
  },
  { 
    icon: Globe, 
    label: 'Internet', 
    category: 'External Entities', 
    color: 'white', 
    bgColor: '#8B5CF6', 
    provider: 'DFD', 
    tags: ['internet', 'web', 'external'] 
  },
  { 
    icon: Landmark, 
    label: 'Third Party', 
    category: 'External Entities', 
    color: 'white', 
    bgColor: '#8B5CF6', 
    provider: 'DFD', 
    tags: ['third-party', 'vendor', 'partner'] 
  },
  
  // Common Processes
  { 
    icon: Server, 
    label: 'Web Server', 
    category: 'Processes', 
    color: 'white', 
    bgColor: '#2563EB', 
    provider: 'DFD', 
    tags: ['web', 'server', 'http'] 
  },
  { 
    icon: Server, 
    label: 'API Service', 
    category: 'Processes', 
    color: 'white', 
    bgColor: '#2563EB', 
    provider: 'DFD', 
    tags: ['api', 'service', 'rest'] 
  },
  { 
    icon: Server, 
    label: 'Auth Service', 
    category: 'Processes', 
    color: 'white', 
    bgColor: '#2563EB', 
    provider: 'DFD', 
    tags: ['auth', 'authentication', 'security'] 
  },
  { 
    icon: MessageSquare, 
    label: 'Message Processor', 
    category: 'Processes', 
    color: 'white', 
    bgColor: '#2563EB', 
    provider: 'DFD', 
    tags: ['message', 'queue', 'processor'] 
  },
  
  // Common Data Stores
  { 
    icon: Database, 
    label: 'SQL Database', 
    category: 'Data Stores', 
    color: 'white', 
    bgColor: '#0891B2', 
    provider: 'DFD', 
    tags: ['sql', 'database', 'relational'] 
  },
  { 
    icon: Database, 
    label: 'NoSQL Database', 
    category: 'Data Stores', 
    color: 'white', 
    bgColor: '#0891B2', 
    provider: 'DFD', 
    tags: ['nosql', 'database', 'document'] 
  },
  { 
    icon: Layers, 
    label: 'File Storage', 
    category: 'Data Stores', 
    color: 'white', 
    bgColor: '#0891B2', 
    provider: 'DFD', 
    tags: ['file', 'storage', 's3'] 
  },
  { 
    icon: Database, 
    label: 'Cache', 
    category: 'Data Stores', 
    color: 'white', 
    bgColor: '#0891B2', 
    provider: 'DFD', 
    tags: ['cache', 'redis', 'memory'] 
  },
  
  // Security Controls
  { 
    icon: Shield, 
    label: 'Firewall', 
    category: 'Security Controls', 
    color: 'white', 
    bgColor: '#DC2626', 
    provider: 'DFD', 
    tags: ['firewall', 'waf', 'security'] 
  },
  { 
    icon: Lock, 
    label: 'Encryption', 
    category: 'Security Controls', 
    color: 'white', 
    bgColor: '#DC2626', 
    provider: 'DFD', 
    tags: ['encryption', 'tls', 'ssl'] 
  },
  { 
    icon: Fingerprint, 
    label: 'Authentication', 
    category: 'Security Controls', 
    color: 'white', 
    bgColor: '#DC2626', 
    provider: 'DFD', 
    tags: ['authentication', 'auth', 'identity'] 
  },
  { 
    icon: LockKeyhole, 
    label: 'Authorization', 
    category: 'Security Controls', 
    color: 'white', 
    bgColor: '#DC2626', 
    provider: 'DFD', 
    tags: ['authorization', 'access control', 'permissions'] 
  },
  
  // Trust Boundaries
  { 
    icon: LayoutPanelTop, 
    label: 'DMZ', 
    category: 'Boundaries', 
    color: 'white', 
    bgColor: '#DC2626', 
    provider: 'DFD', 
    tags: ['dmz', 'perimeter', 'network'] 
  },
  { 
    icon: LayoutPanelTop, 
    label: 'Internal Network', 
    category: 'Boundaries', 
    color: 'white', 
    bgColor: '#DC2626', 
    provider: 'DFD', 
    tags: ['internal', 'network', 'trusted'] 
  },
  { 
    icon: LayoutPanelTop, 
    label: 'Security Boundary', 
    category: 'Boundaries', 
    color: 'white', 
    bgColor: '#DC2626', 
    provider: 'DFD', 
    tags: ['security', 'boundary', 'isolation'] 
  },
  { 
    icon: LayoutPanelTop, 
    label: 'Data Boundary', 
    category: 'Boundaries', 
    color: 'white', 
    bgColor: '#DC2626', 
    provider: 'DFD', 
    tags: ['data', 'boundary', 'classification'] 
  },
]; 