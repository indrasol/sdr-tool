import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import tokenService from '@/services/tokenService';
import { User } from '@/interfaces/userInterface';
import { supabase } from "../../../supabase";
import { toast } from "sonner";
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { syncUserWithBackend } from '@/services/authService';

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
  supabaseUser: SupabaseUser | null;
  session: Session | null;
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

// Helper function to convert Supabase user to our User interface
const createUserFromSupabaseUser = (supabaseUser: SupabaseUser): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    username: supabaseUser.user_metadata?.username || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || '',
    tenantId: supabaseUser.user_metadata?.tenant_id || null,
    teamId: supabaseUser.user_metadata?.team_id || null,
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  // Initialize authentication state from Supabase session
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        if (mounted && session?.user) {
          console.log('Found existing session, initializing user data');
          const userData = createUserFromSupabaseUser(session.user);
          
          setSession(session);
          setSupabaseUser(session.user);
          setUser(userData);
          setIsAuthenticated(true);
          
          // Store token for API calls if needed
          tokenService.setToken(session.access_token);
          tokenService.setUser(userData);
        } else {
          console.log('No active session found');
          setSession(null);
          setSupabaseUser(null);
          setUser(null);
          setIsAuthenticated(false);
          tokenService.clearAuth();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log(`Auth event: ${event}`, { hasSession: !!session });
      
      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            console.log('User signed in successfully');
            
            // 🔥 ADD THIS: Enhanced logging for OTP login detection
            const loginMethod = session.user.app_metadata?.provider || 'unknown';
            const isOTPLogin = !session.user.user_metadata?.password_login; // OTP logins typically don't have this flag
            
            if (isOTPLogin || event === 'SIGNED_IN') {
              // console.log('🔐 AUTH STATE CHANGE - JWT TOKEN (Likely OTP Login):');
              // console.log('Token:', session.access_token);
              // console.log('Authorization Header:', `Bearer ${session.access_token}`);
              // console.log('Login Method:', loginMethod);
              // console.log('Expires:', new Date(session.expires_at * 1000).toISOString());
              // console.log('User ID:', session.user.id);
              // console.log('User Email:', session.user.email);
              
              // Store with timestamp
              (window as any).authStateJWTToken = {
                token: session.access_token,
                timestamp: new Date().toISOString(),
                method: loginMethod,
                isLikelyOTP: isOTPLogin
              };
              console.log('💡 Token details available as: window.authStateJWTToken');
            }
            
            // Try to get complete user data from backend
            try {
              const completeUserData = await syncUserWithBackend(
                session.user.email || session.user.id, 
                session.access_token
              );
              
              setSession(session);
              setSupabaseUser(session.user);
              setUser(completeUserData);
              setIsAuthenticated(true);
              
              tokenService.setToken(session.access_token);
              tokenService.setUser(completeUserData);
              
            } catch (error) {
              console.error('Backend sync failed during auth state change:', error);
              // Fallback to Supabase data
              const userData = createUserFromSupabaseUser(session.user);
              
              setSession(session);
              setSupabaseUser(session.user);
              setUser(userData);
              setIsAuthenticated(true);
              
              tokenService.setToken(session.access_token);
              tokenService.setUser(userData);
            }
          }
          break;
          
        case 'SIGNED_OUT':
          console.log('User signed out');
          setSession(null);
          setSupabaseUser(null);
          setUser(null);
          setIsAuthenticated(false);
          tokenService.clearAuth();
          break;
          
        case 'TOKEN_REFRESHED':
          if (session?.user) {
            console.log('Token refreshed');
            const userData = createUserFromSupabaseUser(session.user);
            
            setSession(session);
            setSupabaseUser(session.user);
            setUser(userData);
            
            // Update stored token
            tokenService.setToken(session.access_token);
            tokenService.setUser(userData);
          }
          break;
          
        case 'USER_UPDATED':
          if (session?.user) {
            console.log('User updated');
            const userData = createUserFromSupabaseUser(session.user);
            
            setSupabaseUser(session.user);
            setUser(userData);
            tokenService.setUser(userData);
          }
          break;
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Login function using Supabase with backend sync
  const login = async (identifier: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Determine if the identifier is an email or username
      let emailToUse = identifier;
      
      // For username login, we need to convert it to email format
      // This is a simplified approach - in a real app you might store username->email mapping
      if (!identifier.includes('@')) {
        // Simple conversion: username@yourdomain.com
        // You can modify this logic based on your requirements
        emailToUse = `${identifier}@yourdomain.com`;
        toast.info('Please use your email address to login for now.');
        throw new Error('Please use your email address to login');
      }

      // Step 1: Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: emailToUse, 
        password 
      });
      
      if (error) {
        // Handle common Supabase auth errors
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address first');
        }
        throw new Error(error.message);
      }
      
      if (!data.session || !data.user) {
        throw new Error('Authentication failed');
      }

      // Step 2: Sync with backend to get complete user data
      try {
        const completeUserData = await syncUserWithBackend(identifier, data.session.access_token);
        
        // Update user state with complete data
        setSession(data.session);
        setSupabaseUser(data.user);
        setUser(completeUserData);
        setIsAuthenticated(true);
        
        // Store complete user data
        tokenService.setToken(data.session.access_token);
        tokenService.setUser(completeUserData);
        
        toast.success('Login successful!');
        setTimeout(() => navigate('/teams'), 1000);
        
      } catch (backendError: any) {
        console.error('Backend sync failed:', backendError);
        // Fallback to Supabase-only data if backend fails
        const fallbackUserData = createUserFromSupabaseUser(data.user);
        
        setSession(data.session);
        setSupabaseUser(data.user);
        setUser(fallbackUserData);
        setIsAuthenticated(true);
        
        tokenService.setToken(data.session.access_token);
        tokenService.setUser(fallbackUserData);
        
        toast.warning('Login successful, but some features may be limited. Please contact support if issues persist.');
        setTimeout(() => navigate('/teams'), 1000);
      }

    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function using Supabase (frontend-only)
  const register = async (data: RegisterData & { password: string }): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Register the user in Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.name,
            full_name: data.name,
            organization_name: data.organizationName,
          }
        }
      });
      
      if (signUpError) {
        // Handle common registration errors
        if (signUpError.message.includes('User already registered')) {
          toast.info('Account already exists. Please log in instead.');
          return true; // Return true to navigate to login
        } else if (signUpError.message.includes('Password should be')) {
          throw new Error('Password should be at least 6 characters long');
        }
        throw new Error(signUpError.message);
      }
      
      if (!authData.user) {
        throw new Error('Registration failed');
      }
      
      // Create user record in database after successful Supabase registration
      if (authData.user && authData.session) {
        await createUserInDatabase(authData.user, data.organizationName, authData.session.access_token);
      }
      
      // Check if email confirmation is required
      if (!authData.session) {
        toast.success('Registration successful! Please check your email to verify your account.');
        return true; // Return true to navigate to login
      }
      
      // If we got a session immediately, sign out and redirect to login
      await supabase.auth.signOut();
      toast.success('Registration successful! Please log in.');
      return true;
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
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

  // Login with OTP (frontend-only)
  const loginWithOTP = async (email: string, otp: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Verify OTP with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: 'email'
      });
      
      if (error) {
        // Handle common OTP errors
        if (error.message.includes('Token has expired')) {
          throw new Error('OTP has expired. Please request a new one.');
        } else if (error.message.includes('Invalid token')) {
          throw new Error('Invalid OTP. Please check and try again.');
        }
        throw new Error(error.message);
      }
      
      if (!data.session || !data.user) {
        throw new Error('OTP verification failed');
      }

      // 🔥 ADD THIS: Log JWT token for OTP login
      console.log('🔐 OTP LOGIN SUCCESS - JWT TOKEN:');
      console.log('Token:', data.session.access_token);
      console.log('For API calls use:', `Bearer ${data.session.access_token}`);
      console.log('Expires:', new Date(data.session.expires_at * 1000).toISOString());
      console.log('User ID:', data.user.id);
      console.log('User Email:', data.user.email);
      console.log('Login Method: OTP');
      
      // Store globally for easy access
      (window as any).lastOTPJWTToken = data.session.access_token;
      console.log('💡 Token also available as: window.lastOTPJWTToken');

      // Success! The auth state change handler will update the UI
      toast.success('Login successful!');
      
      // Navigate to teams page
      setTimeout(() => navigate('/teams'), 1000);

    } catch (error: any) {
      console.error('Login with OTP error:', error);
      toast.error(error.message || 'OTP verification failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Send OTP for registration (frontend-only)
  const sendRegisterOTP = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Send OTP for registration
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: undefined,
          data: {
            username: data.name,
            full_name: data.name,
            organization_name: data.organizationName,
          }
        }
      });
      
      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('User already registered')) {
          toast.info('Account already exists. Please log in instead.');
          throw new Error('User already exists');
        } else if (error.message.includes('Unable to validate email address')) {
          throw new Error('Please enter a valid email address');
        }
        throw new Error(error.message);
      }
      
      toast.success('OTP sent to your email. Please check your inbox.');
    } catch (error: any) {
      console.error('Send register OTP error:', error);
      if (!error.message.includes('User already exists')) {
        toast.error(error.message || 'Failed to send OTP');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register with OTP (frontend-only)
  const registerWithOTP = async (data: OTPRegisterData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Verify OTP with Supabase
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.otp,
        type: 'email'
      });
      
      if (verifyError) {
        // Handle common OTP errors
        if (verifyError.message.includes('Token has expired')) {
          throw new Error('OTP has expired. Please request a new one.');
        } else if (verifyError.message.includes('Invalid token')) {
          throw new Error('Invalid OTP. Please check and try again.');
        }
        throw new Error(verifyError.message);
      }
      
      if (!authData.user || !authData.session) {
        throw new Error('Registration failed');
      }

      // Create user record in database after successful OTP verification
      await createUserInDatabase(authData.user, data.organizationName, authData.session.access_token);

      // Success! Sign out and redirect to login
      await supabase.auth.signOut();
      toast.success('Registration successful! Please log in.');
      return true;
      
    } catch (error: any) {
      console.error('Registration with OTP error:', error);
      toast.error(error.message || 'OTP verification failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to create user record in database
  const createUserInDatabase = async (supabaseUser: SupabaseUser, organizationName: string, accessToken: string) => {
    try {
      console.log('Creating user in database:', {
        user_id: supabaseUser.id,
        email: supabaseUser.email,
        tenant_name: organizationName
      });

      const response = await fetch(`${import.meta.env.VITE_DEV_BASE_API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          user_id: supabaseUser.id,
          username: supabaseUser.user_metadata?.username || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || '',
          email: supabaseUser.email,
          tenant_name: organizationName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Database user creation failed:', errorData);
        throw new Error(errorData.detail || 'Failed to create user in database');
      }

      const result = await response.json();
      console.log('User successfully created in database:', result);
      toast.success('Account created successfully!');
      
    } catch (error: any) {
      console.error('Error creating user in database:', error);
      toast.error('Account created but database setup failed. Please contact support.');
      throw error;
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
    supabaseUser,
    session,
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

