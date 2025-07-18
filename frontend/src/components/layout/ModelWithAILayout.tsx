import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Route, LogOut, ArrowLeft, Copy, Check } from "lucide-react";
import { useAuth } from "@/components/Auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ModelWithAILayoutProps {
  children: React.ReactNode;
  projectId?: string;
}

const ModelWithAILayout: React.FC<ModelWithAILayoutProps> = ({ children, projectId }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [copied, setCopied] = useState(false);
  
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleBackToProjects = () => {
    navigate("/projects");
  };
  
  const copyProjectId = () => {
    if (!projectId) return;

    navigator.clipboard.writeText(projectId)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy project ID:', err);
      });
  };

  return (
    <>
      {/* Fixed position infinite dotted background */}
      <div className="fixed inset-0 w-full h-full z-[-1] bg-gray-50 bg-[radial-gradient(circle,#d1d5db_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
      
      <div className="min-h-screen flex flex-col bg-transparent">
      {/* Minimal header with fixed positioning and no background */}
      <header className="fixed top-0 left-0 right-0 h-16 px-6 flex items-center justify-between z-50">
        {/* SecureTrack logo on left */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
          <Route className="w-6 h-6 flex-shrink-0" style={{ color: "#3ECF8E" }} />
          <div className="flex items-end gap-1">
            <Link
              to="/teams"
              className="text-2xl font-semibold text-gray-900 hover:opacity-90 transition-opacity text-shadow-sm leading-none"
            >
              Secure<span style={{ color: "#3ECF8E" }}>Track</span>
            </Link>
            <a
              href="https://indrasol.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 font-normal hover:text-blue-700 transition-colors duration-200 cursor-pointer ml-1 mb-0 text-shadow-xs"
            >
              by Indrasol
            </a>
          </div>
        </div>

        {/* Action buttons on right */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleBackToProjects}
            variant="outline"
            className="flex items-center gap-2 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 hover:border-blue-300 text-shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 text-blue-700" /> 
            <span className="text-blue-700 font-medium">Back to Projects</span>
          </Button>
          
          {/* Project ID button (similar to DiagramActions implementation) */}
          {projectId && projectId !== 'default-project' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="flex items-center h-9 px-3 rounded-md border border-blue-200/20 bg-transparent hover:bg-blue-50/10 cursor-pointer text-shadow-sm"
                    onClick={copyProjectId}
                  >
                    <span className="text-blue-700 font-medium">{projectId}</span>
                    {copied ? (
                      <Check size={14} className="ml-2 text-green-500" />
                    ) : (
                      <Copy size={14} className="ml-2 text-blue-500 opacity-70" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">Click to copy project ID</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="flex items-center gap-2 text-gray-600 hover:text-securetrack-purple transition-colors bg-transparent hover:bg-gray-50/10 text-shadow-sm"
          >
            Sign out <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main content area - full width and height */}
      <main className="flex-1 w-full overflow-hidden">
        {children}
      </main>
    </div>
    </>
  );
};

export default ModelWithAILayout; 