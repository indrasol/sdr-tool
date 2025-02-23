import { useState } from "react";
import { Plus, Users, Settings, BarChart, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateProjectModel } from "@/pages/CreateProjectModel";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <div className={cn("w-16 border-r bg-white flex flex-col items-center py-4", className)}>
        <div className="mb-8">
          <Menu className="w-6 h-6 text-gray-600" />
        </div>
        <nav className="space-y-6">
          <button 
            onClick={() => setCreateDialogOpen(true)}
            className="sidebar-item w-full flex justify-center hover:bg-gray-200 rounded-md p-2 transition duration-200 ease-in-out transform hover:scale-105"
          >
            <Plus className="w-6 h-6 text-gray-600" />
          </button>
          <a href="#" className="sidebar-item w-full flex justify-center hover:bg-gray-200 rounded-md p-2 transition duration-200 ease-in-out transform hover:scale-105">
            <Users className="w-6 h-6 text-gray-600" />
          </a>
          <a href="#" className="sidebar-item w-full flex justify-center hover:bg-gray-200 rounded-md p-2 transition duration-200 ease-in-out transform hover:scale-105">
            <BarChart className="w-6 h-6 text-gray-600" />
          </a>
          <a href="#" className="sidebar-item w-full flex justify-center hover:bg-gray-200 rounded-md p-2 transition duration-200 ease-in-out transform hover:scale-105">
            <Settings className="w-6 h-6 text-gray-600" />
          </a>
        </nav>
      </div>
      
      <CreateProjectModel 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        addProject={(project) => {
          // Implement the addProject function here
          console.log("Project added:", project);
        }}
      />
    </>
  );
}

export default Sidebar;