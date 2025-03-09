
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Search, 
  Download, 
  Filter, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { SecurityFinding, SecurityStats } from './types';
import FindingItem from './FindingItem';

interface FindingsAnalysisProps {
  findings: SecurityFinding[];
  filteredFindings: SecurityFinding[];
  expandedFindings: string[];
  toggleExpand: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: any) => void;
  criticalityFilter: string;
  setCriticalityFilter: (criticality: any) => void;
  stats: SecurityStats;
}

const FindingsAnalysis: React.FC<FindingsAnalysisProps> = ({
  findings,
  filteredFindings,
  expandedFindings,
  toggleExpand,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  criticalityFilter,
  setCriticalityFilter,
  stats
}) => {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0 },
        visible: { 
          opacity: 1, 
          transition: { duration: 0.5 }
        }
      }}
    >
      <Card className="border-t-4 border-t-securetrack-purple shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-securetrack-purple/5 to-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-securetrack-purple" />
                Security Findings
              </CardTitle>
              <CardDescription>
                Showing {filteredFindings.length} of {findings.length} total findings
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {/* <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>View Trend</span>
              </Button> */}
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search findings..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <div className="relative inline-flex">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <select 
                  className="pl-8 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="All">All Status</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Mitigated">Mitigated</option>
                  <option value="Accepted">Accepted</option>
                </select>
              </div>
              
              <div className="relative inline-flex">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <select 
                  className="pl-8 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={criticalityFilter}
                  onChange={(e) => setCriticalityFilter(e.target.value as any)}
                >
                  <option value="All">All Criticality</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 mt-4">
            {filteredFindings.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-muted-foreground">No findings match your search criteria</p>
              </div>
            ) : (
              filteredFindings.map((finding) => (
                <FindingItem 
                  key={finding.id}
                  finding={finding}
                  isExpanded={expandedFindings.includes(finding.id)} 
                  toggleExpand={toggleExpand}
                />
              ))
            )}
          </div>
        </CardContent>
        
        <CardFooter className="border-t px-6 py-4 bg-gray-50">
          <div className="flex flex-wrap justify-between items-center w-full text-xs text-muted-foreground">
            <div>
              Showing {filteredFindings.length} of {findings.length} findings
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="flex items-center gap-1 h-6">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span>Mitigated: {stats.mitigatedCount}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 h-6">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <span>In Progress: {stats.inProgressCount}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 h-6">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                <span>Open: {stats.openCount}</span>
              </Badge>
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default FindingsAnalysis;