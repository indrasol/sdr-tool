import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Button } from "@/components/ui/button";

// Mock data for project timeline
const yearlyData = [
  { month: 'Jan', projects: 3, completed: 2 },
  { month: 'Feb', projects: 5, completed: 3 },
  { month: 'Mar', projects: 2, completed: 2 },
  { month: 'Apr', projects: 7, completed: 5 },
  { month: 'May', projects: 4, completed: 2 },
  { month: 'Jun', projects: 6, completed: 4 },
  { month: 'Jul', projects: 5, completed: 3 },
  { month: 'Aug', projects: 8, completed: 6 },
  { month: 'Sep', projects: 6, completed: 4 },
  { month: 'Oct', projects: 7, completed: 5 },
  { month: 'Nov', projects: 4, completed: 3 },
  { month: 'Dec', projects: 3, completed: 2 },
];

const quarterlyData = [
  { month: 'Week 1', projects: 2, completed: 1 },
  { month: 'Week 2', projects: 3, completed: 2 },
  { month: 'Week 3', projects: 1, completed: 1 },
  { month: 'Week 4', projects: 4, completed: 3 },
  { month: 'Week 5', projects: 2, completed: 1 },
  { month: 'Week 6', projects: 3, completed: 2 },
  { month: 'Week 7', projects: 5, completed: 3 },
  { month: 'Week 8', projects: 2, completed: 1 },
  { month: 'Week 9', projects: 4, completed: 3 },
  { month: 'Week 10', projects: 3, completed: 2 },
  { month: 'Week 11', projects: 1, completed: 1 },
  { month: 'Week 12', projects: 4, completed: 3 },
];

type TimeRange = 'quarterly' | 'yearly';

const ProjectsChart = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('yearly');
  
  const data = timeRange === 'yearly' ? yearlyData : quarterlyData;

  return (
    <Card className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <CardTitle>Projects Timeline</CardTitle>
        <div className="flex space-x-2">
          <Button 
            size="sm"
            variant={timeRange === 'quarterly' ? 'default' : 'outline'}
            onClick={() => setTimeRange('quarterly')}
            className="h-8"
          >
            Quarterly
          </Button>
          <Button 
            size="sm"
            variant={timeRange === 'yearly' ? 'default' : 'outline'}
            onClick={() => setTimeRange('yearly')}
            className="h-8"
          >
            Yearly
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              barGap={0}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
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
              <Bar 
                dataKey="projects" 
                name="Created"
                fill="#3B82F6" 
                radius={[4, 4, 0, 0]}
                maxBarSize={timeRange === 'yearly' ? 30 : 16}
              />
              <Bar 
                dataKey="completed" 
                name="Completed"
                fill="#14B8A6" 
                radius={[4, 4, 0, 0]}
                maxBarSize={timeRange === 'yearly' ? 30 : 16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectsChart;