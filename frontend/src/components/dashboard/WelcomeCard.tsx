
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Bell, Calendar } from "lucide-react";
import { useEffect, useState } from "react";

interface WelcomeCardProps {
  username: string;
}

const WelcomeCard = ({ username }: WelcomeCardProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  // Get the time of day greeting
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  
  // Format date as "Wednesday, May 15"
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Card className="col-span-full bg-gradient-to-r from-securetrack-purple/10 via-securetrack-green/10 to-securetrack-purple/5 border-none overflow-hidden animate-fade-in shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
          {getGreeting()}, {username}
          <div className="inline-block animate-pulse">
            <Sparkles className="h-6 w-6 text-securetrack-purple" />
          </div>
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            {formattedDate}
          </div>
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-600 hover:text-securetrack-purple cursor-pointer transition-colors" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <p className="text-muted-foreground mb-3 md:mb-0 md:mr-4">
            Welcome to your security dashboard. Your analytics show steady progress in strengthening your security posture.
            Review your high-priority projects to maintain compliance standards.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              5 tasks completed
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              3 pending reviews
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;