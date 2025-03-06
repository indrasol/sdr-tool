
import { Project } from '@/hooks/useProjects';
import ProjectFilters from '@/components/Projects/ProjectFilters';
import EmptyProjectsState from '@/components/Projects/EmptyProjectsState';
import ProjectsGridView from '@/components/Projects/ProjectsGridView';
import ProjectsPagination from '@/components/Projects/ProjectsPagination';
import type { ProjectStatus, ProjectPriority } from '@/components/Projects/ProjectCard';

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
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {projects.length === 0 ? (
        <EmptyProjectsState onCreateProject={onCreateProject} />
      ) : (
        <ProjectsGridView 
          projects={projects} 
          viewType={viewType} 
          onProjectClick={onProjectClick} 
          onDeleteProject={onDeleteProject}
          onEditProject={onEditProject}
        />
      )}

      <ProjectsPagination 
        projectsCount={projects.length} 
        totalCount={allProjects.length} 
      />
    </div>
  );
};

export default ProjectContent;