import { FileUp, FileSearch } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import UploadCard from "./upload/UploadCard";
import UploadHeader from "./upload/UploadHeader";

const UploadSection = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const navigate = useNavigate();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const convertDrawioToImage = async (xmlContent: string): Promise<string> => {
    try {
      // Using draw.io conversion API
      const response = await fetch('https://convert.diagrams.net/node/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'png',
          xml: xmlContent,
        }),
      });

      if (!response.ok) throw new Error('Conversion failed');

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Conversion error:', error);
      throw new Error('Failed to convert diagram');
    }
  };

  const convertToStandardFormat = async (file: File): Promise<File> => {
    setIsConverting(true);
    try {
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.drawio') || fileName.endsWith('.xml')) {
        // Handle Draw.io files
        const xmlContent = await file.text();
        const imageUrl = await convertDrawioToImage(xmlContent);
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return new File([blob], `${file.name}.png`, { type: 'image/png' });
      }
      
      else if (fileName.endsWith('.lucidchart')) {
        // Handle Lucidchart files
        // You'll need to implement Lucidchart conversion logic
        throw new Error('Lucidchart conversion not implemented yet');
      }
      
      else if (fileName.endsWith('.json') || fileName.endsWith('.td')) {
        // Handle Threat Dragon files
        const jsonContent = await file.text();
        const diagram = JSON.parse(jsonContent);
        // Convert diagram to image (you'll need to implement this)
        throw new Error('Threat Dragon conversion not implemented yet');
      }
      
      else if (fileName.endsWith('.vsdx')) {
        // Handle Visio files
        // You'll need to implement Visio conversion logic
        throw new Error('Visio conversion not implemented yet');
      }
      
      return file; // Return original file if no conversion needed
    } finally {
      setIsConverting(false);
    }
  };

  const validateDFDFile = (file: File): boolean => {
    const validExtensions = [
      '.drawio',     // Draw.io
      '.xml',        // Draw.io XML format
      '.lucidchart', // Lucidchart
      '.json',       // Threat Dragon
      '.td',         // Threat Dragon
      '.vsdx',       // Microsoft Visio
      '.mtm',        // Microsoft Threat Modeling Tool
      '.tm7'         // Microsoft Threat Modeling Tool
    ];
    
    const fileName = file.name.toLowerCase();
    const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidExtension) {
      toast.error(`Invalid file type. Please upload files from supported tools: Draw.io, Lucidchart, Threat Dragon, or Microsoft Threat Modeling Tool`);
      return false;
    }
    return true;
  };

  const handleFiles = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      if (validateDFDFile(file)) {
        try {
          const convertedFile = await convertToStandardFormat(file);
          
          // Now send the converted file to your Flowise backend
          const formData = new FormData();
          formData.append('file_input', convertedFile);
          formData.append('question', 'Analyze this DFD');
          formData.append('history', JSON.stringify([]));
          formData.append('content', 'Initial DFD analysis request');
          formData.append('sessionId', 'session_' + Date.now());

          const response = await fetch('http://localhost:3000/api/v1/prediction/a5740c2f-7179-4596-a962-b40f42eb7935', {
            method: 'POST',
            body: JSON.stringify({
              question: 'Analyze this DFD',
              history: [],
              content: 'Initial DFD analysis request',
              sessionId: 'session_' + Date.now(),
              file_input: convertedFile
            }),
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          toast.success(`${file.name} processed successfully`);
          navigate("/risk-analyzer");
        } catch (error) {
          console.error('Processing error:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to process file');
        }
      }
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-accent/50 to-background px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <UploadHeader />
        <div className="grid md:grid-cols-2 gap-8">
          <UploadCard
            icon={FileUp}
            title="Document Upload"
            description="Drop your Design here. It can be an image or a document"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileChange={(e) => handleFiles(Array.from(e.target.files || []))}
            isLoading={isConverting}
          />
          <UploadCard
            icon={FileSearch}
            title="DFD Upload"
            description="Upload DFDs from Draw.io, Lucidchart, Threat Dragon, or Microsoft Threat Modeling Tool"
            accept=".drawio,.xml,.lucidchart,.json,.td,.vsdx,.mtm,.tm7"
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileChange={(e) => handleFiles(Array.from(e.target.files || []))}
            isLoading={isConverting}
          />
        </div>
      </div>
    </section>
  );
};

export default UploadSection;