/**
 * Token Service
 * Utility for handling JWT tokens and user data in local storage
 */

// Storage keys
const TOKEN_KEY = 'app_token';
const USER_KEY = 'app_user';

// Token service with TypeScript interfaces
interface User {
  id: string;
  name: string;
  email: string;
  organizationName: string;
  // Add other user properties as needed
}

/**
 * Get the authentication token from localStorage
 */
const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Set the authentication token in localStorage
 */
const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Remove the authentication token from localStorage
 */
const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Get the user data from localStorage
 */
const getUser = (): User | null => {
  const userData = localStorage.getItem(USER_KEY);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData) as User;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Set the user data in localStorage
 */
const setUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Remove the user data from localStorage
 */
const removeUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

/**
 * Clear all auth data (token and user)
 */
const clearAuth = (): void => {
  removeToken();
  removeUser();
};

/**
 * Check if the user is authenticated (has a token)
 */
const isAuthenticated = (): boolean => {
  return !!getToken();
};

/**
 * Get authorization headers for API requests
 */
const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Create a fetch wrapper that includes auth headers
 */
const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  return fetch(url, {
    ...options,
    headers
  });
};

// Export all functions
const tokenService = {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
  clearAuth,
  isAuthenticated,
  getAuthHeaders,
  authenticatedFetch
};

export default tokenService;