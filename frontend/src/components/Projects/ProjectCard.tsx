
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User, Cpu, FileUp, Puzzle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectTemplateType } from './ProjectTemplateSelector';

export type ProjectStatus = 'Not Started' | 'In Progress' | 'Started' | 'Completed' | 'On Hold';
export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ProjectCardProps {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  createdDate: string; 
  dueDate?: string;
  creator: string;
  assignedTo?: string;
  domain?: string;
  templateType?: ProjectTemplateType;
  importedFile?: string;
  onClick?: () => void;
}

const getStatusColor = (status: ProjectStatus): string => {
  switch (status) {
    case 'Not Started':
      return 'bg-gray-200 text-gray-800';
    case 'Started':
      return 'bg-amber-100 text-amber-800';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800';
    case 'Completed':
      return 'bg-green-100 text-green-800';
    case 'On Hold':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-200 text-gray-800';
  }
};

const getPriorityColor = (priority: ProjectPriority): string => {
  switch (priority) {
    case 'Low':
      return 'bg-green-100 text-green-800';
    case 'Medium':
      return 'bg-amber-100 text-amber-800';
    case 'High':
      return 'bg-orange-100 text-orange-800';
    case 'Critical':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-200 text-gray-800';
  }
};

const getTemplateIcon = (templateType?: ProjectTemplateType) => {
  switch (templateType) {
    case 'AI Assisted':
      return <Cpu className="h-3 w-3 mr-1" />;
    case 'Import Existing':
      return <FileUp className="h-3 w-3 mr-1" />;
    case 'Solutions Hub':
      return <Puzzle className="h-3 w-3 mr-1" />;
    default:
      return null;
  }
};

const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  name,
  description,
  status,
  priority,
  createdDate,
  dueDate,
  creator,
  assignedTo,
  domain,
  templateType,
  importedFile,
  onClick
}) => {
  return (
    <Card 
      className="hover:shadow-md transition-all duration-300 cursor-pointer h-full border-l-4"
      style={{ borderLeftColor: priority === 'Critical' ? '#f87171' : priority === 'High' ? '#fb923c' : priority === 'Medium' ? '#fbbf24' : '#4ade80' }}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg mb-1">{name}</h3>
            <div className="flex flex-wrap gap-1 mb-2">
              <Badge variant="outline" className={cn("font-normal", getStatusColor(status))}>
                {status}
              </Badge>
              <Badge variant="outline" className={cn("font-normal", getPriorityColor(priority))}>
                {priority} Priority
              </Badge>
              {domain && (
                <Badge variant="outline" className="bg-securetrack-purple/10 text-securetrack-purple">
                  {domain}
                </Badge>
              )}
              {templateType && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 flex items-center">
                  {getTemplateIcon(templateType)}
                  {templateType}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground bg-gray-100 rounded px-2 py-1 w-16 text-center">
            {id}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>
        
        <div className="flex flex-wrap gap-y-2 text-xs text-muted-foreground mt-auto">
          <div className="flex items-center w-full sm:w-1/2">
            <CalendarDays className="h-3 w-3 mr-1" />
            <span>Created: {createdDate}</span>
          </div>
          {dueDate && (
            <div className="flex items-center w-full sm:w-1/2">
              <Clock className="h-3 w-3 mr-1" />
              <span>Due: {dueDate}</span>
            </div>
          )}
          <div className="flex items-center w-full sm:w-1/2">
            <User className="h-3 w-3 mr-1" />
            <span>Creator: {creator}</span>
          </div>
          {assignedTo && (
            <div className="flex items-center w-full sm:w-1/2">
              <User className="h-3 w-3 mr-1" />
              <span>Assigned to: {assignedTo}</span>
            </div>
          )}
          {importedFile && (
            <div className="flex items-center w-full sm:w-1/2">
              <FileText className="h-3 w-3 mr-1" />
              <span>File: {importedFile}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;