import React, { useState } from 'react';
import {
  Copy,
  Clipboard,
  MousePointer,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  MessageSquare,
  Save,
  FileText,
  Maximize2,
  Network,
  LayoutDashboard,
  Check,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

// Add custom button hover styles
const buttonHoverStyles = `
  transition-all duration-200
  hover:bg-gradient-to-r hover:from-blue-100/80 hover:to-purple-100/80 
  hover:text-blue-700 hover:border-blue-200 hover:shadow-sm
`;

// Add custom CSS for filter buttons from ProjectFilters.tsx
const filterButtonStyles = `
  bg-gradient-to-r from-blue-50/70 to-purple-50/70
  border-blue-100 hover:border-blue-200
  text-blue-600 hover:text-blue-700
  hover:from-blue-100/80 hover:to-purple-100/80
  hover:shadow-sm
  transition-all duration-300
`;

type ViewMode = 'AD' | 'DFD';

interface DiagramActionsProps {
  viewMode: ViewMode;
  onSwitchView: (mode: ViewMode) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelect?: () => void;
  onGenerateReport?: () => void;
  onComment?: () => void;
  onToggleDataFlow?: () => void;
  onSave?: () => void;
  projectId?: string;
}

const DiagramActions: React.FC<DiagramActionsProps> = ({
  viewMode,
  onSwitchView,
  onZoomIn,
  onZoomOut,
  onFitView,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onSelect,
  onGenerateReport,
  onComment,
  onToggleDataFlow,
  onSave,
  projectId
}) => {
  const [copied, setCopied] = useState(false);

  const handleSwitchToAD = () => {
    if (viewMode !== 'AD' && onSwitchView) {
      onSwitchView('AD');
    }
  };

  const handleSwitchToDFD = () => {
    if (viewMode !== 'DFD' && onSwitchView) {
      onSwitchView('DFD');
    }
  };

  const copyProjectId = () => {
    if (!projectId) return;

    navigator.clipboard.writeText(projectId)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy project ID:', err);
      });
  };

  return (
    <div className="bg-white border-b border-gray-200 px-3 flex items-center justify-between w-full flex-shrink-0 h-12">
      <TooltipProvider>
        <div className="flex items-center space-x-1">
          {projectId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`flex items-center h-8 px-3 rounded-md border text-sm font-medium cursor-pointer ${filterButtonStyles}`}
                  onClick={copyProjectId}
                >

                  <span className="ml-1 text-blue-700">{projectId}</span>
                  {copied ? (
                    <Check size={14} className="ml-2 text-green-500" />
                  ) : (
                    <Copy size={14} className="ml-2 text-blue-500 opacity-70" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">Click to copy project ID</TooltipContent>
            </Tooltip>
          )}

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${buttonHoverStyles}`}
                onClick={onUndo}
              >
                <Undo size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Undo</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${buttonHoverStyles}`} 
                onClick={onRedo}
              >
                <Redo size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Redo</TooltipContent>
          </Tooltip> */}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${buttonHoverStyles}`}
                onClick={onGenerateReport}
              >
                <FileText size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Generate Report</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${buttonHoverStyles}`}
                onClick={onSave}
              >
                <Save size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Save Diagram</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${buttonHoverStyles}`}
                onClick={onZoomIn}
              >
                <ZoomIn size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom In</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${buttonHoverStyles}`}
                onClick={onZoomOut}
              >
                <ZoomOut size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom Out</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${buttonHoverStyles}`}
                onClick={onFitView}
              >
                <Maximize2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Fit View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${buttonHoverStyles}`}
                onClick={onComment}
              >
                <MessageSquare size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Comments</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* AD Button */}

          {/* <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 px-2 border-securetrack-purple/50 text-securetrack-purple ${buttonHoverStyles} ${viewMode === 'AD' ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' : ''
                  }`}
                onClick={handleSwitchToAD}
              >
                <span className="text-xs font-medium">AD</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Switch to Architecture Diagram</TooltipContent>
          </Tooltip> */}

          {/* DFD Button */}
          {/* 
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm" // Adjusted size
                className={`h-8 px-2 border-securetrack-purple/50 text-securetrack-purple ${buttonHoverStyles} ${
                  viewMode === 'DFD' ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' : ''
                }`}
                onClick={handleSwitchToDFD}
              >
                 <span className="text-xs font-medium">DFD</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Switch to Data Flow Diagram</TooltipContent>
          </Tooltip>
          */}

        </div>

        <div className="flex items-center space-x-1">

          {/* Save as Template Button */}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 text-sm whitespace-nowrap px-2 sm:px-3 ${filterButtonStyles}`}
                onClick={onSave}
              >
                <Save size={16} className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="font-medium">Save as Template</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Save as Template</TooltipContent>
          </Tooltip>

        </div>
      </TooltipProvider>
    </div>
  );
};

export default DiagramActions;