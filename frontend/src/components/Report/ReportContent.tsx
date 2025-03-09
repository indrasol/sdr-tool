
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import TypewriterText from '@/components/AI/TypewriterText';
import { ShieldCheck } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ReportPage {
  title: string;
  content: string;
}

interface ReportContentProps {
  reportPages: ReportPage[];
  currentPage: number;
  isEditing: boolean;
  handleContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  diagramImage: string | null;
  reportRef: React.RefObject<HTMLDivElement>;
}

const ReportContent: React.FC<ReportContentProps> = ({
  reportPages,
  currentPage,
  isEditing,
  handleContentChange,
  diagramImage,
  reportRef
}) => {
  return (
    <div className="col-span-10">
      <Card className="h-[calc(100vh-280px)] min-h-[500px] border-securetrack-lightpurple/20 overflow-auto shadow-md bg-gradient-to-r from-[#f8f9fc] via-white to-[#f5f2fc]" ref={reportRef}>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-black font-playfair">{reportPages[currentPage].title}</h2>
          {isEditing ? (
            <Textarea
              className="w-full h-[calc(100vh-400px)] min-h-[350px] p-4 border rounded-md focus:border-securetrack-lightpurple focus:ring-1 focus:ring-securetrack-lightpurple outline-none font-inter resize-none bg-white/80"
              value={reportPages[currentPage].content}
              onChange={handleContentChange}
              placeholder="Edit report content..."
            />
          ) : (
            <div className="prose max-w-none font-inter min-h-[350px] text-gray-700">
              <TypewriterText text={reportPages[currentPage].content} />
              
              {/* Display diagram in the first page */}
              {currentPage === 0 && diagramImage && (
                <div className="mt-6 border rounded-md p-4 bg-securetrack-lightpurple/5 border-securetrack-lightpurple/20 shadow-sm">
                  <h3 className="text-lg font-semibold mb-2 text-black">Infrastructure Diagram</h3>
                  {diagramImage === 'placeholder' ? (
                    <div className="text-center p-8 bg-securetrack-lightpurple/5 rounded-md">
                      <ShieldCheck className="w-12 h-12 text-securetrack-lightpurple mx-auto mb-2" />
                      <p className="text-gray-700">Security infrastructure diagram (captured from design)</p>
                    </div>
                  ) : (
                    <img 
                      src={diagramImage} 
                      alt="Security Infrastructure Diagram" 
                      className="w-full max-h-[300px] object-contain border border-securetrack-lightpurple/10 rounded-md shadow-sm" 
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportContent;