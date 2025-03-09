
import type { ProjectTemplateType } from '../ProjectTemplateSelector';

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