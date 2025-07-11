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
  );
};

const ExternalNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  // Get threat count by severity
  const highCount = data.threats?.filter(t => t.severity === 'HIGH').length || 0;
  const mediumCount = data.threats?.filter(t => t.severity === 'MEDIUM').length || 0;
  const lowCount = data.threats?.filter(t => t.severity === 'LOW').length || 0;
  
  const hasThreat = highCount > 0 || mediumCount > 0 || lowCount > 0;
  
  return (
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
  );
};

const CloudServiceNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  // Get threat count by severity
  const highCount = data.threats?.filter(t => t.severity === 'HIGH').length || 0;
  const mediumCount = data.threats?.filter(t => t.severity === 'MEDIUM').length || 0;
  const lowCount = data.threats?.filter(t => t.severity === 'LOW').length || 0;
  
  const hasThreat = highCount > 0 || mediumCount > 0 || lowCount > 0;
  
  return (
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
  );
};

const SecretNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  // Get threat count by severity
  const highCount = data.threats?.filter(t => t.severity === 'HIGH').length || 0;
  const mediumCount = data.threats?.filter(t => t.severity === 'MEDIUM').length || 0;
  const lowCount = data.threats?.filter(t => t.severity === 'LOW').length || 0;
  
  const hasThreat = highCount > 0 || mediumCount > 0 || lowCount > 0;
  
  return (
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
  );
};

