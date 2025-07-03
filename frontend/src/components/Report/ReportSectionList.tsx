import React, { useState, useEffect } from 'react';
import { 
  MoveVertical, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Plus,
  FileTextIcon,
  Network,
  GitBranch,
  LogIn,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  HelpCircle
} from 'lucide-react';
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
  onMovePage: (fromIndex: number, toIndex: number) => void;
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
  onAddSubsection,
  onMovePage
}) => {
  const [sectionMap, setSectionMap] = useState<SectionMap>({});
  const [newSubsectionTitle, setNewSubsectionTitle] = useState('');
  const [activePopover, setActivePopover] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  
  // Determine parent-child relationships based on titles
  useEffect(() => {
    const newSectionMap: SectionMap = {};
    
    console.log('Processing report pages:', reportPages.map(p => p.title));
    
    // First pass: identify all sections
    reportPages.forEach((page, index) => {
      newSectionMap[index] = {
        isParent: false,
        children: [],
        isOpen: true
      };
    });
    
    // Identify main sections
    const mainSections = ["Project Description", "System Design Architecture", 
                         "Data Flow Diagram", "Entry Point", "Model Attack Possibilities", 
                         "Key Risk Areas"];
    
    // Second pass: establish parent-child relationships (generic)
    let currentMainIndex: number | null = null;

    reportPages.forEach((page, index) => {
      if (mainSections.includes(page.title)) {
        // Main section encountered
        currentMainIndex = index;
        // Key Risk Areas can have predefined children later
        newSectionMap[index].isParent = page.title === "Key Risk Areas";
        return;
      }

      // Handle predefined risk subs separately
      if (page.title === "High Risks" || page.title === "Medium Risks" || page.title === "Low Risks") {
        const parentIndex = reportPages.findIndex(p => p.title === "Key Risk Areas");
        if (parentIndex !== -1) {
          newSectionMap[parentIndex].isParent = true;
          newSectionMap[parentIndex].children.push(index);
        }
        return;
      }

      // Generic subsection: assign to last main section if exists
      if (currentMainIndex !== null) {
        newSectionMap[currentMainIndex].isParent = true;
        newSectionMap[currentMainIndex].children.push(index);
      }
    });
    
    console.log('Section map:', newSectionMap);
    
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

  // Risk section specific styles
  const getRiskSectionStyles = (title: string, isActive: boolean) => {
    if (title === 'High Risks') {
      return isActive 
        ? `${baseButtonStyles} from-red-100/90 to-red-200/90 border-red-200 text-red-700 font-medium shadow-sm`
        : `${baseButtonStyles} from-red-50/70 to-red-100/70 border-red-100 hover:border-red-200 text-red-600 hover:text-red-700 hover:from-red-100/80 hover:to-red-200/80 hover:shadow-sm`;
    } else if (title === 'Medium Risks') {
      return isActive
        ? `${baseButtonStyles} from-orange-100/90 to-yellow-200/90 border-orange-200 text-orange-700 font-medium shadow-sm`
        : `${baseButtonStyles} from-orange-50/70 to-yellow-100/70 border-orange-100 hover:border-orange-200 text-orange-600 hover:text-orange-700 hover:from-orange-100/80 hover:to-yellow-200/80 hover:shadow-sm`;
    } else if (title === 'Low Risks') {
      return isActive
        ? `${baseButtonStyles} from-blue-100/90 to-blue-200/90 border-blue-200 text-blue-700 font-medium shadow-sm`
        : `${baseButtonStyles} from-blue-50/70 to-blue-100/70 border-blue-100 hover:border-blue-200 text-blue-600 hover:text-blue-700 hover:from-blue-100/80 hover:to-blue-200/80 hover:shadow-sm`;
    }
    return null;
  };
  
  // Subsection styles
  const subsectionStyle = `hover:bg-blue-50/50 text-gray-700 hover:text-blue-700`;
  const subsectionActiveStyle = `bg-blue-100/60 text-blue-700 font-medium`;
  
  // Child risk styles
  const getRiskChildStyles = (title: string, isActive: boolean) => {
    if (title === 'High Risks') {
      return isActive
        ? 'bg-red-100/60 text-red-700 font-medium border-l-4 border-l-red-400 pl-3'
        : 'hover:bg-red-50/60 text-gray-700 hover:text-red-700 border-l-4 border-l-red-300 pl-3';
    } else if (title === 'Medium Risks') {
      return isActive
        ? 'bg-amber-100/60 text-amber-700 font-medium border-l-4 border-l-amber-400 pl-3'
        : 'hover:bg-amber-50/60 text-gray-700 hover:text-amber-700 border-l-4 border-l-amber-300 pl-3';
    } else if (title === 'Low Risks') {
      return isActive
        ? 'bg-blue-100/60 text-blue-700 font-medium border-l-4 border-l-blue-400 pl-3'
        : 'hover:bg-blue-50/60 text-gray-700 hover:text-blue-700 border-l-4 border-l-blue-300 pl-3';
    }
    return null;
  };
  
  // Function to get appropriate icon for each section
  const getSectionIcon = (title: string, isChild: boolean = false) => {
    const iconSize = "h-4 w-4";
    const iconColor = isChild ? "text-gray-400" : "text-blue-400";
    
    // Risk sections with color coding (now as main sections)
    if (title === 'High Risks') {
      return <AlertTriangle className={`${iconSize} text-red-500`} />;
    } else if (title === 'Medium Risks') {
      return <AlertCircle className={`${iconSize} text-orange-500`} />;
    } else if (title === 'Low Risks') {
      return <Info className={`${iconSize} text-blue-500`} />;
    }
    // Legacy risk subsections with color coding (for backward compatibility)
    else if (title.includes('High Risk')) {
      return <AlertTriangle className={`${iconSize} text-red-500`} />;
    } else if (title.includes('Medium Risk')) {
      return <AlertCircle className={`${iconSize} text-orange-500`} />;
    } else if (title.includes('Low Risk')) {
      return <Info className={`${iconSize} text-blue-500`} />;
    }
    
    // Main sections
    switch (title) {
      case 'Project Description':
        return <FileTextIcon className={`${iconSize} ${iconColor}`} />;
      case 'System Design Architecture':
        return <Network className={`${iconSize} ${iconColor}`} />;
      case 'Data Flow Diagram':
        return <GitBranch className={`${iconSize} ${iconColor}`} />;
      case 'Entry Point':
        return <LogIn className={`${iconSize} ${iconColor}`} />;
      case 'Model Attack Possibilities':
        return <ShieldAlert className={`${iconSize} ${iconColor}`} />;
      case 'Key Risk Areas':
        return <ShieldCheck className={`${iconSize} ${iconColor}`} />;
      case 'Appendix A : Q & A ?':
        return <HelpCircle className={`${iconSize} ${iconColor}`} />;
      default:
        return <FileText className={`${iconSize} ${iconColor}`} />;
    }
  };
  
  // Helper to count risks in content (looks for '**Risk:' pattern)
  const countRisks = (content: string) => {
    if (!content) return 0;
    const matches = content.match(/\*\*Risk:/g);
    return matches ? matches.length : 0;
  };
  
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      onMovePage(dragIndex, index);
    }
    setDragIndex(null);
  };

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
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
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
                    ? (() => {
                        const riskStyle = getRiskChildStyles(page.title, currentPage === index);
                        return riskStyle || (currentPage === index 
                          ? 'bg-blue-100/60 text-blue-700 font-medium border-l-4 border-l-blue-400 pl-3' 
                          : 'hover:bg-blue-50/50 text-gray-700 hover:text-blue-700 border-l-4 border-l-blue-200 pl-3');
                      })()
                    : (() => {
                        const riskStyles = getRiskSectionStyles(page.title, currentPage === index);
                        return riskStyles || (currentPage === index ? sectionActiveGradient : sectionGradient);
                      })()
                  } 
                  border ${!isChild && (currentPage === index ? 'border-blue-200' : 'border-transparent hover:border-blue-100')}`}
              >
                <div className="flex items-center gap-2 py-1">
                  {hasChildren ? (
                    <div className="flex items-center gap-1">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-blue-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-blue-500" />
                      )}
                      {getSectionIcon(page.title, false)}
                    </div>
                  ) : (
                    getSectionIcon(page.title, isChild)
                  )}
                  
                  <span
                    className={`text-sm ${!isChild ? 'font-semibold' : ''}`}
                  >
                    {(() => {
                      if (page.title === 'High Risks' || page.title === 'Medium Risks' || page.title === 'Low Risks') {
                        const cnt = countRisks(page.content);
                        return `${page.title} (${cnt})`;
                      }
                      return page.title;
                    })()}
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