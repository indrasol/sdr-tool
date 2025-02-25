import { Cloud, Database, Server, Folder, File, Settings, Users, Lock, Network, Code } from 'lucide-react'; // Make sure to import all icon components

// nodeTypesConfig.js (or in the same file if you prefer)
export const nodeTypesConfig = {
    'apigateway': {
        label: 'API Gateway',
        icon: Cloud,
    },
    'firewall': {
        label: 'Firewall',
        icon: Lock,
    },
    'database': {
        label: 'Database',
        icon: Database,
    },
    'server': {
        label: 'Server',
        icon: Server,
    },
    'folder': {
        label: 'Folder',
        icon: Folder,
    },
    'file': {
        label: 'File',
        icon: File,
    },
    'settings': {
        label: 'Settings',
        icon: Settings,
    },
    'users': {
        label: 'Users',
        icon: Users,
    },
    'lock': {
        label: 'Lock',
        icon: Lock,
    },
    'network': {
        label: 'Network',
        icon: Network,
    },
    'code': {
        label: 'Code',
        icon: Code,
    },
    // Add more node type configurations here as needed
};