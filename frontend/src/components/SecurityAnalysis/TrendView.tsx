
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityFinding, SecurityStats } from './types';
import { TrendingUp } from 'lucide-react';

// Import components
import ChartControls from './TrendComponents/ChartControls';
import CriticalityTrendChart from './TrendComponents/CriticalityTrendChart';
import StatusTrendChart from './TrendComponents/StatusTrendChart';
import CategoryTrendChart from './TrendComponents/CategoryTrendChart';

// Import utilities
import { 
  generateTrendData, 
  generateCategoryTrendData, 
  generateStatusChangesTrendData,
  filterDataByTimeRange
} from './utils/trendUtils';

interface TrendViewProps {
  findings: SecurityFinding[];
  stats: SecurityStats;
}

const TrendView: React.FC<TrendViewProps> = ({ findings, stats }) => {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area');
  const [timeRange, setTimeRange] = useState<'all' | '6months' | '3months'>('all');

  // Generate different types of trend data
  const trendData = generateTrendData(findings);
  const categoryTrendData = generateCategoryTrendData(findings);
  const statusChangesTrendData = generateStatusChangesTrendData(findings);
  
  // Filter data based on time range
  const filteredTrendData = filterDataByTimeRange(trendData, timeRange);
  const filteredCategoryTrendData = filterDataByTimeRange(categoryTrendData, timeRange);
  const filteredStatusChangesTrendData = filterDataByTimeRange(statusChangesTrendData, timeRange);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="border-t-4 border-t-[#7C65F6] shadow-md overflow-hidden bg-white relative" style={{ borderTop: '4px solid #7C65F6' }}>
        <CardHeader className="bg-gradient-to-r from-blue-100/80 via-purple-50/70 to-blue-50/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-securetrack-purple" />
                <span className="text-securetrack-purple">
                  Security Trends Analysis
                </span>
              </CardTitle>
              <CardDescription>
                Visualizing security findings and vulnerabilities over time
              </CardDescription>
            </div>
            <ChartControls 
              chartType={chartType}
              setChartType={setChartType}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6 bg-white">
          <Tabs defaultValue="criticality" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4 bg-blue-50/80">
              <TabsTrigger 
                value="criticality" 
                className="data-[state=active]:bg-securetrack-purple data-[state=active]:text-white"
              >
                Criticality Trends
              </TabsTrigger>
              <TabsTrigger 
                value="status" 
                className="data-[state=active]:bg-securetrack-purple data-[state=active]:text-white"
              >
                Status Changes
              </TabsTrigger>
              <TabsTrigger 
                value="category" 
                className="data-[state=active]:bg-securetrack-purple data-[state=active]:text-white"
              >
                Category Analysis
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="criticality" className="bg-white p-4 rounded-md shadow-sm">
              <CriticalityTrendChart 
                data={filteredTrendData} 
                chartType={chartType} 
                stats={stats} 
              />
            </TabsContent>
            
            <TabsContent value="status" className="bg-white p-4 rounded-md shadow-sm">
              <StatusTrendChart 
                data={filteredStatusChangesTrendData} 
                chartType={chartType} 
                stats={stats} 
              />
            </TabsContent>
            
            <TabsContent value="category" className="bg-white p-4 rounded-md shadow-sm">
              <CategoryTrendChart 
                data={filteredCategoryTrendData} 
                chartType={chartType} 
                findings={findings} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TrendView;