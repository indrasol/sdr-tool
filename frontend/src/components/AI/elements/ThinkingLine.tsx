
import React from 'react';
import { motion } from 'framer-motion';
import { Circle } from 'lucide-react';

interface ThinkingLineProps {
  line: string;
  index: number;
}

const ThinkingLine: React.FC<ThinkingLineProps> = ({ line, index }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -3 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="flex items-start gap-1.5 mb-1.5"
    >
      <Circle className="h-1 w-1 mt-1.5 text-securetrack-purple" fill="rgba(124, 101, 246, 0.4)" />
      <span className="text-[11px] text-gray-700">{line}</span>
    </motion.div>
  );
};

export default ThinkingLine;