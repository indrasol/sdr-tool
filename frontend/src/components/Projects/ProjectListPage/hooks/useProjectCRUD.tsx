
import { useToast } from '@/hooks/use-toast';
import { Project } from '@/hooks/useProjects';
import type { ProjectTemplateType } from '@/components/Projects/ProjectTemplateSelector';

/**
 * Hook for project CRUD operations
 */
export const useProjectCRUD = (
  addProject: (project: Project) => void,
  updateProject: (projectId: string, updatedData: Partial<Project>) => void,
  deleteProject: (projectId: string) => void,
  deleteAllProjects: () => void,
  loadSampleProjects: (creatorName: string) => boolean,
  projects: Project[],
  allProjects: Project[]
) => {
  const { toast } = useToast();

  const handleCreateProject = (setCreateDialogOpen: (open: boolean) => void) => {
    setCreateDialogOpen(true);
  };

  const handleEditProject = (
    projectId: string, 
    setProjectToEdit: (project: Project | null) => void, 
    setEditDialogOpen: (open: boolean) => void
  ) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setProjectToEdit(project);
      setEditDialogOpen(true);
    }
  };

  const handleUpdateProject = (
    projectId: string, 
    updatedData: Partial<Project>,
    setEditDialogOpen: (open: boolean) => void,
    setProjectToEdit: (project: Project | null) => void
  ) => {
    updateProject(projectId, updatedData);
    toast({
      title: "Project Updated",
      description: `Project has been updated successfully`,
    });
    setEditDialogOpen(false);
    setProjectToEdit(null);
  };

  const handleDeleteProject = (
    projectId: string,
    setProjectToDelete: (project: {id: string, name: string} | null) => void,
    setDeleteDialogOpen: (open: boolean) => void
  ) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setProjectToDelete({id: project.id, name: project.name});
      setDeleteDialogOpen(true);
    }
  };

  const confirmDeleteProject = (
    projectToDelete: {id: string, name: string} | null,
    setDeleteDialogOpen: (open: boolean) => void,
    setProjectToDelete: (project: {id: string, name: string} | null) => void
  ) => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      toast({
        title: "Project Deleted",
        description: `Project "${projectToDelete.name}" has been deleted`,
      });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleDeleteAllProjects = (
    setDeleteAllDialogOpen: (open: boolean) => void
  ) => {
    if (allProjects.length > 0) {
      setDeleteAllDialogOpen(true);
    } else {
      toast({
        title: "No Projects",
        description: "There are no projects to delete.",
      });
    }
  };

  const confirmDeleteAllProjects = (
    setDeleteAllDialogOpen: (open: boolean) => void
  ) => {
    deleteAllProjects();
    toast({
      title: "All Projects Deleted",
      description: `All projects have been deleted successfully`,
    });
    setDeleteAllDialogOpen(false);
  };

  const handleProjectCreation = (
    projectData: {
      name: string;
      description: string;
      priority: 'Low' | 'Medium' | 'High' | 'Critical';
      domain?: string;
      dueDate?: string;
      creator: string;
      templateType: ProjectTemplateType;
      importedFile?: string;
    },
    setCreateDialogOpen: (open: boolean) => void
  ) => {
    // Generate a random project ID
    const projectId = 'P' + Math.floor(1000 + Math.random() * 9000).toString();
    
    // Check if we should load sample projects
    if (projectData.creator === 'testsdr' && allProjects.length === 0) {
      const loaded = loadSampleProjects(projectData.creator);
      if (!loaded) {
        // If not loaded, add the new project
        addProject({
          id: projectId,
          name: projectData.name,
          description: projectData.description,
          status: 'Not Started',
          priority: projectData.priority,
          createdDate: new Date().toISOString().split('T')[0],
          dueDate: projectData.dueDate,
          creator: projectData.creator,
          domain: projectData.domain,
          templateType: projectData.templateType,
          importedFile: projectData.importedFile
        });
      }
    } else {
      // Add the new project
      addProject({
        id: projectId,
        name: projectData.name,
        description: projectData.description,
        status: 'Not Started',
        priority: projectData.priority,
        createdDate: new Date().toISOString().split('T')[0],
        dueDate: projectData.dueDate,
        creator: projectData.creator,
        domain: projectData.domain,
        templateType: projectData.templateType,
        importedFile: projectData.importedFile
      });
    }
    
    toast({
      title: "Project Created",
      description: `New project "${projectData.name}" has been created`,
    });
    
    setCreateDialogOpen(false);
  };

  return {
    handleCreateProject,
    handleEditProject,
    handleUpdateProject,
    handleDeleteProject,
    confirmDeleteProject,
    handleDeleteAllProjects,
    confirmDeleteAllProjects,
    handleProjectCreation,
  };
};