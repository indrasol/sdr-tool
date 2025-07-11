import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Route, Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "../components/Auth/AuthContext";
import { motion } from "framer-motion";

// Login form schema validation
const loginFormSchema = z.object({
  identifier: z.string().min(1, "Email or Username is required"),
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
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    if (isLoading) return; // Prevent multiple submissions

    try {
      console.log("Starting login process...");

      // Add a timeout to handle stuck requests
      const loginPromise = login(values.identifier, values.password);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Login request timed out. Please try again.")), 10000)
      );

      // Race between login and timeout
      await Promise.race([loginPromise, timeoutPromise]);

      console.log("Login successful, closing dialog...");
      loginForm.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Login error in component:", error);

      // Specific error handling based on message
      if (error.message?.includes("timeout")) {
        toast.error("Login request timed out. Please try again.");
      } else if (error.message?.includes("NetworkError")) {
        toast.error("Network error. Please check your connection and try again.");
      } else if (error.message?.includes("CORS")) {
        toast.error("Connection issue with the server. Please try again later.");
      } else if (error.message?.includes("Invalid login credentials")) {
        toast.error("Invalid email/username or password.");
        loginForm.setError("password", { message: "Invalid credentials" });
        loginForm.reset({ identifier: values.identifier, password: "" });
        loginForm.setFocus("password");
      } else {
        toast.error(error.message || "Login failed");
      }
    }
  };

  const handleSwitchToRegisterClick = () => {
    loginForm.reset();
    onOpenChange(false);
    navigate("/register");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent closing the dialog while login is in progress
      if (isLoading && !open) return;
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
        <div className="flex flex-col">
          {/* Enhanced Header Section */}
          <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 p-8 text-white text-center relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
                `,
                animation: 'float 20s ease-in-out infinite'
              }} />
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                  <Route className="w-12 h-12" style={{ color: "#3ECF8E" }} />
                </div>
              </div>
              <DialogTitle className="text-3xl font-bold text-white mb-2">
                Welcome Back
              </DialogTitle>
              <DialogDescription className="text-white/90 text-lg">
                Sign in to your SecureTrack account
              </DialogDescription>
            </motion.div>
          </div>

          {/* Enhanced Form Section */}
          <div className="p-8 bg-white">
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-6"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <FormField
                    control={loginForm.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Email or Username</FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                          <FormControl>
                            <Input
                              className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                              placeholder="Enter your email or username"
                              {...field}
                              autoComplete="email"
                              disabled={isLoading}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                          <FormControl>
                            <Input
                              className="pl-12 pr-12 h-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                              placeholder="Enter your password"
                              type={showPassword ? "text" : "password"}
                              {...field}
                              autoComplete="current-password"
                              disabled={isLoading}
                            />
                          </FormControl>
                          <button
                            type="button"
                            className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
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
                </motion.div>

                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300"
                  >
                    Forgot password?
                  </Link>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Sign In
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </div>
                    )}
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="text-center pt-4"
                >
                  <span className="text-gray-600">
                    Don't have an account?
                  </span>{" "}
                  <button
                    type="button"
                    onClick={handleSwitchToRegisterClick}
                    className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300"
                  >
                    Sign up
                  </button>
                </motion.div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Login;