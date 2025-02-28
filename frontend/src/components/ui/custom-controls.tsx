import React, { useState } from 'react';
import { Controls as ReactFlowControls, useReactFlow } from '@xyflow/react';
import { FileText, Loader2 } from 'lucide-react'
import { TypingEffect } from './typing-effect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ReactMarkdown from 'react-markdown';

type Position = 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';

interface ReportData {
    report_id: string;
    report_url: string;
    image_url: string;
    }

interface CustomControlsProps {
    position?: Position;
    style?: React.CSSProperties;
    onGenerateReport?: () => Promise<ReportData>;
    }

const CustomControls = ({ position = 'top-left', style = {}, onGenerateReport } : CustomControlsProps) => {
  const [loading, setLoading] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const reactFlowInstance = useReactFlow();
  const handleGenerateClick = async () => {
    if (!onGenerateReport) return;
    
    setLoading(true);
    try {
        const data = await onGenerateReport();
        
        // Fetch the report content
        const reportResponse = await fetch(data.report_url);
        const reportText = await reportResponse.text();
        
        setReportContent(reportText);
        setReportUrl(data.report_url);
        setShowReportDialog(true);
        setIsEditing(false);
      } catch (error) {
        console.error('Error generating report:', error);
      } finally {
        setLoading(false);
      }
    };

  const handleDownload = () => {
    window.open(reportUrl, '_blank');
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      const reportId = reportUrl.split('/').pop()?.replace('.md', '');
      
      if (!reportId) throw new Error('Invalid report URL');

      await fetch(`http://localhost:8000/v1/routes/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: reportContent,
        }),
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setLoading(false);
    }
  };

//       setShowReportDialog(false);
//     } catch (error) {
//       console.error('Error saving report:', error);
//     } finally {
//       setLoading(false);
//     }
//   };
  const positionStyles = {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '4px',
    transform: 'none',
    zIndex: 5,
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #e5e5e5',
    ...(position === 'top-left' ? { left: 20, top: 40 } :
       position === 'top-right' ? { right: 20, top: 40 } :
       position === 'top-center' ? { left: '50%', top: 40, transform: 'translateX(-50%)' } :
       position === 'bottom-left' ? { left: 20, bottom: 20 } :
       position === 'bottom-right' ? { right: 20, bottom: 20 } :
       position === 'bottom-center' ? { left: '50%', bottom: 20, transform: 'translateX(-50%)' } :
       { left: 20, top: 160 }),
    ...style
  };
//   const positionStyles = getPositionStyles(position as Position);
  const combinedStyles = { ...positionStyles, ...style };

  return (
    <>
      <div className="react-flow__controls" style={positionStyles as React.CSSProperties}>
        <div className="react-flow__controls-button" onClick={() => reactFlowInstance.zoomIn()}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12">
            <path d="M16 4v24M4 16h24" stroke="currentColor" strokeWidth="3" fill="none" />
          </svg>
        </div>
        <div className="react-flow__controls-button" onClick={() => reactFlowInstance.zoomOut()}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12">
            <path d="M4 16h24" stroke="currentColor" strokeWidth="3" fill="none" />
          </svg>
        </div>
        <div className="react-flow__controls-button" onClick={() => reactFlowInstance.fitView()}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12">
            <path d="M27 5L5 27M27 27L5 5" stroke="currentColor" strokeWidth="3" fill="none" />
          </svg>
        </div>
        {/* <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="react-flow__controls-button"
                onClick={handleGenerateClick}
                style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generate Report</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider> */}
      </div>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-[80vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Security Report</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden" style={{ height: 'calc(80vh - 120px)' }}>
            {isEditing ? (
              <Textarea
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
                className="h-full min-h-full font-mono resize-none overflow-y-auto"
              />
            ) : (
              <TypingEffect content={reportContent} speed={30} />
            )}
          </div>
          <DialogFooter className="flex justify-between p-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload}>
                Download Report
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Preview' : 'Edit'}
              </Button>
            </div>
            {isEditing && (
              <Button onClick={handleSaveChanges} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { CustomControls };
export type { CustomControlsProps, Position };