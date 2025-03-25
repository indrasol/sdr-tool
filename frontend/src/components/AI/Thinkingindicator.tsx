
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useThinkingIndicator } from './hooks/useThinkingIndicator';
import ThinkingLine from './elements/ThinkingLine';
import ThinkingProgressBar from './elements/ThinkingProgressBar';

const ThinkingIndicator: React.FC = () => {
  // Use the custom hook to get dynamic thinking lines and progress
  const {
    isOpen,
    toggleOpen,
    progress,
    thinkingPhase,
    visibleThinkingLines,
    elapsedSeconds
  } = useThinkingIndicator();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mr-auto max-w-[85%]"
      style={{ maxHeight: isOpen ? '180px' : '50px' }}
    >
      <Collapsible
        open={isOpen}
        onOpenChange={toggleOpen}
        className="relative rounded-md border border-securetrack-purple/30 shadow-sm bg-white overflow-hidden"
      >
        {/* Main thinking display */}
        <div className="py-2 px-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Thinking spinner */}
            <motion.div 
              className="relative h-4 w-4"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="absolute inset-0 rounded-full border-[1.5px] border-t-transparent border-l-transparent border-r-securetrack-purple/60 border-b-securetrack-lightpurple/60"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-0.5 rounded-full border-[1px] border-t-transparent border-securetrack-purple/40 border-r-transparent border-b-securetrack-lightpurple/30"
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
            
            <div>
              <h3 className="text-xs font-medium text-securetrack-purple">
                Thinking for {elapsedSeconds}s
              </h3>
              <p className="text-securetrack-purple/70 text-[10px]">
                Tap to see details
              </p>
            </div>
          </div>
          
          {/* Expand/collapse button */}
          <CollapsibleTrigger asChild>
            <button className="text-securetrack-purple/70 hover:text-securetrack-purple transition-colors p-1.5 rounded-full hover:bg-securetrack-purple/10">
              <motion.div
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight size={14} />
              </motion.div>
            </button>
          </CollapsibleTrigger>
        </div>
        
        {/* Expandable content with limited height and scroll */}
        <CollapsibleContent className="overflow-hidden">
          <div className="px-2.5 pb-2.5 overflow-y-auto max-h-[120px]">
            <div className="text-gray-600 space-y-1 pt-0.5 max-w-full">
              <div className="bg-securetrack-purple/10 p-2 rounded-md">
                {visibleThinkingLines.slice(0, 4).map((line, index) => (
                  <ThinkingLine key={`thinking-line-${index}`} line={line} index={index} />
                ))}
              </div>
              
              {/* Progress bar */}
              <div className="mt-2 pt-0.5">
                <ThinkingProgressBar progress={progress} thinkingPhase={thinkingPhase} />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
};

export default ThinkingIndicator;