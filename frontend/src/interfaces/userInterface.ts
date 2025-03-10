
export interface User {
    id: string;
    email: string;
    username?: string;
    tenantId?: number;
    role?: string;
    // Add other user properties as needed
  }