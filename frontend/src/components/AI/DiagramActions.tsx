import React, { useState, useRef } from 'react';
import {
  Copy,
  Clipboard,
  MousePointer,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  MessageSquare,
  Save,
  FileText,
  Maximize2,
  Network,
  LayoutDashboard,
  Check,
  Lock,
  Users,
  Globe,
  Shield,
  Tag,
  ChevronDown,
  X,
  Image,
  Download,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { toast } from "../ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { toPng } from 'html-to-image';

// Add custom button hover styles
const buttonHoverStyles = `
  transition-all duration-200
  hover:bg-gradient-to-r hover:from-blue-100/80 hover:to-purple-100/80 
  hover:text-blue-700 hover:border-blue-200 hover:shadow-sm
`;

// Add custom CSS for filter buttons from ProjectFilters.tsx
const filterButtonStyles = `
  bg-gradient-to-r from-blue-50/70 to-purple-50/70
  border-blue-100 hover:border-blue-200
  text-blue-600 hover:text-blue-700
  hover:from-blue-100/80 hover:to-purple-100/80
  hover:shadow-sm
  transition-all duration-300
`;

type ViewMode = 'AD' | 'DFD';

interface DiagramActionsProps {
  viewMode: ViewMode;
  onSwitchView: (mode: ViewMode) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelect?: () => void;
  onGenerateReport?: () => void;
  onComment?: () => void;
  onToggleDataFlow?: () => void;
  onSave?: () => void;
  projectId?: string;
  diagramRef?: React.RefObject<HTMLDivElement>;
}

const DiagramActions: React.FC<DiagramActionsProps> = ({
  viewMode,
  onSwitchView,
  onZoomIn,
  onZoomOut,
  onFitView,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onSelect,
  onGenerateReport,
  onComment,
  onToggleDataFlow,
  onSave,
  projectId,
  diagramRef
}) => {
  const [copied, setCopied] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    visibility: {
      private: true,
      team: false,
      organization: false,
    }
  });
  const [imageForm, setImageForm] = useState({
    name: '',
    description: ''
  });

  // Define available tags
  const availableTags = [
    "Cloud - AWS",
    "Cloud - Azure", 
    "Cloud - GCP",
    "App"
  ];

  const handleSwitchToAD = () => {
    if (viewMode !== 'AD' && onSwitchView) {
      onSwitchView('AD');
    }
  };

  const handleSwitchToDFD = () => {
    if (viewMode !== 'DFD' && onSwitchView) {
      onSwitchView('DFD');
    }
  };

  const copyProjectId = () => {
    if (!projectId) return;

    navigator.clipboard.writeText(projectId)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy project ID:', err);
      });
  };

  const handleOpenTemplateModal = () => {
    setTemplateForm({
      name: `Architecture Template - ${new Date().toLocaleDateString()}`,
      description: 'Secure architecture design with detailed components and connections.',
      tags: ["Cloud - AWS"],
      visibility: {
        private: true,
        team: false,
        organization: false,
      }
    });
    setIsTemplateModalOpen(true);
  };

  const handleTemplateFormChange = (field: string, value: any) => {
    setTemplateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVisibilityChange = (field: string, checked: boolean) => {
    setTemplateForm(prev => ({
      ...prev,
      visibility: {
        ...prev.visibility,
        [field]: checked
      }
    }));
  };

  const handleSaveTemplate = () => {
    console.log('Saving template:', templateForm);
    
    toast({
      title: "Template Saved",
      description: `"${templateForm.name}" has been saved successfully.`,
      duration: 3000,
    });
    
    setIsTemplateModalOpen(false);
    
    if (onSave) {
      onSave();
    }
  };

  // Add a function to handle tag selection
  const handleTagSelection = (tag: string) => {
    setTemplateForm(prev => {
      const isSelected = prev.tags.includes(tag);
      let newTags: string[];
      
      if (isSelected) {
        // Remove tag if already selected
        newTags = prev.tags.filter(t => t !== tag);
      } else {
        // Add tag if not selected
        newTags = [...prev.tags, tag];
      }
      
      return {
        ...prev,
        tags: newTags
      };
    });
  };

  // Add a function to remove a tag
  const removeTag = (tag: string) => {
    setTemplateForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleOpenImageModal = () => {
    setImageForm({
      name: `Architecture Diagram - ${new Date().toLocaleDateString()}`,
      description: 'Diagram exported as image.',
    });
    setIsImageModalOpen(true);
  };

  const handleImageFormChange = (field: string, value: any) => {
    setImageForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveImage = () => {
    if (!diagramRef || !diagramRef.current) {
      toast({
        title: "Error",
        description: "Could not capture diagram. Please try again.",
        duration: 3000,
      });
      setIsImageModalOpen(false);
      return;
    }
    
    // Configure options for the image capture
    const options = {
      quality: 0.95,
      backgroundColor: '#ffffff',
      skipAutoScale: true,
      pixelRatio: 2, // For better quality on high DPI displays
    };
    
    // Show a loading state
    toast({
      title: "Processing",
      description: "Generating diagram image...",
      duration: 2000,
    });
    
    // Capture the diagram as PNG
    toPng(diagramRef.current, options)
      .then((dataUrl) => {
        // Create a download link
        const link = document.createElement('a');
        link.download = `${imageForm.name || 'architecture-diagram'}.png`;
        link.href = dataUrl;
        link.click();
        
        // Show success message
        toast({
          title: "Image Downloaded",
          description: `"${imageForm.name}" has been saved successfully.`,
          duration: 3000,
        });
        
        setIsImageModalOpen(false);
      })
      .catch((error) => {
        console.error('Error generating diagram image:', error);
        toast({
          title: "Error",
          description: "Failed to generate diagram image. Please try again.",
          duration: 3000,
        });
        setIsImageModalOpen(false);
      });
  };

  return (
    <div className="bg-white border-b border-gray-200 px-3 flex items-center justify-between w-full flex-shrink-0 h-12">
      <TooltipProvider>
        <div className="flex items-center space-x-1">
          {projectId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`flex items-center h-8 px-3 rounded-md border text-sm font-medium cursor-pointer ${filterButtonStyles}`}
                  onClick={copyProjectId}
                >

                  <span className="ml-1 text-blue-700">{projectId}</span>
                  {copied ? (
                    <Check size={14} className="ml-2 text-green-500" />
                  ) : (
                    <Copy size={14} className="ml-2 text-blue-500 opacity-70" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">Click to copy project ID</TooltipContent>
            </Tooltip>
          )}

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${buttonHoverStyles}`}
                onClick={onUndo}
              >
                <Undo size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Undo</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${buttonHoverStyles}`} 
                onClick={onRedo}
              >
                <Redo size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Redo</TooltipContent>
          </Tooltip> */}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${buttonHoverStyles}`}
                onClick={onGenerateReport}
              >
                <FileText size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Generate Report</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${buttonHoverStyles}`}
                onClick={onSave}
              >
                <Save size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Save Diagram</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${buttonHoverStyles}`}
                onClick={onZoomIn}
              >
                <ZoomIn size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom In</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${buttonHoverStyles}`}
                onClick={onZoomOut}
              >
                <ZoomOut size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom Out</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${buttonHoverStyles}`}
                onClick={onFitView}
              >
                <Maximize2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Fit View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${buttonHoverStyles}`}
                onClick={onComment}
              >
                <MessageSquare size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Add Sticky Note</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* AD Button */}

          {/* <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 px-2 border-securetrack-purple/50 text-securetrack-purple ${buttonHoverStyles} ${viewMode === 'AD' ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' : ''
                  }`}
                onClick={handleSwitchToAD}
              >
                <span className="text-xs font-medium">AD</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Switch to Architecture Diagram</TooltipContent>
          </Tooltip> */}

          {/* DFD Button */}
          {/* 
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm" // Adjusted size
                className={`h-8 px-2 border-securetrack-purple/50 text-securetrack-purple ${buttonHoverStyles} ${
                  viewMode === 'DFD' ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' : ''
                }`}
                onClick={handleSwitchToDFD}
              >
                 <span className="text-xs font-medium">DFD</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Switch to Data Flow Diagram</TooltipContent>
          </Tooltip>
          */}

        </div>

        <div className="flex items-center space-x-1">

          {/* Save as Template Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 text-sm whitespace-nowrap px-2 sm:px-3 ${filterButtonStyles}`}
                onClick={handleOpenTemplateModal}
              >
                <Save size={16} className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="font-medium">Save as Template</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Save as Template</TooltipContent>
          </Tooltip>

          {/* Save as Image Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 text-sm whitespace-nowrap px-2 sm:px-3 ${filterButtonStyles}`}
                onClick={handleOpenImageModal}
              >
                <Image size={16} className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="font-medium">Save as Image</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Save as Image</TooltipContent>
          </Tooltip>

        </div>
      </TooltipProvider>

      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-lg bg-gradient-to-r from-white to-blue-50/30 rounded-lg border border-blue-100/50 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1.5 rounded-md shadow-sm">
                <Shield className="h-4 w-4 text-white" />
              </div>
              Save as Template
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Create a reusable template from your current diagram. Templates can be shared with your team or organization.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label htmlFor="template-name" className="text-gray-700 font-medium">Template Name</Label>
              <Input 
                id="template-name"
                className="border-blue-200 focus:border-blue-400 focus:ring-blue-300/40 bg-white/70"
                value={templateForm.name}
                onChange={(e) => handleTemplateFormChange('name', e.target.value)}
                placeholder="Enter a descriptive name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="template-description" className="text-gray-700 font-medium">Description</Label>
              <Textarea 
                id="template-description"
                className="min-h-[80px] border-blue-200 focus:border-blue-400 focus:ring-blue-300/40 bg-white/70"
                value={templateForm.description}
                onChange={(e) => handleTemplateFormChange('description', e.target.value)}
                placeholder="Describe what this template is used for"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="template-tags" className="text-gray-700 font-medium flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-blue-500" />
                Tags
              </Label>
              
              <div className="flex flex-col gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between border-blue-200 hover:border-blue-300 focus:ring-blue-300/40 bg-white/70 text-left font-normal"
                    >
                      <span className="text-gray-700">Select tags</span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full min-w-[200px] bg-white border border-blue-100 p-1">
                    <DropdownMenuGroup>
                      {availableTags.map(tag => (
                        <DropdownMenuCheckboxItem
                          key={tag}
                          checked={templateForm.tags.includes(tag)}
                          onCheckedChange={() => handleTagSelection(tag)}
                          className="cursor-pointer focus:bg-blue-50 focus:text-blue-800"
                        >
                          {tag}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Display selected tags */}
                {templateForm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {templateForm.tags.map(tag => (
                      <Badge 
                        key={tag} 
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 font-medium py-1 px-2 flex items-center"
                      >
                        {tag}
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer text-blue-600 hover:text-blue-800" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid gap-2 pt-2">
              <Label className="text-gray-700 font-medium">Visibility</Label>
              <div className="flex flex-col gap-3 mt-1">
                <div className="flex items-center gap-2 bg-blue-50/50 hover:bg-blue-50/80 p-2 rounded-md transition-colors duration-200">
                  <Checkbox 
                    id="visibility-private" 
                    checked={templateForm.visibility.private}
                    onCheckedChange={(checked) => handleVisibilityChange('private', checked as boolean)}
                    className="border-blue-300 data-[state=checked]:bg-blue-600"
                  />
                  <label 
                    htmlFor="visibility-private" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                  >
                    <div className="bg-blue-100 p-1.5 rounded-full">
                      <Lock className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div>
                      <span className="block font-medium text-blue-800">Private</span>
                      <span className="block text-xs text-blue-600/80 mt-0.5">Only visible to you</span>
                    </div>
                  </label>
                </div>
                
                <div className="flex items-center gap-2 bg-blue-50/50 hover:bg-blue-50/80 p-2 rounded-md transition-colors duration-200">
                  <Checkbox 
                    id="visibility-team" 
                    checked={templateForm.visibility.team}
                    onCheckedChange={(checked) => handleVisibilityChange('team', checked as boolean)}
                    className="border-blue-300 data-[state=checked]:bg-blue-600"
                  />
                  <label 
                    htmlFor="visibility-team" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                  >
                    <div className="bg-blue-100 p-1.5 rounded-full">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div>
                      <span className="block font-medium text-blue-800">Team</span>
                      <span className="block text-xs text-blue-600/80 mt-0.5">Visible to members of your team</span>
                    </div>
                  </label>
                </div>
                
                <div className="flex items-center gap-2 bg-blue-50/50 hover:bg-blue-50/80 p-2 rounded-md transition-colors duration-200">
                  <Checkbox 
                    id="visibility-organization" 
                    checked={templateForm.visibility.organization}
                    onCheckedChange={(checked) => handleVisibilityChange('organization', checked as boolean)}
                    className="border-blue-300 data-[state=checked]:bg-blue-600"
                  />
                  <label 
                    htmlFor="visibility-organization" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                  >
                    <div className="bg-blue-100 p-1.5 rounded-full">
                      <Globe className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div>
                      <span className="block font-medium text-blue-800">Organization</span>
                      <span className="block text-xs text-blue-600/80 mt-0.5">Visible to everyone in your organization</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsTemplateModalOpen(false)}
              className="border-gray-200 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-200"
            >
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save as Image Dialog */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-lg bg-gradient-to-r from-white to-blue-50/30 rounded-lg border border-blue-100/50 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1.5 rounded-md shadow-sm">
                <Image className="h-4 w-4 text-white" />
              </div>
              Save as Image
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Export your diagram as an image file that you can share or embed in documents.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label htmlFor="image-name" className="text-gray-700 font-medium">Image Name</Label>
              <Input 
                id="image-name"
                className="border-blue-200 focus:border-blue-400 focus:ring-blue-300/40 bg-white/70"
                value={imageForm.name}
                onChange={(e) => handleImageFormChange('name', e.target.value)}
                placeholder="Enter a name for your image"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="image-description" className="text-gray-700 font-medium">Description</Label>
              <Textarea 
                id="image-description"
                className="min-h-[80px] border-blue-200 focus:border-blue-400 focus:ring-blue-300/40 bg-white/70"
                value={imageForm.description}
                onChange={(e) => handleImageFormChange('description', e.target.value)}
                placeholder="Add notes about this diagram image"
              />
            </div>
          </div>
          
          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsImageModalOpen(false)}
              className="border-gray-200 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveImage}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-200 flex items-center gap-2"
            >
              <Download size={16} />
              Download Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiagramActions;