
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MoveSectionDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  pageToMove: number | null;
  moveToPosition: number;
  setMoveToPosition: (position: number) => void;
  totalPages: number;
  onMoveConfirm: () => void;
}

const MoveSectionDialog: React.FC<MoveSectionDialogProps> = ({
  open,
  setOpen,
  pageToMove,
  moveToPosition,
  setMoveToPosition,
  totalPages,
  onMoveConfirm
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Section</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="movePosition" className="text-sm font-medium">New Position</label>
            <Input
              id="movePosition"
              type="number"
              min={0}
              max={totalPages - 1}
              value={moveToPosition}
              onChange={(e) => setMoveToPosition(Number(e.target.value))}
              className="border-securetrack-purple/30 focus-visible:ring-securetrack-purple"
            />
            <p className="text-xs text-gray-500">Enter a position between 0 and {totalPages - 1}</p>
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={onMoveConfirm}
            className="bg-securetrack-purple hover:bg-securetrack-purple/90"
          >
            Move Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveSectionDialog;