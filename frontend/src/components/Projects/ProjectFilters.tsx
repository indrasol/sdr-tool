import React, { useState } from 'react';
import { Check, ChevronsUpDown, Filter, Search, X, SlidersHorizontal, Grid, List, PlusCircle, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ProjectPriority, ProjectStatus } from '../../types/projectTypes';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Add direct CSS for dropdown item hover styles
const dropdownItemStyles = `
  .dropdown-item:hover {
    background: linear-gradient(to right, rgba(219, 234, 254, 0.7), rgba(233, 213, 255, 0.7)) !important;
    color: #1e40af !important;
  }
  
  .tooltip-gradient {
    background: linear-gradient(to right, rgba(255, 255, 255, 0.8), rgba(240, 240, 250, 0.8));
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    color: #333;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .create-btn-wrapper {
    position: relative;
    display: inline-block;
  }

  .create-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-5px);
    background: linear-gradient(to right, rgba(237, 233, 254, 0.95), rgba(224, 231, 255, 0.95));
    color: #6366f1;
    font-weight: 500;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 0.75rem;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    z-index: 50;
    margin-bottom: 5px;
    border: 1px solid rgba(167, 139, 250, 0.3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    pointer-events: none;
  }

  .create-btn-wrapper:hover .create-tooltip {
    opacity: 1;
    visibility: visible;
  }

  .create-tooltip:after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: rgba(219, 234, 254, 0.9) transparent transparent transparent;
  }
`;

// Add custom CSS for filter buttons
const filterButtonStyles = `
  bg-gradient-to-r from-blue-50/70 to-purple-50/70
  border-blue-100 hover:border-blue-200
  text-blue-600 hover:text-blue-700
  hover:from-blue-100/80 hover:to-purple-100/80
  hover:shadow-sm
  transition-all duration-300
`;

// Add active button styles
const activeButtonStyles = `
  bg-gradient-to-r from-blue-100/90 to-purple-100/90
  border-blue-200
  text-blue-700
`;

// Add dropdown option styles that match the button styles
const dropdownOptionStyles = {
  base: "text-blue-600 font-inter",
  hover: "data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-600 data-[highlighted]:!text-blue-600",
  active: "bg-blue-100 text-blue-700"
};

type FilterOption = {
  value: string;
  label: string;
};

interface ProjectFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: ProjectStatus | 'All';
  setStatusFilter: (status: ProjectStatus | 'All') => void;
  priorityFilter: ProjectPriority | 'All';
  setPriorityFilter: (priority: ProjectPriority | 'All') => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  onCreateProject?: () => void;
  onViewTypeChange?: (viewType: 'grid' | 'list') => void;
  currentViewType?: 'grid' | 'list';
  sortBy?: string;
  setSortBy?: (field: string) => void;
}

const statusOptions: FilterOption[] = [
  { value: 'All', label: 'All Statuses' },
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'PLANNED', label: 'Planned' },
];

