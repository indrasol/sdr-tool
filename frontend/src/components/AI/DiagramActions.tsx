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
  Network
} from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface DiagramActionsProps {
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
}

const DiagramActions: React.FC<DiagramActionsProps> = ({
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
  onSave
}) => {
  // Local state to track if DFD mode is active
  const [isDfdActive, setIsDfdActive] = useState(false);
  
  // Wrapper function to handle both the toggle in parent and local state
  const handleToggleDataFlow = () => {
    setIsDfdActive(!isDfdActive);
    if (onToggleDataFlow) {
      onToggleDataFlow();
    }
  };

  // Function to revert to Architecture Diagram
  const handleSwitchToAD = () => {
    if (isDfdActive) {
      setIsDfdActive(false);
      if (onToggleDataFlow) {
        onToggleDataFlow();
      }
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-3 flex items-center justify-between w-full flex-shrink-0 h-12">
      <TooltipProvider>
        <div className="flex items-center space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
                onClick={onCopy}
              >
                <Copy size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
                onClick={onPaste}
              >
                <Clipboard size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Paste</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
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
                className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
                onClick={onRedo}
              >
                <Redo size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Redo</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
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
                className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
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
                className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
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
                className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
                onClick={onComment}
              >
                <MessageSquare size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Comments</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className={`h-8 w-8  border-securetrack-purple/50 text-securetrack-purple hover:bg-securetrack-purple hover:text-white ${
                  isDfdActive ? 'bg-securetrack-purple text-white' : ''
                }`}
                onClick={handleToggleDataFlow}
              >
                <span className="text-xs font-medium">DFD</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Switch to Data Flow Diagram</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className={`h-8 w-8  border-securetrack-purple/50 text-securetrack-purple hover:bg-securetrack-purple hover:text-white ${
                  !isDfdActive ? 'bg-securetrack-purple text-white' : ''
                }`}
                onClick={handleSwitchToAD}
              >
                <span className="text-xs font-medium">AD</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Switch to Architecture Diagram</TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex items-center space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
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
                className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
                onClick={onSave}
              >
                <Save size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Save Diagram</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default DiagramActions;

// import React from 'react';
// import { 
//   Copy, 
//   Clipboard, 
//   MousePointer, 
//   ZoomIn, 
//   ZoomOut, 
//   Undo, 
//   Redo,
//   MessageSquare,
//   Save,
//   FileText,
//   Maximize2
// } from 'lucide-react';
// import { Button } from '../ui/button';
// import { Separator } from '../ui/separator';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

// interface DiagramActionsProps {
//   onZoomIn?: () => void;
//   onZoomOut?: () => void;
//   onFitView?: () => void;
//   onCopy?: () => void;
//   onPaste?: () => void;
//   onUndo?: () => void;
//   onRedo?: () => void;
//   onSelect?: () => void;
//   onGenerateReport?: () => void;
//   onComment?: () => void;
//   onSave?: () => void;
// }

// const DiagramActions: React.FC<DiagramActionsProps> = ({
//   onZoomIn,
//   onZoomOut,
//   onFitView,
//   onCopy,
//   onPaste,
//   onUndo,
//   onRedo,
//   onSelect,
//   onGenerateReport,
//   onComment,
//   onSave
// }) => {
//   return (
//     <div className="bg-white border-b border-gray-200 px-3 flex items-center justify-between w-full flex-shrink-0 h-12">
//       <TooltipProvider>
//         <div className="flex items-center space-x-1">
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button 
//                 variant="ghost" 
//                 size="icon" 
//                 className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
//                 onClick={onCopy}
//               >
//                 <Copy size={16} />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent side="bottom">Copy</TooltipContent>
//           </Tooltip>
          
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button 
//                 variant="ghost" 
//                 size="icon" 
//                 className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
//                 onClick={onPaste}
//               >
//                 <Clipboard size={16} />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent side="bottom">Paste</TooltipContent>
//           </Tooltip>
          
//           <Separator orientation="vertical" className="h-6 mx-1" />
          
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button 
//                 variant="ghost" 
//                 size="icon" 
//                 className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
//                 onClick={onUndo}
//               >
//                 <Undo size={16} />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent side="bottom">Undo</TooltipContent>
//           </Tooltip>
          
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button 
//                 variant="ghost" 
//                 size="icon" 
//                 className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
//                 onClick={onRedo}
//               >
//                 <Redo size={16} />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent side="bottom">Redo</TooltipContent>
//           </Tooltip>
          
//           <Separator orientation="vertical" className="h-6 mx-1" />
          
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button 
//                 variant="ghost" 
//                 size="icon" 
//                 className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
//                 onClick={onZoomIn}
//               >
//                 <ZoomIn size={16} />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent side="bottom">Zoom In</TooltipContent>
//           </Tooltip>
          
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button 
//                 variant="ghost" 
//                 size="icon" 
//                 className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
//                 onClick={onZoomOut}
//               >
//                 <ZoomOut size={16} />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent side="bottom">Zoom Out</TooltipContent>
//           </Tooltip>
          
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button 
//                 variant="ghost" 
//                 size="icon" 
//                 className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
//                 onClick={onFitView}
//               >
//                 <Maximize2 size={16} />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent side="bottom">Fit View</TooltipContent>
//           </Tooltip>
          
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button 
//                 variant="ghost" 
//                 size="icon" 
//                 className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
//                 onClick={onComment}
//               >
//                 <MessageSquare size={16} />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent side="bottom">Comments</TooltipContent>
//           </Tooltip>
//         </div>
        
//         <div className="flex items-center space-x-1">
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button 
//                 variant="ghost" 
//                 size="icon" 
//                 className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
//                 onClick={onGenerateReport}
//               >
//                 <FileText size={16} />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent side="bottom">Generate Report</TooltipContent>
//           </Tooltip>
          
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button 
//                 variant="ghost" 
//                 size="icon" 
//                 className="h-8 w-8 hover:bg-securetrack-purple hover:text-white" 
//                 onClick={onSave}
//               >
//                 <Save size={16} />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent side="bottom">Save Diagram</TooltipContent>
//           </Tooltip>
//         </div>
//       </TooltipProvider>
//     </div>
//   );
// };

// export default DiagramActions;