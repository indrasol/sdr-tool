import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Route, Building, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "../components/Auth/AuthContext";

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
import { Separator } from "@/components/ui/separator";

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
        navigate("/login"); // Immediate navigation
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
              Create Account
            </DialogTitle>
            <DialogDescription className="text-white/80">
              Get started with your SecureTrack account
            </DialogDescription>
          </div>

          {/* Form Section */}
          <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="Acme Inc."
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="your.email@example.com"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="Make it strong !"
                          type={showPassword ? "text" : "password"}
                          className="pl-10 pr-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type={showConfirmPassword ? "text" : "password"}
                          className="pl-10 pr-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-3 text-muted-foreground"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </Form>

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


          <div className="text-center text-sm mt-4">
            Already have an account?{" "}
            <button
              onClick={handleLoginClick}
              className="text-primary hover:underline font-medium"
              type="button"
            >
              Log In
            </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Register;
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Route, Building, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { toast } from "sonner";
// import { useAuth } from "../components/Auth/AuthContext";

// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";


// // API base URL (use environment variable in production)
// // const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/v1";


// // Register form schema validation
// const registerFormSchema = z
//   .object({
//     organizationName: z.string().min(1, "Organization name is required"),
//     name: z.string().min(2, "Name must be at least 2 characters"),
//     email: z.string().email("Please enter a valid email address"),
//     password: z.string().min(6, "Password must be at least 6 characters"),
//     confirmPassword: z.string(),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: "Passwords don't match",
//     path: ["confirmPassword"],
//   });

// type RegisterFormValues = z.infer<typeof registerFormSchema>;

// interface RegisterProps {
//   isOpen: boolean;
//   onOpenChange: (open: boolean) => void;
//   onSwitchToLogin: () => void;
// }

// const Register: React.FC<RegisterProps> = ({
//   isOpen,
//   onOpenChange,
//   onSwitchToLogin,
// }) => {
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const { register } = useAuth();

//   // Initialize register form
//   const form = useForm<RegisterFormValues>({
//     resolver: zodResolver(registerFormSchema),
//     defaultValues: {
//       organizationName: "",
//       name: "",
//       email: "",
//       password: "",
//       confirmPassword: "",
//     },
//   });

//   // Handle signup form submission
//   const onSubmit = async (values: RegisterFormValues) => {
//     setIsLoading(true);
//     try {
//       await register({
//         organizationName: values.organizationName,
//         name: values.name,
//         email: values.email,
//         password: values.password,
//         confirmPassword: values.confirmPassword,
//       });
//       toast.success('Account created successfully!');
//       onOpenChange(false);
//     } catch (error: any) {
//       const errorMessage = error.message || 'Registration failed';
//       if (errorMessage.includes('Email already registered')) {
//         form.setError('email', { message: 'Email already registered' });
//         toast.error('Email already registered');
//       } else if (errorMessage.includes('Email address') && errorMessage.includes('invalid')) {
//         form.setError('email', { 
//           message: 'Please use a more complete email address, e.g., yourname@company.com' 
//         });
//         toast.error('Email validation failed. Try a different email format.');
//       } else {
//         toast.error(errorMessage);
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-2xl">
//         <div className="flex flex-col">
//           {/* Logo and Header Section */}
//           <div className="bg-primary p-6 text-white text-center">
//             <div className="flex justify-center mb-4">
//               <div className="bg-white rounded-full p-3 shadow-md">
//                 <Route className="w-10 h-10" style={{ color: "#3ECF8E" }} />
//               </div>
//             </div>
//             <DialogTitle className="text-2xl font-bold text-white mb-1">
//               Create Account
//             </DialogTitle>
//             <DialogDescription className="text-white/80">
//               Get started with your SecureTrack account
//             </DialogDescription>
//           </div>

//           {/* Form Section */}
//           <div className="p-6">
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//               <FormField
//                 control={form.control}
//                 name="organizationName"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Organization Name</FormLabel>
//                     <div className="relative">
//                       <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//                       <FormControl>
//                         <Input
//                           placeholder="Acme Inc."
//                           className="pl-10"
//                           {...field}
//                         />
//                       </FormControl>
//                     </div>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="name"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Username</FormLabel>
//                     <div className="relative">
//                       <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//                       <FormControl>
//                         <Input
//                           placeholder="John Doe"
//                           className="pl-10"
//                           {...field}
//                         />
//                       </FormControl>
//                     </div>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="email"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Email</FormLabel>
//                     <div className="relative">
//                       <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//                       <FormControl>
//                         <Input
//                           placeholder="your.email@example.com"
//                           className="pl-10"
//                           {...field}
//                         />
//                       </FormControl>
//                     </div>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="password"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Password</FormLabel>
//                     <div className="relative">
//                       <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//                       <FormControl>
//                         <Input
//                           placeholder="••••••••"
//                           type={showPassword ? "text" : "password"}
//                           className="pl-10 pr-10"
//                           {...field}
//                         />
//                       </FormControl>
//                       <button
//                         type="button"
//                         onClick={() => setShowPassword(!showPassword)}
//                         className="absolute right-3 top-3 text-muted-foreground"
//                         tabIndex={-1}
//                       >
//                         {showPassword ? (
//                           <EyeOff className="h-4 w-4" />
//                         ) : (
//                           <Eye className="h-4 w-4" />
//                         )}
//                       </button>
//                     </div>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="confirmPassword"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Confirm Password</FormLabel>
//                     <div className="relative">
//                       <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//                       <FormControl>
//                         <Input
//                           placeholder="••••••••"
//                           type={showConfirmPassword ? "text" : "password"}
//                           className="pl-10 pr-10"
//                           {...field}
//                         />
//                       </FormControl>
//                       <button
//                         type="button"
//                         onClick={() =>
//                           setShowConfirmPassword(!showConfirmPassword)
//                         }
//                         className="absolute right-3 top-3 text-muted-foreground"
//                         tabIndex={-1}
//                       >
//                         {showConfirmPassword ? (
//                           <EyeOff className="h-4 w-4" />
//                         ) : (
//                           <Eye className="h-4 w-4" />
//                         )}
//                       </button>
//                     </div>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <Button type="submit" className="w-full" disabled={isLoading}>
//                 {isLoading ? "Creating account..." : "Create Account"}
//               </Button>
//             </form>
//           </Form>

//           <Separator className="my-4"></Separator>

//                 <div className="flex flex-col space-y-3">
//                   <Button
//                     variant="outline"
//                     type="button"
//                     className="w-full flex items-center justify-center"
//                   >
//                     <svg
//                       viewBox="0 0 24 24"
//                       className="h-5 w-5 mr-2"
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path
//                         d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//                         fill="#4285F4"
//                       />
//                       <path
//                         d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//                         fill="#34A853"
//                       />
//                       <path
//                         d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//                         fill="#FBBC05"
//                       />
//                       <path
//                         d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//                         fill="#EA4335"
//                       />
//                     </svg>
//                     Continue with Google
//                   </Button>
//                   <Button
//                     variant="outline"
//                     type="button"
//                     className="w-full flex items-center justify-center"
//                   >
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       viewBox="0 0 24 24"
//                       className="h-5 w-5 mr-2 fill-current"
//                     >
//                       <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
//                     </svg>
//                     Continue with Facebook
//                   </Button>
//                 </div>


//           <div className="text-center text-sm">
//             Already have an account?{" "}
//             <button
//               onClick={onSwitchToLogin}
//               className="text-primary hover:underline font-medium"
//               type="button"
//             >
//               Log In
//             </button>
//             </div>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default Register;
