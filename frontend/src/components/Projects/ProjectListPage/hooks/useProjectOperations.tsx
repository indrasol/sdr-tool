
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useProjects, Project } from '@/hooks/useProjects';
import type { ProjectTemplateType } from '@/components/Projects/ProjectTemplateSelector';

/**
 * Hook that provides project operations
 */
export const useProjectOperations = () => {
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
    deleteProject,
    deleteAllProjects,
    updateProject,
    loadSampleProjects
  } = useProjects();

  const handleProjectClick = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    
    if (project) {
      if (project.templateType === 'AI Assisted') {
        navigate('/model-with-ai');
      } else if (project.templateType === 'Import Existing' || project.importedFile) {
        navigate('/security-analysis');
      } else {
        toast({
          title: "Project Selected",
          description: `You clicked on project ${projectId}`,
        });
      }
    }
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

  const handleExportProjects = () => {
    toast({
      title: "Export Projects",
      description: "Projects would be exported as CSV",
    });
  };
  
  return {
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
  };
};