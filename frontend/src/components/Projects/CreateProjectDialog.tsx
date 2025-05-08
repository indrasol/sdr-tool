import { useEffect, useState } from 'react';
import { PlusCircle, Cpu, Loader2, Sparkles } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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

// Add a consistent button style variable for selects
const selectButtonStyles = `
  bg-gradient-to-r from-blue-50/70 to-purple-50/70
  border-blue-100 hover:border-blue-200
  text-blue-600 hover:text-blue-700
  hover:from-blue-100/80 hover:to-purple-100/80
  hover:shadow-sm
  transition-all duration-300
`;

// Add cancel button style with red text
const cancelButtonStyles = `
  bg-gradient-to-r from-red-50/70 to-pink-50/70
  border-red-100 hover:border-red-200
  text-red-600 hover:text-red-700
  hover:from-red-100/80 hover:to-pink-100/80
  hover:shadow-sm
  transition-all duration-300
`;

// Add styles for selected items
const selectedItemStyles = `
  bg-gradient-to-r from-blue-100/90 to-purple-100/90
  text-blue-700
  border-blue-200
  font-medium
`;

// Add modern input styles
const inputStyles = `
  focus:border-blue-300 
  focus:ring-blue-200/50
  transition-all duration-300
  bg-white/80
  backdrop-filter backdrop-blur-sm
  hover:bg-white
  focus:bg-white
`;

// Add subtle animations
const animations = {
  fadeIn: `animate-[fadeIn_0.3s_ease-in-out]`,
  scaleIn: `animate-[scaleIn_0.3s_ease-in-out]`,
  slideIn: `animate-[slideInBottom_0.3s_ease-in-out]`,
};

