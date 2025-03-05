
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

const TeamMembersCard = () => {
  // Mock team members data
  const teamMembers = [
    {
      id: 1,
      name: "Emma Wilson",
      role: "Security Lead",
      avatar: "EW",
      color: "bg-securetrack-purple text-white",
      status: "online",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Compliance Analyst",
      avatar: "MC",
      color: "bg-securetrack-green text-white",
      status: "online",
    },
    {
      id: 3,
      name: "Sarah Rodriguez",
      role: "Security Engineer",
      avatar: "SR",
      color: "bg-amber-500 text-white",
      status: "offline",
    },
    {
      id: 4,
      name: "James Taylor",
      role: "Vulnerability Analyst",
      avatar: "JT",
      color: "bg-blue-500 text-white",
      status: "away",
    },
  ];

  return (
    <Card className="animate-fade-up hover:shadow-md transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: "0.35s" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-securetrack-purple" />
          <span>Security Team</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full ${member.color} flex items-center justify-center font-semibold`}>
                  {member.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-medium">{member.name}</h4>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    member.status === "online"
                      ? "bg-green-500"
                      : member.status === "offline"
                      ? "bg-gray-300" 
                      : "bg-amber-500"
                  }`}
                ></span>
                <span className="text-xs capitalize text-muted-foreground">
                  {member.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamMembersCard;