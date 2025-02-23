import { useState } from "react";
import { Globe, RefreshCcw, MoreVertical, Clock } from "lucide-react";
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

interface ProjectModel {
  id: string;
  name: string;
  version: string;
  status: string;
  user: string;
  modified: string;
  created: string;
}

const mockData: ProjectModel[] = [
  {
    id: "1",
    name: "Uber.com",
    version: "1.0",
    status: "Started",
    user: "Joe",
    modified: "Feb 22, 2025",
    created: "Feb 12, 2025",
  },
  {
    id: "2",
    name: "lyft.com",
    version: "1",
    status: "In Progress",
    user: "Joe",
    modified: "Feb 17, 2025",
    created: "Feb 10, 2025",
  },
  {
    id: "3",
    name: "amazon.com",
    version: "1",
    status: "Completed",
    user: "david",
    modified: "Feb 17, 2025",
    created: "Feb 10, 2025",
  },
];

export default function ProjectList() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <div className="flex flex-1 mt-16"> {/* Adjusted margin-top to ensure it starts after AppHeader */}
        <Sidebar className="w-16" /> {/* Reduced width of Sidebar */}
        <main className="flex-1 bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold mb-8">Project Lists</h1>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <MoreVertical className="w-4 h-4" />
                  <span>Actions</span>
                </Button>
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
                    <TableHead className="border border-gray-200 font-bold text-gray-700">Name</TableHead>
                    <TableHead className="border border-gray-200 font-bold text-gray-700">Version</TableHead>
                    <TableHead className="border border-gray-200 font-bold text-gray-700">Status</TableHead>
                    <TableHead className="border border-gray-200 font-bold text-gray-700">User</TableHead>
                    <TableHead className="border border-gray-200 font-bold text-gray-700">Modified</TableHead>
                    <TableHead className="border border-gray-200 font-bold text-gray-700">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="border border-gray-200 p-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleItem(item.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2">
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span>{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2">
                        {item.version}
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2">
                        <span className="status-badge">{item.status}</span>
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2">
                        {item.user}
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2">
                        <div className="flex items-center space-x-1">
                          <span>{item.modified}</span>
                          <Clock className="w-4 h-4 text-gray-400" />
                        </div>
                      </TableCell>
                      <TableCell className="border border-gray-200 p-2">
                        <div className="flex items-center space-x-1">
                          <span>{item.created}</span>
                          <Clock className="w-4 h-4 text-gray-400" />
                        </div>
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
    </div>
  );
}
