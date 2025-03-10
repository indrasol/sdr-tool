// src/services/projectService.ts
import { ProjectPriority, ProjectStatus, ProjectTemplateType } from '../types/projectTypes';
import { Project,CreateProjectPayload,UpdateProjectPayload, GetProjectsParams } from '../interfaces/projectInterfaces';
import tokenService from './tokenService';
import { useAuth } from '@/components/Auth/AuthContext'

// The backend URL from environment or hardcoded for now
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Interface for project creation payload


// Convert backend project format to frontend Project interface
const mapBackendToFrontend = (backendProject: any): Project => {
  return {
    id: backendProject.id,
    name: backendProject.name,
    description: backendProject.description,
    status: backendProject.status,
    priority: backendProject.priority,
    createdDate: backendProject.created_date,
    dueDate: backendProject.due_date,
    creator: backendProject.creator,
    assignedTo: backendProject.assigned_to || undefined,
    domain: backendProject.domain,
    templateType: backendProject.template_type,
    importedFile: backendProject.imported_file,
    tenantId: backendProject.tenant_id
  };
};

// Convert frontend project format to backend payload
const mapFrontendToBackend = (frontendProject: Partial<Project>): any => {
  // Map only the fields that exist
  const backendProject: any = {};
  
  // Only add optional fields if they exist in the payload
  if (frontendProject.description !== undefined) backendProject.description = frontendProject.description;
  if (frontendProject.status !== undefined) backendProject.status = frontendProject.status;
  if (frontendProject.priority !== undefined) backendProject.priority = frontendProject.priority;
  if (frontendProject.dueDate !== undefined) backendProject.due_date = frontendProject.dueDate;
  if (frontendProject.creator !== undefined) backendProject.creator = frontendProject.creator;
  if (frontendProject.domain !== undefined) backendProject.domain = frontendProject.domain;
  
  return backendProject;
};


// Get authenticated request headers
const getAuthHeaders = () => {
  const token = tokenService.getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Project service API functions
const projectService = {

  // Get list of projects with optional filters
  async getProjects(params: GetProjectsParams): Promise<Project[]> {
    const queryParams = new URLSearchParams();
    
    // Add all params to query string
    queryParams.append('tenant_id', params.tenant_id.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    
    const response = await fetch(`http://localhost:8000/v1/routes/projects?${queryParams.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status}`);
    }
    
    const data = await response.json();
    return data.projects.map(mapBackendToFrontend);
  },
  
  // Create a new project
  async createProject(project: CreateProjectPayload): Promise<Project> {
    console.log("Entering createProject fuinction...")
    console.log("User : ",project.creator)
    const response = await fetch(`http://localhost:8000/v1/routes/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(project),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create project: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("backend response from create project : ",data)
    return mapBackendToFrontend(data);
  },

  // Get a single project by ID
  async getProjectById(projectId: string, tenantId?: number): Promise<Project> {
    const user = tokenService.getUser();
    tenantId = user.tenantId
    const response = await fetch(`http://localhost:8000/v1/routes/projects/${projectId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.status}`);
    }
    
    const data = await response.json();
    return mapBackendToFrontend(data);
  },
  
  // Update an existing project
  async updateProject(projectId: string, project: UpdateProjectPayload): Promise<Project> {
    // Log the update request payload for debugging
    console.log("Update Project request payload:", project);
    const user = tokenService.getUser();

    // First get the existing project to populate required fields
    const existingProject = await this.getProjectById(projectId);
    if (!existingProject) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    console.log("Existing Project from update : ",existingProject)

    // Create payload with required fields from existing project
    const basePayload = {
      name: existingProject.name,
      project_code: existingProject.id,
      tenant_id: user.tenantId
    };
    
    // Filter out undefined values to only send changed fields
    const filteredPayload = Object.fromEntries(
      Object.entries(project).filter(([_, value]) => value !== undefined)
    );
    

    console.log("Filtered update payload:", filteredPayload);
    
    // Create the final payload by mapping frontend fields to backend
    const mappedUpdateFields = mapFrontendToBackend(filteredPayload);
    
    console.log("mappedUpdateFields update payload:", mappedUpdateFields);

    // Merge the base payload with the update fields
    const finalPayload = { ...basePayload, ...mappedUpdateFields };

    console.log("Final update payload:", finalPayload);
    
    // Send only the fields that have values
    const response = await fetch(`http://localhost:8000/v1/routes/projects/${projectId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(finalPayload),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update project: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log which fields were actually updated
    if (data.updated_fields) {
      console.log("Fields updated in the backend:", data.updated_fields);
    }
    
    // Check if the backend returned the complete updated project
    if (data.project) {
      console.log("Received updated project from backend");
      return mapBackendToFrontend(data.project);
    } else {
      // If not, fetch the complete project data
      console.log("Fetching complete project data as fallback");
      return await projectService.getProjectById(projectId);
    }
  },
  
  // Delete a project
  async deleteProject(projectId: string): Promise<void> {
    const response = await fetch(`http://localhost:8000/v1/routes/projects/${projectId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete project: ${response.status}`);
    }
  }
}
  

export default projectService;