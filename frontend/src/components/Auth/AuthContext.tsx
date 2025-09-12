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
}

// OTP registration data interface
interface OTPRegisterData extends RegisterData {
  otp: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithOTP: (email: string, otp: string) => Promise<void>;
  sendLoginOTP: (email: string) => Promise<void>;
  register: (data: RegisterData) => Promise<boolean>;
  registerWithOTP: (data: OTPRegisterData) => Promise<boolean>;
  sendRegisterOTP: (data: RegisterData) => Promise<void>;
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

// Helper to check if we're in registration process
// This helps us avoid unnecessary authentication calls during registration
const isRegistrationInProgress = (): boolean => {
  return sessionStorage.getItem('registration_in_progress') === 'true';
};

// Helper to set registration in progress
// We use sessionStorage to maintain this state through page refreshes but clear on browser close
const setRegistrationInProgress = (inProgress: boolean): void => {
  if (inProgress) {
    sessionStorage.setItem('registration_in_progress', 'true');
  } else {
    sessionStorage.removeItem('registration_in_progress');
  }
};

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
        // Check if registration is in progress - skip authentication if so
        // This prevents unnecessary API calls to /authenticate during registration
        if (isRegistrationInProgress()) {
          console.log('Registration in progress, skipping authentication check');
          setIsLoading(false);
          return;
        }

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
      
      // Skip authentication check during registration
      if (isRegistrationInProgress()) {
        console.log('Registration in progress, skipping auth state change handling for event:', event);
        return;
      }
      
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
    
    // Set registration in progress flag at the beginning of the registration process
    setRegistrationInProgress(true);
    
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
        // Clear registration flag since we're redirecting to login
        setRegistrationInProgress(false);
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
      // if (!supabaseSession) {
      //   toast.info('Please check your email to verify your account.');
      //   return true; // Return true to navigate to login
      // }
      
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
          "tenant_name": data.organizationName,
          "username": data.name,
          "email": data.email,
          "user_id": user_id,
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
      // Always clear registration in progress flag when we're done
      setRegistrationInProgress(false);
    }
  };

  // Send OTP for login
  const sendLoginOTP = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: undefined,
        }
      });
      
      if (error) {
        // Handle specific Supabase errors for login
        if (error.message.includes('Unable to validate email address') || 
            error.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address first');
        } else if (error.message.includes('User not found')) {
          throw new Error('No account found with this email. Please register first.');
        }
        throw new Error(error.message);
      }
      
      toast.success('OTP sent to your email. Please check your inbox.');
    } catch (error: any) {
      console.error('Send login OTP error:', error);
      toast.error(error.message || 'Failed to send OTP');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Login with OTP
  const loginWithOTP = async (email: string, otp: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Step 1: Verify OTP with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: 'email'
      });
      
      if (error) throw new Error(error.message);
      if (!data.session) throw new Error('No session returned from Supabase');

      const token = data.session.access_token;

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
            body: JSON.stringify({ "identifier": email }),
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

      const user = {
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
      console.error('Login with OTP error:', error);
      toast.error(error.message || 'OTP verification failed');
      await supabase.auth.signOut();
      tokenService.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Send OTP for registration
  const sendRegisterOTP = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    setRegistrationInProgress(true);
    
    try {
      // First check if user already exists in our backend
      try {
        const checkResponse = await fetch(`${BASE_API_URL}/check-user-exists`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': supabaseApiKey,
          },
          body: JSON.stringify({ email: data.email }),
        });
        
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.exists) {
            toast.info('Account already exists. Please log in instead.');
            setRegistrationInProgress(false);
            setIsLoading(false);
            throw new Error('User already exists');
          }
        }
      } catch (checkError) {
        // If check endpoint doesn't exist or fails, continue with registration
        console.log('User existence check failed or endpoint not available, proceeding with registration');
      }

      // Send OTP for registration
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: undefined,
          data: {
            username: data.name,
            full_name: data.name,
            tenant_name: data.organizationName,
          }
        }
      });
      
      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('User already registered')) {
          toast.info('Account already exists. Please log in instead.');
          throw new Error('User already exists');
        }
        throw new Error(error.message);
      }
      
      toast.success('OTP sent to your email. Please check your inbox.');
    } catch (error: any) {
      console.error('Send register OTP error:', error);
      if (!error.message.includes('User already exists')) {
        toast.error(error.message || 'Failed to send OTP');
      }
      setRegistrationInProgress(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register with OTP
  const registerWithOTP = async (data: OTPRegisterData): Promise<boolean> => {
    setIsLoading(true);
    let user_id: string | null = null;
    
    try {
      // Step 1: Verify OTP with Supabase
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.otp,
        type: 'email'
      });
      
      if (verifyError) throw new Error(verifyError.message);
      const supabaseUser = authData.user;
      if (!supabaseUser) throw new Error("User registration failed");
      user_id = supabaseUser.id;

      const supabaseSession = authData.session;
      if (!supabaseSession) throw new Error("No session returned from Supabase");
      
      const token = supabaseSession.access_token;
      
      // Step 2: Call backend /register endpoint
      const response = await fetch(`${BASE_API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          "tenant_name": data.organizationName,
          "username": data.name,
          "email": data.email,
          "user_id": user_id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle various duplicate user error formats
        const errorMessage = errorData.detail || errorData.message || 'Backend registration failed';
        console.error('Backend registration error:', errorData);
        
        if (errorMessage.includes('User already exists') || 
            errorMessage.includes('duplicate key value violates unique constraint') ||
            errorMessage.includes('already exists') ||
            errorData.code === '23505') {
          toast.info('Account already exists. Please log in instead.');
          await supabase.auth.signOut();
          tokenService.clearAuth();
          setRegistrationInProgress(false);
          return true;
        }
        
        throw new Error(errorMessage);
      }
      
      // Step 3: Success
      toast.success('Registration successful! Redirecting to login...');
      await supabase.auth.signOut();
      tokenService.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      return true;
    } catch (error: any) {
      console.error('Registration with OTP error:', error);
      toast.error(error.message || 'OTP verification failed');

      await supabase.auth.signOut();
      tokenService.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
      setRegistrationInProgress(false);
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
    loginWithOTP,
    sendLoginOTP,
    register,
    registerWithOTP,
    sendRegisterOTP,
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

