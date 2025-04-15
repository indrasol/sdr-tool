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
  Target
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

// Custom node components with modern design
const ProcessNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  const threatCount = data.threats?.length || 0;
  const hasCriticalThreats = data.threats?.some(t => (t.severity || '').toLowerCase() === 'high') || false;
  
  return (
    <div className={`flex flex-col items-center justify-center relative group`}>
      {/* Main circle */}
      <div 
        className={`w-16 h-16 rounded-full flex items-center justify-center 
          ${hasCriticalThreats 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300' 
            : 'bg-gradient-to-br from-blue-400 to-blue-500 border-blue-200'} 
          ${selected ? 'ring-2 ring-blue-300 ring-offset-2 ring-offset-white border-white' : 'border border-opacity-30'} 
          shadow-md transition-all duration-200 group-hover:shadow-lg group-hover:scale-105`}
      >
        <Server className="h-7 w-7 text-white" />
      </div>
      
      {/* Label below */}
      <div className="mt-2 px-2 py-1 bg-white/90 rounded-md text-xs font-medium max-w-[120px] text-center text-gray-700 break-words shadow-sm border border-gray-100">
        {data.label}
      </div>
      
      {/* Threat indicator with tooltip */}
      {threatCount > 0 && (
        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white shadow-sm
          ${hasCriticalThreats ? 'bg-gradient-to-r from-red-500 to-red-600 pulse-animation' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}
          title={`${threatCount} security ${threatCount === 1 ? 'issue' : 'issues'}`}
        >
          {threatCount}
        </div>
      )}
      
      {/* Connection handles */}
      <Handle
        id="processInput"
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !border-2 !border-blue-500 !bg-white"
      />
      <Handle
        id="processOutput"
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !border-2 !border-blue-500 !bg-white"
      />
    </div>
  );
};

const EntityNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  const threatCount = data.threats?.length || 0;
  const hasCriticalThreats = data.threats?.some(t => (t.severity || '').toLowerCase() === 'high') || false;
  
  return (
    <div className={`flex flex-col items-center justify-center relative group`}>
      {/* Main circle */}
      <div 
        className={`w-16 h-16 rounded-full flex items-center justify-center 
          ${hasCriticalThreats 
            ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-300' 
            : 'bg-gradient-to-br from-indigo-400 to-indigo-500 border-indigo-200'} 
          ${selected ? 'ring-2 ring-indigo-300 ring-offset-2 ring-offset-white border-white' : 'border border-opacity-30'} 
          shadow-md transition-all duration-200 group-hover:shadow-lg group-hover:scale-105`}
      >
        <User className="h-7 w-7 text-white" />
      </div>
      
      {/* Label below */}
      <div className="mt-2 px-2 py-1 bg-white/90 rounded-md text-xs font-medium max-w-[120px] text-center text-gray-700 break-words shadow-sm border border-gray-100">
        {data.label}
      </div>
      
      {/* Threat indicator with tooltip */}
      {threatCount > 0 && (
        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white shadow-sm
          ${hasCriticalThreats ? 'bg-gradient-to-r from-red-500 to-red-600 pulse-animation' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}
          title={`${threatCount} security ${threatCount === 1 ? 'issue' : 'issues'}`}
        >
          {threatCount}
        </div>
      )}
      
      {/* Connection handles */}
      <Handle
        id="entityInput"
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !border-2 !border-indigo-500 !bg-white"
      />
      <Handle
        id="entityOutput"
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !border-2 !border-indigo-500 !bg-white"
      />
    </div>
  );
};

const DataStoreNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  const threatCount = data.threats?.length || 0;
  const hasCriticalThreats = data.threats?.some(t => (t.severity || '').toLowerCase() === 'high') || false;
  
  return (
    <div className={`flex flex-col items-center justify-center relative group`}>
      {/* Main circle */}
      <div 
        className={`w-16 h-16 rounded-full flex items-center justify-center 
          ${hasCriticalThreats 
            ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 border-cyan-300' 
            : 'bg-gradient-to-br from-cyan-400 to-cyan-500 border-cyan-200'} 
          ${selected ? 'ring-2 ring-cyan-300 ring-offset-2 ring-offset-white border-white' : 'border border-opacity-30'} 
          shadow-md transition-all duration-200 group-hover:shadow-lg group-hover:scale-105`}
      >
        <Database className="h-7 w-7 text-white" />
      </div>
      
      {/* Label below */}
      <div className="mt-2 px-2 py-1 bg-white/90 rounded-md text-xs font-medium max-w-[120px] text-center text-gray-700 break-words shadow-sm border border-gray-100">
        {data.label}
      </div>
      
      {/* Threat indicator with tooltip */}
      {threatCount > 0 && (
        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white shadow-sm
          ${hasCriticalThreats ? 'bg-gradient-to-r from-red-500 to-red-600 pulse-animation' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}
          title={`${threatCount} security ${threatCount === 1 ? 'issue' : 'issues'}`}
        >
          {threatCount}
        </div>
      )}
      
      {/* Connection handles */}
      <Handle
        id="datastoreInput"
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !border-2 !border-cyan-500 !bg-white"
      />
      <Handle
        id="datastoreOutput"
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !border-2 !border-cyan-500 !bg-white"
      />
    </div>
  );
};

const ExternalNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  const threatCount = data.threats?.length || 0;
  const hasCriticalThreats = data.threats?.some(t => (t.severity || '').toLowerCase() === 'high') || false;
  const isInternet = (data.nodeType || '').toLowerCase() === 'internet' || (data.label || '').toLowerCase().includes('internet');
  const isCDN = (data.nodeType || '').toLowerCase() === 'cdn' || (data.label || '').toLowerCase().includes('cdn');
  
  return (
    <div className={`flex flex-col items-center justify-center relative group`}>
      {/* Main circle */}
      <div 
        className={`w-16 h-16 rounded-full flex items-center justify-center relative
          ${isInternet || isCDN 
            ? 'bg-transparent' 
            : hasCriticalThreats 
              ? 'bg-gradient-to-br from-purple-500 to-purple-600 border-purple-300'
              : 'bg-gradient-to-br from-purple-400 to-purple-500 border-purple-200'} 
          ${selected && !isInternet && !isCDN ? 'ring-2 ring-purple-300 ring-offset-2 ring-offset-white border-white' : (isInternet || isCDN) ? '' : 'border border-opacity-30'} 
          shadow-md transition-all duration-200 group-hover:shadow-lg group-hover:scale-105
          ${isInternet || isCDN ? 'z-10' : ''}`}
      >
        {isInternet ? (
          <div className="rotate-animation w-16 h-16">
            <EarthGlobeSVG />
          </div>
        ) : isCDN ? (
          <div className="w-16 h-16">
            <CDNIconSVG />
          </div>
        ) : (
          <Globe className="h-7 w-7 text-white" />
        )}
        
        {/* Threat indicator with tooltip - moved inside the circle container */}
        {threatCount > 0 && (
          <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white shadow-sm z-20
            ${hasCriticalThreats ? 'bg-gradient-to-r from-red-500 to-red-600 pulse-animation' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}
            title={`${threatCount} security ${threatCount === 1 ? 'issue' : 'issues'}`}
          >
            {threatCount}
          </div>
        )}
      </div>
      
      {/* Label below */}
      <div className="mt-2 px-2 py-1 bg-white/90 rounded-md text-xs font-medium max-w-[120px] text-center text-gray-700 break-words shadow-sm border border-gray-100">
        {data.label}
      </div>
      
      {/* Connection handles */}
      <Handle
        id="externalInput"
        type="target"
        position={Position.Left}
        className={`!w-2 !h-2 !border-2 ${isInternet ? '!border-teal-500 !bg-white/80' : isCDN ? '!border-purple-500 !bg-white/80' : '!border-purple-500 !bg-white'}`}
      />
      <Handle
        id="externalOutput" 
        type="source"
        position={Position.Right}
        className={`!w-2 !h-2 !border-2 ${isInternet ? '!border-teal-500 !bg-white/80' : isCDN ? '!border-purple-500 !bg-white/80' : '!border-purple-500 !bg-white'}`}
      />
    </div>
  );
};

const CloudServiceNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  const threatCount = data.threats?.length || 0;
  const hasCriticalThreats = data.threats?.some(t => (t.severity || '').toLowerCase() === 'high') || false;
  
  return (
    <div className={`flex flex-col items-center justify-center relative group`}>
      {/* Main circle */}
      <div 
        className={`w-16 h-16 rounded-full flex items-center justify-center 
          ${hasCriticalThreats 
            ? 'bg-gradient-to-br from-gray-500 to-gray-600 border-gray-400' 
            : 'bg-gradient-to-br from-gray-400 to-gray-500 border-gray-300'} 
          ${selected ? 'ring-2 ring-gray-400 ring-offset-2 ring-offset-white border-white' : 'border border-opacity-30'} 
          shadow-md transition-all duration-200 group-hover:shadow-lg group-hover:scale-105`}
      >
        <Cloud className="h-7 w-7 text-white" />
      </div>
      
      {/* Label below */}
      <div className="mt-2 px-2 py-1 bg-white/90 rounded-md text-xs font-medium max-w-[120px] text-center text-gray-700 break-words shadow-sm border border-gray-100">
        {data.label}
      </div>
      
      {/* Threat indicator with tooltip */}
      {threatCount > 0 && (
        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white shadow-sm
          ${hasCriticalThreats ? 'bg-gradient-to-r from-red-500 to-red-600 pulse-animation' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}
          title={`${threatCount} security ${threatCount === 1 ? 'issue' : 'issues'}`}
        >
          {threatCount}
        </div>
      )}
      
      {/* Connection handles */}
      <Handle
        id="cloudInput"
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !border-2 !border-gray-500 !bg-white"
      />
      <Handle
        id="cloudOutput" 
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !border-2 !border-gray-500 !bg-white"
      />
    </div>
  );
};

const SecretNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  const threatCount = data.threats?.length || 0;
  const hasCriticalThreats = data.threats?.some(t => (t.severity || '').toLowerCase() === 'high') || false;
  
  return (
    <div className={`flex flex-col items-center justify-center relative group`}>
      {/* Main circle */}
      <div 
        className={`w-16 h-16 rounded-full flex items-center justify-center 
          ${hasCriticalThreats 
            ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-300' 
            : 'bg-gradient-to-br from-amber-400 to-amber-500 border-amber-200'} 
          ${selected ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-white border-white' : 'border border-opacity-30'} 
          shadow-md transition-all duration-200 group-hover:shadow-lg group-hover:scale-105`}
      >
        <Key className="h-7 w-7 text-white" />
      </div>
      
      {/* Label below */}
      <div className="mt-2 px-2 py-1 bg-white/90 rounded-md text-xs font-medium max-w-[120px] text-center text-gray-700 break-words shadow-sm border border-gray-100">
        {data.label}
      </div>
      
      {/* Threat indicator with tooltip */}
      {threatCount > 0 && (
        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white shadow-sm
          ${hasCriticalThreats ? 'bg-gradient-to-r from-red-500 to-red-600 pulse-animation' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}
          title={`${threatCount} security ${threatCount === 1 ? 'issue' : 'issues'}`}
        >
          {threatCount}
        </div>
      )}
      
      {/* Connection handles */}
      <Handle
        id="secretInput"
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !border-2 !border-amber-500 !bg-white"
      />
      <Handle
        id="secretOutput" 
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !border-2 !border-amber-500 !bg-white"
      />
    </div>
  );
};

