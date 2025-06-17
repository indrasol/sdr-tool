
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Cpu, FileUp, Puzzle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectStatus, ProjectPriority } from '../../types/projectTypes';
import { getStatusColor, getPriorityColor, normalizePriority, normalizeStatus } from './utils/projectStyleUtils';
import type { ProjectTemplateType } from '@/types/projectTypes';

interface ProjectCardBadgesProps {
  status: ProjectStatus;
  priority: ProjectPriority;
  domain?: string;
  templateType?: ProjectTemplateType;
  showPriorityText?: boolean;
}

const getTemplateIcon = (templateType?: ProjectTemplateType) => {
  switch (templateType) {
    case 'AI Assisted':
      return <Cpu className="h-3 w-3 mr-1" />;
    case 'Import Existing':
      return <FileUp className="h-3 w-3 mr-1" />;
    case 'From Template':
      return <Puzzle className="h-3 w-3 mr-1" />;
    default:
      return null;
  }
};

const ProjectCardBadges: React.FC<ProjectCardBadgesProps> = ({
  status,
  priority,
  domain,
  templateType,
  showPriorityText = false
}) => {

  // Normalize the status and priority for display
  const displayStatus = normalizeStatus(status);
  const displayPriority = normalizePriority(priority);
  return (
    <div className="flex flex-wrap gap-1 mb-2">
      <Badge variant="outline" className={cn("font-normal", getStatusColor(status))}>
        {displayStatus}
      </Badge>
      <Badge variant="outline" className={cn("font-normal", getPriorityColor(priority))}>
        {displayPriority}{showPriorityText ? " Priority" : ""}
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
  );
};

export default ProjectCardBadges;