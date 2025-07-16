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
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
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

  // Enhanced auth initialization with better error handling
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // First check if we have saved credentials
        const savedToken = tokenService.getToken();
        const savedUser = tokenService.getUser();

        if (savedToken && savedUser) {
          console.log('Found saved auth credentials, verifying...');
          
          // Verify the saved token is still valid
          try {
            const response = await fetch(`${BASE_API_URL}/authenticate`, {
              headers: { "Authorization": `Bearer ${savedToken}` },
              signal: AbortSignal.timeout(5000) // 5 second timeout
            });

            if (response.ok) {
              console.log('Saved token is valid, restoring session');
              setUser(savedUser);
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            } else {
              console.log('Saved token is invalid, checking Supabase session...');
              // Don't immediately clear - check Supabase session first
            }
          } catch (error) {
            console.warn('Backend verification failed, checking Supabase session...', error);
            // Don't immediately clear - check Supabase session first
          }
        }

        // Check Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Supabase session error:', sessionError);
          throw sessionError;
        }

        if (session) {
          console.log('Found Supabase session, attempting to restore or create user session');
          const token = session.access_token;
          
          // Try to verify with backend with retries
          let backendVerified = false;
          let userData: User | null = null;
          
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              console.log(`Backend verification attempt ${attempt}/3`);
              const response = await fetch(`${BASE_API_URL}/authenticate`, {
                headers: { "Authorization": `Bearer ${token}` },
                signal: AbortSignal.timeout(10000) // 10 second timeout
              });

              if (response.ok) {
                userData = await response.json();
                backendVerified = true;
                break;
              } else if (response.status === 401) {
                console.log('Token expired, attempting to refresh...');
                // Try to refresh the session
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                if (refreshData.session) {
                  const newToken = refreshData.session.access_token;
                  tokenService.setToken(newToken);
                  console.log('Token refreshed successfully');
                  continue; // Retry with new token
                }
              }
            } catch (error) {
              console.warn(`Backend verification attempt ${attempt} failed:`, error);
              if (attempt === 3) {
                console.error('All backend verification attempts failed');
              }
            }
          }

          if (backendVerified && userData) {
            console.log('Backend verification successful, restoring session');
            tokenService.setToken(token);
            tokenService.setUser(userData);
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            console.warn('Backend verification failed, but keeping Supabase session active');
            // Don't sign out immediately - let user try to use the app
            // The individual API calls will handle token refresh if needed
            
            // If we have saved user data, try to use it
            if (savedUser) {
              console.log('Using saved user data as fallback');
              setUser(savedUser);
              setIsAuthenticated(true);
            } else {
              console.log('No saved user data, clearing session');
              await supabase.auth.signOut();
              tokenService.clearAuth();
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        } else {
          console.log('No Supabase session found, clearing local storage');
          tokenService.clearAuth();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Don't clear everything on initialization error - might be temporary network issue
        const savedUser = tokenService.getUser();
        if (savedUser) {
          console.log('Using saved user data due to initialization error');
          setUser(savedUser);
          setIsAuthenticated(true);
        } else {
          tokenService.clearAuth();
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Enhanced auth state change handler
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth event: ${event}`, { hasSession: !!session });
      
      if (event === "SIGNED_IN" && session) {
        const token = session.access_token;
        tokenService.setToken(token);
        
        try {
          const response = await fetch(`${BASE_API_URL}/authenticate`, {
            headers: { "Authorization": `Bearer ${token}` },
            signal: AbortSignal.timeout(10000)
          });
          
          if (response.ok) {
            const userData: User = await response.json();
            tokenService.setUser(userData);
            setUser(userData);
            setIsAuthenticated(true);
            console.log('User authenticated successfully on sign-in');
          } else {
            console.warn('Backend authentication failed on sign-in, but keeping session');
            // Don't immediately sign out - let the user try to use the app
          }
        } catch (error) {
          console.error("Error verifying user on sign-in:", error);
          // Don't immediately sign out - might be temporary network issue
        }
      } else if (event === "SIGNED_OUT") {
        console.log('User signed out, clearing local state');
        tokenService.clearAuth();
        setUser(null);
        setIsAuthenticated(false);
      } else if (event === "TOKEN_REFRESHED" && session) {
        console.log('Token refreshed, updating stored token');
        const token = session.access_token;
        tokenService.setToken(token);
        // Keep existing user data - no need to re-verify for refresh
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // ... existing isValidJWT function ...

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

      // Step 1: Determine if the identifier is an email or username
      let emailToUse = identifier;
      if (!identifier.includes('@')) {
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
        emailToUse = data.email;
      }
      // Step 1: Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
      if (error) throw new Error(error.message);
      if (!data.session) throw new Error('No session returned from Supabase');
  
      const token = data.session.access_token;
      // console.log(`Token : ${token}`)
  
      // Step 2: Call backend /login endpoint with retries
      let response;
      let loginData;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Backend login attempt ${attempt}/3`);
          response = await fetch(`${BASE_API_URL}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ "identifier": identifier }),
            signal: AbortSignal.timeout(15000) // 15 second timeout
          });
          
          if (response.ok) {
            loginData = await response.json();
            break;
          } else if (attempt === 3) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Backend login failed');
          }
        } catch (error) {
          console.warn(`Backend login attempt ${attempt} failed:`, error);
          if (attempt === 3) {
            throw error;
          }
        }
      }
  
      const user =  {
        "username": loginData.username,
        "email": loginData.email,
        "id": loginData.user_id,
        "tenantId": loginData.tenant_id,
        "teamId": loginData.team_id
      }
  
      // Step 3: Save auth state
      tokenService.setToken(token);
      tokenService.setUser(user);
      setUser(user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
  
      // Step 4: Navigate to teams page
      setTimeout(() => navigate('/teams'), 1000);

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
        toast.info('Please check your email to verify your account.');
        return true; // Return true to navigate to login
      }
      
      // Step 3: If we got a session, use it to register with the backend
      const token = supabaseSession.access_token;
      
      // Step 4: Call backend /register endpoint
      const response = await fetch(`${BASE_API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          "organization_name": data.organizationName,
          "name": data.name,
          "email": data.email,
          "password": data.password,
          "confirm_password": data.confirmPassword,
          "user_id": supabaseUser.id,
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

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected route component
export const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

// Default export
export default AuthProvider;

