
import { SecurityFinding } from '../types';

// Generate trend data based on findings
export const generateTrendData = (findings: SecurityFinding[]) => {
  // Group findings by month
  const monthGroups: { [key: string]: SecurityFinding[] } = {};
  
  findings.forEach(finding => {
    const month = finding.timestamp.substring(0, 7); // Extract YYYY-MM
    if (!monthGroups[month]) {
      monthGroups[month] = [];
    }
    monthGroups[month].push(finding);
  });

  // Create trend data
  return Object.keys(monthGroups).sort().map(month => {
    const monthFindings = monthGroups[month];
    const criticalCount = monthFindings.filter(f => f.criticality === 'Critical').length;
    const highCount = monthFindings.filter(f => f.criticality === 'High').length;
    const mediumCount = monthFindings.filter(f => f.criticality === 'Medium').length;
    const lowCount = monthFindings.filter(f => f.criticality === 'Low').length;
    
    const openCount = monthFindings.filter(f => f.status === 'Open').length;
    const inProgressCount = monthFindings.filter(f => f.status === 'In Progress').length;
    const mitigatedCount = monthFindings.filter(f => f.status === 'Mitigated').length;
    const acceptedCount = monthFindings.filter(f => f.status === 'Accepted').length;
    
    const date = new Date(month);
    const monthName = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();

    return {
      name: `${monthName} ${year}`,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      open: openCount,
      inProgress: inProgressCount,
      mitigated: mitigatedCount,
      accepted: acceptedCount,
      total: monthFindings.length
    };
  });
};

// Generate category trend data
export const generateCategoryTrendData = (findings: SecurityFinding[]) => {
  // Get unique categories
  const categories = [...new Set(findings.map(f => f.category))];
  
  // Group findings by month and category
  const monthCategoryGroups: { [key: string]: { [category: string]: number } } = {};
  
  findings.forEach(finding => {
    const month = finding.timestamp.substring(0, 7); // Extract YYYY-MM
    if (!monthCategoryGroups[month]) {
      monthCategoryGroups[month] = {};
    }
    
    if (!monthCategoryGroups[month][finding.category]) {
      monthCategoryGroups[month][finding.category] = 0;
    }
    
    monthCategoryGroups[month][finding.category]++;
  });

  // Create trend data
  return Object.keys(monthCategoryGroups).sort().map(month => {
    const date = new Date(month);
    const monthName = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    
    const data: any = {
      name: `${monthName} ${year}`
    };
    
    categories.forEach(category => {
      data[category] = monthCategoryGroups[month][category] || 0;
    });
    
    return data;
  });
};

// Generate monthly status changes trend data
export const generateStatusChangesTrendData = (findings: SecurityFinding[]) => {
  // Simulate status changes over time (in a real app, this would come from a status history)
  const months = [...new Set(findings.map(f => f.timestamp.substring(0, 7)))].sort();
  
  let runningOpen = 0;
  let runningMitigated = 0;
  
  return months.map(month => {
    const monthFindings = findings.filter(f => f.timestamp.substring(0, 7) === month);
    
    const newOpen = monthFindings.filter(f => f.status === 'Open').length;
    const newMitigated = monthFindings.filter(f => f.status === 'Mitigated').length;
    
    runningOpen = runningOpen + newOpen - newMitigated;
    runningMitigated += newMitigated;
    
    const date = new Date(month);
    const monthName = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    
    return {
      name: `${monthName} ${year}`,
      openVulnerabilities: runningOpen,
      mitigatedVulnerabilities: runningMitigated,
      newFindings: monthFindings.length
    };
  });
};

// Filter data based on time range
export const filterDataByTimeRange = (data: any[], timeRange: 'all' | '6months' | '3months') => {
  if (timeRange === 'all') return data;
  
  const now = new Date();
  const monthsAgo = timeRange === '6months' ? 6 : 3;
  now.setMonth(now.getMonth() - monthsAgo);
  
  return data.filter(item => {
    const itemDate = new Date(item.name);
    return itemDate >= now;
  });
};