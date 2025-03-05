
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, XCircle, Archive } from "lucide-react";

const closedProjects = [
  {
    id: 1,
    name: "Web App Security Review",
    status: "Completed",
    date: "May 15, 2023",
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
  },
  {
    id: 2,
    name: "API Gateway Assessment",
    status: "Archived",
    date: "Apr 28, 2023",
    icon: <Archive className="h-4 w-4 text-securetrack-purple" />,
  },
  {
    id: 3,
    name: "Mobile App Vulnerability Scan",
    status: "Cancelled",
    date: "Apr 12, 2023",
    icon: <XCircle className="h-4 w-4 text-red-500" />,
  },
  {
    id: 4,
    name: "Cloud Security Review",
    status: "Pending",
    date: "Mar 30, 2023",
    icon: <Clock className="h-4 w-4 text-orange-500" />,
  },
];

const ClosedProjectsCard = () => {
  return (
    <Card className="animate-fade-up hover:shadow-md transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: "0.3s" }}>
      <CardHeader>
        <CardTitle>Recent Project Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {closedProjects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0 hover:bg-gray-50 p-2 rounded-md transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center">
                  {project.icon}
                </div>
                <div>
                  <h4 className="text-sm font-medium">{project.name}</h4>
                  <p className="text-xs text-muted-foreground">{project.date}</p>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  project.status === "Completed"
                    ? "bg-green-50 text-green-600"
                    : project.status === "Archived"
                    ? "bg-purple-50 text-securetrack-purple"
                    : project.status === "Cancelled"
                    ? "bg-red-50 text-red-600"
                    : "bg-orange-50 text-orange-600"
                }`}
              >
                {project.status}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClosedProjectsCard;