import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Route, Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const LoginPage = () => {
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
    if (isLoading) return;

    try {
      console.log("Starting login process...");

      const loginPromise = login(values.identifier, values.password);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Login request timed out. Please try again.")), 10000)
      );

      await Promise.race([loginPromise, timeoutPromise]);

      console.log("Login successful, navigating to teams page...");
      loginForm.reset();
      navigate("/teams");
    } catch (error: any) {
      console.error("Login error in component:", error);

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

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Secure Bot Track Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
        {/* High-Resolution Secure Bot Track Background */}
        <div 
          className="absolute inset-0 bg-contain bg-center bg-no-repeat transform scale-80 transition-transform duration-700 hover:scale-85"
          style={{
            backgroundImage: "url('/secure_bot_track.png')",
            filter: 'brightness(1.0) contrast(1.05) saturate(1.1)'
          }}
        >
          {/* Professional gradient overlay for enhanced visual appeal */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/8 via-transparent to-cyan-600/8"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 via-transparent to-transparent"></div>
          {/* Subtle radial gradient to blend edges with background */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-indigo-50/30"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-transparent to-blue-50/30"></div>
        </div>
        
        {/* Subtle bot/security-themed decorative elements */}
        <div className="absolute top-8 left-8 w-20 h-20 bg-gradient-to-br from-indigo-400/15 to-blue-400/15 rounded-full blur-xl"></div>
        <div className="absolute bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-cyan-400/15 to-blue-400/15 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-6 w-12 h-12 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-lg"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Header */}
        <div className="p-8 flex items-center justify-between">
          <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8">
              <Route className="w-6 h-6" style={{ color: "#3ECF8E" }} />
            </div>
            <Link to="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors duration-300 cursor-pointer">
              Secure<span style={{ color: "#3ECF8E" }} className="transition-colors duration-300 hover:brightness-110">Track</span>
            </Link>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Form Header */}
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Sign in</h2>
                <p className="text-gray-600">Welcome back! Please enter your details.</p>
              </div>

              {/* Login Form */}
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
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

                  <div className="flex justify-between items-center">
                    <label className="flex items-center space-x-2 text-sm text-gray-600">
                      <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      <span>Remember me</span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
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
                </form>
              </Form>

              {/* Sign Up Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-center pt-4"
              >
                <span className="text-gray-600">
                  Don't have an account?
                </span>{" "}
                <Link
                  to="/register"
                  className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300"
                >
                  Sign up for free
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 