import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Route, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import AuthContext from "../components/context/AuthContext";

// Login form schema validation
const loginFormSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

interface LoginProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToRegister: () => void;
}

const Login = ({ isOpen, onOpenChange, onSwitchToRegister }: LoginProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Initialize login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  // Handle login form submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    console.log("Login values:", values);
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Attempt login via AuthContext
      await login(values.identifier, values.password);
      
      // Success notification and UI update
      toast.success("Login successful!");
      onOpenChange(false);
      loginForm.reset();

      // Introduce a 1-second delay before navigating to "/dashboard"
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000); // 1000ms = 1 second delay
      
      // The redirect is now likely handled by the AuthContext or related navigation guards
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
      toast.error(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-2xl">
        <div className="flex flex-col">
          {/* Logo and Header Section */}
          <div className="bg-primary p-6 text-white text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-full p-3 shadow-md">
                <Route className="w-10 h-10" style={{ color: "#3ECF8E" }} />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-white mb-1">
              Welcome back
            </DialogTitle>
            <DialogDescription className="text-white/80">
              Log in to access your SecureTrack account
            </DialogDescription>
          </div>

          {/* Form Section */}
          <div className="p-6">
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email or Username</FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input
                            className="pl-10"
                            placeholder="email@example.com or username"
                            {...field}
                            autoComplete="username"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input
                            className="pl-10 pr-10"
                            placeholder="••••••••"
                            type={showPassword ? "text" : "password"}
                            {...field}
                            autoComplete="current-password"
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-sm text-right">
                  <Link
                    to="/forgot-password"
                    className="text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full text-white"
                  variant="default"
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Log In"}
                </Button>

                <Separator className="my-4"></Separator>

                <div className="flex flex-col space-y-3">
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full flex items-center justify-center"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 mr-2 fill-current"
                    >
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                    Continue with Facebook
                  </Button>
                </div>

                <div className="text-sm text-center pt-4">
                  <span className="text-muted-foreground">
                    Don't have an account?
                  </span>{" "}
                  <button
                    type="button"
                    onClick={onSwitchToRegister}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Login;