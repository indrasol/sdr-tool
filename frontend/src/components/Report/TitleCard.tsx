
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
    <div className="bg-gradient-to-r from-securetrack-green/10 via-securetrack-green/5 to-securetrack-purple/10 rounded-lg shadow-md mb-6 overflow-hidden animate-fade-in glass-effect">
      <div className="h-2 bg-gradient-to-r from-securetrack-green to-securetrack-purple/50"></div>
      <div className="p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-securetrack-green/10 p-3 rounded-full shadow-md pulse">
              <ShieldCheck className="h-6 w-6 text-securetrack-green" />
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
              className="bg-white/80 text-securetrack-green border-securetrack-green/30 hover:bg-securetrack-green/10 shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <Edit className="mr-2 h-4 w-4" />
              {isEditing ? "View Mode" : "Edit"}
            </Button>
            <Button 
              onClick={handleDownload}
              className="bg-securetrack-green text-white hover:bg-securetrack-green/90 font-medium shadow-md transition-all duration-300 hover:-translate-y-1"
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