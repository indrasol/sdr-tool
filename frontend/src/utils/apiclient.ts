import tokenService from '../services/tokenService';
import { toast } from 'sonner';

// Base API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * Generic error handling for API responses
 */
const handleResponse = async (response: Response) => {
  // First check if the response is ok (status in the range 200-299)
  if (response.ok) {
    // For no content responses
    if (response.status === 204) {
      return null;
    }
    // For responses with content
    return response.json();
  }

  // Handle different error status codes
  let errorMessage = 'Something went wrong';
  
  try {
    // Try to parse error message from JSON response
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.error || errorMessage;
  } catch (e) {
    // If parsing fails, use status text
    errorMessage = response.statusText || errorMessage;
  }

  // Handle authentication errors specifically
  if (response.status === 401) {
    // Show friendly token expiry message then clear auth and redirect
    toast.error('Token expired. Could you please login again and resume your work');
    tokenService.clearAuth();
    // give slight delay to allow toast to render
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  }

  throw new Error(errorMessage);
};

/**
 * API client with methods for common HTTP operations
 */
const apiClient = {
  /**
   * GET request
   * @param endpoint API endpoint path
   * @param authenticated Whether to include auth token
   */
  get: async (endpoint: string, authenticated: boolean = true) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authenticated) {
      Object.assign(headers, tokenService.getAuthHeaders());
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    return handleResponse(response);
  },

  /**
   * POST request
   * @param endpoint API endpoint path
   * @param data Request body data
   * @param authenticated Whether to include auth token
   */
  post: async (endpoint: string, data: any, authenticated: boolean = true) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authenticated) {
      Object.assign(headers, tokenService.getAuthHeaders());
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'include',
    });

    return handleResponse(response);
  },

  /**
   * PUT request
   * @param endpoint API endpoint path
   * @param data Request body data
   * @param authenticated Whether to include auth token
   */
  put: async (endpoint: string, data: any, authenticated: boolean = true) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authenticated) {
      Object.assign(headers, tokenService.getAuthHeaders());
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      credentials: 'include',
    });

    return handleResponse(response);
  },

  /**
   * PATCH request
   * @param endpoint API endpoint path
   * @param data Request body data
   * @param authenticated Whether to include auth token
   */
  patch: async (endpoint: string, data: any, authenticated: boolean = true) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authenticated) {
      Object.assign(headers, tokenService.getAuthHeaders());
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
      credentials: 'include',
    });

    return handleResponse(response);
  },

  /**
   * DELETE request
   * @param endpoint API endpoint path
   * @param authenticated Whether to include auth token
   */
  delete: async (endpoint: string, authenticated: boolean = true) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authenticated) {
      Object.assign(headers, tokenService.getAuthHeaders());
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    return handleResponse(response);
  },
};

export default apiClient;