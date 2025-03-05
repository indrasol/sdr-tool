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
import ProjectList from "./pages/ProjectList";
import ExistingProject from "./pages/ExistingProject";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthProvider, useAuth } from "./components/context/AuthContext"; // Fixed path
import GenerateReport from "./pages/generateReport";

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
              <Route path="/" element={<HomePage />} />
              <Route path="/index" element={<Index />} />
              <Route path="/create-project" element={<CreateProject />} />
              <Route path="/existing-project" element={<ExistingProject />} />
              <Route path="/model-with-ai" element={<ModelWithAI />} />
              <Route path="/project-list" element={<ProjectList />} />
              <Route path="*" element={<NotFound />} />
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
            </Routes>
          </AuthProvider>
        </div>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
