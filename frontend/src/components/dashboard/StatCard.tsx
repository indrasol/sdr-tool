
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

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
          borderTopColor: '#7C65F6'
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white bg-opacity-80 backdrop-blur-sm shadow-sm">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="h-8 w-8 bg-gradient-to-br from-securetrack-purple to-securetrack-lightpurple rounded-full flex items-center justify-center shadow-sm">
            <div className="text-white">{icon}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <div className="mt-2">
              <span 
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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