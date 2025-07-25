import { useState } from 'react';
import { Route, Menu, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const AppHeader = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Brand - Leftmost positioning */}
        <Link to="/teams" className="flex items-center space-x-2 hover:opacity-90 transition-opacity flex-shrink-0">
          <div className="relative flex items-center">
            <Route className="w-8 h-8" style={{ color: '#3ECF8E' }} />
          </div>
          <span className="text-xl font-semibold text-foreground">
            Secure<span style={{ color: '#3ECF8E' }}>Track</span>
          </span>
        </Link>
        
        {/* Navigation and Actions - Rightmost positioning */}
        <div className="flex items-center space-x-6">
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link to="/projects" className="text-sm font-medium hover:text-primary transition-colors">
              Projects
            </Link>
            <Link to="/solutions-hub" className="text-sm font-medium hover:text-primary transition-colors">
              Hub
            </Link>
            <a href="/documents" className="text-sm font-medium hover:text-primary transition-colors">
              Documents
            </a>
            <a href="/soc2" className="text-sm font-medium hover:text-primary transition-colors">
              SOC 2
            </a>
          </nav>
          
          {/* Logout button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm font-medium transition-all border-securetrack-purple/50 text-securetrack-purple hover:bg-gradient-to-br from-securetrack-purple to-securetrack-lightpurple hover:text-white hover:border-securetrack-purple shadow-sm hover:-translate-y-1 duration-300"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
