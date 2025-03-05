
import { useState, useMemo } from 'react';
import type { ProjectStatus, ProjectPriority } from '@/components/Projects/ProjectCard';
import type { ProjectTemplateType } from '@/components/Projects/ProjectTemplateSelector';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  createdDate: string;
  dueDate?: string;
  creator: string;
  assignedTo?: string;
  domain?: string;
  templateType?: ProjectTemplateType;
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
    templateType: 'AI Assisted'
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
    templateType: 'Solutions Hub'
  },
  {
    id: 'P3456',
    name: 'Internal Network Penetration Test',
    description: 'Testing the security of internal systems and network infrastructure.',
    status: 'On Hold',
    priority: 'Medium',
    createdDate: '2023-05-20',
    creator: 'testsdr',
    importedFile: 'network_scan.xml',
    templateType: 'Import Existing'
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
    templateType: 'AI Assisted'
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
    templateType: 'Import Existing'
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

  const addProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
  };

  const loadSampleProjects = (creatorName: string) => {
    if (creatorName === 'testsdr') {
      setProjects(sampleProjects);
      return true;
    }
    return false;
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
    loadSampleProjects
  };
};