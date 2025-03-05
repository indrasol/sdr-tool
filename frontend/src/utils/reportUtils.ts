
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
  
  // Add content
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  
  let yPosition = 40;
  
  // Add each page
  reportPages.forEach((page, index) => {
    if (index > 0) {
      pdf.addPage();
      yPosition = 20;
    }
    
    // Add page title
    pdf.setFontSize(16);
    pdf.setTextColor(124, 101, 246);
    pdf.text(page.title, 20, yPosition);
    yPosition += 10;
    
    // Add page content
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    
    // Split text into lines to fit on page
    const splitContent = pdf.splitTextToSize(page.content, 170);
    pdf.text(splitContent, 20, yPosition);
    
    // Add diagram to first page
    if (index === 0 && diagramImage && diagramImage !== 'placeholder') {
      try {
        pdf.addImage(diagramImage, 'PNG', 20, 100, 170, 100);
      } catch (error) {
        console.error('Error adding image to PDF:', error);
      }
    }
  });
  
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