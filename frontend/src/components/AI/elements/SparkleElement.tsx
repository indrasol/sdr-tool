
import React from 'react';
import { Sparkle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SparkleElementProps {
  position: string;
  color: string;
  size: number;
  delay?: number;
  animationDuration?: number;
}

const SparkleElement: React.FC<SparkleElementProps> = ({
  position,
  color,
  size,
  delay = 0,
  animationDuration = 3
}) => {
  return (
    <motion.div
      className={`absolute ${position} ${color}`}
      animate={{ 
        scale: [1, 1.15, 1],
        rotate: [0, 5, 0],
        opacity: [0.2, 0.5, 0.2]
      }}
      transition={{ 
        duration: animationDuration,
        delay: delay,
        repeat: Infinity,
        repeatType: "reverse" 
      }}
    >
      <Sparkle size={size} />
    </motion.div>
  );
};

export default SparkleElement;