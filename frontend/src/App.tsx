import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

// Import contexts
import { AuthProvider } from '@/components/Auth/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { OrgTemplatesProvider } from '@/hooks/useOrgTemplates';

// Import components
import HomePage from '@/pages/HomePage';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Documents from '@/pages/Documents';
import SOC2 from '@/pages/SOC2';
import CreateProject from '@/pages/CreateProject';
import ExistingProject from '@/pages/ExistingProject';
import ModelWithAI from '@/pages/ModelWithAI';
import ModelWithAI_V2 from '@/pages/ModelWithAI_v2';
import Projects from '@/pages/Projects';
import SecurityAnalysis from '@/pages/SecurityAnalysis';
import SolutionsHub from '@/pages/SolutionsHub';
import GenerateReport from '@/pages/GenerateReport';
import ReportsPage from '@/pages/Reports';
import NotFound from '@/pages/NotFound';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DeveloperLogin from '@/pages/DeveloperLogin';
import DeveloperDashboard from '@/pages/DeveloperDashboard';
import Teams from '@/pages/Teams';
import Settings from '@/pages/Settings';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Router>
          <div className="relative">
            <Toaster />
            <Sonner />
            <AuthProvider>
              <OrgTemplatesProvider>
                <Routes>
                {/* Developer Routes - Direct access with username/password */}
                <Route path="/dev" element={<DeveloperLogin />} />
                <Route path="/dev-dash" element={<DeveloperDashboard />} />
                
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/index" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/teams" element={<Teams />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/:teamId" element={<Dashboard />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/soc2" element={<SOC2 />} />
                  <Route path="/create-project" element={<CreateProject />} />
                  <Route path="/existing-project" element={<ExistingProject />} />
                  {/* CURRENT: Use V2 as the main model-with-ai route */}
                  <Route path="/model-with-ai" element={<ModelWithAI_V2 />} />
                  {/* DEPRECATED: Legacy V1 route for backward compatibility only */}
                  <Route path="/model-with-ai-legacy" element={<ModelWithAI />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/security-analysis" element={<SecurityAnalysis />} />
                  <Route path="/solutions-hub" element={<SolutionsHub />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/generate-report" element={<GenerateReport />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
              </OrgTemplatesProvider>
            </AuthProvider>
          </div>
        </Router>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;