
import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Info, 
  ChevronUp, 
  ChevronDown, 
  Link2 
} from 'lucide-react';
import { SecurityFinding } from './types';
import { getCriticalityColor, getStatusColor, getStatusIcon } from './utils';

interface FindingItemProps {
  finding: SecurityFinding;
  isExpanded: boolean;
  toggleExpand: (id: string) => void;
}

const FindingItem: React.FC<FindingItemProps> = ({ finding, isExpanded, toggleExpand }) => {
  // Get the appropriate icon component based on status
  const StatusIconComponent = () => {
    const iconName = getStatusIcon(finding.status);
    switch (iconName) {
      case 'AlertTriangle': return <AlertTriangle className="h-3 w-3 text-red-600" />;
      case 'Clock': return <Info className="h-3 w-3 text-blue-600" />;
      case 'CheckCircle2': return <Info className="h-3 w-3 text-green-600" />;
      case 'Info': return <Info className="h-3 w-3 text-orange-600" />;
      default: return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg overflow-hidden shadow-sm border border-gray-100"
    >
      <div 
        className={`p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors ${
          finding.criticality === 'Critical' 
            ? 'bg-red-50' 
            : finding.criticality === 'High' 
            ? 'bg-orange-50' 
            : 'bg-gray-50'
        }`}
        onClick={() => toggleExpand(finding.id)}
      >
        <div className="flex items-center gap-3">
          {finding.criticality === 'Critical' || finding.criticality === 'High' ? (
            <AlertTriangle className={`h-5 w-5 ${finding.criticality === 'Critical' ? 'text-red-500' : 'text-orange-500'}`} />
          ) : (
            <Info className="h-5 w-5 text-blue-500" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{finding.component}</span>
              <Badge variant="outline" className="text-xs font-normal">
                {finding.id}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">{finding.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className={`${getCriticalityColor(finding.criticality)} border`}>
            {finding.criticality}
          </Badge>
          <Badge className={`${getStatusColor(finding.status)} border flex items-center gap-1`}>
            <StatusIconComponent />
            {finding.status}
          </Badge>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 border-t bg-white">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Finding Details</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <div className="font-medium w-24">Category:</div>
                  <div>{finding.category}</div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="font-medium w-24">Identified:</div>
                  <div>{finding.timestamp}</div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="font-medium w-24">Component:</div>
                  <div className="flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    {finding.component}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Mitigation</h4>
              <p className="text-sm">{finding.mitigation}</p>
              
              {finding.status !== 'Mitigated' && (
                <div className="mt-4">
                  <Button size="sm" variant="outline" className="text-xs h-8">
                    Mark as Mitigated
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FindingItem;