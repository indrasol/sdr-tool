import { useState, useEffect } from 'react';
import { PencilLine, Loader2 } from 'lucide-react';
import { Project } from '@/interfaces/projectInterfaces';
import { useToast } from '@/hooks/use-toast';
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

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
  isSubmitting?: boolean;
}

const EditProjectDialog = ({ 
  open, 
  onOpenChange, 
  project,
  onUpdateProject,
  isSubmitting = false
}: EditProjectDialogProps) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectPriority, setProjectPriority] = useState<ProjectPriority>('Medium');
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('Not Started');
  const [projectDomain, setProjectDomain] = useState('');
  const [projectDueDate, setProjectDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const { toast } = useToast();

  // Update form when project changes
  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description);
      setProjectPriority(project.priority);
      setProjectStatus(project.status);
      setProjectDomain(project.domain || '');
      setProjectDueDate(project.dueDate || '');
      setAssignedTo(project.assignedTo || '');
    }
  }, [project]);

  const handleDialogOpenChange = (open: boolean) => {
    if (!isSubmitting) {
      onOpenChange(open);
    }
  };

  const handleUpdateProject = () => {
    if (!project) return;
    
    if (!projectName || !projectDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }

    // Collect changes
    const updatedData: Partial<Project> = {};
    
    // Only include fields that have changed
    if (projectName !== project.name) updatedData.name = projectName;
    if (projectDescription !== project.description) updatedData.description = projectDescription;
    if (projectPriority !== project.priority) updatedData.priority = projectPriority;
    if (projectStatus !== project.status) updatedData.status = projectStatus;
    if (projectDomain !== (project.domain || '')) updatedData.domain = projectDomain || undefined;
    if (projectDueDate !== (project.dueDate || '')) updatedData.dueDate = projectDueDate || undefined;
    if (assignedTo !== (project.assignedTo || '')) updatedData.assignedTo = assignedTo || undefined;
    
    // Only call API if something changed
    if (Object.keys(updatedData).length > 0) {
      onUpdateProject(project.id, updatedData);
    } else {
      toast({
        title: "No Changes",
        description: "No changes were made to the project",
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilLine className="h-5 w-5" />
            Edit Project
          </DialogTitle>
          <DialogDescription>
            Update the project details below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-name" className="required-field">Project Name</Label>
              <Input 
                id="edit-project-name" 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-domain">Domain/URL</Label>
              <Input 
                id="edit-project-domain" 
                placeholder="e.g. example.com"
                value={projectDomain}
                onChange={(e) => setProjectDomain(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-project-description" className="required-field">Project Description</Label>
            <Textarea 
              id="edit-project-description" 
              rows={3}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-status">Status</Label>
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
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-priority">Priority</Label>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-due-date">Due Date</Label>
              <Input 
                id="edit-project-due-date" 
                type="date" 
                value={projectDueDate}
                onChange={(e) => setProjectDueDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-assigned-to">Assigned To</Label>
              <Input 
                id="edit-project-assigned-to" 
                placeholder="e.g. Security Team" 
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
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
            onClick={handleUpdateProject}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Project'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;
// import { useState, useEffect } from 'react';
// import { PencilLine } from 'lucide-react';
// import { Project } from '@/interfaces/projectInterfaces';
// import { useToast } from '@/hooks/use-toast';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Button } from '@/components/ui/button';
// import type { ProjectPriority } from '@/types/projectTypes';

// interface EditProjectDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   project: Project | null;
//   onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
// }

// const EditProjectDialog = ({ 
//   open, 
//   onOpenChange, 
//   project,
//   onUpdateProject
// }: EditProjectDialogProps) => {
//   const [projectName, setProjectName] = useState('');
//   const [projectDescription, setProjectDescription] = useState('');
//   const [projectPriority, setProjectPriority] = useState<ProjectPriority>('Medium');
//   const [projectStatus, setProjectStatus] = useState('');
//   const [projectDomain, setProjectDomain] = useState('');
//   const [projectDueDate, setProjectDueDate] = useState('');
//   const { toast } = useToast();

//   // Update form when project changes
//   useEffect(() => {
//     if (project) {
//       setProjectName(project.name);
//       setProjectDescription(project.description);
//       setProjectPriority(project.priority);
//       setProjectStatus(project.status);
//       setProjectDomain(project.domain || '');
//       setProjectDueDate(project.dueDate || '');
//     }
//   }, [project]);

//   const handleUpdateProject = () => {
//     if (!project) return;
    
//     if (!projectName || !projectDescription) {
//       toast({
//         title: "Missing Information",
//         description: "Please fill out all required fields",
//         variant: "destructive"
//       });
//       return;
//     }

//     onUpdateProject(project.id, {
//       name: projectName,
//       description: projectDescription,
//       priority: projectPriority,
//       status: projectStatus as any,
//       domain: projectDomain || undefined,
//       dueDate: projectDueDate || undefined
//     });
    
//     toast({
//       title: "Project Updated",
//       description: `Project "${projectName}" has been updated`,
//     });
    
//     onOpenChange(false);
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[550px]">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <PencilLine className="h-5 w-5" />
//             Edit Project
//           </DialogTitle>
//           <DialogDescription>
//             Update the project details below.
//           </DialogDescription>
//         </DialogHeader>
        
//         <div className="grid gap-4 py-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="edit-project-name" className="required-field">Project Name</Label>
//               <Input 
//                 id="edit-project-name" 
//                 value={projectName}
//                 onChange={(e) => setProjectName(e.target.value)}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="edit-project-domain">Domain/URL</Label>
//               <Input 
//                 id="edit-project-domain" 
//                 placeholder="e.g. example.com"
//                 value={projectDomain}
//                 onChange={(e) => setProjectDomain(e.target.value)}
//               />
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="edit-project-description" className="required-field">Project Description</Label>
//             <Textarea 
//               id="edit-project-description" 
//               rows={3}
//               value={projectDescription}
//               onChange={(e) => setProjectDescription(e.target.value)}
//             />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="edit-project-status">Status</Label>
//               <Select value={projectStatus} onValueChange={setProjectStatus}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select status" />
//                 </SelectTrigger>
//                 <SelectContent className="bg-white">
//                   <SelectItem value="Not Started">Not Started</SelectItem>
//                   <SelectItem value="Started">Started</SelectItem>
//                   <SelectItem value="In Progress">In Progress</SelectItem>
//                   <SelectItem value="On Hold">On Hold</SelectItem>
//                   <SelectItem value="Completed">Completed</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="edit-project-priority">Priority</Label>
//               <Select value={projectPriority} onValueChange={(value) => setProjectPriority(value as ProjectPriority)}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select priority" />
//                 </SelectTrigger>
//                 <SelectContent className="bg-white">
//                   <SelectItem value="Low">Low</SelectItem>
//                   <SelectItem value="Medium">Medium</SelectItem>
//                   <SelectItem value="High">High</SelectItem>
//                   <SelectItem value="Critical">Critical</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="edit-project-due-date">Due Date</Label>
//             <Input 
//               id="edit-project-due-date" 
//               type="date" 
//               value={projectDueDate}
//               onChange={(e) => setProjectDueDate(e.target.value)}
//             />
//           </div>
//         </div>
        
//         <DialogFooter>
//           <Button variant="outline" onClick={() => onOpenChange(false)}>
//             Cancel
//           </Button>
//           <Button 
//             className="bg-securetrack-purple hover:bg-securetrack-darkpurple" 
//             onClick={handleUpdateProject}
//           >
//             Update Project
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default EditProjectDialog;