// Modern boundary node with colored zones
const BoundaryNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  // Determine boundary color based on label
  const getBoundaryStyles = () => {
    const label = (data.label || '').toLowerCase();
    
    if (label.includes('external')) {
      return {
        borderColor: 'border-red-400',
        bgColor: 'bg-red-50/30',
        textColor: 'text-red-700',
        borderHoverColor: 'hover:border-red-500',
        bgHoverColor: 'hover:bg-red-50/40'
      };
    } else if (label.includes('data')) {
      return {
        borderColor: 'border-green-400',
        bgColor: 'bg-green-50/30',
        textColor: 'text-green-700',
        borderHoverColor: 'hover:border-green-500',
        bgHoverColor: 'hover:bg-green-50/40'
      };
    } else if (label.includes('application') || label.includes('app')) {
      return {
        borderColor: 'border-blue-400',
        bgColor: 'bg-blue-50/30',
        textColor: 'text-blue-700',
        borderHoverColor: 'hover:border-blue-500',
        bgHoverColor: 'hover:bg-blue-50/40'
      };
    } else {
      // Default styling
      return {
        borderColor: selected ? 'border-blue-400' : 'border-gray-300',
        bgColor: 'bg-gray-50/30',
        textColor: 'text-gray-600',
        borderHoverColor: 'hover:border-gray-400',
        bgHoverColor: 'hover:bg-gray-50/40'
      };
    }
  };
  
  const styles = getBoundaryStyles();
  
  return (
    <div className={`relative w-full h-full ${styles.borderColor} border-2 border-dashed rounded-lg ${styles.bgColor} backdrop-blur-sm transition-all duration-200 ${styles.borderHoverColor} ${styles.bgHoverColor}`}>
      <div className={`absolute -top-3 left-5 bg-white px-3 py-1 text-xs font-semibold ${styles.textColor} uppercase tracking-wider shadow-sm rounded-md border border-gray-200 z-20`}>
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
  const [isOpen, setIsOpen] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NODE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  
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
  
  // Helper function to check if a threat targets a node
  const threatTargetsNode = (threat: ThreatItem, nodeId: string): boolean => {
    if (threat.target_elements && Array.isArray(threat.target_elements)) {
      return threat.target_elements.includes(nodeId);
    }
    return false;
  };
  
  // Filter threats based on current filter and search term
  const filteredThreats = sortedThreats.filter(threat => {
    // Apply severity filter
    if (filter !== 'ALL' && filter !== 'NODE' && (threat.severity || 'MEDIUM').toUpperCase() !== filter) {
      return false;
    }
    
    // Apply node filter if selected
    if (filter === 'NODE') {
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
  
  return (
    <div className="absolute top-2 left-2 z-10 bg-white rounded-lg shadow-md overflow-hidden w-80 border border-gray-100 transition-all duration-300 hover:shadow-xl threat-panel-transition" style={{animation: 'slideIn 0.3s forwards'}}>
      <div 
        className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 border-b border-gray-200 flex justify-between items-center"
      >
        <div 
          className="text-xs font-bold flex items-center cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-red-600" />
          Security Issues ({threats.length})
          {isOpen ? 
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
      
      {isOpen && (
        <>
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
                className={`text-[10px] flex-1 mx-0.5 py-1 rounded-md transition-colors ${filter === 'ALL' ? 'bg-gray-200 text-gray-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setFilter('ALL')}
              >
                All
              </button>
              <button 
                className={`text-[10px] flex-1 mx-0.5 py-1 rounded-md transition-colors ${filter === 'HIGH' ? 'bg-red-100 text-red-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
                onClick={() => setFilter('HIGH')}
              >
                <span className="flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
                  High ({highThreats.length})
                </span>
              </button>
              <button 
                className={`text-[10px] flex-1 mx-0.5 py-1 rounded-md transition-colors ${filter === 'MEDIUM' ? 'bg-amber-100 text-amber-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-amber-50'}`}
                onClick={() => setFilter('MEDIUM')}
              >
                <span className="flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1"></span>
                  Medium ({mediumThreats.length})
                </span>
              </button>
              <button 
                className={`text-[10px] flex-1 mx-0.5 py-1 rounded-md transition-colors ${filter === 'LOW' ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}
                onClick={() => setFilter('LOW')}
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
                className={`text-[10px] w-full py-1 rounded-md transition-colors mt-1 flex items-center justify-center ${filter === 'NODE' ? 'bg-indigo-100 text-indigo-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'}`}
                onClick={() => setFilter(filter === 'NODE' ? 'ALL' : 'NODE')}
              >
                <div className="p-0.5 rounded-full bg-indigo-100 mr-1">
                  <div className={`w-2 h-2 rounded-full ${filter === 'NODE' ? 'bg-indigo-500' : 'bg-gray-400'}`}></div>
                </div>
                {filter === 'NODE' ? (
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
                {filter !== 'ALL' && (
                  <button 
                    className="mt-1 text-[10px] text-blue-600 hover:text-blue-800"
                    onClick={() => setFilter('ALL')}
                  >
                    Show all severities
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredThreats.map(threat => (
                  <ThreatCard 
                    key={threat.id} 
                    threat={threat} 
                    severity={threat.severity || 'MEDIUM'}
                    isSelected={selectedThreat?.id === threat.id}
                    onSelect={() => {
                      if (selectedThreat && selectedThreat.id === threat.id) {
                        onThreatSelect(null);
                      } else {
                        onThreatSelect(threat);
                      }
                    }}
                  />
                ))}
                
                {/* Show count of displayed threats vs total */}
                {filteredThreats.length < threats.length && (
                  <div className="text-[10px] text-gray-500 text-center pt-1 border-t border-gray-100">
                    Showing {filteredThreats.length} of {threats.length} threats
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
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
      className={`text-xs rounded-md border shadow-sm ${getSeverityStyle(severity)} hover:shadow transition-all duration-200 cursor-pointer overflow-hidden threat-card-hover-effect ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
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
          
          <p className="font-medium line-clamp-2 text-gray-900 mb-1">
            {threat.description}
          </p>
          
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
  
  // Helper function to check if a threat targets a node
  const threatTargetsNode = (threat: ThreatItem, nodeId: string): boolean => {
    if (threat.target_elements && Array.isArray(threat.target_elements)) {
      return threat.target_elements.includes(nodeId);
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
  if (!node || !zones) return { color: 'rgba(209, 213, 219, 0.05)', zone: 'other' };
  
  // Check if zones is an array we can iterate through
  if (Array.isArray(zones)) {
    // Find what zone the node belongs to based on the boundary elements
    for (const zone of zones) {
      if (zone.element_ids && zone.element_ids.includes(node.id)) {
        if (zone.label.toLowerCase().includes('external')) {
          return { color: 'rgba(239, 68, 68, 0.1)', zone: 'external' };
        } else if (zone.label.toLowerCase().includes('data')) {
          return { color: 'rgba(16, 185, 129, 0.1)', zone: 'data' };
        } else if (zone.label.toLowerCase().includes('application')) {
          return { color: 'rgba(59, 130, 246, 0.1)', zone: 'application' };
        }
      }
    }
  } else if (typeof zones === 'object') {
    // Handle case where zones is an object with zone properties
    // Check if node is in any specific zone based on zones object properties
    if (zones.external && isNodeInZone(node, zones.external)) {
      return { color: 'rgba(239, 68, 68, 0.1)', zone: 'external' };
    } else if (zones.data && isNodeInZone(node, zones.data)) {
      return { color: 'rgba(16, 185, 129, 0.1)', zone: 'data' };
    } else if (zones.application && isNodeInZone(node, zones.application)) {
      return { color: 'rgba(59, 130, 246, 0.1)', zone: 'application' };
    }
  }
  
  // If not found in any zone, determine by node type
  if (node.type === 'externalNode') {
    return { color: 'rgba(124, 58, 237, 0.1)', zone: 'external' };
  } else if (node.type === 'datastoreNode') {
    return { color: 'rgba(16, 185, 129, 0.1)', zone: 'data' };
  } else {
    return {
      color: 'rgba(209, 213, 219, 0.05)', // gray default
      zone: 'other'
    };
  }
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
        width: 8px !important;
        height: 8px !important;
        border-radius: 50% !important;
        background-color: white !important;
      }
      
      .react-flow__node {
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }
      
      /* Pulsing animation for critical threats */
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
        }
        70% {
          box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
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
  const { nodes: dfdNodes = [], edges: dfdEdges = [], boundaries = [], threats = [] } = dfdData;

  // Generate nodes with modern styling
  const initialNodes = useMemo(() => {
    const result = [];
    
    // First add boundaries for z-index ordering
    boundaries.forEach((boundary: any, index) => {
      const boundaryId = boundary.id || `boundary_${index}`;
      const elementIds = boundary.element_ids || [];
      const label = boundary.label || `Boundary ${index + 1}`;
      
      if (elementIds.length === 0) return;
      
      const position = boundary.properties?.position || {
        x: 100 + index * 200,
        y: 100 + index * 100
      };
      
      result.push({
        id: `boundary-${boundaryId}`,
        type: 'boundaryNode',
        position: position,
        style: { 
          width: 600, 
          height: 400,
          zIndex: -1
        },
        data: {
          label: label,
          elements: elementIds
        }
      });
    });
    
    // Helper function to determine node type based on string matching
    const determineNodeType = (nodeId: string, nodeType: string) => {
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
    
    // Add other nodes with appropriate types
    dfdNodes.forEach((node, index) => {
      // Determine the best node type based on ID and type
      const type = determineNodeType(node.id, node.type || '');
      
      // Helper function to check if a threat targets a node
      const threatTargetsNode = (threat: ThreatItem, nodeId: string): boolean => {
        if (threat.target_elements && threat.target_elements.length > 0) {
          return threat.target_elements.includes(nodeId);
        }
        return false;
      };
      
      // Filter threats targeting this node
      const nodeThreats = threats.filter(t => threatTargetsNode(t, node.id));
      
      // Place nodes in a grid layout initially
      const xPos = 200 + (index % 3) * 250;
      const yPos = 200 + Math.floor(index / 3) * 150;
      
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
      
      // Layout dimensions - use wider layout for better separation
      const width = 1600;
      const height = 900;
      
      // Define margins to match the ReactFlow container
      const leftMargin = 180; // Match the marginLeft value in the ReactFlow component
      
      // Add extra padding to leave space for the security issues panel - increased padding
      const securityPanelWidth = 400; // Width for security issues panel
      // Start zones after the toolbar margin
      const toolbarWidth = toolbarOpenRef.current ? 72 + 150 : 12 + 150; // Add extra padding whether toolbar is open or not
      const startingXPos = leftMargin + toolbarWidth; // Position zones starting after the left margin and toolbar
      
      // Zone dimensions and positioning - adjusted to avoid overlap with security panel and toolbar
      const zones = {
        external: { x: startingXPos, y: 100, width: 350, height: height - 200 },
        application: { x: startingXPos + 400, y: 100, width: 600, height: height - 200 },
        data: { x: startingXPos + 1050, y: 100, width: 350, height: height - 200 }
      };
      
      // Improved spacing for clarity
      const nodeSpacingX = 120;
      const nodeSpacingY = 140;
      
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
            position: { x: 100 + (i * 450), y: height - 250 },
            style: {
              ...newNodes[boundaryIndex].style,
              width: 400,
              height: 200,
              zIndex: -10
            }
          };
        }
      });
      
      // Now position nodes within their appropriate zones
      
      // External zone nodes (external entities)
      const externalZoneX = zones.external.x + 100;
      const externalZoneY = zones.external.y + 80;
      externalNodes.forEach((node, i) => {
        const index = newNodes.findIndex(n => n.id === node.id);
        if (index !== -1) {
          const row = Math.floor(i / 2);
          const col = i % 2;
          newNodes[index] = {
            ...newNodes[index],
            position: { 
              x: externalZoneX + (col * nodeSpacingX), 
              y: externalZoneY + (row * nodeSpacingY)
            }
          };
        }
      });
      
      // Also position entity nodes in external zone
      entityNodes.forEach((node, i) => {
        const index = newNodes.findIndex(n => n.id === node.id);
        if (index !== -1) {
          const effectiveIndex = i + externalNodes.length;
          const row = Math.floor(effectiveIndex / 2);
          const col = effectiveIndex % 2;
          newNodes[index] = {
            ...newNodes[index],
            position: { 
              x: externalZoneX + (col * nodeSpacingX), 
              y: externalZoneY + (row * nodeSpacingY)
            }
          };
        }
      });
      
      // Application zone nodes (process nodes, cloud services)
      const appZoneX = zones.application.x + 80;
      const appZoneY = zones.application.y + 80;
      
      // Arrange process nodes in a grid within application zone
      const maxProcessNodesPerRow = 4;
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
      
      // Place cloud nodes below process nodes in application zone
      const cloudNodesY = appZoneY + (Math.ceil(processNodes.length / maxProcessNodesPerRow) * nodeSpacingY) + 50;
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
      
      // Place secret nodes below cloud nodes in application zone
      const secretNodesY = cloudNodesY + (cloudNodes.length > 0 ? nodeSpacingY : 0) + 30;
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
      
      // Data zone nodes (datastores)
      const dataZoneX = zones.data.x + 100;
      const dataZoneY = zones.data.y + 80;
      datastoreNodes.forEach((node, i) => {
        const index = newNodes.findIndex(n => n.id === node.id);
        if (index !== -1) {
          // Arrange in a vertical column
          newNodes[index] = {
            ...newNodes[index],
            position: { 
              x: dataZoneX + (i % 2 * nodeSpacingX), 
              y: dataZoneY + (Math.floor(i / 2) * nodeSpacingY)
            }
          };
        }
      });
      
      // Process specific boundaries (those that contain specific elements)
      boundaryNodes.forEach((boundary) => {
        const elementIds = boundary.data?.elements || [];
        // Skip if this is a zone boundary or has no elements
        if ((boundary.data?.label || '').toLowerCase().includes('zone') || 
            (boundary.data?.label || '').toLowerCase().includes('external') ||
            (boundary.data?.label || '').toLowerCase().includes('application') ||
            (boundary.data?.label || '').toLowerCase().includes('app zone') ||
            (boundary.data?.label || '').toLowerCase().includes('data') ||
            elementIds.length === 0) {
          return;
        }
        
        // Find all nodes within this boundary
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let nodesInBoundary = 0;
        
        newNodes.forEach(node => {
          if (elementIds.includes(node.id) && node.type !== 'boundaryNode') {
            nodesInBoundary++;
            
            // Add padding around node for calculating boundary
            const nodeWidth = 120;
            const nodeHeight = 120;
            
            minX = Math.min(minX, node.position.x - 50);
            minY = Math.min(minY, node.position.y - 50);
            maxX = Math.max(maxX, node.position.x + nodeWidth);
            maxY = Math.max(maxY, node.position.y + nodeHeight);
          }
        });
        
        // Only update if we found nodes
        if (nodesInBoundary > 0) {
          // Add extra margin for better visibility
          const padding = 40;
          const width = maxX - minX + (padding * 2);
          const height = maxY - minY + (padding * 2);
          
          const boundaryIndex = newNodes.findIndex(n => n.id === boundary.id);
          if (boundaryIndex !== -1) {
            newNodes[boundaryIndex] = {
              ...newNodes[boundaryIndex],
              position: { 
                x: minX - padding, 
                y: minY - padding
              },
              style: {
                ...newNodes[boundaryIndex].style,
                width,
                height,
                zIndex: -5 // Higher than zone boundaries but still behind nodes
              }
            };
          }
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
  };

  return (
    <div className="h-full w-full relative bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
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
              type: 'smoothstep',
              style: { strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed },
              labelStyle: { display: 'none', fontSize: 0 },
              labelBgStyle: { display: 'none' }
            }}
            connectionLineComponent={null}
            edgesFocusable={false}
            nodesFocusable={false}
            nodesConnectable={false}
            className="bg-gradient-to-br from-slate-50 to-slate-100 overflow-x-hidden"
            style={{ marginLeft: '180px', overflowX: 'hidden' }} // Consistent left margin
          >
            <MiniMap 
              nodeStrokeColor={(n) => {
                if (n.type === 'boundaryNode') {
                  const label = ((n.data as any)?.label || '').toLowerCase();
                  if (label.includes('external')) return '#f87171'; // red-400
                  if (label.includes('data')) return '#4ade80'; // green-400
                  if (label.includes('application') || label.includes('app')) return '#60a5fa'; // blue-400
                  return '#94a3b8';
                }
                if (n.type === 'processNode') return '#3b82f6'; 
                if (n.type === 'dataStoreNode') return '#06b6d4';
                if (n.type === 'externalNode') {
                  const isInternet = ((n.data as any)?.nodeType || '').toLowerCase() === 'internet' || 
                                     ((n.data as any)?.label || '').toLowerCase().includes('internet');
                  const isCDN = ((n.data as any)?.nodeType || '').toLowerCase() === 'cdn' || 
                                ((n.data as any)?.label || '').toLowerCase().includes('cdn');
                  if (isInternet) return '#0d9488';
                  if (isCDN) return '#7c3aed';
                  return '#8b5cf6';
                }
                if (n.type === 'cloudServiceNode') return '#6b7280';
                if (n.type === 'secretNode') return '#f59e0b';
                return '#6b7280';
              }}
              nodeColor={(n) => {
                if (n.type === 'boundaryNode') {
                  const label = ((n.data as any)?.label || '').toLowerCase();
                  if (label.includes('external')) return '#fee2e2'; // red-100
                  if (label.includes('data')) return '#dcfce7'; // green-100
                  if (label.includes('application') || label.includes('app')) return '#dbeafe'; // blue-100
                  return '#f3f4f6';
                }
                if (n.type === 'processNode') return '#3b82f6';
                if (n.type === 'entityNode') return '#818cf8';
                if (n.type === 'dataStoreNode') return '#06b6d4';
                if (n.type === 'externalNode') {
                  const isInternet = ((n.data as any)?.nodeType || '').toLowerCase() === 'internet' || 
                                     ((n.data as any)?.label || '').toLowerCase().includes('internet');
                  const isCDN = ((n.data as any)?.nodeType || '').toLowerCase() === 'cdn' || 
                                ((n.data as any)?.label || '').toLowerCase().includes('cdn');
                  if (isInternet) return '#0d9488';
                  if (isCDN) return '#7c3aed';
                  return '#8b5cf6';
                }
                if (n.type === 'cloudServiceNode') return '#6b7280';
                if (n.type === 'secretNode') return '#f59e0b';
                return '#f3f4f6';
              }}
              style={{ 
                width: 150, 
                height: 100,
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
              className="shadow-sm"
              maskColor="rgba(240, 240, 250, 0.5)"
            />
            <Background color="#e2e8f0" gap={20} size={1} />
            
            {/* Data Flows legend removed */}
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};
export default DFDVisualization;





