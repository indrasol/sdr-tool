
import React from 'react';
import { motion } from 'framer-motion';

interface ThinkingStepProps {
  icon: React.ReactNode;
  text: string;
  isActive: boolean;
}

const ThinkingStep: React.FC<ThinkingStepProps> = ({ icon, text, isActive }) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-1 rounded-md p-1 transition-colors ${isActive ? 'text-indigo-400' : 'text-gray-500'}`}>
      <motion.div
        animate={isActive ? { 
          scale: [1, 1.2, 1],
          rotate: [-5, 5, -5]
        } : {}}
        transition={{ 
          duration: 2, 
          repeat: isActive ? Infinity : 0,
          repeatType: "reverse" 
        }}
        className={isActive ? 'bg-indigo-900/40 p-1 rounded-full' : ''}
      >
        {icon}
      </motion.div>
      <span className="text-[9px] font-medium">{text}</span>
      
      {/* Active indicator dot */}
      {isActive && (
        <motion.div 
          className="h-1 w-1 bg-indigo-400 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </div>
  );
};

export default ThinkingStep;