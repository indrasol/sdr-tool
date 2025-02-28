import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, ArrowDown, Globe, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import CreateProjectModal from "./CreateProjectModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ModelTypeDropdown from "@/components/ui/ModelTypeDropdown";
import PriorityDropdown from "@/components/ui/PriorityDropdown";
import StatusDropdown from "@/components/ui/StatusDropdown";
import { formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "@/components/ui/use-toast";

interface ProjectModel {
  id: string;
  name: string;
  version?: string;
  status: "None" | "Started" | "In Progress" | "Completed";
  user: string;
  modified: string;
  created: string;
  priority: "0-None" | "1-High" | "2-Medium" | "3-Low";
  modelType: string;
  description?: string;
  projectNumber?: string;
  tags?: string;
}

// Fallback mock data in case API fails
const mockData: ProjectModel[] = [
  {
    id: "1",
    name: "Uber.com",
    version: "1.0",
    status: "Started",
    user: "Joe",
    modified: "2025-02-22T00:00:00Z",
    created: "2025-02-12T00:00:00Z",
    priority: "1-High",
    modelType: "Model With AI",
    description: "Ride-sharing service",
    projectNumber: "P001",
  },
  {
    id: "2",
    name: "lyft.com",
    version: "1",
    status: "In Progress",
    user: "Joe",
    modified: "2025-02-17T00:00:00Z",
    created: "2025-02-10T00:00:00Z",
    priority: "2-Medium",
    modelType: "Existing Project",
    description: "Another ride-sharing service",
    projectNumber: "P002",
  },
  {
    id: "3",
    name: "amazon.com",
    version: "1",
    status: "Completed",
    user: "david",
    modified: "2025-02-17T00:00:00Z",
    created: "2025-02-10T00:00:00Z",
    priority: "3-Low",
    modelType: "Model With AI",
    description: "E-commerce platform",
    projectNumber: "P003",
  },
];

export default function ProjectList() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [prioritySortOrder, setPrioritySortOrder] = useState<"asc" | "desc" | null>(null);
  const [modifiedSortOrder, setModifiedSortOrder] = useState<"asc" | "desc" | null>(null);
  const [createdSortOrder, setCreatedSortOrder] = useState<"asc" | "desc" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProject, setEditingProject] = useState<ProjectModel | null>(null);
  const navigate = useNavigate();

  // Fetch projects from API on component mount
  useEffect(() => {
    fetchProjects();
  }, []);
  

  // Function to fetch projects from API
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/v1/routes/projects');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Map API response to ProjectModel format
      const formattedProjects: ProjectModel[] = data.map((item: any) => ({
        id: item.project_id || String(item.id) || String(Date.now()),
        name: item.name || "",
        status: item.status || "None",
        user: item.user || "Unknown",
        modified: item.modified || new Date().toISOString(),
        created: item.created || new Date().toISOString(),
        priority: item.priority || "0-None",
        modelType: item.modelType || "Model With AI",
        description: item.description || "",
        //projectNumber: item.projectNumber || `P${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        projectNumber:item.project_number,
        tags: item.tags || "",
        version: item.version || "1.0"

      }));
      
       setProjects(formattedProjects);
      // Fallback to mock data
      console.log("Projects fetched:", data);
      console.log("Formatted projects:", formattedProjects);
      setError("");
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Using mock data instead.");
      setProjects(mockData); // Fallback to mock data
    } finally {
      setLoading(false);
    }
  };


  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePriorityChange = async (id: string, newPriority: "0-None" | "1-High" | "2-Medium" | "3-Low") => {
    try {
      // Find the project to update
      const projectToUpdate = projects.find(p => p.id === id);
      if (!projectToUpdate) return;
      
      // Send update to API
      const response = await fetch(`http://localhost:8000/v1/routes/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...projectToUpdate, priority: newPriority }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Update state locally
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === id ? { ...project, priority: newPriority } : project
        )
      );
    } catch (err) {
      console.error("Error updating priority:", err);
      // Still update UI optimistically
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === id ? { ...project, priority: newPriority } : project
        )
      );
    }
  };

  // const handleStatusChange = async (id: string, newStatus: "None" | "Started" | "In Progress" | "Completed") => {
  //   try {
  //     // Find the project to update
  //     const projectToUpdate = projects.find(p => p.id === id);
  //     if (!projectToUpdate) return;
      
  //     // Send update to API
  //     const response = await fetch(`http://localhost:8000/v1/routes/projects/${id}`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ ...projectToUpdate, status: newStatus }),
  //     });
      
  //     if (!response.ok) {
  //       throw new Error(`API error: ${response.status}`);
  //     }
      
  //     // Update state locally
  //     setProjects((prevProjects) =>
  //       prevProjects.map((project) =>
  //         project.id === id ? { ...project, status: newStatus } : project
  //       )
  //     );
  //   } catch (err) {
  //     console.error("Error updating status:", err);
  //     // Still update UI optimistically
  //     setProjects((prevProjects) =>
  //       prevProjects.map((project) =>
  //         project.id === id ? { ...project, status: newStatus } : project
  //       )
  //     );
  //   }
  // };
  // Update handleStatusChange function
  const handleStatusChange = async (id: string, newStatus: "None" | "Started" | "In Progress" | "Completed") => {
    try {
      // Send update to API
      const response = await fetch(`http://localhost:8000/v1/routes/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Update state locally
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === id ? { ...project, status: newStatus } : project
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
      // Still update UI optimistically
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === id ? { ...project, status: newStatus } : project
        )
      );
    }
};

  const handleModelTypeChange = async (id: string, newModelType: string) => {
    try {
      // Find the project to update
      const projectToUpdate = projects.find(p => p.id === id);
      if (!projectToUpdate) return;
      
      // Send update to API
      const response = await fetch(`http://localhost:8000/v1/routes/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...projectToUpdate, modelType: newModelType }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Update state locally
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === id ? { ...project, modelType: newModelType } : project
        )
      );
    } catch (err) {
      console.error("Error updating model type:", err);
      // Still update UI optimistically
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === id ? { ...project, modelType: newModelType } : project
        )
      );
    }
  };

  const addProject = (project: ProjectModel) => {
    setProjects((prevProjects) => [...prevProjects, project]);
  };

  const handleEdit = (id: string) => {
    // Get project details
    const projectToEdit = projects.find(project => project.id === id);
    if (!projectToEdit) {
      toast({
        title: "Error",
        description: "Project not found",
        variant: "destructive",
      });
      return;
    }
    
    // Set the project being edited and open the modal
    setEditingProject(projectToEdit);
    setIsDialogOpen(true);
  };

  // Function to save edited project
  const handleSaveProject = async (updatedProject: ProjectModel) => {
    try {
      // Send update to API
      const response = await fetch(`http://localhost:8000/v1/routes/projects/${updatedProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProject),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Update the project in the state
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === updatedProject.id ? updatedProject : project
        )
      );
      
      // Reset editing project
      setEditingProject(null);
      
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    } catch (err) {
      console.error("Error updating project:", err);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });

      // Still update UI optimistically
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === updatedProject.id ? updatedProject : project
        )
      );
    }
  };
      

  const handleDelete = async (id: string) => {
    try {
      // Send delete request to API
      const response = await fetch(`http://localhost:8000/v1/routes/projects/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Remove project from state
      setProjects((prevProjects) =>
        prevProjects.filter((project) => project.id !== id)
      );
      
      // Clear selection if deleted project was selected
      setSelectedItems(prev => prev.filter(item => item !== id));
    } catch (err) {
      console.error("Error deleting project:", err);
      // Still update UI optimistically
      setProjects((prevProjects) =>
        prevProjects.filter((project) => project.id !== id)
      );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (err) {
      return dateString;
    }
  };

  const handleSort = () => {
    // Cycle through: null -> asc -> desc -> null
    let newSortOrder: "asc" | "desc" | null;
    if (sortOrder === null) {
      newSortOrder = "asc";
    } else if (sortOrder === "asc") {
      newSortOrder = "desc";
    } else {
      newSortOrder = null;
    }
    
    setSortOrder(newSortOrder);
    
    if (newSortOrder === null) {
      // Reset to original order by refetching
      fetchProjects();
    } else {
      setProjects((prevProjects) =>
        [...prevProjects].sort((a, b) => {
          if (newSortOrder === "asc") {
            return a.status.localeCompare(b.status);
          } else {
            return b.status.localeCompare(a.status);
          }
        })
      );
    }
  };

  const handlePrioritySort = () => {
    // Cycle through: null -> asc -> desc -> null
    let newSortOrder: "asc" | "desc" | null;
    if (prioritySortOrder === null) {
      newSortOrder = "asc";
    } else if (prioritySortOrder === "asc") {
      newSortOrder = "desc";
    } else {
      newSortOrder = null;
    }
    
    setPrioritySortOrder(newSortOrder);
    
    if (newSortOrder === null) {
      // Reset to original order by refetching
      fetchProjects();
    } else {
      setProjects((prevProjects) =>
        [...prevProjects].sort((a, b) => {
          if (newSortOrder === "asc") {
            return a.priority.localeCompare(b.priority);
          } else {
            return b.priority.localeCompare(a.priority);
          }
        })
      );
    }
  };

  const handleModifiedSort = () => {
    // Cycle through: null -> asc -> desc -> null
    let newSortOrder: "asc" | "desc" | null;
    if (modifiedSortOrder === null) {
      newSortOrder = "asc";
    } else if (modifiedSortOrder === "asc") {
      newSortOrder = "desc";
    } else {
      newSortOrder = null;
    }
    
    setModifiedSortOrder(newSortOrder);
    
    if (newSortOrder === null) {
      // Reset to original order by refetching
      fetchProjects();
    } else {
      setProjects((prevProjects) =>
        [...prevProjects].sort((a, b) => {
          if (newSortOrder === "asc") {
            return new Date(a.modified).getTime() - new Date(b.modified).getTime();
          } else {
            return new Date(b.modified).getTime() - new Date(a.modified).getTime();
          }
        })
      );
    }
  };

  const handleCreatedSort = () => {
    // Cycle through: null -> asc -> desc -> null
    let newSortOrder: "asc" | "desc" | null;
    if (createdSortOrder === null) {
      newSortOrder = "asc";
    } else if (createdSortOrder === "asc") {
      newSortOrder = "desc";
    } else {
      newSortOrder = null;
    }
    
    setCreatedSortOrder(newSortOrder);
    
    if (newSortOrder === null) {
      // Reset to original order by refetching
      fetchProjects();
    } else {
      setProjects((prevProjects) =>
        [...prevProjects].sort((a, b) => {
          if (newSortOrder === "asc") {
            return new Date(a.created).getTime() - new Date(b.created).getTime();
          } else {
            return new Date(b.created).getTime() - new Date(a.created).getTime();
          }
        })
      );
    }
  };

  const handleProjectNameClick = (projectName: string) => {
    // Navigate to model_with_ai page with the project name
    navigate("/model-with-ai", { state: { projectName } });
  };

  // Render the appropriate sort icons based on the sort state
  const renderSortIcons = (sortState: "asc" | "desc" | null) => {
    if (sortState === "asc") {
      return <ArrowUp className="inline w-3 h-3 text-gray-400" />;
    } else if (sortState === "desc") {
      return <ArrowDown className="inline w-3 h-3 text-gray-400" />;
    } else {
      return (
        <span className="inline-flex">
          <ArrowUp className="w-3 h-3 text-gray-400 mr-0.5" />
          <ArrowDown className="w-3 h-3 text-gray-400" />
        </span>
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <div className="flex flex-1 mt-16">
        <Sidebar className="w-16" />
        <main className="flex-1 bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold mb-8">Project Lists</h1>
            {/* Error message display */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                {/* Create Project Button */}
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                  Create Project
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                      disabled={selectedItems.length !== 1}
                    >
                      <MoreVertical className="w-4 h-4" />
                      <span>Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => handleEdit(selectedItems[0])}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(selectedItems[0])}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="relative w-96">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, version, tags or user"
                  className="search-input w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-max table-auto border-collapse border border-gray-200 shadow-sm">
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead className="w-12 border border-gray-200 font-bold text-gray-700">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          onChange={() =>
                            setSelectedItems((prev) =>
                              prev.length === mockData.length
                                ? []
                                : mockData.map((item) => item.id)
                            )
                          }
                        />
                      </TableHead>
                      <TableHead className="border border-gray-200 font-bold text-gray-700 sticky left-0 bg-gray-100 z-20">
                        Description
                      </TableHead>
                      <TableHead className="border border-gray-200 font-bold text-gray-700 sticky left-32 bg-gray-100 z-20">
                        Project Number
                      </TableHead>
                      <TableHead className="border border-gray-200 font-bold text-gray-700 sticky left-64 bg-gray-100 z-20">
                        Project Name
                      </TableHead>
                      <TableHead
                        className="border border-gray-200 font-bold text-gray-700 min-w-[120px] w-auto whitespace-nowrap text-center cursor-pointer"
                        onClick={handleSort}
                      >
                        Status
                        <span className="ml-2">
                        {renderSortIcons(sortOrder)}
                        </span>
                      </TableHead>
                      <TableHead
                        className="border border-gray-200 font-bold text-gray-700 min-w-[120px] w-auto whitespace-nowrap text-center cursor-pointer"
                        onClick={handlePrioritySort}
                      >
                        Priority
                        <span className="ml-2">
                          {renderSortIcons(prioritySortOrder)}
                        </span>
                      </TableHead>

                      <TableHead className="border border-gray-200 font-bold text-gray-700">
                        Creator
                      </TableHead>
                      <TableHead
                        className="border border-gray-200 font-bold text-gray-700 cursor-pointer"
                        onClick={handleModifiedSort}
                      >
                        Modified
                        <span className="ml-2">
                        {renderSortIcons(modifiedSortOrder)}
                        </span>
                      </TableHead>
                      <TableHead
                        className="border border-gray-200 font-bold text-gray-700 cursor-pointer"
                        onClick={handleCreatedSort}
                      >
                        Created
                        <span className="ml-2">
                        {renderSortIcons(createdSortOrder)}
                        </span>
                      </TableHead>
                      <TableHead className="border border-gray-200 font-bold text-gray-700">
                        Model Type
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell className="border border-gray-200 p-2">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => toggleItem(item.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-200 p-2 sticky left-0 bg-gray-50 z-20">
                          {item.description}
                        </TableCell>
                        <TableCell className="border border-gray-200 p-2 sticky left-32 bg-gray-50 z-20">
                          {item.projectNumber}
                        </TableCell>
                        <TableCell className="border border-gray-200 p-2 sticky left-64 bg-gray-50 z-20">
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <button 
                              onClick={() => handleProjectNameClick(item.name)}
                              className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none transition-colors"
                            >
                              {item.name}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="border border-gray-200 p-2 min-w-[120px] w-auto whitespace-nowrap text-center">
                          <StatusDropdown
                            value={item.status}
                            onValueChange={(value) =>
                              handleStatusChange(item.id, value)
                            }
                          />
                        </TableCell>
                        <TableCell className="border border-gray-200 p-2 min-w-[120px] w-auto whitespace-nowrap text-center">
                          <PriorityDropdown
                            value={item.priority}
                            onValueChange={(value) =>
                              handlePriorityChange(item.id, value)
                            }
                          />
                        </TableCell>

                        <TableCell className="border border-gray-200 p-2">
                          {item.user}
                        </TableCell>
                        <TableCell className="border border-gray-200 p-2">
                          <div className="flex items-center space-x-1">
                            <span>{formatDate(item.modified)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="border border-gray-200 p-2">
                          <div className="flex items-center space-x-1">
                            <span>{formatDate(item.created)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="border border-gray-200 p-2">
                          <ModelTypeDropdown />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <span className="px-3 py-1 rounded-md bg-primary text-primary-foreground">
                      1
                    </span>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Items per page</span>
                    <select className="border rounded px-2 py-1 text-sm">
                      <option>50</option>
                      <option>100</option>
                      <option>250</option>
                    </select>
                    <span className="text-sm text-gray-500">
                      1 - {mockData.length} of {mockData.length} items
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <CreateProjectModal
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingProject(null); // Reset editing project when modal closes
        }}
        addProject={addProject} // Pass the addProject function as a prop
        project={editingProject} // Pass the project being edited
        onSave={handleSaveProject} // Pass the save function
      />
    </div>
  );
}
