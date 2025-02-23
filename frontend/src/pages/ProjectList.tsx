import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, MoreVertical, Clock } from "lucide-react";
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
import CreateProjectModel from "./CreateProjectModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProjectDropdown from "@/components/ui/ProjectDropdown";
import PriorityDropdown from "@/components/ui/PriorityDropdown";
import StatusDropdown from "@/components/ui/StatusDropdown";
import { formatDistanceToNow, parseISO } from 'date-fns';

interface ProjectModel {
  id: string;
  name: string;
  version: string;
  status: "Started" | "In Progress" | "Completed";
  user: string;
  role: string;
  modified: string;
  created: string;
  priority: "1-High" | "2-Medium" | "3-Low";
  modelType: string;
  description: string;
  projectNumber: string;
}

const mockData: ProjectModel[] = [
  {
    id: "1",
    name: "Uber.com",
    version: "1.0",
    status: "Started",
    user: "Joe",
    role: "Developer",
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
    role: "Manager",
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
    role: "Tester",
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
  const [projects, setProjects] = useState<ProjectModel[]>(mockData);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State to control dialog visibility
  const navigate = useNavigate(); // Initialize useNavigate

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePriorityChange = (id: string, newPriority: "1-High" | "2-Medium" | "3-Low") => {
    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === id ? { ...project, priority: newPriority } : project
      )
    );
  };

  const handleStatusChange = (id: string, newStatus: "Started" | "In Progress" | "Completed") => {
    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === id ? { ...project, status: newStatus } : project
      )
    );
  };

  const addProject = (project: ProjectModel) => {
    setProjects((prevProjects) => [...prevProjects, project]);
  };

  const handleEdit = (id: string) => {
    // Handle edit functionality here
    console.log(`Edit project with id: ${id}`);
  };

  const handleDelete = (id: string) => {
    // Handle delete functionality here
    setProjects((prevProjects) =>
      prevProjects.filter((project) => project.id !== id)
    );
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <div className="flex flex-1 mt-16">
        <Sidebar className="w-16" />
        <main className="flex-1 bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold mb-8">Project Lists</h1>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
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
            <div className="overflow-x-auto">
              <Table className="min-w-full table-auto border-collapse border border-gray-200 shadow-sm">
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
                    <TableHead className="border border-gray-200 font-bold text-gray-700 sticky left-0 bg-gray-100 z-10">
                      Description
                    </TableHead>
                    <TableHead className="border border-gray-200 font-bold text-gray-700 sticky left-32 bg-gray-100 z-10">
                      Project Number
                    </TableHead>
                    <TableHead className="border border-gray-200 font-bold text-gray-700">
                      Name
                    </TableHead>
                    <TableHead className="border border-gray-200 font-bold text-gray-700 w-20">
                      Status
                    </TableHead>
                    <TableHead className="border border-gray-200 font-bold text-gray-700 w-24">
                      Priority
                    </TableHead>
                    <TableHead className="border border-gray-200 font-bold text-gray-700">
                      User
                    </TableHead>
                    <TableHead className="border border-gray-200 font-bold text-gray-700">
                      Role
                    </TableHead>
                    <TableHead className="border border-gray-200 font-bold text-gray-700">
                      Modified
                    </TableHead>
                    <TableHead className="border border-gray-200 font-bold text-gray-700">
                      Created
                    </TableHead>
                    <TableHead className="border border-gray-200 font-bold text-gray-700">
                      Model Type
                    </TableHead>
                    <TableHead className="border border-gray-200 font-bold text-gray-700">
                      Version
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
                      <TableCell className="border border-gray-200 p-2 sticky left-0 bg-white z-10">
                        {item.description}
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2 sticky left-32 bg-white z-10">
                        {item.projectNumber}
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2">
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span>{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2 w-24">
                        <StatusDropdown
                          value={item.status}
                          onValueChange={(value) => handleStatusChange(item.id, value)}
                        />
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2 w-24">
                        <PriorityDropdown
                          value={item.priority}
                          onValueChange={(value) => handlePriorityChange(item.id, value)}
                        />
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2">
                        {item.user}
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2">
                        {item.role}
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2">
                        <div className="flex items-center space-x-1">
                          <span>{formatDate(item.modified)}</span>
                          <Clock className="w-4 h-4 text-gray-400" />
                        </div>
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2">
                        <div className="flex items-center space-x-1">
                          <span>{formatDate(item.created)}</span>
                          <Clock className="w-4 h-4 text-gray-400" />
                        </div>
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2">
                        {" "}
                        {/* Added Model Type dropdown */}
                        <ProjectDropdown />
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2">
                        {item.version}
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
          </div>
        </main>
      </div>
      <CreateProjectModel
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        addProject={addProject} // Pass the addProject function as a prop
      />
    </div>
  );
}
