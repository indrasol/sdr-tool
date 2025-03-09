
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface EditNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: {
    id: string;
    label: string;
    description?: string;
  } | null;
  onSave: (id: string, updatedData: { label: string; description: string }) => void;
}

const EditNodeDialog: React.FC<EditNodeDialogProps> = ({
  open,
  onOpenChange,
  node,
  onSave
}) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (node) {
      setLabel(node.label || '');
      setDescription(node.description || '');
    }
  }, [node]);

  const handleSave = () => {
    if (node && node.id) {
      onSave(node.id, { label, description });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Node</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right text-sm font-medium">
              Label
            </label>
            <Input
              id="name"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="description" className="text-right text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Add details about this node"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditNodeDialog;