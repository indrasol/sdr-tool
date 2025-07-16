export interface Team {
  id: number;
  name: string;
  description?: string;
  tenant_id: number;
  created_by: string;
  created_at: string;
  updated_at?: string;
  avatar_url?: string;
  is_private: boolean;
  members_count?: number; // Used for UI display
  projects_count?: number; // Used for UI display
}

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: string;
  role: string; // "owner" | "admin" | "member" | "guest"
  permissions: {
    view: boolean;
    edit: boolean;
    admin: boolean;
  };
  joined_at: string;
  updated_at?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface CreateTeamPayload {
  name: string;
  tenant_id: number;
  description?: string;
  is_private?: boolean;
  avatar_url?: string;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
  is_private?: boolean;
  avatar_url?: string;
}

export interface TeamMemberPayload {
  team_id: number;
  user_id: string;
  role?: string;
  permissions?: {
    view: boolean;
    edit: boolean;
    admin: boolean;
  };
}

export interface UpdateTeamMemberPayload {
  role?: string;
  permissions?: {
    view: boolean;
    edit: boolean;
    admin: boolean;
  };
}

export interface GetTeamsParams {
  tenant_id: number;
  include_private?: boolean;
} 