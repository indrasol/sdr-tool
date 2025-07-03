import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Download, ShieldCheck, Loader2 } from 'lucide-react';

interface TitleCardProps {
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  handleDownload: () => Promise<void>;
  isDownloading?: boolean;
  reportStats?: {
    sectionsCount: number;
    lastModified?: Date;
    projectName?: string;
  };
}

const TitleCard: React.FC<TitleCardProps> = ({ 
  isEditing, 
  setIsEditing, 
  handleDownload, 
  isDownloading = false,
  reportStats 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownloadClick = async () => {
    setIsProcessing(true);
    try {
      await handleDownload();
    } finally {
      setTimeout(() => setIsProcessing(false), 1000); // Brief delay for UX
    }
  };

  return (
    <div className="report-card-enhanced smooth-transition mb-6 overflow-hidden border-none relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-end pr-20 sm:pr-80 opacity-75">
          <ShieldCheck className="h-24 w-24 sm:h-48 sm:w-48 text-teal-500/10" />
        </div>
      </div>
      
      <div className="p-4 sm:p-6 relative z-10">
        {/* Main header section - responsive */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          {/* Title section */}
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex items-center mb-2 sm:mb-0">
              <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-2 rounded-lg mr-3 shadow-inner flex-shrink-0">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              
              <div className="flex items-center">
                <h1 
                  className="responsive-text-2xl sm:text-3xl font-semibold font-['Geneva','Segoe UI',sans-serif] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-600"
                  role="heading" 
                  aria-level={1}
                >
                  Security Assessment Report
                </h1>
                
                {/* Mascot - hide on mobile for better space usage */}
                <div className="hidden sm:flex h-10 items-center">
                  <img 
                    src="/indrabot-mascot.png" 
                    alt="Indrasol Security Assistant Mascot" 
                    className="h-16 lg:h-20 w-auto object-contain opacity-35 ml-2 -my-8 lg:-my-10"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Action buttons - responsive */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(!isEditing)}
              className="enhanced-focus smooth-transition bg-gradient-to-r from-blue-50/70 to-purple-50/70 border-blue-100 hover:border-blue-200 text-blue-600 hover:text-blue-700 hover:from-blue-100/80 hover:to-purple-100/80 hover:shadow-sm w-full sm:w-auto"
              aria-label={isEditing ? "Switch to view mode" : "Switch to edit mode"}
              disabled={isProcessing}
            >
              <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
              {isEditing ? "Save Edit" : "Edit"}
            </Button>
            
            <Button 
              onClick={handleDownloadClick}
              disabled={isDownloading || isProcessing}
              className="button-enhanced w-full sm:w-auto"
              aria-label="Download report as PDF"
            >
              {(isDownloading || isProcessing) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  {isProcessing ? 'Processing...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Description - responsive */}
        <div className="mt-4 space-y-2">
          <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-full lg:max-w-3xl leading-relaxed">
            Comprehensive analysis and actionable recommendations based on your infrastructure design
          </p>
          
          {/* Additional context for screen readers */}
          <div className="sr-only">
            This security assessment report provides detailed analysis of your system architecture, 
            identifying potential security risks and providing recommendations for improvement.
            {isEditing && " You are currently in edit mode where you can modify report content."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleCard;