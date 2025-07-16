import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, TrendingUp, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeneratedReportsCardProps {
  reportsCount?: number;
  isLoading?: boolean;
}

const GeneratedReportsCard = ({
  reportsCount,
  isLoading = false
}: GeneratedReportsCardProps) => {
  // Use provided reportsCount or fallback
  const totalReports = reportsCount ?? 126;
  const previousMonthReports = Math.round(totalReports * 0.75); // Assume 75% of current for previous month
  const change = previousMonthReports > 0 ? 
    Math.round(((totalReports - previousMonthReports) / previousMonthReports) * 100) : 0;
  const isPositive = change > 0;

  // Threat severity categories
  const reportCategories = [
    { 
      name: "High Severity", 
      count: Math.round(totalReports * 0.2), // 20%
      percentage: 20, 
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      color: "text-red-600",
      bgColor: "bg-red-100" 
    },
    { 
      name: "Medium Severity", 
      count: Math.round(totalReports * 0.4), // 40%
      percentage: 40, 
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100" 
    },
    { 
      name: "Low Severity", 
      count: Math.round(totalReports * 0.4), // 40%
      percentage: 40, 
      icon: <Info className="h-5 w-5 text-blue-500" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100" 
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
        borderTopColor: '#3B82F6'
      }}
    >
      <CardHeader className="pb-2 bg-white bg-opacity-80 backdrop-blur-sm shadow-sm">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-gradient-to-br from-blue-500 to-teal-500 p-1.5 shadow-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span>Generated Reports</span>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && (
              <>
                <div className={`flex items-center gap-1 ${isPositive ? 'text-teal-500' : 'text-red-500'} bg-white px-2 py-1 rounded-full shadow-sm`}>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingUp className="h-4 w-4 transform rotate-180" />
                  )}
                  <span className="text-sm font-medium">{isPositive ? '+' : ''}{change}%</span>
                </div>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between mt-2">
            <div className="space-y-1">
              {isLoading ? (
                <div className="flex items-center h-14">
                  <Loader2 className="h-7 w-7 text-blue-500 animate-spin mr-3" />
                  <span className="text-lg text-gray-500">Loading reports data...</span>
                </div>
              ) : (
                <>
                  <h3 className="text-5xl font-bold text-blue-600">
                    {totalReports}
                  </h3>
                  <p className="text-sm text-gray-600">Total reports generated</p>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-600">
                      {Math.round(totalReports / 3)} this month
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <div className="bg-gradient-to-tr from-blue-500 to-teal-500 p-6 rounded-full shadow-md">
                <FileText className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
          
          {!isLoading && (
            <>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Threat Severity</h4>
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
                          <span className="text-xs text-gray-600">{category.percentage}% of total</span>
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
                  <span className="text-xs text-blue-600 hover:underline cursor-pointer">View All Reports</span>
                </div>
                <div className="mt-2 space-y-2">
                  {recentReports.map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <div>
                          <span className="text-sm font-medium">{report.title}</span>
                          <p className="text-xs text-gray-600">{new Date(report.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        report.status === "Completed" 
                          ? "bg-teal-100 text-teal-700" 
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
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneratedReportsCard;