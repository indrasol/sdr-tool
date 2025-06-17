import {ProjectStatus, ProjectPriority, ProjectTemplateType} from '@/types/projectTypes'

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
  
  export interface Project {
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
    tenantId: number;
    tags?: string[];
    diagramState?: {
      nodes: any[];
      edges: any[];
    };
    conversationHistory?: any[];
  }


  export interface CreateProjectPayload {
    name: string;
    description: string;
    priority: ProjectPriority;
    status?: ProjectStatus;
    domain?: string;
    due_date?: string;
    creator: string;
    template_type: ProjectTemplateType;
    imported_file?: string;
    tenant_id: number;
    tags?: string[];
  }
  
  // Interface for project update payload
  export interface UpdateProjectPayload {
    name?: string;
    description?: string;
    priority?: ProjectPriority;
    status?: ProjectStatus;
    domain?: string;
    due_date?: string;
    assigned_to?: string;
    imported_file?: string;
  }
  
  // Interface for GET projects query parameters
  export interface GetProjectsParams {
    tenant_id: number;
    status?: ProjectStatus;
    priority?: ProjectPriority;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }

  // Project pagination state
export interface PaginationState {
    limit: number;
    offset: number;
    total: number;
  }
  
  // Response from API when fetching projects
  export interface ProjectsApiResponse {
    projects: Project[];
    total: number;
  }