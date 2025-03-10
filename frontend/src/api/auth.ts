// Define types for response data
interface AuthResponse {
    access_token: string;
    user: {
      email: string;
      name: string;
      organizationName: string;
    };
  }
  
  interface RegisterData {
    organizationName: string;
    name: string;
    email: string;
    password: string;
  }
  
  interface LoginData {
    identifier: string; // Can be email or username
    password: string;
  }
  
  // Base API URL
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/v1/routes/register";
  
  // Import or define apiClient
  import apiClient from '../utils/apiclient'; // Adjust the path as necessary
  import tokenService from '../services/tokenService'; // Adjust the path as necessary
  
  // Register user
  export const register = async (userData: RegisterData): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: 'include' // Include cookies for CSRF if needed
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to register user");
      }
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  };
  
  // Login user
  export const login = async (identifier: string, password: string): Promise<AuthResponse> => {
    try {
      const data = await apiClient.post('/auth/login', { identifier, password }, false);
      
      // Save token and user data
      tokenService.setToken(data.access_token);
      tokenService.setUser(data.user);
      
      return data;
    } catch (error: any) {
      console.error("Error logging in:", error);
      throw error;
    }
  };