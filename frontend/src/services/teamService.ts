// src/services/teamService.ts
import { 
  Team, 
  TeamMember, 
  CreateTeamPayload, 
  UpdateTeamPayload, 
  TeamMemberPayload, 
  UpdateTeamMemberPayload,
  GetTeamsParams 
} from '../interfaces/teamInterfaces';
import tokenService from './tokenService';
import { BASE_API_URL, getAuthHeaders } from './apiService';
import { toast } from '@/hooks/use-toast';

// Team service API functions
const teamService = {
  // Get list of teams with optional filters
  async getTeams(params: GetTeamsParams): Promise<Team[]> {
    const queryParams = new URLSearchParams();
    
    // Add params to query string
    queryParams.append('tenant_id', params.tenant_id.toString());
    if (params.include_private !== undefined) {
      queryParams.append('include_private', params.include_private.toString());
    }
    
    const response = await fetch(`${BASE_API_URL}/teams?${queryParams.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.status}`);
    }
    
    const data = await response.json();
    return data.teams;
  },
  
  // Create a new team
  async createTeam(team: CreateTeamPayload): Promise<Team> {
    const response = await fetch(`${BASE_API_URL}/teams`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(team),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create team: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Get a single team by ID
  async getTeamById(teamId: number): Promise<Team> {
    const response = await fetch(`${BASE_API_URL}/teams/${teamId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch team: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  },
  
  // Update an existing team
  async updateTeam(teamId: number, team: UpdateTeamPayload): Promise<Team> {
    const response = await fetch(`${BASE_API_URL}/teams/${teamId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(team),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update team: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  },
  
  // Delete a team
  async deleteTeam(teamId: number): Promise<void> {
    const response = await fetch(`${BASE_API_URL}/teams/${teamId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete team: ${response.status}`);
    }
  },
  
  // Get team members
  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    const response = await fetch(`${BASE_API_URL}/teams/${teamId}/members`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch team members: ${response.status}`);
    }
    
    const data = await response.json();
    return data.members;
  },
  
  // Add a team member
  async addTeamMember(teamId: number, memberPayload: TeamMemberPayload): Promise<TeamMember> {
    const response = await fetch(`${BASE_API_URL}/teams/${teamId}/members`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(memberPayload),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add team member: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  },
  
  // Update a team member
  async updateTeamMember(teamId: number, memberId: string, payload: UpdateTeamMemberPayload): Promise<TeamMember> {
    const response = await fetch(`${BASE_API_URL}/teams/${teamId}/members/${memberId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update team member: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  },
  
  // Remove a team member
  async removeTeamMember(teamId: number, memberId: string): Promise<void> {
    const response = await fetch(`${BASE_API_URL}/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to remove team member: ${response.status}`);
    }
  },

  // Get team projects (helper method that could be implemented later)
  async getTeamProjects(teamId: number): Promise<any[]> {
    // This would need to be implemented on the backend first
    // For now, return an empty array
    return [];
  }
};

export default teamService; 