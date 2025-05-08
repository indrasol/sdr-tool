import { useState } from 'react';
import { Cpu, FileUp, ChevronDown, Check } from 'lucide-react';
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
  customStyles?: string;
  selectedItemStyles?: string;
}

const ProjectTemplateSelector = ({
  selectedTemplate,
  onSelectTemplate,
  onFileImport,
  disabled = false,
  customStyles = '',
  selectedItemStyles = ''
}: ProjectTemplateSelectorProps) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const { toast } = useToast();

  const handleTemplateSelect = (template: ProjectTemplateType) => {
    onSelectTemplate(template);
    
    if (template === 'Import Existing') {
      setUploadDialogOpen(true);
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
          <Button 
            variant="outline" 
            className={`w-full justify-between ${customStyles}`} 
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              {selectedTemplate ? (
                <>
                  {selectedTemplate === 'AI Assisted' && <Cpu className="h-4 w-4" />}
                  {selectedTemplate === 'Import Existing' && <FileUp className="h-4 w-4" />}
                  <span>{selectedTemplate}</span>
                </>
              ) : (
                <span>Select Project Approach</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px] bg-white border border-blue-100 shadow-md">
          <DropdownMenuItem 
            className={`flex items-center gap-2 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 hover:text-blue-700 ${selectedTemplate === 'AI Assisted' ? selectedItemStyles : ''}`}
            onClick={() => handleTemplateSelect('AI Assisted')}
          >
            <Cpu className="h-4 w-4" />
            <span>AI Assisted</span>
            {selectedTemplate === 'AI Assisted' && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-blue-100/50" />
          
          <DropdownMenuItem 
            className={`flex items-center gap-2 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 hover:text-blue-700 ${selectedTemplate === 'Import Existing' ? selectedItemStyles : ''}`}
            onClick={() => handleTemplateSelect('Import Existing')}
          >
            <FileUp className="h-4 w-4" />
            <span>Import Existing</span>
            {selectedTemplate === 'Import Existing' && <Check className="h-4 w-4 ml-auto" />}
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
            <Button 
              variant="outline" 
              onClick={() => setUploadDialogOpen(false)} 
              disabled={disabled}
              className="bg-gradient-to-r from-red-50/70 to-pink-50/70 border-red-100 hover:border-red-200 text-red-600 hover:text-red-700 hover:from-red-100/80 hover:to-pink-100/80 hover:shadow-sm transition-all duration-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFileUpload} 
              className="bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:shadow-xl transition-all duration-300 shadow-md"
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