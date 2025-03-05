
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flag, AlertCircle, ThumbsUp, ChevronRight } from "lucide-react";

const priorityProjects = [
  {
    id: 1,
    priority: "High",
    count: 5,
    color: "text-red-500",
    bgColor: "bg-red-500",
    icon: <Flag className="h-4 w-4 text-red-500" />,
    percentage: 20,
  },
  {
    id: 2,
    priority: "Medium",
    count: 12,
    color: "text-orange-500",
    bgColor: "bg-orange-500",
    icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
    percentage: 48,
  },
  {
    id: 3,
    priority: "Low",
    count: 8,
    color: "text-green-500",
    bgColor: "bg-green-500",
    icon: <ThumbsUp className="h-4 w-4 text-green-500" />,
    percentage: 32,
  },
];

const PriorityProjectsCard = () => {
  return (
    <Card className="animate-fade-up hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 rounded-t-none" 
      style={{ 
        animationDelay: "0.25s",
        borderTopColor: '#7C65F6'
      }}
    >
      <CardHeader className="pb-2 bg-white bg-opacity-80 backdrop-blur-sm shadow-sm">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-gradient-to-br from-securetrack-purple to-securetrack-lightpurple p-1.5 shadow-sm">
              <Flag className="h-5 w-5 text-white" />
            </div>
            <span>Projects by Priority</span>
          </div>
          <span className="text-xs text-securetrack-purple hover:underline cursor-pointer flex items-center">
            View All <ChevronRight className="h-3 w-3 ml-1" />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {priorityProjects.map((project) => (
            <div key={project.id} className="space-y-2 hover:shadow-sm hover:bg-gray-50 p-2 rounded-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded-full ${project.priority === "High" ? "bg-red-100" : 
                    project.priority === "Medium" ? "bg-orange-100" : "bg-green-100"}`}>
                    {project.icon}
                  </div>
                  <span className={`font-medium ${project.color}`}>
                    {project.priority}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {project.count} projects ({project.percentage}%)
                </span>
              </div>
              <Progress
                value={project.percentage}
                className="h-2"
                style={{ backgroundColor: '#f0f0f0' }}
                indicatorClassName={project.bgColor}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriorityProjectsCard;