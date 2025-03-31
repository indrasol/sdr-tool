
import React from 'react';
import ChatButtons from './ChatButtons';
import SendButton from './SendButton';
import WallpaperPicker from './WallpaperPicker';
import { WallpaperOption } from './types/chatTypes';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface ActionBarProps {
  isInputEmpty: boolean;
  isProcessing: boolean;
  onWallpaperChange?: (wallpaper: WallpaperOption) => void;
  projectId?: string;
}

const ActionBar: React.FC<ActionBarProps> = ({ 
  isInputEmpty, 
  isProcessing, 
  onWallpaperChange
}) => {
  return (
    <TooltipProvider>
      <div className="absolute right-2 bottom-1 flex space-x-1">
        {onWallpaperChange && 
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <WallpaperPicker onWallpaperChange={onWallpaperChange} />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Change Wallpaper</p>
            </TooltipContent>
          </Tooltip>
        }
        <ChatButtons />
        <SendButton disabled={isInputEmpty} isProcessing={isProcessing} />
      </div>
    </TooltipProvider>
  );
};

export default ActionBar;