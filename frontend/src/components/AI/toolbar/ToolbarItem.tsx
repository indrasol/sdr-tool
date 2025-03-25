
import React from 'react';
import { motion } from 'framer-motion';
import { ToolbarItemProps } from './ToolbarTypes';
import { getCategoryStyle } from '../utils/nodeStyles';

const ToolbarItem: React.FC<ToolbarItemProps> = ({ tool, onClick }) => {
  // Ensure consistent access to bgColor
  const categoryStyle = getCategoryStyle(tool.category);
  const backgroundColorToUse = tool.bgColor || categoryStyle.bgColor;
  
  return (
    <motion.div
      onClick={() => onClick(tool)}
      className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-center"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div 
        className="w-10 h-10 flex items-center justify-center rounded-md shrink-0 mb-1" 
        style={{ backgroundColor: backgroundColorToUse }}
      >
        <tool.icon className="text-white" size={18} />
      </div>
      <span className="text-xs truncate max-w-full">{tool.label}</span>
    </motion.div>
  );
};

export default ToolbarItem;