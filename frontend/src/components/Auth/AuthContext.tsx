import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import tokenService from '@/services/tokenService';
import { User } from '@/interfaces/userInterface';
import { supabase } from "../../../supabase";
import { toast } from "sonner";
import { getAuthHeaders, BASE_API_URL, fetchWithTimeout, DEFAULT_TIMEOUT } from '@/services/apiService'
  // Assuming this is implemented properly

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
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);


// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

// const BASE_API_URL = import.meta.env.VITE_BASE_API_URL
// const BASE_API_URL = import.meta.env.VITE_DEV_BASE_API_URL

// Front-end needs the public API key to call protected back-end helper routes
// (e.g. /get-email). It is injected at build-time via Vite.
const supabaseApiKey = import.meta.env.VITE_SUPABASE_API_KEY;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  // Check for existing Supabase session on component mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const savedToken = tokenService.getToken();
        const savedUser = tokenService.getUser();

        if (savedToken && savedUser) {
          setUser(savedUser);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const token = session.access_token;
          tokenService.setToken(token);

          // Verify with backend
          const response = await fetch(`${BASE_API_URL}/authenticate`, {
            headers: { "Authorization": `Bearer ${token}` },
          });

          if (response.ok) {
            const userData: User = await response.json();
            tokenService.setUser(userData);
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            console.log("Session exists but authentication endpoint failed - clearing session");
            await supabase.auth.signOut();
            tokenService.clearAuth();
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          tokenService.clearAuth();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        tokenService.clearAuth();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth event: ${event}`);
      if (event === "SIGNED_IN" && session) {
        const token = session.access_token;
        tokenService.setToken(token);
        try {
          const response = await fetch(`${BASE_API_URL}/authenticate`, {
            headers: { "Authorization": `Bearer ${token}` },
          });
          if (response.ok) {
            const userData: User = await response.json();
            tokenService.setUser(userData);
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            throw new Error("Backend authentication failed");
          }
        } catch (error) {
          console.error("Error verifying user on sign-in:", error);
          await supabase.auth.signOut();
          tokenService.clearAuth();
          setUser(null);
          setIsAuthenticated(false);
        }
      } else if (event === "SIGNED_OUT") {
        tokenService.clearAuth();
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [navigate]);

  async function isValidJWT(token: string): Promise<boolean> {
  // async function isValidJWT(token : any) {
    // Basic check - a JWT should have 2 dots (3 parts)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error("Invalid JWT format - doesn't have 3 parts");
      return false;
    }
  }

  // Login function using Supabase
  const login = async (identifier: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {

      console.log("All Vite env variables:", Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));

      // Step 1: Determine if the identifier is an email or username
      let emailToUse = identifier;
      if (!identifier.includes('@')) {
        console.log("Supabase API key:", supabaseApiKey);

        // If no '@' is present, assume it's a username and fetch the email from the backend
        const response = await fetch(`${BASE_API_URL}/get-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': supabaseApiKey },
          body: JSON.stringify({ username: identifier }),
        });
        if (!response.ok) {
          toast.error('Username not found. Try logging in with your e-mail address.');
          throw new Error('Username not found');
        }
        const data = await response.json();
        console.log("Data:", data);
        emailToUse = data.email;
      }
      console.log("Email to use:", emailToUse);
      // Step 1: Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
      if (error) throw new Error(error.message);
      if (!data.session) throw new Error('No session returned from Supabase');
  
      const token = data.session.access_token;
      // console.log(`Token : ${token}`)
  
      // Step 2: Call backend /login endpoint
      const response = await fetch(`${BASE_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ "identifier": identifier }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Backend login failed');
      }
  
      const loginData = await response.json();
      const user =  {
        "username": loginData.username,
        "email": loginData.email,
        "id": loginData.user_id,
        "tenantId": loginData.tenant_id,
      }
  
      // Step 3: Save auth state
      tokenService.setToken(token);
      tokenService.setUser(user);
      setUser(user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
  
      // Step 4: Navigate to organizations page
      setTimeout(() => navigate('/org'), 1000);

    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      await supabase.auth.signOut();
      tokenService.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function using Supabase
  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    let user_id: string | null = null;
    try {
      // Step 1: First check if user already exists in Supabase Auth
      const { data: checkUserData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      }).catch(() => {
        // Silently handle sign-in errors - we're just checking if user exists
        return { data: null };
      });
      
      // If user exists and login works, redirect to login page
      if (checkUserData && checkUserData.session) {
        // User already exists
        toast.info('Account already exists. Please log in.');
        await supabase.auth.signOut();
        tokenService.clearAuth();
        return true; // Return true to navigate to login
      }
      
      // Step 2: Register the user in Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.name,
            full_name: data.name,
            tenant_name: data.organizationName,
          }
        }
      });
      
      if (signUpError) throw new Error(signUpError.message);
      const supabaseUser = authData.user;
      if (!supabaseUser) throw new Error("User registration failed");
      user_id = supabaseUser.id;  // Store user ID for cleanup if needed
      
      // If email confirmation is enabled, Supabase will *not* return a session.
      // In that case we simply ask the user to verify their e-mail and end here.
      const supabaseSession = authData.session;
      if (!supabaseSession) {
        // Create a pending registration record in our database so the user can log in after e-mail confirmation.
        try {
          const pendingResponse = await fetch(`${BASE_API_URL}/register/pending`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': supabaseApiKey,
            },
            body: JSON.stringify({
              user_id: supabaseUser.id,
              tenant_name: data.organizationName,
              email: data.email,
              username: data.name,
            }),
          });

          if (!pendingResponse.ok) {
            const errorData = await pendingResponse.json();
            throw new Error(errorData.detail || 'Pending registration failed');
          }
        } catch (error: any) {
          console.error('Pending registration error:', error);
          toast.error(error.message || 'Registration failed');
          await supabase.auth.signOut();
          tokenService.clearAuth();
          setUser(null);
          setIsAuthenticated(false);
          throw error;
        }

        toast.success('Registration successful! Please confirm your e-mail before logging in.');
        return true; // Allow navigation to /login
      }

      const token = supabaseSession.access_token;
      
      // Step 4: Register with backend
      const response = await fetch(`${BASE_API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: supabaseUser.id,
          tenant_name: data.organizationName,
          email: data.email,
          username: data.name,
        }),
      });
        
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.detail === 'User already exists') {
          toast.info('Account already exists. Please log in.');
          await supabase.auth.signOut();
          tokenService.clearAuth();
          return true;
        }
        throw new Error(errorData.detail || 'Backend registration failed');
      }
      
      // Step 5: Success
      toast.success('Registration successful! Redirecting to login...');
      await supabase.auth.signOut();
      tokenService.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');

      // No additional cleanup required – the user was never inserted into our
      // application database without first owning a valid JWT.

      await supabase.auth.signOut();
      tokenService.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function using Supabase
  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      tokenService.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
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
