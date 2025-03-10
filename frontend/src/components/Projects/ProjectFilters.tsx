
import React from 'react';
import { Check, ChevronsUpDown, Filter, Search, X } from "lucide-react";
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
import { ProjectPriority, ProjectStatus } from '../../types/projectTypes';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
}

const statusOptions: FilterOption[] = [
  { value: 'All', label: 'All Statuses' },
  { value: 'Not Started', label: 'Not Started' },
  { value: 'Started', label: 'Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'On Hold', label: 'On Hold' },
];

const priorityOptions: FilterOption[] = [
  { value: 'All', label: 'All Priorities' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
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
}) => {
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [priorityOpen, setPriorityOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-[260px] sm:w-[320px] md:w-[400px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 bg-white h-9"
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
      </div>

      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-sm bg-white whitespace-nowrap px-2"
          >
            <Filter className="mr-1 h-3.5 w-3.5" />
            Status: {statusFilter}
            <ChevronsUpDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Command>
            <CommandInput placeholder="Filter statuses..." />
            <CommandList>
              <CommandEmpty>No results found</CommandEmpty>
              <CommandGroup>
                {statusOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(value) => {
                      setStatusFilter(value as ProjectStatus | 'All');
                      setStatusOpen(false);
                    }}
                    className="hover:bg-securetrack-purple/5"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
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

      <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-sm bg-white whitespace-nowrap px-2"
          >
            <Filter className="mr-1 h-3.5 w-3.5" />
            Priority: {priorityFilter}
            <ChevronsUpDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Command>
            <CommandInput placeholder="Filter priorities..." />
            <CommandList>
              <CommandEmpty>No results found</CommandEmpty>
              <CommandGroup>
                {priorityOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(value) => {
                      setPriorityFilter(value as ProjectPriority | 'All');
                      setPriorityOpen(false);
                    }}
                    className="hover:bg-securetrack-purple/5"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
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

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 text-sm whitespace-nowrap"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
};

export default ProjectFilters;