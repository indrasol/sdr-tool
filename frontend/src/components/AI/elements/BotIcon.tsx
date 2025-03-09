
import React from 'react';
import { Bot } from 'lucide-react';

interface BotIconProps {
  showIcon: boolean;
}

const BotIcon: React.FC<BotIconProps> = ({ showIcon }) => {
  if (!showIcon) return null;
  
  return (
    <div className="absolute left-3 bottom-1.5 transform pointer-events-none">
      <div className="flex items-center gap-1.5 text-gray-400">
        <Bot size={16} className="text-securetrack-purple" />
        <span>Ask Guardian AI</span>
      </div>
    </div>
  );
};

export default BotIcon;