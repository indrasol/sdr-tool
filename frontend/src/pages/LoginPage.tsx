import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Route, Mail, ArrowRight, ArrowLeft } from "lucide-react";
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
import { OTPInput } from "@/components/ui/otp-input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "../components/Auth/AuthContext";
import { motion } from "framer-motion";

// Email form schema validation
const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

const LoginPage = () => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [userEmail, setUserEmail] = useState('');
  const { sendLoginOTP, loginWithOTP, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const onEmailSubmit = async (values: EmailFormValues) => {
    if (isLoading) return;

    try {
      console.log("Sending OTP to email...");
      await sendLoginOTP(values.email);
      setUserEmail(values.email);
      setStep('otp');
    } catch (error: any) {
      console.error("Send OTP error:", error);
      
      // If user not found, suggest registration
      if (error.message?.includes('No account found') || 
          error.message?.includes('User not found')) {
        emailForm.setError("email", { 
          message: "No account found. Please register first." 
        });
      }
      // Other error handling is done in the auth context
    }
  };

  const onOTPComplete = async (otp: string) => {
    if (isLoading) return;

    try {
      console.log("Verifying OTP...");
      await loginWithOTP(userEmail, otp);
      console.log("Login successful, navigating to teams page...");
      navigate("/teams");
    } catch (error: any) {
      console.error("OTP verification error:", error);
      // Error handling is done in the auth context
    }
  };

  const onResendOTP = async () => {
    try {
      await sendLoginOTP(userEmail);
    } catch (error: any) {
      console.error("Resend OTP error:", error);
    }
  };

  const goBackToEmail = () => {
    setStep('email');
    setUserEmail('');
    emailForm.reset();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
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
                <h2 className="text-3xl font-bold text-gray-900">
                  {step === 'email' ? 'Sign in' : 'Verify OTP'}
                </h2>
                <p className="text-gray-600">
                  {step === 'email' 
                    ? 'Welcome back! Please enter your email.' 
                    : `Enter the 6-digit code sent to ${userEmail}`
                  }
                </p>
              </div>

              {/* Email Step */}
              {step === 'email' && (
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <FormField
                        control={emailForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                            <div className="relative">
                              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                              <FormControl>
                                <Input
                                  className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                                  placeholder="Enter your email address"
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Sending OTP...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            Send OTP
                            <ArrowRight className="ml-2 w-5 h-5" />
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </Form>
              )}

              {/* OTP Step */}
              {step === 'otp' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* Back Button */}
                  <div className="flex justify-start">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={goBackToEmail}
                      disabled={isLoading}
                      className="text-gray-600 hover:text-gray-900 p-0 h-auto font-normal"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to email
                    </Button>
                  </div>

                  {/* OTP Input */}
                  <OTPInput
                    length={6}
                    onComplete={onOTPComplete}
                    onResend={onResendOTP}
                    isLoading={isLoading}
                    disabled={isLoading}
                    timerDuration={300} // 5 minutes
                  />
                </motion.div>
              )}

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

      {/* Right Side - Secure Bot Track Image */}
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
    </div>
  );
};

export default LoginPage; 