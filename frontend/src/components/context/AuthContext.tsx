import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import tokenService from "../../utils/tokenService";
  // Assuming this is implemented properly

// Define user interface
interface User {
  id: string;
  name: string;
  email: string;
  organizationName: string;
}

// Registration data interface
interface RegisterData {
  organizationName: string;
  name: string;
  email: string;
  password: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  
  // Derived authentication state
  const isAuthenticated = !!user;

  // Initialize user from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // Check if we have a token and user data in localStorage
        const token = tokenService.getToken();
        const userData = tokenService.getUser();
        
        if (token && userData) {
          // Validate token by making a request to the server
          try {
            const response = await fetch('/api/auth/validate-token', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              setUser(userData);
            } else {
              // Token is invalid, clear auth data
              tokenService.clearAuth();
            }
          } catch (error) {
            console.error('Error validating token:', error);
            // In case of network error, keep the user logged in
            // but we could also choose to log them out for security
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        tokenService.clearAuth();
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      
      // Save token and user data
      tokenService.setToken(data.token);
      tokenService.setUser(data.user);
      
      // Update state
      setUser(data.user);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const responseData = await response.json();
      
      // After successful registration, log the user in
      if (responseData.token && responseData.user) {
        tokenService.setToken(responseData.token);
        tokenService.setUser(responseData.user);
        setUser(responseData.user);
      } else {
        // Otherwise perform login with the provided credentials
        await login(data.email, data.password);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = (): void => {
    tokenService.clearAuth();
    setUser(null);
    navigate('/');
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
