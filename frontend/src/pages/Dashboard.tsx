import { FileCog, Briefcase, Users, FileText, RefreshCw } from "lucide-react";
import Layout from "@/components/layout/Layout";
import StatCard from "@/components/dashboard/StatCard";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import ProjectsChart from "@/components/dashboard/ProjectsChart";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import TrendChart from "@/components/dashboard/TrendChart";
import PriorityProjectsCard from "@/components/dashboard/PriorityProjectsCard";
import ClosedProjectsCard from "@/components/dashboard/ClosedProjectsCard";
import GeneratedReportsCard from "@/components/dashboard/GeneratedReportsCard";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/Auth/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import { useProjectsPage } from '@/components/Projects/ProjectListPage/useProjectsPage';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BASE_API_URL } from '../services/apiService';

// Auto refresh interval for dashboard metrics in milliseconds
const DASHBOARD_AUTO_REFRESH_INTERVAL = 60000; // 60 seconds

const ProjectsNavigationCard = () => (
  <Card className="hover:shadow-md transition-all duration-300 flex flex-col">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-md font-medium">View All Projects</CardTitle>
      <FolderOpen className="h-4 w-4 text-securetrack-purple" />
    </CardHeader>
    <CardContent className="flex-1 flex flex-col">
      <p className="text-sm text-muted-foreground mb-4">
        Access and manage all your security projects from a central location. Track status, priorities, and deadlines.
      </p>
      <div className="mt-auto">
        <Button asChild className="w-full bg-securetrack-purple hover:bg-securetrack-darkpurple">
          <Link to="/projects-list">
            Go to Projects List
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { teamId } = useParams<{ teamId?: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Use our custom hook to fetch metrics with auto-refresh
  const { metrics, isLoading, error, refreshMetrics } = useDashboardMetrics();

  // Redirect to Teams page if no team context is provided
  useEffect(() => {
    if (!teamId) {
      navigate("/teams", { replace: true });
    }
  }, [teamId, navigate]);

  // Check if user is authenticated on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // If user data is not yet available, show a loading state
  if (!user) {
    return <div>Loading user data...</div>;
  }

  const formatName = (name?: string) => {
    // If name is undefined or null, provide a default value
    if (!name) {
      // Use username if available, otherwise a generic greeting
      return user.username || user.email || 'Valued User';
    }
    
    return name
      .replace(/\d/g, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get username from user object, using fallbacks in case properties are missing
  const displayName = user.username || user.email || 'Valued User';

  return (
    <Layout>
      <div className="space-y-8 mt-0">
        <WelcomeCard 
          username={formatName(displayName)} 
          refreshMetrics={refreshMetrics}
          isLoading={isLoading}
        />
        
        {/* Display error message if there was an error fetching metrics */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {/* 1. Projects Created */}
          <StatCard
            title="Projects Created"
            value={metrics.projectsCount || 0}
            icon={<Briefcase className="h-4 w-4" />}
            description="Total Projects"
            className="animate-fade-up hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-teal-500/5"
            style={{ animationDelay: "0.05s" }}
            linkTo="/projects"
            isLoading={isLoading}
          />
          {/* 2. Team Members */}
          <StatCard
            title="Team Members"
            value={metrics.teamMembersCount || 0}
            icon={<Users className="h-4 w-4" />}
            description="Security professionals"
            className="animate-fade-up hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-teal-500/5"
            style={{ animationDelay: "0.1s" }}
            linkTo="/settings?tab=organization"
            isLoading={isLoading}
          />
          {/* 3. Templates Created */}
          <StatCard
            title="Templates Created"
            value={metrics.templatesCount || 0}
            icon={<FileText className="h-4 w-4" />}
            description="Reusable templates"
            className="animate-fade-up hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-teal-500/5"
            style={{ animationDelay: "0.15s" }}
            linkTo="/solutions-hub"
            isLoading={isLoading}
          />
          {/* 4. Vulnerabilities Identified */}
          <StatCard
            title="Vulnerabilities Identified"
            value={metrics.vulnerabilitiesCount || 0}
            icon={<FileCog className="h-4 w-4" />}
            description="Issues identified & resolved"
            className="animate-fade-up hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-teal-500/5"
            style={{ animationDelay: "0.2s" }}
            isLoading={isLoading}
          />
        </div>
        
        <div className="grid grid-cols-1">
          <GeneratedReportsCard 
            reportsCount={metrics.reportsCount} 
            isLoading={isLoading} 
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <ProjectsChart />
          </div>
          <ActivityTimeline />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PriorityProjectsCard />
          <ClosedProjectsCard />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <TrendChart />
        </div>
        
      </div>
    </Layout>
  );
};

export default Dashboard;