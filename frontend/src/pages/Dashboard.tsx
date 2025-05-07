import { FileCog, FileText, ShieldCheck, Briefcase, TrendingUp, Users, Clock } from "lucide-react";
import Layout from "@/components/layout/Layout";
import StatCard from "@/components/dashboard/StatCard";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import ProjectsChart from "@/components/dashboard/ProjectsChart";
import SecurityCategoryChart from "@/components/dashboard/SecurityCategoryChart";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import TrendChart from "@/components/dashboard/TrendChart";
import PriorityProjectsCard from "@/components/dashboard/PriorityProjectsCard";
import ClosedProjectsCard from "@/components/dashboard/ClosedProjectsCard";
import CustomizeCard from "@/components/dashboard/CustomizeCard";
import GeneratedReportsCard from "@/components/dashboard/GeneratedReportsCard";
import TeamMembersCard from "@/components/dashboard/TeamMembersCard";
import tokenService from "@/services/tokenService";
import { useState, useEffect, useContext} from 'react';
import { useNavigate } from "react-router-dom";
import AuthContext from "@/components/Auth/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FolderOpen } from "lucide-react";

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL

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
    const navigate = useNavigate();
    const { user, isAuthenticated } = useContext(AuthContext);
    const [stats, setStats] = useState({
      projects: 0,
      analyses: 0,
      reports: 0,
      vulnerabilities: 0,
      teamSize: 0,
      deadline: "0d"
    });
  
    // Check if user is authenticated on component mount
    useEffect(() => {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        navigate("/login");
        return;
      }
  
      // Fetch user stats from API
      const fetchUserStats = async () => {
        try {
          // Get token for authorization
          const token = tokenService.getToken();
          
          if (!token) {
            console.error("No token found");
            return;
          }
  
          // Example API call to get user stats
          const response = await fetch(`${BASE_API_URL}/user/stats`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
  
          if (response.ok) {
            const statsData = await response.json();
            setStats(statsData);
          } else {
            // If API fails, use default stats for now
            setStats({
              projects: 17,
              analyses: 42,
              reports: 31,
              vulnerabilities: 86,
              teamSize: 8,
              deadline: "5d"
            });
          }
        } catch (error) {
          console.error("Error fetching user stats:", error);
          // Fallback to default stats on error
          setStats({
            projects: 17,
            analyses: 42,
            reports: 31,
            vulnerabilities: 86,
            teamSize: 8,
            deadline: "5d"
          });
        }
      };
  
      fetchUserStats();
    }, [isAuthenticated, navigate]);
  
    // If user data is not yet available, you could show a loading state
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
        <div className="space-y-8 mt-16">
            <WelcomeCard username={formatName(displayName)} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            <StatCard
                title="Projects Created"
                value={stats.projects}
                icon={<Briefcase />}
                description="Total Projects"
                className="animate-fade-up hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-teal-500/5"
                style={{ animationDelay: "0.05s" }}
                linkTo="/projects"
            />
            <StatCard
                title="Security Analyses"
                value={stats.analyses}
                icon={<ShieldCheck />}
                description="Completed analyses"
                className="animate-fade-up hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-teal-500/5"
                style={{ animationDelay: "0.1s" }}
            />
            <StatCard
                title="Team Members"
                value={stats.teamSize}
                icon={<Users />}
                description="Security professionals"
                className="animate-fade-up hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-teal-500/5"
                style={{ animationDelay: "0.15s" }}
            />
            <StatCard
                title="Deadline"
                value={stats.deadline}
                icon={<Clock />}
                description="Days until next audit"
                className="animate-fade-up hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-teal-500/5"
                style={{ animationDelay: "0.2s" }}
            />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
                <GeneratedReportsCard />
            </div>
            <SecurityCategoryChart />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
                <ProjectsChart />
            </div>
            <ActivityTimeline />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <PriorityProjectsCard />
            <ClosedProjectsCard />
            <TeamMembersCard />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
            <TrendChart />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
                <StatCard
                title="Vulnerabilities Identified"
                value={stats.vulnerabilities}
                icon={<FileCog />}
                description="Issues identified & resolved"
                className="animate-fade-up hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-teal-500/5"
                />
            </div>
            <CustomizeCard />
            </div>
        </div>
        </Layout>
    );
};

export default Dashboard;