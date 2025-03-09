
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Download, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TitleCardProps {
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  handleDownload: () => Promise<void>;
}

const TitleCard: React.FC<TitleCardProps> = ({ isEditing, setIsEditing, handleDownload }) => {
  return (
    <div className="bg-gradient-to-r from-[#f0f4ff] via-[#e6eeff] to-[#eef1ff] rounded-lg shadow-md mb-6 overflow-hidden animate-fade-in glass-effect border-t-4 border-t-securetrack-purple">
      <div className="p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-securetrack-purple/10 p-3 rounded-full shadow-md pulse">
              <ShieldCheck className="h-6 w-6 text-securetrack-purple" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-800 font-playfair">Security Assessment Report</h1>
              <p className="text-gray-600 font-light max-w-2xl">
                Comprehensive analysis and actionable recommendations based on your infrastructure design
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(!isEditing)}
              className="mb-4 transition-all hover:bg-securetrack-lightpurple text-securetrack-purple border-securetrack-purple/50 hover:text-white hover:border-securetrack-purple shadow-sm hover:-translate-y-1 duration-300 animate-fade-in"
            >
              <Edit className="mr-2 h-4 w-4" />
              {isEditing ? "View Mode" : "Edit"}
            </Button>
            <Button 
              onClick={handleDownload}
              className="bg-securetrack-purple text-white hover:bg-securetrack-purple/90 shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleCard;