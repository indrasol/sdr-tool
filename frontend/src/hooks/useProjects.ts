import { useState, useMemo, useEffect } from 'react';
import type { ProjectStatus, ProjectPriority } from '@/components/Projects/ProjectCard';
import type { ProjectTemplateType } from '@/components/Projects/ProjectTemplateSelector';
import tokenService from '@/utils/tokenService';
import { useNavigate } from 'react-router-dom';

export interface Project {
  id: string;
  name: string;
  description: string;
  tenant_id: number;
  status: ProjectStatus;
  priority: ProjectPriority;
  createdDate: string;
  dueDate: string;
  creator: string;
  assignedTo?: string;
  domain?: string;
  templateType: ProjectTemplateType;
  importedFile?: string;
}

// Sample projects to display when creator is "testsdr"
const sampleProjects: Project[] = [
  {
    id: 'P1234',
    name: 'Web Application Security Assessment',
    description: 'Comprehensive security analysis of the company ecommerce platform.',
    status: 'In Progress',
    priority: 'High',
    createdDate: '2023-06-12',
    dueDate: '2023-07-30',
    creator: 'testsdr',
    domain: 'ecommerce.example.com',
    templateType: 'AI Assisted',
    tenant_id: 1
  },
  {
    id: 'P2345',
    name: 'Cloud Infrastructure Hardening',
    description: 'Implementing security controls for AWS infrastructure and services.',
    status: 'Not Started',
    priority: 'Critical',
    createdDate: '2023-06-15',
    dueDate: '2023-08-10',
    creator: 'testsdr',
    assignedTo: 'DevOps Team',
    templateType: 'Solutions Hub',
    tenant_id: 1
  },
  {
    id: 'P3456',
    name: 'Internal Network Penetration Test',
    description: 'Testing the security of internal systems and network infrastructure.',
    status: 'On Hold',
    priority: 'Medium',
    createdDate: '2023-05-20',
    dueDate: '2023-06-20',
    creator: 'testsdr',
    importedFile: 'network_scan.xml',
    templateType: 'Import Existing',
    tenant_id: 1
  },
  {
    id: 'P4567',
    name: 'SOC 2 Compliance Project',
    description: 'Preparing documentation and controls for SOC 2 Type II audit.',
    status: 'Started',
    priority: 'High',
    createdDate: '2023-04-10',
    dueDate: '2023-09-15',
    creator: 'testsdr',
    assignedTo: 'Compliance Team',
    templateType: 'AI Assisted',
    tenant_id: 1
  },
  {
    id: 'P5678',
    name: 'Mobile App Security Review',
    description: 'Security code review and penetration testing of iOS and Android applications.',
    status: 'In Progress',
    priority: 'Medium',
    createdDate: '2023-06-01',
    dueDate: '2023-07-01',
    creator: 'testsdr',
    importedFile: 'mobile_scan_results.pdf',
    templateType: 'Import Existing',
    tenant_id: 1
  }
];

// Mock projects data - empty by default
const mockProjects: Project[] = [];

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'All'>('All');
  const [templateFilter, setTemplateFilter] = useState<ProjectTemplateType | 'All'>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Define fetchProjects function first
  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await tokenService.authenticatedFetch(
        'http://localhost:8000/v1/routes/projects',
        {
          method: 'GET',
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          tokenService.clearAuth();
          navigate('/login', { replace: true });
          throw new Error('Unauthorized - Please log in again');
        }
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Fetched projects:", data);
      setProjects(data.projects || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleProjects = (creatorName: string) => {
    if (creatorName === 'testsdr') {
      setProjects(sampleProjects);
      return true;
    }
    return false;
  };

  // Fetch projects when the component mounts or token changes
  useEffect(() => {
    // Only fetch if authenticated
    if (tokenService.isAuthenticated()) {
      fetchProjects();
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Apply search filter
      const matchesSearch = 
        searchTerm === '' || 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.domain && project.domain.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Apply status filter
      const matchesStatus = statusFilter === 'All' || project.status === statusFilter;
      
      // Apply priority filter
      const matchesPriority = priorityFilter === 'All' || project.priority === priorityFilter;
      
      // Apply template filter
      const matchesTemplate = templateFilter === 'All' || project.templateType === templateFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesTemplate;
    });
  }, [projects, searchTerm, statusFilter, priorityFilter, templateFilter]);

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'All' || priorityFilter !== 'All' || templateFilter !== 'All';
  
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setTemplateFilter('All');
  };

  // Function to add a new project
  const addProject = async (projectData: Omit<Project, 'id'>) => {
    console.log("Entered addProject");
    setIsLoading(true);
    setError(null);

    try {
      // Ensure all required fields have values before sending to API
      const dataToSend = {
        ...projectData,
        // Ensure these fields are never null/undefined
        dueDate: projectData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        templateType: projectData.templateType || 'AI Assisted',
        domain: projectData.domain || 'General',
      };

      console.log("Data being sent to API:", dataToSend);
      const response = await tokenService.authenticatedFetch(
        'http://localhost:8000/v1/routes/projects',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          tokenService.clearAuth();
          navigate('/login', { replace: true });
          throw new Error('Unauthorized - Please log in again');
        }
        throw new Error(`Failed to create project: ${response.statusText}`);
      }

      const newProject = await response.json();
      console.log("New project from API:", newProject);
      
      // Update projects state with the new project
      setProjects(prevProjects => {
        const updatedProjects = [...prevProjects, newProject];
        console.log("Updated projects array length:", updatedProjects.length);
        return updatedProjects;
      });
      
      // Now fetchProjects is defined before being used
      // fetchProjects();
      
      return newProject; // Return the new project for any additional processing
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(project => project.id !== projectId));
  };

  const updateProject = (projectId: string, updatedData: Partial<Project>) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === projectId ? { ...project, ...updatedData } : project
      )
    );
  };

  
  
  return {
    projects: filteredProjects,
    allProjects: projects,
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
    updateProject,
    loadSampleProjects,
    error,
    isLoading
  };
};