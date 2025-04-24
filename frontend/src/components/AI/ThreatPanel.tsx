import React, { useState } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  ArrowRightCircle, 
  Info,
  Shield,
  ChevronRight,
  ShieldCheck,
  Target,
  X
} from 'lucide-react';
import { ThreatItem } from '@/interfaces/aiassistedinterfaces';
import { Node } from '@xyflow/react';

interface ThreatPanelProps {
  threats: ThreatItem[];
  onThreatSelect: (threat: ThreatItem | null) => void;
  selectedThreat: ThreatItem | null;
  selectedNode: Node | null;
  onRunThreatAnalysis?: () => void;
}

// Component for displaying individual threat cards
const ThreatCard: React.FC<{ 
  threat: ThreatItem;
  severity: string;
  isSelected?: boolean;
  onSelect?: () => void;
}> = ({ threat, severity, isSelected = false, onSelect = () => {} }) => {
  const getSeverityStyle = (sev: string) => {
    switch(sev.toUpperCase()) {
      case 'HIGH':
        return 'border-red-200 bg-gradient-to-r from-red-50 to-white shadow-sm shadow-red-100';
      case 'MEDIUM':
        return 'border-amber-200 bg-gradient-to-r from-amber-50 to-white shadow-sm shadow-amber-100';
      case 'LOW':
        return 'border-blue-200 bg-gradient-to-r from-blue-50 to-white shadow-sm shadow-blue-100';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };
  
  const getSeverityIconStyle = (sev: string) => {
    switch(sev.toUpperCase()) {
      case 'HIGH':
        return (
          <div className="p-1 rounded-full bg-red-100 mr-1 flex-shrink-0">
            <AlertCircle className="h-3 w-3 text-red-600" />
          </div>
        );
      case 'MEDIUM':
        return (
          <div className="p-1 rounded-full bg-amber-100 mr-1 flex-shrink-0">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
          </div>
        );
      case 'LOW':
        return (
          <div className="p-1 rounded-full bg-blue-100 mr-1 flex-shrink-0">
            <Info className="h-3 w-3 text-blue-600" />
          </div>
        );
      default:
        return (
          <div className="p-1 rounded-full bg-gray-100 mr-1 flex-shrink-0">
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
  
  // Get threat properties
  const mitigationText = threat.mitigation || 'No mitigation specified';
  const targetElements = threat.target_elements || [];
  const threatType = threat.properties?.threat_type as string || 'UNKNOWN';
  const impact = threat.properties?.impact as string || 'Unknown impact';
  const attackVector = threat.properties?.attack_vector as string || 'Unknown attack vector';
  
  // Function to get appropriate tag style based on type
  const getTagStyle = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('injection') || lowerType.includes('xss')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    } else if (lowerType.includes('authentication') || lowerType.includes('session')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (lowerType.includes('data') || lowerType.includes('exposure')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (lowerType.includes('denial') || lowerType.includes('ddos')) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else {
      return 'bg-violet-100 text-violet-800 border-violet-200';
    }
  };
  
  return (
    <div 
      className={`relative overflow-hidden rounded-md border ${isSelected ? getSeverityStyle(severity) : 'border-gray-200 bg-white hover:border-gray-300'} transition-all transform hover:-translate-y-0.5 duration-150 cursor-pointer shadow-sm hover:shadow`}
      onClick={onSelect}
    >
      <div className="px-2 py-1 flex items-start">
        {/* Severity icon */}
        {getSeverityIconStyle(severity)}
        
        <div className="flex-1 min-w-0">
          {/* ID and Title (Description) */}
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[8px] text-gray-500 font-mono">{threat.id}</span>
          </div>
          
          <div className="group relative">
            <p className="font-medium line-clamp-2 text-gray-900 text-xs mb-0.5 font-sans">
              {threat.description}
            </p>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute z-20 w-72 bg-gray-900 text-white text-[10px] rounded shadow-lg p-2 pointer-events-none -left-1 transform -translate-y-2">
              {threat.description}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold border ${getSeverityBadgeStyle(severity)}`}>
              {severity.toUpperCase()}
            </span>
            <span className={`text-[8px] px-1.5 py-0.5 rounded border ${getTagStyle(threatType)}`}>
              {threatType}
            </span>
          </div>
        </div>
      </div>
      
      {/* Details section - always visible but more compact */}
      <div className="px-2 py-1 border-t border-gray-100 text-[9px] bg-gray-50 grid grid-cols-1 gap-1">
        {/* Attack Vector */}
        <div className="rounded overflow-hidden border border-gray-200">
          <div className="bg-blue-50 px-1.5 py-0.5 font-bold text-blue-800 border-b border-blue-100 flex items-center text-[9px]" style={{ fontFamily: 'Geneva, sans-serif' }}>
            <AlertTriangle className="w-2.5 h-2.5 mr-1 text-blue-500" />
            Attack Vector
          </div>
          <div className="px-1.5 py-0.5 bg-white text-gray-700 text-[10px] font-semibold font-sans">
            {attackVector}
          </div>
        </div>
        
        {/* Impact */}
        <div className="rounded overflow-hidden border border-gray-200">
          <div className="bg-red-50 px-1.5 py-0.5 font-bold text-red-800 border-b border-red-100 flex items-center text-[9px]" style={{ fontFamily: 'Geneva, sans-serif' }}>
            <AlertCircle className="w-2.5 h-2.5 mr-1 text-red-500" />
            Impact
          </div>
          <div className="px-1.5 py-0.5 bg-white text-gray-700 text-[10px] font-semibold font-sans">
            {impact}
          </div>
        </div>
        
        {/* Mitigation */}
        <div className="rounded overflow-hidden border border-gray-200">
          <div className="bg-green-50 px-1.5 py-0.5 font-bold text-green-800 border-b border-green-100 flex items-center text-[9px]" style={{ fontFamily: 'Geneva, sans-serif' }}>
            <ShieldCheck className="w-2.5 h-2.5 mr-1 text-green-500" />
            Mitigation
          </div>
          <div className="px-1.5 py-0.5 bg-white text-gray-700 text-[10px] font-semibold font-sans">
            {mitigationText}
          </div>
        </div>
        
        {/* Target Elements - Only show if there are actually targets */}
        {targetElements.length > 0 && (
          <div className="rounded overflow-hidden border border-gray-200">
            <div className="bg-indigo-50 px-1.5 py-0.5 font-bold text-indigo-800 border-b border-indigo-100 flex items-center text-[9px]" style={{ fontFamily: 'Geneva, sans-serif' }}>
              <Target className="w-2.5 h-2.5 mr-1 text-indigo-500" />
              Affected Components ({targetElements.length})
            </div>
            <div className="px-1.5 py-0.5 bg-white text-gray-700">
              <div className="flex flex-wrap gap-0.5">
                {targetElements.map((element, idx) => (
                  <span key={idx} className="inline-flex items-center text-[9px] bg-gray-100 rounded px-1 py-0.5 text-gray-700 font-semibold font-sans">
                    <span className="truncate max-w-[120px]">{element}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main ThreatPanel component
const ThreatPanel: React.FC<ThreatPanelProps> = ({
  threats,
  onThreatSelect,
  selectedThreat,
  selectedNode,
  onRunThreatAnalysis
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string | null>('ALL');
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
      const attackVector = (threat.properties?.attack_vector as string || '').toLowerCase();
      const impact = (threat.properties?.impact as string || '').toLowerCase();
      
      return description.includes(search) || 
             id.includes(search) || 
             mitigation.includes(search) || 
             attackVector.includes(search) || 
             impact.includes(search);
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
          className="bg-gradient-to-r from-red-50 to-red-100 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <div className="text-xs font-bold flex items-center font-sans">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-red-600" />
            <span className={highThreats.length > 0 ? "threat-badge-pulse text-red-700" : "text-red-700"}>
              {highThreats.length} High
            </span>
            <span className="mx-1 text-gray-400">•</span>
            <span className="text-amber-600">
              {mediumThreats.length} Medium
            </span>
            <span className="mx-1 text-gray-400">•</span>
            <span className="text-blue-600">
              {lowThreats.length} Low
            </span>
          </div>
          <div className="flex items-center">
            <button
              className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-[9px] mr-1 transition-colors font-medium flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                if (onRunThreatAnalysis) onRunThreatAnalysis();
              }}
              title="Run Threat Analysis"
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              Run Analysis
            </button>
            <button className="text-red-400 hover:text-red-600">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
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
    <div className="absolute top-2 left-2 z-10 bg-white rounded-lg shadow-lg overflow-hidden w-80 border border-gray-200 transition-all duration-300 hover:shadow-xl threat-panel-transition font-sans" style={{animation: 'slideIn 0.3s forwards', maxHeight: '70vh'}}>
      <div 
        className="bg-gradient-to-r from-red-50 to-red-100 px-3 py-1 border-b border-gray-200 flex justify-between items-center"
      >
        <div 
          className="text-xs font-bold flex items-center cursor-pointer text-red-700"
          onClick={() => setIsMinimized(true)}
        >
          <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
          Security Issues ({threats.length})
          {isMinimized ? 
            <ChevronUp className="w-4 h-4 ml-1 text-red-400" /> : 
            <ChevronDown className="w-4 h-4 ml-1 text-red-400" />
          }
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-[9px] transition-colors font-medium flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              if (onRunThreatAnalysis) onRunThreatAnalysis();
            }}
            title="Run Threat Analysis"
          >
            <AlertTriangle className="w-2.5 h-2.5" />
            Run Analysis
          </button>
          <button 
            className="text-red-400 hover:text-red-600" 
            onClick={() => setIsMinimized(true)}
            title="Minimize"
          >
            <ArrowRightCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Search and filter controls */}
      <div className="p-1 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center mb-1">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search threats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs py-0.5 pl-6 pr-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 font-sans"
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
            className={`text-[9px] flex-1 mx-0.5 py-0.5 rounded-md transition-colors font-sans ${severityFilter === 'ALL' ? 'bg-gray-200 text-gray-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setSeverityFilter('ALL')}
          >
            All
          </button>
          <button 
            className={`text-[9px] flex-1 mx-0.5 py-0.5 rounded-md transition-colors font-sans ${severityFilter === 'HIGH' ? 'bg-red-100 text-red-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
            onClick={() => setSeverityFilter('HIGH')}
          >
            <span className="flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
              High ({highThreats.length})
            </span>
          </button>
          <button 
            className={`text-[9px] flex-1 mx-0.5 py-0.5 rounded-md transition-colors font-sans ${severityFilter === 'MEDIUM' ? 'bg-amber-100 text-amber-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-amber-50'}`}
            onClick={() => setSeverityFilter('MEDIUM')}
          >
            <span className="flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1"></span>
              Medium ({mediumThreats.length})
            </span>
          </button>
          <button 
            className={`text-[9px] flex-1 mx-0.5 py-0.5 rounded-md transition-colors font-sans ${severityFilter === 'LOW' ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}
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
            className={`text-[9px] w-full py-0.5 rounded-md transition-colors mt-1 flex items-center justify-center font-sans ${severityFilter === 'NODE' ? 'bg-indigo-100 text-indigo-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'}`}
            onClick={() => setSeverityFilter(severityFilter === 'NODE' ? 'ALL' : 'NODE')}
          >
            <div className="p-0.5 rounded-full bg-indigo-100 mr-1">
              <div className={`w-1.5 h-1.5 rounded-full ${severityFilter === 'NODE' ? 'bg-indigo-500' : 'bg-gray-400'}`}></div>
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
      
      {/* Threat list content - shorter fixed height */}
      <div className="p-1 max-h-[240px] overflow-y-auto overflow-x-hidden bg-gray-50/50">
        {filteredThreats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-gray-500">
            <AlertCircle className="h-6 w-6 mb-2 text-gray-300" />
            <p className="text-xs font-sans">No threats match your criteria</p>
            {searchTerm && (
              <button 
                className="mt-2 text-[9px] text-red-600 hover:text-red-800 font-sans"
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </button>
            )}
            {severityFilter !== 'ALL' && (
              <button 
                className="mt-1 text-[9px] text-red-600 hover:text-red-800 font-sans"
                onClick={() => setSeverityFilter('ALL')}
              >
                Show all severities
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
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

export default ThreatPanel; 