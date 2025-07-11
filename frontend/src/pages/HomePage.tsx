import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Route, LogIn, UserPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Import new animated components
import { Hero } from "./home/components/Hero";
import { Features } from "./home/components/Features";
import { CTA } from "./home/components/CTA";

const HomePage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/register");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden">
      {/* Minimal Blended Navigation Bar */}
      <motion.nav 
        className="absolute top-0 left-0 right-0 z-50 px-12 py-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
                 <div className="w-full flex items-center justify-between">
          {/* Logo Section */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center w-8 h-8">
              <Route className="w-6 h-6" style={{ color: "#3ECF8E" }} />
            </div>
            <div className="flex items-baseline space-x-2">
              <Link to="/" className="text-xl font-semibold text-gray-900 hover:opacity-90 transition-opacity">
                Secure<span style={{ color: "#3ECF8E" }}>Track</span>
              </Link>
              <a 
                href="https://indrasol.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-gray-500 font-normal hover:text-gray-700 transition-colors duration-200 cursor-pointer"
              >
                by Indrasol
              </a>
            </div>
          </motion.div>

                     {/* Action Buttons */}
           <div className="flex items-center space-x-4">
             <motion.div
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
             >
               <Button
                 variant="ghost"
                 size="sm"
                 className="text-sm font-medium transition-all duration-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 backdrop-blur-sm px-6 py-2 rounded-lg"
                 onClick={() => navigate("/login")}
               >
                 <LogIn className="w-4 h-4 mr-2" />
                 Sign In
               </Button>
             </motion.div>
             
             <motion.div
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
             >
               <Button
                 variant="default"
                 size="sm"
                 className="flex items-center bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-6 py-2 rounded-lg font-medium group"
                 onClick={() => navigate("/register")}
               >
                 <UserPlus className="w-4 h-4 mr-2" />
                 Get Started Free
                 <motion.div
                   className="ml-2"
                   animate={{ x: [0, 3, 0] }}
                   transition={{
                     duration: 1.5,
                     repeat: Infinity,
                     ease: "easeInOut",
                   }}
                 >
                   <ArrowRight className="w-4 h-4" />
                 </motion.div>
               </Button>
             </motion.div>
           </div>
        </div>
      </motion.nav>

      {/* Main Content with Animated Sections */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero onGetStarted={handleGetStarted} />

        {/* Features Section */}
        <Features />

        {/* CTA Section */}
        <CTA onGetStarted={handleGetStarted} />
      </main>

      {/* Footer */}
      <motion.footer 
        className="bg-gray-900 text-white py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
                 <div className="w-full px-12">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8">
                  <Route className="w-6 h-6" style={{ color: "#3ECF8E" }} />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-semibold text-white">
                    Secure<span style={{ color: "#3ECF8E" }}>Track</span>
                  </span>
                  <a 
                    href="https://indrasol.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 font-normal hover:text-gray-300 transition-colors duration-200 cursor-pointer"
                  >
                    by Indrasol
                  </a>
                </div>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                AI-powered secure architecture design platform.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SecureTrack by Indrasol. All rights reserved.</p>
          </div>
        </div>
      </motion.footer>


    </div>
  );
};

export default HomePage;
