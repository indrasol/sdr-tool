import React, { useState, useEffect } from 'react';
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
  X,
  Activity,
  Move,
  Lock,
  Unlock
} from 'lucide-react';
import { ThreatItem } from '@/interfaces/aiassistedinterfaces';
import { Node } from '@xyflow/react';

interface ThreatPanelProps {
  threats: ThreatItem[];
  onThreatSelect: (threat: ThreatItem | null) => void;
  selectedThreat: ThreatItem | null;
  selectedNode: Node | null;
  onRunThreatAnalysis?: () => void;
  activeSeverityFilter?: string;
  setActiveSeverityFilter?: React.Dispatch<React.SetStateAction<string>>;
  isAutoZoomEnabled?: boolean;
  setIsAutoZoomEnabled?: React.Dispatch<React.SetStateAction<boolean>>;
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
  const targetLabels = threat.properties?.target_elements_labels as string[] || [];
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
  
  // Get header gradient style based on severity
  const getHeaderGradientStyle = (sev: string) => {
    switch(sev.toUpperCase()) {
      case 'HIGH':
        return 'bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200';
      case 'MEDIUM':
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200';
      case 'LOW':
        return 'bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200';
    }
  };
  
  return (
    <div 
      className={`relative overflow-hidden rounded-md border ${isSelected ? getSeverityStyle(severity) : 'border-gray-200 bg-white hover:border-gray-300'} transition-all transform hover:-translate-y-0.5 duration-150 cursor-pointer shadow-sm hover:shadow threat-card threat-card-container`}
      onClick={onSelect}
    >
      <div className={`px-2 py-1 flex items-start ${getHeaderGradientStyle(severity)}`}>
        {/* Severity icon */}
        {getSeverityIconStyle(severity)}
        
        <div className="flex-1 min-w-0">
          {/* ID and Title (Description) */}
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[8px] text-gray-500 font-mono">{threat.id}</span>
          </div>
          
          <p className="font-medium line-clamp-2 text-gray-900 text-xs mb-0.5 font-sans">
            {threat.description}
          </p>
          
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
      <div className="px-2 py-1 border-t border-gray-100 bg-white">
        {/* Attack Vector */}
        <div className="mt-1">
          <div className="flex items-center mb-1 bg-blue-50/70 rounded px-1.5 py-0.5">
            <AlertTriangle className="h-3 w-3 text-blue-600 mr-1" />
            <span className="text-[10px] font-semibold text-blue-700">Attack Vector:</span>
          </div>
          <p className="text-[10px] text-gray-600 bg-blue-50 p-1.5 rounded border border-blue-100" style={{ fontFamily: 'Geneva, sans-serif', fontWeight: 'bold' }}>
            {attackVector}
          </p>
        </div>
        
        {/* Impact */}
        <div className="mt-2">
          <div className="flex items-center mb-1 bg-red-50/70 rounded px-1.5 py-0.5">
            <Activity className="h-3 w-3 text-red-600 mr-1" />
            <span className="text-[10px] font-semibold text-red-700">Impact:</span>
          </div>
          <p className="text-[10px] text-gray-600 bg-red-50 p-1.5 rounded border border-red-100" style={{ fontFamily: 'Geneva, sans-serif', fontWeight: 'bold' }}>
            {impact}
          </p>
        </div>
        
        {/* Mitigation */}
        <div className="mt-2">
          <div className="flex items-center mb-1 bg-green-50/70 rounded px-1.5 py-0.5">
            <Shield className="h-3 w-3 text-green-600 mr-1" />
            <span className="text-[10px] font-semibold text-green-700">Mitigation:</span>
          </div>
          <p className="text-[10px] text-gray-600 bg-green-50 p-1.5 rounded border border-green-100" style={{ fontFamily: 'Geneva, sans-serif', fontWeight: 'bold' }}>
            {mitigationText}
          </p>
        </div>
        
        {/* Target Elements - Only show if there are actually targets */}
        {targetElements.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center mb-1 bg-blue-50/70 rounded px-1.5 py-0.5">
              <Target className="h-3 w-3 text-blue-600 mr-1" />
              <span className="text-[10px] font-semibold text-blue-700">Affects:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {targetLabels.length > 0 ? 
                // Use friendly labels if available
                targetLabels.map((label, idx) => (
                  <span key={idx} className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100" style={{ fontFamily: 'Geneva, sans-serif', fontWeight: 'bold' }}>
                    {label}
                  </span>
                )) :
                // Fall back to element IDs if no labels
                targetElements.map((element, idx) => (
                  <span key={idx} className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100" style={{ fontFamily: 'Geneva, sans-serif', fontWeight: 'bold' }}>
                    {element}
                  </span>
                ))
              }
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
  onRunThreatAnalysis,
  activeSeverityFilter,
  setActiveSeverityFilter,
  isAutoZoomEnabled = false,
  setIsAutoZoomEnabled
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string | null>(activeSeverityFilter || 'ALL');
  const [isMinimized, setIsMinimized] = useState(false);
  // Add state for locking the analysis button
  const [isAnalysisLocked, setIsAnalysisLocked] = useState(false);
  
  // Sync external activeSeverityFilter with local severityFilter
  useEffect(() => {
    if (activeSeverityFilter && activeSeverityFilter !== severityFilter) {
      setSeverityFilter(activeSeverityFilter);
    }
  }, [activeSeverityFilter]);

  // Function to update both local and global filter states
  const updateFilter = (filter: string) => {
    setSeverityFilter(filter);
    if (setActiveSeverityFilter) {
      setActiveSeverityFilter(filter);
    }
  };
  
  // Function to handle auto-zoom toggle
  const handleAutoZoomToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (setIsAutoZoomEnabled) {
      setIsAutoZoomEnabled(e.target.checked);
    }
  };
  
  // Function to toggle the analysis button lock
  const toggleAnalysisLock = () => {
    setIsAnalysisLocked(!isAnalysisLocked);
  };
  
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
              className={`p-1 bg-gradient-to-r from-red-100 to-red-200 rounded-md text-[9px] mr-1 transition-all hover:from-red-200 hover:to-red-300 text-red-700 font-medium flex items-center gap-1 shadow-sm border border-red-200 ${isAnalysisLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!isAnalysisLocked && onRunThreatAnalysis) onRunThreatAnalysis();
              }}
              disabled={isAnalysisLocked}
              title={isAnalysisLocked ? "Analysis button is locked" : "Run Threat Analysis"}
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
    <div className="absolute top-2 left-2 z-10 bg-white rounded-lg shadow-lg w-80 border border-gray-200 transition-all duration-300 hover:shadow-xl threat-panel-transition font-sans" 
      style={{
        animation: 'slideIn 0.3s forwards', 
        maxHeight: '70vh', 
        overflow: 'visible' // This ensures tooltips aren't clipped by the container
      }}>
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
          
          
          {/* Run analysis button with locked state */}
          <button
            className={`p-1 bg-gradient-to-r from-red-100 to-red-200 rounded-md text-[9px] transition-all hover:from-red-200 hover:to-red-300 text-red-700 font-medium flex items-center gap-1 shadow-sm border border-red-200 ${isAnalysisLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isAnalysisLocked && onRunThreatAnalysis) onRunThreatAnalysis();
            }}
            disabled={isAnalysisLocked}
            title={isAnalysisLocked ? "Analysis button is locked" : "Run Threat Analysis"}
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
            onClick={() => updateFilter('ALL')}
          >
            All
          </button>
          <button 
            className={`text-[9px] flex-1 mx-0.5 py-0.5 rounded-md transition-colors font-sans ${severityFilter === 'HIGH' ? 'bg-red-100 text-red-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
            onClick={() => updateFilter('HIGH')}
          >
            <span className="flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
              High ({highThreats.length})
            </span>
          </button>
          <button 
            className={`text-[9px] flex-1 mx-0.5 py-0.5 rounded-md transition-colors font-sans ${severityFilter === 'MEDIUM' ? 'bg-amber-100 text-amber-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-amber-50'}`}
            onClick={() => updateFilter('MEDIUM')}
          >
            <span className="flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1"></span>
              Medium ({mediumThreats.length})
            </span>
          </button>
          <button 
            className={`text-[9px] flex-1 mx-0.5 py-0.5 rounded-md transition-colors font-sans ${severityFilter === 'LOW' ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}
            onClick={() => updateFilter('LOW')}
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
            onClick={() => updateFilter(severityFilter === 'NODE' ? 'ALL' : 'NODE')}
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

        {/* Add toggle section that includes both toggles */}
        <div className="px-2 pt-1 pb-2 mt-1 border-t border-gray-100 flex flex-col gap-2">
          {/* Auto-zoom toggle */}
          <div className={`flex items-center auto-zoom-toggle ${isAutoZoomEnabled ? 'auto-zoom-enabled' : ''}`}>
            <label className="flex items-center cursor-pointer text-[9px] text-gray-600 font-sans">
              <input
                type="checkbox"
                checked={isAutoZoomEnabled}
                onChange={handleAutoZoomToggle}
                className="form-checkbox h-3 w-3 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <span className="ml-1 flex items-center">
                <Move className="w-2.5 h-2.5 text-indigo-500 mr-1" />
                Auto-zoom to nodes when threat is selected.
              </span>
            </label>
            <div className="ml-auto">
              {isAutoZoomEnabled ? (
                <span className="text-[8px] px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                  Enabled
                </span>
              ) : (
                <span className="text-[8px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                  Disabled
                </span>
              )}
            </div>
          </div>
          
          {/* Analysis lock toggle */}
          <div className={`flex items-center auto-zoom-toggle ${isAnalysisLocked ? 'analysis-locked' : ''}`}>
            <label className="flex items-center cursor-pointer text-[9px] text-gray-600 font-sans">
              <input
                type="checkbox"
                checked={isAnalysisLocked}
                onChange={() => setIsAnalysisLocked(!isAnalysisLocked)}
                className="form-checkbox h-3 w-3 text-gray-600 rounded border-gray-300 focus:ring-gray-500"
              />
              <span className="ml-1 flex items-center">
                {isAnalysisLocked ? (
                  <Lock className="w-2.5 h-2.5 text-gray-500 mr-1" />
                ) : (
                  <Unlock className="w-2.5 h-2.5 text-gray-500 mr-1" />
                )}
                Lock analysis button
              </span>
            </label>
            <div className="ml-auto">
              {isAnalysisLocked ? (
                <span className="text-[8px] px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded-full border border-gray-200">
                  Locked
                </span>
              ) : (
                <span className="text-[8px] px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded-full border border-gray-200">
                  Unlocked
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Threat list content - shorter fixed height */}
      <div className="p-1 max-h-[240px] overflow-y-auto overflow-x-hidden bg-gray-50/50"
        style={{ 
          position: 'relative', 
          zIndex: 1 
        }}>
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
                onClick={() => updateFilter('ALL')}
              >
                Show all severities
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1" style={{ overflow: 'visible' }}>
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