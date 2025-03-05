import { Download, Grid, ListFilter, PlusCircle, Shield, Search, BarChart3Icon, UserCheck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Project } from '@/hooks/useProjects';

interface ProjectsListHeaderProps {
  onCreateProject: () => void;
  onExportProjects: () => void;
  onViewTypeChange: (viewType: 'grid' | 'list') => void;
  onStatusFilterChange: (status: string) => void;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  myProjects: number;
}

const ProjectsListHeader = ({ 
  onCreateProject, 
  onExportProjects, 
  onViewTypeChange,
  onStatusFilterChange,
  totalProjects,
  activeProjects,
  completedProjects,
  myProjects
}: ProjectsListHeaderProps) => {
  return (
    <div className="space-y-6 animate-fade-in font-sans mb-8">
      <Card className="mb-6 animate-fade-up glass-effect overflow-hidden border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center">
              <div className="h-14 w-14 rounded-full bg-securetrack-purple/10 flex items-center justify-center transition-all duration-300 group-hover:bg-securetrack-purple/20 group-hover:scale-110 mr-4">
                <Shield className="h-7 w-7 text-securetrack-purple" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Project Dashboard</h2>
                <p className="text-muted-foreground">Manage and track your security projects</p>
              </div>
            </div>
            
            <div className="flex gap-3 self-end">
              <Button 
                onClick={onExportProjects} 
                variant="outline" 
                className="transition-all duration-300 hover:border-securetrack-purple hover:text-securetrack-purple"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="transition-all duration-300 hover:border-securetrack-purple hover:text-securetrack-purple"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    View Options
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <DropdownMenuItem onClick={() => onViewTypeChange('grid')} className="cursor-pointer hover:bg-securetrack-purple/10">
                    <Grid className="h-4 w-4 mr-2 text-securetrack-purple" />
                    Grid View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewTypeChange('list')} className="cursor-pointer hover:bg-securetrack-purple/10">
                    <ListFilter className="h-4 w-4 mr-2 text-securetrack-purple" />
                    List View
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onExportProjects} className="cursor-pointer hover:bg-securetrack-purple/10">
                    <Download className="h-4 w-4 mr-2 text-securetrack-purple" />
                    Export Projects
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                onClick={onCreateProject} 
                className="bg-securetrack-purple text-white hover:bg-securetrack-darkpurple transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Removed duplicate stats cards from here */}
    </div>
  );
};

export default ProjectsListHeader;