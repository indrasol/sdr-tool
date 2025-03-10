import { useState } from 'react';
import { Cpu, FileUp, Puzzle, ChevronDown, Check } from 'lucide-react';
import { ProjectTemplateType } from '@/types/projectTypes';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
import { Button } from '@/components/ui/button';

interface ProjectTemplateSelectorProps {
  selectedTemplate: ProjectTemplateType | null;
  onSelectTemplate: (template: ProjectTemplateType) => void;
  onFileImport?: (fileName: string) => void;
  disabled?: boolean;
}

const ProjectTemplateSelector = ({
  selectedTemplate,
  onSelectTemplate,
  onFileImport,
  disabled = false
}: ProjectTemplateSelectorProps) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const { toast } = useToast();

  const handleTemplateSelect = (template: ProjectTemplateType) => {
    onSelectTemplate(template);
    
    if (template === 'Import Existing') {
      setUploadDialogOpen(true);
    } else if (template === 'AI Assisted') {
      toast({
        title: "AI Designer Selected",
        description: "The AI-assisted project designer would open here.",
      });
    } else if (template === 'Solutions Hub') {
      toast({
        title: "Solutions Hub Selected",
        description: "The solutions library would open here.",
      });
    }
  };

  const handleFileUpload = () => {
    if (!selectedFileName) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive"
      });
      return;
    }

    if (onFileImport) {
      onFileImport(selectedFileName);
    }
    
    toast({
      title: "Project Imported",
      description: `File "${selectedFileName}" has been successfully imported.`,
    });
    setUploadDialogOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFileName(e.target.files[0].name);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <Button variant="outline" className="w-full justify-between" disabled={disabled}>
            <div className="flex items-center gap-2">
              {selectedTemplate ? (
                <>
                  {selectedTemplate === 'AI Assisted' && <Cpu className="h-4 w-4" />}
                  {selectedTemplate === 'Import Existing' && <FileUp className="h-4 w-4" />}
                  {selectedTemplate === 'Solutions Hub' && <Puzzle className="h-4 w-4" />}
                  <span>{selectedTemplate}</span>
                </>
              ) : (
                <span>Select Project Approach</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px] bg-white">
          <DropdownMenuItem 
            className="flex items-center gap-2"
            onClick={() => handleTemplateSelect('AI Assisted')}
          >
            <Cpu className="h-4 w-4" />
            <span>AI Assisted</span>
            {selectedTemplate === 'AI Assisted' && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="flex items-center gap-2"
            onClick={() => handleTemplateSelect('Import Existing')}
          >
            <FileUp className="h-4 w-4" />
            <span>Import Existing</span>
            {selectedTemplate === 'Import Existing' && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="flex items-center gap-2"
            onClick={() => handleTemplateSelect('Solutions Hub')}
          >
            <Puzzle className="h-4 w-4" />
            <span>Solutions Hub</span>
            {selectedTemplate === 'Solutions Hub' && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Existing Project</DialogTitle>
            <DialogDescription>
              Upload a project file or configuration to import an existing project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-file">Project File</Label>
              <Input id="project-file" type="file" onChange={handleFileChange} disabled={disabled} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name (Optional)</Label>
              <Input id="project-name" placeholder="Enter a name for the imported project" disabled={disabled} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={disabled}>
              Cancel
            </Button>
            <Button 
              onClick={handleFileUpload} 
              className="bg-securetrack-purple hover:bg-securetrack-darkpurple"
              disabled={disabled}
            >
              Upload & Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectTemplateSelector;


// import { useState } from 'react';
// import { Check, ChevronDown, Cpu, FileUp, Puzzle } from 'lucide-react';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
//   DropdownMenuSeparator,
// } from "@/components/ui/dropdown-menu";
// import { 
//   Dialog, 
//   DialogContent, 
//   DialogHeader, 
//   DialogTitle, 
//   DialogDescription,
//   DialogFooter 
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import type { ProjectTemplateType } from '../../types/projectTypes';

// interface ProjectTemplateSelectorProps {
//   selectedTemplate: ProjectTemplateType | null;
//   onSelectTemplate: (template: ProjectTemplateType) => void;
//   onFileImport?: (fileName: string) => void;
// }

// const ProjectTemplateSelector = ({
//   selectedTemplate,
//   onSelectTemplate,
//   onFileImport
// }: ProjectTemplateSelectorProps) => {
//   const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
//   const [selectedFileName, setSelectedFileName] = useState('');
//   const { toast } = useToast();

//   const handleTemplateSelect = (template: ProjectTemplateType) => {
//     onSelectTemplate(template);
    
//     if (template === 'Import Existing') {
//       setUploadDialogOpen(true);
//     } else if (template === 'AI Assisted') {
//       toast({
//         title: "AI Designer Selected",
//         description: "The AI-assisted project designer would open here.",
//       });
//     } else if (template === 'Solutions Hub') {
//       toast({
//         title: "Solutions Hub Selected",
//         description: "The solutions library would open here.",
//       });
//     }
//   };

//   const handleFileUpload = () => {
//     if (!selectedFileName) {
//       toast({
//         title: "No File Selected",
//         description: "Please select a file to upload.",
//         variant: "destructive"
//       });
//       return;
//     }

//     if (onFileImport) {
//       onFileImport(selectedFileName);
//     }
    
//     toast({
//       title: "Project Imported",
//       description: `File "${selectedFileName}" has been successfully imported.`,
//     });
//     setUploadDialogOpen(false);
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       setSelectedFileName(e.target.files[0].name);
//     }
//   };

//   return (
//     <>
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button variant="outline" className="w-full justify-between">
//             <div className="flex items-center gap-2">
//               {selectedTemplate ? (
//                 <>
//                   {selectedTemplate === 'AI Assisted' && <Cpu className="h-4 w-4" />}
//                   {selectedTemplate === 'Import Existing' && <FileUp className="h-4 w-4" />}
//                   {selectedTemplate === 'Solutions Hub' && <Puzzle className="h-4 w-4" />}
//                   <span>{selectedTemplate}</span>
//                 </>
//               ) : (
//                 <span>Select Project Approach</span>
//               )}
//             </div>
//             <ChevronDown className="h-4 w-4 opacity-50" />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent align="end" className="w-[200px] bg-white">
//           <DropdownMenuItem 
//             className="flex items-center gap-2"
//             onClick={() => handleTemplateSelect('AI Assisted')}
//           >
//             <Cpu className="h-4 w-4" />
//             <span>AI Assisted</span>
//             {selectedTemplate === 'AI Assisted' && <Check className="h-4 w-4 ml-auto" />}
//           </DropdownMenuItem>
          
//           <DropdownMenuSeparator />
          
//           <DropdownMenuItem 
//             className="flex items-center gap-2"
//             onClick={() => handleTemplateSelect('Import Existing')}
//           >
//             <FileUp className="h-4 w-4" />
//             <span>Import Existing</span>
//             {selectedTemplate === 'Import Existing' && <Check className="h-4 w-4 ml-auto" />}
//           </DropdownMenuItem>
          
//           <DropdownMenuItem 
//             className="flex items-center gap-2"
//             onClick={() => handleTemplateSelect('Solutions Hub')}
//           >
//             <Puzzle className="h-4 w-4" />
//             <span>Solutions Hub</span>
//             {selectedTemplate === 'Solutions Hub' && <Check className="h-4 w-4 ml-auto" />}
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>
      
//       <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Import Existing Project</DialogTitle>
//             <DialogDescription>
//               Upload a project file or configuration to import an existing project.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="grid gap-4 py-4">
//             <div className="space-y-2">
//               <Label htmlFor="project-file">Project File</Label>
//               <Input id="project-file" type="file" onChange={handleFileChange} />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="project-name">Project Name (Optional)</Label>
//               <Input id="project-name" placeholder="Enter a name for the imported project" />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleFileUpload} className="bg-securetrack-purple hover:bg-securetrack-darkpurple">
//               Upload & Import
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };

// export default ProjectTemplateSelector;