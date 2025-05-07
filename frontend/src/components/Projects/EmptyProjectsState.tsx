import { FileText, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyProjectsStateProps {
  onCreateProject: () => void;
}

// Add custom CSS for filter buttons
const filterButtonStyles = `
  bg-gradient-to-r from-blue-50/70 to-purple-50/70
  border-blue-100 hover:border-blue-200
  text-blue-600 hover:text-blue-700
  hover:from-blue-100/80 hover:to-purple-100/80
  hover:shadow-sm
  transition-all duration-300
`;

const EmptyProjectsState = ({ onCreateProject }: EmptyProjectsStateProps) => {
  return (
    <div className="py-12 flex flex-col items-center justify-center bg-white rounded-lg border">
      <FileText className="h-12 w-12 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
      <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
        You haven't created any security projects yet. Start by clicking the "Create Project" button.
      </p>
      <Button 
        onClick={onCreateProject}
        variant="outline"
        size="sm"
        className={`${filterButtonStyles} h-9 text-sm whitespace-nowrap px-3 font-inter`}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Create Your First Project
      </Button>
    </div>
  );
};

export default EmptyProjectsState;