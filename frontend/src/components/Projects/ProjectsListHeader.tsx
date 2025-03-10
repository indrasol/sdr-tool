
import { Download, Grid, List, PlusCircle, Shield, Search, BarChart3Icon, UserCheck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Project } from '@/interfaces/projectInterfaces';
import { motion } from 'framer-motion';

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
    <div className="space-y-6 animate-fade-in font-sans mb-8">
      <Card className="mb-6 animate-fade-up glass-effect overflow-hidden border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center">
              <motion.div 
                className="h-14 w-14 rounded-full bg-securetrack-purple/10 flex items-center justify-center mr-4"
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(124, 101, 246, 0.2)' }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Shield className="h-7 w-7 text-securetrack-purple" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-securetrack-purple to-securetrack-darkpurple bg-clip-text text-transparent">Project Dashboard</h2>
                <p className="text-muted-foreground">Manage and track your security projects</p>
              </div>
            </div>
            
            <div className="flex gap-3 self-end">             
              <div className="flex rounded-md border border-input overflow-hidden">
                <Button 
                  variant={currentViewType === 'grid' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onViewTypeChange('grid')}
                  className={`rounded-none ${currentViewType === 'grid' ? 'bg-securetrack-purple text-white' : 'text-muted-foreground'}`}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button 
                  variant={currentViewType === 'list' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onViewTypeChange('list')}
                  className={`rounded-none ${currentViewType === 'list' ? 'bg-securetrack-purple text-white' : 'text-muted-foreground'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={onCreateProject} 
                  className="bg-securetrack-purple text-white hover:bg-securetrack-darkpurple transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectsListHeader;