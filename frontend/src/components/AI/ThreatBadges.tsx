import React from 'react';
import { ThreatItem } from '@/interfaces/aiassistedinterfaces';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ThreatBadgesProps {
  nodeId: string;
  threats: ThreatItem[];
  activeSeverityFilter?: string | null; // Add active filter prop
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
  // Skip rendering if no threats or no nodeId
  if (!threats || threats.length === 0 || !nodeId) {
    return null;
  }

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

  return (
    <div className="absolute -top-1 -right-1 flex threat-indicator z-10">
      {/* High Threats Badge - Only show if filter is ALL or HIGH */}
      {showHighBadge && highThreats.length > 0 && (
        <div className="threat-badge threat-badge-high threat-badge-pulse" title={`${highThreats.length} High Severity Threats`}>
          <span className="flex items-center">
            <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
            {highThreats.length}
          </span>
        </div>
      )}
      
      {/* Medium Threats Badge - Only show if filter is ALL or MEDIUM */}
      {showMediumBadge && mediumThreats.length > 0 && (
        <div className="threat-badge threat-badge-medium" title={`${mediumThreats.length} Medium Severity Threats`}>
          <span className="flex items-center">
            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
            {mediumThreats.length}
          </span>
        </div>
      )}
      
      {/* Low Threats Badge - Only show if filter is ALL or LOW */}
      {showLowBadge && lowThreats.length > 0 && (
        <div className="threat-badge threat-badge-low" title={`${lowThreats.length} Low Severity Threats`}>
          <span className="flex items-center">
            <Info className="h-2.5 w-2.5 mr-0.5" />
            {lowThreats.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default ThreatBadges;