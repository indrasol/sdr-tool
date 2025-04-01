import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, X } from 'lucide-react';
import { Edge } from '@xyflow/react';

// Props interface for the FlowLegend component
interface FlowLegendProps {
  edges: Edge[];
  nodes: any[]; // Using 'any' to match existing code structure
}

// Define node types for the legend
const nodeTypes = [
  { type: 'Security', color: '#E53E3E', background: '#FFF5F5' },
  { type: 'Server', color: '#38A169', background: '#F0FFF4' },
  { type: 'Database', color: '#3182CE', background: '#EBF8FF' },
  { type: 'Network', color: '#805AD5', background: '#FAF5FF' },
  { type: 'API', color: '#DD6B20', background: '#FFFAF0' },
  { type: 'Cloud', color: '#319795', background: '#E6FFFA' }
];

// Define known connection types
const connectionTypeColors = {
  'default': { color: '#555555', dashed: false },
  'dataFlow': { color: '#1d4ed8', dashed: false },
  'network': { color: '#0369a1', dashed: false },
  'database': { color: '#15803d', dashed: false },
  'log': { color: '#a16207', dashed: true },
  'security': { color: '#9333ea', dashed: false },
  'secure-connection': { color: '#16a34a', dashed: false },
  'vulnerable': { color: '#dc2626', dashed: true }
};

// Helper function to get node color by type
const getNodeColorByType = (type: string) => {
  const nodeType = nodeTypes.find(node => 
    node.type.toLowerCase() === (type || '').toLowerCase() || 
    (type || '').toLowerCase().includes(node.type.toLowerCase())
  );
  return nodeType ? { color: nodeType.color, background: nodeType.background } : { color: '#718096', background: '#E2E8F0' };
};

// Helper to get a readable name for a connection type
const getConnectionTypeName = (type: string) => {
  const typeMap = {
    'default': 'Default',
    'dataFlow': 'Data Flow',
    'network': 'Network',
    'database': 'Database',
    'log': 'Log',
    'security': 'Security',
    'secure-connection': 'Secure Connection',
    'vulnerable': 'Vulnerable'
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

const FlowLegend: React.FC<FlowLegendProps> = ({ edges, nodes }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [displayedConnections, setDisplayedConnections] = useState([]);
  const [maxHeight, setMaxHeight] = useState(300); // Initial max height

  // Process edges to create connection information
  useEffect(() => {
    if (!edges || edges.length === 0 || !nodes || nodes.length === 0) {
      setDisplayedConnections([]);
      return;
    }

    // Create a map of node IDs to their data
    const nodeMap = new Map();
    nodes.forEach(node => {
      nodeMap.set(node.id, {
        label: node.data?.label || 'Unknown',
        type: node.data?.nodeType || 'default'
      });
    });

    // Group edges by type
    const groupedEdges = {};
    edges.forEach(edge => {
      const type = edge.type || 'default';
      if (!groupedEdges[type]) {
        groupedEdges[type] = [];
      }
      
      // Get source and target node info
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      
      if (source && target) {
        groupedEdges[type].push({
          id: edge.id,
          sourceId: edge.source,
          targetId: edge.target,
          sourceLabel: source.label,
          targetLabel: target.label,
          sourceType: source.type,
          targetType: target.type
        });
      }
    });

    // Convert to array format for rendering
    const connections = [];
    Object.keys(groupedEdges).forEach(type => {
      // Take up to 3 examples per type
      const examples = groupedEdges[type].slice(0, 3);
      examples.forEach(conn => {
        connections.push({
          type: type,
          color: connectionTypeColors[type]?.color || '#555555',
          dashed: connectionTypeColors[type]?.dashed || false,
          sourceType: conn.sourceType,
          targetType: conn.targetType,
          sourceLabel: conn.sourceLabel,
          targetLabel: conn.targetLabel
        });
      });
    });

    // Sort connections by type
    connections.sort((a, b) => a.type.localeCompare(b.type));
    
    // Update displayed connections
    setDisplayedConnections(connections);

    // Adjust max height based on number of connections
    const baseHeight = 180; // Height for legend with just node types
    const connectionHeight = 85; // Approx height per connection
    const calculatedHeight = baseHeight + (Math.min(connections.length, 5) * connectionHeight);
    setMaxHeight(calculatedHeight);
  }, [edges, nodes]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden max-w-md">
      <div 
        className="px-3 py-2 bg-gray-50 flex items-center justify-between cursor-pointer border-b border-gray-200"
        onClick={toggleCollapse}
      >
        <h3 className="text-xs font-medium text-gray-700">
          Diagram Legend ({displayedConnections.length} connections)
        </h3>
        {isCollapsed ? (
          <ChevronDown size={14} className="text-gray-500" />
        ) : (
          <ChevronUp size={14} className="text-gray-500" />
        )}
      </div>
      
      {!isCollapsed && (
        <div className="p-3 space-y-4">
          {/* Node types */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Node Types</h4>
            <div className="grid grid-cols-2 gap-2">
              {nodeTypes.map((node) => (
                <div key={node.type} className="flex items-center">
                  <div 
                    className="w-4 h-4 mr-2 rounded" 
                    style={{ 
                      backgroundColor: node.background,
                      border: `1px solid ${node.color}`
                    }}
                  />
                  <span className="text-xs text-gray-600">{node.type}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Connection types with the requested pattern */}
          {displayedConnections.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Connection Types</h4>
              <div 
                className="space-y-4 overflow-y-auto pr-1"
                style={{ maxHeight: `${maxHeight}px` }}
              >
                {displayedConnections.map((connection, index) => {
                  const sourceColors = getNodeColorByType(connection.sourceType);
                  const targetColors = getNodeColorByType(connection.targetType);
                  
                  return (
                    <div 
                      key={`${connection.type}-${index}`} 
                      className="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                    >
                      {/* Connection type and visual representation */}
                      <div className="flex items-center mb-1">
                        <div 
                          className="w-4 h-0.5 mr-2" 
                          style={{ 
                            backgroundColor: connection.color,
                            borderTop: connection.dashed ? `1px dashed ${connection.color}` : 'none'
                          }}
                        />
                        <span className="text-xs font-medium" style={{ color: connection.color }}>
                          {getConnectionTypeName(connection.type)}
                        </span>
                      </div>
                      
                      {/* Flow description text */}
                      <div className="text-xs text-gray-700 mb-1">
                        <strong>Flow from {connection.sourceLabel} to {connection.targetLabel}</strong>
                      </div>
                      
                      {/* Source → Target with arrow */}
                      <div className="flex items-center ml-2">
                        <span className="text-xs font-semibold" style={{ color: sourceColors.color }}>
                          {connection.sourceLabel}
                        </span>
                        <ArrowRight size={12} className="mx-1 text-gray-400" />
                        <span className="text-xs font-semibold" style={{ color: targetColors.color }}>
                          {connection.targetLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FlowLegend;