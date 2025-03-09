
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteSectionDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  pageTitle: string | null;
  onDeleteConfirm: () => void;
}

const DeleteSectionDialog: React.FC<DeleteSectionDialogProps> = ({
  open,
  setOpen,
  pageTitle,
  onDeleteConfirm
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Section</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Are you sure you want to delete this section? This action cannot be undone.</p>
          {pageTitle && (
            <p className="font-semibold mt-2">"{pageTitle}"</p>
          )}
        </div>
        <DialogFooter>
          <Button 
            onClick={() => setOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button 
            onClick={onDeleteConfirm}
            variant="destructive"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSectionDialog;