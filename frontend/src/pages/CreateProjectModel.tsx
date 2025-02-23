import { X, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateProjectModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectModel({
  open,
  onOpenChange,
}: CreateProjectModelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-lg shadow-lg">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-7 w-7"
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Create Project</h1>
              <p className="text-sm text-gray-500 mt-0.5">Create New Project Model</p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-3">
          <div className="grid gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name *</label>
              <Input placeholder="Project Name.." className="h-9 border-gray-300 rounded-md" />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1.5 block">Model Type *</label>
              <Select>
                <SelectTrigger className="h-9 border-gray-300 rounded-md">
                  <SelectValue placeholder="Model With AI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aws">Model With AI</SelectItem>
                  <SelectItem value="azure">Existing Project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Version *</label>
              <Input placeholder="Enter Version" className="h-9 border-gray-300 rounded-md" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Project Status *</label>
              <Select>
                <SelectTrigger className="h-9 border-gray-300 rounded-md">
                  <SelectValue placeholder="Started" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="started">Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Tags</label>
              <Input placeholder="Search tags" className="h-9 border-gray-300 rounded-md" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <textarea
                className="w-full h-[80px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add Description"
              />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 mt-2">
            {[
              { name: "Blank", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6", active: true },
              { name: "Template", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
              { name: "Import File", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
              { name: "CloudModeler", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
              { name: "Solutions Hub", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" }
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center gap-1.5 p-2 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className={`w-10 h-10 ${item.active ? 'bg-primary' : 'border'} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-5 h-5 ${item.active ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <span className="text-xs text-center">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm">Create Project</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateProjectModel;