import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Index from "./pages/Index";
import CreateProject from "./pages/CreateProject";
import ModelWithAI from "./pages/ModelWithAI";
import NotFound from "./pages/NotFound";
import ExistingProject from "./pages/ExistingProject";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthProvider, useAuth } from "./components/Auth/AuthContext"; // Fixed path
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import GenerateReport from "./pages/GenerateReport";
import ProjectCard from "./components/dashboard/ProjectCard";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import SOC2 from "./pages/SOC2";
import Projects from "./pages/Projects";
import SecurityAnalysis from "./pages/SecurityAnalysis";
import SolutionsHub from "./pages/SolutionsHub";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Router>
        <div className="relative">
          <Toaster />
          <Sonner />
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/index" element={<Index />} />
              
              <Route
                path="/login"
                element={
                  <Login
                    isOpen={true}
                    onOpenChange={() => {}}
                    onSwitchToRegister={() => {}}
                  />
                }
              />
              <Route
                path="/register"
                element={
                  <Register
                    isOpen={true}
                    onOpenChange={() => {}}
                    onSwitchToLogin={() => {}}
                  />
                }
              />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />   
                <Route path="/documents" element={<Documents />} />
                <Route path="/soc2" element={<SOC2 />} />
                <Route path="/create-project" element={<CreateProject />} />
                <Route path="/existing-project" element={<ExistingProject />} />
                <Route path="/model-with-ai" element={<ModelWithAI />} /> 
                <Route path="/projects" element={<Projects />} />
                <Route path="/security-analysis" element={<SecurityAnalysis />} />
                <Route path="/solutions-hub" element={<SolutionsHub />} />
                <Route path="/generate-report" element={<GenerateReport />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </AuthProvider>
        </div>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
