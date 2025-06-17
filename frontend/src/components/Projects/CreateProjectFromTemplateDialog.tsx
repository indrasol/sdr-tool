import { useEffect, useState } from 'react';
import { PlusCircle, Loader2, FileText, Eye } from 'lucide-react';
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
import { OrgTemplate } from '@/hooks/useOrgTemplates';

interface CreateProjectFromTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: OrgTemplate | null;
  onCreateProject: (projectData: {
    name: string;
    description: string;
    priority: ProjectPriority;
    status: ProjectStatus;
    domain?: string;
    dueDate?: string;
    creator: string;
    templateType: 'From Template';
    templateId?: string;
    tags?: string[];
    diagramState?: any;
  }) => void;
  isSubmitting?: boolean;
}

// Style constants
const inputStyles = `
  bg-white/90 border-blue-200 focus:border-blue-400 focus:ring-blue-300/40
  transition-all duration-200 hover:border-blue-300
`;

const selectButtonStyles = `
  bg-white/90 border-blue-200 hover:border-blue-300 focus:border-blue-400 
  transition-all duration-200 text-gray-800
`;

const selectedItemStyles = `
  bg-gradient-to-r from-blue-100/80 to-purple-100/80 text-blue-700 border-blue-200/50
`;

const cancelButtonStyles = `
  border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300
  transition-all duration-200
`;

