import React from "react";
import { useLocation } from "react-router-dom";
import SidebarNav from "./SidebarNav";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  noMargins?: boolean;
}

const Layout = ({ children, noMargins }: LayoutProps) => {
  const location = useLocation();
  
  // Check if current path contains "model-with-ai" or the component passed noMargins prop
  const isModelWithAI = location.pathname.includes("model-with-ai") || noMargins;
  
  return (
    <div className="min-h-screen flex bg-background">
      <SidebarNav />
      <main 
        className={cn(
          "flex-1 w-full animate-fade-in",
          // Apply padding and overflow conditionally - no padding and different overflow for ModelWithAI pages
          isModelWithAI ? "overflow-hidden p-0" : "overflow-y-auto px-6 md:px-8 lg:px-10 py-4"
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;