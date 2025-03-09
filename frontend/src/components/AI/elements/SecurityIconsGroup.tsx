
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock } from 'lucide-react';
import SecurityIcon from './SecurityIcon';

interface SecurityIconsGroupProps {
  visible: boolean;
}

const SecurityIconsGroup: React.FC<SecurityIconsGroupProps> = ({ visible }) => {
  if (!visible) return null;
  
  return (
    <motion.div 
      className="flex justify-center gap-4 mt-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
    >
      <SecurityIcon 
        Icon={Shield} 
        color="text-securetrack-purple" 
        bgColor="bg-securetrack-purple/10" 
      />
      <SecurityIcon 
        Icon={Lock} 
        color="text-securetrack-green" 
        bgColor="bg-securetrack-green/10" 
        delay={0.1}
      />
    </motion.div>
  );
};

export default SecurityIconsGroup;