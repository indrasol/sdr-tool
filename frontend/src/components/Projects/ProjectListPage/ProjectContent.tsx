
import { Project } from '@/hooks/useProjects';
import ProjectFilters from '@/components/Projects/ProjectFilters';
import EmptyProjectsState from '@/components/Projects/EmptyProjectsState';
import ProjectsGridView from '@/components/Projects/ProjectsGridView';
import ProjectsPagination from '@/components/Projects/ProjectsPagination';
import type { ProjectStatus, ProjectPriority } from '@/components/Projects/types/projectTypes';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowDown, ArrowUp, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';

interface ProjectContentProps {
  projects: Project[];
  allProjects: Project[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: ProjectStatus | 'All';
  setStatusFilter: (status: ProjectStatus | 'All') => void;
  priorityFilter: ProjectPriority | 'All';
  setPriorityFilter: (priority: ProjectPriority | 'All') => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  onProjectClick: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject?: (projectId: string) => void;
  onEditProject?: (projectId: string) => void;
  viewType?: 'grid' | 'list';
  setViewType?: (viewType: 'grid' | 'list') => void;
}

const ProjectContent = ({
  projects,
  allProjects,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  clearFilters,
  hasActiveFilters,
  onProjectClick,
  onCreateProject,
  onDeleteProject,
  onEditProject,
  viewType = 'grid'
}: ProjectContentProps) => {
  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'priority' | 'createdDate' | 'dueDate' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sorted projects
  const sortedProjects = [...projects].sort((a, b) => {
    if (!sortField) return 0;
    
    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } 
    else if (sortField === 'priority') {
      const priorityRank = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
      return sortDirection === 'asc' 
        ? priorityRank[a.priority] - priorityRank[b.priority]
        : priorityRank[b.priority] - priorityRank[a.priority];
    }
    else if (sortField === 'createdDate') {
      return sortDirection === 'asc'
        ? new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
        : new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    }
    else if (sortField === 'dueDate') {
      // Handle cases where dueDate might be undefined
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return sortDirection === 'asc' ? 1 : -1;
      if (!b.dueDate) return sortDirection === 'asc' ? -1 : 1;
      
      return sortDirection === 'asc'
        ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
    return 0;
  });

  const handleSort = (field: 'name' | 'priority' | 'createdDate' | 'dueDate') => {
    if (sortField === field) {
      // Toggle sort direction if same field is clicked
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and reset direction to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'name' | 'priority' | 'createdDate' | 'dueDate') => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-primary" /> 
      : <ArrowDown className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <ProjectFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
        
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
          <div className="flex flex-wrap gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSort('name')}
              className="h-9 gap-1 px-2"
            >
              Name {getSortIcon('name')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSort('priority')}
              className="h-9 gap-1 px-2"
            >
              Priority {getSortIcon('priority')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSort('createdDate')}
              className="h-9 gap-1 px-2"
            >
              Created <Calendar className="h-3.5 w-3.5 ml-1" /> {getSortIcon('createdDate')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSort('dueDate')}
              className="h-9 gap-1 px-2"
            >
              Due <Clock className="h-3.5 w-3.5 ml-1" /> {getSortIcon('dueDate')}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {sortedProjects.length === 0 ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <EmptyProjectsState onCreateProject={onCreateProject} />
          </motion.div>
        ) : (
          <motion.div
            key={`projects-${viewType}-${sortField}-${sortDirection}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="transition-all duration-300"
          >
            <ProjectsGridView 
              projects={sortedProjects} 
              viewType={viewType} 
              onProjectClick={onProjectClick}
              onDeleteProject={onDeleteProject}
              onEditProject={onEditProject}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ProjectsPagination 
        projectsCount={projects.length} 
        totalCount={allProjects.length} 
      />
    </div>
  );
};

export default ProjectContent;