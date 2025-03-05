
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

// Mock data for security categories
const data = [
  { name: 'Authentication', value: 25 },
  { name: 'Data Protection', value: 30 },
  { name: 'Network Security', value: 20 },
  { name: 'Access Control', value: 15 },
  { name: 'Compliance', value: 10 },
];

const COLORS = ['#7C65F6', '#9b87f5', '#5f4cd3', '#4CD3A5', '#6fdbba'];

const SecurityCategoryChart = () => {
  return (
    <Card className="col-span-1 animate-fade-up" style={{ animationDelay: "0.2s" }}>
      <CardHeader>
        <CardTitle>Security Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: 'none'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityCategoryChart;