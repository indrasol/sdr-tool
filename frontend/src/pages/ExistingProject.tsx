import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';

const ExistingProject = () => {
  const onDrop = useCallback((acceptedFiles) => {
    console.log(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-6">
      <Card className="w-full max-w-lg shadow-lg rounded-2xl p-6 bg-white">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
          Upload Existing Project
        </h1>
        <CardContent>
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg transition-all duration-300 cursor-pointer ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-100'
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-12 h-12 text-gray-500 mb-2" />
            {isDragActive ? (
              <p className="text-blue-500 font-medium">Drop the files here ...</p>
            ) : (
              <p className="text-gray-500">Drag & drop files here, or click to select</p>
            )}
          </div>
          <Button variant="default" size="lg" className="w-full mt-6">
            Upload Files
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExistingProject;