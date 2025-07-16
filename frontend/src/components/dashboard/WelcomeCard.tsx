import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Calendar, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WelcomeCardProps {
  username: string;
  refreshMetrics?: () => Promise<void>;
  isLoading?: boolean;
}

const WelcomeCard = ({ username, refreshMetrics, isLoading = false }: WelcomeCardProps) => {
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
    <Card className="col-span-full bg-gradient-to-r from-blue-500/15 via-teal-500/15 to-emerald-500/15 border-none overflow-hidden animate-fade-in shadow-sm hover:shadow-md transition-all duration-300 relative">
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
        <CardTitle className="text-3xl font-semibold font-['Geneva','Segoe UI',sans-serif] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-600 flex items-center gap-2">
          {getGreeting()}, {username}
          <div className="inline-block animate-pulse">
            <Sparkles className="h-6 w-6 text-blue-500" />
          </div>
          <div className="h-10 flex items-center">
            <img 
              src="/indrabot-mascot.png" 
              alt="Indrasol Mascot" 
              className="h-20 w-auto object-contain opacity-40 -ml-2 -my-10"
            />
          </div>
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-gradient-to-r from-blue-500/20 to-teal-500/20 hover:from-blue-500/30 hover:to-teal-500/30 text-blue-600 border-none px-3 py-1 flex items-center gap-2 shadow-sm">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </Badge>
            {refreshMetrics && (
              <Badge
                onClick={refreshMetrics}
                className={`bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-none px-3 py-1 flex items-center gap-2 shadow-sm cursor-pointer ${isLoading ? 'opacity-70' : ''}`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="text-sm text-gray-600 font-medium mb-3 md:mb-0 md:mr-4 max-w-3xl">
            <p className="mb-1">Welcome to your command center — a bird's eye view of your overall landscape.</p>
            <p>Your dashboard auto-refreshes every minute, ensuring you always have the latest intelligence at your fingertips.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;