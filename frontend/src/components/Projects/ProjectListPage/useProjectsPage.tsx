// src/hooks/useProjectsPage.ts
import { useProjectsView } from './hooks/useProjectsView';
import { useProjectDialogs } from './hooks/useProjectDialogs';
import { useProjectOperations } from './hooks/useProjectOperations';
import { useProjectCRUD } from './hooks/useProjectCRUD';
import { Project } from '../../../interfaces/projectInterfaces';
import { useToast } from '@/hooks/use-toast';

export const useProjectsPage = () => {
  // Use the view type hook
  const { viewType, setViewType } = useProjectsView();
  const { toast } = useToast();
  
  // Use the dialogs hook for managing dialog state
  const {
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
    setProjectToEdit
  } = useProjectDialogs();
  
  // Use the operations hook for project data and operations
  const {
    projects,
    allProjects,
    setProjects,
    setAllProjects,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    templateFilter,
    setTemplateFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    pagination,
    clearFilters,
    hasActiveFilters,
    handleProjectClick,
    handleStatusFilterChange,
    updateProjectOptimistically,
    handleSortChange,
    addProject,
    deleteProject,
    updateProject,
    refreshProjects,
    goToNextPage,
    goToPreviousPage,
    changePageSize,
    loadSampleProjects,
    defaultTenantId,
    removeProjectFromState
  } = useProjectOperations();

  // Use the CRUD hook for handling create/read/update/delete operations
  const {
    handleCreateProject,
    handleEditProject,
    handleUpdateProject,
    handleDeleteProject,
    confirmDeleteProject,
    handleProjectCreation,
    isSubmitting
  } = useProjectCRUD();

  // Wrapper functions to connect the dialog start with CRUD operations
  const createProject = () => handleCreateProject(setCreateDialogOpen);
  
  const editProject = (projectId: string) => 
    handleEditProject(projectId, setProjectToEdit, setEditDialogOpen, projects);
  
  const updateProjectWithDialogs = (projectId: string, updatedData: Partial<Project>) => {
    // Close the dialog immediately for better UX
    setEditDialogOpen(false);
    setProjectToEdit(null);
    
    // Apply optimistic update and store original state
    const originalState = updateProjectOptimistically(projectId, updatedData);
    
    // Call the actual update
    handleUpdateProject(
      projectId, 
      updatedData, 
      setEditDialogOpen, 
      setProjectToEdit,
      originalState
    ).then(success => {
      if (!success) {
        // If update failed, revert to original state
        setProjects(originalState.originalProjects);
        if (originalState.originalAllProjects) {
          setAllProjects(originalState.originalAllProjects);
        }
        
        toast({
          title: "Update Failed",
          description: "The project update couldn't be completed. Changes have been reverted.",
          variant: "destructive"
        });
      }
    });
  };
  
  const deleteProjectWithDialogs = (projectId: string) => 
    handleDeleteProject(projectId, setProjectToDelete, setDeleteDialogOpen, projects);
  
  const confirmDeleteWithDialogs = () => 
    confirmDeleteProject(
      projectToDelete, 
      setDeleteDialogOpen, 
      setProjectToDelete,
      // Pass the state update function as a callback
      (deletedProjectId) => removeProjectFromState(deletedProjectId)
    );

  
  const createProjectWithDialogs = (projectData: any) => {
    handleProjectCreation(projectData, setCreateDialogOpen, (newProject) => {refreshProjects()});
  }

  // Return everything needed by the Projects component
  return {
    viewType,
    setViewType,
    createDialogOpen,
    setCreateDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    deleteAllDialogOpen,
    setDeleteAllDialogOpen,
    projectToDelete,
    editDialogOpen,
    setEditDialogOpen,
    projectToEdit,
    projects,
    allProjects,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    templateFilter,
    setTemplateFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    pagination,
    clearFilters,
    hasActiveFilters,
    handleProjectClick,
    handleCreateProject: createProject,
    handleEditProject: editProject,
    handleUpdateProject: updateProjectWithDialogs,
    handleDeleteProject: deleteProjectWithDialogs,
    confirmDeleteProject: confirmDeleteWithDialogs,
    handleProjectCreation: createProjectWithDialogs,
    handleStatusFilterChange,
    handleSortChange,
    refreshProjects,
    goToNextPage,
    goToPreviousPage,
    changePageSize,
    isSubmitting,
    defaultTenantId
  };
};