const CreateProjectDialog = ({ 
  open, 
  onOpenChange, 
  onCreateProject,
  isSubmitting = false
}: CreateProjectDialogProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplateType | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectPriority, setProjectPriority] = useState<ProjectPriority>('MEDIUM');
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('NOT_STARTED');
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
        setProjectPriority('MEDIUM');
        setProjectStatus('NOT_STARTED');
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
      <DialogContent 
        className={cn(
          "sm:max-w-[550px] border-0 shadow-2xl bg-gradient-to-b from-white via-white to-blue-50/50 overflow-hidden",
          "backdrop-blur-lg animate-fadeIn transition-all duration-300"
        )}
        style={{
          boxShadow: "0 10px 30px -5px rgba(79, 70, 229, 0.1), 0 0 20px -5px rgba(79, 70, 229, 0.1)",
          borderRadius: "0.75rem"
        }}
      >
        {/* Decorative gradient elements */}
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500 opacity-80"></div>
        <div className="absolute top-0 left-0 w-16 h-16 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-500/20 blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-gradient-to-r from-teal-400/20 to-emerald-500/20 blur-2xl translate-x-1/2 translate-y-1/2"></div>
        
        <DialogHeader className="relative z-10 border-b border-blue-100/50 pb-4 mb-2">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg mr-3 shadow-inner">
              <PlusCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Create New Project</DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                Fill out the project details and select an approach to get started.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-5 py-4 relative z-10">
          <div className="space-y-2 animate-fadeIn" style={{ animationDelay: "50ms" }}>
            <Label htmlFor="project-name" className="required-field font-medium text-gray-700">Project Name</Label>
            <Input 
              id="project-name" 
              placeholder="Enter project name" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isSubmitting}
              className={cn(
                inputStyles,
                "border-blue-100 rounded-md shadow-sm"
              )}
            />
          </div>

          <div className="space-y-2 animate-fadeIn" style={{ animationDelay: "100ms" }}>
            <Label htmlFor="project-description" className="required-field font-medium text-gray-700">Project Description</Label>
            <Textarea 
              id="project-description" 
              placeholder="Describe your project" 
              rows={3}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              disabled={isSubmitting}
              className={cn(
                inputStyles,
                "border-blue-100 rounded-md shadow-sm resize-none"
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 animate-fadeIn" style={{ animationDelay: "150ms" }}>
              <Label htmlFor="project-priority" className="font-medium text-gray-700">Priority</Label>
              <Select 
                value={projectPriority} 
                onValueChange={(value) => setProjectPriority(value as ProjectPriority)}
                disabled={isSubmitting}
              >
                <SelectTrigger className={cn(selectButtonStyles, "rounded-md shadow-sm")}>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-blue-100 shadow-md rounded-md">
                  <SelectItem value="LOW" className={`cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 hover:text-blue-700 ${projectPriority === 'LOW' ? selectedItemStyles : ""}`}>Low</SelectItem>
                  <SelectItem value="MEDIUM" className={`cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 hover:text-blue-700 ${projectPriority === 'MEDIUM' ? selectedItemStyles : ""}`}>Medium</SelectItem>
                  <SelectItem value="HIGH" className={`cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 hover:text-blue-700 ${projectPriority === 'HIGH' ? selectedItemStyles : ""}`}>High</SelectItem>
                  <SelectItem value="CRITICAL" className={`cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 hover:text-blue-700 ${projectPriority === 'CRITICAL' ? selectedItemStyles : ""}`}>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 animate-fadeIn" style={{ animationDelay: "200ms" }}>
              <Label htmlFor="project-status" className="font-medium text-gray-700">Status</Label>
              <Select 
                value={projectStatus} 
                onValueChange={(value) => setProjectStatus(value as ProjectStatus)}
                disabled={isSubmitting}
              >
                <SelectTrigger className={cn(selectButtonStyles, "rounded-md shadow-sm")}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-blue-100 shadow-md rounded-md">
                  <SelectItem value="NOT_STARTED" className={`cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 hover:text-blue-700 ${projectStatus === 'NOT_STARTED' ? selectedItemStyles : ""}`}>Not Started</SelectItem>
                  <SelectItem value="PLANNED" className={`cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 hover:text-blue-700 ${projectStatus === 'PLANNED' ? selectedItemStyles : ""}`}>Planned</SelectItem>
                  <SelectItem value="IN_PROGRESS" className={`cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 hover:text-blue-700 ${projectStatus === 'IN_PROGRESS' ? selectedItemStyles : ""}`}>In Progress</SelectItem>
                  <SelectItem value="COMPLETED" className={`cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 hover:text-blue-700 ${projectStatus === 'COMPLETED' ? selectedItemStyles : ""}`}>Completed</SelectItem>
                  <SelectItem value="ON_HOLD" className={`cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 hover:text-blue-700 ${projectStatus === 'ON_HOLD' ? selectedItemStyles : ""}`}>On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 animate-fadeIn" style={{ animationDelay: "250ms" }}>
              <Label htmlFor="project-due-date" className="font-medium text-gray-700">Due Date</Label>
              <Input 
                id="project-due-date" 
                type="date" 
                value={projectDueDate}
                onChange={(e) => setProjectDueDate(e.target.value)}
                disabled={isSubmitting}
                className={cn(
                  inputStyles,
                  "border-blue-100 rounded-md shadow-sm"
                )}
              />
            </div>
            <div className="space-y-2 animate-fadeIn" style={{ animationDelay: "300ms" }}>
              <Label htmlFor="project-domain" className="font-medium text-gray-700">Domain/URL (Optional)</Label>
              <Input 
                id="project-domain" 
                placeholder="e.g. example.com" 
                value={projectDomain}
                onChange={(e) => setProjectDomain(e.target.value)}
                disabled={isSubmitting}
                className={cn(
                  inputStyles,
                  "border-blue-100 rounded-md shadow-sm"
                )}
              />
            </div>
          </div>

          <div className="space-y-2 animate-fadeIn" style={{ animationDelay: "350ms" }}>
            <Label htmlFor="project-approach" className="required-field font-medium text-gray-700">Project Approach</Label>
            <ProjectTemplateSelector
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleTemplateSelect}
              onFileImport={handleFileImport}
              disabled={isSubmitting}
              customStyles={selectButtonStyles}
              selectedItemStyles={selectedItemStyles}
            />
          </div>
          
          {selectedTemplate === 'AI Assisted' && (
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-4 rounded-lg border border-blue-100/50 shadow-sm flex gap-3 text-sm animate-fadeIn">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-1.5 h-fit rounded-md shadow-inner">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">AI Assisted Design</p>
                <p className="text-blue-700 mt-1">
                  Use natural language to describe your project and our AI will design a custom security architecture.
                </p>
              </div>
            </div>
          )}

          {importedFileName && (
            <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 p-4 rounded-lg border border-green-100/50 shadow-sm text-sm animate-fadeIn">
              <p className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-emerald-700">File selected: {importedFileName}</p>
            </div>
          )}
        </div>

        <DialogFooter className="relative z-10 border-t border-blue-100/50 pt-4 mt-2 gap-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className={cn(
              cancelButtonStyles,
              "rounded-md shadow-sm"
            )}
          >
            Cancel
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:shadow-xl transition-all duration-300 shadow-md rounded-md"
            onClick={handleStartProject}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Project...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;