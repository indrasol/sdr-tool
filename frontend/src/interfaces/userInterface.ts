
export interface User {
    id: string;
    email: string;
    username?: string;
    tenantId?: number;
    teamId?: number; // Add teamId property to fix linter errors
    role?: string;
    // Add other user properties as needed
  }