
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, TrendingUp, FileCheck, FileCog, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const GeneratedReportsCard = () => {
  // Mock data for generated reports
  const totalReports = 126;
  const previousMonthReports = 93;
  const change = Math.round(((totalReports - previousMonthReports) / previousMonthReports) * 100);
  const isPositive = change > 0;

  // Report categories
  const reportCategories = [
    { 
      name: "Compliance Reports", 
      count: 42, 
      percentage: 33, 
      icon: <FileCheck className="h-5 w-5 text-securetrack-purple" />,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    { 
      name: "Security Assessments", 
      count: 31, 
      percentage: 25, 
      icon: <FileCog className="h-5 w-5 text-securetrack-purple" />,
      color: "text-amber-600",
      bgColor: "bg-amber-100" 
    },
    { 
      name: "Audit Reports", 
      count: 28, 
      percentage: 22, 
      icon: <FileSearch className="h-5 w-5 text-securetrack-purple" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    { 
      name: "Other Documents", 
      count: 25, 
      percentage: 20, 
      icon: <FileText className="h-5 w-5 text-securetrack-purple" />,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    }
  ];

  // Recent reports
  const recentReports = [
    { title: "SOC 2 Type II Assessment", date: "2023-06-15", status: "Completed" },
    { title: "GDPR Compliance Report", date: "2023-06-10", status: "In Review" },
    { title: "Quarterly Security Report", date: "2023-06-05", status: "Draft" }
  ];

  return (
    <Card className="overflow-hidden animate-fade-up hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 rounded-t-none" 
      style={{ 
        animationDelay: "0.15s",
        borderTopColor: '#7C65F6'
      }}
    >
      <CardHeader className="pb-2 bg-white bg-opacity-80 backdrop-blur-sm shadow-sm">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-gradient-to-br from-securetrack-purple to-securetrack-lightpurple p-1.5 shadow-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span>Generated Reports</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'} bg-white px-2 py-1 rounded-full shadow-sm`}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingUp className="h-4 w-4 transform rotate-180" />
              )}
              <span className="text-sm font-medium">{isPositive ? '+' : ''}{change}%</span>
            </div>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between mt-2">
            <div className="space-y-1">
              <h3 className="text-5xl font-bold text-securetrack-purple">
                {totalReports}
              </h3>
              <p className="text-sm text-muted-foreground">Total reports generated</p>
              <div className="flex items-center gap-1 text-xs">
                <span className="px-2 py-0.5 rounded-full font-medium bg-securetrack-purple/10 text-securetrack-purple">
                  {Math.round(totalReports / 3)} this month
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-tr from-securetrack-purple to-securetrack-lightpurple p-6 rounded-full shadow-md">
                <FileText className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Report Categories</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reportCategories.map((category, index) => (
                <div 
                  key={index} 
                  className={`rounded-lg p-3 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 border border-gray-100`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`${category.bgColor} p-1.5 rounded-full`}>
                        {category.icon}
                      </div>
                      <h4 className="text-sm font-medium">{category.name}</h4>
                    </div>
                    <span className={`text-lg font-bold ${category.color}`}>
                      {category.count}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{category.percentage}% of total</span>
                    </div>
                    <Progress 
                      value={category.percentage} 
                      className="h-1.5 bg-gray-100"
                      indicatorClassName={category.bgColor}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Recent Reports</span>
              <span className="text-xs text-securetrack-purple hover:underline cursor-pointer">View All Reports</span>
            </div>
            <div className="mt-2 space-y-2">
              {recentReports.map((report, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-securetrack-purple" />
                    <div>
                      <span className="text-sm font-medium">{report.title}</span>
                      <p className="text-xs text-muted-foreground">{new Date(report.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    report.status === "Completed" 
                      ? "bg-green-100 text-green-700" 
                      : report.status === "In Review" 
                      ? "bg-amber-100 text-amber-700" 
                      : "bg-blue-100 text-blue-700"
                  )}>
                    {report.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneratedReportsCard;