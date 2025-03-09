
import jsPDF from 'jspdf';

interface ReportPage {
  title: string;
  content: string;
}

export const generatePDF = (reportPages: ReportPage[], diagramImage: string | null) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add title
  pdf.setFontSize(24);
  pdf.setTextColor(124, 101, 246); // Purple color
  pdf.text('Security Assessment Report', 105, 20, { align: 'center' });
  
  // Add company name and date
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('SecureTrack Security Assessment', 20, 30);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);
  
  let yPosition = 45;
  
  // Add each page
  reportPages.forEach((page, index) => {
    if (index > 0) {
      pdf.addPage();
      yPosition = 20;
    }
    
    // Add page title with colored background
    pdf.setFillColor(124, 101, 246, 0.1); // Light purple background
    pdf.rect(10, yPosition - 5, 190, 10, 'F');
    pdf.setFontSize(16);
    pdf.setTextColor(124, 101, 246);
    pdf.text(page.title, 20, yPosition);
    yPosition += 15;
    
    // Add page content
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    
    // Split text into lines to fit on page
    const splitContent = pdf.splitTextToSize(page.content, 170);
    pdf.text(splitContent, 20, yPosition);
    
    // Add diagram to first page
    if (index === 0 && diagramImage && diagramImage !== 'placeholder') {
      try {
        // Calculate position after text
        const textHeight = pdf.getTextDimensions(splitContent).h;
        const diagramY = yPosition + textHeight + 10;
        
        pdf.addImage(diagramImage, 'PNG', 20, diagramY, 170, 100);
        
        // Add caption
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Fig 1: Security Infrastructure Diagram', 105, diagramY + 105, { align: 'center' });
      } catch (error) {
        console.error('Error adding image to PDF:', error);
      }
    }
  });
  
  // Add footer with page numbers
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    pdf.text('SecureTrack Confidential', 20, 285);
  }
  
  return pdf;
};

export const addReportPage = (
  pages: ReportPage[], 
  newPage: ReportPage
): ReportPage[] => {
  return [...pages, newPage];
};

export const moveReportPage = (
  pages: ReportPage[], 
  fromIndex: number, 
  toIndex: number
): ReportPage[] => {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= pages.length || toIndex >= pages.length) {
    return pages;
  }
  
  const result = [...pages];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  
  return result;
};

export const deleteReportPage = (
  pages: ReportPage[], 
  index: number
): ReportPage[] => {
  if (index < 0 || index >= pages.length) {
    return pages;
  }
  
  const result = [...pages];
  result.splice(index, 1);
  
  return result;
};

export const generateTableOfContents = (pages: ReportPage[]): string => {
  let tableOfContents = "Table of Contents\n\n";
  
  pages.forEach((page, index) => {
    tableOfContents += `${index + 1}. ${page.title}\n`;
  });
  
  return tableOfContents;
};