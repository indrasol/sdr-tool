import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { TypeAnimation } from 'react-type-animation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const GenerateReport = () => {

  const [showFooter, setShowFooter] = useState(true);
  const [reportContent, setReportContent] = useState({
    summary: '',
    imageUrl: '',
    gaps: [],
    recommendations: [],
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching report data
    setTimeout(() => {
      setReportContent({
        summary: 'This report has identified 3 critical security gaps and provides 3 actionable recommendations to improve your architecture\'s security posture.',
        imageUrl: 'https://cs.ccsu.edu/~stan/classes/CS410/Notes16/images/06-repository_architecture.png',
        // imageUrl: 'https://corporate-assets.lucid.co/chart/ee694582-6363-44ea-b6cb-fba0876665a9.png?v=1707851858614',
        // imageUrl: 'https://usabilitygeek.com/wp-content/uploads/2014/05/architecture-design-inspiration-lead.jpg',
        gaps: [
          'Unencrypted data transfer detected in API endpoints',
          'Weak authentication mechanism in user login',
          'Lack of input validation leading to potential injection attacks',
        ],
        recommendations: [
          'Enable TLS encryption for all API communications',
          'Implement multi-factor authentication (MFA) for enhanced security',
          'Add server-side input validation to prevent injection attacks',
        ],
      });
      setIsLoading(false);
    }, 1000); // Simulate a 1.5-second delay for report generation
  }, []);


  const handleDownloadPDF = () => {
    // Get the container element with all report content
    const contentElement = document.getElementById('report-content');
    const imageElement = document.getElementById('report-image') as HTMLImageElement;
  
    if (!contentElement) {
      console.error("Error: Element with ID 'report-content' not found.");
      alert("Cannot generate PDF: Report content is not available.");
      return;
    }

    // Verify that it’s an HTMLImageElement
    if (!(imageElement instanceof HTMLImageElement)) {
        console.error("Error: Element with ID 'report-image' is not an image element.");
        alert("Cannot generate PDF: Report content is not an image.");
        return;
    }
  
    if (contentElement.offsetWidth === 0 || contentElement.offsetHeight === 0) {
      console.warn("Warning: Element with ID 'report-content' is not visible.");
      alert("Cannot generate PDF: Report content is not visible.");
      return;
    }
  
    // Get the image element to ensure it’s loaded
    // const imageElement = document.getElementById('report-image') as HTMLImageElement;
    if (imageElement && imageElement.complete && imageElement.naturalHeight !== 0) {
      const footer = document.querySelector("#footer-buttons"); // Adjust selector
      footer.classList.add("pdf-hidden");
        // Image is loaded, proceed with capture
      html2canvas(contentElement, { scale: 2 }).then((canvas) => {
        footer.classList.remove("pdf-hidden");
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 190; // Width in mm, leaving 10mm margins
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
  
        // Add the image to the PDF, handling multiple pages if needed
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
  
        while (heightLeft > 0) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
  
        // Generate PDF Blob and open in new tab
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
      }).catch((error) => {
        console.error("Error generating PDF:", error);
        alert("An error occurred while generating the PDF. Please try again.");
      });
    } else {
      console.error("Error: Image is not loaded or invalid.");
      alert("Cannot generate PDF: The report image is not loaded. Please wait and try again.");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F8FAFC] to-[#FFFFFF] p-6">
      <div id = "report-content" className="w-full max-w-5xl p-6 bg-white border border-[#E5E7EB] rounded-lg shadow-lg">
        {/* Header */}
        <h1 className="text-2xl font-bold text-[#6B5BFF] mb-2">Security Architecture Report</h1>
        <p className="text-sm text-[#9CA3AF] mb-4">Generated on: {new Date().toLocaleDateString()}</p>

        {/* Image Section with Loading State */}
        <div className="mb-4 w-full h-64 flex items-center justify-center">
          {isLoading ? (
            <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
              <p className="text-gray-500">Loading image...</p>
            </div>
          ) : (
            <img
              id="report-image"
              src={reportContent.imageUrl}
              alt="ReactFlow Nodes"
              className="w-full max-h-64 object-contain rounded-md border border-gray-200 shadow-sm"
              onLoad={() => console.log("Image loaded successfully")}
              onError={() => console.error("Image failed to load")}
            />
          )}
        </div>

        {/* Summary with Typing Effect */}
        <div className="mb-6 p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-md min-h-[100px] overflow-auto">
          {!isLoading && (
            <TypeAnimation
              sequence={[reportContent.summary]}
              wrapper="p"
              cursor={false}
              speed={45}
              style={{ fontSize: '16px', color: '#4B5EAA', whiteSpace: 'pre-wrap' }}
            />
          )}
        </div>

        {/* Gaps and Recommendations Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="text-lg font-bold text-orange-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Gaps Identified
            </h2>
            <ul className="list-disc pl-5 mt-2 text-gray-800">
              {reportContent.gaps.map((gap, index) => (
                <li key={index} className="flex items-start gap-2 mb-2">
                    <AlertCircle className="text-orange-500 h-5 w-5 mt-0.5" />
                    <TypeAnimation
                    sequence={[gap]}
                    wrapper="span"
                    cursor={false}
                    speed={50}
                    style={{ fontSize: '16px', color: '#4B5EAA' }}
                    />
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="text-lg font-bold text-green-500 flex items-center gap-2">
              <Shield className="w-5 h-5" /> Secure Recommendations
            </h2>
            <ol className="list-decimal pl-5 mt-2 text-gray-800">
              {reportContent.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 mb-2">
                  <CheckCircle className="text-green-500 h-5 w-5 mt-0.5" />
                  <TypeAnimation
                    sequence={[rec]}
                    wrapper="span"
                    cursor={false}
                    speed={50}
                    style={{ fontSize: '16px', color: '#4B5EAA' }}
                  />
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Footer Buttons */}
        <div id = "footer-buttons" className="flex justify-end gap-2">
          <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-300">
            Edit Report
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-300"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateReport;