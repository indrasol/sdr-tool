import { Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { motion } from 'framer-motion';
import StackedRings from '@/components/ui/stacked-rings';

interface ProjectsListHeaderProps {
  onCreateProject: () => void;
  onViewTypeChange: (viewType: 'grid' | 'list') => void;
  onStatusFilterChange: (status: string) => void;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  myProjects: number;
  currentViewType: 'grid' | 'list';
}

const ProjectsListHeader = ({ 
  onCreateProject, 
  onViewTypeChange,
  onStatusFilterChange,
  totalProjects,
  activeProjects,
  completedProjects,
  myProjects,
  currentViewType = 'grid'
}: ProjectsListHeaderProps) => {
  return (
    <div className="space-y-6 animate-fade-in mb-8">
      <Card className="col-span-full bg-gradient-to-r from-blue-500/15 via-teal-500/15 to-emerald-500/15 border-none overflow-hidden animate-fade-in shadow-sm hover:shadow-md transition-all duration-300 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg 
            className="absolute top-0 left-0 h-full w-full" 
            width="100%" 
            height="100%" 
            viewBox="0 0 900 200" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="blueIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F9CF9" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#4F9CF9" stopOpacity="0.05" />
              </linearGradient>
              
              <linearGradient id="tealIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ED8B8" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#4ED8B8" stopOpacity="0.05" />
              </linearGradient>
              
              <linearGradient id="greenIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A9D86E" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#A9D86E" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            
            <g transform="translate(380, 60) scale(0.9)">
              <path d="M25,0 L50,10 L50,30 C50,45 40,55 25,60 C10,55 0,45 0,30 L0,10 L25,0 Z" 
                    fill="url(#greenIconGradient)" />
              <path d="M25,5 L45,13 L45,30 C45,42 36,50 25,55 C14,50 5,42 5,30 L5,13 L25,5 Z" 
                    stroke="#A9D86E" strokeOpacity="0.2" strokeWidth="1" fill="none" />
              <path d="M18,30 L22,35 L33,25" 
                    stroke="#A9D86E" strokeOpacity="0.3" strokeWidth="2" fill="none" />
            </g>
            
            <g transform="translate(510, 80) scale(0.8)">
              <rect x="0" y="0" width="60" height="50" rx="4" fill="url(#tealIconGradient)" />
              <rect x="0" y="0" width="60" height="10" rx="0" fill="#4ED8B8" fillOpacity="0.2" />
              <circle cx="5" cy="5" r="2" fill="#4ED8B8" fillOpacity="0.3" />
              <circle cx="12" cy="5" r="2" fill="#4ED8B8" fillOpacity="0.3" />
              <circle cx="19" cy="5" r="2" fill="#4ED8B8" fillOpacity="0.3" />
              <rect x="5" y="15" width="22" height="12" rx="2" fill="#4ED8B8" fillOpacity="0.15" />
              <rect x="32" y="15" width="22" height="12" rx="2" fill="#4ED8B8" fillOpacity="0.15" />
              <rect x="5" y="32" width="22" height="12" rx="2" fill="#4ED8B8" fillOpacity="0.15" />
              <rect x="32" y="32" width="22" height="12" rx="2" fill="#4ED8B8" fillOpacity="0.15" />
            </g>
            
            <g transform="translate(640, 100) scale(0.85)">
              <path d="M40,40 C51,40 60,31 60,20 C60,9 51,0 40,0 C36,0 32,1 29,3 C26,1 22,0 18,0 C8,0 0,8 0,18 C0,28 8,36 18,36 C22,36 25,35 28,33 C31,38 35,40 40,40 Z" 
                    fill="url(#greenIconGradient)" />
              <path d="M40,35 C48,35 55,28 55,20 C55,12 48,5 40,5" 
                    stroke="#A9D86E" strokeOpacity="0.2" strokeWidth="1.5" fill="none" />
              <path d="M18,5 C11,5 5,11 5,18 C5,25 11,31 18,31" 
                    stroke="#A9D86E" strokeOpacity="0.2" strokeWidth="1.5" fill="none" />
            </g>
          </svg>
          
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 opacity-70">
            <StackedRings className="h-48 w-48" />
          </div>
        </div>
        
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-2 rounded-lg mr-3 shadow-inner">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center">
              <h3 className="text-3xl font-semibold font-['Geneva','Segoe UI',sans-serif] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-600">
                Projects
              </h3>
              <div className="h-10 flex items-center">
                <img 
                  src="/indrabot-mascot.png" 
                  alt="Indrasol Mascot" 
                  className="h-20 w-auto object-contain opacity-35 ml-2 -my-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <p className="text-sm text-gray-600 mt-3 font-medium max-w-3xl">
            Organize, manage, and track your projects in one place.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectsListHeader;