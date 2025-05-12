// // // Create a new file: src/components/AI/DFDVisualization.tsx

import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MiniMap,
  Panel,
  Node,
  Edge,
  MarkerType,
  Position,
  Handle
} from '@xyflow/react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  Shield,
  AlertTriangle,
  Info,
  Maximize,
  Database,
  User,
  Server,
  Globe,
  Cloud,
  Key,
  Lock,
  ArrowRightCircle,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Activity,
  Target,
  EyeOff,
  Eye
} from 'lucide-react';
import { DFDData, ThreatItem } from '../../interfaces/aiassistedinterfaces';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Import the DFD icons from the icons directory
import { EarthGlobeSVG, CDNIconSVG } from './icons/DFDIcons';

import '@xyflow/react/dist/style.css';
import * as dagre from 'dagre';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Dummy JSON data simulating backend response
const dummyDFDData = {
  threat_model_id: "12345ABCDE",
  nodes: [
    // Process Nodes: tb2 to tb3
    {
      id: "1",
      type: "process",
      label: "User Authentication Service",
      left_boundary: "tb2",
      right_boundary: "tb3",
      properties: {
        description: "Handles user login, session management, and MFA",
      },
    },
    {
      id: "2",
      type: "process",
      label: "Order Processing Service",
      left_boundary: "tb2",
      right_boundary: "tb3",
      properties: {
        description: "Manages order creation and validation",
      },
    },
    {
      id: "3",
      type: "process",
      label: "Inventory Management Service",
      left_boundary: "tb2",
      right_boundary: "tb3",
      properties: {
        description: "Tracks stock levels and updates",
      },
    },
    {
      id: "4",
      type: "process",
      label: "Payment Gateway Service",
      left_boundary: "tb2",
      right_boundary: "tb3",
      properties: {
        description: "Processes payment transactions securely",
      },
    },
    {
      id: "13",
      type: "process",
      label: "Notification Service",
      left_boundary: "tb2",
      right_boundary: "tb3",
      properties: {
        description: "Sends order confirmation emails",
      },
    },
    {
      id: "14",
      type: "process",
      label: "Fraud Detection Service",
      left_boundary: "tb2",
      right_boundary: "tb3",
      properties: {
        description: "Analyzes transactions for fraud",
      },
    },
    {
      id: "20",
      type: "process",
      label: "Customer Support Service",
      left_boundary: "tb2",
      right_boundary: "tb3",
      properties: {
        description: "Handles customer inquiries",
      },
    },
    // External Entity Nodes: tb1 to tb2
    {
      id: "5",
      type: "externalEntity",
      label: "Customer",
      left_boundary: "tb1",
      right_boundary: "tb2",
      properties: {
        description: "End customer interacting with the platform",
      },
    },
    {
      id: "6",
      type: "externalEntity",
      label: "Shipping Provider",
      left_boundary: "tb1",
      right_boundary: "tb2",
      properties: {
        description: "Third-party logistics service",
      },
    },
    {
      id: "7",
      type: "externalEntity",
      label: "Payment Processor",
      left_boundary: "tb1",
      right_boundary: "tb2",
      properties: {
        description: "External payment processing entity",
      },
    },
    {
      id: "15",
      type: "externalEntity",
      label: "Supplier",
      left_boundary: "tb1",
      right_boundary: "tb2",
      properties: {
        description: "Provides inventory stock",
      },
    },
    {
      id: "16",
      type: "externalEntity",
      label: "Marketing Partner",
      left_boundary: "tb1",
      right_boundary: "tb2",
      properties: {
        description: "Handles promotional campaigns",
      },
    },
    // Data Store Nodes: tb3 to tb4
    {
      id: "8",
      type: "dataStore",
      label: "User Profiles Database",
      left_boundary: "tb3",
      right_boundary: "tb4",
      properties: {
        description: "Stores user data and preferences",
      },
    },
    {
      id: "9",
      type: "dataStore",
      label: "Order History Database",
      left_boundary: "tb3",
      right_boundary: "tb4",
      properties: {
        description: "Logs all order transactions",
      },
    },
    {
      id: "10",
      type: "dataStore",
      label: "Inventory Cache",
      left_boundary: "tb3",
      right_boundary: "tb4",
      properties: {
        description: "In-memory cache for stock data",
      },
    },
    {
      id: "17",
      type: "dataStore",
      label: "Audit Logs Database",
      left_boundary: "tb3",
      right_boundary: "tb4",
      properties: {
        description: "Stores system audit logs",
      },
    },
    {
      id: "18",
      type: "dataStore",
      label: "Fraud Patterns Database",
      left_boundary: "tb3",
      right_boundary: "tb4",
      properties: {
        description: "Stores fraud detection patterns",
      },
    },
    // Cloud Service Nodes: tb4 to tb5
    {
      id: "11",
      type: "cloudService",
      label: "AWS S3 Backup Storage",
      left_boundary: "tb4",
      right_boundary: "tb5",
      properties: {
        description: "Stores backups of user and order data",
      },
    },
    {
      id: "12",
      type: "cloudService",
      label: "Google Cloud AI Service",
      left_boundary: "tb4",
      right_boundary: "tb5",
      properties: {
        description: "Provides recommendation engine",
      },
    },
    {
      id: "19",
      type: "cloudService",
      label: "Azure Analytics Service",
      left_boundary: "tb4",
      right_boundary: "tb5",
      properties: {
        description: "Analyzes user behavior data",
      },
    },
  ],
  trustBoundaries: [
    { id: "tb1", label: "Public Internet", x: 200 },
    { id: "tb2", label: "Application DMZ", x: 600 },
    { id: "tb3", label: "Internal Data Center", x: 1000 },
    { id: "tb4", label: "Partner Network", x: 1400 },
    { id: "tb5", label: "Cloud Infrastructure", x: 1800 },
  ],
  edges: [
    {
      id: "e1",
      source: "5",
      target: "1",
      properties: {
        isEncrypted: true,
        description: "Customer submits login credentials",
      },
    },
    {
      id: "e2",
      source: "1",
      target: "8",
      properties: {
        isEncrypted: true,
        description: "Retrieve user profile data",
      },
    },
    {
      id: "e3",
      source: "5",
      target: "2",
      properties: {
        isEncrypted: true,
        description: "Customer places an order",
      },
    },
    {
      id: "e4",
      source: "2",
      target: "4",
      properties: {
        isEncrypted: true,
        description: "Process payment for the order",
      },
    },
    {
      id: "e5",
      source: "4",
      target: "7",
      properties: {
        isEncrypted: true,
        description: "Forward payment details to processor",
      },
    },
    {
      id: "e6",
      source: "2",
      target: "3",
      properties: {
        isEncrypted: true,
        description: "Check inventory availability",
      },
    },
    {
      id: "e7",
      source: "3",
      target: "10",
      properties: {
        isEncrypted: false,
        description: "Access cached inventory data",
      },
    },
    {
      id: "e8",
      source: "2",
      target: "9",
      properties: {
        isEncrypted: true,
        description: "Log order details",
      },
    },
    {
      id: "e9",
      source: "2",
      target: "6",
      properties: {
        isEncrypted: true,
        description: "Send shipping request",
      },
    },
    {
      id: "e10",
      source: "8",
      target: "11",
      properties: {
        isEncrypted: true,
        description: "Backup user profiles",
      },
    },
    {
      id: "e11",
      source: "9",
      target: "11",
      properties: {
        isEncrypted: true,
        description: "Backup order history",
      },
    },
    {
      id: "e12",
      source: "5",
      target: "12",
      properties: {
        isEncrypted: true,
        description: "Request AI recommendations",
      },
    },
    {
      id: "e13",
      source: "12",
      target: "3",
      properties: {
        isEncrypted: true,
        description: "AI updates inventory predictions",
      },
    },
    {
      id: "e14",
      source: "2",
      target: "13",
      properties: {
        isEncrypted: true,
        description: "Send order confirmation notification",
      },
    },
    {
      id: "e15",
      source: "4",
      target: "14",
      properties: {
        isEncrypted: true,
        description: "Analyze transaction for fraud",
      },
    },
    {
      id: "e16",
      source: "14",
      target: "18",
      properties: {
        isEncrypted: true,
        description: "Retrieve fraud patterns",
      },
    },
    {
      id: "e17",
      source: "3",
      target: "15",
      properties: {
        isEncrypted: true,
        description: "Request inventory restock",
      },
    },
    {
      id: "e18",
      source: "5",
      target: "16",
      properties: {
        isEncrypted: true,
        description: "Receive promotional offers",
      },
    },
    {
      id: "e19",
      source: "16",
      target: "12",
      properties: {
        isEncrypted: true,
        description: "Send campaign data for AI analysis",
      },
    },
    {
      id: "e20",
      source: "1",
      target: "17",
      properties: {
        isEncrypted: true,
        description: "Log authentication events",
      },
    },
    {
      id: "e21",
      source: "2",
      target: "17",
      properties: {
        isEncrypted: true,
        description: "Log order processing events",
      },
    },
    {
      id: "e22",
      source: "17",
      target: "11",
      properties: {
        isEncrypted: true,
        description: "Backup audit logs",
      },
    },
    {
      id: "e23",
      source: "5",
      target: "20",
      properties: {
        isEncrypted: true,
        description: "Customer submits support request",
      },
    },
    {
      id: "e24",
      source: "20",
      target: "8",
      properties: {
        isEncrypted: true,
        description: "Retrieve user profile for support",
      },
    },
    {
      id: "e25",
      source: "5",
      target: "19",
      properties: {
        isEncrypted: true,
        description: "Send behavior data for analytics",
      },
    },
  ],
  threats: [
    {
      id: "T1",
      description: "SQL Injection in Authentication",
      severity: "HIGH",
      mitigation: "Use parameterized queries and ORM",
      target_elements: ["1", "8"],
      properties: {
        threat_type: "Injection",
        impact: "Data leakage of user profiles",
        attack_vector: "Web application",
      },
    },
    {
      id: "T2",
      description: "XSS in Order Form",
      severity: "MEDIUM",
      mitigation: "Implement CSP and input validation",
      target_elements: ["2"],
      properties: {
        threat_type: "XSS",
        impact: "Session hijacking",
        attack_vector: "Web application",
      },
    },
    {
      id: "T3",
      description: "Weak Encryption in Backup",
      severity: "HIGH",
      mitigation: "Upgrade to AES-512 and key rotation",
      target_elements: ["11"],
      properties: {
        threat_type: "Cryptographic Failure",
        impact: "Exposure of backups",
        attack_vector: "Data transfer",
      },
    },
    {
      id: "T4",
      description: "MITM on Payment Gateway",
      severity: "HIGH",
      mitigation: "Enforce TLS 1.3 and HSTS",
      target_elements: ["4", "7"],
      properties: {
        threat_type: "MITM",
        impact: "Payment data interception",
        attack_vector: "Network",
      },
    },
    {
      id: "T5",
      description: "Unauthorized Cache Access",
      severity: "LOW",
      mitigation: "Add access controls to cache",
      target_elements: ["10"],
      properties: {
        threat_type: "Access Control",
        impact: "Inventory manipulation",
        attack_vector: "Internal",
      },
    },
    {
      id: "T6",
      description: "Phishing Targeting Customers",
      severity: "MEDIUM",
      mitigation: "MFA and user education",
      target_elements: ["5"],
      properties: {
        threat_type: "Social Engineering",
        impact: "Credential theft",
        attack_vector: "Email",
      },
    },
    {
      id: "T7",
      description: "DDoS on Inventory Service",
      severity: "HIGH",
      mitigation: "Implement WAF and rate limiting",
      target_elements: ["3"],
      properties: {
        threat_type: "Denial of Service",
        impact: "Service unavailability",
        attack_vector: "Network",
      },
    },
    {
      id: "T8",
      description: "Data Exfiltration from Logs",
      severity: "MEDIUM",
      mitigation: "Encrypt logs and monitor access",
      target_elements: ["9"],
      properties: {
        threat_type: "Data Breach",
        impact: "Order history exposure",
        attack_vector: "Internal",
      },
    },
    {
      id: "T9",
      description: "API Misconfiguration in AI Service",
      severity: "HIGH",
      mitigation: "Restrict API keys and audit endpoints",
      target_elements: ["12"],
      properties: {
        threat_type: "Misconfiguration",
        impact: "Unauthorized AI access",
        attack_vector: "API",
      },
    },
    {
      id: "T10",
      description: "Shipping Data Tampering",
      severity: "LOW",
      mitigation: "Sign and verify shipping requests",
      target_elements: ["6"],
      properties: {
        threat_type: "Tampering",
        impact: "Incorrect delivery",
        attack_vector: "Network",
      },
    },
    {
      id: "T11",
      description: "Email Spoofing in Notifications",
      severity: "MEDIUM",
      mitigation: "Implement DMARC and SPF",
      target_elements: ["13"],
      properties: {
        threat_type: "Spoofing",
        impact: "Phishing via notifications",
        attack_vector: "Email",
      },
    },
    {
      id: "T12",
      description: "False Positives in Fraud Detection",
      severity: "LOW",
      mitigation: "Refine fraud detection algorithms",
      target_elements: ["14", "18"],
      properties: {
        threat_type: "Misconfiguration",
        impact: "Transaction delays",
        attack_vector: "Internal",
      },
    },
    {
      id: "T13",
      description: "Supply Chain Attack via Supplier",
      severity: "HIGH",
      mitigation: "Vet suppliers and monitor stock integrity",
      target_elements: ["15"],
      properties: {
        threat_type: "Supply Chain",
        impact: "Compromised inventory",
        attack_vector: "External",
      },
    },
    {
      id: "T14",
      description: "Data Leak in Marketing Campaigns",
      severity: "MEDIUM",
      mitigation: "Encrypt campaign data",
      target_elements: ["16"],
      properties: {
        threat_type: "Data Breach",
        impact: "Exposure of customer data",
        attack_vector: "Network",
      },
    },
    {
      id: "T15",
      description: "Audit Log Tampering",
      severity: "HIGH",
      mitigation: "Use immutable logging",
      target_elements: ["17"],
      properties: {
        threat_type: "Tampering",
        impact: "Loss of audit integrity",
        attack_vector: "Internal",
      },
    },
    {
      id: "T16",
      description: "Insider Threat in Support Service",
      severity: "MEDIUM",
      mitigation: "Implement role-based access control",
      target_elements: ["20"],
      properties: {
        threat_type: "Insider Threat",
        impact: "Unauthorized data access",
        attack_vector: "Internal",
      },
    },
  ],
};

interface NodeData {
  label: string;
  description?: string;
  nodeType?: string;
  threats?: ThreatItem[];
  threatCount?: number;
}

interface ProcessNodeProps {
  data: NodeData;
  selected: boolean;
}

// Custom node components with standard DFD notation
const ProcessNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  console.log("Process Node Data:", data);
  const [showThreatPopup, setShowThreatPopup] = useState(false);

  // Get threat count by severity
  const highCount = data.threats?.filter(t => t.severity === 'HIGH').length || 0;
  const mediumCount = data.threats?.filter(t => t.severity === 'MEDIUM').length || 0;
  const lowCount = data.threats?.filter(t => t.severity === 'LOW').length || 0;

  const hasThreat = highCount > 0 || mediumCount > 0 || lowCount > 0;

  // Create tooltip content
  const threatToolTip = hasThreat ?
    `${highCount > 0 ? `${highCount} High Risk` : ''}${highCount > 0 && (mediumCount > 0 || lowCount > 0) ? ', ' : ''}${mediumCount > 0 ? `${mediumCount} Medium Risk` : ''}${mediumCount > 0 && lowCount > 0 ? ', ' : ''}${lowCount > 0 ? `${lowCount} Low Risk` : ''}`
    : '';

  // Handle threat badge click
  const handleThreatClick = (e) => {
    e.stopPropagation();
    setShowThreatPopup(!showThreatPopup);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex flex-col items-center justify-center relative group`}>
          {/* Circle with label inside */}
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center 
          bg-white border-2 border-black
          ${hasThreat ? 'border-opacity-100' : 'border-opacity-80'}
          ${selected ? 'ring-2 ring-black' : ''}
          ${highCount > 0 ? 'border-red-500' : ''}`}
            style={{
              background: 'white !important',
              backgroundImage: 'none !important',
              backgroundColor: 'white !important'
            }}
          >
            <div className="text-xs font-semibold text-center max-w-[80px] break-words">
              {data.label}
            </div>
          </div>

          {/* Threat indicators */}
          {hasThreat && (
            <div className="threat-indicator" title={threatToolTip} onClick={handleThreatClick}>
              {highCount > 0 && (
                <div className="threat-badge threat-badge-high" title={`${highCount} High Risk Threat${highCount > 1 ? 's' : ''}`}>
                  {highCount}
                </div>
              )}
              {mediumCount > 0 && (
                <div className="threat-badge threat-badge-medium" title={`${mediumCount} Medium Risk Threat${mediumCount > 1 ? 's' : ''}`}>
                  {mediumCount}
                </div>
              )}
              {lowCount > 0 && (
                <div className="threat-badge threat-badge-low" title={`${lowCount} Low Risk Threat${lowCount > 1 ? 's' : ''}`}>
                  {lowCount}
                </div>
              )}
            </div>
          )}

          {/* Threat popup menu when indicator is clicked */}
          {showThreatPopup && hasThreat && (
            <div className="absolute top-[-120px] right-[-10px] z-50 bg-white rounded-md shadow-lg border border-gray-200 p-2 w-60 text-xs">
              <div className="font-bold mb-1.5 text-gray-800">Security Threats</div>
              {highCount > 0 && (
                <div className="flex items-center mb-1.5 text-red-600">
                  <AlertTriangle className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{highCount} High Risk Threat{highCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {mediumCount > 0 && (
                <div className="flex items-center mb-1.5 text-amber-600">
                  <AlertCircle className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{mediumCount} Medium Risk Threat{mediumCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {lowCount > 0 && (
                <div className="flex items-center mb-1.5 text-blue-600">
                  <Info className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{lowCount} Low Risk Threat{lowCount > 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="mt-2 w-full text-center">
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] px-2 py-1 rounded-sm transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThreatPopup(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Connection handles */}
          <Handle
            id="processInput"
            type="target"
            position={Position.Left}
            className="!w-2 !h-2 !border-2 !border-black !bg-white"
          />
          <Handle
            id="processOutput"
            type="source"
            position={Position.Right}
            className="!w-2 !h-2 !border-2 !border-black !bg-white"
          />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-white/90 backdrop-blur-sm p-3 shadow-lg rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-1">{data.label}</h4>
        {data.description && <p className="text-sm text-gray-600">{data.description}</p>}
      </TooltipContent>
    </Tooltip>

  );
};

const EntityNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  const [showThreatPopup, setShowThreatPopup] = useState(false);

  // Get threat count by severity
  const highCount = data.threats?.filter(t => t.severity === 'HIGH').length || 0;
  const mediumCount = data.threats?.filter(t => t.severity === 'MEDIUM').length || 0;
  const lowCount = data.threats?.filter(t => t.severity === 'LOW').length || 0;

  const hasThreat = highCount > 0 || mediumCount > 0 || lowCount > 0;

  // Create tooltip content
  const threatToolTip = hasThreat ?
    `${highCount > 0 ? `${highCount} High Risk` : ''}${highCount > 0 && (mediumCount > 0 || lowCount > 0) ? ', ' : ''}${mediumCount > 0 ? `${mediumCount} Medium Risk` : ''}${mediumCount > 0 && lowCount > 0 ? ', ' : ''}${lowCount > 0 ? `${lowCount} Low Risk` : ''}`
    : '';

  // Handle threat badge click
  const handleThreatClick = (e) => {
    e.stopPropagation();
    setShowThreatPopup(!showThreatPopup);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex flex-col items-center justify-center relative group`}>
          {/* Rectangle with label inside */}
          <div
            className={`w-24 h-16 flex items-center justify-center 
          bg-white border-2 border-black
          ${hasThreat ? 'border-opacity-100' : 'border-opacity-80'}
          ${selected ? 'ring-2 ring-black' : ''}
          ${highCount > 0 ? 'border-red-500' : ''}`}
            style={{
              background: 'white !important',
              backgroundImage: 'none !important',
              backgroundColor: 'white !important'
            }}
          >
            <div className="text-xs font-semibold text-center max-w-[80px] break-words">
              {data.label}
            </div>
          </div>

          {/* Threat indicators */}
          {hasThreat && (
            <div className="threat-indicator" title={threatToolTip} onClick={handleThreatClick}>
              {highCount > 0 && (
                <div className="threat-badge threat-badge-high" title={`${highCount} High Risk Threat${highCount > 1 ? 's' : ''}`}>
                  {highCount}
                </div>
              )}
              {mediumCount > 0 && (
                <div className="threat-badge threat-badge-medium" title={`${mediumCount} Medium Risk Threat${mediumCount > 1 ? 's' : ''}`}>
                  {mediumCount}
                </div>
              )}
              {lowCount > 0 && (
                <div className="threat-badge threat-badge-low" title={`${lowCount} Low Risk Threat${lowCount > 1 ? 's' : ''}`}>
                  {lowCount}
                </div>
              )}
            </div>
          )}

          {/* Threat popup menu when indicator is clicked */}
          {showThreatPopup && hasThreat && (
            <div className="absolute top-[-120px] right-[-10px] z-50 bg-white rounded-md shadow-lg border border-gray-200 p-2 w-60 text-xs">
              <div className="font-bold mb-1.5 text-gray-800">Security Threats</div>
              {highCount > 0 && (
                <div className="flex items-center mb-1.5 text-red-600">
                  <AlertTriangle className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{highCount} High Risk Threat{highCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {mediumCount > 0 && (
                <div className="flex items-center mb-1.5 text-amber-600">
                  <AlertCircle className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{mediumCount} Medium Risk Threat{mediumCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {lowCount > 0 && (
                <div className="flex items-center mb-1.5 text-blue-600">
                  <Info className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{lowCount} Low Risk Threat{lowCount > 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="mt-2 w-full text-center">
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] px-2 py-1 rounded-sm transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThreatPopup(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Connection handles */}
          <Handle
            id="entityInput"
            type="target"
            position={Position.Left}
            className="!w-2 !h-2 !border-2 !border-black !bg-white"
          />
          <Handle
            id="entityOutput"
            type="source"
            position={Position.Right}
            className="!w-2 !h-2 !border-2 !border-black !bg-white"
          />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-white/90 backdrop-blur-sm p-3 shadow-lg rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-1">{data.label}</h4>
        {data.description && <p className="text-sm text-gray-600">{data.description}</p>}
      </TooltipContent>
    </Tooltip>
  );
};

const DataStoreNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  const [showThreatPopup, setShowThreatPopup] = useState(false);

  // Get threat count by severity
  const highCount = data.threats?.filter(t => t.severity === 'HIGH').length || 0;
  const mediumCount = data.threats?.filter(t => t.severity === 'MEDIUM').length || 0;
  const lowCount = data.threats?.filter(t => t.severity === 'LOW').length || 0;

  const hasThreat = highCount > 0 || mediumCount > 0 || lowCount > 0;

  // Create tooltip content
  const threatToolTip = hasThreat ?
    `${highCount > 0 ? `${highCount} High Risk` : ''}${highCount > 0 && (mediumCount > 0 || lowCount > 0) ? ', ' : ''}${mediumCount > 0 ? `${mediumCount} Medium Risk` : ''}${mediumCount > 0 && lowCount > 0 ? ', ' : ''}${lowCount > 0 ? `${lowCount} Low Risk` : ''}`
    : '';

  // Handle threat badge click
  const handleThreatClick = (e) => {
    e.stopPropagation();
    setShowThreatPopup(!showThreatPopup);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex flex-col items-center justify-center relative group`}>
          {/* Data store with only top and bottom borders */}
          <div
            className={`w-24 h-16 flex items-center justify-center 
          bg-white
          ${selected ? 'ring-2 ring-black' : ''}
          ${highCount > 0 ? 'ring-1 ring-red-500' : ''}`}
            style={{
              position: 'relative',
              background: 'white !important',
              backgroundImage: 'none !important',
              backgroundColor: 'white !important'
            }}
          >
            {/* Only top and bottom borders */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] ${highCount > 0 ? 'bg-red-500' : 'bg-black'}`}></div>
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${highCount > 0 ? 'bg-red-500' : 'bg-black'}`}></div>

            {/* Label in the middle */}
            <div className="text-xs font-semibold text-center max-w-[80px] break-words">
              {data.label}
            </div>
          </div>

          {/* Threat indicators */}
          {hasThreat && (
            <div className="threat-indicator" title={threatToolTip} onClick={handleThreatClick}>
              {highCount > 0 && (
                <div className="threat-badge threat-badge-high" title={`${highCount} High Risk Threat${highCount > 1 ? 's' : ''}`}>
                  {highCount}
                </div>
              )}
              {mediumCount > 0 && (
                <div className="threat-badge threat-badge-medium" title={`${mediumCount} Medium Risk Threat${mediumCount > 1 ? 's' : ''}`}>
                  {mediumCount}
                </div>
              )}
              {lowCount > 0 && (
                <div className="threat-badge threat-badge-low" title={`${lowCount} Low Risk Threat${lowCount > 1 ? 's' : ''}`}>
                  {lowCount}
                </div>
              )}
            </div>
          )}

          {/* Threat popup menu when indicator is clicked */}
          {showThreatPopup && hasThreat && (
            <div className="absolute top-[-120px] right-[-10px] z-50 bg-white rounded-md shadow-lg border border-gray-200 p-2 w-60 text-xs">
              <div className="font-bold mb-1.5 text-gray-800">Security Threats</div>
              {highCount > 0 && (
                <div className="flex items-center mb-1.5 text-red-600">
                  <AlertTriangle className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{highCount} High Risk Threat{highCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {mediumCount > 0 && (
                <div className="flex items-center mb-1.5 text-amber-600">
                  <AlertCircle className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{mediumCount} Medium Risk Threat{mediumCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {lowCount > 0 && (
                <div className="flex items-center mb-1.5 text-blue-600">
                  <Info className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{lowCount} Low Risk Threat{lowCount > 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="mt-2 w-full text-center">
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] px-2 py-1 rounded-sm transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThreatPopup(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Connection handles */}
          <Handle
            id="datastoreInput"
            type="target"
            position={Position.Left}
            className="!w-2 !h-2 !border-2 !border-black !bg-white"
          />
          <Handle
            id="datastoreOutput"
            type="source"
            position={Position.Right}
            className="!w-2 !h-2 !border-2 !border-black !bg-white"
          />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-white/90 backdrop-blur-sm p-3 shadow-lg rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-1">{data.label}</h4>
        {data.description && <p className="text-sm text-gray-600">{data.description}</p>}
      </TooltipContent>
    </Tooltip>
  );
};

const ExternalNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  const [showThreatPopup, setShowThreatPopup] = useState(false);
  // Get threat count by severity
  const highCount = data.threats?.filter(t => t.severity === 'HIGH').length || 0;
  const mediumCount = data.threats?.filter(t => t.severity === 'MEDIUM').length || 0;
  const lowCount = data.threats?.filter(t => t.severity === 'LOW').length || 0;

  const hasThreat = highCount > 0 || mediumCount > 0 || lowCount > 0;

  // Create tooltip content
  const threatToolTip = hasThreat ?
    `${highCount > 0 ? `${highCount} High Risk` : ''}${highCount > 0 && (mediumCount > 0 || lowCount > 0) ? ', ' : ''}${mediumCount > 0 ? `${mediumCount} Medium Risk` : ''}${mediumCount > 0 && lowCount > 0 ? ', ' : ''}${lowCount > 0 ? `${lowCount} Low Risk` : ''}`
    : '';

  // Handle threat badge click
  const handleThreatClick = (e) => {
    e.stopPropagation();
    setShowThreatPopup(!showThreatPopup);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex flex-col items-center justify-center relative group`}>
          {/* Rectangle with label inside */}
          <div
            className={`w-24 h-16 flex items-center justify-center 
          bg-white border-2 border-black
          ${selected ? 'ring-2 ring-black' : ''}`}
            style={{
              background: 'white !important',
              backgroundImage: 'none !important',
              backgroundColor: 'white !important'
            }}
          >
            <div className="text-xs font-semibold text-center max-w-[80px] break-words">
              {data.label}
            </div>

            {/* Threat indicators */}
            {hasThreat && (
              <div className="threat-indicator">
                {highCount > 0 && (
                  <div className="threat-badge threat-badge-high">
                    {highCount}
                  </div>
                )}
                {mediumCount > 0 && (
                  <div className="threat-badge threat-badge-medium">
                    {mediumCount}
                  </div>
                )}
                {lowCount > 0 && (
                  <div className="threat-badge threat-badge-low">
                    {lowCount}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Threat indicators */}
          {hasThreat && (
            <div className="threat-indicator" title={threatToolTip} onClick={handleThreatClick}>
              {highCount > 0 && (
                <div className="threat-badge threat-badge-high" title={`${highCount} High Risk Threat${highCount > 1 ? 's' : ''}`}>
                  {highCount}
                </div>
              )}
              {mediumCount > 0 && (
                <div className="threat-badge threat-badge-medium" title={`${mediumCount} Medium Risk Threat${mediumCount > 1 ? 's' : ''}`}>
                  {mediumCount}
                </div>
              )}
              {lowCount > 0 && (
                <div className="threat-badge threat-badge-low" title={`${lowCount} Low Risk Threat${lowCount > 1 ? 's' : ''}`}>
                  {lowCount}
                </div>
              )}
            </div>
          )}

          {/* Threat popup menu when indicator is clicked */}
          {showThreatPopup && hasThreat && (
            <div className="absolute top-[-120px] right-[-10px] z-50 bg-white rounded-md shadow-lg border border-gray-200 p-2 w-60 text-xs">
              <div className="font-bold mb-1.5 text-gray-800">Security Threats</div>
              {highCount > 0 && (
                <div className="flex items-center mb-1.5 text-red-600">
                  <AlertTriangle className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{highCount} High Risk Threat{highCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {mediumCount > 0 && (
                <div className="flex items-center mb-1.5 text-amber-600">
                  <AlertCircle className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{mediumCount} Medium Risk Threat{mediumCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {lowCount > 0 && (
                <div className="flex items-center mb-1.5 text-blue-600">
                  <Info className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{lowCount} Low Risk Threat{lowCount > 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="mt-2 w-full text-center">
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] px-2 py-1 rounded-sm transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThreatPopup(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Connection handles */}
          <Handle
            id="externalInput"
            type="target"
            position={Position.Left}
            className="!w-2 !h-2 !border-2 !border-black !bg-white"
          />
          <Handle
            id="externalOutput"
            type="source"
            position={Position.Right}
            className="!w-2 !h-2 !border-2 !border-black !bg-white"
          />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-white/90 backdrop-blur-sm p-3 shadow-lg rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-1">{data.label}</h4>
        {data.description && <p className="text-sm text-gray-600">{data.description}</p>}
      </TooltipContent>
    </Tooltip>
  );
};

const CloudServiceNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  const [showThreatPopup, setShowThreatPopup] = useState(false);
  // Get threat count by severity
  const highCount = data.threats?.filter(t => t.severity === 'HIGH').length || 0;
  const mediumCount = data.threats?.filter(t => t.severity === 'MEDIUM').length || 0;
  const lowCount = data.threats?.filter(t => t.severity === 'LOW').length || 0;

  const hasThreat = highCount > 0 || mediumCount > 0 || lowCount > 0;

  // Create tooltip content
  const threatToolTip = hasThreat ?
    `${highCount > 0 ? `${highCount} High Risk` : ''}${highCount > 0 && (mediumCount > 0 || lowCount > 0) ? ', ' : ''}${mediumCount > 0 ? `${mediumCount} Medium Risk` : ''}${mediumCount > 0 && lowCount > 0 ? ', ' : ''}${lowCount > 0 ? `${lowCount} Low Risk` : ''}`
    : '';

  // Handle threat badge click
  const handleThreatClick = (e) => {
    e.stopPropagation();
    setShowThreatPopup(!showThreatPopup);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex flex-col items-center justify-center relative group`}>
          {/* Render as process node (circle) */}
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center 
          bg-white border-2 border-black
          ${selected ? 'ring-2 ring-black' : ''}`}
            style={{
              background: 'white !important',
              backgroundImage: 'none !important',
              backgroundColor: 'white !important'
            }}
          >
            <div className="text-xs font-semibold text-center max-w-[80px] break-words">
              {data.label}
            </div>

            {/* Threat indicators */}
          {hasThreat && (
            <div className="threat-indicator" title={threatToolTip} onClick={handleThreatClick}>
              {highCount > 0 && (
                <div className="threat-badge threat-badge-high" title={`${highCount} High Risk Threat${highCount > 1 ? 's' : ''}`}>
                  {highCount}
                </div>
              )}
              {mediumCount > 0 && (
                <div className="threat-badge threat-badge-medium" title={`${mediumCount} Medium Risk Threat${mediumCount > 1 ? 's' : ''}`}>
                  {mediumCount}
                </div>
              )}
              {lowCount > 0 && (
                <div className="threat-badge threat-badge-low" title={`${lowCount} Low Risk Threat${lowCount > 1 ? 's' : ''}`}>
                  {lowCount}
                </div>
              )}
            </div>
          )}

          {/* Threat popup menu when indicator is clicked */}
          {showThreatPopup && hasThreat && (
            <div className="absolute top-[-120px] right-[-10px] z-50 bg-white rounded-md shadow-lg border border-gray-200 p-2 w-60 text-xs">
              <div className="font-bold mb-1.5 text-gray-800">Security Threats</div>
              {highCount > 0 && (
                <div className="flex items-center mb-1.5 text-red-600">
                  <AlertTriangle className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{highCount} High Risk Threat{highCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {mediumCount > 0 && (
                <div className="flex items-center mb-1.5 text-amber-600">
                  <AlertCircle className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{mediumCount} Medium Risk Threat{mediumCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {lowCount > 0 && (
                <div className="flex items-center mb-1.5 text-blue-600">
                  <Info className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{lowCount} Low Risk Threat{lowCount > 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="mt-2 w-full text-center">
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] px-2 py-1 rounded-sm transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThreatPopup(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
          </div>

          {/* Connection handles */}
          <Handle
            id="cloudInput"
            type="target"
            position={Position.Left}
            className="!w-2 !h-2 !border-2 !border-black !bg-white"
          />
          <Handle
            id="cloudOutput"
            type="source"
            position={Position.Right}
            className="!w-2 !h-2 !border-2 !border-black !bg-white"
          />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-white/90 backdrop-blur-sm p-3 shadow-lg rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-1">{data.label}</h4>
        {data.description && <p className="text-sm text-gray-600">{data.description}</p>}
      </TooltipContent>
    </Tooltip>
  );
};

const SecretNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  const [showThreatPopup, setShowThreatPopup] = useState(false);
  // Get threat count by severity
  const highCount = data.threats?.filter(t => t.severity === 'HIGH').length || 0;
  const mediumCount = data.threats?.filter(t => t.severity === 'MEDIUM').length || 0;
  const lowCount = data.threats?.filter(t => t.severity === 'LOW').length || 0;

  const hasThreat = highCount > 0 || mediumCount > 0 || lowCount > 0;

  // Create tooltip content
  const threatToolTip = hasThreat ?
    `${highCount > 0 ? `${highCount} High Risk` : ''}${highCount > 0 && (mediumCount > 0 || lowCount > 0) ? ', ' : ''}${mediumCount > 0 ? `${mediumCount} Medium Risk` : ''}${mediumCount > 0 && lowCount > 0 ? ', ' : ''}${lowCount > 0 ? `${lowCount} Low Risk` : ''}`
    : '';

  // Handle threat badge click
  const handleThreatClick = (e) => {
    e.stopPropagation();
    setShowThreatPopup(!showThreatPopup);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex flex-col items-center justify-center relative group`}>
          {/* Data store with only top and bottom borders */}
          <div
            className={`w-24 h-16 flex items-center justify-center 
          bg-white
          ${selected ? 'ring-2 ring-black' : ''}`}
            style={{
              position: 'relative',
              background: 'white !important',
              backgroundImage: 'none !important',
              backgroundColor: 'white !important'
            }}
          >
            {/* Only top and bottom borders */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-black"></div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black"></div>

            {/* Label in the middle */}
            <div className="text-xs font-semibold text-center max-w-[80px] break-words">
              {data.label}
            </div>

            {/* Threat indicators */}
          {hasThreat && (
            <div className="threat-indicator" title={threatToolTip} onClick={handleThreatClick}>
              {highCount > 0 && (
                <div className="threat-badge threat-badge-high" title={`${highCount} High Risk Threat${highCount > 1 ? 's' : ''}`}>
                  {highCount}
                </div>
              )}
              {mediumCount > 0 && (
                <div className="threat-badge threat-badge-medium" title={`${mediumCount} Medium Risk Threat${mediumCount > 1 ? 's' : ''}`}>
                  {mediumCount}
                </div>
              )}
              {lowCount > 0 && (
                <div className="threat-badge threat-badge-low" title={`${lowCount} Low Risk Threat${lowCount > 1 ? 's' : ''}`}>
                  {lowCount}
                </div>
              )}
            </div>
          )}

          {/* Threat popup menu when indicator is clicked */}
          {showThreatPopup && hasThreat && (
            <div className="absolute top-[-120px] right-[-10px] z-50 bg-white rounded-md shadow-lg border border-gray-200 p-2 w-60 text-xs">
              <div className="font-bold mb-1.5 text-gray-800">Security Threats</div>
              {highCount > 0 && (
                <div className="flex items-center mb-1.5 text-red-600">
                  <AlertTriangle className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{highCount} High Risk Threat{highCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {mediumCount > 0 && (
                <div className="flex items-center mb-1.5 text-amber-600">
                  <AlertCircle className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{mediumCount} Medium Risk Threat{mediumCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {lowCount > 0 && (
                <div className="flex items-center mb-1.5 text-blue-600">
                  <Info className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">{lowCount} Low Risk Threat{lowCount > 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="mt-2 w-full text-center">
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] px-2 py-1 rounded-sm transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThreatPopup(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
          </div>

          {/* Connection handles */}
          <Handle
            id="secretInput"
            type="target"
            position={Position.Left}
            className="!w-2 !h-2 !border-2 !border-black !bg-white"
          />
          <Handle
            id="secretOutput"
            type="source"
            position={Position.Right}
            className="!w-2 !h-2 !border-2 !border-black !bg-white"
          />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-white/90 backdrop-blur-sm p-3 shadow-lg rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-1">{data.label}</h4>
        {data.description && <p className="text-sm text-gray-600">{data.description}</p>}
      </TooltipContent>
    </Tooltip>
  );
};

// Boundary node with straight red dotted lines
const BoundaryNode: React.FC<{ data: NodeData }> = ({ data }) => {
  return (
    <div className="h-[1300px] w-0 border-l-2 border-dashed border-red-500 flex items-top justify-center relative">
      <div className="absolute bg-white  text-xs font-semibold text-red-500 whitespace-nowrap" style={{ left: '-30px' }}>
        {data.label}
      </div>
    </div>
  );
};

// Define interface
interface DFDVisualizationProps {
  dfdData: DFDData;
  reactFlowInstanceRef?: React.MutableRefObject<any>;
}

// Enhanced threat panel component with more modern styling
const ThreatPanel: React.FC<{
  threats: ThreatItem[],
  onThreatSelect: (threat: ThreatItem | null) => void,
  selectedThreat: ThreatItem | null,
  selectedNode: Node | null
}> = ({ threats, onThreatSelect, selectedThreat, selectedNode }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string | null>('ALL'); // Set default to 'ALL'
  const [isMinimized, setIsMinimized] = useState(false);

  // Check if a threat targets a specific node
  const threatTargetsNode = (threat, nodeId) => {
    if (!threat || !nodeId) return false;

    if (threat.target_elements && Array.isArray(threat.target_elements) && threat.target_elements.length > 0) {
      return threat.target_elements.includes(nodeId);
    }

    // Fallback: Check if threat description mentions the node ID
    if (threat.description && typeof threat.description === 'string') {
      return threat.description.toLowerCase().includes(nodeId.toLowerCase());
    }

    return false;
  };

  if (!threats || threats.length === 0) return null;

  // Sort threats by severity (HIGH, MEDIUM, LOW)
  const sortedThreats = [...threats].sort((a, b) => {
    const severityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
    const aSeverity = (a.severity || 'MEDIUM').toUpperCase();
    const bSeverity = (b.severity || 'MEDIUM').toUpperCase();
    return severityOrder[aSeverity] - severityOrder[bSeverity];
  });

  // Group threats by severity for better organization
  const highThreats = sortedThreats.filter(t => (t.severity || 'MEDIUM').toUpperCase() === 'HIGH');
  const mediumThreats = sortedThreats.filter(t => (t.severity || 'MEDIUM').toUpperCase() === 'MEDIUM');
  const lowThreats = sortedThreats.filter(t => (t.severity || 'MEDIUM').toUpperCase() === 'LOW');

  // Filter threats based on current filter and search term
  const filteredThreats = sortedThreats.filter(threat => {
    // Apply severity filter
    if (severityFilter !== null && severityFilter !== 'ALL' && (threat.severity || 'MEDIUM').toUpperCase() !== severityFilter) {
      return false;
    }

    // Apply node filter if selected
    if (severityFilter === 'NODE') {
      if (!selectedNode || !threatTargetsNode(threat, selectedNode.id)) {
        return false;
      }
    }

    // Apply search term filter if present
    if (searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase();
      const description = (threat.description || '').toLowerCase();
      const id = (threat.id || '').toLowerCase();
      const mitigation = (threat.mitigation || '').toLowerCase();

      return description.includes(search) || id.includes(search) || mitigation.includes(search);
    }

    return true;
  });

  // Get the count of threats for the selected node
  const selectedNodeThreatsCount = selectedNode ?
    threats.filter(t => threatTargetsNode(t, selectedNode.id)).length : 0;

  // If panel is minimized, show a condensed version
  if (isMinimized) {
    return (
      <div className="absolute top-2 left-2 z-10 bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl threat-panel-transition" style={{ animation: 'slideIn 0.3s forwards' }}>
        <div
          className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 border-b border-gray-200 flex items-center justify-between cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <div className="text-xs font-bold flex items-center">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-red-600" />
            <span className={highThreats.length > 0 ? "threat-badge-pulse text-red-600" : ""}>{highThreats.length} High</span>
            <span className="mx-1">•</span>
            <span>{mediumThreats.length} Medium</span>
            <span className="mx-1">•</span>
            <span>{lowThreats.length} Low</span>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Add a handler to select a threat and trigger zooming
  const handleThreatCardSelect = (threat: ThreatItem) => {
    // Call the parent handler which will handle zooming
    onThreatSelect(selectedThreat?.id === threat.id ? null : threat);
  };

  return (
    <div className="absolute top-2 left-2 z-10 bg-white rounded-lg shadow-md overflow-hidden w-80 border border-gray-100 transition-all duration-300 hover:shadow-xl threat-panel-transition" style={{ animation: 'slideIn 0.3s forwards' }}>
      <div
        className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 border-b border-gray-200 flex justify-between items-center"
      >
        <div
          className="text-xs font-bold flex items-center cursor-pointer"
          onClick={() => setIsMinimized(true)}
        >
          <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-red-600" />
          Security Issues ({threats.length})
          {isMinimized ?
            <ChevronUp className="w-4 h-4 ml-1 text-gray-400" /> :
            <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />
          }
        </div>
        <div className="flex items-center">
          <button
            className="text-gray-400 hover:text-gray-600 mr-1"
            onClick={() => setIsMinimized(true)}
            title="Minimize"
          >
            <ArrowRightCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search and filter controls */}
      <div className="p-2 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center mb-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search threats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs py-1.5 pl-6 pr-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm('')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex -mx-0.5 mb-1">
          <button
            className={`text-[10px] flex-1 mx-0.5 py-1 rounded-md transition-colors ${severityFilter === 'ALL' ? 'bg-gray-200 text-gray-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setSeverityFilter('ALL')}
          >
            All
          </button>
          <button
            className={`text-[10px] flex-1 mx-0.5 py-1 rounded-md transition-colors ${severityFilter === 'HIGH' ? 'bg-red-100 text-red-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
            onClick={() => setSeverityFilter('HIGH')}
          >
            <span className="flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
              High ({highThreats.length})
            </span>
          </button>
          <button
            className={`text-[10px] flex-1 mx-0.5 py-1 rounded-md transition-colors ${severityFilter === 'MEDIUM' ? 'bg-amber-100 text-amber-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-amber-50'}`}
            onClick={() => setSeverityFilter('MEDIUM')}
          >
            <span className="flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1"></span>
              Medium ({mediumThreats.length})
            </span>
          </button>
          <button
            className={`text-[10px] flex-1 mx-0.5 py-1 rounded-md transition-colors ${severityFilter === 'LOW' ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}
            onClick={() => setSeverityFilter('LOW')}
          >
            <span className="flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></span>
              Low ({lowThreats.length})
            </span>
          </button>
        </div>

        {/* Node filter - only shown when a node is selected */}
        {selectedNode && (
          <button
            className={`text-[10px] w-full py-1 rounded-md transition-colors mt-1 flex items-center justify-center ${severityFilter === 'NODE' ? 'bg-indigo-100 text-indigo-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'}`}
            onClick={() => setSeverityFilter(severityFilter === 'NODE' ? 'ALL' : 'NODE')}
          >
            <div className="p-0.5 rounded-full bg-indigo-100 mr-1">
              <div className={`w-2 h-2 rounded-full ${severityFilter === 'NODE' ? 'bg-indigo-500' : 'bg-gray-400'}`}></div>
            </div>
            {severityFilter === 'NODE' ? (
              <span>Show All Threats</span>
            ) : (
              <span>
                Filter by Selected Node:
                <span className="font-medium ml-1">
                  {selectedNodeThreatsCount} Threat{selectedNodeThreatsCount !== 1 ? 's' : ''}
                </span>
              </span>
            )}
          </button>
        )}
      </div>

      {/* Threat list content - max height to avoid overlapping with chat toggle */}
      <div className="p-3 max-h-80 overflow-y-auto overflow-x-hidden">
        {filteredThreats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-gray-500">
            <AlertCircle className="h-8 w-8 mb-2 text-gray-300" />
            <p className="text-xs">No threats match your criteria</p>
            {searchTerm && (
              <button
                className="mt-2 text-[10px] text-blue-600 hover:text-blue-800"
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </button>
            )}
            {severityFilter !== 'ALL' && (
              <button
                className="mt-1 text-[10px] text-blue-600 hover:text-blue-800"
                onClick={() => setSeverityFilter('ALL')}
              >
                Show all severities
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredThreats.map(threat => (
              <ThreatCard
                key={threat.id}
                threat={threat}
                severity={threat.severity || 'MEDIUM'}
                isSelected={selectedThreat?.id === threat.id}
                onSelect={() => handleThreatCardSelect(threat)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Separate component for individual threat cards with enhanced styling
const ThreatCard: React.FC<{
  threat: ThreatItem,
  severity: string,
  isSelected?: boolean,
  onSelect?: () => void
}> = ({ threat, severity, isSelected = false, onSelect = () => { } }) => {
  const getSeverityStyle = (sev: string) => {
    switch (sev.toUpperCase()) {
      case 'HIGH':
        return 'border-red-200 bg-gradient-to-r from-red-50 to-white';
      case 'MEDIUM':
        return 'border-amber-200 bg-gradient-to-r from-amber-50 to-white';
      case 'LOW':
        return 'border-blue-200 bg-gradient-to-r from-blue-50 to-white';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getSeverityIconStyle = (sev: string) => {
    switch (sev.toUpperCase()) {
      case 'HIGH':
        return (
          <div className="p-1 rounded-full bg-red-100 mr-1">
            <AlertCircle className="h-3 w-3 text-red-600" />
          </div>
        );
      case 'MEDIUM':
        return (
          <div className="p-1 rounded-full bg-amber-100 mr-1">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
          </div>
        );
      case 'LOW':
        return (
          <div className="p-1 rounded-full bg-blue-100 mr-1">
            <Info className="h-3 w-3 text-blue-600" />
          </div>
        );
      default:
        return (
          <div className="p-1 rounded-full bg-gray-100 mr-1">
            <Info className="h-3 w-3 text-gray-600" />
          </div>
        );
    }
  };

  const getSeverityBadgeStyle = (sev: string) => {
    switch (sev.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Always ensure we have mitigation text
  const mitigationText = threat.mitigation || 'No mitigation specified';

  // Get target elements
  const targetElements = threat.target_elements || [];

  // Get threat type and impact from properties
  const threatType = threat.properties?.threat_type as string || 'UNKNOWN';
  const impact = threat.properties?.impact as string || 'Unknown impact';

  return (
    <div
      className={`relative overflow-hidden rounded-md border ${isSelected ? getSeverityStyle(severity) : 'border-gray-200 bg-white'} shadow-sm hover:shadow transition duration-200 cursor-pointer threat-card-hover-effect`}
      onClick={onSelect}
    >
      <div className="px-2.5 py-2 flex items-start">
        {/* Severity icon */}
        {getSeverityIconStyle(severity)}

        <div className="flex-1 min-w-0">
          {/* ID and Title (Description) */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-gray-500 font-mono">{threat.id}</span>
          </div>

          <div className="group relative">
            <p className="font-medium line-clamp-2 text-gray-900 mb-1 relative">
              {threat.description}
            </p>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute z-50 w-72 bg-white text-gray-800 text-[11px] rounded-md shadow-xl p-3 pointer-events-none left-1/2 transform -translate-x-1/2 -translate-y-full border border-gray-300 leading-relaxed top-0 mt-[-5px]">
              {threat.description}
              <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-r border-b border-gray-300"></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border ${getSeverityBadgeStyle(severity)}`}>
              {severity.toUpperCase()}
            </span>
            <span className="text-[9px] bg-violet-100 text-violet-800 px-1.5 py-0.5 rounded border border-violet-200">
              {threatType}
            </span>
          </div>
        </div>
      </div>

      <div className="px-2.5 pb-2 pt-1 border-t border-gray-100 bg-white">
        {/* Show mitigation */}
        <div className="mt-1">
          <div className="flex items-center mb-1">
            <Shield className="h-3 w-3 text-green-600 mr-1" />
            <span className="text-[10px] font-semibold text-gray-700">Mitigation:</span>
          </div>
          <p className="text-[10px] text-gray-600 bg-green-50 p-1.5 rounded border border-green-100">
            {mitigationText}
          </p>
        </div>

        {/* Show impact */}
        <div className="mt-1">
          <div className="flex items-center mb-1">
            <Activity className="h-3 w-3 text-red-600 mr-1" />
            <span className="text-[10px] font-semibold text-gray-700">Impact:</span>
          </div>
          <p className="text-[10px] text-gray-600 bg-red-50 p-1.5 rounded border border-red-100">
            {impact}
          </p>
        </div>

        {/* Target elements info if available */}
        {targetElements.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center mb-1">
              <Target className="h-3 w-3 text-blue-600 mr-1" />
              <span className="text-[10px] font-semibold text-gray-700">Targets:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {targetElements.map((target, idx) => (
                <span key={idx} className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                  {target}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Node detail panel that shows details about the selected node
const NodeDetailPanel: React.FC<{
  selectedNode: Node | null,
  nodes: Node[],
  edges: Edge[],
  threats: ThreatItem[],
  onClose: () => void
}> = ({ selectedNode, nodes, edges, threats, onClose }) => {
  // Type assertion to fix 'unknown' type error
  const nodeData = selectedNode?.data as unknown as NodeData;

  if (!selectedNode) return null;

  // Helper function to check if a threat targets a specific node
  const threatTargetsNode = (threat, nodeId) => {
    if (!threat || !nodeId) return false;

    if (threat.target_elements && Array.isArray(threat.target_elements) && threat.target_elements.length > 0) {
      return threat.target_elements.includes(nodeId);
    }

    // Fallback: Check if threat description mentions the node ID
    if (threat.description && typeof threat.description === 'string') {
      return threat.description.toLowerCase().includes(nodeId.toLowerCase());
    }

    return false;
  };

  // Get threat details for this node
  const nodeThreats = threats.filter(t => threatTargetsNode(t, selectedNode.id));
  const hasCriticalThreats = nodeThreats.some(t => (t.severity || '').toLowerCase() === 'high');

  // Get connected nodes (both incoming and outgoing)
  const incomingEdges = edges.filter(e => e.target === selectedNode.id);
  const outgoingEdges = edges.filter(e => e.source === selectedNode.id);

  // Map to get node data from IDs
  const nodeMap = new Map();
  nodes.forEach(node => nodeMap.set(node.id, node));

  // Get incoming and outgoing nodes
  const incomingNodes = incomingEdges.map(e => nodeMap.get(e.source)).filter(Boolean);
  const outgoingNodes = outgoingEdges.map(e => nodeMap.get(e.target)).filter(Boolean);

  // Calculate position relative to the node
  const nodePosition = selectedNode.position;
  const panelStyle = {
    position: 'absolute' as 'absolute',
    left: `${nodePosition.x + 40}px`, // Position panel closer to the node (was +100px)
    top: `${nodePosition.y - 20}px`, // Move panel slightly below the original position (was -50px)
    zIndex: 1000
  };

  return (
    <div style={panelStyle} className="bg-white rounded-lg shadow-lg overflow-hidden w-72 border border-gray-100">
      <div className={`px-3 py-2 border-b border-gray-200 flex items-center justify-between ${hasCriticalThreats
        ? 'bg-gradient-to-r from-red-50 to-red-100'
        : 'bg-gradient-to-r from-gray-50 to-gray-100'
        }`}>
        <div className="flex items-center">
          <div className={`p-1.5 rounded-full ${hasCriticalThreats ? 'bg-red-100' : 'bg-blue-100'} mr-2`}>
            {getNodeIcon(selectedNode.type, 4)}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">
              {nodeData?.label || 'Node Details'}
            </div>
            <div className="text-xs text-gray-500">
              {selectedNode.type?.replace('Node', '') || 'Unknown type'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {nodeThreats.length > 0 && (
            <div className={`text-xs font-semibold px-1.5 py-0.5 rounded ${hasCriticalThreats ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
              }`}>
              {nodeThreats.length} {nodeThreats.length === 1 ? 'Issue' : 'Issues'}
            </div>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-3 max-h-96 overflow-auto">
        {/* Description */}
        {nodeData?.description && (
          <div className="text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded-md border border-gray-100">
            {nodeData.description}
          </div>
        )}

        {/* Threats summary */}
        <div className="mb-3">
          <div className="text-xs font-semibold mb-1 flex items-center">
            <Shield className="w-3.5 h-3.5 mr-1 text-gray-500" />
            Security Issues:
          </div>
          {nodeThreats.length === 0 ? (
            <div className="text-xs text-gray-500 italic bg-gray-50 p-1.5 rounded">No known issues</div>
          ) : (
            <div className="flex gap-2 bg-gray-50 p-1.5 rounded">
              <div className="flex items-center text-xs text-red-600">
                <AlertCircle className="w-3 h-3 mr-0.5" />
                {nodeThreats.filter(t => (t.severity || '').toLowerCase() === 'high').length}
              </div>
              <div className="flex items-center text-xs text-amber-600">
                <AlertTriangle className="w-3 h-3 mr-0.5" />
                {nodeThreats.filter(t => (t.severity || '').toLowerCase() === 'medium').length}
              </div>
              <div className="flex items-center text-xs text-blue-600">
                <Shield className="w-3 h-3 mr-0.5" />
                {nodeThreats.filter(t => (t.severity || '').toLowerCase() === 'low').length}
              </div>
            </div>
          )}
        </div>

        {/* Connected nodes */}
        <div className="space-y-3">
          {/* Incoming connections */}
          {incomingNodes.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1 flex items-center">
                <ArrowRightCircle className="w-3.5 h-3.5 mr-1 text-gray-500 rotate-180" />
                Incoming from:
              </div>
              <div className="space-y-1">
                {incomingNodes.map((node, idx) => (
                  <div key={`in-${idx}`} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 px-2 py-1.5 rounded border border-gray-100">
                    <div className="flex items-center">
                      {getNodeIcon(node.type, 3)}
                      <span className="ml-1">{node.data?.label}</span>
                    </div>
                    <div className={`text-[9px] px-1 py-0.5 rounded ${node.type === 'processNode' ? 'bg-blue-100 text-blue-700' :
                      node.type === 'dataStoreNode' ? 'bg-cyan-100 text-cyan-700' :
                        node.type === 'entityNode' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-gray-100 text-gray-700'
                      }`}>
                      {node.type?.replace('Node', '')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outgoing connections */}
          {outgoingNodes.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1 flex items-center">
                <ArrowRightCircle className="w-3.5 h-3.5 mr-1 text-gray-500" />
                Outgoing to:
              </div>
              <div className="space-y-1">
                {outgoingNodes.map((node, idx) => (
                  <div key={`out-${idx}`} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 px-2 py-1.5 rounded border border-gray-100">
                    <div className="flex items-center">
                      {getNodeIcon(node.type, 3)}
                      <span className="ml-1">{node.data?.label}</span>
                    </div>
                    <div className={`text-[9px] px-1 py-0.5 rounded ${node.type === 'processNode' ? 'bg-blue-100 text-blue-700' :
                      node.type === 'dataStoreNode' ? 'bg-cyan-100 text-cyan-700' :
                        node.type === 'entityNode' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-gray-100 text-gray-700'
                      }`}>
                      {node.type?.replace('Node', '')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to get the appropriate icon based on node type
function getNodeIcon(nodeType: string, size = 4) {
  const className = `w-${size} h-${size}`;

  switch (nodeType) {
    case 'processNode':
      return <Server className={className} />;
    case 'entityNode':
      return <User className={className} />;
    case 'dataStoreNode':
      return <Database className={className} />;
    case 'externalNode':
      return <Globe className={className} />;
    case 'cloudServiceNode':
      return <Cloud className={className} />;
    case 'secretNode':
      return <Key className={className} />;
    default:
      return <Server className={className} />;
  }
}

// // Helper function to get the zone color for a node based on boundary
// const getZoneColorForNode = (node, nodes, zones) => {
//   if (!node || !zones) return { color: 'transparent', zone: 'other' };

//   // Check if zones is an array we can iterate through
//   if (Array.isArray(zones)) {
//     // Find what zone the node belongs to based on the boundary elements
//     for (const zone of zones) {
//       if (zone.element_ids && zone.element_ids.includes(node.id)) {
//         // Return plain white background with no transparency for all zone types
//         return { color: 'transparent', zone: zone.label.toLowerCase() };
//       }
//     }
//   } else if (typeof zones === 'object') {
//     // Handle case where zones is an object with zone properties
//     // Return transparent backgrounds for all zones
//     if (zones.external && isNodeInZone(node, zones.external)) {
//       return { color: 'transparent', zone: 'external' };
//     } else if (zones.data && isNodeInZone(node, zones.data)) {
//       return { color: 'transparent', zone: 'data' };
//     } else if (zones.application && isNodeInZone(node, zones.application)) {
//       return { color: 'transparent', zone: 'application' };
//     }
//   }

//   // If not found in any zone, return transparent for all node types
//   return {
//     color: 'transparent',
//     zone: 'other'
//   };
// };

// // Helper function to check if a node is within a zone area
// const isNodeInZone = (node, zone) => {
//   if (!node || !node.position || !zone) return false;

//   const { x, y } = node.position;
//   return x >= zone.x && x <= zone.x + zone.width && 
//          y >= zone.y && y <= zone.y + zone.height;
// };

// const DFDVisualization: React.FC<DFDVisualizationProps> = ({ dfdData, reactFlowInstanceRef }) => {
// console.log("DFD Visualization Data:", dfdData);
const DFDVisualization: React.FC<DFDVisualizationProps> = ({ reactFlowInstanceRef }) => {
  const { toast } = useToast();
  const localReactFlowInstance = useRef(null);
  const [layoutApplied, setLayoutApplied] = useState(false);
  const isLayoutingRef = useRef(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedThreat, setSelectedThreat] = useState<ThreatItem | null>(null);

  // Use the passed ref if available, otherwise use the local one
  const actualReactFlowInstance = reactFlowInstanceRef || localReactFlowInstance;

  // Track toolbar open/closed state
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const toolbarOpenRef = useRef(isToolbarOpen);

  // Add state for minimap visibility with localStorage persistence
  const [showMinimap, setShowMinimap] = useState(() => {
    // Try to get the stored preference from localStorage
    const storedPreference = localStorage.getItem('diagramMinimapVisible');
    // If there's a stored preference, use it; otherwise default to true
    return storedPreference === null ? true : storedPreference === 'true';
  });

  // Toggle minimap visibility and save to localStorage
  const toggleMinimap = useCallback(() => {
    setShowMinimap(prev => {
      const newValue = !prev;
      localStorage.setItem('diagramMinimapVisible', String(newValue));
      return newValue;
    });
  }, []);

  // Add a style tag to globally hide all edge labels and fix handle styles
  React.useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      .react-flow__edge-text-wrapper,
      .react-flow__edge-text,
      .react-flow__edge-textbg {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      
      .react-flow__handle {
        width: 6px !important;
        height: 6px !important;
        border-radius: 50% !important;
        background-color: white !important;
        border: 2px solid black !important;
      }
      
      .react-flow__node {
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }
      
      .react-flow__pane {
        background-color: white !important;
        background-image: none !important;
      }
      
      .react-flow__node > div {
        background: white !important;
        background-image: none !important;
        background-color: white !important;
      }
      
      .react-flow__edge path {
        stroke: #919191 !important;
        stroke-width: 1.5px !important;
      }
      
      .react-flow__edge-path {
        stroke: #919191 !important;
        stroke-width: 1.5px !important;
      }
      
      .react-flow__edge-text {
        fill: black !important;
        font-weight: 600 !important;
      }
      
      .react-flow__edge-textbg {
        fill: white !important;
      }
      
      /* Threat indicator badges */
      .threat-indicator {
        position: absolute;
        top: -8px;
        right: -8px;
        display: flex;
        align-items: center;
        z-index: 30;
        filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.25));
      }
      
      .threat-badge {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        margin-left: -5px;
        border: 1px solid rgba(255, 255, 255, 0.8);
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;
      }
      
      .threat-badge:hover {
        transform: scale(1.2);
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
      }
      
      .threat-badge-high {
        background-color: #ef4444;
        z-index: 30;
        animation: pulse 2s infinite;
      }
      
      .threat-badge-medium {
        background-color: #f97316;
        z-index: 20;
      }
      
      .threat-badge-low {
        background-color: #3b82f6;
        z-index: 10;
      }
      
      /* Pulsing animation for critical threats */
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
        }
        70% {
          box-shadow: 0 0 0 8px rgba(220, 38, 38, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
        }
      }
      
      .pulse-animation {
        animation: pulse 2s infinite;
      }
      
      /* Slide in/out animation for the threat panel */
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      
      /* Threat count badge animation */
      @keyframes badgePulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      
      .threat-badge-pulse {
        animation: badgePulse 1.5s ease-in-out infinite;
      }
      
      /* Hover animations for threat cards */
      .threat-card-hover-effect {
        transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
      }
      
      .threat-card-hover-effect:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      
      /* Minimize/maximize transition for the threat panel */
      .threat-panel-transition {
        transition: width 0.3s ease-out, height 0.3s ease-out, opacity 0.3s ease-out;
      }
    `;
    document.head.appendChild(styleTag);

    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  const dfdData = dummyDFDData;


  if (!dfdData || !dfdData.threat_model_id) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Threat Model Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Switch back to Architecture Diagram mode and design your system first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data from dfdData
  let { nodes: dfdNodes = [], edges: dfdEdges = [], trustBoundaries = [], threats = [] } = dfdData;

  // Add sample threats for testing if no threats are present
  if (threats.length === 0 && dfdNodes.length > 0) {
    const criticalNodes = [
      'primary_db',
      'auth_server',
      'web_portal_servers',
      'transaction_processor',
      'secure_data_vault'
    ];

    const sampleThreats = [
      {
        id: "THREAT-1",
        description: "SQL Injection vulnerability in database access",
        mitigation: "Use parameterized queries and input validation",
        severity: "HIGH",
        target_elements: ["primary_db", "db_firewall"],
        properties: {
          threat_type: "Injection",
          attack_vector: "Web application",
          impact: "Data theft and corruption"
        }
      },
      {
        id: "THREAT-2",
        description: "Insufficient authentication controls on admin interface",
        mitigation: "Implement MFA and rate limiting",
        severity: "HIGH",
        target_elements: ["admin_jump_server", "auth_server"],
        properties: {
          threat_type: "Broken Authentication",
          attack_vector: "Admin portal",
          impact: "Unauthorized access to administration"
        }
      },
      {
        id: "THREAT-3",
        description: "Unencrypted data in transit between application and database",
        mitigation: "Implement TLS for all internal communications",
        severity: "MEDIUM",
        target_elements: ["app_firewall", "transaction_processor", "db_firewall"],
        properties: {
          threat_type: "Sensitive Data Exposure",
          attack_vector: "Network sniffing",
          impact: "Data theft"
        }
      }
    ];

    // Filter sample threats to include only those targeting nodes that exist in the diagram
    const matchingThreats = sampleThreats.filter(threat =>
      threat.target_elements?.some(targetId =>
        dfdNodes.some(node => node.id === targetId)
      )
    );

    if (matchingThreats.length > 0) {
      threats = matchingThreats;
    } else {
      // If no threats match existing nodes, create some based on the nodes we have
      // Find nodes that might be critical based on id patterns
      const potentialTargets = dfdNodes
        .filter(node =>
          criticalNodes.some(criticalPattern =>
            node.id.toLowerCase().includes(criticalPattern.toLowerCase())
          )
        )
        .map(node => node.id);

      // If we found potential targets, create threats for them
      if (potentialTargets.length > 0) {
        threats = [
          {
            id: "THREAT-AUTO-1",
            description: `Security vulnerability in ${potentialTargets[0]}`,
            mitigation: "Implement security controls and regular security testing",
            severity: "HIGH",
            target_elements: [potentialTargets[0]],
            properties: {
              threat_type: "Vulnerability",
              attack_vector: "Application layer",
              impact: "System compromise"
            }
          }
        ];

        // Add a second threat if we have more targets
        if (potentialTargets.length > 1) {
          threats.push({
            id: "THREAT-AUTO-2",
            description: `Insecure data handling in ${potentialTargets[1]}`,
            mitigation: "Implement data encryption and access controls",
            severity: "MEDIUM",
            target_elements: [potentialTargets[1]],
            properties: {
              threat_type: "Data Exposure",
              attack_vector: "Application layer",
              impact: "Data theft"
            }
          });
        }
      }
    }
  }

  // Map threats to nodes
  const nodeThreatsMap = useMemo(() => {
    const map: { [key: string]: ThreatItem[] } = {};
    // Initialize an empty array for each node
    dfdNodes.forEach((node: any) => {
      map[node.id] = [];
    });
    // Assign threats to nodes based on target_elements
    threats.forEach((threat: ThreatItem) => {
      if (threat.target_elements) {
        threat.target_elements.forEach((nodeId) => {
          if (map[nodeId]) {
            map[nodeId].push(threat);
          }
        });
      }
    });
    return map;
  }, [dfdNodes, threats]);

  /** Function to get Dagre layout for nodes */
  const getDagreLayout = (
    nodes: Node[],
    edges: Edge[],
    trustBoundaries: { id: string; x: number }[],
    direction: string = 'LR'
  ) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setGraph({ rankdir: direction, ranksep: 200, nodesep: 250 });

    dagreGraph.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
      if (node.type !== 'boundaryNode') {
        const width = node.type === 'processNode' ? 96 : 96;
        const height = node.type === 'processNode' ? 96 : 64;
        dagreGraph.setNode(node.id, { width, height });
      }
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    // Group nodes by their boundary range to determine Dagre's x-position range within each zone
    const nodesByBoundaryRange: { [key: string]: { node: Node; dagreX: number }[] } = {};
    nodes.forEach((node) => {
      if (node.type === 'boundaryNode') return;
      const dfdNode = dummyDFDData.nodes.find((n: any) => n.id === node.id);
      if (!dfdNode) return;
      const rangeKey = `${dfdNode.left_boundary}-${dfdNode.right_boundary}`;
      const nodeWithPosition = dagreGraph.node(node.id);
      if (nodeWithPosition) {
        (nodesByBoundaryRange[rangeKey] = nodesByBoundaryRange[rangeKey] || []).push({
          node,
          dagreX: nodeWithPosition.x,
        });
      }
    });

    // Compute the min and max Dagre x-positions for each boundary range
    const xRanges: { [key: string]: { minX: number; maxX: number } } = {};
    Object.entries(nodesByBoundaryRange).forEach(([rangeKey, boundaryNodes]) => {
      const dagreXs = boundaryNodes.map((n) => n.dagreX);
      xRanges[rangeKey] = {
        minX: Math.min(...dagreXs),
        maxX: Math.max(...dagreXs),
      };
    });

    // Map Dagre positions to React Flow nodes, scaling x-positions within each zone
    let positionedNodes = nodes.map((node) => {
      if (node.type === 'boundaryNode') {
        return node;
      }

      const nodeWithPosition = dagreGraph.node(node.id);
      if (!nodeWithPosition) return node;

      const dfdNode = dummyDFDData.nodes.find((n: any) => n.id === node.id);
      if (!dfdNode) return node;

      const leftBoundaryX = trustBoundaries.find((tb) => tb.id === dfdNode.left_boundary)?.x || 0;
      const rightBoundaryX = trustBoundaries.find((tb) => tb.id === dfdNode.right_boundary)?.x || 0;
      const nodeWidth = node.type === 'processNode' ? 96 : 96;

      // Define the usable range for the node's center, with padding of 60px
      const padding = 60;
      const minX = leftBoundaryX + nodeWidth / 2 + padding;
      const maxX = rightBoundaryX - nodeWidth / 2 - padding;
      let adjustedX: number;

      const rangeKey = `${dfdNode.left_boundary}-${dfdNode.right_boundary}`;
      const xRange = xRanges[rangeKey];
      const dagreX = nodeWithPosition.x;

      if (xRange.maxX === xRange.minX) {
        adjustedX = (minX + maxX) / 2;
      } else {
        const dagreRange = xRange.maxX - xRange.minX;
        const zoneRange = maxX - minX;
        adjustedX = minX + ((dagreX - xRange.minX) / dagreRange) * zoneRange;

        const minDistanceFromBoundary = 60;
        adjustedX = Math.min(adjustedX, maxX - minDistanceFromBoundary);
      }

      // Initial clamping
      adjustedX = Math.max(minX, Math.min(maxX, adjustedX));

      return {
        ...node,
        position: {
          x: adjustedX,
          y: nodeWithPosition.y - (node.type === 'processNode' ? 48 : 32),
        },
      };
    });

    // Adjust y-positions and x-positions within each boundary range
    const nodesByBoundaryRangeForY: { [key: string]: Node[] } = {};
    positionedNodes.forEach((node) => {
      if (node.type === 'boundaryNode') return;
      const dfdNode = dummyDFDData.nodes.find((n: any) => n.id === node.id);
      if (!dfdNode) return;
      const rangeKey = `${dfdNode.left_boundary}-${dfdNode.right_boundary}`;
      (nodesByBoundaryRangeForY[rangeKey] = nodesByBoundaryRangeForY[rangeKey] || []).push(node);
    });

    Object.entries(nodesByBoundaryRangeForY).forEach(([rangeKey, boundaryNodes]) => {
      // Sort nodes by their Dagre-assigned y-position
      boundaryNodes.sort((a, b) => a.position.y - b.position.y);

      // Determine nodes per row based on the zone
      const nodesPerRow = rangeKey === 'tb1-tb2' || rangeKey === 'tb2-tb3' ? 1 : 1;
      boundaryNodes.forEach((node, index) => {
        const row = Math.floor(index / nodesPerRow);
        const spacing = 200; // Increased vertical spacing
        node.position.y = row * spacing + 50;
      });

      // Within each row, adjust x-positions
      const nodesByRow: { [row: number]: Node[] } = {};
      boundaryNodes.forEach((node) => {
        const row = Math.floor((node.position.y - 50) / 200);
        (nodesByRow[row] = nodesByRow[row] || []).push(node);
      });

      Object.entries(nodesByRow).forEach(([row, rowNodes]) => {
        const leftBoundaryX = trustBoundaries.find((tb) => tb.id === rangeKey.split('-')[0])?.x || 0;
        const rightBoundaryX = trustBoundaries.find((tb) => tb.id === rangeKey.split('-')[1])?.x || 0;
        const nodeWidth = rowNodes[0].type === 'processNode' ? 96 : 96;
        const padding = 60;
        const minX = leftBoundaryX + nodeWidth / 2 + padding;
        const maxX = rightBoundaryX - nodeWidth / 2 - padding;

        if (rowNodes.length <= 1) {
          // Center the single node in the usable range
          rowNodes[0].position.x = (minX + maxX) / 2;
          return;
        }

        // Sort nodes in this row by x-position
        rowNodes.sort((a, b) => a.position.x - b.position.x);

        // Adjust x-positions to enforce minimum spacing while respecting boundaries
        const minSpacing = 100;
        rowNodes[0].position.x = minX;

        for (let i = 1; i < rowNodes.length; i++) {
          const prevNodeX = rowNodes[i - 1].position.x;
          let proposedX = prevNodeX + minSpacing;

          if (proposedX > maxX) {
            const totalWidth = (rowNodes.length - 1) * minSpacing + rowNodes.length * nodeWidth;
            const availableWidth = maxX - minX;
            const scale = availableWidth / totalWidth;
            const adjustedSpacing = minSpacing * scale;

            rowNodes.forEach((node, index) => {
              node.position.x = minX + index * (nodeWidth + adjustedSpacing) - (index > 0 ? nodeWidth / 2 : 0);
              node.position.x = Math.max(minX, Math.min(maxX, node.position.x));
            });
            break;
          } else {
            rowNodes[i].position.x = proposedX;
            rowNodes[i].position.x = Math.max(minX, Math.min(maxX, rowNodes[i].position.x));
          }
        }
      });
    });

    return positionedNodes;
  };

  // Generate nodes with modern styling
  const initialNodes = useMemo(() => {
    const result: Node[] = [];

    // Add trust boundary nodes
    const adjustedTrustBoundaries = trustBoundaries.map((boundary) => ({
      ...boundary,
    }));

    adjustedTrustBoundaries.forEach((boundary) => {
      result.push({
        id: `boundary-${boundary.id}`,
        type: 'boundaryNode',
        position: { x: boundary.x, y: 0 },
        data: { label: boundary.label },
      });
    });

    // Determine node type based on dummy data
    const determineNodeType = (nodeType: string) => {
      const lowerNodeType = nodeType.toLowerCase();
      if (lowerNodeType.includes('datastore') || lowerNodeType.includes('database')) return 'dataStoreNode';
      if (lowerNodeType.includes('externalentity') || lowerNodeType.includes('external')) return 'entityNode';
      if (lowerNodeType.includes('cloudservice')) return 'cloudServiceNode';
      return 'processNode';
    };

    // Create initial nodes for Dagre layout (excluding boundary nodes)
    dfdNodes.forEach((node: any) => {
      const nodeThreats = nodeThreatsMap[node.id] || [];
      console.log('nodeThreats', nodeThreats);
      result.push({
        id: node.id,
        type: determineNodeType(node.type || ''),
        position: { x: 0, y: 0 }, // Initial position, will be updated by Dagre
        data: {
          label: node.label || node.id,
          description: node.properties?.description,
          nodeType: node.type,
          threats: nodeThreats,
          threatCount: nodeThreats.length,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    });

    return result;
  }, [dfdNodes, trustBoundaries]);

  // Generate edges with zone-aware styling
  const initialEdges = useMemo(() => {
    return dfdEdges.map((edge: Edge, index: number) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#555', width: 15, height: 15 },
      type: 'smoothstep',
      style: { stroke: '#000000', strokeWidth: 1.5 },
      pathOptions: { offset: 30 }, // Increase spacing between edges
    }));
  }, [dfdEdges]);

  // Create node state hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Define node types
  const nodeTypes = useMemo(
    () => ({
      processNode: ProcessNode,
      entityNode: EntityNode,
      dataStoreNode: DataStoreNode,
      externalNode: ExternalNode,
      cloudServiceNode: CloudServiceNode,
      secretNode: SecretNode,
      boundaryNode: BoundaryNode,
    }),
    []
  );

  useEffect(() => {
    const laidOutNodes = getDagreLayout(initialNodes, initialEdges, trustBoundaries);
    console.log('laidOutNodes', laidOutNodes);
    setNodes(laidOutNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, trustBoundaries, setNodes, setEdges]);

  // Handle node selection
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedThreat(null);
  }, []);

  // Handle background click to deselect
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedThreat(null);
  }, []);

  // Handle fit view
  const onFitView = useCallback(() => {
    if (actualReactFlowInstance.current) {
      actualReactFlowInstance.current.fitView({ padding: 0.2 });
    }
  }, [actualReactFlowInstance]);

  // Auto layout the diagram with improved positioning
  const onLayout = useCallback(() => {
    if (!reactFlowInstanceRef.current) return;

    const laidOutNodes = getDagreLayout(initialNodes, initialEdges, trustBoundaries);
    console.log('laidOutNodes', laidOutNodes);
    setNodes(laidOutNodes);
    setEdges(initialEdges);

    setTimeout(() => {
      reactFlowInstanceRef.current.fitView({ padding: 0.2 });
      setLayoutApplied(true);
    }, 100);
  }, [initialNodes, initialEdges, trustBoundaries, setNodes, setEdges]);

  // Auto-layout on first render
  // React.useEffect(() => {
  //   if (!layoutApplied && nodes.length > 0) {
  //     const timer = setTimeout(() => {
  //       onLayout();
  //     }, 200);
  //     return () => clearTimeout(timer);
  //   }
  // }, [onLayout, nodes.length, layoutApplied]);

  // Monitor toolbar state changes
  useEffect(() => {
    // Function to check if toolbar is open
    const checkToolbarState = () => {
      // Toolbar usually has a class or width change when opened
      const toolbar = document.querySelector('.h-full.flex.flex-col.relative');
      if (toolbar) {
        const isOpen = toolbar.classList.contains('w-72');
        if (isOpen !== toolbarOpenRef.current) {
          // Toolbar state changed
          toolbarOpenRef.current = isOpen;
          setIsToolbarOpen(isOpen);

          // Reapply layout when toolbar state changes
          if (layoutApplied) {
            setLayoutApplied(false);
            // Wait a moment for DOM to update
            setTimeout(() => {
              onLayout();
            }, 300);
          }
        }
      }
    };

    // Check initially
    checkToolbarState();

    // Set up a MutationObserver to detect DOM changes
    const observer = new MutationObserver(checkToolbarState);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => observer.disconnect();
  }, [layoutApplied, onLayout]);

  // Helper function to highlight nodes affected by a threat
  const highlightNodesForThreat = useCallback((threat: ThreatItem | null) => {
    if (!threat) {
      return;
    }

    let targetElementId: string | undefined;

    // Get the target element ID from the threat
    if (threat.target_elements && threat.target_elements.length > 0) {
      targetElementId = threat.target_elements[0];
    }

    if (!targetElementId) {
      return;
    }

    // Find the node that corresponds to this threat
    const affectedNode = nodes.find(n => n.id === targetElementId);

    if (affectedNode) {
      // Center view on the affected node
      if (actualReactFlowInstance.current) {
        actualReactFlowInstance.current.fitView({
          nodes: [affectedNode],
          padding: 0.5,
          duration: 800
        });
      }
    }
  }, [nodes, actualReactFlowInstance]);

  // Effect to react to selected threat changes
  useEffect(() => {
    if (selectedThreat) {
      highlightNodesForThreat(selectedThreat);
    }
  }, [selectedThreat, highlightNodesForThreat]);

  // Add a function to close the selected node
  const closeSelectedNode = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Make sure we handle types correctly when selecting threats
  const handleThreatSelect = (threat: ThreatItem | null) => {
    setSelectedThreat(threat);

    // Find and zoom to affected nodes
    if (threat?.target_elements && threat.target_elements.length > 0) {
      // Find nodes that are targeted by this threat
      const targetNodeIds = threat.target_elements;

      // Clean up node IDs by removing any prefixes like 'node-' or 'boundary-'
      const cleanedTargetIds = targetNodeIds.map(id => id.replace(/^(node-|boundary-)/, ''));

      // Find the affected nodes in the current nodes array
      const affectedNodes = nodes.filter(node => {
        // Clean up the node ID as well for comparison
        const cleanedNodeId = node.id.replace(/^(node-|boundary-)/, '');
        return cleanedTargetIds.includes(cleanedNodeId);
      });

      if (affectedNodes.length > 0 && actualReactFlowInstance.current) {
        // Notify the user through toast
        toast({
          title: "Zooming to affected node(s)",
          description: `Showing ${affectedNodes.length} node(s) affected by this threat`,
          variant: "default",
          duration: 3000,
        });

        // Fit view to focus on the affected nodes
        setTimeout(() => {
          actualReactFlowInstance.current.fitView({
            nodes: affectedNodes,
            padding: 0.5,
            duration: 800
          });
        }, 100);

        // Highlight the affected nodes
        const updatedNodes = nodes.map(node => {
          const cleanedNodeId = node.id.replace(/^(node-|boundary-)/, '');
          const isAffected = cleanedTargetIds.includes(cleanedNodeId);

          if (isAffected) {
            // Add or update a style property to highlight the node
            return {
              ...node,
              style: {
                ...node.style,
                boxShadow: '0 0 0 4px rgba(220, 38, 38, 0.4)'
              }
            };
          } else {
            // Reset any previously applied highlight
            const { boxShadow, ...restStyle } = node.style || {};
            return {
              ...node,
              style: restStyle
            };
          }
        });

        // Update the nodes with highlighting
        setNodes(updatedNodes);
      }
    }
  };

  return (
    <div className="h-full w-full relative bg-white overflow-hidden">
      {/* Stats panel removed */}

      {/* Add Button panel outside ReactFlow */}
      <div className="absolute top-2 right-2 z-20 bg-white rounded-md shadow-md p-2 flex gap-2">
        <button
          onClick={() => {
            setLayoutApplied(false);
            onLayout();
          }}
          className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
        >
          <Maximize className="h-4 w-4" /> Auto Layout
        </button>
        <button
          onClick={onFitView}
          className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
        >
          <Maximize className="h-4 w-4" /> Fit View
        </button>
      </div>

      {/* Add Threat Panel */}
      <ThreatPanel
        threats={threats}
        onThreatSelect={handleThreatSelect}
        selectedThreat={selectedThreat}
        selectedNode={selectedNode}
      />

      {/* Node Detail Panel */}
      {selectedNode && (
        <NodeDetailPanel
          selectedNode={selectedNode}
          nodes={nodes}
          edges={edges}
          threats={threats}
          onClose={closeSelectedNode}
        />
      )}

      <ReactFlowProvider>
        <div className="h-full w-full overflow-hidden" style={{ overflowX: 'hidden' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={(instance) => {
              actualReactFlowInstance.current = instance;
            }}
            fitView
            minZoom={0.1}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              type: 'default',
              style: {
                strokeWidth: 1.0,
                stroke: '#b1b1b7'
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#555 !important',
                width: 15,
                height: 15
              },
              labelStyle: { fill: '#000000', fontWeight: 600 },
              labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 }
            }}
            connectionLineComponent={null}
            edgesFocusable={false}
            nodesFocusable={false}
            nodesConnectable={false}
            className="bg-white overflow-x-hidden"
            style={{ overflowX: 'hidden' }} // Removed fixed marginLeft to prevent diagram being cut off
          >
            {/* Minimap toggle button - positioned near the minimap */}
            <Panel position="bottom-right" className="mr-2 mb-2">
              <button
                onClick={toggleMinimap}
                className="minimap-toggle-button"
                title={showMinimap ? "Hide minimap" : "Show minimap"}
              >
                {showMinimap ? (
                  <EyeOff size={16} className="text-securetrack-purple opacity-80" />
                ) : (
                  <Eye size={16} className="text-securetrack-purple opacity-80" />
                )}
              </button>
            </Panel>

            {showMinimap && (
              <MiniMap
                nodeStrokeColor={() => '#000000'}
                nodeColor={(n) => {
                  if (n.type === 'boundaryNode') return 'transparent';
                  return '#ffffff';
                }}
                style={{
                  width: 160,
                  height: 100,
                  backgroundColor: '#f8f9fb',
                  border: '1px solid rgba(124, 101, 246, 0.2)',
                  borderRadius: '6px',
                  zIndex: 5
                }}
                maskColor="rgba(124, 101, 246, 0.07)"
              />
            )}
            <Background color="#fff" gap={20} size={0} />

            {/* Data Flows legend removed */}
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};
export default DFDVisualization;