// Boundary node with straight red dotted lines
const BoundaryNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  const getBoundaryStyles = (): React.CSSProperties => {
    return {
      width: '100%',
      height: '100%',
      borderRadius: '0',
      border: '2px dotted red',
      backgroundColor: 'transparent',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'flex-start',
      position: 'relative',
      boxSizing: 'border-box' as const,
      padding: '10px'
    };
  };

  return (
    <div style={getBoundaryStyles()}>
      <div className="absolute top-0 left-10 transform -translate-y-1/2 bg-white px-2 py-0.5 text-xs font-semibold text-black border border-black">
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
      <div className="absolute top-2 left-2 z-10 bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl threat-panel-transition" style={{animation: 'slideIn 0.3s forwards'}}>
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
    <div className="absolute top-2 left-2 z-10 bg-white rounded-lg shadow-md overflow-hidden w-80 border border-gray-100 transition-all duration-300 hover:shadow-xl threat-panel-transition" style={{animation: 'slideIn 0.3s forwards'}}>
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
}> = ({ threat, severity, isSelected = false, onSelect = () => {} }) => {
  const getSeverityStyle = (sev: string) => {
    switch(sev.toUpperCase()) {
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
    switch(sev.toUpperCase()) {
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
    switch(sev.toUpperCase()) {
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
      <div className={`px-3 py-2 border-b border-gray-200 flex items-center justify-between ${
        hasCriticalThreats 
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
            <div className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              hasCriticalThreats ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
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
                    <div className={`text-[9px] px-1 py-0.5 rounded ${
                      node.type === 'processNode' ? 'bg-blue-100 text-blue-700' :
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
                    <div className={`text-[9px] px-1 py-0.5 rounded ${
                      node.type === 'processNode' ? 'bg-blue-100 text-blue-700' :
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
  
  switch(nodeType) {
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

// Helper function to get the zone color for a node based on boundary
const getZoneColorForNode = (node, nodes, zones) => {
  if (!node || !zones) return { color: 'transparent', zone: 'other' };
  
  // Check if zones is an array we can iterate through
  if (Array.isArray(zones)) {
    // Find what zone the node belongs to based on the boundary elements
    for (const zone of zones) {
      if (zone.element_ids && zone.element_ids.includes(node.id)) {
        // Return plain white background with no transparency for all zone types
        return { color: 'transparent', zone: zone.label.toLowerCase() };
      }
    }
  } else if (typeof zones === 'object') {
    // Handle case where zones is an object with zone properties
    // Return transparent backgrounds for all zones
    if (zones.external && isNodeInZone(node, zones.external)) {
      return { color: 'transparent', zone: 'external' };
    } else if (zones.data && isNodeInZone(node, zones.data)) {
      return { color: 'transparent', zone: 'data' };
    } else if (zones.application && isNodeInZone(node, zones.application)) {
      return { color: 'transparent', zone: 'application' };
    }
  }
  
  // If not found in any zone, return transparent for all node types
  return {
    color: 'transparent',
    zone: 'other'
  };
};

// Helper function to check if a node is within a zone area
const isNodeInZone = (node, zone) => {
  if (!node || !node.position || !zone) return false;
  
  const { x, y } = node.position;
  return x >= zone.x && x <= zone.x + zone.width && 
         y >= zone.y && y <= zone.y + zone.height;
};

const DFDVisualization: React.FC<DFDVisualizationProps> = ({ dfdData, reactFlowInstanceRef }) => {
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
        stroke: black !important;
        stroke-width: 1.5px !important;
      }
      
      .react-flow__edge-path {
        stroke: black !important;
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
  let { nodes: dfdNodes = [], edges: dfdEdges = [], boundaries = [], threats = [] } = dfdData;
  
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

  // Generate nodes with modern styling
  const initialNodes = useMemo(() => {
    const result = [];
    
    // First, create a map of boundaries and their dimensions
    const boundaryMap = {};
    const boundaryPositions = {};
    const elementToBoundaryMap = {};
    
    // Get width based on boundary label to ensure proper spacing
    const getBoundaryWidth = (label) => {
      // Assign appropriate width based on boundary type
      if (label.toLowerCase().includes('dmz')) {
        return 600;
      } else if (label.toLowerCase().includes('data')) {
        return 500;
      } else if (label.toLowerCase().includes('internal')) {
        return 550;
      } else if (label.toLowerCase().includes('monitoring') || label.toLowerCase().includes('logging')) {
        return 400;
      } else if (label.toLowerCase().includes('admin')) {
        return 300;
      } else if (label.toLowerCase().includes('external')) {
        return 350;
      }
      return 500; // Default width
    };
    
    // Get height based on number of elements in boundary
    const getBoundaryHeight = (elementCount) => {
      const baseHeight = 150;
      const heightPerElement = 60;
      return Math.max(baseHeight, elementCount * heightPerElement);
    };
    
    // Map elements to their respective boundaries
    boundaries.forEach((boundary) => {
      boundaryMap[boundary.id] = boundary;
      
      // Map each element to its boundary for easy lookup
      if (boundary.element_ids) {
        boundary.element_ids.forEach(elementId => {
          elementToBoundaryMap[elementId] = boundary.id;
        });
      }
    });
    
    // Calculate boundary positions
    let xOffset = 50;
    const yBase = 50;
    
    // First place external, DMZ, internal, and data boundaries from left to right
    const mainBoundaryOrder = ['external', 'dmz', 'internal', 'data'];
    mainBoundaryOrder.forEach(boundaryType => {
      const matchingBoundaries = boundaries.filter(b => 
        b.label.toLowerCase().includes(boundaryType));
      
      matchingBoundaries.forEach(boundary => {
        const width = getBoundaryWidth(boundary.label);
        const height = getBoundaryHeight(boundary.element_ids?.length || 0);
        
        // Use position from backend if available, otherwise calculate
        const defaultPosition = { x: xOffset, y: yBase };
        const position = boundary.properties?.position ? 
          { 
            x: (boundary.properties.position as any).x || defaultPosition.x, 
            y: (boundary.properties.position as any).y || defaultPosition.y 
          } : 
          defaultPosition;
        
        boundaryPositions[boundary.id] = {
          x: position.x,
          y: position.y,
          width,
          height
        };
        
        xOffset += width + 50; // Add gap between boundaries
      });
    });
    
    // Then place other boundaries (monitoring, admin) below
    const otherBoundaries = boundaries.filter(b => 
      !mainBoundaryOrder.some(type => b.label.toLowerCase().includes(type)));
    
    xOffset = 50;
    const yOffset = yBase + 500; // Place below the main boundaries
    
    otherBoundaries.forEach(boundary => {
      const width = getBoundaryWidth(boundary.label);
      const height = getBoundaryHeight(boundary.element_ids?.length || 0);
      
      // Use position from backend if available, otherwise calculate
      const defaultPosition = { x: xOffset, y: yOffset };
      const position = boundary.properties?.position ? 
        { 
          x: (boundary.properties.position as any).x || defaultPosition.x, 
          y: (boundary.properties.position as any).y || defaultPosition.y 
        } : 
        defaultPosition;
      
      boundaryPositions[boundary.id] = {
        x: position.x,
        y: position.y,
        width,
        height
      };
      
      xOffset += width + 50; // Add gap between boundaries
    });
    
    // Add boundary nodes
    boundaries.forEach((boundary, index) => {
      const boundaryId = boundary.id;
      const elementIds = boundary.element_ids || [];
      const label = boundary.label || `Boundary ${index + 1}`;
      
      if (elementIds.length === 0) return;
      
      const position = boundaryPositions[boundaryId];
      
      result.push({
        id: `boundary-${boundaryId}`,
        type: 'boundaryNode',
        position: { 
          x: position.x, 
          y: position.y 
        },
        style: { 
          width: position.width, 
          height: position.height,
          zIndex: -1
        },
        data: {
          label: label,
          elements: elementIds
        }
      });
    });
    
    // Helper function to determine node type based on string matching
    const determineNodeType = (nodeId, nodeType) => {
      const lowerNodeId = nodeId.toLowerCase();
      const lowerNodeType = nodeType.toLowerCase();
      
      // Map DFD node types to our enhanced node types
      if (lowerNodeType.includes('datastore') || 
          lowerNodeType.includes('database') || 
          lowerNodeId.includes('db_') || 
          lowerNodeId.includes('data_vault') || 
          lowerNodeId.includes('backup')) {
        return 'dataStoreNode';
      }
      
      if (lowerNodeType.includes('external') || 
          lowerNodeId.includes('internet') || 
          lowerNodeId.includes('cdn')) {
        return 'externalNode';
      }
      
      if (lowerNodeType.includes('actor') || 
          lowerNodeType.includes('user') || 
          lowerNodeType.includes('client') || 
          lowerNodeId.includes('entity')) {
        return 'entityNode';
      }
      
      if (lowerNodeId.includes('auth') || 
          lowerNodeId.includes('key') || 
          lowerNodeId.includes('credential') || 
          lowerNodeId.includes('secret')) {
        return 'secretNode';
      }
      
      if (lowerNodeId.includes('aws_') || 
          lowerNodeId.includes('azure_') || 
          lowerNodeId.includes('gcp_') || 
          lowerNodeId.includes('cloud')) {
        return 'cloudServiceNode';
      }
      
      return 'processNode';
    };
    
    // Helper function to check if a threat targets a node
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
    
    // Create a map to organize nodes by their boundary
    const boundaryToNodesMap = {};
    
    // First, group nodes by their boundary
    dfdNodes.forEach((node) => {
      const boundaryId = elementToBoundaryMap[node.id];
      if (!boundaryToNodesMap[boundaryId]) {
        boundaryToNodesMap[boundaryId] = [];
      }
      boundaryToNodesMap[boundaryId].push(node);
    });
    
    // Now add nodes, arranged by their boundary
    Object.keys(boundaryToNodesMap).forEach((boundaryId) => {
      const nodesInBoundary = boundaryToNodesMap[boundaryId];
      const boundaryPosition = boundaryPositions[boundaryId];
      
      if (!boundaryPosition) return;
      
      // Calculate layout within the boundary
      const nodeSpacingX = boundaryPosition.width / (nodesInBoundary.length + 1);
      const nodeSpacingY = boundaryPosition.height / Math.ceil(nodesInBoundary.length / 2);
      
      nodesInBoundary.forEach((node, nodeIndex) => {
        // Determine node type
        const type = determineNodeType(node.id, node.type || '');
        
        // Find threats targeting this node
        const nodeThreats = threats.filter(t => threatTargetsNode(t, node.id));
        
        // Calculate position within boundary
        let xPos, yPos;
        
        // If fewer than 5 nodes, place them in a single row
        if (nodesInBoundary.length < 5) {
          xPos = boundaryPosition.x + nodeSpacingX * (nodeIndex + 1);
          yPos = boundaryPosition.y + boundaryPosition.height / 2;
        } else {
          // Arrange in 2 rows for more nodes
          const row = Math.floor(nodeIndex / Math.ceil(nodesInBoundary.length / 2));
          const col = nodeIndex % Math.ceil(nodesInBoundary.length / 2);
          
          xPos = boundaryPosition.x + (col + 1) * (boundaryPosition.width / (Math.ceil(nodesInBoundary.length / 2) + 1));
          yPos = boundaryPosition.y + (row + 1) * (boundaryPosition.height / 3);
        }
        
        // Add the node to the result
        result.push({
          id: node.id,
          type,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          position: { x: xPos, y: yPos },
          data: {
            label: node.label,
            description: node.properties?.description || '',
            nodeType: node.type,
            threats: nodeThreats,
            threatCount: nodeThreats.length
          }
        });
      });
    });
    
    // Process any nodes not assigned to a boundary
    const unassignedNodes = dfdNodes.filter(node => !elementToBoundaryMap[node.id]);
    
    unassignedNodes.forEach((node, index) => {
      // Determine node type
      const type = determineNodeType(node.id, node.type || '');
      
      // Find threats targeting this node
      const nodeThreats = threats.filter(t => threatTargetsNode(t, node.id));
      
      // Place unassigned nodes at the bottom
      const xPos = 100 + (index % 5) * 200;
      const yPos = yOffset + 300;
      
      result.push({
        id: node.id,
        type,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        position: { x: xPos, y: yPos },
        data: {
          label: node.label,
          description: node.properties?.description || '',
          nodeType: node.type,
          threats: nodeThreats,
          threatCount: nodeThreats.length
        }
      });
    });
    
    return result;
  }, [dfdNodes, boundaries, threats]);

  // Generate edges with zone-aware styling
  const initialEdges = useMemo(() => {
    const result = [];
    const seenIds = new Set();
    
    // Define zones for zone-based edge coloring
    const zones = {
      external: { x: 100, y: 100, width: 400, height: 700 },
      application: { x: 550, y: 100, width: 650, height: 700 },
      data: { x: 1250, y: 100, width: 400, height: 700 }
    };
    
    // Create a map of nodes for quick access
    const nodeMap = {};
    initialNodes.forEach(node => {
      nodeMap[node.id] = node;
    });
    
    // Helper function to get standard handle IDs
    const getStandardHandleIds = (nodeType) => {
      switch(nodeType) {
        case 'entityNode':
          return { source: 'entityOutput', target: 'entityInput' };
        case 'dataStoreNode':
          return { source: 'datastoreOutput', target: 'datastoreInput' };
        case 'externalNode':
          return { source: 'externalOutput', target: 'externalInput' };
        case 'cloudServiceNode':
          return { source: 'cloudOutput', target: 'cloudInput' };
        case 'secretNode':
          return { source: 'secretOutput', target: 'secretInput' };
        case 'processNode':
        default:
          return { source: 'processOutput', target: 'processInput' };
      }
    };
    
    // Get node type map
    const nodeTypeMap = {};
    initialNodes.forEach(node => {
      nodeTypeMap[node.id] = node.type;
    });
    
    dfdEdges.forEach((edge, index) => {
      if (!edge.source || !edge.target) {
        console.warn('Invalid edge missing source or target:', edge);
        return;
      }
      
      // Ensure a unique ID
      let uniqueId = edge.id;
      if (seenIds.has(uniqueId)) {
        let counter = 1;
        while (seenIds.has(`${edge.id}-${counter}`)) {
          counter++;
        }
        uniqueId = `${edge.id}-${counter}`;
      }
      seenIds.add(uniqueId);
      
      // Extract properties for label
      const props = edge.properties || {};
      const protocol = props.protocol ? `${props.protocol}` : '';
      const encrypted = props.isEncrypted ? '(Encrypted)' : '';
      const label = edge.label || (protocol ? `${protocol} ${encrypted}` : 'Data Flow');
      
      // Get node types for source and target
      const sourceType = nodeTypeMap[edge.source] || 'processNode';
      const targetType = nodeTypeMap[edge.target] || 'processNode';
      
      // Get handle IDs
      const sourceHandles = getStandardHandleIds(sourceType);
      const targetHandles = getStandardHandleIds(targetType);
      
      // Get threats targeting this edge
      const edgeThreats = threats.filter(t => {
        if (t.target_elements && Array.isArray(t.target_elements)) {
          return t.target_elements.includes(edge.id);
        }
        return false;
      });
      
      // Determine edge style based on threat severity
      const hasCriticalThreats = edgeThreats.some(t => 
        (t.severity || '').toLowerCase() === 'high'
      );
      
      // Get source and target nodes
      const sourceNode = nodeMap[edge.source];
      const targetNode = nodeMap[edge.target];
      
      // Get zone colors for source and target nodes
      const sourceZone = getZoneColorForNode(sourceNode, initialNodes, zones);
      const targetZone = getZoneColorForNode(targetNode, initialNodes, zones);
      
      // Determine edge color based on zones and security
      let edgeColor;
      let edgeStyle;
      
      if (hasCriticalThreats) {
        // Critical threats always use red
        edgeColor = '#EF4444'; // red-500
        edgeStyle = {
          stroke: edgeColor,
          strokeWidth: 3,
          filter: 'drop-shadow(0 0 2px rgba(239, 68, 68, 0.5))',
        };
      } else if (props.isEncrypted) {
        // Encrypted connections use green
        edgeColor = '#10B981'; // emerald-500
        edgeStyle = {
          stroke: edgeColor,
          strokeWidth: 2.5,
          filter: 'drop-shadow(0 0 2px rgba(16, 185, 129, 0.3))',
        };
      } else {
        // Normal connections use zone colors
        // For cross-zone connections, use gradient-like effect with source zone color
        edgeColor = sourceZone?.color || '#94a3b8';
        edgeStyle = {
          stroke: edgeColor,
          strokeWidth: 2,
          strokeDasharray: sourceZone?.zone !== targetZone?.zone ? '5,5' : '',
        };
      }
      
      // Determine edge type based on zones
      let edgeType = 'smoothstep';
      
      // If crossing between zones, make straighter lines
      if (sourceZone?.zone !== targetZone?.zone) {
        edgeType = 'default'; // straighter line for cross-zone connections
      }
      
      result.push({
        id: uniqueId,
        source: edge.source,
        target: edge.target,
        sourceHandle: sourceHandles.source,
        targetHandle: targetHandles.target,
        data: {
          ...props,
          label,
          threats: edgeThreats,
          sourceZone: sourceZone?.zone,
          targetZone: targetZone?.zone
        },
        style: edgeStyle,
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
        labelStyle: { display: 'none', fontSize: 0, opacity: 0 },
        labelBgStyle: { display: 'none', opacity: 0, fill: 'transparent' },
        labelShowBg: false,
        type: edgeType,
        animated: !!props.isEncrypted,
        markerEnd: { 
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: edgeColor,
        }
      });
    });
    
    return result;
  }, [dfdEdges, threats, initialNodes]);

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

  // Handle node selection
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // Handle background click to deselect
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);
  // Handle fit view
  const onFitView = useCallback(() => {
    if (actualReactFlowInstance.current) {
      actualReactFlowInstance.current.fitView({ padding: 0.2 });
    }
  }, [actualReactFlowInstance]);

  // Auto layout the diagram with improved positioning
  const onLayout = useCallback(() => {
    if (!nodes.length || layoutApplied || isLayoutingRef.current) return;
    
    isLayoutingRef.current = true;
    toast({
      title: "Auto Layout",
      description: "Applying diagram layout for better visibility."
    });
    
    // Enhanced layout algorithm with zone-based organization
    const createImprovedLayout = () => {
      // Create a new array with updated nodes
      const newNodes = [...nodes];
      
      // Identify node types for organized positioning
      const entityNodes = nodes.filter(n => n.type === 'entityNode');
      const externalNodes = nodes.filter(n => n.type === 'externalNode');
      const processNodes = nodes.filter(n => n.type === 'processNode');
      const cloudNodes = nodes.filter(n => n.type === 'cloudServiceNode');
      const secretNodes = nodes.filter(n => n.type === 'secretNode');
      const datastoreNodes = nodes.filter(n => n.type === 'dataStoreNode');
      
      // First identify the boundary nodes and categorize them
      const boundaryNodes = nodes.filter(n => n.type === 'boundaryNode');
      
      // Categorize boundaries by type
      const externalBoundaries = boundaryNodes.filter(n => 
        (n.data?.label || '').toLowerCase().includes('external'));
      const applicationBoundaries = boundaryNodes.filter(n => 
        (n.data?.label || '').toLowerCase().includes('application') || 
        (n.data?.label || '').toLowerCase().includes('app'));
      const dataBoundaries = boundaryNodes.filter(n => 
        (n.data?.label || '').toLowerCase().includes('data'));
      const otherBoundaries = boundaryNodes.filter(n => 
        !externalBoundaries.includes(n) && 
        !applicationBoundaries.includes(n) && 
        !dataBoundaries.includes(n));
      
      // Layout dimensions - use much wider layout for better separation
      const width = 2400;
      const height = 1200;
      
      // Define margins to match the ReactFlow container
      const leftMargin = 180; // Match the marginLeft value in the ReactFlow component
      
      // Add extra padding to leave space for the security issues panel
      const securityPanelWidth = 400; // Width for security issues panel
      // Start zones after the toolbar margin
      const toolbarWidth = toolbarOpenRef.current ? 72 + 180 : 12 + 180; // Add extra padding whether toolbar is open or not
      const startingXPos = leftMargin + toolbarWidth; // Position zones starting after the left margin and toolbar
      
      // Zone dimensions and positioning - much wider and taller zones to prevent overlap
      const zones = {
        external: { x: startingXPos, y: 100, width: 450, height: height - 200 },
        application: { x: startingXPos + 600, y: 100, width: 800, height: height - 200 },
        data: { x: startingXPos + 1550, y: 100, width: 450, height: height - 200 }
      };
      
      // Much larger spacing for clarity
      const nodeSpacingX = 180;
      const nodeSpacingY = 200;
      
      // Position boundaries first
      externalBoundaries.forEach((boundary, i) => {
        const boundaryIndex = newNodes.findIndex(n => n.id === boundary.id);
        if (boundaryIndex !== -1) {
          newNodes[boundaryIndex] = {
            ...newNodes[boundaryIndex],
            position: { x: zones.external.x, y: zones.external.y },
            style: {
              ...newNodes[boundaryIndex].style,
              width: zones.external.width,
              height: zones.external.height,
              zIndex: -10
            }
          };
        }
      });
      
      applicationBoundaries.forEach((boundary, i) => {
        const boundaryIndex = newNodes.findIndex(n => n.id === boundary.id);
        if (boundaryIndex !== -1) {
          newNodes[boundaryIndex] = {
            ...newNodes[boundaryIndex],
            position: { x: zones.application.x, y: zones.application.y },
            style: {
              ...newNodes[boundaryIndex].style,
              width: zones.application.width,
              height: zones.application.height,
              zIndex: -10
            }
          };
        }
      });
      
      dataBoundaries.forEach((boundary, i) => {
        const boundaryIndex = newNodes.findIndex(n => n.id === boundary.id);
        if (boundaryIndex !== -1) {
          newNodes[boundaryIndex] = {
            ...newNodes[boundaryIndex],
            position: { x: zones.data.x, y: zones.data.y },
            style: {
              ...newNodes[boundaryIndex].style,
              width: zones.data.width,
              height: zones.data.height,
              zIndex: -10
            }
          };
        }
      });
      
      // For any other boundaries, position them below the main zones
      otherBoundaries.forEach((boundary, i) => {
        const boundaryIndex = newNodes.findIndex(n => n.id === boundary.id);
        if (boundaryIndex !== -1) {
          newNodes[boundaryIndex] = {
            ...newNodes[boundaryIndex],
            position: { x: 100 + (i * 550), y: height - 250 },
            style: {
              ...newNodes[boundaryIndex].style,
              width: 500,
              height: 200,
              zIndex: -10
            }
          };
        }
      });
      
      // Now position nodes within their appropriate zones
      
      // External zone nodes (external entities)
      const externalZoneX = zones.external.x + 120;
      const externalZoneY = zones.external.y + 100;
      externalNodes.forEach((node, i) => {
        const index = newNodes.findIndex(n => n.id === node.id);
        if (index !== -1) {
          // Only 1 node per row for better spacing
          newNodes[index] = {
            ...newNodes[index],
            position: { 
              x: externalZoneX, 
              y: externalZoneY + (i * nodeSpacingY)
            }
          };
        }
      });
      
      // Also position entity nodes in external zone
      entityNodes.forEach((node, i) => {
        const index = newNodes.findIndex(n => n.id === node.id);
        if (index !== -1) {
          const effectiveIndex = i + externalNodes.length;
          // Only 1 node per row for better spacing
          newNodes[index] = {
            ...newNodes[index],
            position: { 
              x: externalZoneX, 
              y: externalZoneY + (effectiveIndex * nodeSpacingY)
            }
          };
        }
      });
      
      // Application zone nodes (process nodes, cloud services)
      const appZoneX = zones.application.x + 120;
      const appZoneY = zones.application.y + 100;
      
      // Arrange process nodes in a grid within application zone - reduced nodes per row
      const maxProcessNodesPerRow = 3;
      processNodes.forEach((node, i) => {
        const index = newNodes.findIndex(n => n.id === node.id);
        if (index !== -1) {
          const row = Math.floor(i / maxProcessNodesPerRow);
          const col = i % maxProcessNodesPerRow;
          newNodes[index] = {
            ...newNodes[index],
            position: { 
              x: appZoneX + (col * nodeSpacingX), 
              y: appZoneY + (row * nodeSpacingY)
            }
          };
        }
      });
      
      // Place cloud nodes below process nodes in application zone - with extra spacing
      const cloudNodesY = appZoneY + (Math.ceil(processNodes.length / maxProcessNodesPerRow) * nodeSpacingY) + 100;
      cloudNodes.forEach((node, i) => {
        const index = newNodes.findIndex(n => n.id === node.id);
        if (index !== -1) {
          const col = i % maxProcessNodesPerRow;
          newNodes[index] = {
            ...newNodes[index],
            position: { 
              x: appZoneX + (col * nodeSpacingX), 
              y: cloudNodesY
            }
          };
        }
      });
      
      // Place secret nodes below cloud nodes in application zone - with extra spacing
      const secretNodesY = cloudNodesY + (cloudNodes.length > 0 ? nodeSpacingY : 0) + 50;
      secretNodes.forEach((node, i) => {
        const index = newNodes.findIndex(n => n.id === node.id);
        if (index !== -1) {
          const col = i % maxProcessNodesPerRow;
          newNodes[index] = {
            ...newNodes[index],
            position: { 
              x: appZoneX + (col * nodeSpacingX), 
              y: secretNodesY
            }
          };
        }
      });
      
      // Data zone nodes (data stores)
      const dataZoneX = zones.data.x + 120;
      const dataZoneY = zones.data.y + 100;
      
      // Position data store nodes in data zone - vertically for better spacing
      datastoreNodes.forEach((node, i) => {
        const index = newNodes.findIndex(n => n.id === node.id);
        if (index !== -1) {
          newNodes[index] = {
            ...newNodes[index],
            position: { 
              x: dataZoneX, 
              y: dataZoneY + (i * nodeSpacingY)
            }
          };
        }
      });
      
      return newNodes;
    };
    
    // Apply the improved layout
    const layoutedNodes = createImprovedLayout();
    setNodes(layoutedNodes);
    
    // Set the layout applied flag
    setTimeout(() => {
      if (actualReactFlowInstance.current) {
        actualReactFlowInstance.current.fitView({ padding: 0.2 });
      }
      setLayoutApplied(true);
      isLayoutingRef.current = false;
    }, 200);
  }, [nodes, setNodes, toast, layoutApplied, actualReactFlowInstance]);

  // Auto-layout on first render
  React.useEffect(() => {
    if (!layoutApplied && nodes.length > 0) {
      const timer = setTimeout(() => {
        onLayout();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [onLayout, nodes.length, layoutApplied]);

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
                strokeWidth: 1.5,
                stroke: '#000000' 
              },
              markerEnd: { 
                type: MarkerType.Arrow,
                color: '#000000', 
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
            <Panel position="bottom-left" className="ml-2 mb-2">
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
                  zIndex: 5,
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px'
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





