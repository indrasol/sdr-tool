
import React from 'react';
import { CalendarDays, Clock, User, FileText } from "lucide-react";
import { truncateFilename } from './utils/fileUtils';

interface ProjectCardMetadataProps {
  createdDate: string;
  dueDate?: string;
  creator: string;
  assignedTo?: string;
  importedFile?: string;
  layout?: 'grid' | 'list';
  maxFileLength?: number;
}

const ProjectCardMetadata: React.FC<ProjectCardMetadataProps> = ({
  createdDate,
  dueDate,
  creator,
  assignedTo,
  importedFile,
  layout = 'grid',
  maxFileLength = 20
}) => {
  if (layout === 'list') {
    return (
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
        <div className="flex items-center">
          <User className="h-3 w-3 mr-1" />
          <span>{creator}</span>
        </div>
        {importedFile && (
          <div className="flex items-center">
            <FileText className="h-3 w-3 mr-1" />
            <span>{truncateFilename(importedFile, 15)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
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
          <span>File: {truncateFilename(importedFile, maxFileLength)}</span>
        </div>
      )}
    </div>
  );
};

export default ProjectCardMetadata;