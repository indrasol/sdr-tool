
import { SecurityFinding, SecurityStats } from "./types";

export const getCriticalityColor = (criticality: SecurityFinding['criticality']) => {
  switch (criticality) {
    case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusColor = (status: SecurityFinding['status']) => {
  switch (status) {
    case 'Open': return 'bg-red-50 text-red-700 border-red-100';
    case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'Mitigated': return 'bg-green-50 text-green-700 border-green-100';
    case 'Accepted': return 'bg-orange-50 text-orange-700 border-orange-100';
    default: return 'bg-gray-50 text-gray-700 border-gray-100';
  }
};

export const getStatusIcon = (status: SecurityFinding['status']) => {
  switch (status) {
    case 'Open': return 'AlertTriangle';
    case 'In Progress': return 'Clock';
    case 'Mitigated': return 'CheckCircle2';
    case 'Accepted': return 'Info';
    default: return null;
  }
};

export const getSummaryStats = (findings: SecurityFinding[]): SecurityStats => {
  const criticalCount = findings.filter(f => f.criticality === 'Critical').length;
  const highCount = findings.filter(f => f.criticality === 'High').length;
  const mediumCount = findings.filter(f => f.criticality === 'Medium').length;
  const lowCount = findings.filter(f => f.criticality === 'Low').length;
  
  const openCount = findings.filter(f => f.status === 'Open').length;
  const inProgressCount = findings.filter(f => f.status === 'In Progress').length;
  const mitigatedCount = findings.filter(f => f.status === 'Mitigated').length;
  
  const totalVulnerabilities = findings.length;
  const mitigatedPercentage = Math.round((mitigatedCount / totalVulnerabilities) * 100);
  
  return {
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    openCount,
    inProgressCount,
    mitigatedCount,
    totalVulnerabilities,
    mitigatedPercentage
  };
};