const priorityOptions: FilterOption[] = [
  { value: 'All', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  clearFilters,
  hasActiveFilters,
  onCreateProject,
  onViewTypeChange,
  currentViewType = 'grid',
  sortBy,
  setSortBy
}) => {
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [priorityOpen, setPriorityOpen] = React.useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Only show the clear filters button if status or priority filters are active (not for search alone)
  const hasFilterSelections = statusFilter !== 'All' || priorityFilter !== 'All';

  return (
    <div className="flex flex-col gap-2 w-full overflow-hidden">
      {/* Add style tag for custom dropdown styles */}
      <style>{dropdownItemStyles}</style>
      
      {/* Main filters row */}
      <div className="flex flex-wrap items-center gap-1 md:gap-2 w-full">
        {/* Create Project Button */}
        {onCreateProject && (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mr-1 flex-shrink-0"
          >
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button 
                  onClick={onCreateProject} 
                  className="bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:shadow-xl transition-all duration-300 shadow-md px-2 py-0 h-9 flex items-center justify-center font-bold text-xl"
                  aria-label="Create Project"
                >
                  +
                </Button>
              </HoverCardTrigger>
              <HoverCardContent 
                className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-2 text-sm text-indigo-700 font-medium"
                align="center"
                side="top"
              >
                Create New Project
              </HoverCardContent>
            </HoverCard>
          </motion.div>
        )}

        {/* Vertical divider */}
        <div className="h-7 border-l border-gray-200 mx-2 hidden sm:block flex-shrink-0"></div>

        <motion.div 
          className={cn(
            "relative transition-all duration-300 ease-in-out flex-shrink-1",
            // Slightly increased width while maintaining layout
            isSearchFocused || searchTerm 
              ? "w-[180px] sm:w-[200px] md:w-[220px] lg:w-[260px]" 
              : "w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
          )}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-white h-9 font-inter transition-all duration-300 border-blue-100 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/40"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-9 w-9 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </motion.div>

        {/* Vertical divider */}
        <div className="h-7 border-l border-gray-200 mx-2 hidden sm:block flex-shrink-0"></div>

        <motion.div
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="flex-shrink-0 mt-1 sm:mt-0"
        >
          <Popover open={statusOpen} onOpenChange={setStatusOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 text-sm whitespace-nowrap px-2 sm:px-3 font-inter ${filterButtonStyles}`}
              >
                <SlidersHorizontal className="mr-1 sm:mr-2 h-3.5 w-3.5" />
                <span className="font-medium">Status:</span> <span className="ml-1">{statusFilter}</span>
                <ChevronsUpDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 bg-white shadow-lg border border-blue-100 rounded-lg" align="start">
              <Command className="rounded-lg">
                <CommandInput placeholder="Filter statuses..." className="font-inter text-sm border-b border-blue-50 focus:ring-0 focus:border-blue-100" />
                <CommandList>
                  <CommandEmpty>No results found</CommandEmpty>
                  <CommandGroup className="overflow-hidden">
                    {statusOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={(value) => {
                          setStatusFilter(value as ProjectStatus | 'All');
                          setStatusOpen(false);
                        }}
                        style={{
                          background: statusFilter === option.value 
                            ? 'linear-gradient(to right, rgba(219, 234, 254, 0.9), rgba(233, 213, 255, 0.9))' 
                            : 'transparent',
                          color: '#2563eb',
                          border: '1px solid transparent',
                          margin: '2px 4px',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                        className="font-inter text-blue-600 dropdown-item"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-blue-600",
                            statusFilter === option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="flex-shrink-0 mt-1 sm:mt-0"
        >
          <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 text-sm whitespace-nowrap px-2 sm:px-3 font-inter ${filterButtonStyles}`}
              >
                <SlidersHorizontal className="mr-1 sm:mr-2 h-3.5 w-3.5" />
                <span className="font-medium">Priority:</span> <span className="ml-1">{priorityFilter}</span>
                <ChevronsUpDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 bg-white shadow-lg border border-blue-100 rounded-lg" align="start">
              <Command className="rounded-lg">
                <CommandInput placeholder="Filter priorities..." className="font-inter text-sm border-b border-blue-50 focus:ring-0 focus:border-blue-100" />
                <CommandList>
                  <CommandEmpty>No results found</CommandEmpty>
                  <CommandGroup className="overflow-hidden">
                    {priorityOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={(value) => {
                          setPriorityFilter(value as ProjectPriority | 'All');
                          setPriorityOpen(false);
                        }}
                        style={{
                          background: priorityFilter === option.value 
                            ? 'linear-gradient(to right, rgba(219, 234, 254, 0.9), rgba(233, 213, 255, 0.9))' 
                            : 'transparent',
                          color: '#2563eb',
                          border: '1px solid transparent',
                          margin: '2px 4px',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                        className="font-inter text-blue-600 dropdown-item"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-blue-600",
                            priorityFilter === option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </motion.div>

        {/* Vertical divider */}
        <div className="h-7 border-l border-gray-200 mx-2 hidden sm:block flex-shrink-0"></div>
      </div>

      {/* Clear Filters row - separate from main filter row */}
      {hasFilterSelections && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 ml-1"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-sm whitespace-nowrap font-inter clear-filter-btn"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear Filters
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default ProjectFilters;