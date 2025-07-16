// src/services/dashboardMetricsService.ts
import { BASE_API_URL, getAuthHeaders } from './apiService';
import { toast } from '@/hooks/use-toast';
import tokenService from './tokenService';

// Define types for the dashboard metrics
export interface DashboardMetrics {
  projectsCount: number;
  teamMembersCount: number;
  templatesCount: number;
  reportsCount: number;
  vulnerabilitiesCount: number;
  success?: boolean;
}

export interface FetchMetricsOptions {
  teamId: number;
  tenantId?: number;
  forceRefresh?: boolean;
}

class DashboardMetricsService {
  // Cache mechanism to store metrics temporarily to avoid frequent API calls
  private metricsCache: Record<string, { data: Partial<DashboardMetrics>, timestamp: number }> = {};
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Fetch dashboard metrics from the consolidated endpoint
   * All metrics (projects, team members, templates, reports, vulnerabilities)
   * are retrieved in a single API call
   */
  async fetchDashboardMetrics(options: FetchMetricsOptions): Promise<Partial<DashboardMetrics>> {
    const user = tokenService.getUser();
    const tenantId = options.tenantId || user?.tenantId;
    const teamId = options.teamId || user?.teamId;
    const forceRefresh = options.forceRefresh || false;
    
    // If teamId is missing, return default metrics instead of throwing error
    if (!teamId || !tenantId) {
      console.warn("Missing teamId or tenantId for dashboard metrics");
      return this.getDefaultMetrics();
    }

    const cacheKey = `team-${teamId}`;
    const now = Date.now();
    
    // Check if we have a valid cache entry and not forcing refresh
    if (!forceRefresh && 
        this.metricsCache[cacheKey] && 
        (now - this.metricsCache[cacheKey].timestamp) < this.CACHE_TTL) {
      return this.metricsCache[cacheKey].data;
    }
    
    try {
      // Call the consolidated metrics endpoint
      const response = await fetch(`${BASE_API_URL}/dashboard/metrics?team_id=${teamId}&tenant_id=${tenantId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const metrics = await response.json();
      
      // Normalize the response to our frontend interface
      const normalizedMetrics: Partial<DashboardMetrics> = {
        projectsCount: metrics.projects_count || 0,
        teamMembersCount: metrics.team_members_count || 0,
        templatesCount: metrics.templates_count || 0,
        reportsCount: metrics.reports_count || 0,
        vulnerabilitiesCount: metrics.vulnerabilities_count || 0
      };
      
      // Update cache
      this.metricsCache[cacheKey] = {
        data: normalizedMetrics,
        timestamp: now
      };
      
      return normalizedMetrics;
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      toast({
        title: "Error loading dashboard",
        description: "Failed to load some dashboard metrics.",
        variant: "destructive"
      });
      
      // Return default metrics on error
      return this.getDefaultMetrics();
    }
  }

  // Helper method to return default metrics
  private getDefaultMetrics(): Partial<DashboardMetrics> {
    return {
      projectsCount: 0,
      teamMembersCount: 0,
      templatesCount: 0,
      reportsCount: 0,
      vulnerabilitiesCount: 0
    };
  }
  
  // Method to invalidate cache for a specific team
  invalidateCache(teamId: number): void {
    delete this.metricsCache[`team-${teamId}`];
  }
  
  // Method to invalidate all cached metrics
  invalidateAllCaches(): void {
    this.metricsCache = {};
  }
}

export default new DashboardMetricsService(); 