
import React from "react";
import AppHeader from "./AppHeader";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNCQkJEQzkiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTYgdi02aDYtNnY2aDZ6TTMwIDM2aC02di02aDZ2NnoiLz48L2c+PC9nPjwvc3ZnPg==')]">
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