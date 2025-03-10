
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/components/Auth/AuthContext';
import { Project } from '@/interfaces/projectInterfaces'


/**
 * Hook that provides project operations
 */
// src/hooks/useProjectOperations.ts

export const useProjectOperations = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
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
    addProject,
    deleteProject,
    updateProject,
    refreshProjects,
    goToNextPage,
    goToPreviousPage,
    changePageSize,
    loadSampleProjects,
    defaultTenantId,
    setProjects,
    setAllProjects
  } = useProjects();

  const handleProjectClick = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    
    if (project) {
      if (project.templateType === 'AI Assisted') {
        navigate('/model-with-ai', { state: { projectId } });
      } else if (project.templateType === 'Import Existing' || project.importedFile) {
        navigate('/security-analysis', { state: { projectId } });
      } else {
        // If no specific page, show a toast and stay on the current page
        toast({
          title: "Project Selected",
          description: `Viewing project: ${project.name}`,
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
      // Since we have auth integration now, we use the current user's ID
      clearFilters();
      if (user) {
        setSearchTerm(user.username || user.email || '');
      }
    }
  };

  const handleSortChange = (field: string) => {
    // If clicking on the same field, toggle the sort order
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Otherwise, set the new sort field and default to ascending
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Add this function to useProjectOperations hook
  const updateProjectOptimistically = (projectId: string, updatedData: Partial<Project>) => {
    // Update the projects array immediately without waiting for API response
    const updatedProjects = projects.map(project => 
      project.id === projectId ? { ...project, ...updatedData } : project
    );
    
    // Update local state
    setProjects(updatedProjects);
    
    // Also update allProjects if it exists
    if (allProjects) {
      const updatedAllProjects = allProjects.map(project => 
        project.id === projectId ? { ...project, ...updatedData } : project
      );
      setAllProjects(updatedAllProjects);
    }
    
    return { originalProjects: projects, originalAllProjects: allProjects };
  };

  /**
  * Removes a project from the local state arrays
  */
  const removeProjectFromState = (projectId: string) => {
    // Update the projects array by filtering out the deleted project
    setProjects(currentProjects => 
      currentProjects.filter(project => project.id !== projectId)
    );
    
    // Also update allProjects if it exists
    if (allProjects) {
      setAllProjects(currentAllProjects => 
        currentAllProjects.filter(project => project.id !== projectId)
      );
    }
  };
  
  return {
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
    handleSortChange,
    addProject,
    deleteProject,
    removeProjectFromState,
    updateProject,
    refreshProjects,
    goToNextPage,
    goToPreviousPage,
    changePageSize,
    loadSampleProjects,
    defaultTenantId,
    updateProjectOptimistically
  };
};


//   const { toast } = useToast();
//   const navigate = useNavigate();
  
//   const {
//     projects,
//     allProjects,
//     searchTerm,
//     setSearchTerm,
//     statusFilter,
//     setStatusFilter,
//     priorityFilter,
//     setPriorityFilter,
//     templateFilter,
//     setTemplateFilter,
//     clearFilters,
//     hasActiveFilters,
//     addProject,
//     deleteProject,
//     updateProject,
//     loadSampleProjects
//   } = useProjects();

//   const handleProjectClick = (projectId: string) => {
//     const project = projects.find(p => p.id === projectId);
    
//     if (project) {
//       if (project.templateType === 'AI Assisted') {
//         navigate('/model-with-ai');
//       } else if (project.templateType === 'Import Existing' || project.importedFile) {
//         navigate('/security-analysis');
//       } else {
//         toast({
//           title: "Project Selected",
//           description: `You clicked on project ${projectId}`,
//         });
//       }
//     }
//   };

//   const handleStatusFilterChange = (status: string) => {
//     if (status === 'All') {
//       setStatusFilter('All');
//     } else if (status === 'In Progress') {
//       setStatusFilter('In Progress');
//     } else if (status === 'Completed') {
//       setStatusFilter('Completed');
//     } else if (status === 'My') {
//       // This is a custom filter for "My Projects"
//       // Since we don't have a direct "My" filter, we clear filters and apply search for the creator
//       clearFilters();
//       setSearchTerm('testsdr'); // Assuming the current user is "testsdr"
//     }
//   };

//   const handleExportProjects = () => {
//     toast({
//       title: "Export Projects",
//       description: "Projects would be exported as CSV",
//     });
//   };
  
//   return {
//     projects,
//     allProjects,
//     searchTerm,
//     setSearchTerm,
//     statusFilter,
//     setStatusFilter,
//     priorityFilter,
//     setPriorityFilter,
//     templateFilter,
//     setTemplateFilter,
//     clearFilters,
//     hasActiveFilters,
//     handleProjectClick,
//     handleStatusFilterChange,
//     handleExportProjects,
//     addProject,
//     deleteProject,
//     updateProject,
//     loadSampleProjects
//   };
// };