
import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedGradientBackgroundProps {
  className?: string;
  animationStyle?: 'default' | 'x' | 'y' | 'xy' | 'radial' | 'conic';
}

const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({ 
  className = "absolute inset-0",
  animationStyle = 'default'
}) => {
  // Different animation styles based on the prop
  const getAnimationBackgrounds = () => {
    switch (animationStyle) {
      case 'x':
        return [
          "linear-gradient(to right, rgba(237,233,255,1), rgba(229,221,255,0.9), rgba(223,213,255,0.8))",
          "linear-gradient(to right, rgba(229,221,255,0.9), rgba(223,213,255,0.8), rgba(237,233,255,1))",
          "linear-gradient(to right, rgba(223,213,255,0.8), rgba(237,233,255,1), rgba(229,221,255,0.9))"
        ];
      case 'y':
        return [
          "linear-gradient(to bottom, rgba(233,249,239,1), rgba(224,245,234,0.9), rgba(216,242,229,0.8))",
          "linear-gradient(to bottom, rgba(224,245,234,0.9), rgba(216,242,229,0.8), rgba(233,249,239,1))",
          "linear-gradient(to bottom, rgba(216,242,229,0.8), rgba(233,249,239,1), rgba(224,245,234,0.9))"
        ];
      case 'xy':
        return [
          "linear-gradient(to bottom right, rgba(230,245,255,1), rgba(220,239,255,0.9), rgba(210,233,255,0.8))",
          "linear-gradient(to bottom right, rgba(220,239,255,0.9), rgba(210,233,255,0.8), rgba(230,245,255,1))",
          "linear-gradient(to bottom right, rgba(210,233,255,0.8), rgba(230,245,255,1), rgba(220,239,255,0.9))"
        ];
      case 'radial':
        return [
          "radial-gradient(circle, rgba(255,237,245,1) 0%, rgba(255,230,240,0.9) 50%, rgba(255,224,237,0.8) 100%)",
          "radial-gradient(circle, rgba(255,230,240,0.9) 0%, rgba(255,224,237,0.8) 50%, rgba(255,237,245,1) 100%)",
          "radial-gradient(circle, rgba(255,224,237,0.8) 0%, rgba(255,237,245,1) 50%, rgba(255,230,240,0.9) 100%)"
        ];
      case 'conic':
        return [
          "conic-gradient(from 0deg, rgba(255,243,232,1), rgba(255,237,224,0.9), rgba(255,232,212,0.8), rgba(255,243,232,1))",
          "conic-gradient(from 120deg, rgba(255,243,232,1), rgba(255,237,224,0.9), rgba(255,232,212,0.8), rgba(255,243,232,1))",
          "conic-gradient(from 240deg, rgba(255,243,232,1), rgba(255,237,224,0.9), rgba(255,232,212,0.8), rgba(255,243,232,1))"
        ];
      default:
        return [
          "linear-gradient(to bottom right, rgba(255,255,255,1), rgba(249,250,251,0.9), rgba(124,101,246,0.08))",
          "linear-gradient(to bottom right, rgba(255,255,255,1), rgba(249,250,251,0.9), rgba(76,211,165,0.08))",
          "linear-gradient(to bottom right, rgba(255,255,255,1), rgba(249,250,251,0.9), rgba(124,101,246,0.08))"
        ];
    }
  };

  // Define animation variants based on the style
  const getAnimationVariants = () => {
    const baseTransition = {
      duration: 8,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut"
    };

    switch (animationStyle) {
      case 'x':
        return {
          animate: {
            background: getAnimationBackgrounds(),
            x: [0, 5, 0, -5, 0],
            transition: {
              ...baseTransition,
              times: [0, 0.25, 0.5, 0.75, 1]
            }
          }
        };
      case 'y':
        return {
          animate: {
            background: getAnimationBackgrounds(),
            y: [0, 5, 0, -5, 0],
            transition: {
              ...baseTransition,
              times: [0, 0.25, 0.5, 0.75, 1]
            }
          }
        };
      case 'xy':
        return {
          animate: {
            background: getAnimationBackgrounds(),
            scale: [1, 1.02, 1, 0.98, 1],
            transition: {
              ...baseTransition,
              times: [0, 0.25, 0.5, 0.75, 1]
            }
          }
        };
      case 'radial':
        return {
          animate: {
            background: getAnimationBackgrounds(),
            borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "50% 50% 50% 50% / 50% 50% 50% 50%", "30% 70% 70% 30% / 70% 30% 30% 70%", "50% 50% 50% 50% / 50% 50% 50% 50%"],
            transition: {
              ...baseTransition,
              times: [0, 0.33, 0.66, 1]
            }
          }
        };
      case 'conic':
        return {
          animate: {
            background: getAnimationBackgrounds(),
            rotate: [0, 2, 0, -2, 0],
            transition: {
              ...baseTransition,
              times: [0, 0.25, 0.5, 0.75, 1]
            }
          }
        };
      default:
        return {
          animate: {
            background: getAnimationBackgrounds(),
            transition: baseTransition
          }
        };
    }
  };

  const variants = getAnimationVariants();

  return (
    <motion.div 
      className={className + " overflow-hidden"}
      initial="initial"
      animate="animate"
      variants={variants}
      style={{ 
        backgroundSize: "200% 200%",
        backgroundPosition: "0% 0%"
      }}
    />
  );
};

export default AnimatedGradientBackground;