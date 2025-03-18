import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Route, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Globe,
  FileText,
  PlusCircle,
  LogIn,
  UserPlus,
  ArrowRight,
  Zap,
  Lock,
  LineChart,
  LayoutDashboard,
} from "lucide-react";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

const HomePage = () => {
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("isLoginDialogOpen:", isLoginDialogOpen);
    console.log("isRegisterDialogOpen:", isRegisterDialogOpen);
  }, [isLoginDialogOpen, isRegisterDialogOpen]);
  // Switch from register to login
  const switchToLogin = () => {
    console.log("Switching to login");
    setIsRegisterDialogOpen(false);
    console.log("Opening login dialog");
    setTimeout(() => setIsLoginDialogOpen(true), 100);
  };

  // Switch from login to register
  const switchToRegister = () => {
    console.log("Switching to register");
    setIsLoginDialogOpen(false);
    console.log("Opening register dialog");
    setIsRegisterDialogOpen(true);
    // setTimeout(() => setIsRegisterDialogOpen(true), 100);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2 hover:opacity-90 transition-opacity"
            >
              <div className="relative flex items-center">
                <Route className="w-8 h-8" style={{ color: "#3ECF8E" }} />
              </div>
              <span className="text-xl font-semibold text-foreground">
                Secure<span style={{ color: "#3ECF8E" }}>Track</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-sm font-medium transition-all border-securetrack-purple/50 text-securetrack-purple hover:bg-gradient-to-br from-securetrack-purple to-securetrack-lightpurple hover:text-white hover:border-securetrack-purple shadow-sm hover:-translate-y-1 duration-300"
              onClick={() => setIsLoginDialogOpen(true)}
            >
              <LogIn className="h-4 w-10" />
              Login
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex items-center"
              onClick={() => setIsRegisterDialogOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Register
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content with Off-center Composition */}
      <div className="flex-1 overflow-hidden">
        {/* Hero Section with Off-center Design */}
        <div className="relative py-20 md:py-24">
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-green-100 rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100 rounded-full opacity-30 translate-x-1/3 translate-y-1/4"></div>
          <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-yellow-100 rounded-full opacity-40"></div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Text Content - Takes up more space on larger screens */}
              <div className="md:col-span-7 lg:col-span-6 md:pr-8">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                  Secure Your Projects With Confidence
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  SecureTrack provides industry-leading security monitoring and
                  threat detection for all your development projects.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="default"
                    size="lg"
                    className="flex items-center"
                    onClick={() => setIsRegisterDialogOpen(true)}
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="mt-12 flex flex-wrap items-center gap-6">
                  <p className="text-sm text-gray-500 font-medium">
                    Trusted by leading companies:
                  </p>
                  <div className="flex space-x-6 opacity-70">
                    {/* Replace with actual company logos */}
                    <div className="h-6 text-gray-400">Company 1</div>
                    <div className="h-6 text-gray-400">Company 2</div>
                    <div className="h-6 text-gray-400">Company 3</div>
                  </div>
                </div>
              </div>

              {/* Visual Element - Off-center video */}
              <div className="md:col-span-5 lg:col-span-6 relative">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="bg-gray-50 p-6 border-b">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  <div className="p-6 bg-white">
                    {/* Replace the Shield icon with video */}
                    <div className="h-64 rounded-lg overflow-hidden">
                      <video
                        className="w-full h-full object-cover"
                        controls
                        muted
                        autoPlay
                        loop
                        // playsInline
                      >
                        <source
                          src="/path/to/your/video.mp4"
                          type="video/mp4"
                        />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    {/* Caption or description below video */}
                    <div className="mt-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>

                {/* Keep the floating elements */}
                <div className="absolute -right-6 -top-6 bg-purple-50 p-4 rounded-lg shadow-md transform rotate-6 hidden md:block">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -left-8 -bottom-8 bg-blue-50 p-4 rounded-lg shadow-md transform -rotate-12 hidden md:block">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
              </div>
              {/* Visual Element - Off-center image/illustration */}
              {/* <div className="md:col-span-5 lg:col-span-6 relative">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="bg-gray-50 p-6 border-b">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  <div className="p-6 bg-white">
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-24 h-24 text-primary opacity-80" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div> */}

              {/* Floating Elements */}
              {/* <div className="absolute -right-6 -top-6 bg-purple-50 p-4 rounded-lg shadow-md transform rotate-6 hidden md:block">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -left-8 -bottom-8 bg-blue-50 p-4 rounded-lg shadow-md transform -rotate-12 hidden md:block">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
              </div> */}
            </div>
          </div>
        </div>

        {/* Feature Section */}
        <div className="bg-white py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Choose SecureTrack?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <Zap className="w-12 h-12 text-yellow-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-3">
                    Real-time Protection
                  </h3>
                  <p className="text-gray-600">
                    Monitor your projects in real-time with instant alerts and
                    notifications for any security threats.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <Lock className="w-12 h-12 text-blue-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-3">
                    Advanced Security
                  </h3>
                  <p className="text-gray-600">
                    Industry-leading encryption and security protocols to keep
                    your data safe at all times.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <LineChart className="w-12 h-12 text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-3">
                    Detailed Analytics
                  </h3>
                  <p className="text-gray-600">
                    Comprehensive analytics and reporting to help you understand
                    your security posture.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-16 text-center">
              <Button
                size="lg"
                variant="default"
                className="flex items-center px-8"
                onClick={() => setIsRegisterDialogOpen(true)}
              >
                Start Securing Your Projects
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Route className="w-6 h-6" style={{ color: "#3ECF8E" }} />
                <span className="text-lg font-semibold">
                  Secure<span style={{ color: "#3ECF8E" }}>Track</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Providing industry-leading security solutions for your projects
                since 2023.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/careers"
                    className="text-gray-400 hover:text-white"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-gray-400 hover:text-white"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/blog" className="text-gray-400 hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    to="/documentation"
                    className="text-gray-400 hover:text-white"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    to="/support"
                    className="text-gray-400 hover:text-white"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/terms" className="text-gray-400 hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-gray-400 hover:text-white"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cookies"
                    className="text-gray-400 hover:text-white"
                  >
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
            <p>&copy; 2025 SecureTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Login Dialog */}
      <Login
        isOpen={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
        onSwitchToRegister={switchToRegister}
      />

      {/* Sign Up Dialog */}
      <Register
        isOpen={isRegisterDialogOpen}
        onOpenChange={(open) => setIsRegisterDialogOpen(open)}
        // onOpenChange={setIsRegisterDialogOpen}
        onSwitchToLogin={switchToLogin}
      />
    </div>
  );
};

export default HomePage;
