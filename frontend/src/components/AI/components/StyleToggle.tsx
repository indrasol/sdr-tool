import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, Eye } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useDiagramStyle, DiagramStyle } from '../contexts/DiagramStyleContext';
import { useTheme } from '@/contexts/ThemeContext';

interface StyleOption {
  key: DiagramStyle;
  label: string;
  icon: string;
  description: string;
}

const styleOptions: StyleOption[] = [
  {
    key: 'professional',
    label: 'Professional',
    icon: 'mdi:office-building',
    description: 'Clean, business-ready diagrams'
  },
  {
    key: 'sketch',
    label: 'Sketch',
    icon: 'mdi:draw-pen',
    description: 'Hand-drawn, creative look'
  }
];

interface StyleToggleProps {
  variant?: 'default' | 'compact' | 'icon-only';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

// Theme styles matching the existing UI
const buttonHoverStyles = `
  transition-all duration-200
  hover:bg-gradient-to-r hover:from-blue-100/80 hover:to-purple-100/80 
  hover:text-blue-700 hover:border-blue-200 hover:shadow-sm
`;

const StyleToggle: React.FC<StyleToggleProps> = ({
  variant = 'default',
  size = 'sm',
  showLabel = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { diagramStyle, setDiagramStyle } = useDiagramStyle();
  const { theme } = useTheme();

  const currentStyle = styleOptions.find(s => s.key === diagramStyle);

  const handleStyleChange = (style: DiagramStyle) => {
    setDiagramStyle(style);
    setIsOpen(false);
  };

  // Icon-only variant
  if (variant === 'icon-only') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={`h-8 w-8 ${
                  theme === 'dark'
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                } transition-all duration-200 ${className}`}
              >
                <Eye size={16} />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">View Mode</TooltipContent>
        </Tooltip>
        <DropdownMenuContent className={`w-64 p-4 shadow-xl rounded-lg ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
            : 'bg-gradient-to-br from-white to-blue-50/30 border-blue-100/50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold flex items-center gap-2 ${
              theme === 'dark' ? 'text-gray-200' : 'text-blue-700'
            }`}>
              <div className={`p-1.5 rounded-md shadow-sm ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600'
              }`}>
                <Eye className="h-4 w-4 text-white" />
              </div>
              View Mode
            </h3>
          </div>
          <div className="space-y-2">
            {styleOptions.map(style => (
              <DropdownMenuItem
                key={style.key}
                onClick={() => handleStyleChange(style.key)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer border ${
                  diagramStyle === style.key
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border-purple-500'
                      : 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-md border-blue-500'
                    : theme === 'dark'
                      ? 'hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:text-gray-200 hover:border-gray-600 hover:shadow-sm bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600 text-gray-300'
                      : 'hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 hover:text-blue-700 hover:border-blue-200 hover:shadow-sm bg-gradient-to-r from-blue-50/70 to-purple-50/70 border-blue-100'
                }`}
              >
                <Icon icon={style.icon} className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">{style.label}</div>
                  <div className={`text-sm ${
                    diagramStyle === style.key 
                      ? theme === 'dark' ? 'text-gray-200' : 'text-blue-100'
                      : theme === 'dark' ? 'text-gray-400' : 'text-blue-600/70'
                  }`}>
                    {style.description}
                  </div>
                </div>
                {diagramStyle === style.key && (
                  <Check className="h-4 w-4 ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={`h-8 w-8 ${
                  theme === 'dark'
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                } transition-all duration-200 ${className}`}
              >
                <Eye size={16} />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">View Mode</TooltipContent>
        </Tooltip>
        <DropdownMenuContent className={`w-64 p-4 shadow-xl rounded-lg ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
            : 'bg-gradient-to-br from-white to-blue-50/30 border-blue-100/50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold flex items-center gap-2 ${
              theme === 'dark' ? 'text-gray-200' : 'text-blue-700'
            }`}>
              <div className={`p-1.5 rounded-md shadow-sm ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600'
              }`}>
                <Eye className="h-4 w-4 text-white" />
              </div>
              View Mode
            </h3>
          </div>
          <div className="space-y-2">
            {styleOptions.map(style => (
              <DropdownMenuItem
                key={style.key}
                onClick={() => handleStyleChange(style.key)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer border ${
                  diagramStyle === style.key
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border-purple-500'
                      : 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-md border-blue-500'
                    : theme === 'dark'
                      ? 'hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:text-gray-200 hover:border-gray-600 hover:shadow-sm bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600 text-gray-300'
                      : 'hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 hover:text-blue-700 hover:border-blue-200 hover:shadow-sm bg-gradient-to-r from-blue-50/70 to-purple-50/70 border-blue-100'
                }`}
              >
                <Icon icon={style.icon} className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">{style.label}</div>
                  <div className={`text-sm ${
                    diagramStyle === style.key 
                      ? theme === 'dark' ? 'text-gray-200' : 'text-blue-100'
                      : theme === 'dark' ? 'text-gray-400' : 'text-blue-600/70'
                  }`}>
                    {style.description}
                  </div>
                </div>
                {diagramStyle === style.key && (
                  <Check className="h-4 w-4 ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default variant
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className={`h-8 w-8 ${
                theme === 'dark'
                  ? "text-gray-300 hover:text-white hover:bg-gray-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              } transition-all duration-200 ${className}`}
            >
              <Eye size={16} />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">View Mode</TooltipContent>
      </Tooltip>
      <DropdownMenuContent className={`w-64 p-4 shadow-xl rounded-lg ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
          : 'bg-gradient-to-br from-white to-blue-50/30 border-blue-100/50'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold flex items-center gap-2 ${
            theme === 'dark' ? 'text-gray-200' : 'text-blue-700'
          }`}>
            <div className={`p-1.5 rounded-md shadow-sm ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600'
            }`}>
              <Eye className="h-4 w-4 text-white" />
            </div>
            View Mode
          </h3>
        </div>
        <div className="space-y-2">
          {styleOptions.map(style => (
            <DropdownMenuItem
              key={style.key}
              onClick={() => handleStyleChange(style.key)}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer border ${
                diagramStyle === style.key
                  ? theme === 'dark'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border-purple-500'
                    : 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-md border-blue-500'
                  : theme === 'dark'
                    ? 'hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:text-gray-200 hover:border-gray-600 hover:shadow-sm bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600 text-gray-300'
                    : 'hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 hover:text-blue-700 hover:border-blue-200 hover:shadow-sm bg-gradient-to-r from-blue-50/70 to-purple-50/70 border-blue-100'
              }`}
            >
              <Icon icon={style.icon} className="h-5 w-5" />
              <div className="flex-1">
                <div className="font-medium">{style.label}</div>
                <div className={`text-sm ${
                  diagramStyle === style.key 
                    ? theme === 'dark' ? 'text-gray-200' : 'text-blue-100'
                    : theme === 'dark' ? 'text-gray-400' : 'text-blue-600/70'
                }`}>
                  {style.description}
                </div>
              </div>
              {diagramStyle === style.key && (
                <Check className="h-4 w-4 ml-auto" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StyleToggle; 