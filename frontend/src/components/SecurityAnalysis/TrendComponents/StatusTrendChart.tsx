
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
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { SecurityStats } from '../types';

interface StatusTrendChartProps {
  data: any[];
  chartType: 'line' | 'bar' | 'area';
  stats: SecurityStats;
}

const StatusTrendChart: React.FC<StatusTrendChartProps> = ({
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
                dataKey="openVulnerabilities" 
                name="Open Vulnerabilities" 
                stroke="#FF5252" 
                strokeWidth={2} 
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="mitigatedVulnerabilities" 
                name="Mitigated" 
                stroke="#4CAF50" 
                strokeWidth={2} 
              />
              <Line 
                type="monotone" 
                dataKey="newFindings" 
                name="New Findings" 
                stroke="#2196F3" 
                strokeWidth={2} 
                strokeDasharray="5 5"
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
              <Bar dataKey="openVulnerabilities" name="Open Vulnerabilities" fill="#FF5252" radius={[4, 4, 0, 0]} />
              <Bar dataKey="mitigatedVulnerabilities" name="Mitigated" fill="#4CAF50" radius={[4, 4, 0, 0]} />
              <Bar dataKey="newFindings" name="New Findings" fill="#2196F3" radius={[4, 4, 0, 0]} />
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
                dataKey="openVulnerabilities" 
                name="Open Vulnerabilities" 
                stroke="#FF5252" 
                fill="#FF5252" 
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="mitigatedVulnerabilities" 
                name="Mitigated" 
                stroke="#4CAF50" 
                fill="#4CAF50" 
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="newFindings" 
                name="New Findings" 
                stroke="#2196F3" 
                fill="#2196F3" 
                fillOpacity={0.3}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="flex items-center p-2 bg-red-50 rounded-md border border-red-100">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <div>
            <div className="text-xs text-gray-500">Open</div>
            <div className="font-semibold">{stats.openCount}</div>
          </div>
        </div>
        <div className="flex items-center p-2 bg-blue-50 rounded-md border border-blue-100">
          <Clock className="h-5 w-5 text-blue-500 mr-2" />
          <div>
            <div className="text-xs text-gray-500">In Progress</div>
            <div className="font-semibold">{stats.inProgressCount}</div>
          </div>
        </div>
        <div className="flex items-center p-2 bg-green-50 rounded-md border border-green-100">
          <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
          <div>
            <div className="text-xs text-gray-500">Mitigated</div>
            <div className="font-semibold">{stats.mitigatedCount}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StatusTrendChart;