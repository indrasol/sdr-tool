
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { X, ArrowLeft, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PriorityDropdown from "@/components/ui/PriorityDropdown";
import StatusDropdown from "@/components/ui/StatusDropdown";
import { 
  Project, 
  CreateProjectPayload, 
  UpdateProjectPayload 
} from "@/interfaces/projectInterfaces";
import { 
  ProjectStatus, 
  ProjectPriority, 
  ProjectTemplateType 
} from "@/types/projectTypes";
import { useProjectCRUD } from "@/components/Projects/ProjectListPage/hooks/useProjectCRUD";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (project: Project) => void;
  onProjectUpdated?: (project: Project) => void;
  project?: Project | null; // Optional prop for editing a project
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onProjectCreated,
  onProjectUpdated,
  project = null,
}: CreateProjectModalProps) {
  const navigate = useNavigate();
  const { 
    handleProjectCreation, 
    updateProject, 
    isSubmitting 
  } = useProjectCRUD();

  // Form state
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<ProjectPriority>("Medium");
  const [status, setStatus] = useState<ProjectStatus>("Not Started");
  const [domain, setDomain] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [templateType, setTemplateType] = useState<ProjectTemplateType>("AI Assisted");
  
  // UI state
  const [error, setError] = useState("");

  // Initialize form with project data when editing
  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
      setPriority(project.priority || "Medium");
      setStatus(project.status || "Not Started");
      setDomain(project.domain || "");
      setDueDate(project.dueDate || "");
      setTemplateType(project.templateType || "AI Assisted");
      // Tags is not directly in our Project interface, but we can handle it separately
      setTags("");
    } else {
      // Reset form for new project
      setName("");
      setDescription("");
      setPriority("Medium");
      setStatus("Not Started");
      setDomain("");
      setDueDate("");
      setTemplateType("AI Assisted");
      setTags("");
    }
  }, [project, open]);

  const handleCreateOrUpdateProject = async () => {
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      setError("");
      
      if (project) {
        // Update existing project
        const updatedProject = await updateProject(
          project.id,
          {
            name,
            description,
            priority,
            status,
            domain,
            dueDate
          }
        );
        
        if (updatedProject && onProjectUpdated) {
          onProjectUpdated(updatedProject);
        }
      } else {
        // Create new project using the CRUD hook
        await handleProjectCreation(
          {
            name,
            description,
            priority,
            status,
            domain,
            dueDate,
            templateType,
            importedFile: undefined
          },
          onOpenChange,
          onProjectCreated
        );
      }
      
      // Close modal is handled by the CRUD functions
    } catch (err) {
      console.error("Error creating/updating project:", err);
      setError(err instanceof Error ? err.message : "Failed to save project");
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!isSubmitting) {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-lg shadow-lg">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-7 w-7"
              onClick={() => handleDialogClose(false)}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{project ? "Edit Project" : "Create Project"}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{project ? "Edit the project details" : "Create New Project Model"}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-3">
          <div className="grid gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Project Name *</label>
              <Input
                placeholder="Project Name.."
                className="h-9 border-gray-300 rounded-md"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1.5 block">Priority</label>
                <div className={isSubmitting ? "opacity-70 pointer-events-none" : ""}>
                  <PriorityDropdown
                    value={priority}
                    onValueChange={(value) => setPriority(value)}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1.5 block">Status</label>
                <div className={isSubmitting ? "opacity-70 pointer-events-none" : ""}>
                  <StatusDropdown
                    value={status}
                    onValueChange={(value) => setStatus(value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1.5 block">Domain (Optional)</label>
                <Input
                  placeholder="e.g. example.com"
                  className="h-9 border-gray-300 rounded-md"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1.5 block">Due Date (Optional)</label>
                <Input
                  type="date"
                  className="h-9 border-gray-300 rounded-md"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Tags (Optional)</label>
              <Input
                placeholder="Enter tags separated by commas"
                className="h-9 border-gray-300 rounded-md"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <textarea
                className="w-full h-[80px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDialogClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleCreateOrUpdateProject}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {project ? "Saving..." : "Creating..."}
                </>
              ) : (
                project ? "Save Changes" : "Create Project"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateProjectModal;