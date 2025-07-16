import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  className?: string;
  style?: React.CSSProperties;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  linkTo?: string;
  isLoading?: boolean;
}

const StatCard = ({
  title,
  value,
  icon,
  description,
  className,
  style,
  trend,
  linkTo,
  isLoading = false,
}: StatCardProps) => {
  const CardWrapper = linkTo ? Link : 'div';
  
  return (
    <CardWrapper 
      to={linkTo || ''}
      className={cn(linkTo && "cursor-pointer")}
    >
      <Card 
        className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 border-t-4 rounded-t-none", 
          className
        )} 
        style={{
          ...style,
          borderTopColor: '#3B82F6'
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white bg-opacity-80 backdrop-blur-sm shadow-sm">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center shadow-sm">
            <div className="text-white">{icon}</div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center h-9 mb-1">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          ) : (
            <div className="text-2xl font-bold text-gray-800">{value}</div>
          )}
          {description && (
            <p className="text-xs text-gray-600 mt-1">{description}</p>
          )}
          {trend && !isLoading && (
            <div className="mt-2">
              <span 
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  trend.isPositive ? "bg-teal-100 text-teal-700" : "bg-red-100 text-red-700"
                )}
              >
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </CardWrapper>
  );
};

export default StatCard;