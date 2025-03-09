import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';
import TitleCard from '@/components/Report/TitleCard';
import ReportNavigation from '@/components/Report/ReportNavigation';
import ReportContent from '@/components/Report/ReportContent';
import { 
  generatePDF, 
  addReportPage, 
  moveReportPage, 
  deleteReportPage 
} from '@/utils/reportUtils';

const GenerateReport = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Get diagram data from localStorage
  const [diagramImage, setDiagramImage] = useState<string | null>(null);
  
  // Report content state
  const [reportPages, setReportPages] = useState([
    {
      title: "Security Assessment Summary",
      content: "Based on the current infrastructure diagram, we've identified several key security strengths and areas for improvement. The implementation of a dedicated firewall provides a strong foundation for perimeter security. However, the direct connection between the web server and application server represents a potential vulnerability that should be addressed."
    },
    {
      title: "Identified Security Gaps",
      content: "1. No network segmentation between web and application tiers\n2. Single firewall represents a potential single point of failure\n3. No encryption shown for database connections\n4. No intrusion detection/prevention system in place\n5. No redundancy or failover mechanisms identified"
    },
    {
      title: "Recommendations",
      content: "1. Implement a DMZ for web-facing servers\n2. Add a second firewall for defense in depth\n3. Enable TLS encryption for all database connections\n4. Deploy an IDS/IPS solution to monitor for suspicious activity\n5. Implement high availability pairs for critical infrastructure components\n6. Add a web application firewall (WAF) to protect against application-layer attacks"
    }
  ]);

  // Capture diagram from localStorage on mount
  useEffect(() => {
    const diagramElement = document.getElementById('diagram-container');
    if (diagramElement) {
      toPng(diagramElement)
        .then(dataUrl => {
          setDiagramImage(dataUrl);
        })
        .catch(error => {
          console.error('Error capturing diagram:', error);
        });
    } else {
      // Try to get diagram from localStorage
      try {
        const nodesString = localStorage.getItem('diagramNodes');
        const edgesString = localStorage.getItem('diagramEdges');
        
        if (nodesString && edgesString) {
          // We have the diagram data but can't render it directly
          // Instead, we'll just indicate we have diagram data
          setDiagramImage('placeholder');
        }
      } catch (error) {
        console.error('Error reading diagram from localStorage:', error);
      }
    }
  }, []);

  const handleBackClick = () => {
    navigate('/model-with-ai');
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedPages = [...reportPages];
    updatedPages[currentPage].content = e.target.value;
    setReportPages(updatedPages);
  };

  const handleAddPage = (newPage: { title: string; content: string }) => {
    const updatedPages = addReportPage(reportPages, newPage);
    setReportPages(updatedPages);
    // Switch to the newly added page
    setCurrentPage(updatedPages.length - 1);
    
    toast({
      title: "Section Added",
      description: `New section "${newPage.title}" has been added to your report.`,
    });
  };

  const handleMovePage = (fromIndex: number, toIndex: number) => {
    const updatedPages = moveReportPage(reportPages, fromIndex, toIndex);
    setReportPages(updatedPages);
    
    // If we're moving the current page, update the current page index
    if (currentPage === fromIndex) {
      setCurrentPage(toIndex);
    } else if (currentPage === toIndex) {
      // If we're moving a page to the current page's position
      setCurrentPage(fromIndex);
    }
    
    toast({
      title: "Section Moved",
      description: "Report section has been rearranged successfully.",
    });
  };

  const handleDeletePage = (index: number) => {
    const updatedPages = deleteReportPage(reportPages, index);
    setReportPages(updatedPages);
    
    // If we're deleting the current page, update the current page index
    if (currentPage >= updatedPages.length) {
      setCurrentPage(Math.max(0, updatedPages.length - 1));
    }
    
    toast({
      title: "Section Deleted",
      description: "Report section has been removed from your report.",
    });
  };

  const handleDownload = async () => {
    if (!reportRef.current) return;
    
    try {
      const pdf = generatePDF(reportPages, diagramImage);
      
      // Save the PDF
      pdf.save('security-assessment-report.pdf');
      
      toast({
        title: "Report Downloaded",
        description: "Your security assessment report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading your report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="mt-16 space-y-6 bg-gradient-to-br from-blue-50/80 via-white to-green-50/60 min-h-screen rounded-lg p-6">
        <TitleCard 
          isEditing={isEditing} 
          setIsEditing={setIsEditing} 
          handleDownload={handleDownload} 
        />

        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handleBackClick}
            className="mb-4 transition-all hover:bg-securetrack-lightpurple text-securetrack-purple border-securetrack-purple/50 hover:text-white hover:border-securetrack-purple shadow-sm hover:-translate-y-1 duration-300 animate-fade-in"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <Cpu className="mr-2 h-4 w-4" />
            Back to AI Design
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <ReportNavigation 
            reportPages={reportPages} 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage}
            onAddPage={handleAddPage}
            onMovePage={handleMovePage}
            onDeletePage={handleDeletePage}
          />
          
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
    </Layout>
  );
};

export default GenerateReport;