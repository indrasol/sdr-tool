
export interface SecurityFinding {
    id: string;
    component: string;
    category: string;
    description: string;
    criticality: 'Critical' | 'High' | 'Medium' | 'Low';
    status: 'Open' | 'In Progress' | 'Mitigated' | 'Accepted';
    mitigation: string;
    timestamp: string;
  }
  
  export interface SecurityStats {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    openCount: number;
    inProgressCount: number;
    mitigatedCount: number;
    totalVulnerabilities: number;
    mitigatedPercentage: number;
  }