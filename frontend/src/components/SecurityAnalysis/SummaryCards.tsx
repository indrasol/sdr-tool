
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Shield } from 'lucide-react';
import { SecurityStats } from './types';

interface SummaryCardsProps {
  stats: SecurityStats;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ stats }) => {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0 },
        visible: { 
          opacity: 1, 
          transition: { duration: 0.5 }
        }
      }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <Card className="hover:shadow-md transition-all duration-300 border-t-4 rounded-t-none" style={{ borderTopColor: '#7C65F6' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-securetrack-purple" />
            File Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-securetrack-purple/5 to-securetrack-green/5 rounded-md">
            <h4 className="font-medium mb-2">Imported File Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">File Name:</span>
                <span className="font-medium">security_scan_results.xml</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">File Size:</span>
                <span>1.2 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scan Date:</span>
                <span>2023-08-15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scanner:</span>
                <span>WebSecurityScanner v3.2.1</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-all duration-300 border-t-4 rounded-t-none" style={{ borderTopColor: '#7C65F6' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-securetrack-green" />
            Security Score
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="relative w-32 h-32 mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-100 to-red-200"></div>
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-r from-green-300 to-green-500"
              style={{ 
                clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos(Math.PI * 2 * stats.mitigatedPercentage / 100)}% ${50 - 50 * Math.sin(Math.PI * 2 * stats.mitigatedPercentage / 100)}%, 50% 0%)` 
              }}
            ></div>
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center shadow-inner">
              <div className="text-center">
                <div className="text-3xl font-bold text-securetrack-purple">{64 - Math.floor(stats.mitigatedPercentage / 3)}</div>
                <div className="text-xs text-muted-foreground">Risk Score</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="text-sm">High Risk</span>
              </div>
              <span className="text-sm font-medium">50-100</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="text-sm">Medium Risk</span>
              </div>
              <span className="text-sm font-medium">25-49</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-sm">Low Risk</span>
              </div>
              <span className="text-sm font-medium">0-24</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SummaryCards;