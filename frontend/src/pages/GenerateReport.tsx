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
  deleteReportPage,
  addSubsectionAfterParent
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
      title: "Project Description",
      content: "This document provides a comprehensive security assessment of the current system infrastructure and architecture. It identifies potential security vulnerabilities, attack vectors, and recommended mitigations."
    },
    {
      title: "System Architecture Diagram",
      content: "The system architecture diagram illustrates the high-level components of the infrastructure and their relationships. This visual representation helps identify potential security boundaries and critical interfaces."
    },
    {
      title: "Data-flow Diagram",
      content: "This diagram illustrates how data moves through the system, highlighting sensitive data paths, authentication points, and trust boundaries. Understanding these flows is essential for identifying potential security vulnerabilities."
    },
    {
      title: "Entry Point",
      content: "This section identifies all possible entry points into the system, including user interfaces, APIs, service connections, and administrative access points. Each entry point represents a potential attack surface that requires appropriate security controls."
    },
    {
      title: "Model Attack Possibilities",
      content: "This section analyzes potential attack vectors against the system, including common exploitation techniques, threat actors, and their motivations. Understanding these attack possibilities helps inform appropriate defensive measures."
    },
    {
      title: "Key Risk Areas",
      content: "This section outlines the key security risk areas identified during the assessment, categorized by severity level."
    },
    {
      title: "High Risks",
      content: "Risk of attack on network and critical resource can be reduced by minimizing attack surface, isolating by critical resource by Network Segmentation and Network Segregation.\n\nRisk of information theft and reputation damage can be avoided by implementing proper Multi-Factor Authentication.\n\nRisk Summary: Risk of accessing internal network can be minimized by the use of DMZ.\n\nRisk Summary: Risk of non-repudiation and data integrity can be remediated by using proper logging, monitoring and alerting methods.\n\nIssue Summary: Human users should not process secrets. Risk of key and credential compromise can be addressed by secret management methodology.\n\nRisk of data loss or theft in cases of data breach can be addressed by encrypting the data at rest for all databases, file server, workstation or cloud.\n\nRisk Summary: Risk of all kinds of injection attacks can be addressed by implementing a) input data-validation or data filtering of malicious characters at the server side b) Escaping all special chars before inserting to datasource c) Encoding all responses which are displayed to browser."
    },
    {
      title: "Medium Risks",
      content: "This section details the medium-priority security risks identified during the assessment. These risks represent potential vulnerabilities that should be addressed but may have lower impact or lower likelihood than high risks."
    },
    {
      title: "Low Risks",
      content: "This section details the low-priority security risks identified during the assessment. While these risks represent potential vulnerabilities, they typically have lower impact or require complex exploitation chains that reduce their likelihood."
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

  const handleAddSubsection = (parentIndex: number, newSubsection: { title: string; content: string }) => {
    const updatedPages = addSubsectionAfterParent(reportPages, parentIndex, newSubsection);
    setReportPages(updatedPages);
    
    // Find the index of the newly added subsection
    const newIndex = parentIndex + 1;
    // Switch to the newly added subsection
    setCurrentPage(newIndex);
    
    toast({
      title: "Sub-section Added",
      description: `New sub-section "${newSubsection.title}" has been added under "${reportPages[parentIndex].title}".`,
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
            className="mb-4 transition-all bg-gradient-to-r from-blue-50/70 to-purple-50/70 border-blue-100 hover:border-blue-200 text-blue-600 hover:text-blue-700 hover:from-blue-100/80 hover:to-purple-100/80 hover:shadow-sm"
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
            onAddSubsection={handleAddSubsection}
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
