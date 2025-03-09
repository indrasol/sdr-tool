
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';

interface ReportPage {
  title: string;
  content: string;
}

interface AddSectionDialogProps {
  onAddPage: (page: ReportPage) => void;
}

const AddSectionDialog: React.FC<AddSectionDialogProps> = ({ onAddPage }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [open, setOpen] = useState(false);

  const handleAddPage = () => {
    if (newTitle.trim() === '') return;
    
    onAddPage({
      title: newTitle,
      content: newContent
    });
    
    setNewTitle('');
    setNewContent('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-6 w-6 rounded-full bg-securetrack-purple/10 text-securetrack-purple hover:bg-securetrack-purple/20"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Report Section</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Section Title</label>
            <Input
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter section title"
              className="border-securetrack-purple/30 focus-visible:ring-securetrack-purple"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">Initial Content</label>
            <Textarea
              id="content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Enter initial content for this section"
              rows={5}
              className="border-securetrack-purple/30 focus-visible:ring-securetrack-purple"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleAddPage}
            className="bg-securetrack-purple hover:bg-securetrack-purple/90"
          >
            Add Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSectionDialog;