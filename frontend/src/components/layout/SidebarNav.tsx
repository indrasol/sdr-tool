import React from "react";
import { NavLink, Link, useNavigate, useParams, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Folder,
  Layers,
  Route,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  ChevronsUpDown,
  Menu,
  PanelLeft,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useAuth } from "@/components/Auth/AuthContext";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Team } from "@/interfaces/teamInterfaces";
import tokenService from '@/services/tokenService';
import { BASE_API_URL, getAuthHeaders } from '@/services/apiService';

interface SidebarNavProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ onCollapseChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ teamId?: string }>();
  const { user, logout } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(
    localStorage.getItem("avatarUrl") || null
  );
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Extract teamId from URL params
  const urlTeamId = params.teamId ? parseInt(params.teamId, 10) : undefined;

  // State for selected team
  const [selectedTeam, setSelectedTeam] = React.useState<number>(() => {
    // If we have a team ID in URL params, use that first
    if (urlTeamId) {
      return urlTeamId;
    }
    // Otherwise check localStorage
    const stored = localStorage.getItem('selectedTeam');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [teamDropdownOpen, setTeamDropdownOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  // Effect to update selected team when URL changes
  React.useEffect(() => {
    if (urlTeamId && urlTeamId !== selectedTeam) {
      setSelectedTeam(urlTeamId);
    }
  }, [urlTeamId]);
  
  // Effect to notify parent component when collapsed state changes
  React.useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(collapsed);
    }
  }, [collapsed, onCollapseChange]);

  // Fetch teams data
  React.useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      try {
        // Try getting tenant ID from multiple sources
        let tenantId: number | undefined;
        
        if (user?.tenantId) {
          tenantId = user.tenantId;
        } else {
          const userData = tokenService.getUser();
          if (userData?.tenantId) {
            tenantId = userData.tenantId;
          }
        }
        
        if (!tenantId) {
          console.warn("No tenant ID found, using default value");
          tenantId = 1; // Default tenant ID
        }

        const response = await fetch(`${BASE_API_URL}/teams?tenant_id=${tenantId}&include_private=true`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch teams: ${response.status}`);
        }
        
        const data = await response.json();
        setTeams(data.teams);
        
        // Only set a default team if no team is selected yet and we don't have a URL parameter
        if ((!selectedTeam || selectedTeam === 0) && !urlTeamId && data.teams.length > 0) {
          setSelectedTeam(data.teams[0].id);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, [user, urlTeamId, selectedTeam]);

  const navItems = React.useMemo(() => [
    { label: "Dashboard", to: `/dashboard/${selectedTeam}`, icon: LayoutDashboard },
    { label: "Projects", to: "/projects", icon: Folder },
    { label: "Hub", to: "/solutions-hub", icon: Layers },
    { label: "Reports", to: "/reports", icon: FileText },
    { label: "Settings", to: "/settings", icon: SettingsIcon },
  ], [selectedTeam]);

  // Persist team selection
  React.useEffect(() => {
    if (selectedTeam) {
      localStorage.setItem('selectedTeam', String(selectedTeam));
      const name = teams.find((t) => t.id === selectedTeam)?.name ?? '';
      localStorage.setItem('selectedTeamName', name);
    }
  }, [selectedTeam, teams]);

  // Handle team selection in the dropdown
  const handleTeamChange = (teamId: number) => {
    setSelectedTeam(teamId);
    setTeamDropdownOpen(false);
    
    // Navigate to the dashboard with the new team ID
    if (location.pathname.includes('/dashboard')) {
      navigate(`/dashboard/${teamId}`);
    }
  };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-screen bg-gradient-to-b from-securetrack-lightpurple/10 via-white to-securetrack-lightgray/40 border-r flex flex-col transition-all duration-300 overflow-y-auto",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand & Team selector */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-start gap-2">
          {/* SecureTrack logo icon */}
          <Route className="w-6 h-6 flex-shrink-0" style={{ color: "#3ECF8E" }} />
          {/* Brand text + subtitle */}
          {!collapsed && (
            <div className="flex flex-col -mt-0.5">
              <Link
                to="/teams"
                className="flex items-baseline gap-1 text-2xl font-semibold text-gray-900 hover:opacity-90 transition-opacity"
              >
                Secure<span style={{ color: "#3ECF8E" }}>Track</span>
              </Link>
              <a
                href="https://indrasol.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 font-normal hover:text-blue-700 transition-colors duration-200 cursor-pointer"
              >
                by Indrasol
              </a>
            </div>
          )}
          {/* Collapse / expand toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "p-1 rounded hover:bg-gray-100 transition-colors",
              collapsed ? "" : "ml-auto"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Back to Teams Button */}
        {!collapsed && (
          <Link
            to="/teams"
            className="mt-4 mb-2 w-full flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-gradient-to-r from-blue-50/70 to-purple-50/70 hover:from-blue-100/80 hover:to-purple-100/80 rounded-md border border-blue-100 hover:border-blue-200 transition-all duration-200 hover:shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Teams
          </Link>
        )}
        {collapsed && (
          <Link
            to="/teams"
            className="mt-4 mb-2 w-full flex justify-center items-center py-1.5 text-blue-600 bg-gradient-to-r from-blue-50/70 to-purple-50/70 hover:from-blue-100/80 hover:to-purple-100/80 rounded-md border border-blue-100 hover:border-blue-200 transition-all duration-200 hover:shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}

        {/* Teams dropdown */}
        <div className="mt-3">
          <Popover open={teamDropdownOpen} onOpenChange={setTeamDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 text-sm font-inter bg-gradient-to-r from-blue-50/70 to-purple-50/70 border-blue-100 hover:border-blue-200 text-blue-600 hover:text-blue-700 hover:from-blue-100/80 hover:to-purple-100/80 hover:shadow-sm transition-all duration-300 flex items-center",
                  collapsed
                    ? "w-9 p-0 justify-center"
                    : "w-full px-2 sm:px-3 justify-between"
                )}
                disabled={isLoading || teams.length === 0}
              >
                {!collapsed && (
                  <span className="truncate">
                    {isLoading 
                      ? "Loading..." 
                      : teams.length === 0 
                        ? "No teams" 
                        : teams.find((t) => t.id === selectedTeam)?.name || "Select team"}
                  </span>
                )}
                <ChevronsUpDown
                  className={cn(
                    "h-3.5 w-3.5 flex-shrink-0",
                    collapsed ? "" : "ml-1"
                  )}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 bg-white shadow-lg border border-blue-100 rounded-lg" align="start">
              <Command className="rounded-lg">
                <CommandInput placeholder="Filter teams..." className="font-inter text-sm border-b border-blue-50 focus:ring-0 focus:border-blue-100" />
                <CommandList>
                  <CommandEmpty>No teams found</CommandEmpty>
                  <CommandGroup className="overflow-hidden">
                    {teams.map((team)=> (
                      <CommandItem
                        key={team.id}
                        value={String(team.id)}
                        onSelect={() => handleTeamChange(team.id)}
                        style={{
                          background: selectedTeam === team.id 
                            ? 'linear-gradient(to right, rgba(219, 234, 254, 0.9), rgba(233, 213, 255, 0.9))' 
                            : 'transparent',
                          color: '#2563eb',
                          border: '1px solid transparent',
                          margin: '2px 4px',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                        className="font-inter text-blue-600 dropdown-item"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-blue-600",
                            selectedTeam === team.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {team.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-6 py-2 text-sm font-medium rounded-md transition-all",
                isActive
                  ? "text-blue-700 bg-gradient-to-r from-blue-100/90 to-purple-100/90 border border-blue-200"
                  : "text-gray-600 hover:text-blue-700 hover:bg-blue-50"
              )
            }
          >
            <Icon className="h-5 w-5 transition-transform group-hover:scale-105" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* Profile & Logout */}
      <div className="px-6 py-4 border-t flex items-center justify-between gap-3 bg-transparent">
        {user && (
          <div className="flex items-center gap-2 overflow-hidden cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-securetrack-purple/20 flex items-center justify-center text-sm font-medium uppercase text-securetrack-purple">
                {user.username?.charAt(0) || user.email?.charAt(0) || "U"}
              </div>
            )}
            {!collapsed && (
              <span className="text-sm font-medium truncate">
                {user.username || user.email?.split("@")[0] || "User"}
              </span>
            )}
          </div>
        )}

        {/* hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              setAvatarUrl(result);
              localStorage.setItem("avatarUrl", result);
            };
            reader.readAsDataURL(file);
          }}
        />
        <button
          onClick={handleLogout}
          className="text-gray-600 hover:text-securetrack-purple transition-colors"
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
};

export default SidebarNav; 