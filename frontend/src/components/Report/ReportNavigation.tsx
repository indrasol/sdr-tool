import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Plus, Menu } from 'lucide-react';
import ReportSectionList from './ReportSectionList';
import AddSectionDialog from './AddSectionDialog';
import MoveSectionDialog from './MoveSectionDialog';
import DeleteSectionDialog from './DeleteSectionDialog';

interface ReportPage {
  title: string;
  content: string;
}

interface ReportNavigationProps {
  reportPages: ReportPage[];
  currentPage: number;
  setCurrentPage: (index: number) => void;
  onAddPage: (page: ReportPage) => void;
  onAddSubsection: (parentIndex: number, subsection: ReportPage) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onDeletePage: (index: number) => void;
}

const ReportNavigation: React.FC<ReportNavigationProps> = ({
  reportPages,
  currentPage,
  setCurrentPage,
  onAddPage,
  onAddSubsection,
  onMovePage,
  onDeletePage
}) => {
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [pageToMove, setPageToMove] = useState<number | null>(null);
  const [moveToPosition, setMoveToPosition] = useState<number>(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<number | null>(null);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Memoized navigation stats for performance
  const navigationStats = useMemo(() => {
    const totalPages = reportPages.length;
    const sectionsWithContent = reportPages.filter(page => page.content.trim().length > 0).length;
    const completionPercentage = totalPages > 0 ? Math.round((sectionsWithContent / totalPages) * 100) : 0;
    
    return {
      totalPages,
      sectionsWithContent,
      completionPercentage,
      currentSection: currentPage + 1
    };
  }, [reportPages, currentPage]);

  const handleMoveConfirm = () => {
    if (pageToMove !== null && moveToPosition >= 0 && moveToPosition < reportPages.length) {
      onMovePage(pageToMove, moveToPosition);
      setShowMoveDialog(false);
      setPageToMove(null);
      setMoveToPosition(0);
    }
  };

  const handleDeleteConfirm = () => {
    if (pageToDelete !== null) {
      onDeletePage(pageToDelete);
      setShowDeleteDialog(false);
      setPageToDelete(null);
    }
  };

  const handleOpenMoveDialog = (index: number) => {
    setPageToMove(index);
    setMoveToPosition(index);
    setShowMoveDialog(true);
  };

  const handleOpenDeleteDialog = (index: number) => {
    setPageToDelete(index);
    setShowDeleteDialog(true);
  };

  return (
    <div className="report-navigation-mobile lg:col-span-3">
      {/* Mobile Toggle Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="w-full flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-all"
          aria-expanded={isMobileExpanded}
          aria-controls="report-navigation-content"
        >
          <div className="flex items-center gap-2">
            <Menu className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-700">Report Sections</span>
            <Badge variant="outline" className="text-xs">
              {navigationStats.currentSection}/{navigationStats.totalPages}
            </Badge>
          </div>
        </button>
      </div>

      {/* Navigation Content */}
      <div 
        id="report-navigation-content"
        className={`
          ${isMobileExpanded ? 'block' : 'hidden'} 
          lg:block
        `}
      >
        <Card className="report-card-enhanced overflow-hidden border-blue-200/70 smooth-transition">
          <CardContent className="p-0">
            {/* Sticky Header */}
            <div className="sticky-header-enhanced p-4 border-b border-blue-100">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-start gap-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg shadow-inner flex-shrink-0">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-sm text-gray-800" id="navigation-title">
                      Report Sections
                    </h3>
                    <span className="text-xs text-gray-500 mt-0.5">Security analysis outline</span>
                  </div>
                </div>
                <AddSectionDialog onAddPage={onAddPage} />
              </div>
            </div>
            
            {/* Scrollable Section List */}
            <ScrollArea className="enhanced-scrollbar max-h-[400px] lg:max-h-[600px]">
              <div className="p-4" role="navigation" aria-labelledby="navigation-title">
                <ReportSectionList
                  reportPages={reportPages}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  onOpenMoveDialog={handleOpenMoveDialog}
                  onOpenDeleteDialog={handleOpenDeleteDialog}
                  onAddPage={onAddPage}
                  onAddSubsection={onAddSubsection}
                  onMovePage={onMovePage}
                />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {/* Dialogs */}
      <MoveSectionDialog
        open={showMoveDialog}
        setOpen={setShowMoveDialog}
        pageToMove={pageToMove}
        moveToPosition={moveToPosition}
        setMoveToPosition={setMoveToPosition}
        totalPages={reportPages.length}
        onMoveConfirm={handleMoveConfirm}
      />
      
      <DeleteSectionDialog
        open={showDeleteDialog}
        setOpen={setShowDeleteDialog}
        pageTitle={pageToDelete !== null ? reportPages[pageToDelete]?.title : null}
        onDeleteConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default ReportNavigation;