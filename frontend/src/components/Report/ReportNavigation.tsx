
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Lock, 
  ShieldCheck, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Trash
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface ReportPage {
  title: string;
  content: string;
}

interface ReportNavigationProps {
  reportPages: ReportPage[];
  currentPage: number;
  setCurrentPage: (index: number) => void;
  onAddPage: (newPage: ReportPage) => void;
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
  const [newPageTitle, setNewPageTitle] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddPage = () => {
    if (newPageTitle.trim()) {
      onAddPage({
        title: newPageTitle,
        content: 'New section content. Click edit to modify.'
      });
      setNewPageTitle('');
      setDialogOpen(false);
    }
  };

  const handleMoveUp = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index > 0) {
      onMovePage(index, index - 1);
    }
  };

  const handleMoveDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index < reportPages.length - 1) {
      onMovePage(index, index + 1);
    }
  };

  const handleDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Prevent deleting if we only have one page left
    if (reportPages.length > 1) {
      onDeletePage(index);
      // If we're deleting the current page, select the first page
      if (currentPage === index) {
        setCurrentPage(0);
      } else if (currentPage > index) {
        // If we're deleting a page before the current page, adjust the current page index
        setCurrentPage(currentPage - 1);
      }
    }
  };

  return (
    <div className="col-span-2">
      <Card className="border-securetrack-green/20">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-securetrack-green">Report Sections</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 px-2 text-securetrack-green hover:bg-securetrack-green/10">
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Add Section</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-securetrack-green">Add New Section</DialogTitle>
                        <DialogDescription>
                          Create a new section for your security report.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Input
                          placeholder="Section Title"
                          value={newPageTitle}
                          onChange={(e) => setNewPageTitle(e.target.value)}
                          className="mb-2"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button
                          onClick={handleAddPage}
                          className="bg-securetrack-green text-white hover:bg-securetrack-green/90"
                        >
                          Add Section
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add new section</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <ul className="space-y-2">
            {reportPages.map((page, index) => (
              <li key={index} className="group">
                <div className="flex items-center">
                  <Button
                    variant={currentPage === index ? "default" : "ghost"}
                    className={`flex-grow justify-start h-auto py-2 ${
                      currentPage === index 
                        ? "bg-securetrack-green text-white" 
                        : "hover:bg-securetrack-green/10 hover:text-securetrack-green"
                    }`}
                    onClick={() => setCurrentPage(index)}
                  >
                    <div className="flex items-center w-full">
                      <span className="flex-shrink-0 mr-2">
                        {index === 0 && <CheckCircle className="h-4 w-4" />}
                        {index === 1 && <Lock className="h-4 w-4" />}
                        {index === 2 && <ShieldCheck className="h-4 w-4" />}
                        {index > 2 && <ShieldCheck className="h-4 w-4" />}
                      </span>
                      <span className="truncate max-w-[120px] text-left">{page.title}</span>
                    </div>
                  </Button>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-gray-500 hover:text-securetrack-green"
                            onClick={(e) => handleMoveUp(index, e)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                            <span className="sr-only">Move Up</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Move up</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 w-7 p-0 text-gray-500 hover:text-securetrack-green"
                            onClick={(e) => handleMoveDown(index, e)}
                            disabled={index === reportPages.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                            <span className="sr-only">Move Down</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Move down</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 w-7 p-0 text-gray-500 hover:text-red-500"
                            onClick={(e) => handleDelete(index, e)}
                            disabled={reportPages.length <= 1}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete section</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportNavigation;