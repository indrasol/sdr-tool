
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import type { ProjectTemplateType } from '@/components/Projects/ProjectTemplateSelector';

export const useProjectsPage = () => {
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
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
    addProject,
    loadSampleProjects
  } = useProjects();

  const handleProjectClick = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    
    if (project) {
      if (project.templateType === 'AI Assisted') {
        navigate('/model-with-ai');
      } else if (project.templateType === 'Import Existing') {
        navigate('/security-analysis');
      } else {
        toast({
          title: "Project Selected",
          description: `You clicked on project ${projectId}`,
        });
      }
    }
  };

  const handleCreateProject = () => {
    setCreateDialogOpen(true);
  };
  
  const handleProjectCreation = (projectData: {
    name: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    domain?: string;
    dueDate?: string;
    creator: string;
    templateType: ProjectTemplateType;
    importedFile?: string;
  }) => {
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

  const handleExportProjects = () => {
    toast({
      title: "Export Projects",
      description: "Projects would be exported as CSV",
    });
  };

  const handleStatusFilterChange = (status: string) => {
    if (status === 'All') {
      setStatusFilter('All');
    } else if (status === 'In Progress') {
      setStatusFilter('In Progress');
    } else if (status === 'Completed') {
      setStatusFilter('Completed');
    } else if (status === 'My') {
      // This is a custom filter for "My Projects"
      // Since we don't have a direct "My" filter, we clear filters and apply search for the creator
      clearFilters();
      setSearchTerm('testsdr'); // Assuming the current user is "testsdr"
    }
  };

  return {
    viewType,
    setViewType,
    createDialogOpen,
    setCreateDialogOpen,
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
    handleCreateProject,
    handleProjectCreation,
    handleExportProjects,
    handleStatusFilterChange
  };
};