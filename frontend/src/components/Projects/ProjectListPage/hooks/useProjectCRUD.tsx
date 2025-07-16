// src/hooks/useProjectCRUD.ts
import { useState, useMemo } from 'react';
import { ProjectPriority, ProjectStatus, ProjectTemplateType } from '@/types/projectTypes';
import { Project, CreateProjectPayload, UpdateProjectPayload } from '@/interfaces/projectInterfaces';
import { useAuth } from '@/components/Auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import projectService from '@/services/projectService';

export const useProjectCRUD = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Determine the current user values reactively
  const currentUserName = useMemo(() => {
    return user?.username || user?.email || 'unknown';
  }, [user]);
  
  // Helper to fetch tenant ID safely without relying on a stale constant
  const getTenantId = () => {
    return user?.tenantId ?? 1; // default to 1 if not yet available
  };
  
  // Handle opening the create project dialog
  const handleCreateProject = (setCreateDialogOpen: (open: boolean) => void) => {
    setCreateDialogOpen(true);
  };
  
  // Create a new project
  const addProject = async (projectData: {
    name: string;
    description: string;
    priority: ProjectPriority;
    status: ProjectStatus;
    domain?: string;
    dueDate?: string;
    templateType: ProjectTemplateType;
    importedFile?: string;
    tags?: string[];
  }): Promise<Project | null> => {
    setIsSubmitting(true);
    
    try {
      // Get team ID from user context if available
      const teamId = user?.teamId || undefined;
      
      // Create project payload
      const createPayload: CreateProjectPayload = {
        name: projectData.name,
        description: projectData.description,
        priority: projectData.priority,
        status: projectData.status,
        domain: projectData.domain,
        due_date: projectData.dueDate,
        creator: currentUserName,
        template_type: projectData.templateType,
        imported_file: projectData.importedFile,
        tenant_id: getTenantId(),
        team_id: teamId,
        tags: projectData.tags
      };
      
      // Call service to create project
      const newProject = await projectService.createProject(createPayload);
      
      toast({
        title: "Success",
        description: `Project "${projectData.name}" has been created successfully`,
      });
      
      return newProject;
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Update an existing project
  const updateProject = async (
    projectId: string, 
    projectData: {
      name?: string;
      description?: string;
      priority?: ProjectPriority;
      status?: ProjectStatus;
      domain?: string;
      dueDate?: string;
      assignedTo?: string;
    }
  ): Promise<Project | null> => {
    setIsSubmitting(true);
    
    try {
      // Create update payload
      const updatePayload: UpdateProjectPayload = {
        name: projectData.name,
        description: projectData.description,
        priority: projectData.priority,
        status: projectData.status,
        domain: projectData.domain,
        due_date: projectData.dueDate
      };
      
      // Call service to update project
      const updatedProject = await projectService.updateProject(projectId, updatePayload);
      
      toast({
        title: "Success",
        description: `Project "${updatedProject.name}" has been updated successfully!`,
      });
      
      return updatedProject;
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete a project
  const deleteProject = async (projectId: string, projectName: string): Promise<boolean> => {
    setIsSubmitting(true);
    
    try {
      // Call service to delete project
      await projectService.deleteProject(projectId);
      
      toast({
        title: "Success",
        description: `Project "${projectName}" has been deleted successfully`,
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get a project by ID
  const getProjectById = async (projectId: string): Promise<Project | null> => {
    try {
      return await projectService.getProjectById(projectId, getTenantId());
    } catch (error) {
      console.error("Error fetching project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch project",
        variant: "destructive"
      });
      return null;
    }
  };
  
  // Handle project editing - find the project and open the edit dialog
  const handleEditProject = (
    projectId: string,
    setProjectToEdit: (project: Project | null) => void,
    setEditDialogOpen: (open: boolean) => void,
    projects: Project[]
  ) => {
    const project = projects.find(p => p.id === projectId);
    console.log("Edit Project details : ",project)
    if (project) {
      setProjectToEdit(project);
      setEditDialogOpen(true);
    } else {
      toast({
        title: "Error",
        description: "Project not found",
        variant: "destructive"
      });
    }
  };
  
  // Handle project update from the edit dialog
  const handleUpdateProject = async (
    projectId: string,
    updatedData: Partial<Project>,
    setEditDialogOpen: (open: boolean) => void,
    setProjectToEdit: (project: Project | null) => void,
    originalState?: { originalProjects: Project[], originalAllProjects?: Project[] }
  ) : Promise<boolean> => {
    console.log("Updated Project details : ",updatedData)
    try {
      // Call service to update project
      const result = await updateProject(projectId, {
        name: updatedData.name,
        description: updatedData.description,
        priority: updatedData.priority,
        status: updatedData.status,
        domain: updatedData.domain,
        dueDate: updatedData.dueDate,
        assignedTo: updatedData.assignedTo
      });
      
      if (result) {
        toast({
          title: "Success",
          description: `Project "${result.name}" has been updated successfully!`,
        });
        
        setEditDialogOpen(false);
        setProjectToEdit(null);
        return true;
      } else {
        // If the update failed, revert the optimistic update if original state was provided
        throw new Error("Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Handle project deletion - mark a project for deletion
  const handleDeleteProject = (
    projectId: string,
    setProjectToDelete: (project: Project | null) => void,
    setDeleteDialogOpen: (open: boolean) => void,
    projects: Project[]
  ) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setProjectToDelete(project);
      setDeleteDialogOpen(true);
    } else {
      toast({
        title: "Error",
        description: "Project not found",
        variant: "destructive"
      });
    }
  };
  
  // Confirm project deletion
  const confirmDeleteProject = async (
    projectToDelete: Pick<Project, 'id' | 'name'>,
    setDeleteDialogOpen: (open: boolean) => void,
    setProjectToDelete: (project: Project | null) => void,
    onDeleteSuccess?: (projectId: string) => void
  ) => {
    if (!projectToDelete) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await deleteProject(projectToDelete.id, projectToDelete.name);
      
      if (result) {
        // Close the dialog
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
        
        // Call the success callback if provided
        if (onDeleteSuccess) {
          onDeleteSuccess(projectToDelete.id);
        }
      }
    } catch (error) {
      console.error("Error confirming delete:", error);
      // Toast is already handled in deleteProject
    } finally {
      setIsSubmitting(false);
    }
  };
  
  
  // Handle project creation from the dialog
  const handleProjectCreation = async (
    projectData: {
      name: string;
      description: string;
      priority: ProjectPriority;
      status: ProjectStatus;
      domain?: string;
      dueDate?: string;
      templateType: ProjectTemplateType;
      importedFile?: string;
      tags?: string[];
    },
    setCreateDialogOpen: (open: boolean) => void,
    onProjectCreated?: (project: Project) => void
  ) => {
    const newProject = await addProject(projectData);
    
    if (newProject) {
      setCreateDialogOpen(false);
      if (onProjectCreated) {
        onProjectCreated(newProject);
      }
    }
  };
  
  return {
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    handleCreateProject,
    handleEditProject,
    handleUpdateProject,
    handleDeleteProject,
    confirmDeleteProject,
    handleProjectCreation,
    isSubmitting,
    currentUserName,
    getTenantId
  };
};