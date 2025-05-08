
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ProjectStatus, ProjectPriority, ProjectTemplateType } from '@/types/projectTypes';
import type { Project, PaginationState, GetProjectsParams, CreateProjectPayload } from '@/interfaces/projectInterfaces';
import  projectService from '@/services/projectService';
import { toast } from "sonner";
import { useAuth } from "../components/Auth/AuthContext";
import { useToast } from '@/hooks/use-toast';

// Sample projects to display when creator is "testsdr"
// const sampleProjects: Project[] = [
//   {
//     id: 'P1234',
//     name: 'Web Application Security Assessment',
//     description: 'Comprehensive security analysis of the company ecommerce platform.',
//     status: 'In Progress',
//     priority: 'High',
//     createdDate: '2023-06-12',
//     dueDate: '2023-07-30',
//     creator: 'testsdr',
//     domain: 'ecommerce.example.com',
//     templateType: 'AI Assisted',
//     tenantId: 1
//   },
//   {
//     id: 'P2345',
//     name: 'Cloud Infrastructure Hardening',
//     description: 'Implementing security controls for AWS infrastructure and services.',
//     status: 'Not Started',
//     priority: 'Critical',
//     createdDate: '2023-06-15',
//     dueDate: '2023-08-10',
//     creator: 'testsdr',
//     assignedTo: 'DevOps Team',
//     templateType: 'Solutions Hub',
//     tenantId: 1
//   },
//   {
//     id: 'P3456',
//     name: 'Internal Network Penetration Test',
//     description: 'Testing the security of internal systems and network infrastructure.',
//     status: 'On Hold',
//     priority: 'Medium',
//     createdDate: '2023-05-20',
//     creator: 'testsdr',
//     importedFile: 'network_scan.xml',
//     templateType: 'Import Existing',
//     tenantId: 1
//   },
//   {
//     id: 'P4567',
//     name: 'SOC 2 Compliance Project',
//     description: 'Preparing documentation and controls for SOC 2 Type II audit.',
//     status: 'Not Started',
//     priority: 'High',
//     createdDate: '2023-04-10',
//     dueDate: '2023-09-15',
//     creator: 'testsdr',
//     assignedTo: 'Compliance Team',
//     templateType: 'AI Assisted',
//     tenantId: 1
//   },
//   {
//     id: 'P5678',
//     name: 'Mobile App Security Review',
//     description: 'Security code review and penetration testing of iOS and Android applications.',
//     status: 'In Progress',
//     priority: 'Medium',
//     createdDate: '2023-06-01',
//     dueDate: '2023-07-01',
//     creator: 'testsdr',
//     importedFile: 'mobile_scan_results.pdf',
//     templateType: 'Import Existing',
//     tenantId: 1
//   }
// ];

// Mock projects data - empty by default
const mockProjects: Project[] = [];


export const useProjects = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Default tenant ID - should come from user context or app config
  const defaultTenantId = user?.tenantId || 1;
  
  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'All'>('All');
  const [templateFilter, setTemplateFilter] = useState<ProjectTemplateType | 'All'>('All');
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    limit: 10,
    offset: 0,
    total: 0
  });
  
  // Sorting state
  const [sortBy, setSortBy] = useState<string>('created_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Function to fetch projects from the API
  const fetchProjects = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build params for API request
      const params: GetProjectsParams = {
        tenant_id: defaultTenantId,
        limit: pagination.limit,
        offset: pagination.offset,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      
      // Only add filters if they're not set to 'All'
      if (statusFilter !== 'All') params.status = statusFilter;
      if (priorityFilter !== 'All') params.priority = priorityFilter;

      console.log("user : ", user)

      console.log("params : ",params)
      
      // Fetch projects from API
      const projectsData = await projectService.getProjects(params);
      setProjects(projectsData);
      
      setPagination(prev => ({
        ...prev,
        total: projectsData.length > 0 ? Math.max(projectsData.length, prev.total) : prev.total
      }));
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    user, 
    defaultTenantId, 
    pagination.limit, 
    pagination.offset, 
    sortBy, 
    sortOrder, 
    statusFilter, 
    priorityFilter, 
    toast
  ]);
  
  // Fetch projects on component mount and when dependencies change
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  
  // Apply client-side filtering for search
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Search filter (client-side only)
      const matchesSearch = 
        searchTerm === '' || 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.domain && project.domain.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Template filter (client-side only since API doesn't support it)
      const matchesTemplate = templateFilter === 'All' || project.templateType === templateFilter;
      
      return matchesSearch && matchesTemplate;
    });
  }, [projects, searchTerm, templateFilter]);

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'All' || priorityFilter !== 'All' || templateFilter !== 'All';
  
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setTemplateFilter('All');
  };

  // Function to add a new project
  const addProject = async (project: Omit<Project, 'id' | 'createdDate'>) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create project payload
      const payload: CreateProjectPayload = {
        name: project.name,
        description: project.description,
        priority: project.priority,
        status: project.status || 'NOT_STARTED',
        domain: project.domain,
        due_date: project.dueDate,
        creator: user.id || user.email || 'unknown',
        template_type: project.templateType || 'AI Assisted',
        imported_file: project.importedFile,
        tenant_id: defaultTenantId
      };
      
      // Create project via API
      const newProject = await projectService.createProject(payload);
      
      // Update local state
      setProjects(prev => [...prev, newProject]);
      
      toast({
        title: 'Success',
        description: 'Project created successfully',
      });
      
      return newProject;
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a project
  const deleteProject = async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Delete project via API
      await projectService.deleteProject(projectId);
      
      // Update local state
      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update a project
  const updateProject = async (projectId: string, updatedData: Partial<Project>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Update project via API
      const updatedProject = await projectService.updateProject(projectId, updatedData);
      
      // Update local state
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId ? { ...project, ...updatedProject } : project
        )
      );
      
      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });
      
      return updatedProject;
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to update project',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh projects
  const refreshProjects = () => {
    fetchProjects();
  };
  
  // Pagination control functions
  const goToNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    }
  };
  
  const goToPreviousPage = () => {
    if (pagination.offset - pagination.limit >= 0) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset - prev.limit
      }));
    }
  };
  
  const changePageSize = (newLimit: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      offset: 0 // Reset to first page when changing page size
    }));
  };
  
  // Temporary function to load sample projects (for demo purposes)
  const loadSampleProjects = (creatorName: string) => {
    // This can be kept for demo purposes or removed
    toast({
      title: 'Info',
      description: 'Using real API data instead of sample projects',
    });
    fetchProjects();
    return true;
  };
  
  return {
    projects: filteredProjects,
    allProjects: projects,
    setAllProjects,
    isLoading,
    setProjects,
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
    defaultTenantId
  };
};