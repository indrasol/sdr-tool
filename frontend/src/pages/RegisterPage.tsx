import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Route, Building, User, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "../components/Auth/AuthContext";
import { motion } from "framer-motion";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Register form schema validation
const registerFormSchema = z
  .object({
    organizationName: z.string().min(1, "Organization name is required"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Initialize register form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      organizationName: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle signup form submission
  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // Attempt registration
      const shouldNavigate = await register({
        organizationName: values.organizationName,
        name: values.name,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      
      if (shouldNavigate) {
        form.reset();
        navigate("/login");
      }
    } catch (error: any) {
      // Only set form errors for specific validation cases; rely on register for toasts
      const errorMessage = error.message || "An unexpected error occurred";
      if (errorMessage.includes("Email already registered")) {
        form.setError("email", { message: "Email already registered" });
      } else if (
        errorMessage.includes("Email address") &&
        errorMessage.includes("invalid")
      ) {
        form.setError("email", {
          message: "Please use a more complete email address, e.g., yourname@company.com",
        });
      }
      // Other errors (e.g., network, backend failures) are handled by register's toast
    } finally {
      setIsLoading(false);
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

      {/* Right Side - Register Form */}
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
                <h2 className="text-3xl font-bold text-gray-900">Create account</h2>
                <p className="text-gray-600">Let's get started. It's totally free.</p>
              </div>

              {/* Register Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <FormField
                      control={form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Organization Name</FormLabel>
                          <div className="relative">
                            <Building className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                            <FormControl>
                              <Input
                                placeholder="Acme Inc."
                                className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                                {...field}
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
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Username</FormLabel>
                          <div className="relative">
                            <User className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                            <FormControl>
                              <Input
                                placeholder="John Doe"
                                className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                                {...field}
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
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                          <div className="relative">
                            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                            <FormControl>
                              <Input
                                placeholder="your.email@example.com"
                                className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                                {...field}
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
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                          <div className="relative">
                            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                            <FormControl>
                              <Input
                                placeholder="Create a strong password"
                                type={showPassword ? "text" : "password"}
                                className="pl-12 pr-12 h-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
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

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Confirm Password</FormLabel>
                          <div className="relative">
                            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                            <FormControl>
                              <Input
                                placeholder="Confirm your password"
                                type={showConfirmPassword ? "text" : "password"}
                                className="pl-12 pr-12 h-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                              disabled={isLoading}
                            >
                              {showConfirmPassword ? (
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

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Creating account...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          Create Account
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>

              {/* Login Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="text-center pt-4"
              >
                <span className="text-gray-600">
                  Already have an account?
                </span>{" "}
                <Link
                  to="/login"
                  className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300"
                >
                  Sign in
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 