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
  Workflow,
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
  LayoutGrid,
  Settings,
  Activity,
  Zap,
  Clock,
  Target,
  RefreshCw,
  Sun,
  Moon,
  AlertTriangle,
  Loader2,
  LayoutTemplate,
  Building,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toPng } from 'html-to-image';
import { useOrgTemplates } from '@/hooks/useOrgTemplates';
import { useAuth } from '@/components/Auth/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import templateApiService from '@/services/templateApiService';
import { captureDiagramImage } from '@/utils/diagramUtils';
import StyleToggle from './components/StyleToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

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
  onToggleFlowchart?: () => void;
  onSave?: () => void;
  projectId?: string;
  diagramRef?: React.RefObject<HTMLDivElement>;
  nodes?: any[]; // Add nodes for diagram state
  edges?: any[]; // Add edges for diagram state
  isDataFlowActive?: boolean;
  isFlowchartActive?: boolean;
  // Threat Analysis props
  onRunThreatAnalysis?: () => void;
  runningThreatAnalysis?: boolean;
  // Layout controls
  onLayout?: (options: {
    direction: 'LR' | 'TB' | 'BT' | 'RL';
    engine: 'auto' | 'elk' | 'dagre' | 'basic';
    enablePerformanceMonitoring: boolean;
  }) => void;
  isLayouting?: boolean;
  lastLayoutResult?: {
    engineUsed: string;
    executionTime: number;
    qualityScore: number;
    success: boolean;
    complexityMetrics?: {
      nodeCount: number;
      edgeCount: number;
      complexityScore: number;
    };
  };
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
  onToggleFlowchart,
  onSave,
  projectId,
  diagramRef,
  nodes = [],
  edges = [],
  isDataFlowActive,
  isFlowchartActive,
  onRunThreatAnalysis,
  runningThreatAnalysis = false,
  onLayout,
  isLayouting,
  lastLayoutResult
}) => {
  const { addOrgTemplate } = useOrgTemplates();
  const { user } = useAuth();
  const { allProjects } = useProjects();
  const { theme, toggleTheme } = useTheme();
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

  // Layout controls state
  const [isLayoutDropdownOpen, setIsLayoutDropdownOpen] = useState(false);
  const [layoutDirection, setLayoutDirection] = useState<'LR' | 'TB' | 'BT' | 'RL'>('LR');
  const [layoutEngine, setLayoutEngine] = useState<'auto' | 'elk' | 'dagre' | 'basic'>('auto');
  const [enablePerformanceMonitoring, setEnablePerformanceMonitoring] = useState(true);



  const handleSwitchToAD = () => {
    // Clear other view states first
    if (isDataFlowActive && onToggleDataFlow) {
      onToggleDataFlow();
    }
    if (isFlowchartActive && onToggleFlowchart) {
      onToggleFlowchart();
    }
    
    // Then switch to AD view
    if (onSwitchView) {
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
    // Find the current project to pre-populate the form
    const currentProject = allProjects?.find(p => p.id === projectId);
    
    setTemplateForm({
      name: currentProject 
        ? `${currentProject.name} - Template` 
        : `Architecture Template - ${new Date().toLocaleDateString()}`,
      description: currentProject?.description || 'Secure architecture design with detailed components and connections.',
      tags: [], // Will use project tags instead
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

  // Function to generate diagram image (reusable logic from handleSaveImage)
  const generateDiagramImage = async (): Promise<string | null> => {
    try {
      const dataUrl = await captureDiagramImage({
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        quality: 1.0,
        padding: 50
      });
      
      // Automatically save to localStorage for report generation
      if (projectId && projectId !== 'default-project' && dataUrl) {
        try {
          localStorage.setItem(`diagram_image_${projectId}`, dataUrl);
          console.log('Diagram image automatically saved for project:', projectId);
        } catch (storageError) {
          console.warn('Could not save diagram image to localStorage:', storageError);
        }
      }
      
      return dataUrl;
    } catch (error) {
      console.error('Error generating diagram image:', error);
      throw error;
    }
  };

  const handleSaveTemplate = async () => {
    try {
      // Find the current project
      const currentProject = allProjects?.find(p => p.id === projectId);
      
      if (!currentProject) {
        toast({
          title: "Error",
          description: "Current project not found. Please save the project first.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Processing",
        description: "Capturing diagram and saving template...",
        duration: 2000,
      });

      // Generate diagram image for the template
      let diagramImage = null;
      try {
        diagramImage = await generateDiagramImage();
      } catch (imageError) {
        console.warn('Could not capture diagram image:', imageError);
        // Continue with template save even if image capture fails
      }

      // Capture current diagram info (same format used in create project)
      const currentDiagramState = {
        nodes: nodes.filter(node => node.type !== 'layerGroup'), // Filter out layer containers
        edges: edges
      };

      // Convert visibility to array format for backend
      const visibilityArray = [];
      if (templateForm.visibility.private) visibilityArray.push('private');
      if (templateForm.visibility.team) visibilityArray.push('team');
      if (templateForm.visibility.organization) visibilityArray.push('organization');

      // Prepare payload for backend API
      const backendPayload = {
        tenant_id: user?.tenantId || 1,
        tenant_name: user?.tenantId?.toString() || 'default',
        diagram_state: currentDiagramState,
        template_name: templateForm.name,
        template_description: templateForm.description,
        template_tags: currentProject.tags || [],
        template_visibility: visibilityArray
      };

      // Send POST request to /save_template
      const backendResponse = await templateApiService.saveTemplate(backendPayload);
      
      if (!backendResponse.success) {
        throw new Error(backendResponse.message || 'Failed to save template to backend');
      }

      // On successful response, use saveTemplate() from templateStorageService.ts
      const templateData = {
        template_id: backendResponse.template_id,
        title: templateForm.name,
        description: templateForm.description,
        category: "Architecture Template",
        tags: currentProject.tags || [],
        visibility: templateForm.visibility,
        projectData: {
          name: currentProject.name,
          description: currentProject.description,
          tags: currentProject.tags || [],
        },
        creator: user?.username || user?.email || 'Unknown User',
        tenantId: user?.tenantId || 1,
        diagramImage: diagramImage,
        diagramState: currentDiagramState, // Include diagram state for backend integration
      };

      // Save to Supabase storage (maintains existing template storage logic)
      await addOrgTemplate(templateData);
      
      setIsTemplateModalOpen(false);
      
      toast({
        title: "Template Saved",
        description: `"${templateForm.name}" has been saved successfully. Template ID: ${backendResponse.template_id}`,
        duration: 3000,
      });
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
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

  // Layout control handlers
  const handleApplyLayout = () => {
    if (onLayout) {
      onLayout({
        direction: layoutDirection,
        engine: layoutEngine,
        enablePerformanceMonitoring
      });
    }
    setIsLayoutDropdownOpen(false);
  };

  const getEngineDescription = (engineType: string) => {
    const descriptions = {
      auto: 'Automatically selects the best engine based on diagram complexity',
      elk: 'Advanced hierarchical layout with optimal node placement',
      dagre: 'Fast directed graph layout with good performance',
      basic: 'Simple grid-based layout for basic diagrams'
    };
    return descriptions[engineType as keyof typeof descriptions] || 'Unknown engine';
  };

  const getEngineIcon = (engineType: string) => {
    const icons = {
      auto: Zap,
      elk: Settings,
      dagre: Activity,
      basic: LayoutGrid
    };
    return icons[engineType as keyof typeof icons] || LayoutGrid;
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEngineColor = (engineType: string) => {
    const colors = {
      auto: 'bg-blue-100 text-blue-800',
      elk: 'bg-purple-100 text-purple-800',
      dagre: 'bg-green-100 text-green-800',
      basic: 'bg-gray-100 text-gray-800'
    };
    return colors[engineType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleSaveImage = async () => {
    const reactFlowWrapper = document.querySelector('.react-flow') as HTMLElement;
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    
    if (!reactFlowWrapper || !viewport) {
      toast({
        title: "Error",
        description: "Could not find diagram. Please try again.",
        duration: 3000,
      });
      setIsImageModalOpen(false);
      return;
    }
    
    toast({
      title: "Processing",
      description: "Generating diagram image...",
      duration: 2000,
    });
    
    try {
      // Get all nodes and edges to calculate proper bounds
      const nodes = viewport.querySelectorAll('.react-flow__node');
      const edges = viewport.querySelectorAll('.react-flow__edge');
      
      if (nodes.length === 0) {
        toast({
          title: "Error",
          description: "No diagram content found.",
          duration: 3000,
        });
        setIsImageModalOpen(false);
        return;
      }
      
      // Calculate the actual bounds of all content
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      // Process nodes to get their actual positions
      nodes.forEach(node => {
        const style = window.getComputedStyle(node);
        const transform = style.transform;
        
        if (transform && transform !== 'none') {
          // Parse transform matrix to get x, y coordinates
          const matrix = transform.match(/matrix.*\((.+)\)/);
          if (matrix) {
            const values = matrix[1].split(', ');
            const x = parseFloat(values[4]) || 0;
            const y = parseFloat(values[5]) || 0;
            
            // Get node dimensions
            const rect = node.getBoundingClientRect();
            const width = parseFloat(style.width) || rect.width;
            const height = parseFloat(style.height) || rect.height;
            
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + width);
            maxY = Math.max(maxY, y + height);
          }
        }
      });
      
      // Also check edges for complete bounds
      edges.forEach(edge => {
        const pathElement = edge.querySelector('path');
        if (pathElement) {
          const bbox = pathElement.getBBox();
          const edgeTransform = window.getComputedStyle(edge).transform;
          
          let edgeX = 0, edgeY = 0;
          if (edgeTransform && edgeTransform !== 'none') {
            const matrix = edgeTransform.match(/matrix.*\((.+)\)/);
            if (matrix) {
              const values = matrix[1].split(', ');
              edgeX = parseFloat(values[4]) || 0;
              edgeY = parseFloat(values[5]) || 0;
            }
          }
          
          minX = Math.min(minX, bbox.x + edgeX);
          minY = Math.min(minY, bbox.y + edgeY);
          maxX = Math.max(maxX, bbox.x + bbox.width + edgeX);
          maxY = Math.max(maxY, bbox.y + bbox.height + edgeY);
        }
      });
      
      // Add padding around the content
      const padding = 50;
      const contentWidth = maxX - minX + (padding * 2);
      const contentHeight = maxY - minY + (padding * 2);
      
      // Store original styles
      const originalViewportTransform = viewport.style.transform;
      const originalWrapperStyles = {
        width: reactFlowWrapper.style.width,
        height: reactFlowWrapper.style.height,
        overflow: reactFlowWrapper.style.overflow
      };
      
      // Calculate new transform to center the content
      const newTranslateX = -minX + padding;
      const newTranslateY = -minY + padding;
      
      // Apply new transform to viewport
      viewport.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px) scale(1)`;
      
      // Adjust wrapper size to fit content
      reactFlowWrapper.style.width = contentWidth + 'px';
      reactFlowWrapper.style.height = contentHeight + 'px';
      reactFlowWrapper.style.overflow = 'hidden';
      
      // Hide UI elements
      const elementsToHide = [
        '.react-flow__minimap',
        '.react-flow__controls',
        '.react-flow__attribution',
        '.react-flow__panel'
      ];
      
      const hiddenElements: { element: HTMLElement, originalDisplay: string }[] = [];
      
      elementsToHide.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const element = el as HTMLElement;
          hiddenElements.push({
            element,
            originalDisplay: element.style.display
          });
          element.style.display = 'none';
        });
      });
      
      // Wait for layout changes to take effect
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Capture the image with exact dimensions
      const dataUrl = await toPng(reactFlowWrapper, {
        quality: 1.0,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        width: contentWidth,
        height: contentHeight,
        skipAutoScale: true,
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      // Restore all original styles
      viewport.style.transform = originalViewportTransform;
      reactFlowWrapper.style.width = originalWrapperStyles.width;
      reactFlowWrapper.style.height = originalWrapperStyles.height;
      reactFlowWrapper.style.overflow = originalWrapperStyles.overflow;
      
      // Restore hidden elements
      hiddenElements.forEach(({ element, originalDisplay }) => {
        element.style.display = originalDisplay;
      });
      
      // Download the image
      const link = document.createElement('a');
      link.download = `${imageForm.name || 'architecture-diagram'}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Image Downloaded",
        description: `"${imageForm.name}" has been saved successfully.`,
        duration: 3000,
      });
      
      setIsImageModalOpen(false);
      
    } catch (error) {
      console.error('Error generating diagram image:', error);
      toast({
        title: "Error",
        description: "Failed to generate diagram image. Please try again.",
        duration: 3000,
      });
      setIsImageModalOpen(false);
    }
  };

// Custom Sequence Flow Icon Component
const SequenceFlowIcon = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Top flow: Node 1 -> Node 2 */}
    <circle cx="7" cy="4" r="2.2" />
    <circle cx="17" cy="4" r="2.2" />
    <path d="M9.5 4h5" />
    <path d="M14.5 3l2.5 1-2.5 1" />
    
    {/* Arrow down from Node 2 */}
    <path d="M17 6.5v4" />
    <path d="M16 9.5l1 1 1-1" />
    
    {/* Middle node */}
    <circle cx="17" cy="12" r="2.2" />
    
    {/* Flow back left to Node 3 */}
    <path d="M14.5 12H9.5" />
    <path d="M11.5 11l-2.5 1 2.5 1" />
    <circle cx="7" cy="12" r="2.2" />
    
    {/* Arrow down from Node 3 with more space */}
    <path d="M7 14.5v3.5" />
    <path d="M6 17l1 1 1-1" />
    
    {/* Bottom flow: Node 4 -> Node 5 -> Node 6 with more spacing */}
    <circle cx="7" cy="20" r="2.2" />
    <circle cx="17" cy="20" r="2.2" />
    <circle cx="21" cy="20" r="2.2" />
    <path d="M9.5 20h5" />
    <path d="M14.5 19l2.5 1-2.5 1" />
    <path d="M19.5 20h1" />
    <path d="M19.5 19l1.5 1-1.5 1" />
  </svg>
);

  return (
    <div className={`border-b px-3 flex items-center justify-between w-full flex-shrink-0 h-12 z-10 relative ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <TooltipProvider>
        <div className="flex items-center space-x-1">
          {projectId && projectId !== 'default-project' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`flex items-center h-8 px-3 rounded-md border text-sm font-medium cursor-pointer ${
                    theme === 'dark'
                      ? "text-gray-300 hover:text-white hover:bg-gray-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                  onClick={copyProjectId}
                >

                  <span className={cn(
                    "ml-1 font-medium",
                    theme === 'dark' ? "text-purple-400" : "text-blue-700"
                  )}>{projectId}</span>
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
                className={`h-8 w-8 ${
                  theme === 'dark'
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
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
                className={`h-8 w-8 ${
                  theme === 'dark'
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
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
                className={`h-8 w-8 ${
                  theme === 'dark'
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
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
                className={`h-8 w-8 ${
                  theme === 'dark'
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
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
                className={`h-8 w-8 ${
                  theme === 'dark'
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
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
                className={`h-8 w-8 ${
                  theme === 'dark'
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                onClick={onComment}
              >
                <MessageSquare size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Add Sticky Note</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* AD Icon - Active by default for interactive React Flow diagrams */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${
                  theme === 'dark'
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                } ${viewMode === 'AD' && !isDataFlowActive && !isFlowchartActive ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' : ''}`}
                onClick={handleSwitchToAD}
              >
                <Network size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Interactive Diagramming View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${
                  theme === 'dark'
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                } ${isDataFlowActive ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' : ''}`}
                onClick={onToggleDataFlow}
              >
                <SequenceFlowIcon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle Sequence Diagram</TooltipContent>
          </Tooltip>

          {/* NEW: Toggle Flowchart button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${
                  theme === 'dark'
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                } ${isFlowchartActive ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' : ''}`}
                onClick={onToggleFlowchart}
              >
                <Workflow size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle Data Flow Graph</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Layout Controls Dropdown */}
          {onLayout && (
            <DropdownMenu open={isLayoutDropdownOpen} onOpenChange={setIsLayoutDropdownOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${
                        theme === 'dark'
                          ? "text-gray-300 hover:text-white hover:bg-gray-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      } ${isLayouting ? 'animate-pulse' : ''}`}
                      disabled={isLayouting}
                    >
                      {isLayouting ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <LayoutGrid size={16} />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Layout Controls</TooltipContent>
              </Tooltip>
              <DropdownMenuContent className="w-80 p-6 space-y-6 bg-gradient-to-br from-white to-blue-50/30 border-blue-100/50 shadow-xl rounded-lg">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-blue-700 flex items-center gap-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1.5 rounded-md shadow-sm">
                        <LayoutGrid className="h-4 w-4 text-white" />
                      </div>
                      Layout Controls
                    </h3>
                    <Badge variant="outline" className="text-xs bg-blue-50/50 border-blue-200 text-blue-600">
                      Enhanced
                    </Badge>
                  </div>
                  
                  {/* Direction Control */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Direction
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'LR', label: 'Left → Right' },
                        { value: 'TB', label: 'Top → Bottom' },
                        { value: 'BT', label: 'Bottom → Top' },
                        { value: 'RL', label: 'Right → Left' }
                      ].map(({ value, label }) => (
                        <Button
                          key={value}
                          variant={layoutDirection === value ? "default" : "outline"}
                          size="sm"
                          className={`text-sm py-2.5 px-4 transition-all duration-300 font-medium ${
                            layoutDirection === value 
                              ? 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                              : `${
                                theme === 'dark'
                                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600"
                                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                              } hover:transform hover:-translate-y-0.5`
                          }`}
                          onClick={() => setLayoutDirection(value as any)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Engine Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Layout Engine
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'auto', label: 'Auto', icon: Zap },
                        { value: 'elk', label: 'ELK', icon: Settings },
                        { value: 'dagre', label: 'Dagre', icon: Activity },
                        { value: 'basic', label: 'Basic', icon: LayoutGrid }
                      ].map(({ value, label, icon: Icon }) => (
                        <Button
                          key={value}
                          variant={layoutEngine === value ? "default" : "outline"}
                          size="sm"
                          className={`text-sm py-2.5 px-4 flex items-center gap-2 transition-all duration-300 font-medium ${
                            layoutEngine === value 
                              ? 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                              : `${
                                theme === 'dark'
                                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600"
                                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                              } hover:transform hover:-translate-y-0.5`
                          }`}
                          onClick={() => setLayoutEngine(value as any)}
                        >
                          <Icon size={14} />
                          {label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-blue-600/70 bg-blue-50/50 p-3 rounded-md border border-blue-100/50">
                      {getEngineDescription(layoutEngine)}
                    </p>
                  </div>

                  {/* Performance Monitoring */}
                  <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                    <Label className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Performance Monitoring
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEnablePerformanceMonitoring(!enablePerformanceMonitoring)}
                      className={`text-sm py-2 px-4 font-medium transition-all duration-300 ${
                        enablePerformanceMonitoring 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-500 hover:shadow-lg transform hover:-translate-y-0.5' 
                          : `${
                            theme === 'dark'
                              ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600"
                              : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                          } hover:transform hover:-translate-y-0.5`
                      }`}
                    >
                      {enablePerformanceMonitoring ? 'ON' : 'OFF'}
                    </Button>
                  </div>

                  {/* Last Layout Result */}
                  {lastLayoutResult && (
                    <div className="bg-gradient-to-r from-blue-50/70 to-purple-50/70 p-4 rounded-lg border border-blue-100/50 space-y-3">
                      <h4 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        Last Layout Result
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600/70">Engine:</span>
                          <Badge className={`${getEngineColor(lastLayoutResult.engineUsed)} text-xs`}>
                            {lastLayoutResult.engineUsed}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600/70">Time:</span>
                          <span className="text-blue-800 font-medium">{lastLayoutResult.executionTime}ms</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600/70">Quality:</span>
                          <span className={`font-medium ${getQualityColor(lastLayoutResult.qualityScore)}`}>
                            {(lastLayoutResult.qualityScore * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600/70">Status:</span>
                          <Badge variant={lastLayoutResult.success ? "default" : "destructive"} className="text-xs">
                            {lastLayoutResult.success ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Apply Layout Button */}
                  <Button
                    onClick={handleApplyLayout}
                    disabled={isLayouting}
                    className="w-full h-11 bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-md"
                  >
                    {isLayouting ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Applying Layout...
                      </>
                    ) : (
                      <>
                        <LayoutGrid size={16} className="mr-2" />
                        Apply Layout
                      </>
                    )}
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Style Toggle */}
          <div title="View Mode">
            <StyleToggle variant="compact" size="sm" />
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Save as Template Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${
                  theme === 'dark'
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                onClick={handleOpenTemplateModal}
              >
                <LayoutTemplate size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Save as Template</TooltipContent>
          </Tooltip>

          {/* Save as Image Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${
                  theme === 'dark'
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                onClick={handleOpenImageModal}
              >
                <Image size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Save as Image</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Run Threat Analysis Button - only show in AD mode */}
          {viewMode === 'AD' && onRunThreatAnalysis && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRunThreatAnalysis}
                  disabled={runningThreatAnalysis}
                  className={cn(
                    "h-8 px-3 text-xs font-medium transition-all duration-200 flex items-center gap-1.5 rounded shadow-sm hover:shadow-md",
                    theme === 'dark'
                      ? "bg-gradient-to-r from-red-900/80 to-red-800/80 hover:from-red-800 hover:to-red-700 text-red-300 border border-red-700/50 hover:border-red-600"
                      : "bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-700 border border-red-200"
                  )}
                >
                  {runningThreatAnalysis ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} />
                      Run Threat Analysis
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Analyze architecture for security threats</TooltipContent>
            </Tooltip>
          )}

          <Separator orientation="vertical" className="h-6 mx-1" />



        </div>

        <div className="flex items-center space-x-1">
          {/* Theme Toggle Button - Beautiful modern design */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={`h-8 w-8 relative overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                  theme === 'dark' 
                    ? 'hover:bg-gradient-to-r hover:from-yellow-400/20 hover:to-orange-400/20 hover:text-yellow-400' 
                    : 'hover:bg-gradient-to-r hover:from-indigo-100/80 hover:to-purple-100/80 hover:text-indigo-700'
                } rounded-lg border-2 ${
                  theme === 'dark' 
                    ? 'border-yellow-400/30 hover:border-yellow-400/50' 
                    : 'border-indigo-200/50 hover:border-indigo-300'
                } hover:shadow-lg`}
              >
                <div className="relative flex items-center justify-center">
                  {theme === 'dark' ? (
                    <Sun 
                      size={16} 
                      className="text-yellow-400 drop-shadow-sm animate-pulse" 
                    />
                  ) : (
                    <Moon 
                      size={16} 
                      className="text-indigo-600 drop-shadow-sm" 
                    />
                  )}
                  {/* Subtle glow effect */}
                  <div className={`absolute inset-0 rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-r from-yellow-400/10 to-orange-400/10' 
                      : 'bg-gradient-to-r from-indigo-400/10 to-purple-400/10'
                  } opacity-0 hover:opacity-100 transition-opacity duration-300`} />
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </TooltipContent>
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
                Tags (from project)
              </Label>
              
              <div className="flex flex-col gap-2">
                {(() => {
                  const currentProject = allProjects?.find(p => p.id === projectId);
                  const projectTags = currentProject?.tags || [];
                  
                  return projectTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 p-3 bg-blue-50/50 border border-blue-100/80 rounded-md">
                      {projectTags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          className="bg-blue-100 text-blue-700 border border-blue-200 font-medium py-1 px-2"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50/50 border border-gray-100/80 rounded-md text-sm text-gray-500 italic">
                      No tags were added to this project
                    </div>
                  );
                })()}
                
                <p className="text-xs text-blue-600/80 mt-1">
                  These tags were defined when the project was created and will be used for this template.
                </p>
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