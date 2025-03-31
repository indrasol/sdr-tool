
import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

const ThinkingIndicatorIcon: React.FC = () => {
  return (
    <div className="relative">
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
          rotate: [-2, 2, -2],
        }}
        transition={{ 
          duration: 1.2, 
          repeat: Infinity,
          repeatType: "reverse" 
        }}
        className="bg-gradient-to-r from-securetrack-purple/30 to-securetrack-lightpurple/30 p-0.5 rounded-full"
      >
        <Brain className="h-2 w-2 text-securetrack-lightpurple" />
      </motion.div>
      <motion.div 
        className="absolute -top-0.5 -right-0.5 h-0.5 w-0.5 rounded-full bg-gradient-to-r from-securetrack-purple to-securetrack-lightpurple"
        animate={{
          opacity: [0, 1, 0],
          scale: [0.8, 1.2, 0.8],
          boxShadow: [
            '0 0 0 0 rgba(124, 101, 246, 0)',
            '0 0 0 1px rgba(124, 101, 246, 0.2)',
            '0 0 0 0 rgba(124, 101, 246, 0)'
          ]
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};

export default ThinkingIndicatorIcon;