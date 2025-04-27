import { useEffect, useState } from 'react';
import { PlusCircle, Cpu, Loader2 } from 'lucide-react';
import { ProjectTemplateType } from '@/types/projectTypes';
import ProjectTemplateSelector from '@/components/Projects/ProjectTemplateSelector';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { ProjectPriority, ProjectStatus } from '@/types/projectTypes';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (projectData: {
    name: string;
    description: string;
    priority: ProjectPriority;
    status: ProjectStatus;
    domain?: string;
    dueDate?: string;
    creator: string;
    templateType: ProjectTemplateType;
    importedFile?: string;
  }) => void;
  isSubmitting?: boolean;
}

const CreateProjectDialog = ({ 
  open, 
  onOpenChange, 
  onCreateProject,
  isSubmitting = false
}: CreateProjectDialogProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplateType | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectPriority, setProjectPriority] = useState<ProjectPriority>('Medium');
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('Not Started');
  const [projectDomain, setProjectDomain] = useState('');
  const [projectDueDate, setProjectDueDate] = useState('');
  const [importedFileName, setImportedFileName] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  // Handle dialog open/close
  const handleDialogOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      // Reset form on close
      setTimeout(() => {
        setSelectedTemplate(null);
        setProjectName('');
        setProjectDescription('');
        setProjectPriority('Medium');
        setProjectStatus('Not Started');
        setProjectDomain('');
        setProjectDueDate('');
        setImportedFileName('');
      }, 300);
    }
    
    if (!isSubmitting) {
      onOpenChange(open);
    }
  };

  const handleTemplateSelect = (template: ProjectTemplateType) => {
    setSelectedTemplate(template);
  };

  const handleFileImport = (fileName: string) => {
    setImportedFileName(fileName);
  };

  const handleStartProject = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a project",
        variant: "destructive"
      });
      return;
    }

    if (!selectedTemplate) {
      toast({
        title: "Template Required",
        description: "Please select a project approach to continue",
        variant: "destructive"
      });
      return;
    }
    
    if (!projectName || !projectDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }

    if (selectedTemplate === 'Import Existing' && !importedFileName) {
      toast({
        title: "File Required",
        description: "Please import a file for this project type",
        variant: "destructive"
      });
      return;
    }
    
    onCreateProject({
      name: projectName,
      description: projectDescription,
      priority: projectPriority,
      status: projectStatus,
      domain: projectDomain || undefined,
      dueDate: projectDueDate || undefined,
      creator: user.username || user.email || 'Unknown User',
      templateType: selectedTemplate,
      importedFile: importedFileName || undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill out the project details and select an approach to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="required-field">Project Name</Label>
            <Input 
              id="project-name" 
              placeholder="Enter project name" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description" className="required-field">Project Description</Label>
            <Textarea 
              id="project-description" 
              placeholder="Describe your project" 
              rows={3}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-priority">Priority</Label>
              <Select 
                value={projectPriority} 
                onValueChange={(value) => setProjectPriority(value as ProjectPriority)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-status">Status</Label>
              <Select 
                value={projectStatus} 
                onValueChange={(value) => setProjectStatus(value as ProjectStatus)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="Started">Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Planned">Planned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-due-date">Due Date</Label>
              <Input 
                id="project-due-date" 
                type="date" 
                value={projectDueDate}
                onChange={(e) => setProjectDueDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-domain">Domain/URL (Optional)</Label>
              <Input 
                id="project-domain" 
                placeholder="e.g. example.com" 
                value={projectDomain}
                onChange={(e) => setProjectDomain(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-approach" className="required-field">Project Approach</Label>
            <ProjectTemplateSelector
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleTemplateSelect}
              onFileImport={handleFileImport}
              disabled={isSubmitting}
            />
          </div>
          
          {selectedTemplate === 'AI Assisted' && (
            <div className="bg-blue-50 p-3 rounded-md flex gap-2 text-sm">
              <Cpu className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">AI Assisted Design</p>
                <p className="text-blue-700">
                  Use natural language to describe your project and our AI will design a custom security architecture.
                </p>
              </div>
            </div>
          )}

          {importedFileName && (
            <div className="bg-green-50 p-3 rounded-md text-sm">
              <p className="font-medium text-green-800">File selected: {importedFileName}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            className="bg-securetrack-purple hover:bg-securetrack-darkpurple" 
            onClick={handleStartProject}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Project...
              </>
            ) : (
              'Create Project'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;