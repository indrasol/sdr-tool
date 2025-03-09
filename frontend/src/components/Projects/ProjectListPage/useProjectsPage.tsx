
import { useProjectsView } from './hooks/useProjectsView';
import { useProjectDialogs } from './hooks/useProjectDialogs';
import { useProjectOperations } from './hooks/useProjectOperations';
import { useProjectCRUD } from './hooks/useProjectCRUD';
import type { ProjectTemplateType } from '@/components/Projects/ProjectTemplateSelector';
import type { Project } from '@/hooks/useProjects';

export const useProjectsPage = () => {
  // Use the smaller, focused hooks
  const { viewType, setViewType } = useProjectsView();
  
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
  
  const {
    projects,
    allProjects,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    templateFilter,
    setTemplateFilter,
    clearFilters,
    hasActiveFilters,
    handleProjectClick,
    handleStatusFilterChange,
    handleExportProjects,
    addProject,
    deleteProject,
    deleteAllProjects,
    updateProject,
    loadSampleProjects
  } = useProjectOperations();

  const {
    handleCreateProject,
    handleEditProject,
    handleUpdateProject,
    handleDeleteProject,
    confirmDeleteProject,
    handleDeleteAllProjects,
    confirmDeleteAllProjects,
    handleProjectCreation,
  } = useProjectCRUD(
    addProject,
    updateProject,
    deleteProject,
    deleteAllProjects,
    loadSampleProjects,
    projects,
    allProjects
  );

  // Wrapper functions to connect the dialog state with CRUD operations
  const createProject = () => handleCreateProject(setCreateDialogOpen);
  
  const editProject = (projectId: string) => 
    handleEditProject(projectId, setProjectToEdit, setEditDialogOpen);
  
  const updateProjectWithDialogs = (projectId: string, updatedData: Partial<Project>) => 
    handleUpdateProject(projectId, updatedData, setEditDialogOpen, setProjectToEdit);
  
  const deleteProjectWithDialogs = (projectId: string) => 
    handleDeleteProject(projectId, setProjectToDelete, setDeleteDialogOpen);
  
  const confirmDeleteWithDialogs = () => 
    confirmDeleteProject(projectToDelete, setDeleteDialogOpen, setProjectToDelete);
  
  const deleteAllProjectsWithDialogs = () => 
    handleDeleteAllProjects(setDeleteAllDialogOpen);
  
  const confirmDeleteAllWithDialogs = () => 
    confirmDeleteAllProjects(setDeleteAllDialogOpen);
  
  const createProjectWithDialogs = (projectData: {
    name: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    domain?: string;
    dueDate?: string;
    creator: string;
    templateType: ProjectTemplateType;
    importedFile?: string;
  }) => handleProjectCreation(projectData, setCreateDialogOpen);

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
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    templateFilter,
    setTemplateFilter,
    clearFilters,
    hasActiveFilters,
    handleProjectClick,
    handleCreateProject: createProject,
    handleEditProject: editProject,
    handleUpdateProject: updateProjectWithDialogs,
    handleDeleteProject: deleteProjectWithDialogs,
    confirmDeleteProject: confirmDeleteWithDialogs,
    handleDeleteAllProjects: deleteAllProjectsWithDialogs,
    confirmDeleteAllProjects: confirmDeleteAllWithDialogs,
    handleProjectCreation: createProjectWithDialogs,
    handleExportProjects,
    handleStatusFilterChange
  };
};