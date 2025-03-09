
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
import { AlertTriangle, Info } from 'lucide-react';
import { SecurityStats } from '../types';

interface CriticalityTrendChartProps {
  data: any[];
  chartType: 'line' | 'bar' | 'area';
  stats: SecurityStats;
}

const CriticalityTrendChart: React.FC<CriticalityTrendChartProps> = ({
  data,
  chartType,
  stats
}) => {
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
              <Line 
                type="monotone" 
                dataKey="critical" 
                name="Critical" 
                stroke="#FF5252" 
                strokeWidth={2} 
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="high" 
                name="High" 
                stroke="#FF9100" 
                strokeWidth={2} 
              />
              <Line 
                type="monotone" 
                dataKey="medium" 
                name="Medium" 
                stroke="#FFC107" 
                strokeWidth={2} 
              />
              <Line 
                type="monotone" 
                dataKey="low" 
                name="Low" 
                stroke="#4CAF50" 
                strokeWidth={2} 
              />
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
              <Bar dataKey="critical" name="Critical" fill="#FF5252" radius={[4, 4, 0, 0]} />
              <Bar dataKey="high" name="High" fill="#FF9100" radius={[4, 4, 0, 0]} />
              <Bar dataKey="medium" name="Medium" fill="#FFC107" radius={[4, 4, 0, 0]} />
              <Bar dataKey="low" name="Low" fill="#4CAF50" radius={[4, 4, 0, 0]} />
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
              <Area 
                type="monotone" 
                dataKey="critical" 
                name="Critical" 
                stroke="#FF5252" 
                fill="#FF5252" 
                fillOpacity={0.3}
                stackId="1"
              />
              <Area 
                type="monotone" 
                dataKey="high" 
                name="High" 
                stroke="#FF9100" 
                fill="#FF9100" 
                fillOpacity={0.3}
                stackId="1"
              />
              <Area 
                type="monotone" 
                dataKey="medium" 
                name="Medium" 
                stroke="#FFC107" 
                fill="#FFC107" 
                fillOpacity={0.3}
                stackId="1"
              />
              <Area 
                type="monotone" 
                dataKey="low" 
                name="Low" 
                stroke="#4CAF50" 
                fill="#4CAF50" 
                fillOpacity={0.3}
                stackId="1"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="flex items-center p-2 bg-red-50 rounded-md border border-red-100">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <div>
            <div className="text-xs text-gray-500">Critical</div>
            <div className="font-semibold">{stats.criticalCount}</div>
          </div>
        </div>
        <div className="flex items-center p-2 bg-orange-50 rounded-md border border-orange-100">
          <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
          <div>
            <div className="text-xs text-gray-500">High</div>
            <div className="font-semibold">{stats.highCount}</div>
          </div>
        </div>
        <div className="flex items-center p-2 bg-yellow-50 rounded-md border border-yellow-100">
          <Info className="h-5 w-5 text-yellow-500 mr-2" />
          <div>
            <div className="text-xs text-gray-500">Medium</div>
            <div className="font-semibold">{stats.mediumCount}</div>
          </div>
        </div>
        <div className="flex items-center p-2 bg-green-50 rounded-md border border-green-100">
          <Info className="h-5 w-5 text-green-500 mr-2" />
          <div>
            <div className="text-xs text-gray-500">Low</div>
            <div className="font-semibold">{stats.lowCount}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CriticalityTrendChart;