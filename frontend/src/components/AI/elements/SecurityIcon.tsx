
import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SecurityIconProps {
  Icon: LucideIcon;
  color: string;
  bgColor: string;
  delay?: number;
}

const SecurityIcon: React.FC<SecurityIconProps> = ({
  Icon,
  color,
  bgColor,
  delay = 0
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      className={`${bgColor} p-2 rounded-full`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: [0.8, 1.1, 1],
        opacity: 1 
      }}
      transition={{ 
        duration: 0.5,
        delay: delay,
        times: [0, 0.7, 1]
      }}
    >
      <Icon size={18} className={color} />
    </motion.div>
  );
};

export default SecurityIcon;