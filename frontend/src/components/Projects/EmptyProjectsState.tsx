
import { FileText, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyProjectsStateProps {
  onCreateProject: () => void;
}

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
        className="bg-securetrack-purple hover:bg-securetrack-darkpurple"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Create Your First Project
      </Button>
    </div>
  );
};

export default EmptyProjectsState;