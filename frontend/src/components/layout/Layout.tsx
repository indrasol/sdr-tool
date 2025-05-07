import React from "react";
import AppHeader from "./AppHeader";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 container py-8 animate-fade-in">
        {children}
      </main>
      {/* <footer className="py-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <p>© 2025 SecureTrack. All rights reserved.</p>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <a href="#" className="hover:text-securetrack-purple transition-colors">Terms</a>
              <a href="#" className="hover:text-securetrack-purple transition-colors">Privacy</a>
              <a href="#" className="hover:text-securetrack-purple transition-colors">Help</a>
            </div>
          </div>
        </div>
      </footer> */}
    </div>
  );
};

export default Layout;