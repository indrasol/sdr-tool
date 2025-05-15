import React, { useState, useEffect } from 'react';
import { MoveVertical, Trash2, ChevronRight, ChevronDown, FileText, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  onAddPage: (page: ReportPage) => void;
  onAddSubsection: (parentIndex: number, subsection: ReportPage) => void;
}

type SectionMap = {
  [key: string]: {
    isParent: boolean;
    children: number[];
    isOpen: boolean;
  }
}

const ReportSectionList: React.FC<ReportSectionListProps> = ({
  reportPages,
  currentPage,
  setCurrentPage,
  onOpenMoveDialog,
  onOpenDeleteDialog,
  onAddPage,
  onAddSubsection
}) => {
  const [sectionMap, setSectionMap] = useState<SectionMap>({});
  const [newSubsectionTitle, setNewSubsectionTitle] = useState('');
  const [activePopover, setActivePopover] = useState<number | null>(null);
  
  // Determine parent-child relationships based on titles
  useEffect(() => {
    const newSectionMap: SectionMap = {};
    
    // First pass: identify all sections
    reportPages.forEach((page, index) => {
      newSectionMap[index] = {
        isParent: false,
        children: [],
        isOpen: true
      };
    });
    
    // Identify main sections
    const mainSections = ["Project Description", "Production(Go Live) Requirement", "System Architecture Diagram", 
                         "Data-flow Diagram", "Entry Point", "Model Attack Possibilities", 
                         "Key Risk Areas", "Appendix A : Q & A ?"];
    
    // Second pass: establish parent-child relationships
    reportPages.forEach((page, index) => {
      if (page.title === "High Risks" || page.title === "Medium Risks" || page.title === "Low Risks") {
        // These are children of "Key Risk Areas"
        const parentIndex = reportPages.findIndex(p => p.title === "Key Risk Areas");
        if (parentIndex !== -1) {
          newSectionMap[parentIndex].isParent = true;
          newSectionMap[parentIndex].children.push(index);
        }
      } else if (mainSections.includes(page.title)) {
        // These are main sections
        newSectionMap[index].isParent = mainSections.includes(page.title);
      }
    });
    
    setSectionMap(newSectionMap);
  }, [reportPages]);
  
  const toggleSection = (index: number) => {
    setSectionMap(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        isOpen: !prev[index].isOpen
      }
    }));
  };

  const handleAddSubsection = (parentIndex: number) => {
    if (!newSubsectionTitle.trim()) return;
    
    // Format the subsection title to match the style of existing subsections
    let formattedTitle = newSubsectionTitle.trim();
    
    // If adding under Key Risk Areas, format title to match existing risk subsections
    if (reportPages[parentIndex].title === "Key Risk Areas") {
      if (!formattedTitle.includes("Risks")) {
        formattedTitle += " Risks";
      }
    }
    
    // Create new subsection and add it after the parent
    const newSubsection = {
      title: formattedTitle,
      content: `This is a new sub-section under ${reportPages[parentIndex].title}`
    };
    
    onAddSubsection(parentIndex, newSubsection);
    setNewSubsectionTitle('');
    setActivePopover(null);
  };
  
  // Modern theme-matching styles based on Projects page
  const baseButtonStyles = `bg-gradient-to-r transition-all duration-200`;
  
  // Section styles (similar to filter buttons in Projects)
  const sectionGradient = `${baseButtonStyles} from-blue-50/70 to-purple-50/70 
                          border-blue-100 hover:border-blue-200
                          text-blue-600 hover:text-blue-700
                          hover:from-blue-100/80 hover:to-purple-100/80
                          hover:shadow-sm`;
                          
  const sectionActiveGradient = `${baseButtonStyles} from-blue-100/90 to-purple-100/90
                               border-blue-200
                               text-blue-700 font-medium
                               shadow-sm`;
  
  // Subsection styles
  const subsectionStyle = `hover:bg-blue-50/50 text-gray-700 hover:text-blue-700`;
  const subsectionActiveStyle = `bg-blue-100/60 text-blue-700 font-medium`;
  
  return (
    <div className="space-y-1 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
      <TooltipProvider>
        {reportPages.map((page, index) => {
          // Skip rendering child sections that belong to a collapsed parent
          const isChild = Object.values(sectionMap).some(
            section => section.children.includes(index)
          );
          
          const parentIndex = Object.entries(sectionMap).find(
            ([key, section]) => section.children.includes(index)
          )?.[0];
          
          const isParentCollapsed = parentIndex && !sectionMap[parseInt(parentIndex)].isOpen;
          
          if (isChild && isParentCollapsed) {
            return null;
          }
          
          const isParent = sectionMap[index]?.isParent;
          const hasChildren = sectionMap[index]?.children.length > 0;
          const isOpen = sectionMap[index]?.isOpen;
          
          return (
            <div
              key={index}
              className={`rounded-md overflow-hidden animate-fadeIn ${isChild ? 'ml-6' : ''}`}
            >
              <div
                onClick={() => {
                  setCurrentPage(index);
                  // Only toggle if it has children
                  if (hasChildren) {
                    toggleSection(index);
                  }
                }}
                className={`p-2 rounded-md cursor-pointer flex justify-between group items-center
                  ${isChild 
                    ? (currentPage === index 
                        ? 'bg-blue-100/60 text-blue-700 font-medium border-l-4 border-l-blue-400 pl-3' 
                        : 'hover:bg-blue-50/50 text-gray-700 hover:text-blue-700 border-l-4 border-l-blue-200 pl-3')
                    : (currentPage === index 
                        ? sectionActiveGradient 
                        : sectionGradient)
                  } 
                  border ${!isChild && (currentPage === index ? 'border-blue-200' : 'border-transparent hover:border-blue-100')}`}
              >
                <div className="flex items-center gap-2 py-1">
                  {hasChildren ? (
                    isOpen ? (
                      <ChevronDown className="h-4 w-4 text-blue-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-blue-500" />
                    )
                  ) : (
                    <FileText className={`h-4 w-4 ${isChild ? 'text-gray-400' : 'text-blue-400'}`} />
                  )}
                  
                  <span className={`text-sm ${!isChild ? 'font-semibold' : ''}`}>
                    {page.title}
                  </span>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity">
                  <Popover open={activePopover === index} onOpenChange={(open) => {
                    if (open) setActivePopover(index);
                    else setActivePopover(null);
                  }}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-full hover:bg-blue-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePopover(index);
                              }}
                            >
                              <Plus className="h-4 w-4 text-blue-500" />
                            </Button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Add sub-section</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <PopoverContent className="w-60 p-3" side="right">
                      <div className="space-y-3">
                        <h4 className="font-medium">Add Sub-section</h4>
                        <Input
                          placeholder="Enter sub-section title"
                          value={newSubsectionTitle}
                          onChange={(e) => setNewSubsectionTitle(e.target.value)}
                          className="w-full"
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setNewSubsectionTitle('');
                              setActivePopover(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                            onClick={() => handleAddSubsection(index)}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {reportPages.length > 1 && (
                    <Trash2 
                      className="h-4 w-4 cursor-pointer hover:scale-110 text-blue-500 hover:text-red-500 transition-colors" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDeleteDialog(index);
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </TooltipProvider>
    </div>
  );
};

export default ReportSectionList;