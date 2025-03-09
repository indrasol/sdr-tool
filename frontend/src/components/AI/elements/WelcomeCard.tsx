
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import SparkleElement from './SparkleElement';
import AnimatedGradientBackground from './AnimatedGradientBackground';
import AnimatedGlowEffect from './AnimatedGlowEffect';
import SecurityIconsGroup from './SecurityIconsGroup';

interface WelcomeCardProps {
  displayText: string;
  isTypingComplete: boolean;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ displayText, isTypingComplete }) => {
  const [showIcons, setShowIcons] = useState(false);

  // Show icons animation after typing is complete
  useEffect(() => {
    if (isTypingComplete) {
      setTimeout(() => setShowIcons(true), 500);
    }
  }, [isTypingComplete]);

  return (
    <motion.div
      whileHover={{ 
        boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.1), 0 8px 10px -6px rgba(124, 58, 237, 0.1)",
        y: -3,
      }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 relative overflow-hidden backdrop-blur-sm border-securetrack-purple/20 shadow-lg">
        {/* Animated gradient background */}
        <AnimatedGradientBackground />
        
        {/* Animated glow */}
        <AnimatedGlowEffect />
        
        {/* Floating sparkles */}
        <SparkleElement 
          position="top-1 right-1" 
          color="text-securetrack-purple/40" 
          size={24} 
          animationDuration={2}
        />
        
        <SparkleElement 
          position="bottom-2 left-3" 
          color="text-securetrack-lightpurple/30" 
          size={18} 
          delay={0.5}
          animationDuration={3}
        />

        <SparkleElement 
          position="top-1/2 right-6" 
          color="text-securetrack-green/20" 
          size={16} 
          delay={1}
          animationDuration={4}
        />
        
        <SparkleElement 
          position="top-8 left-5" 
          color="text-securetrack-purple/15" 
          size={14} 
          delay={1.5}
          animationDuration={3.5}
        />

        {/* Security icons that appear after typing finishes */}
        <SecurityIconsGroup visible={showIcons} />
        
        <p className="text-gray-600 font-medium leading-relaxed relative z-10" dangerouslySetInnerHTML={{ __html: displayText }}></p>
      </Card>
    </motion.div>
  );
};

export default WelcomeCard;