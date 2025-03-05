
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertCircle, Check, Shield } from "lucide-react";

const activities = [
  {
    id: 1,
    action: "Completed security assessment",
    project: "Cloud Migration",
    timestamp: "Today, 10:30 AM",
    icon: <Check className="h-4 w-4 text-green-500" />,
  },
  {
    id: 2,
    action: "Generated vulnerability report",
    project: "Payment Gateway",
    timestamp: "Yesterday, 2:15 PM",
    icon: <FileText className="h-4 w-4 text-blue-500" />,
  },
  {
    id: 3,
    action: "Detected critical issue",
    project: "User Authentication",
    timestamp: "May 10, 9:45 AM",
    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
  },
  {
    id: 4,
    action: "Started new security review",
    project: "API Gateway",
    timestamp: "May 8, 11:20 AM",
    icon: <Shield className="h-4 w-4 text-securetrack-purple" />,
  },
];

const ActivityTimeline = () => {
  return (
    <Card className="col-span-1 animate-fade-up" style={{ animationDelay: "0.3s" }}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <div className="mt-1 h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center bg-white">
                {activity.icon}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{activity.action}</p>
                <p className="text-sm text-muted-foreground">{activity.project}</p>
                <p className="text-xs text-gray-500">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;