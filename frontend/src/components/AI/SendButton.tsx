
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const sendButtonVariants = {
  idle: { scale: 1 },
  hover: { 
    scale: 1.05,
    boxShadow: "0 0 20px rgba(124, 101, 246, 0.8)",
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 10 
    }
  },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

interface SendButtonProps {
  disabled: boolean;
  isProcessing?: boolean;
}

const SendButton: React.FC<SendButtonProps> = ({ disabled, isProcessing = false }) => {
  return (
    <motion.div 
      initial="idle"
      whileHover="hover" 
      whileTap="tap"
      variants={sendButtonVariants}
    >
      <Button 
        type="submit" 
        size="sm" 
        disabled={disabled}
        className="h-7 w-7 p-1 bg-gradient-to-br from-securetrack-purple to-securetrack-lightpurple hover:from-securetrack-lightpurple hover:to-securetrack-purple rounded-full transition-all duration-300 relative overflow-hidden group shadow-lg"
      >
        <motion.div 
          className="relative z-10 flex items-center justify-center"
          animate={{ 
            rotate: isProcessing ? 360 : 0,
          }}
          transition={{ 
            duration: 1.5, 
            repeat: isProcessing ? Infinity : 0,
            ease: "linear"
          }}
        >
          {isProcessing ? (
            <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5 text-white -rotate-45" />
          )}
        </motion.div>
        <motion.div 
          className="absolute inset-0 bg-white opacity-0 group-hover:opacity-25"
          initial={{ x: '-100%' }}
          animate={{ x: !disabled ? ['100%', '-100%'] : '-100%' }}
          transition={{ 
            duration: 1.5, 
            repeat: !disabled ? Infinity : 0,
            ease: "linear"
          }}
        />
      </Button>
    </motion.div>
  );
};

export default SendButton;