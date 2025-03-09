
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, PencilLine } from "lucide-react";

interface ProjectCardActionsProps {
  id: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const ProjectCardActions: React.FC<ProjectCardActionsProps> = ({
  id,
  onDelete,
  onEdit
}) => {
  // Prevent event bubbling when clicking the action buttons
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(id);
    }
  };

  return (
    <div className="flex gap-1">
      {onEdit && (
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 text-blue-600 hover:bg-blue-50" 
          onClick={handleEditClick}
        >
          <PencilLine className="h-4 w-4" />
          <span className="sr-only">Edit project</span>
        </Button>
      )}
      {onDelete && (
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 text-destructive hover:bg-destructive/10" 
          onClick={handleDeleteClick}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete project</span>
        </Button>
      )}
    </div>
  );
};

export default ProjectCardActions;