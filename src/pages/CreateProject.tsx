
import { Plus, FolderPlus, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import AppHeader from '@/components/layout/AppHeader';
import { useNavigate } from 'react-router-dom';

const CreateProject = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="pt-24 px-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Project</h1>
          <p className="text-muted-foreground">
            Start a new project or add an existing one to your workspace
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
          <div className="glass-card p-8 rounded-lg hover:scale-102 transition-transform cursor-pointer">
            <Plus className="w-12 h-12 mb-4" style={{ color: '#3ECF8E' }} />
            <h3 className="text-xl font-semibold mb-2">New Project</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create a new project from scratch with custom settings and configurations
            </p>
            <Button variant="default" size="lg" className="w-full">
              Create New Project
            </Button>
          </div>

          <div className="glass-card p-8 rounded-lg hover:scale-102 transition-transform cursor-pointer">
            <FolderPlus className="w-12 h-12 mb-4" style={{ color: '#3ECF8E' }} />
            <h3 className="text-xl font-semibold mb-2">Add Existing Project</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Import an existing project and its associated documents and settings
            </p>
            <Button variant="default" size="lg" className="w-full">
              Add Existing Project
            </Button>
          </div>

          <div 
            className="glass-card p-8 rounded-lg hover:scale-102 transition-transform cursor-pointer"
            onClick={() => navigate('/model-with-ai')}
          >
            <Sparkles className="w-12 h-12 mb-4" style={{ color: '#3ECF8E' }} />
            <h3 className="text-xl font-semibold mb-2">Model with AI</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Let AI help you model and structure your project based on best practices
            </p>
            <Button variant="default" size="lg" className="w-full">
              Start AI Modeling
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateProject;
