import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Download, ShieldCheck } from 'lucide-react';

interface TitleCardProps {
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  handleDownload: () => Promise<void>;
}

const TitleCard: React.FC<TitleCardProps> = ({ isEditing, setIsEditing, handleDownload }) => {
  return (
    <div className="bg-gradient-to-r from-blue-500/20 via-teal-500/20 to-emerald-500/20 rounded-lg shadow-md mb-6 overflow-hidden animate-fade-in border-none relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-end pr-80 opacity-75">
          <ShieldCheck className="h-48 w-48 text-teal-500/10" />
        </div>
      </div>
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-2 rounded-lg mr-3 shadow-inner">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center">
              <h1 className="text-3xl font-semibold font-['Geneva','Segoe UI',sans-serif] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-600">
                Security Assessment Report
              </h1>
              <div className="h-10 flex items-center">
                <img 
                  src="/indrabot-mascot.png" 
                  alt="Indrasol Mascot" 
                  className="h-20 w-auto object-contain opacity-35 ml-2 -my-10"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(!isEditing)}
              className="transition-all bg-gradient-to-r from-blue-50/70 to-purple-50/70 border-blue-100 hover:border-blue-200 text-blue-600 hover:text-blue-700 hover:from-blue-100/80 hover:to-purple-100/80 hover:shadow-sm"
            >
              <Edit className="mr-2 h-4 w-4" />
              {isEditing ? "View Mode" : "Edit"}
            </Button>
            <Button 
              onClick={handleDownload}
              className="bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 shadow-md transition-all duration-300"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-3 font-medium max-w-3xl">
          Comprehensive analysis and actionable recommendations based on your infrastructure design
        </p>
      </div>
    </div>
  );
};

export default TitleCard;