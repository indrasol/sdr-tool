
import React from 'react';
import { Button } from '@/components/ui/button';
import { Image, PaperclipIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

const iconVariants = {
  hover: {
    scale: 1.15,
    rotate: [-5, 0, 5, 0],
    transition: { duration: 0.3 }
  }
};

const ChatButtons: React.FC = () => {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover="hover" variants={iconVariants}>
            <Button 
              type="button" 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6 text-gray-500 hover:text-securetrack-purple hover:bg-securetrack-purple/10 rounded-lg"
            >
              <Image className="h-3 w-3" />
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Upload Image</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover="hover" variants={iconVariants}>
            <Button 
              type="button" 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6 text-gray-500 hover:text-securetrack-purple hover:bg-securetrack-purple/10 rounded-lg"
            >
              <PaperclipIcon className="h-3 w-3" />
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>File Upload</p>
        </TooltipContent>
      </Tooltip>
    </>
  );
};

export default ChatButtons;