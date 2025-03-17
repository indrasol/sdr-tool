
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
  onGenerateReport?: () => void;
  onSaveProject?: () => void;
  isDisabled?: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({ 
  isInputEmpty, 
  isProcessing, 
  onWallpaperChange,
  onGenerateReport,
  onSaveProject,
  isDisabled = false
}) => {
  return (
    <TooltipProvider>
      <div className="absolute right-2 bottom-1 flex space-x-1">
        {onWallpaperChange && 
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <WallpaperPicker onWallpaperChange={onWallpaperChange} disabled={isDisabled} />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Change Wallpaper</p>
            </TooltipContent>
          </Tooltip>
        }
        <ChatButtons onGenerateReport={onGenerateReport} onSaveProject={onSaveProject} disabled={isDisabled} />
        <SendButton disabled={isInputEmpty} isProcessing={isProcessing} />
      </div>
    </TooltipProvider>
  );
};

export default ActionBar;