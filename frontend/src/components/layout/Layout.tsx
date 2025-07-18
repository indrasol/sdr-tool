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
  
  // Track collapsed state of sidebar to adjust main content margin
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  
  // Function to be called by SidebarNav when collapsed state changes
  const handleSidebarCollapseChange = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="min-h-screen flex bg-background">
      <SidebarNav onCollapseChange={handleSidebarCollapseChange} />
      <main 
        className={cn(
          "flex-1 w-full animate-fade-in",
          // Apply padding and overflow conditionally - no padding and different overflow for ModelWithAI pages
          isModelWithAI 
            ? "overflow-hidden p-0" 
            : "overflow-y-auto px-6 md:px-8 lg:px-10 py-4",
          // Add left margin to account for fixed sidebar width
          sidebarCollapsed ? "ml-20" : "ml-64"
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;