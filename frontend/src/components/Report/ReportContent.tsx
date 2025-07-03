import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Image as ImageIcon, AlertTriangle, AlertCircle, Info, Download, ZoomIn, ZoomOut, RotateCw, Maximize2, Loader2, ArrowLeft, ArrowRight, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MDEditor from '@uiw/react-md-editor';
import { getCommands as mdGetCommands } from '@uiw/react-md-editor/commands';

interface ReportPage {
  title: string;
  content: string;
}

interface ReportContentProps {
  reportPages: ReportPage[];
  currentPage: number;
  isEditing: boolean;
  handleContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  diagramImage: string | null;
  reportRef: React.RefObject<HTMLDivElement>;
}

// Content cache to store already displayed content
const contentCache = new Map<string, boolean>();

// Image cache for performance optimization
const imageCache = new Map<string, { blob: Blob; url: string; timestamp: number }>();

// Cache cleanup interval (10 minutes)
const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000;
const CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutes

// Clear cache function for better development experience
export const clearReportContentCache = () => {
  contentCache.clear();
  // Also cleanup image cache
  imageCache.forEach(({ url }) => {
    URL.revokeObjectURL(url);
  });
  imageCache.clear();
};

// Enhanced Diagram Image Component with optimizations
const EnhancedDiagramImage: React.FC<{
  diagramImage: string | null;
  projectId?: string;
}> = ({ diagramImage, projectId }) => {
  const [imageState, setImageState] = useState<{
    isLoading: boolean;
    hasError: boolean;
    isVisible: boolean;
    naturalDimensions: { width: number; height: number } | null;
    zoom: number;
    rotation: number;
    panX: number;
    panY: number;
  }>({
    isLoading: true,
    hasError: false,
    isVisible: false,
    naturalDimensions: null,
    zoom: 1,
    rotation: 0,
    panX: 0,
    panY: 0
  });

  const imageRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Collapsible pane state
  const [isPaneCollapsed, setIsPaneCollapsed] = useState(false);

  // Reusable control button classes
  const controlBtnClass = "h-9 w-9 p-0 hover:bg-indigo-200";

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!containerRef.current || !diagramImage || diagramImage === 'placeholder') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !imageState.isVisible) {
            setImageState(prev => ({ ...prev, isVisible: true }));
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [diagramImage, imageState.isVisible]);

  // Optimized image loading with caching
  const processImage = async (imageSrc: string): Promise<string> => {
    const cacheKey = `${imageSrc.slice(0, 50)}_${imageSrc.length}`;
    
    // Check cache first
    const cached = imageCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_MAX_AGE) {
      return cached.url;
    }

    try {
      // Convert base64 to blob for better memory management
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const optimizedUrl = URL.createObjectURL(blob);
      
      // Cache the processed image
      imageCache.set(cacheKey, {
        blob,
        url: optimizedUrl,
        timestamp: Date.now()
      });

      return optimizedUrl;
    } catch (error) {
      console.warn('Failed to process image:', error);
      return imageSrc; // Fallback to original
    }
  };

  // Handle image loading
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageState(prev => ({
      ...prev,
      isLoading: false,
      hasError: false,
      naturalDimensions: {
        width: img.naturalWidth,
        height: img.naturalHeight
      }
    }));

    console.log('Enhanced diagram image loaded:', {
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayWidth: img.offsetWidth,
      displayHeight: img.offsetHeight,
      aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2)
    });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Enhanced diagram image failed to load');
    setImageState(prev => ({
      ...prev,
      isLoading: false,
      hasError: true
    }));
  };

  const handleDownloadImage = async () => {
    if (!diagramImage || !imageState.naturalDimensions) return;

    try {
      const processedUrl = await processImage(diagramImage);
      const link = document.createElement('a');
      link.href = processedUrl;
      link.download = `architecture-diagram-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const resetImageTransforms = () => {
    setImageState(prev => ({ ...prev, zoom: 1, rotation: 0, panX: 0, panY: 0 }));
  };

  // Image controls component
  const ImageControls = () => (
    <TooltipProvider>
      <div className={`absolute top-2 right-2 z-30 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg pointer-events-auto flex ${isPaneCollapsed ? 'flex-col' : 'flex-row gap-1'}`}>
        {/* Collapse / Expand Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className={controlBtnClass}
          onClick={() => setIsPaneCollapsed(prev => !prev)}
          aria-label={isPaneCollapsed ? 'Expand controls' : 'Collapse controls'}
        >
          {isPaneCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        {!isPaneCollapsed && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={controlBtnClass}
                onClick={() => setImageState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.25, 3) }))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom In</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={controlBtnClass}
                onClick={() => setImageState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.25, 0.5) }))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom Out</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={controlBtnClass}
                onClick={() => setImageState(prev => ({ ...prev, panX: prev.panX + 50 }))}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Move Left</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={controlBtnClass}
                onClick={() => setImageState(prev => ({ ...prev, panX: prev.panX - 50 }))}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Move Right</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={controlBtnClass}
                onClick={resetImageTransforms}
                disabled={imageState.zoom === 1 && imageState.rotation === 0 && imageState.panX === 0 && imageState.panY === 0}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Reset View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={controlBtnClass}
                onClick={() => setImageState(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Rotate</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={controlBtnClass}
                onClick={handleDownloadImage}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Download Image</TooltipContent>
          </Tooltip>

          <Dialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={controlBtnClass}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={8} align="center">Full Screen</TooltipContent>
            </Tooltip>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
              <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <img
                  src={diagramImage}
                  alt="System Architecture Diagram - Full Screen"
                  className="max-w-full max-h-full object-contain"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </>)}
      </div>
    </TooltipProvider>
  );

  // Fallback component with enhanced styling
  const EnhancedFallback = () => (
    <div className="relative text-center p-12 bg-gradient-to-br from-blue-50/80 via-white to-purple-50/80 rounded-xl border-2 border-dashed border-blue-200/60 transition-all duration-300 hover:border-blue-300/80 hover:shadow-lg group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg group-hover:scale-105 transition-transform duration-300">
          <ImageIcon className="w-10 h-10 text-white" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Architecture Diagram</h3>
        
        <div className="space-y-2">
          <p className="text-gray-600 font-medium">
            {diagramImage === 'placeholder' 
              ? 'Diagram will be captured from the design canvas' 
              : 'No diagram image available'
            }
          </p>
          
          {!diagramImage && (
            <p className="text-sm text-gray-500">
              Generate your architecture diagram in the AI Design canvas first
            </p>
          )}
        </div>

        {imageState.hasError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium">
              Failed to load diagram image
            </p>
            <p className="text-xs text-red-500 mt-1">
              The image may be corrupted or unavailable
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Main render
  if (!diagramImage || diagramImage === 'placeholder' || imageState.hasError) {
    return <EnhancedFallback />;
  }

  return (
    <div 
      ref={containerRef}
      className="relative group bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Loading state */}
      {imageState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Loading diagram...</p>
          </div>
        </div>
      )}

      {/* Image controls */}
      <ImageControls />

      {/* Image container with padding */}
      <div className="p-6">
        <div className="overflow-hidden rounded-lg">
          {imageState.isVisible && (
            <img
              ref={imageRef}
              src={diagramImage}
              alt="System Architecture Diagram"
              className="w-full h-auto object-contain transition-all duration-300 hover:scale-[1.02]"
              style={{
                imageRendering: 'crisp-edges',
                maxHeight: '600px',
                minHeight: '300px',
                transform: `translate(${imageState.panX}px, ${imageState.panY}px) scale(${imageState.zoom}) rotate(${imageState.rotation}deg)`,
                transformOrigin: 'center center',
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05))',
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
      </div>

      {/* Image info footer */}
      {imageState.naturalDimensions && (
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {imageState.naturalDimensions.width} × {imageState.naturalDimensions.height}
          {imageState.zoom !== 1 && ` • ${Math.round(imageState.zoom * 100)}%`}
        </div>
      )}
    </div>
  );
};

// Cache cleanup effect
const useCacheCleanup = () => {
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      imageCache.forEach((value, key) => {
        if (now - value.timestamp > CACHE_MAX_AGE) {
          URL.revokeObjectURL(value.url);
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => {
        imageCache.delete(key);
      });

      if (keysToDelete.length > 0) {
        console.log(`Cleaned up ${keysToDelete.length} cached images`);
      }
    }, CACHE_CLEANUP_INTERVAL);

    return () => {
      clearInterval(cleanupInterval);
      // Cleanup all cached images on unmount
      imageCache.forEach(({ url }) => {
        URL.revokeObjectURL(url);
      });
      imageCache.clear();
    };
  }, []);
};

const ReportContent: React.FC<ReportContentProps> = ({
  reportPages,
  currentPage,
  isEditing,
  handleContentChange,
  diagramImage,
  reportRef
}) => {
  const [showFallback, setShowFallback] = useState(false);
  
  // Enable cache cleanup
  useCacheCleanup();
  
  // Clear cache on component mount when reportPages change
  useEffect(() => {
    contentCache.clear();
  }, [reportPages]);
  
  // Check if current section is "System Design Architecture"
  const isSystemDesignSection = reportPages[currentPage]?.title === "System Design Architecture";
  const isKeyRiskAreasSection = reportPages[currentPage]?.title === "Key Risk Areas";
  
  // Process content to handle diagram URL placeholders and risk sections
  const processedContent = React.useMemo(() => {
    let content = reportPages[currentPage]?.content || '';
    const isProjectDescription = reportPages[currentPage]?.title === "Project Description";
    
    // Handle Project Description section - ensure markdown is properly formatted
    if (isProjectDescription) {
      // Ensure proper markdown formatting for Project Description
      content = content.trim();
      
      // Fix any common markdown issues in Project Description
      content = content.replace(/\n\n\n+/g, '\n\n'); // Multiple newlines to double
      content = content.replace(/^-\s+/gm, '- '); // Fix bullet point spacing
      content = content.replace(/\*\*([^*]+)\*\*/g, '**$1**'); // Ensure bold formatting
      
      console.log('Project Description content:', content); // Debug log
    }
    
    // Handle System Design Architecture section
    if (isSystemDesignSection) {
      // Remove markdown image syntax that shows as plain text
      content = content.replace(/!\[.*?\]\(\{diagram_url\}\)/g, '');
      content = content.replace(/!\[.*?\]\(.*?diagram.*?\)/g, '');
      
      // Clean up any leftover diagram URL references
      content = content.replace(/{diagram_url}/g, '');
      content = content.replace(/_Diagram captured automatically.*?_/g, '');
      
      // Remove duplicate "System Design Architecture" headers from content - more thorough cleaning
      content = content.replace(/^#+\s*System Design Architecture\s*$/gmi, '');
      content = content.replace(/^System Design Architecture\s*$/gmi, '');
      content = content.replace(/System Design Architecture\s*\n/gi, '');
      content = content.replace(/\*\*System Design Architecture\*\*/gi, '');
      
      // Remove any leading/trailing whitespace and extra newlines
      content = content.replace(/^\s+|\s+$/g, '').replace(/\n\n\n+/g, '\n\n');
    }
    
    return content.trim();
  }, [reportPages, currentPage, isSystemDesignSection]);

  // Disable typewriter effect globally – no-op effect kept for future flexibility
  useEffect(() => {
    setShowFallback(false);
  }, [reportPages, currentPage]);

  // Enhanced markdown components for better styling and risk area color coding
  const markdownComponents = {
    h1: ({children}) => <h1 className="text-xl font-bold mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">{children}</h1>,
    h2: ({children}) => {
      const text = children?.toString() || '';
      let colorClass = "text-gray-800";
      let iconElement = null;
      
      // Color code Project Description subsections
      if (text.includes('Key Components') || text.includes('Components')) {
        colorClass = "text-indigo-600";
      } else if (text.includes('Security Considerations') || text.includes('Security')) {
        colorClass = "text-green-600";
      } else if (text.includes('Architecture Benefits') || text.includes('Benefits')) {
        colorClass = "text-purple-600";
      } else if (text.includes('Executive Summary') || text.includes('Overview')) {
        colorClass = "text-blue-600";
      }
      // Color code risk subsections
      else if (text.includes('High Risk')) {
        colorClass = "text-red-600";
        iconElement = <AlertTriangle className="w-5 h-5 text-red-500 inline mr-2" />;
      } else if (text.includes('Medium Risk')) {
        colorClass = "text-orange-500";
        iconElement = <AlertCircle className="w-5 h-5 text-orange-500 inline mr-2" />;
      } else if (text.includes('Low Risk')) {
        colorClass = "text-blue-600";
        iconElement = <Info className="w-5 h-5 text-blue-500 inline mr-2" />;
      }
      
      return (
        <h2 className={`text-xl font-semibold mb-4 mt-6 ${colorClass} flex items-center`}>
          {iconElement}
          {children}
        </h2>
      );
    },
    h3: ({children}) => <h3 className="text-lg font-semibold mb-3 text-gray-800 border-l-4 border-blue-500 pl-3">{children}</h3>,
    p: ({children}) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
    ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 ml-4">{children}</ul>,
    ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 ml-4">{children}</ol>,
    li: ({children}) => <li className="mb-1 leading-relaxed">{children}</li>,
    strong: ({children}) => <strong className="font-semibold text-gray-900 bg-yellow-50 px-1 rounded">{children}</strong>,
    em: ({children}) => <em className="italic text-gray-800">{children}</em>,
    code: ({children, className}) => {
      const isInline = !className;
      return isInline ? (
        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>
      ) : (
        <code className="block bg-gray-100 p-4 rounded-md text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">{children}</code>
      );
    },
    blockquote: ({children}) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-4 bg-blue-50/50 py-2 rounded-r-md">{children}</blockquote>
    ),
    a: ({href, children}) => (
      <a
        href={href as string}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        {children}
      </a>
    ),
  };

  /* -------------------------------------------------- */
  /* Remove default image command from Markdown toolbar */
  const filteredCommands = React.useMemo(() => {
    try {
      const cmds = mdGetCommands();
      return cmds.filter((cmd: any) => cmd.keyCommand !== 'image');
    } catch {
      return undefined;
    }
  }, []);

  return (
    <div className="col-span-9">
      <Card className="h-[calc(100vh-280px)] min-h-[500px] border-securetrack-lightpurple/20 overflow-hidden shadow-md bg-gradient-to-r from-[#f8f9fc] via-white to-[#f5f2fc]">
        {/* Sticky Header */}
        <div className={`sticky top-0 z-10 p-4 shadow-md ${
          reportPages[currentPage]?.title === "High Risks" 
            ? "bg-gradient-to-r from-red-100/90 to-red-200/90 text-red-700 border-b border-red-200"
            : reportPages[currentPage]?.title === "Medium Risks"
            ? "bg-gradient-to-r from-orange-100/90 to-yellow-200/90 text-orange-700 border-b border-orange-200"
            : reportPages[currentPage]?.title === "Low Risks"
            ? "bg-gradient-to-r from-blue-100/90 to-blue-200/90 text-blue-700 border-b border-blue-200"
            : "bg-gradient-to-r from-blue-50/90 to-purple-50/90 text-blue-700 border-b border-blue-100"
        }`}>
          <h2 className="text-2xl font-bold font-playfair flex items-center gap-2">
            {reportPages[currentPage]?.title === "High Risks" && <AlertTriangle className="w-6 h-6" />}
            {reportPages[currentPage]?.title === "Medium Risks" && <AlertCircle className="w-6 h-6" />}
            {reportPages[currentPage]?.title === "Low Risks" && <Info className="w-6 h-6" />}
            {reportPages[currentPage]?.title === "System Design Architecture" && <ImageIcon className="w-6 h-6" />}
            {(reportPages[currentPage]?.title === "Key Risk Areas" || 
              reportPages[currentPage]?.title === "Model Attack Possibilities") && <ShieldCheck className="w-6 h-6" />}
            {reportPages[currentPage]?.title}
          </h2>
        </div>
        
        <CardContent className="p-6 overflow-auto h-[calc(100%-80px)]" ref={reportRef}>
          {isEditing ? (
            isSystemDesignSection ? (
              <div className="flex items-center justify-center h-[350px] text-gray-600 italic">
                Design cannot be edited
              </div>
            ) : (
              <div data-color-mode="light" className="h-full">
                <MDEditor
                  value={reportPages[currentPage]?.content || ''}
                  onChange={(val) => handleContentChange({ target: { value: val || '' } } as any)}
                  height={500}
                  preview="live"
                  commands={filteredCommands}
                />
              </div>
            )
          ) : (
            <div className="font-inter min-h-[350px] text-gray-700">
              {/* Enhanced diagram display for System Design Architecture section */}
              {isSystemDesignSection && (
                <div className="mb-8">
                  <EnhancedDiagramImage 
                    diagramImage={diagramImage}
                    projectId={reportPages[currentPage]?.title}
                  />
                </div>
              )}
              
              {/* Content rendering - Skip text content for System Design Architecture section */}
              {!isSystemDesignSection && (
                <div className="prose prose-lg max-w-none markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {processedContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportContent;