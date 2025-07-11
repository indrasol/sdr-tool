import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Route, Building, User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "../components/Auth/AuthContext";
import { motion } from "framer-motion";

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

interface RegisterProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({
  isOpen,
  onOpenChange,
  onSwitchToLogin,
}) => {
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
        onOpenChange(false);
        navigate("/"); // Redirect to landing page; user can log in after verifying email
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

  // Handle direct navigation to login page
  const handleLoginClick = () => {
    onOpenChange(false);
    navigate("/login");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
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
                Create Account
              </DialogTitle>
              <DialogDescription className="text-white/90 text-lg">
                Get started with your SecureTrack account
              </DialogDescription>
            </motion.div>
          </div>

          {/* Enhanced Form Section */}
          <div className="p-8 bg-white">
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
                              placeholder="Make it strong!"
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
                              placeholder="Type your password again"
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

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="text-center pt-4"
                >
                  <span className="text-gray-600">
                    Already have an account?
                  </span>{" "}
                  <button
                    onClick={handleLoginClick}
                    className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300"
                    type="button"
                  >
                    Log In
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

export default Register;
