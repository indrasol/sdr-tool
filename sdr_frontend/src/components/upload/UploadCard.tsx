import React, { useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "../ui/use-toast";
import { useUploadStore } from "../../stores/uploadStore";
import { useRiskAnalyzerStore } from "../../stores/riskAnalyzerStore";

interface UploadCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accept?: string;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

const UploadCard = ({
  icon: Icon,
  title,
  description,
  accept,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  isLoading,
}: UploadCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [localIsLoading, setIsLoading] = useState(false);
  const setUploadData = useUploadStore((state) => state.setData);
  const setRiskData = useRiskAnalyzerStore((state) => state.setRiskData);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    try {
      console.log('Uploading file:', file.name, file.type, file.size);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
        },
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || 'Upload failed');
        } catch (e) {
          throw new Error(`Upload failed: ${responseText}`);
        }
      }

      const data = JSON.parse(responseText);
      setUploadData(data);
      
      toast({
        title: "Upload Successful",
        description: "Your document has been processed successfully.",
      });

      navigate("/risk-analyzer");
    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = "Something went wrong";
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        errorMessage = "Cannot connect to server. Please check if the server is running.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length) {
      await handleUpload(files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: title === "Document Upload" ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: title === "Document Upload" ? 0.2 : 0.4 }}
    >
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={handleDrop}
        className={`relative group h-64 rounded-xl border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-secondary/30 hover:border-primary/50"
        } bg-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl`}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept={accept}
          multiple={false}
          disabled={localIsLoading}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="mb-4">
            {localIsLoading ? (
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            ) : (
              <Icon className="w-10 h-10 text-secondary group-hover:text-primary transition-colors duration-200" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-secondary-dark text-center max-w-xs mb-4">
            {localIsLoading ? "Processing your document..." : description}
          </p>
          <Button 
            variant="outline"
            disabled={localIsLoading}
            onClick={(e) => {
              e.preventDefault();
              const fileInput = e.currentTarget.parentElement?.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) {
                fileInput.click();
              }
            }}
          >
            {localIsLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${title}`
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default UploadCard;