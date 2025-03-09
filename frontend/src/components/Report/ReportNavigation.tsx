
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onDeletePage: (index: number) => void;
}

const ReportNavigation: React.FC<ReportNavigationProps> = ({
  reportPages,
  currentPage,
  setCurrentPage,
  onAddPage,
  onMovePage,
  onDeletePage
}) => {
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [pageToMove, setPageToMove] = useState<number | null>(null);
  const [moveToPosition, setMoveToPosition] = useState<number>(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<number | null>(null);

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
    <div className="col-span-2">
      <Card className="overflow-hidden border-securetrack-green/20 bg-white shadow-md">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm text-black">Report Sections</h3>
            <AddSectionDialog onAddPage={onAddPage} />
          </div>
          
          <ReportSectionList
            reportPages={reportPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onOpenMoveDialog={handleOpenMoveDialog}
            onOpenDeleteDialog={handleOpenDeleteDialog}
          />
          
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportNavigation;