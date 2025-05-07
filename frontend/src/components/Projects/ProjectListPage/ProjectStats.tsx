import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3Icon, CheckCircle, UserCheck, Briefcase, Clock, Archive, Activity } from 'lucide-react';
import { Project } from '@/interfaces/projectInterfaces';
import { motion } from 'framer-motion';

interface ProjectStatsProps {
  allProjects: Project[];
  onStatusFilterChange: (status: string) => void;
}

const ProjectStats = ({ allProjects, onStatusFilterChange }: ProjectStatsProps) => {
  // Calculate project counts for stats cards
  const activeProjectsCount = useMemo(() => {
    return allProjects.filter(p => p.status === 'In Progress' || p.status === 'Not Started').length;
  }, [allProjects]);

  const completedProjectsCount = useMemo(() => {
    return allProjects.filter(p => p.status === 'Completed').length;
  }, [allProjects]);

  const myProjectsCount = useMemo(() => {
    // Assuming current user is "testsdr" for demo purposes
    return allProjects.filter(p => p.creator === 'testsdr').length;
  }, [allProjects]);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
      }
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <motion.div variants={itemVariants}>
        <Card className="card-hover overflow-hidden cursor-pointer shadow-sm border-gray-100" onClick={() => onStatusFilterChange('All')}>
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-poppins text-sm font-medium text-gray-600">All Projects</h3>
                <p className="text-2xl font-poppins font-semibold">{allProjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="card-hover overflow-hidden cursor-pointer shadow-sm border-gray-100" onClick={() => onStatusFilterChange('In Progress')}>
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-poppins text-sm font-medium text-gray-600">Active Projects</h3>
                <p className="text-2xl font-poppins font-semibold">{activeProjectsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="card-hover overflow-hidden cursor-pointer shadow-sm border-gray-100" onClick={() => onStatusFilterChange('Completed')}>
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-poppins text-sm font-medium text-gray-600">Completed</h3>
                <p className="text-2xl font-poppins font-semibold">{completedProjectsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card className="card-hover overflow-hidden cursor-pointer shadow-sm border-gray-100" onClick={() => onStatusFilterChange('My')}>
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-poppins text-sm font-medium text-gray-600">My Projects</h3>
                <p className="text-2xl font-poppins font-semibold">{myProjectsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProjectStats;