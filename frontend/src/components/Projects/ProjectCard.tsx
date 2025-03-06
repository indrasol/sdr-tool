
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, User, Cpu, FileUp, Puzzle, FileText, Trash2, PencilLine } from "lucide-react";
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
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  viewType?: 'grid' | 'list';
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
  onClick,
  onDelete,
  onEdit,
  viewType = 'grid'
}) => {
  // Prevent event bubbling when clicking the action buttons
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(id);
    }
  };

  // Apply different styling for list view
  if (viewType === 'list') {
    return (
      <Card 
        className="hover:shadow-md transition-all duration-300 cursor-pointer border-l-4 mb-2"
        style={{ borderLeftColor: priority === 'Critical' ? '#f87171' : priority === 'High' ? '#fb923c' : priority === 'Medium' ? '#fbbf24' : '#4ade80' }}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-gray-100 rounded px-2 py-1">
                  {id}
                </span>
                <h3 className="font-semibold text-md">{name}</h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{description}</p>
            </div>
            
            <div className="flex items-center gap-3 ml-4">
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className={cn("font-normal", getStatusColor(status))}>
                  {status}
                </Badge>
                <Badge variant="outline" className={cn("font-normal", getPriorityColor(priority))}>
                  {priority}
                </Badge>
                {templateType && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 flex items-center">
                    {getTemplateIcon(templateType)}
                    {templateType}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-3 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <CalendarDays className="h-3 w-3 mr-1" />
                  <span>{createdDate}</span>
                </div>
                {dueDate && (
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{dueDate}</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-1">
                {onEdit && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-blue-600 hover:bg-blue-50" 
                    onClick={handleEditClick}
                  >
                    <PencilLine className="h-4 w-4" />
                    <span className="sr-only">Edit project</span>
                  </Button>
                )}
                {onDelete && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                    onClick={handleDeleteClick}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete project</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Grid view (original layout)
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
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground bg-gray-100 rounded px-2 py-1 w-16 text-center">
              {id}
            </div>
            <div className="flex gap-1">
              {onEdit && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-blue-600 hover:bg-blue-50" 
                  onClick={handleEditClick}
                >
                  <PencilLine className="h-4 w-4" />
                  <span className="sr-only">Edit project</span>
                </Button>
              )}
              {onDelete && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete project</span>
                </Button>
              )}
            </div>
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