const CreateProjectFromTemplateDialog = ({ 
  open, 
  onOpenChange, 
  template,
  onCreateProject,
  isSubmitting = false
}: CreateProjectFromTemplateDialogProps) => {
  const [projectName, setProjectName] = useState('');
  const [projectTags, setProjectTags] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectPriority, setProjectPriority] = useState<ProjectPriority>('MEDIUM');
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('NOT_STARTED');
  const [projectDueDate, setProjectDueDate] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  // Auto-populate form when template changes
  useEffect(() => {
    if (template) {
      setProjectName(`${template.title} - Project`);
      setProjectDescription(template.description || '');
      setProjectTags(template.tags ? template.tags.join(', ') : '');
    }
  }, [template]);

  // Handle dialog open/close
  const handleDialogOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      // Reset form on close
      setTimeout(() => {
        setProjectName('');
        setProjectTags('');
        setProjectDescription('');
        setProjectPriority('MEDIUM');
        setProjectStatus('NOT_STARTED');
        setProjectDueDate('');
      }, 300);
    }
    
    if (!isSubmitting) {
      onOpenChange(open);
    }
  };

  // Validate and format tags
  const validateTags = (tagsString: string): string[] => {
    if (!tagsString.trim()) return [];
    
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    const validTags: string[] = [];
    
    for (const tag of tags) {
      // Only allow alphanumeric characters and underscores
      if (/^[a-zA-Z0-9_]+$/.test(tag)) {
        validTags.push(tag);
      }
    }
    
    return validTags;
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProjectTags(value);
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

    if (!template) {
      toast({
        title: "Template Required",
        description: "No template selected",
        variant: "destructive"
      });
      return;
    }

    if (!template.template_id) {
      toast({
        title: "Invalid Template",
        description: "Template ID is missing or invalid",
        variant: "destructive"
      });
      return;
    }
    console.log(template.template_id);

    if (!projectName || !projectDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate tags
    const validatedTags = validateTags(projectTags);
    const invalidTags = projectTags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && !/^[a-zA-Z0-9_]+$/.test(tag));

    if (invalidTags.length > 0) {
      toast({
        title: "Invalid Tags",
        description: `Tags can only contain letters, numbers, and underscores. Invalid tags: ${invalidTags.join(', ')}`,
        variant: "destructive"
      });
      return;
    }
    
    onCreateProject({
      name: projectName,
      description: projectDescription,
      priority: projectPriority,
      status: projectStatus,
      dueDate: projectDueDate || undefined,
      creator: user.username || user.email || 'Unknown User',
      templateType: 'From Template',
      templateId: template.template_id,
      tags: validatedTags.length > 0 ? validatedTags : undefined,
      diagramState: template.diagramState
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent 
        className={cn(
          "sm:max-w-[550px] border-0 shadow-2xl bg-gradient-to-b from-white via-white to-purple-50/50 overflow-hidden",
          "backdrop-blur-lg animate-fadeIn transition-all duration-300"
        )}
        style={{
          boxShadow: "0 10px 30px -5px rgba(147, 51, 234, 0.1), 0 0 20px -5px rgba(147, 51, 234, 0.1)",
          borderRadius: "0.75rem"
        }}
      >
        {/* Decorative gradient elements */}
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-purple-400 to-blue-500 opacity-80"></div>
        <div className="absolute top-0 left-0 w-16 h-16 rounded-full bg-gradient-to-r from-purple-400/20 to-blue-500/20 blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-gradient-to-r from-purple-400/20 to-blue-500/20 blur-2xl translate-x-1/2 translate-y-1/2"></div>
        
        <DialogHeader className="relative z-10 border-b border-purple-100/50 pb-4 mb-2">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-2 rounded-lg mr-3 shadow-inner">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">Create Project from Template</DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                {template ? `Using template: "${template.title}"` : 'No template selected'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Template Preview */}
        {template && template.diagramImage && (
          <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 p-4 rounded-lg border border-purple-100/50 shadow-sm animate-fadeIn mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-1.5 h-fit rounded-md shadow-inner">
                <Eye className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-blue-700">Template Preview</p>
                <p className="text-purple-700 text-sm mt-1">
                  This diagram will be imported into your new project
                </p>
              </div>
            </div>
            <div className="bg-white/70 rounded-md p-2 border border-purple-200/50">
              <img 
                src={template.diagramImage} 
                alt="Template diagram preview" 
                className="w-full h-32 object-contain rounded-sm"
              />
            </div>
          </div>
        )}

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
                "border-purple-100 rounded-md shadow-sm"
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
                "border-purple-100 rounded-md shadow-sm resize-none"
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 animate-fadeIn" style={{ animationDelay: "150ms" }}>
              <Label htmlFor="project-priority" className="font-medium text-gray-700">Priority</Label>
              <Select value={projectPriority} onValueChange={(value: ProjectPriority) => setProjectPriority(value)} disabled={isSubmitting}>
                <SelectTrigger className={cn(selectButtonStyles, "border-purple-100 rounded-md shadow-sm")}>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-purple-100 shadow-lg rounded-md">
                  <SelectItem value="LOW" className="hover:bg-gradient-to-r hover:from-purple-50/70 hover:to-blue-50/70">Low</SelectItem>
                  <SelectItem value="MEDIUM" className="hover:bg-gradient-to-r hover:from-purple-50/70 hover:to-blue-50/70">Medium</SelectItem>
                  <SelectItem value="HIGH" className="hover:bg-gradient-to-r hover:from-purple-50/70 hover:to-blue-50/70">High</SelectItem>
                  <SelectItem value="CRITICAL" className="hover:bg-gradient-to-r hover:from-purple-50/70 hover:to-blue-50/70">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 animate-fadeIn" style={{ animationDelay: "200ms" }}>
              <Label htmlFor="project-status" className="font-medium text-gray-700">Status</Label>
              <Select value={projectStatus} onValueChange={(value: ProjectStatus) => setProjectStatus(value)} disabled={isSubmitting}>
                <SelectTrigger className={cn(selectButtonStyles, "border-purple-100 rounded-md shadow-sm")}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-purple-100 shadow-lg rounded-md">
                  <SelectItem value="NOT_STARTED" className="hover:bg-gradient-to-r hover:from-purple-50/70 hover:to-blue-50/70">Not Started</SelectItem>
                  <SelectItem value="IN_PROGRESS" className="hover:bg-gradient-to-r hover:from-purple-50/70 hover:to-blue-50/70">In Progress</SelectItem>
                  <SelectItem value="COMPLETED" className="hover:bg-gradient-to-r hover:from-purple-50/70 hover:to-blue-50/70">Completed</SelectItem>
                  <SelectItem value="ON_HOLD" className="hover:bg-gradient-to-r hover:from-purple-50/70 hover:to-blue-50/70">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 animate-fadeIn" style={{ animationDelay: "250ms" }}>
              <Label htmlFor="project-tags" className="font-medium text-gray-700">Tags (comma-separated)</Label>
              <Input 
                id="project-tags" 
                placeholder="web, security, frontend" 
                value={projectTags}
                onChange={handleTagsChange}
                disabled={isSubmitting}
                className={cn(
                  inputStyles,
                  "border-purple-100 rounded-md shadow-sm"
                )}
              />
            </div>

            <div className="space-y-2 animate-fadeIn" style={{ animationDelay: "300ms" }}>
              <Label htmlFor="project-due-date" className="font-medium text-gray-700">Due Date (optional)</Label>
              <Input 
                id="project-due-date" 
                type="date" 
                value={projectDueDate}
                onChange={(e) => setProjectDueDate(e.target.value)}
                disabled={isSubmitting}
                className={cn(
                  inputStyles,
                  "border-purple-100 rounded-md shadow-sm"
                )}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="relative z-10 border-t border-purple-100/50 pt-4 mt-2 gap-4">
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
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-xl transition-all duration-300 shadow-md rounded-md"
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

export default CreateProjectFromTemplateDialog; 