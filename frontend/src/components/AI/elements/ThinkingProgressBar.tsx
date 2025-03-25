
import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThinkingProgressBarProps {
  progress: number;
  thinkingPhase: string;
}

const ThinkingProgressBar: React.FC<ThinkingProgressBarProps> = ({ 
  progress, 
  thinkingPhase
}) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <motion.div
            animate={{ 
              rotate: [-5, 5, -5],
              scale: [0.9, 1.1, 0.9]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          >
            <Sparkles className="h-3 w-3 text-securetrack-purple" />
          </motion.div>
          <span className="text-[11px] font-medium">{thinkingPhase}</span>
        </div>
        <motion.span 
          className="text-[11px] tabular-nums text-securetrack-purple font-medium"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
      <div className="h-1.5 w-full bg-securetrack-purple/10 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-securetrack-purple to-securetrack-lightpurple"
          style={{ width: `${progress}%` }}
          animate={{ 
            width: `${progress}%`,
            boxShadow: ["0 0 3px rgba(124, 101, 246, 0.3)", "0 0 5px rgba(124, 101, 246, 0.5)", "0 0 3px rgba(124, 101, 246, 0.3)"]
          }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

export default ThinkingProgressBar;