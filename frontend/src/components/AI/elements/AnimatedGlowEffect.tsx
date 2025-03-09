
import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedGlowEffectProps {
  className?: string;
}

const AnimatedGlowEffect: React.FC<AnimatedGlowEffectProps> = ({ 
  className = "absolute inset-0 opacity-30" 
}) => {
  return (
    <motion.div 
      className={className}
      animate={{
        background: [
          "radial-gradient(circle at 30% 20%, rgba(124,58,237,0.2) 0%, transparent 50%)",
          "radial-gradient(circle at 70% 60%, rgba(124,58,237,0.2) 0%, transparent 50%)",
          "radial-gradient(circle at 30% 80%, rgba(124,58,237,0.2) 0%, transparent 50%)",
          "radial-gradient(circle at 70% 20%, rgba(124,58,237,0.2) 0%, transparent 50%)"
        ]
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        repeatType: "reverse"
      }}
    />
  );
};

export default AnimatedGlowEffect;