
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CollapsibleContent } from '@/components/ui/collapsible';
import ThinkingLine from './ThinkingLine';
import ThinkingProgressBar from './ThinkingProgressBar';
import ThinkingStep from './ThinkingStep';
import { Brain, Lightbulb, MessageSquare, Zap } from 'lucide-react';

interface ThinkingContentProps {
  visibleThinkingLines: string[];
  progress: number;
  thinkingPhase: string;
}

const ThinkingContent: React.FC<ThinkingContentProps> = ({ 
  visibleThinkingLines, 
  progress, 
  thinkingPhase
}) => {
  // Calculate which thinking step is active based on progress
  const getActiveStep = (progress: number): number => {
    if (progress < 25) return 0;
    if (progress < 50) return 1;
    if (progress < 75) return 2;
    return 3;
  };
  
  const activeStep = getActiveStep(progress);
  
  return (
    <CollapsibleContent className="px-3 pb-3 space-y-2">
      {/* Thinking steps timeline */}
      <div className="flex justify-between pt-2 pb-2">
        <ThinkingStep 
          icon={<Brain className="h-3 w-3" />} 
          text="Analyze" 
          isActive={activeStep >= 0} 
        />
        <ThinkingStep 
          icon={<Zap className="h-3 w-3" />} 
          text="Process" 
          isActive={activeStep >= 1} 
        />
        <ThinkingStep 
          icon={<Lightbulb className="h-3 w-3" />} 
          text="Generate" 
          isActive={activeStep >= 2} 
        />
        <ThinkingStep 
          icon={<MessageSquare className="h-3 w-3" />} 
          text="Refine" 
          isActive={activeStep >= 3} 
        />
      </div>
      
      {/* Thinking lines container with glass effect */}
      <motion.div 
        className="relative h-[75px] rounded-lg p-2 overflow-hidden bg-gray-900/50 border border-gray-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence>
          {visibleThinkingLines.map((line, index) => (
            <ThinkingLine 
              key={`thinking-line-${index}-${line.substring(0, 10)}`}
              line={line} 
              index={index}
            />
          ))}
        </AnimatePresence>
        
        {/* Subtle floating particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-indigo-400/20"
            initial={{
              opacity: 0.2,
              scale: 0.5,
              x: Math.random() * 100,
              y: Math.random() * 75,
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
            }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              y: [null, "-20px"],
              x: [null, `${(Math.random() * 40) - 20}px`],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              repeatType: "loop",
            }}
          />
        ))}
      </motion.div>
      
      {/* Progress bar */}
      <ThinkingProgressBar 
        progress={progress} 
        thinkingPhase={thinkingPhase}
      />
    </CollapsibleContent>
  );
};

export default ThinkingContent;