
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Shield, AlertTriangle, Clock, CheckCircle2, BarChart2 } from 'lucide-react';
import { SecurityStats } from './types';

interface TitleCardProps {
  stats: SecurityStats;
  onViewTrends: () => void;
  showingTrends: boolean;
}

const TitleCard: React.FC<TitleCardProps> = ({ stats, onViewTrends, showingTrends }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-t-4 border-t-[#7C65F6] shadow-md bg-white relative" style={{ borderTop: '4px solid #7C65F6' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-purple-50 to-blue-50 pointer-events-none rounded-lg" />
        <CardHeader className="relative z-10 pb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-securetrack-green" />
                <CardTitle className="text-2xl font-bold text-securetrack-purple">
                  Security Analysis
                </CardTitle>
              </div>
              <CardDescription className="mt-1">
                Analysis of <span className="font-medium text-gray-700">security_scan_results.xml</span> containing {stats.totalVulnerabilities} vulnerabilities
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant={showingTrends ? "default" : "outline"}
                className={`gap-1 px-3 h-8 ${showingTrends ? 'bg-securetrack-purple hover:bg-securetrack-darkpurple' : 'text-securetrack-purple hover:text-securetrack-purple border-securetrack-purple/50 hover:bg-securetrack-purple/10'}`}
                onClick={onViewTrends}
              >
                <BarChart2 className="h-3.5 w-3.5" />
                View Trends
              </Button>
              <Button 
                size="sm" 
                className="gap-1 px-3 h-8 bg-securetrack-purple hover:bg-securetrack-darkpurple"
              >
                <FileText className="h-3.5 w-3.5" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Overall Mitigation Progress</div>
                <div className="text-sm font-medium">{stats.mitigatedPercentage}%</div>
              </div>
              <Progress 
                value={stats.mitigatedPercentage} 
                className="h-2"
                indicatorClassName="bg-gradient-to-r from-purple-500 to-purple-400" 
              />
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="flex items-center gap-1 h-6 border-red-400/50 bg-white/80">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  <span>Open: {stats.openCount}</span>
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 h-6 border-blue-400/50 bg-white/80">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  <span>In Progress: {stats.inProgressCount}</span>
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 h-6 border-green-400/50 bg-white/80">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  <span>Mitigated: {stats.mitigatedCount}</span>
                </Badge>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-md border border-gray-200 shadow-sm flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center p-2 bg-red-50 rounded-md border border-red-100">
                  <div className="text-xs text-gray-500">Critical</div>
                  <div className="text-xl font-bold text-red-600">{stats.criticalCount}</div>
                </div>
                <div className="flex flex-col items-center p-2 bg-orange-50 rounded-md border border-orange-100">
                  <div className="text-xs text-gray-500">High</div>
                  <div className="text-xl font-bold text-orange-600">{stats.highCount}</div>
                </div>
                <div className="flex flex-col items-center p-2 bg-yellow-50 rounded-md border border-yellow-100">
                  <div className="text-xs text-gray-500">Medium</div>
                  <div className="text-xl font-bold text-yellow-600">{stats.mediumCount}</div>
                </div>
                <div className="flex flex-col items-center p-2 bg-green-50 rounded-md border border-green-100">
                  <div className="text-xs text-gray-500">Low</div>
                  <div className="text-xl font-bold text-green-600">{stats.lowCount}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-gray-100 p-3 flex flex-col justify-center rounded-md border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Security Score</div>
                <div className="text-sm font-medium text-orange-600">Moderate Risk</div>
              </div>
              <div className="relative h-10 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="bg-green-500 h-full" style={{ width: '25%' }}></div>
                  <div className="bg-yellow-500 h-full" style={{ width: '25%' }}></div>
                  <div className="bg-orange-500 h-full" style={{ width: '25%' }}></div>
                  <div className="bg-red-500 h-full" style={{ width: '25%' }}></div>
                </div>
                <div 
                  className="absolute top-0 h-full w-3 bg-white border-2 border-gray-500 rounded-full transform -translate-x-1/2 shadow-md"
                  style={{ 
                    left: `${Math.min(100 - stats.mitigatedPercentage + 30, 85)}%`,
                    transition: 'left 0.5s ease-out'
                  }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Low Risk</span>
                <span>Moderate</span>
                <span>High Risk</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TitleCard;