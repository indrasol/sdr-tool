
import { Button } from '@/components/ui/button';

interface ProjectsPaginationProps {
  projectsCount: number;
  totalCount: number;
}

const ProjectsPagination = ({ projectsCount, totalCount }: ProjectsPaginationProps) => {
  if (projectsCount === 0) {
    return null;
  }

  return (
    <div className="flex justify-between items-center text-sm text-muted-foreground mt-6">
      <div>Showing {projectsCount} of {totalCount} projects</div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled>
          Next
        </Button>
      </div>
    </div>
  );
};

export default ProjectsPagination;