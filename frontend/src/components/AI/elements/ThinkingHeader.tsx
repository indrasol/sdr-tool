
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CollapsibleTrigger } from '@/components/ui/collapsible';
import ThinkingIndicatorIcon from './ThinkingindicatorIcon';

interface ThinkingHeaderProps {
  isOpen: boolean;
}

const ThinkingHeader: React.FC<ThinkingHeaderProps> = ({ 
  isOpen
}) => {
  return (
    <div className="p-3 flex items-center justify-between text-white">
      <div className="flex items-center space-x-2">
        <ThinkingIndicatorIcon />
        
        <div className="text-2xs text-gray-400 flex items-center">
          {/* Glow effect container */}
          <div className="relative overflow-hidden">
            <span className="mr-1 font-medium text-[11px]">thinking</span>
            {/* Animated glow effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"
              animate={{
                x: [-40, 40, -40],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>
          <div className="flex space-x-0.5 ml-0.5">
            <motion.div 
              className="h-1.5 w-1.5 bg-indigo-500 rounded-full"
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.div 
              className="h-1.5 w-1.5 bg-indigo-500 rounded-full"
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div 
              className="h-1.5 w-1.5 bg-indigo-500 rounded-full"
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center">
        {/* Expand/Collapse button */}
        <CollapsibleTrigger asChild>
          <button className="rounded-full p-1 hover:bg-indigo-900/40 transition-colors">
            {isOpen ? (
              <ChevronUp className="h-3 w-3 text-gray-400" />
            ) : (
              <ChevronDown className="h-3 w-3 text-gray-400" />
            )}
          </button>
        </CollapsibleTrigger>
      </div>
    </div>
  );
};

export default ThinkingHeader;