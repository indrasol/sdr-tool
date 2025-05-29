import React, { useState, useRef, useEffect } from 'react';
import { ThreatItem } from '@/interfaces/aiassistedinterfaces';
import { AlertCircle, AlertTriangle, Info, XCircle, ChevronRight, ChevronLeft, Shield } from 'lucide-react';

interface ThreatBadgesProps {
  nodeId: string;
  threats: ThreatItem[];
  activeSeverityFilter?: string | null;
}

/**
 * Component to display threat count badges on nodes
 * This should be incorporated into the CustomNode component
 */
export const ThreatBadges: React.FC<ThreatBadgesProps> = ({ 
  nodeId, 
  threats, 
  activeSeverityFilter = 'ALL' 
}) => {
  // State to track which threat category is being hovered or clicked
  const [activeBadge, setActiveBadge] = useState<'high' | 'medium' | 'low' | null>(null);
  // State to track if hover card is pinned (clicked)
  const [isPinned, setIsPinned] = useState(false);
  // State to track the current threat index when viewing multiple threats
  const [currentThreatIndex, setCurrentThreatIndex] = useState(0);
  // Refs for tracking element interactions
  const tooltipRef = useRef<HTMLDivElement>(null);
  const badgeClickedRef = useRef(false);
  
  // Skip rendering if no threats or no nodeId
  if (!threats || threats.length === 0 || !nodeId) {
    return null;
  }

  // Debug logging
  console.log(`Rendering threat badges for node ${nodeId} with ${threats.length} threats`);

  // Helper function to check if a threat targets this node
  const threatTargetsNode = (threat: ThreatItem) => {
    if (!threat) return false;
    
    if (threat.target_elements && Array.isArray(threat.target_elements) && threat.target_elements.length > 0) {
      return threat.target_elements.includes(nodeId);
    }
    
    // Fallback: Check if threat description mentions the node ID
    if (threat.description && typeof threat.description === 'string') {
      return threat.description.toLowerCase().includes(nodeId.toLowerCase());
    }
    
    return false;
  };

  // Filter threats that target this node
  const nodeThreats = threats.filter(threatTargetsNode);
  
  // If no threats target this node, don't render anything
  if (nodeThreats.length === 0) {
    return null;
  }

  // Count threats by severity
  const highThreats = nodeThreats.filter(t => (t.severity || 'MEDIUM').toUpperCase() === 'HIGH');
  const mediumThreats = nodeThreats.filter(t => (t.severity || 'MEDIUM').toUpperCase() === 'MEDIUM');
  const lowThreats = nodeThreats.filter(t => (t.severity || 'MEDIUM').toUpperCase() === 'LOW');

  // Determine which badges to show based on active filter
  const showHighBadge = activeSeverityFilter === 'ALL' || activeSeverityFilter === 'HIGH';
  const showMediumBadge = activeSeverityFilter === 'ALL' || activeSeverityFilter === 'MEDIUM';
  const showLowBadge = activeSeverityFilter === 'ALL' || activeSeverityFilter === 'LOW';

  // Force wrapper to have higher z-index and position closer to node
  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    display: 'flex',
    flexDirection: 'row',
    gap: '3px',
    zIndex: 9999,
    pointerEvents: 'auto',
  };

  // Individual badge styles
  const badgeStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    fontSize: '9px',
    fontWeight: 'bold',
    color: 'white',
    boxShadow: '0 0 0 1.5px white, 0 2px 4px rgba(0,0,0,0.3)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    opacity: 1,
  };

  // Severity-specific styles
  const highStyle: React.CSSProperties = {
    ...badgeStyle,
    backgroundColor: '#ef4444',
    color: 'white',
  };

  const mediumStyle: React.CSSProperties = {
    ...badgeStyle,
    backgroundColor: '#f59e0b',
    color: 'white',
  };

  const lowStyle: React.CSSProperties = {
    ...badgeStyle,
    backgroundColor: '#3b82f6',
    color: 'white',
  };

  // Get current active threats based on badge type
  const getActiveThreats = () => {
    if (activeBadge === 'high') return highThreats;
    if (activeBadge === 'medium') return mediumThreats;
    if (activeBadge === 'low') return lowThreats;
    return [];
  };

  // Get the currently displayed threat
  const currentThreats = getActiveThreats();
  const currentThreat = currentThreats[currentThreatIndex];
  
  // Get threat type from properties or fallback
  const getThreatType = (threat: ThreatItem) => {
    if (threat.properties && typeof threat.properties === 'object' && 'threat_type' in threat.properties) {
      const threatType = threat.properties.threat_type;
      return typeof threatType === 'string' ? threatType.toUpperCase() : 'UNKNOWN';
    }
    
    // Try to extract from description if properties not available
    if (threat.description && typeof threat.description === 'string') {
      const threatTypes = ['SPOOFING', 'TAMPERING', 'REPUDIATION', 'INFORMATION DISCLOSURE', 'DENIAL OF SERVICE', 'ELEVATION OF PRIVILEGE'];
      for (const type of threatTypes) {
        if (threat.description.toUpperCase().includes(type)) {
          return type;
        }
      }
    }
    
    return 'UNKNOWN';
  };
  
  // Get threat ID (create one if not available)
  const getThreatId = (threat: ThreatItem, index: number) => {
    if (threat.id) {
      // If ID is a number, format it with leading zeros
      if (!isNaN(Number(threat.id))) {
        return String(threat.id).padStart(4, '0');
      }
      // Just return the ID without "Threat-" prefix
      return threat.id;
    }
    return String(index + 1).padStart(4, '0');
  };
  
  // Handler for badge mouse enter
  const handleMouseEnter = (badgeType: 'high' | 'medium' | 'low') => {
    if (!isPinned) {
      setActiveBadge(badgeType);
      setCurrentThreatIndex(0); // Reset to first threat when hovering
    }
  };
  
  // Handler for badge mouse leave
  const handleMouseLeave = () => {
    if (!isPinned && !badgeClickedRef.current) {
      setActiveBadge(null);
    }
    badgeClickedRef.current = false;
  };
  
  // Handler for badge click
  const handleBadgeClick = (badgeType: 'high' | 'medium' | 'low', e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling
    badgeClickedRef.current = true;
    
    // If clicking on the same badge type that's already active, just toggle pin state
    if (activeBadge === badgeType && isPinned) {
      setIsPinned(false);
      setTimeout(() => {
        setActiveBadge(null);
      }, 100);
      return;
    }
    
    setActiveBadge(badgeType);
    setIsPinned(true);
    setCurrentThreatIndex(0); // Reset to first threat when clicking
  };
  
  // Handler for close button click
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling
    setIsPinned(false);
    setActiveBadge(null);
  };
  
  // Handle next threat navigation
  const handleNextThreat = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling
    const threats = getActiveThreats();
    if (currentThreatIndex < threats.length - 1) {
      setCurrentThreatIndex(currentThreatIndex + 1);
    }
  };
  
  // Handle previous threat navigation
  const handlePrevThreat = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling
    if (currentThreatIndex > 0) {
      setCurrentThreatIndex(currentThreatIndex - 1);
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    const sev = (severity || '').toUpperCase();
    if (sev === 'HIGH') return '#ef4444';
    if (sev === 'MEDIUM') return '#f59e0b';
    return '#3b82f6';
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    const sev = (severity || '').toUpperCase();
    if (sev === 'HIGH') return <AlertCircle size={14} />;
    if (sev === 'MEDIUM') return <AlertTriangle size={14} />;
    return <Info size={14} />;
  };
  
  // Get gradient style for card header based on severity
  const getHeaderGradient = (severity: string) => {
    const sev = (severity || '').toUpperCase();
    if (sev === 'HIGH') {
      return 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)';
    }
    if (sev === 'MEDIUM') {
      return 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)';
    }
    return 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)';
  };

  // Style for the threat tooltip with enhanced modern styling
  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-10px',
    right: '30px',
    transform: 'translateY(-100%)',
    width: '280px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05), 0 2px 6px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    zIndex: 10000,
    pointerEvents: 'auto',
    color: '#1f2937',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '12px',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.8)',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    animation: isPinned ? 'none' : 'fadeIn 0.2s ease',
  };

  return (
    <div style={wrapperStyle} className="threat-indicator" data-testid={`threat-badges-${nodeId}`}>
      {/* High Threats Badge */}
      {showHighBadge && highThreats.length > 0 && (
        <div 
          style={{
            ...highStyle,
            transform: activeBadge === 'high' ? 'scale(1.2)' : 'scale(1)',
            boxShadow: activeBadge === 'high' 
              ? '0 0 0 2px white, 0 3px 8px rgba(239, 68, 68, 0.4)' 
              : '0 0 0 1.5px white, 0 2px 4px rgba(0,0,0,0.3)',
          }} 
          className={`threat-badge threat-badge-high ${activeBadge !== 'high' && 'threat-badge-pulse'}`}
          aria-label={`${highThreats.length} High Severity Threats`}
          onMouseEnter={() => handleMouseEnter('high')}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => handleBadgeClick('high', e)}
        >
          <span className="flex items-center">
            <AlertCircle className="h-3 w-3 mr-0.5" />
            {highThreats.length}
          </span>
        </div>
      )}
      
      {/* Medium Threats Badge */}
      {showMediumBadge && mediumThreats.length > 0 && (
        <div 
          style={{
            ...mediumStyle,
            transform: activeBadge === 'medium' ? 'scale(1.2)' : 'scale(1)',
            boxShadow: activeBadge === 'medium' 
              ? '0 0 0 2px white, 0 3px 8px rgba(245, 158, 11, 0.4)' 
              : '0 0 0 1.5px white, 0 2px 4px rgba(0,0,0,0.3)',
          }}
          className="threat-badge threat-badge-medium" 
          aria-label={`${mediumThreats.length} Medium Severity Threats`}
          onMouseEnter={() => handleMouseEnter('medium')}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => handleBadgeClick('medium', e)}
        >
          <span className="flex items-center">
            <AlertTriangle className="h-3 w-3 mr-0.5" />
            {mediumThreats.length}
          </span>
        </div>
      )}
      
      {/* Low Threats Badge */}
      {showLowBadge && lowThreats.length > 0 && (
        <div 
          style={{
            ...lowStyle,
            transform: activeBadge === 'low' ? 'scale(1.2)' : 'scale(1)',
            boxShadow: activeBadge === 'low' 
              ? '0 0 0 2px white, 0 3px 8px rgba(59, 130, 246, 0.4)' 
              : '0 0 0 1.5px white, 0 2px 4px rgba(0,0,0,0.3)',
          }}
          className="threat-badge threat-badge-low" 
          aria-label={`${lowThreats.length} Low Severity Threats`}
          onMouseEnter={() => handleMouseEnter('low')}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => handleBadgeClick('low', e)}
        >
          <span className="flex items-center">
            <Info className="h-3 w-3 mr-0.5" />
            {lowThreats.length}
          </span>
        </div>
      )}

      {/* Hover Card for Detailed Threat Info */}
      {activeBadge && currentThreat && (
        <div 
          ref={tooltipRef}
          style={tooltipStyle} 
          className="threat-tooltip"
          onClick={(e) => e.stopPropagation()} // Prevent click from bubbling
        >
          {/* Enhanced gradient header with threat ID and type */}
          <div style={{ 
            background: getHeaderGradient(currentThreat.severity || 'MEDIUM'),
            color: 'white',
            padding: '12px 15px',
            fontWeight: 600,
            fontSize: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '12px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div>
              {/* Threat ID and Type */}
              <div className="flex items-center">
                <Shield size={14} className="mr-2" />
                {getThreatId(currentThreat, currentThreatIndex)}
              </div>
              <div style={{
                fontSize: '10px',
                opacity: 0.9,
                marginTop: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 500,
              }}>
                {getThreatType(currentThreat)}
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              {/* Pagination controls - only show if multiple threats */}
              {currentThreats.length > 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '10px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  padding: '2px 4px',
                }}>
                  <button
                    onClick={handlePrevThreat}
                    disabled={currentThreatIndex === 0}
                    style={{
                      opacity: currentThreatIndex === 0 ? 0.5 : 1,
                      cursor: currentThreatIndex === 0 ? 'default' : 'pointer',
                      background: 'none',
                      border: 'none',
                      padding: '2px',
                      display: 'flex',
                      color: 'white',
                    }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span>{currentThreatIndex + 1}/{currentThreats.length}</span>
                  <button
                    onClick={handleNextThreat}
                    disabled={currentThreatIndex === currentThreats.length - 1}
                    style={{
                      opacity: currentThreatIndex === currentThreats.length - 1 ? 0.5 : 1,
                      cursor: currentThreatIndex === currentThreats.length - 1 ? 'default' : 'pointer',
                      background: 'none',
                      border: 'none',
                      padding: '2px',
                      display: 'flex',
                      color: 'white',
                    }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
              <button 
                onClick={handleClose}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  border: 'none',
                  borderRadius: '50%', 
                  cursor: 'pointer',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                className="hover:bg-white/30"
              >
                <XCircle size={14} color="white" />
              </button>
            </div>
            
            {/* Decorative element */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Content area with nice padding */}
          <div style={{ padding: '0 15px 15px' }}>
            {/* Threat Description */}
            <div style={{ 
              marginBottom: '12px', 
              lineHeight: '1.5',
              color: '#4B3A3F',
              padding: '10px 12px',
              background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.06) 0%, rgba(239, 68, 68, 0.03) 100%)',
              borderRadius: '8px',
              border: '1px solid rgba(248, 113, 113, 0.15)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)',
              fontFamily: 'Geneva, sans-serif',
              fontWeight: 'bold',
              fontSize: '10px'
            }}>
              {currentThreat.description || 'No description available'}
            </div>

            {/* Mitigation if available */}
            {currentThreat.mitigation && (
              <div>
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: '11px', 
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'linear-gradient(to right, #10b981, #34d399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: 'linear-gradient(135deg, #10b981, #34d399)',
                    borderRadius: '2px',
                    marginRight: '6px',
                  }} />
                  Recommended Mitigation
                </div>
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(52, 211, 153, 0.03) 100%)', 
                  padding: '10px 12px',
                  borderRadius: '8px',
                  color: '#4B5563',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)',
                  fontFamily: 'Geneva, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '10px'
                }}>
                  {currentThreat.mitigation}
                </div>
              </div>
            )}

            {/* Target Elements */}
            {currentThreat.target_elements && currentThreat.target_elements.length > 0 && (
              <div style={{ 
                marginTop: '12px', 
                fontSize: '10px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(79, 70, 229, 0.03) 100%)',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(99, 102, 241, 0.1)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)'
              }}>
                <span style={{ 
                  fontWeight: 600,
                  background: 'linear-gradient(to right, #6366f1, #4f46e5)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: 'transparent',
                  marginBottom: '6px',
                  display: 'block'
                }}>Affects:</span> 
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '4px', 
                  marginTop: '6px' 
                }}>
                  {(currentThreat.properties?.target_elements_labels && 
                    Array.isArray(currentThreat.properties.target_elements_labels) && 
                    currentThreat.properties.target_elements_labels.length > 0 
                      ? currentThreat.properties.target_elements_labels 
                      : currentThreat.target_elements
                  ).map((label, idx) => (
                    <span 
                      key={idx} 
                      style={{ 
                        fontSize: '9px', 
                        backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                        color: '#4f46e5', 
                        padding: '3px 6px', 
                        borderRadius: '4px', 
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        fontWeight: 'bold',
                        fontFamily: 'Geneva, sans-serif'
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Add CSS animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-100%) scale(0.95); }
            to { opacity: 1; transform: translateY(-100%) scale(1); }
          }
          
          .threat-badge-pulse {
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0% { 
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7), 0 0 0 1.5px white, 0 2px 4px rgba(0,0,0,0.3); 
            }
            70% { 
              transform: scale(1.05);
              box-shadow: 0 0 0 10px rgba(239, 68, 68, 0), 0 0 0 1.5px white, 0 2px 4px rgba(0,0,0,0.3); 
            }
            100% { 
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0), 0 0 0 1.5px white, 0 2px 4px rgba(0,0,0,0.3); 
            }
          }
          
          .threat-badge:hover {
            transform: scale(1.1);
            transition: transform 0.2s ease;
          }
          
          .threat-badge-high {
            background-color: #ef4444 !important;
            color: white !important;
          }
          
          .threat-badge-medium {
            background-color: #f59e0b !important;
            color: white !important;
          }
          
          .threat-badge-low {
            background-color: #3b82f6 !important;
            color: white !important;
          }
        `}
      </style>
    </div>
  );
};

export default ThreatBadges;