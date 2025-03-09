
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

interface DeleteAllProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectCount: number;
  onConfirmDeleteAll: () => void;
}

const DeleteAllProjectsDialog = ({
  open,
  onOpenChange,
  projectCount,
  onConfirmDeleteAll,
}: DeleteAllProjectsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete All Projects
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete all {projectCount} projects? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-start mt-4">
          <Button
            variant="destructive"
            onClick={onConfirmDeleteAll}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All Projects
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAllProjectsDialog;