
import React from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { SecurityFinding } from '../types';

interface CategoryTrendChartProps {
  data: any[];
  chartType: 'line' | 'bar' | 'area';
  findings: SecurityFinding[];
}

const CategoryTrendChart: React.FC<CategoryTrendChartProps> = ({
  data,
  chartType,
  findings
}) => {
  const getColorForIndex = (index: number) => {
    const colors = ['#7C65F6', '#4CD3A5', '#FF6B6B', '#FFA94D', '#63B3ED', '#F687B3', '#B794F4'];
    return colors[index % colors.length];
  };

  const categoryKeys = Object.keys(data[0] || {}).filter(key => key !== 'name');

  return (
    <>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
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
              {categoryKeys.map((category, index) => (
                <Line 
                  key={category}
                  type="monotone" 
                  dataKey={category} 
                  name={category} 
                  stroke={getColorForIndex(index)}
                  strokeWidth={2} 
                  activeDot={{ r: 8 }} 
                />
              ))}
            </LineChart>
          ) : chartType === 'bar' ? (
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
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
              {categoryKeys.map((category, index) => (
                <Bar 
                  key={category}
                  dataKey={category} 
                  name={category} 
                  fill={getColorForIndex(index)}
                  radius={[4, 4, 0, 0]} 
                />
              ))}
            </BarChart>
          ) : (
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
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
              {categoryKeys.map((category, index) => (
                <Area 
                  key={category}
                  type="monotone" 
                  dataKey={category} 
                  name={category} 
                  stroke={getColorForIndex(index)}
                  fill={getColorForIndex(index)}
                  fillOpacity={0.3}
                  stackId="1"
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="text-center p-2 rounded-md bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200">
          <div className="text-xs text-gray-500">Authentication</div>
          <div className="font-semibold text-purple-600">
            {findings.filter(f => f.category === 'Authentication').length}
          </div>
        </div>
        <div className="text-center p-2 rounded-md bg-gradient-to-br from-green-100 to-green-50 border border-green-200">
          <div className="text-xs text-gray-500">API Security</div>
          <div className="font-semibold text-green-600">
            {findings.filter(f => f.category === 'API Security').length}
          </div>
        </div>
        <div className="text-center p-2 rounded-md bg-gradient-to-br from-red-100 to-red-50 border border-red-200">
          <div className="text-xs text-gray-500">Data Security</div>
          <div className="font-semibold text-red-600">
            {findings.filter(f => f.category === 'Data Security').length}
          </div>
        </div>
        <div className="text-center p-2 rounded-md bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200">
          <div className="text-xs text-gray-500">Access Control</div>
          <div className="font-semibold text-blue-600">
            {findings.filter(f => f.category === 'Access Control').length}
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryTrendChart;