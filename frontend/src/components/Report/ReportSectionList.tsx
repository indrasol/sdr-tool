
import React from 'react';
import { MoveVertical, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ReportPage {
  title: string;
  content: string;
}

interface ReportSectionListProps {
  reportPages: ReportPage[];
  currentPage: number;
  setCurrentPage: (index: number) => void;
  onOpenMoveDialog: (index: number) => void;
  onOpenDeleteDialog: (index: number) => void;
}

const ReportSectionList: React.FC<ReportSectionListProps> = ({
  reportPages,
  currentPage,
  setCurrentPage,
  onOpenMoveDialog,
  onOpenDeleteDialog
}) => {
  return (
    <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
      <TooltipProvider>
        {reportPages.map((page, index) => (
          <div
            key={index}
            onClick={() => setCurrentPage(index)}
            className={`p-2 rounded-md cursor-pointer flex justify-between group ${
              currentPage === index 
                ? 'bg-securetrack-lightpurple text-white' 
                : 'hover:bg-securetrack-lightpurple/10 text-black'
            }`}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate text-sm">{page.title}</span>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{page.title}</p>
              </TooltipContent>
            </Tooltip>
            <div className={`opacity-0 group-hover:opacity-100 flex space-x-1 ${currentPage === index ? 'text-white' : 'text-securetrack-lightpurple'}`}>
              <MoveVertical 
                className="h-4 w-4 cursor-pointer hover:scale-110" 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMoveDialog(index);
                }}
              />
              {reportPages.length > 1 && (
                <Trash2 
                  className="h-4 w-4 cursor-pointer hover:scale-110" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDeleteDialog(index);
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </TooltipProvider>
    </div>
  );
};

export default ReportSectionList;