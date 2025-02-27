import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { X, ArrowLeft } from "lucide-react";
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

interface ProjectModal {
  id: string;
  name: string;
  status: string;
  user: string;
  modified: string;
  created: string;
  priority: string;
  modelType: string;
  tags?: string; 
  description?: string; 
}

interface ProjectModal {
  id: string;
  name: string;
  status: string;
  user: string;
  modified: string;
  created: string;
  priority: string;
  modelType: string;
  tags?: string; 
  description?: string; 
}

interface CreateProjectModalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addProject: (project: ProjectModal) => void;
  project?: ProjectModal | null; // Optional prop for editing a project
  onSave?: (project: ProjectModal) => void; // Optional prop for saving edited project
}

export function CreateProjectModal({
  open,
  onOpenChange,
  addProject,
  project = null,
  onSave,
}: CreateProjectModalDialogProps) {
  const navigate = useNavigate(); // Initialize useNavigate

  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"0-None" | "1-High" | "2-Medium" | "3-Low">("0-None");
  const [status, setStatus] = useState<"None" | "Started" | "In Progress" | "Completed">("None");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name);
      setTags(project.tags || "");
      setDescription(project.description || "");
      setPriority(project.priority as "0-None" | "1-High" | "2-Medium" | "3-Low");
      setStatus(project.status as "None" | "Started" | "In Progress" | "Completed");
    }
  }, [project]);


  const handleCreateProject = async () => {
    try {
      setIsSubmitting(true);
      setError("");
      
      // Prepare payload for API
      const payload = {
        name,
        description,
        priority,
        status,
        user: project ? project.user : "Current User", // Replace with actual user
        tags,
        modelType: project ? project.modelType : "Model With AI", // Default model type
      };
      
      // Send data to API
      // const response = await fetch('http://localhost:8000/v1/routes/projects', {
      //   method: project ? 'PUT' : 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(payload),
      // });
      
      // if (!response.ok) {
      //   throw new Error(`API error: ${response.status}`);
      // }
      
      // Parse the JSON response
      // const responseData = await response.json();
      
      // Create project object with API response data
      // const newProject: ProjectModal = {
      //   id: responseData.project_id || (project ? project.id : Date.now().toString()),
      //   name: responseData.name || name,
      //   status: responseData.status || status,
      //   user: responseData.user || (project ? project.user : "Current User"),
      //   modified: new Date().toLocaleDateString(),
      //   created: project ? project.created : new Date().toLocaleDateString(),
      //   priority: responseData.priority || priority,
      //   modelType: project ? project.modelType : "Model With AI",
      //   tags,
      //   description: responseData.description || description,
      // };

      // if (project && onSave) {
      //   onSave(newProject); // Save the edited project
      // } else {
      //   addProject(newProject); // Add the new project to the list
      // }

      onOpenChange(false); // Close the dialog
      navigate("/project-list"); // Navigate to project-list page
    } catch (err) {
      console.error("Error creating/updating project:", err);
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-lg shadow-lg">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-7 w-7"
              onClick={() => onOpenChange(false)}
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
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1.5 block">Priority</label>
                <PriorityDropdown
                  value={priority}
                  onValueChange={(value) => setPriority(value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1.5 block">Status</label>
                <StatusDropdown
                  value={status}
                  onValueChange={(value) => setStatus(value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Tags</label>
              <Input
                placeholder="Search tags"
                className="h-9 border-gray-300 rounded-md"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <textarea
                className="w-full h-[80px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateProject}>{project ? "Save Changes" : "Create Project"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { CreateProjectModal as CreateProjectModel };

export default CreateProjectModal;