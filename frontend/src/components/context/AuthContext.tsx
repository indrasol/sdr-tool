import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import tokenService from "../../utils/tokenService";
  // Assuming this is implemented properly

// Define user interface
interface User {
  id: string;
  name: string;
  email: string;
}

// Registration data interface
interface RegisterData {
  organizationName: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  // Check for existing token/user on component mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const savedUser = tokenService.getUser();
        const token = tokenService.getToken();
        
        if (token && savedUser) {
          setUser(savedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear potentially invalid auth state
        tokenService.removeToken();
        tokenService.removeUser();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {

      // Create form data
      const formData = new URLSearchParams();
      formData.append('username', username); // username or email validation is done at backend
      formData.append('password', password);
      const response = await fetch('http://localhost:8000/v1/routes/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      
      // Save token (adjust to match backend response key: 'access_token')
      tokenService.setToken(data.access_token);
      tokenService.setUser(data.user);
      
      // Update state
      setUser(data.user);
      setIsAuthenticated(true);
      
      // Navigate to dashboard
      // setTimeout(() => navigate("/dashboard"), 1000); // 1s delay
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
      // Map RegisterData to backend expected fields
      const payload = {
        tenant_name: data.organizationName,
        username: data.name,
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword || data.password,
      };
      
      const response = await fetch('http://localhost:8000/v1/routes/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
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
