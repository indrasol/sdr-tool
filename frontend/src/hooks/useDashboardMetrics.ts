// src/hooks/useDashboardMetrics.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import dashboardMetricsService, { DashboardMetrics } from '@/services/dashboardMetricsService';
import { useAuth } from '@/components/Auth/AuthContext';
import tokenService from '@/services/tokenService';

// Function to calculate milliseconds until next midnight
const getMillisecondsUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
};

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<Partial<DashboardMetrics>>({
    projectsCount: 0,
    teamMembersCount: 0,
    templatesCount: 0,
    reportsCount: 0,
    vulnerabilitiesCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const midnightTimerRef = useRef<number | null>(null);

  // Fetch metrics function
  const fetchMetrics = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get user info from token service
      const user = tokenService.getUser();
      
      // Fetch metrics with available data, service will handle missing values
      const fetchedMetrics = await dashboardMetricsService.fetchDashboardMetrics({
        teamId: user?.teamId,
        tenantId: user?.tenantId,
        forceRefresh
      });
      
      setMetrics(fetchedMetrics);
    } catch (err: any) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err?.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Schedule next midnight refresh
  const scheduleMidnightRefresh = useCallback(() => {
    if (midnightTimerRef.current) {
      window.clearTimeout(midnightTimerRef.current);
    }
    
    const msUntilMidnight = getMillisecondsUntilMidnight();
    
    midnightTimerRef.current = window.setTimeout(() => {
      // Refresh metrics at midnight
      fetchMetrics(true);
      // Schedule the next midnight refresh
      scheduleMidnightRefresh();
    }, msUntilMidnight);
    
    console.log(`Dashboard metrics refresh scheduled in ${Math.round(msUntilMidnight / 60000)} minutes`);
  }, [fetchMetrics]);

  // Initial fetch and schedule
  useEffect(() => {
    // Initial fetch when component mounts
    fetchMetrics();
    
    // Set up midnight refresh if authenticated
    if (isAuthenticated) {
      scheduleMidnightRefresh();
    }
    
    // Cleanup function
    return () => {
      if (midnightTimerRef.current) {
        window.clearTimeout(midnightTimerRef.current);
        midnightTimerRef.current = null;
      }
    };
  }, [fetchMetrics, scheduleMidnightRefresh, isAuthenticated]);

  // Refresh function for manual refresh
  const refreshMetrics = useCallback(async () => {
    try {
      const user = tokenService.getUser();
      
      if (user?.teamId) {
        // Invalidate cache first to ensure fresh data
        dashboardMetricsService.invalidateCache(user.teamId);
      } else {
        // If no team ID, invalidate all caches
        dashboardMetricsService.invalidateAllCaches();
      }
      
      // Force refresh from backend
      await fetchMetrics(true);
    } catch (err: any) {
      console.error('Error during metrics refresh:', err);
      setError(err?.message || 'Failed to refresh dashboard metrics');
    }
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refreshMetrics
  };
} 