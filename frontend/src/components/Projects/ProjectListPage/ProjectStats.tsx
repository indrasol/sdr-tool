
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3Icon, CheckCircle, UserCheck } from 'lucide-react';
import { Project } from '@/hooks/useProjects';

interface ProjectStatsProps {
  allProjects: Project[];
  onStatusFilterChange: (status: string) => void;
}

const ProjectStats = ({ allProjects, onStatusFilterChange }: ProjectStatsProps) => {
  // Calculate project counts for stats cards
  const activeProjectsCount = useMemo(() => {
    return allProjects.filter(p => p.status === 'In Progress' || p.status === 'Started').length;
  }, [allProjects]);

  const completedProjectsCount = useMemo(() => {
    return allProjects.filter(p => p.status === 'Completed').length;
  }, [allProjects]);

  const myProjectsCount = useMemo(() => {
    // Assuming current user is "testsdr" for demo purposes
    return allProjects.filter(p => p.creator === 'testsdr').length;
  }, [allProjects]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up" style={{animationDelay: '0.2s'}}>
      <Card className="card-hover overflow-hidden cursor-pointer" onClick={() => onStatusFilterChange('All')}>
        <div className="absolute top-0 left-0 w-1 h-full bg-gray-500"></div>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gray-500/10 flex items-center justify-center">
              <BarChart3Icon className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <h3 className="font-medium">All Projects</h3>
              <p className="text-2xl font-bold">{allProjects.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover overflow-hidden cursor-pointer" onClick={() => onStatusFilterChange('In Progress')}>
        <div className="absolute top-0 left-0 w-1 h-full bg-securetrack-purple"></div>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-securetrack-purple/10 flex items-center justify-center">
              <BarChart3Icon className="h-5 w-5 text-securetrack-purple" />
            </div>
            <div>
              <h3 className="font-medium">Active Projects</h3>
              <p className="text-2xl font-bold">{activeProjectsCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover overflow-hidden cursor-pointer" onClick={() => onStatusFilterChange('Completed')}>
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium">Completed</h3>
              <p className="text-2xl font-bold">{completedProjectsCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-hover overflow-hidden cursor-pointer" onClick={() => onStatusFilterChange('My')}>
        <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-medium">My Projects</h3>
              <p className="text-2xl font-bold">{myProjectsCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectStats;