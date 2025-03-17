
import React, { useMemo } from 'react';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';
// import { useTypingEffect } from '@/hooks/useTypingEffect';
import { useSimpleTypingEffect } from '@/hooks/useSimpleTypingEffect';
import WelcomeCard from './elements/WelcomeCard';

const EmptyChatState: React.FC = () => {
  // Memoize the welcome message to ensure it's stable between renders
  const welcomeMessage = useMemo(() => 
    "Welcome to Guardian AI. I can help design your secure architecture, address compliance needs etc.,",
    []
  );

  // Configure typing effect - using memoized array and appropriate settings
  const { displayText, isComplete } = useSimpleTypingEffect({
    text: welcomeMessage,
    typingSpeed: 40,
    startDelay: 500,
    showCursor: true
  });

  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 my-8 space-y-6">
      <motion.div 
        className="bg-gradient-to-r from-securetrack-purple/15 to-securetrack-lightpurple/15 p-6 rounded-full"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.6
        }}
      >
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, -5, 5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        >
          <Bot size={40} className="text-securetrack-purple" />
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="max-w-md w-full"
      >
        <WelcomeCard 
          displayText={displayText} 
          isTypingComplete={isComplete} 
        />
      </motion.div>
    </div>
  );
};

export default EmptyChatState;