
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PanelLeft, Sliders, BellPlus, GanttChart } from "lucide-react";

const customizeOptions = [
  {
    id: 1,
    name: "Layout Options",
    description: "Change dashboard layout",
    icon: <PanelLeft className="h-4 w-4" />,
    action: "Customize",
  },
  {
    id: 2,
    name: "Dashboard Settings",
    description: "Configure dashboard views",
    icon: <Sliders className="h-4 w-4" />,
    action: "Settings",
  },
  {
    id: 3,
    name: "Notifications",
    description: "Set alert preferences",
    icon: <BellPlus className="h-4 w-4" />,
    action: "Configure",
  },
  {
    id: 4,
    name: "Project Views",
    description: "Customize project display",
    icon: <GanttChart className="h-4 w-4" />,
    action: "Edit",
  },
];

const CustomizeCard = () => {
  return (
    <Card className="animate-fade-up hover:shadow-md transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: "0.35s" }}>
      <CardHeader>
        <CardTitle>Customize Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customizeOptions.map((option) => (
            <div
              key={option.id}
              className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-securetrack-lightgray flex items-center justify-center text-securetrack-purple">
                  {option.icon}
                </div>
                <div>
                  <h4 className="text-sm font-medium">{option.name}</h4>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 hover:bg-securetrack-purple hover:text-white transition-colors duration-300"
              >
                {option.action}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomizeCard;