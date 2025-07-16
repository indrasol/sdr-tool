import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
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

interface Org {
  id: number;
  name: string;
}

const SidebarNav: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(
    localStorage.getItem("avatarUrl") || null
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // TEMP: mock organizations list – replace with real data when available
  const orgs: Org[] = [
    { id: 1, name: "Acme Corp" },
    { id: 2, name: "TechStart Inc." },
  ];
  const [selectedOrg, setSelectedOrg] = React.useState<number>(() => {
    const stored = localStorage.getItem('selectedOrg');
    return stored ? parseInt(stored, 10) : orgs[0].id;
  });
  const [orgOpen, setOrgOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const navItems = React.useMemo(() => [
    { label: "Dashboard", to: `/dashboard/${selectedOrg}`, icon: LayoutDashboard },
    { label: "Projects", to: "/projects", icon: Folder },
    { label: "Hub", to: "/solutions-hub", icon: Layers },
    { label: "Reports", to: "/reports", icon: FileText },
    { label: "Settings", to: "/settings", icon: SettingsIcon },
  ], [selectedOrg]);

  // Persist org selection
  React.useEffect(() => {
    localStorage.setItem('selectedOrg', String(selectedOrg));
    const name = orgs.find((o) => o.id === selectedOrg)?.name ?? '';
    localStorage.setItem('selectedOrgName', name);
  }, [selectedOrg, orgs]);

  return (
    <aside
      className={cn(
        "min-h-screen bg-gradient-to-b from-securetrack-lightpurple/10 via-white to-securetrack-lightgray/40 border-r flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand & Org selector */}
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

        {/* Organizations dropdown */}
        {/* Replace with shadcn-ui Select for consistent theming */}
        <div className="mt-4">
          {/* Removed label as requested */}
          <Popover open={orgOpen} onOpenChange={setOrgOpen}>
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
              >
                {!collapsed && (
                  <span className="truncate">
                    {orgs.find((o) => o.id === selectedOrg)?.name}
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
                <CommandInput placeholder="Filter orgs..." className="font-inter text-sm border-b border-blue-50 focus:ring-0 focus:border-blue-100" />
                <CommandList>
                  <CommandEmpty>No results</CommandEmpty>
                  <CommandGroup className="overflow-hidden">
                    {orgs.map((org)=> (
                      <CommandItem
                        key={org.id}
                        value={String(org.id)}
                        onSelect={() => { setSelectedOrg(org.id); setOrgOpen(false);} }
                        className="font-inter text-blue-600 dropdown-item cursor-pointer"
                        style={
                          selectedOrg === org.id
                            ? {
                                background:
                                  "linear-gradient(to right, rgba(219, 234, 254, 0.9), rgba(233, 213, 255, 0.9))",
                                color: "#2563eb",
                              }
                            : undefined
                        }
                      >
                        {org.name}
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
      <div className="px-6 py-4 border-t flex items-center justify-between gap-3 sticky bottom-0 bg-transparent">
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