import { Project } from '@/interfaces/projectInterfaces';
import ProjectFilters from '@/components/Projects/ProjectFilters';
import EmptyProjectsState from '@/components/Projects/EmptyProjectsState';
import ProjectsGridView from '@/components/Projects/ProjectsGridView';
import ProjectsPagination from '@/components/Projects/ProjectsPagination';
import type { ProjectStatus, ProjectPriority } from '@/types/projectTypes';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  ArrowUpDown, 
  ArrowDown,
  ArrowUp,
  Calendar,
  Clock,
  Search, 
  X,
  RefreshCw,
  Grid,
  List
} from 'lucide-react';
import { useState } from 'react';
import { Loading } from '../../ui/loading';
import { PaginationState } from '../../../interfaces/projectInterfaces';
import { cn } from "@/lib/utils";

interface ProjectContentProps {
  projects: Project[];
  allProjects: Project[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: ProjectStatus | 'All';
  setStatusFilter: (status: ProjectStatus | 'All') => void;
  priorityFilter: ProjectPriority | 'All';
  setPriorityFilter: (priority: ProjectPriority | 'All') => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  onProjectClick: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject?: (projectId: string) => void;
  onEditProject?: (projectId: string) => void;
  viewType?: 'grid' | 'list';
  isLoading?: boolean;
  error?: string | null;
  pagination?: PaginationState;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  onPageSizeChange?: (size: number) => void;
  onRefresh?: () => void;
  onViewTypeChange?: (viewType: 'grid' | 'list') => void;
}

// Add a consistent button style variable
const filterButtonStyles = `
  bg-gradient-to-r from-blue-50/70 to-purple-50/70
  border-blue-100 hover:border-blue-200
  text-blue-600 hover:text-blue-700
  hover:from-blue-100/80 hover:to-purple-100/80
  hover:shadow-sm
  transition-all duration-300
`;

const activeButtonStyles = `
  bg-gradient-to-r from-blue-100/90 to-purple-100/90
  border-blue-200
  text-blue-700
`;

// Tooltip gradient style for hover cards
const tooltipGradientStyle = `
  bg-gradient-to-r from-blue-500/80 to-purple-500/80 
  backdrop-filter: blur(8px)
  border border-white/20
  shadow-lg
  text-white
  font-medium
  py-1 px-2
  rounded
`;

const ProjectContent = ({
  projects,
  allProjects,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  clearFilters,
  hasActiveFilters,
  onProjectClick,
  onCreateProject,
  onDeleteProject,
  onEditProject,
  viewType = 'grid',
  isLoading = false,
  error = null,
  pagination,
  onNextPage,
  onPreviousPage,
  onPageSizeChange,
  onRefresh,
  onViewTypeChange
}: ProjectContentProps) => {
  // Sorting state - add a third state for "none"
  const [sortField, setSortField] = useState<string>('created_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | 'none'>('desc');

  // Handle sort field change with three-state cycling
  const handleSortFieldChange = (field: string) => {
    if (sortField === field) {
      // Cycle through sort states: desc -> asc -> none -> desc
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('none');
      } else {
        setSortDirection('desc');
      }
    } else {
      setSortField(field);
      // Default to descending for dates, ascending for text
      const isDateField = field === 'created_date' || field === 'due_date';
      setSortDirection(isDateField ? 'desc' : 'asc');
    }
  };

  // Sorted projects
  const sortedProjects = [...projects].sort((a, b) => {
    if (!sortField || sortDirection === 'none') return 0;
    
    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } 
    else if (sortField === 'priority') {
      const priorityRank = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
      return sortDirection === 'asc' 
        ? priorityRank[a.priority] - priorityRank[b.priority]
        : priorityRank[b.priority] - priorityRank[a.priority];
    }
    else if (sortField === 'created_date') {
      return sortDirection === 'asc'
        ? new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
        : new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    }
    else if (sortField === 'due_date') {
      // Handle cases where dueDate might be undefined
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return sortDirection === 'asc' ? 1 : -1;
      if (!b.dueDate) return sortDirection === 'asc' ? -1 : 1;
      
      return sortDirection === 'asc'
        ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
    else if (sortField === 'status') {
      const statusRank = { 'NOT_STARTED': 1, 'PLANNED': 2, 'IN_PROGRESS': 3, 'ON_HOLD': 4, 'COMPLETED': 5 };
      return sortDirection === 'asc' 
        ? statusRank[a.status] - statusRank[b.status]
        : statusRank[b.status] - statusRank[a.status];
    }
    return 0;
  });

  // Helper function to get correct arrow icon for sort buttons
  const getSortArrows = (field: string) => {
    if (sortField !== field) {
      // Not sorting by this field - show double arrows
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-blue-600" />;
    } else if (sortDirection === 'asc') {
      // Ascending order
      return <ArrowUp className="h-3.5 w-3.5 ml-1 text-blue-600" />;
    } else if (sortDirection === 'desc') {
      // Descending order
      return <ArrowDown className="h-3.5 w-3.5 ml-1 text-blue-600" />;
    } else {
      // No sort (reset state)
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-blue-600" />;
    }
  };

  // Calculate pagination information
  const startItem = pagination ? pagination.offset + 1 : 0;
  const endItem = pagination ? Math.min(pagination.offset + projects.length, pagination.total) : projects.length;
  const totalItems = pagination ? pagination.total : allProjects.length;
  
  const hasPrevPage = pagination ? pagination.offset > 0 : false;
  const hasNextPage = pagination ? (pagination.offset + pagination.limit) < pagination.total : false;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start justify-between">
        {/* Left side - Filters section (allows vertical growth) */}
        <div className="w-full md:w-auto flex-shrink-0 mb-2 md:mb-0 overflow-x-hidden">
          <ProjectFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            onCreateProject={onCreateProject}
            onViewTypeChange={onViewTypeChange}
            currentViewType={viewType}
            sortBy={sortField}
            setSortBy={handleSortFieldChange}
          />
        </div>
        
        {/* Right side - View controls (fixed position) */}
        <div className="flex items-center gap-2 mt-2 md:mt-0 flex-shrink-0 md:ml-auto">
          {/* Sort buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm text-gray-600 font-medium whitespace-nowrap">Sort by : </span>
            <div className="flex flex-wrap gap-1 mr-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSortFieldChange('name')}
                className={cn(
                  "h-9 gap-1 px-2",
                  filterButtonStyles,
                  sortField === 'name' && sortDirection !== 'none' ? activeButtonStyles : ""
                )}
              >
                Name
                {getSortArrows('name')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSortFieldChange('priority')}
                className={cn(
                  "h-9 gap-1 px-2 hidden sm:flex",
                  filterButtonStyles,
                  sortField === 'priority' && sortDirection !== 'none' ? activeButtonStyles : ""
                )}
              >
                Priority
                {getSortArrows('priority')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSortFieldChange('created_date')}
                className={cn(
                  "h-9 gap-1 px-2 hidden md:flex",
                  filterButtonStyles,
                  sortField === 'created_date' && sortDirection !== 'none' ? activeButtonStyles : ""
                )}
              >
                Created
                {getSortArrows('created_date')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSortFieldChange('due_date')}
                className={cn(
                  "h-9 gap-1 px-2 hidden lg:flex",
                  filterButtonStyles,
                  sortField === 'due_date' && sortDirection !== 'none' ? activeButtonStyles : ""
                )}
              >
                Due Date
                {getSortArrows('due_date')}
              </Button>
            </div>
          </div>
          
          {/* Vertical divider */}
          <div className="h-7 border-l border-gray-200 mx-1 hidden sm:block"></div>
          
          {/* View Type Buttons */}
          {onViewTypeChange && (
            <div className="flex items-center">
              <span className="text-xs md:text-sm text-gray-600 font-medium whitespace-nowrap mr-1">View : </span>
              <div className="flex rounded-md border border-input overflow-hidden h-9">
                <HoverCard openDelay={100} closeDelay={300}>
                  <HoverCardTrigger asChild>
                    <Button 
                      variant={viewType === 'grid' ? "default" : "ghost"}
                      size="sm"
                      onClick={() => onViewTypeChange('grid')}
                      className={`rounded-none px-1 ${viewType === 'grid' ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' : 'text-blue-600 hover:bg-gradient-to-r from-blue-50/70 to-purple-50/70 hover:text-blue-700 transition-colors duration-300'}`}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent align="center" side="top" sideOffset={5} className="py-1 px-2 bg-gradient-to-r from-violet-100/90 to-indigo-50/90 backdrop-blur border border-indigo-100/50 text-indigo-700 text-xs font-medium z-50 shadow-sm">
                    Grid View
                  </HoverCardContent>
                </HoverCard>
                
                <HoverCard openDelay={100} closeDelay={300}>
                  <HoverCardTrigger asChild>
                    <Button 
                      variant={viewType === 'list' ? "default" : "ghost"}
                      size="sm"
                      onClick={() => onViewTypeChange('list')}
                      className={`rounded-none px-1 ${viewType === 'list' ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' : 'text-blue-600 hover:bg-gradient-to-r from-blue-50/70 to-purple-50/70 hover:text-blue-700 transition-colors duration-300'}`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent align="center" side="top" sideOffset={5} className="py-1 px-2 bg-gradient-to-r from-violet-100/90 to-indigo-50/90 backdrop-blur border border-indigo-100/50 text-indigo-700 text-xs font-medium z-50 shadow-sm">
                    Stacked View
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
          )}
          
          {/* Vertical divider for refresh button */}
          {onRefresh && onViewTypeChange && (
            <div className="h-7 border-l border-gray-200 mx-2 hidden md:block"></div>
          )}
          
          {/* Refresh button */}
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-9 w-9 hidden md:flex"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading && projects.length === 0 ? (
          <motion.div
            key="loading-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center py-20"
          >
            <Loading message="Loading projects..." size="large" />
          </motion.div>
        ) : error ? (
          <motion.div
            key="error-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-red-50 border border-red-200 rounded-md p-4 text-center"
          >
            <p className="text-red-600 mb-2">{error}</p>
            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </motion.div>
        ) : sortedProjects.length === 0 ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <EmptyProjectsState onCreateProject={onCreateProject} />
          </motion.div>
        ) : (
          <motion.div
            key={`projects-${viewType}-${sortField}-${sortDirection}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="transition-all duration-300 relative"
          >
            {isLoading && (
              <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-10 rounded-md">
                <Loading size="medium" />
              </div>
            )}
            <ProjectsGridView 
              projects={sortedProjects} 
              viewType={viewType} 
              onProjectClick={onProjectClick}
              onDeleteProject={onDeleteProject}
              onEditProject={onEditProject}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {pagination && projects.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {totalItems} projects
          </div>
          
          <ProjectsPagination 
            projectsCount={projects.length} 
            totalCount={totalItems}
            onNextPage={onNextPage}
            onPreviousPage={onPreviousPage}
            onPageSizeChange={onPageSizeChange}
            currentPage={Math.floor(pagination.offset / pagination.limit) + 1}
            pageSize={pagination.limit}
            isNextDisabled={!hasNextPage}
            isPrevDisabled={!hasPrevPage}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default ProjectContent;