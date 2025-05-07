// src/services/projectService.ts
import { ProjectPriority, ProjectStatus, ProjectTemplateType } from '../types/projectTypes';
import { Project,CreateProjectPayload,UpdateProjectPayload, GetProjectsParams } from '../interfaces/projectInterfaces';
import tokenService from './tokenService';
import { useAuth } from '@/components/Auth/AuthContext'
import { BASE_API_URL, getAuthHeaders } from './apiService'
import { toast, useToast } from '@/hooks/use-toast'

// The backend URL from environment or hardcoded for now
// const BASE_API_URL = import.meta.env.VITE_BASE_API_URL
// const BASE_API_URL = import.meta.env.VITE_DEV_BASE_API_URL


interface LoadProjectResponse {
  sessionId: string,
  projectId: string,
  diagram_state: any
}

// Convert backend project format to frontend Project interface
const mapBackendToFrontend = (backendProject: any): Project => {
  return {
    id: backendProject.id,
    name: backendProject.name,
    description: backendProject.description,
    status: backendProject.status,  // No conversion needed now - backend returns enum names
    priority: backendProject.priority,  // No conversion needed now - backend returns enum names
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
  if (frontendProject.status !== undefined) backendProject.status = frontendProject.status; // Send the enum name directly
  if (frontendProject.priority !== undefined) backendProject.priority = frontendProject.priority; // Send the enum name directly
  if (frontendProject.dueDate !== undefined) backendProject.due_date = frontendProject.dueDate;
  if (frontendProject.creator !== undefined) backendProject.creator = frontendProject.creator;
  if (frontendProject.domain !== undefined) backendProject.domain = frontendProject.domain;
  
  return backendProject;
};


// Get authenticated request headers
// const getAuthHeaders = () => {
//   const token = tokenService.getToken();
//   return {
//     'Authorization': `Bearer ${token}`,
//     'Content-Type': 'application/json',
//   };
// };

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
    
    const response = await fetch(`${BASE_API_URL}/projects?${queryParams.toString()}`, {
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
    const response = await fetch(`${BASE_API_URL}/projects`, {
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
    const response = await fetch(`${BASE_API_URL}/projects/${projectId}`, {
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
    const response = await fetch(`${BASE_API_URL}/projects/${projectId}`, {
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
    const response = await fetch(`${BASE_API_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete project: ${response.status}`);
    }
  },

  // Function to save a project
  async saveProject(sessionId: string, diagramState: any, projectCode?: string): Promise<boolean> {
    try {
      console.log(`Saving project with session ID: ${sessionId}`);
      console.log(`Diagram state summary: ${diagramState.nodes.length} nodes, ${diagramState.edges.length} edges`);
      
      // Make API call to save_project endpoint
      const response = await fetch(`${BASE_API_URL}/save_project/${sessionId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          session_id: sessionId,
          diagram_state: diagramState,
          project_code: projectCode
        })
      });

      // Check if the HTTP response was successful (status in the 200-299 range)
      if (response.ok) {
        const savedProjectResp = await response.json();
        console.log(`Saved Project Response:`, savedProjectResp);
        
        // If we have a session_id in the response, log it
        if (savedProjectResp.session_id) {
          console.log(`Saved Project session: ${savedProjectResp.session_id}`);
        }
        
        // If we have a project_id in the response, log it
        if (savedProjectResp.project_id) {
          console.log(`Saved Project id: ${savedProjectResp.project_id}`);
        }
        
        // Show toast notification
        toast({
          title: "Project Saved",
          description: "Your project has been saved successfully",
          variant: "default"
        });
        
        // Log conversation history if available
        if (savedProjectResp.conversation_history) {
          console.log(`Saved conversation history: ${savedProjectResp.conversation_history.length} messages`);
        }
        
        return true;
      } else {
        // If the response was not OK, try to get error details
        let errorMessage = 'Failed to save project';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // If we can't parse the JSON, just use the status text
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        
        console.error(`Error saving project: ${errorMessage}`);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        
        return false;
      }
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to save project',
        variant: "destructive"
      });
      return false;
    }
  },

  async loadProject(projectId: string): Promise<any> {

    if (!projectId) {
      toast({
        title: "Cannot Load Project",
        description: "No project id found",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log(`Loading project with project ID: ${projectId}`);
      
      // Make API call to save_project endpoint
      const response = await fetch(`${BASE_API_URL}/load_project/${projectId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to load project');
      }

      const result = await response.json();
      console.log("Project Load details:", result);
      
      // Log if there's threat model data
      if (result.dfd_data) {
        console.log("Project has threat model data:", !!result.dfd_data);
      }
      
      if (result.threat_model_id) {
        console.log("Project has threat model ID:", result.threat_model_id);
      }
      
      return result;
    } catch (error: any) {
      console.error('Error loading project:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to load project',
        variant: "destructive"
      });
      throw error;
    }
  }
}
  

export default projectService;