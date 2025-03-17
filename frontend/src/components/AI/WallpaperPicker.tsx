
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Wallpaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WallpaperOption } from './types/chatTypes';

interface WallpaperPickerProps {
  onWallpaperChange: (wallpaper: WallpaperOption) => void;
  disabled?: boolean;
}

const wallpaperOptions: WallpaperOption[] = [
  { 
    id: 'default', 
    name: 'Default', 
    bgClass: 'bg-gradient-to-b from-[#f8f9fb] to-[#f1f3f9]', 
    textClass: 'text-gray-900'
  },
  { 
    id: 'purple', 
    name: 'Purple', 
    bgClass: 'bg-gradient-to-r from-[#f0e6ff] via-[#e0d0ff] to-[#d3bfff]', 
    textClass: 'text-gray-800'
  },
  { 
    id: 'blue', 
    name: 'Blue', 
    bgClass: 'bg-gradient-to-br from-[#e1f5fe] via-[#bbdefb] to-[#90caf9]', 
    textClass: 'text-gray-800'
  },
  { 
    id: 'mint', 
    name: 'Mint', 
    bgClass: 'bg-gradient-to-br from-[#e0f2f1] via-[#b2dfdb] to-[#80cbc4]', 
    textClass: 'text-gray-800'
  },
  { 
    id: 'rose', 
    name: 'Rose', 
    bgClass: 'bg-gradient-to-r from-[#fff0f3] via-[#ffd6e0] to-[#ffb6c1]', 
    textClass: 'text-gray-800'
  },
  { 
    id: 'sunset', 
    name: 'Sunset', 
    bgClass: 'bg-gradient-to-br from-[#fff9c4] via-[#ffecb3] to-[#ffe0b2]', 
    textClass: 'text-gray-800'
  },
];

const WallpaperPicker: React.FC<WallpaperPickerProps> = ({ onWallpaperChange, disabled = false }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          type="button" 
          className="h-6 w-6 flex items-center justify-center text-gray-500 hover:text-securetrack-purple hover:bg-securetrack-purple/10 rounded-lg"
        >
          <Wallpaper className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" side="top">
        <div className="text-sm font-medium mb-2">Choose Wallpaper</div>
        <div className="grid grid-cols-3 gap-2">
          {wallpaperOptions.map((option) => (
            <button
              key={option.id}
              className={cn(
                "h-16 rounded-md p-1 flex items-center justify-center text-xs font-medium border transition-all hover:scale-105",
                option.bgClass,
                option.textClass
              )}
              onClick={() => onWallpaperChange(option)}
              disabled={disabled}
            >
              {option.name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { wallpaperOptions };
export default WallpaperPicker;