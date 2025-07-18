import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Cpu, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import TitleCard from '@/components/Report/TitleCard';
import ReportNavigation from '@/components/Report/ReportNavigation';
import ReportContent from '@/components/Report/ReportContent';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  generatePDF, 
  addReportPage, 
  moveReportPage, 
  deleteReportPage,
  addSubsectionAfterParent
} from '@/utils/reportUtils';
import { Badge } from '@/components/ui/badge';

import reportService, {GenerateReportRequest,ReportSection } from '@/services/reportService';

// Enhanced caching system for better performance
const reportCache = new Map<string, {
  data: ReportSection[];
  timestamp: number;
  diagramImage: string | null;
}>();

const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_SIZE = 10;

// Content validation and sanitization
const validateReportContent = (content: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Basic content validation
  if (!content || content.trim().length === 0) {
    errors.push('Content cannot be empty');
  }
  
  if (content.length > 50000) {
    errors.push('Content exceeds maximum length (50,000 characters)');
  }
  
  // Check for potentially dangerous content
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi
  ];
  
  dangerousPatterns.forEach((pattern, index) => {
    if (pattern.test(content)) {
      errors.push(`Potentially unsafe content detected (pattern ${index + 1})`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize content for safe rendering
const sanitizeContent = (content: string): string => {
  // Remove any script tags and dangerous attributes
  let sanitized = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe\b[^>]*>/gi, '')
    .replace(/<object\b[^>]*>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '');
  
  return sanitized.trim();
};

// Cache management utilities
const getCachedReport = (projectId: string) => {
  const cached = reportCache.get(projectId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY) {
    return cached;
  }
  return null;
};

const setCachedReport = (projectId: string, data: ReportSection[], diagramImage: string | null) => {
  // Manage cache size
  if (reportCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = reportCache.keys().next().value;
    reportCache.delete(oldestKey);
  }
  
  reportCache.set(projectId, {
    data: JSON.parse(JSON.stringify(data)), // Deep clone to prevent mutations
    timestamp: Date.now(),
    diagramImage
  });
};

const GenerateReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  /* Enhanced UI state with validation */
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [reportPages, setReportPages] = useState<ReportSection[]>([]);
  const [diagramImage, setDiagramImage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  /* Project state - memoized for performance */
  const [projectCode, setProjectCode] = useState<string>('');

  // Memoized project validation
  const projectValidation = useMemo(() => {
    const currentProjectId = projectCode || params.projectId || location.state?.projectId;
    const isValidProject = currentProjectId && currentProjectId !== 'default-project';
    
    return {
      projectId: currentProjectId,
      isValid: isValidProject,
      source: projectCode ? 'state' : params.projectId ? 'params' : 'location'
    };
  }, [projectCode, params.projectId, location.state?.projectId]);

  // Memoized diagram state processing
  const processedDiagramState = useMemo(() => {
    let diagramState = null;
    
    if (location.state?.diagramState) {
      diagramState = location.state.diagramState;
    } else {
      try {
        const nodesLS = localStorage.getItem('diagramNodes');
        const edgesLS = localStorage.getItem('diagramEdges');
        if (nodesLS && edgesLS) {
          diagramState = {
            nodes: JSON.parse(nodesLS),
            edges: JSON.parse(edgesLS)
          };
        }
      } catch (error) {
        console.warn('Failed to parse diagram state from localStorage:', error);
      }
    }
    
    return diagramState;
  }, [location.state?.diagramState]);

  // Enhanced content change handler with validation and debouncing
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    
    // Validate content
    const validation = validateReportContent(newContent);
    setValidationErrors(validation.errors);
    
    if (validation.isValid) {
      // Sanitize and update content
      const sanitizedContent = sanitizeContent(newContent);
      
      setReportPages(prevPages => {
        const updated = [...prevPages];
        updated[currentPage] = {
          ...updated[currentPage],
          content: sanitizedContent
        };
        return updated;
      });
    }
  }, [currentPage]);

  // Optimized page handlers with functional updates
  const handleAddPage = useCallback((page: ReportSection) => {
    setReportPages(prevPages => {
      const updated = addReportPage(prevPages, page);
      setCurrentPage(updated.length - 1);
      toast({ title: 'Section Added', duration: 2000 });
      return updated;
    });
  }, [toast]);

  const handleAddSubsection = useCallback((parentIdx: number, sub: ReportSection) => {
    setReportPages(prevPages => {
      const updated = addSubsectionAfterParent(prevPages, parentIdx, sub);
      setCurrentPage(parentIdx + 1);
      toast({ title: 'Sub-section Added', duration: 2000 });
      return updated;
    });
  }, [toast]);

  const handleMovePage = useCallback((fromIndex: number, toIndex: number) => {
    setReportPages(prevPages => {
      const mainSections = [
        'Project Description',
        'System Design Architecture',
        'Data Flow Diagram',
        'Entry Point',
        'Model Attack Possibilities',
        'Key Risk Areas'
      ];

      let endIndex = fromIndex + 1;
      const parentTitle = prevPages[fromIndex]?.title;

      while (endIndex < prevPages.length) {
        const title = prevPages[endIndex].title;
        if (mainSections.includes(title)) break;
        if (parentTitle === 'Key Risk Areas') {
          if (['High Risks', 'Medium Risks', 'Low Risks'].includes(title)) {
            endIndex++;
            continue;
          }
          break;
        }
        // generic subsection
        endIndex++;
      }

      const slice = prevPages.slice(fromIndex, endIndex);
      const remaining = [...prevPages.slice(0, fromIndex), ...prevPages.slice(endIndex)];

      // calculate target insertion index in remaining
      let insertPos = toIndex;
      if (fromIndex < toIndex) {
        insertPos = toIndex - slice.length + 1;
      }
      insertPos = Math.max(0, Math.min(insertPos, remaining.length));

      const newPages = [...remaining.slice(0, insertPos), ...slice, ...remaining.slice(insertPos)];

      setCurrentPage(insertPos);
      toast({ title: 'Section Moved', duration: 2000 });
      return newPages;
    });
  }, [toast]);

  const handleDeletePage = useCallback((index: number) => {
    setReportPages(prevPages => {
      const updated = deleteReportPage(prevPages, index);
      setCurrentPage(prev => (prev >= updated.length ? Math.max(0, updated.length - 1) : prev));
      toast({ title: 'Section Deleted', duration: 2000 });
      return updated;
    });
  }, [toast]);

  // Enhanced download handler with progress tracking
  const handleDownload = useCallback(async () => {
    if (!reportRef.current) return;
    
    try {
      setGenerationProgress(0);
      toast({ title: 'Generating PDF...', duration: 2000 });
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      
      const pdf = generatePDF(reportPages, diagramImage);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      pdf.save(`security-assessment-report-${Date.now()}.pdf`);
      
      setTimeout(() => setGenerationProgress(0), 1000);
      
      toast({ 
        title: 'PDF Downloaded Successfully', 
        description: 'Your report has been saved to your downloads folder.',
        duration: 3000 
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      setGenerationProgress(0);
      toast({ 
        title: 'Download Failed', 
        description: 'Please try again or contact support if the issue persists.',
        variant: 'destructive',
        duration: 5000
      });
    }
  }, [reportPages, diagramImage, toast]);

  // Enhanced report generation with caching and retry logic
  const generateReport = useCallback(async (
    projectId: string, 
    diagramState: any, 
    diagramImg: string | null,
    retryCount = 0
  ) => {
    try {
      console.log('Starting report generation for project:', projectId);
      
      // Check cache first
      const cachedReport = getCachedReport(projectId);
      if (cachedReport && !retryCount) {
        console.log('Using cached report data');
        setReportPages(cachedReport.data);
        if (cachedReport.diagramImage) {
          setDiagramImage(cachedReport.diagramImage);
        }
        toast({ title: 'Report loaded from cache', duration: 2000 });
        return;
      }
      
      // Validate diagram state
      if (!diagramState?.nodes?.length) {
        toast({
          title: 'No Architecture Diagram',
          description: 'Please create an architecture diagram first before generating a report.',
          variant: 'destructive',
          duration: 5000
        });
        navigate('/model-with-ai');
        return;
      }

      setGenerationProgress(10);
      toast({ title: 'Generating report…', duration: 1500 });

      // Build request payload with enhanced validation
      const payload: GenerateReportRequest = {
        project_code: projectId,
        diagram_state: diagramState,
        diagram_png: diagramImg?.replace(/^data:image\/png;base64,/, ''),
      };

      console.log('Sending report generation request:', {
        project_code: payload.project_code,
        has_diagram_state: !!payload.diagram_state,
        nodes_count: payload.diagram_state?.nodes?.length || 0,
        has_diagram_png: !!payload.diagram_png,
        retry_count: retryCount
      });

      setGenerationProgress(30);

      const response = await reportService.generateReport(projectId, payload);
      
      setGenerationProgress(70);
      
      console.log('Report generation successful:', response);
      
      // Validate response data
      if (!response.sections || !Array.isArray(response.sections)) {
        throw new Error('Invalid response format: missing sections array');
      }
      
      setReportPages(response.sections);
      
      // Handle diagram URL
      if (response.diagram_url && !diagramImg) {
        setDiagramImage(response.diagram_url);
      }
      
      // Cache the successful result
      setCachedReport(projectId, response.sections, diagramImg || response.diagram_url);
      
      setGenerationProgress(100);
      
      toast({ 
        title: 'Report Generated Successfully!', 
        description: `Generated ${response.sections.length} sections`,
        duration: 3000 
      });
      
      setTimeout(() => setGenerationProgress(0), 1000);
      
    } catch (error: any) {
      console.error('Error generating report:', error);
      
      // Retry logic for transient failures
      if (retryCount < 2 && (
        error.message?.includes('timeout') || 
        error.message?.includes('network') ||
        error.status >= 500
      )) {
        setIsRetrying(true);
        toast({
          title: 'Retrying...',
          description: `Attempt ${retryCount + 2} of 3`,
          duration: 2000
        });
        
        setTimeout(() => {
          generateReport(projectId, diagramState, diagramImg, retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        
        return;
      }
      
      setGenerationProgress(0);
      toast({
        title: 'Failed to Generate Report',
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [navigate, toast]);

  // Initialize and generate report with enhanced error handling
  const hasRequestedRef = useRef(false);
  useEffect(() => {
    if (!projectValidation.isValid) return;

    // Prevent duplicate API calls on Strict-mode double render
    if (hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    // Keep projectCode in sync (does not trigger re-generation thanks to the guard)
    setProjectCode(projectValidation.projectId);

    // Retrieve diagram preview image (unchanged logic)
    let diagramImageFromNav: string | null = null;
    if (location.state?.diagramImage) {
      diagramImageFromNav = location.state.diagramImage;
      setDiagramImage(diagramImageFromNav);
    } else {
      const savedImage = localStorage.getItem(`diagram_image_${projectValidation.projectId}`);
      if (savedImage) {
        setDiagramImage(savedImage);
      }
    }

    // Fire the single generateReport request
    generateReport(projectValidation.projectId, processedDiagramState, diagramImageFromNav);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectValidation.isValid, processedDiagramState]);

  // Pass full context (diagram + preview image + session) back so ModelWithAI can
  // immediately restore and auto-arrange the diagram without extra user actions.
  const handleBackClick = useCallback(() => {
    navigate('/model-with-ai', {
      state: {
        projectId: projectCode,
        sessionId: location.state?.sessionId ?? undefined,
        diagramState: processedDiagramState ?? undefined,
        diagramImage: diagramImage ?? undefined,
        fromReport: true,
        preserveState: true,
      },
    });
  }, [navigate, projectCode, processedDiagramState, diagramImage, location.state?.sessionId]);

  // Loading state with enhanced UI
  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen space-y-6">
          <div className="text-center space-y-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
              <div className="absolute inset-0 w-12 h-12 border-2 border-blue-200 rounded-full mx-auto"></div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-800">
                {isRetrying ? 'Retrying Report Generation...' : 'Generating Security Report...'}
              </h3>
              <p className="text-gray-600">
                {isRetrying ? 'Please wait while we retry the request' : 'Analyzing your architecture and generating insights'}
              </p>
            </div>
            
            {generationProgress > 0 && (
              <div className="w-80 space-y-2">
                <Progress value={generationProgress} className="h-2" />
                <p className="text-sm text-gray-500">{generationProgress}% complete</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Error state with retry option
  if (!reportPages.length) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-6 max-w-md">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-800">No Report Content Available</h3>
              <p className="text-gray-600">
                The report could not be generated or no content was found.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={handleBackClick} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
              
              <Button 
                onClick={() => generateReport(projectCode, processedDiagramState, diagramImage)}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Generation
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Enhanced responsive container with better spacing */}
      <div className="mt-0 space-y-6 bg-gradient-to-br from-blue-50/80 via-white to-green-50/60 min-h-screen rounded-lg p-3 sm:p-6">
        
        <TitleCard 
          isEditing={isEditing} 
          setIsEditing={setIsEditing} 
          handleDownload={handleDownload}
          isDownloading={generationProgress > 0 && generationProgress < 100}
        />

        {/* Validation errors alert */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Content Validation Issues:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced header with consistent styling */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100/70 shadow-sm">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleBackClick}
              className="transition-all bg-gradient-to-r from-blue-50/70 to-purple-50/70 border-blue-100 hover:border-blue-200 text-blue-600 hover:text-blue-700 hover:from-blue-100/80 hover:to-purple-100/80 hover:shadow-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <Cpu className="mr-2 h-4 w-4" />
              Back to AI Design
            </Button>
            
            {projectCode && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 truncate max-w-[140px]">
                Project: {projectCode}
              </Badge>
            )}
          </div>
          
          {/* Report stats as colorful tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">
              {reportPages.length} sections
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-100">
              Section {currentPage + 1} / {reportPages.length}
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-100">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Badge>
          </div>
        </div>

        {/* Enhanced grid layout with better responsive design */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-[600px]">
          {/* Navigation sidebar - responsive */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <ReportNavigation 
              reportPages={reportPages} 
              currentPage={currentPage} 
              setCurrentPage={setCurrentPage}
              onAddPage={handleAddPage}
              onAddSubsection={handleAddSubsection}
              onMovePage={handleMovePage}
              onDeletePage={handleDeletePage}
            />
          </div>
          
          {/* Main content - responsive */}
          <div className="lg:col-span-9 order-1 lg:order-2">
            <ReportContent 
              reportPages={reportPages}
              currentPage={currentPage}
              isEditing={isEditing}
              handleContentChange={handleContentChange}
              diagramImage={diagramImage}
              reportRef={reportRef}
            />
          </div>
        </div>

        {/* Success indicator for completed actions */}
        {generationProgress === 100 && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Operation completed successfully</span>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GenerateReport;
