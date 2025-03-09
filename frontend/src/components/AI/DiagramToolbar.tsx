
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Square, LayoutGrid, Circle, Type, Database, Cloud, Server, Folder, File, Settings, Users, Shield, Network, Code } from 'lucide-react';
import { Node, XYPosition, useReactFlow } from '@xyflow/react';

interface DiagramToolbarProps {
  onAddNode: (nodeType: string, position: XYPosition) => void;
}

const toolbarItems = [
  { icon: Square, label: 'Square' },
  { icon: LayoutGrid, label: 'Rectangle' },
  { icon: Circle, label: 'Circle' },
  { icon: Type, label: 'Text' },
  { icon: Database, label: 'Database' },
  { icon: Cloud, label: 'Cloud' },
  { icon: Server, label: 'Server' },
  { icon: Folder, label: 'Folder' },
  { icon: File, label: 'File' },
  { icon: Settings, label: 'Settings' },
  { icon: Users, label: 'Users' },
  { icon: Shield, label: 'Security' },
  { icon: Network, label: 'Network' },
  { icon: Code, label: 'Code' },
];

const DiagramToolbar: React.FC<DiagramToolbarProps> = ({ onAddNode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { screenToFlowPosition } = useReactFlow();

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleToolClick = (toolType: string) => {
    // Calculate a position in the center of the viewport
    const centerPosition = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    
    onAddNode(toolType, centerPosition);
  };

  const filteredTools = searchTerm
    ? toolbarItems.filter(tool => 
        tool.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : toolbarItems;

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-white shadow-md">
      <div className="p-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-securetrack-purple/20 focus:border-securetrack-purple"
          />
          {searchTerm && (
            <button 
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {filteredTools.map((tool, index) => (
            <motion.button
              key={tool.label}
              onClick={() => handleToolClick(tool.label)}
              className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <tool.icon size={16} className="text-securetrack-purple" />
              <span className="text-sm">{tool.label}</span>
            </motion.button>
          ))}
        </div>
        
        {filteredTools.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No tools match your search
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagramToolbar;