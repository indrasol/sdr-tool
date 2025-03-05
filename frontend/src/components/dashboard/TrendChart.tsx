
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Button } from "@/components/ui/button";

// Mock data for trends
const trendData = [
  { name: 'Week 1', analyses: 4, reports: 2, vulnerabilities: 6 },
  { name: 'Week 2', analyses: 7, reports: 4, vulnerabilities: 9 },
  { name: 'Week 3', analyses: 5, reports: 3, vulnerabilities: 7 },
  { name: 'Week 4', analyses: 9, reports: 7, vulnerabilities: 12 },
  { name: 'Week 5', analyses: 12, reports: 8, vulnerabilities: 15 },
  { name: 'Week 6', analyses: 10, reports: 9, vulnerabilities: 14 },
  { name: 'Week 7', analyses: 15, reports: 11, vulnerabilities: 18 },
  { name: 'Week 8', analyses: 13, reports: 10, vulnerabilities: 16 },
];

type ChartType = 'line' | 'area';

const TrendChart = () => {
  const [chartType, setChartType] = useState<ChartType>('area');

  return (
    <Card className="animate-fade-up" style={{ animationDelay: "0.4s" }}>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <CardTitle>Security Analysis Trends</CardTitle>
        <div className="flex space-x-2">
          <Button 
            size="sm"
            variant={chartType === 'line' ? 'default' : 'outline'}
            onClick={() => setChartType('line')}
            className="h-8"
          >
            Line
          </Button>
          <Button 
            size="sm"
            variant={chartType === 'area' ? 'default' : 'outline'}
            onClick={() => setChartType('area')}
            className="h-8"
          >
            Area
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart
                data={trendData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: 'none'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="analyses" 
                  name="Security Analyses"
                  stroke="#7C65F6" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="reports" 
                  name="Generated Reports"
                  stroke="#4CD3A5" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="vulnerabilities" 
                  name="Vulnerabilities"
                  stroke="#FF6B6B" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            ) : (
              <AreaChart
                data={trendData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: 'none'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="analyses" 
                  name="Security Analyses"
                  stroke="#7C65F6" 
                  fill="#7C65F6" 
                  fillOpacity={0.2}
                />
                <Area 
                  type="monotone" 
                  dataKey="reports" 
                  name="Generated Reports"
                  stroke="#4CD3A5" 
                  fill="#4CD3A5" 
                  fillOpacity={0.2}
                />
                <Area 
                  type="monotone" 
                  dataKey="vulnerabilities" 
                  name="Vulnerabilities"
                  stroke="#FF6B6B" 
                  fill="#FF6B6B" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendChart;