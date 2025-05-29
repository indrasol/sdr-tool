import React from 'react';
import ChatButtons from './ChatButtons';
import SendButton from './SendButton';

import { 
  TooltipProvider
} from '@/components/ui/tooltip';

interface ActionBarProps {
  isInputEmpty: boolean;
  isProcessing: boolean;
  projectId?: string;
  onMicrophoneClick?: () => void;
}

const ActionBar: React.FC<ActionBarProps> = ({ 
  isInputEmpty, 
  isProcessing,
  onMicrophoneClick
}) => {
  return (
    <TooltipProvider>
      <div className="absolute right-2 bottom-1 flex space-x-1">
        <ChatButtons onMicrophoneClick={onMicrophoneClick} />
        <SendButton disabled={isInputEmpty} isProcessing={isProcessing} />
      </div>
    </TooltipProvider>
  );
};

export default ActionBar;