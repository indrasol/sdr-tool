
import React from 'react';
import { Button } from '@/components/ui/button';
import { Image, PaperclipIcon, FileText, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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

interface ChatButtonsProps {
  onGenerateReport?: () => void;
}

const ChatButtons: React.FC<ChatButtonsProps> = ({ onGenerateReport }) => {
  const navigate = useNavigate();

  const handleGenerateReportClick = () => {
    if (onGenerateReport) {
      onGenerateReport();
    } else {
      navigate('/generate-report');
    }
  };

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
      
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover="hover" variants={iconVariants}>
            <Button 
              type="button" 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6 text-gray-500 hover:text-securetrack-purple hover:bg-securetrack-purple/10 rounded-lg"
              onClick={handleGenerateReportClick}
            >
              <FileText className="h-3 w-3" />
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Generate Report</p>
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
              <Save className="h-3 w-3" />
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Save</p>
        </TooltipContent>
      </Tooltip>
    </>
  );
};

export default ChatButtons;