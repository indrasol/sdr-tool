
import { Project } from '@/hooks/useProjects';
import ProjectCard from '@/components/Projects/ProjectCard';

interface ProjectsGridViewProps {
  projects: Project[];
  viewType: 'grid' | 'list';
  onProjectClick: (projectId: string) => void;
}

const ProjectsGridView = ({ projects, viewType, onProjectClick }: ProjectsGridViewProps) => {
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className={viewType === 'grid' 
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
      : "space-y-4"
    }>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          {...project}
          onClick={() => onProjectClick(project.id)}
        />
      ))}
    </div>
  );
};

export default ProjectsGridView;