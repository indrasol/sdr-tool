
import { useState } from 'react';
import type { Project } from '@/hooks/useProjects';

/**
 * Hook for managing project dialog states
 */
export const useProjectDialogs = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{id: string, name: string} | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  return {
    createDialogOpen,
    setCreateDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    deleteAllDialogOpen,
    setDeleteAllDialogOpen,
    projectToDelete,
    setProjectToDelete,
    projectToEdit,
    setProjectToEdit,
  };
};