import { User } from '@/interfaces/userInterface';

const BASE_URL = import.meta.env.VITE_DEV_BASE_API_URL;

export const syncUserWithBackend = async (identifier: string, token: string): Promise<User> => {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ identifier })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Backend sync failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Map backend response to User interface
    return {
      id: data.user_id,
      email: data.email,
      username: data.username,
      tenantId: data.tenant_id,
      teamId: data.team_id
    };
  } catch (error: any) {
    console.error('Error syncing user with backend:', error);
    throw new Error(error.message || 'Failed to sync user with backend');
  }
};
