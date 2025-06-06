import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Activity, 
  Server, 
  User, 
  Flag, 
  Terminal, 
  Settings, 
  LogOut, 
  ArrowRight, 
  Search,
  Bell,
  RefreshCw
} from "lucide-react";

const DeveloperDashboard = () => {
  const navigate = useNavigate();
  const [activeUsers, setActiveUsers] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("dev_access_token");
      if (!token) {
        navigate("/dev");
        return;
      }
      setIsAuthenticated(true);
      setIsCheckingAuth(false);
    };
    
    checkAuth();
  }, [navigate]);
  
  // Simulate fetching some stats
  useEffect(() => {
    if (isAuthenticated) {
      setActiveUsers(Math.floor(Math.random() * 100));
    }
  }, [isAuthenticated]);

  // If still checking auth or not authenticated, don't render dashboard
  if (isCheckingAuth) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return null; // This shouldn't actually render as we redirect in the useEffect
  }

  const handleLogout = () => {
    localStorage.removeItem("dev_access_token");
    navigate("/dev");
  };

  const handleEnterApp = () => {
    navigate("/");
  };

  const refreshStats = () => {
    setIsLoading(true);
    setTimeout(() => {
      setActiveUsers(Math.floor(Math.random() * 100));
      setIsLoading(false);
    }, 800);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Server className="h-8 w-8 text-[#7c65f6]" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">DevConsole</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="h-5 w-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-[#7c65f6]"></span>
              </div>
              <div className="border-l h-6 mx-2"></div>
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#f2effe] text-[#7c65f6]">
                    DV
                  </AvatarFallback>
                </Avatar>
                <span className="ml-2 text-sm font-medium">Developer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Developer Dashboard</h1>
              <p className="text-gray-500 mt-1">Monitor, manage, and configure your application</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button 
                variant="default" 
                className="flex items-center"
                onClick={handleEnterApp}
              >
                <span>Enter Application</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="default" 
                className="flex items-center"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="pb-2 bg-[#7c65f6] text-white">
              <CardTitle className="text-lg font-medium flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Active Users
              </CardTitle>
              <CardDescription className="text-[#e4e0ff]">Current system usage</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <p className="text-4xl font-bold text-gray-900">{activeUsers}</p>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={refreshStats}
                  disabled={isLoading}
                  className="h-8 w-8 p-0 text-[#7c65f6] hover:text-[#6b56e3] hover:bg-[#f5f3ff]"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <Badge variant="outline" className="text-[#7c65f6] bg-[#f5f3ff] border-[#d6d1fa]">
                  +12% from yesterday
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="pb-2 bg-[#7c65f6] text-white">
              <CardTitle className="text-lg font-medium flex items-center">
                <Server className="mr-2 h-5 w-5" />
                System Status
              </CardTitle>
              <CardDescription className="text-[#e4e0ff]">Current system health</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <p className="text-sm font-medium">API Services</p>
                  <Badge className="ml-auto bg-green-100 text-green-800 hover:bg-green-100">100%</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <p className="text-sm font-medium">Database</p>
                  <Badge className="ml-auto bg-green-100 text-green-800 hover:bg-green-100">100%</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <p className="text-sm font-medium">Auth Service</p>
                  <Badge className="ml-auto bg-yellow-100 text-yellow-800 hover:bg-yellow-100">97.3%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="pb-2 bg-[#7c65f6] text-white">
              <CardTitle className="text-lg font-medium flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Application Mode
              </CardTitle>
              <CardDescription className="text-[#e4e0ff]">Toggle development settings</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between bg-[#f8f7fe] p-3 rounded-lg">
                <div>
                  <Label htmlFor="debug-mode" className="font-medium">Debug Mode</Label>
                  <p className="text-xs text-gray-500">Enable verbose logging</p>
                </div>
                <Switch
                  id="debug-mode"
                  checked={debugMode}
                  onCheckedChange={setDebugMode}
                  className="data-[state=checked]:bg-[#7c65f6]"
                />
              </div>
              <div className="flex items-center justify-between bg-[#f8f7fe] p-3 rounded-lg">
                <div>
                  <Label htmlFor="maintenance-mode" className="font-medium">Maintenance Mode</Label>
                  <p className="text-xs text-gray-500">Show maintenance page</p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                  className="data-[state=checked]:bg-[#7c65f6]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="features" className="mt-10">
          <div className="border-b mb-6">
            <TabsList className="bg-transparent h-auto p-0 mb-0">
              <TabsTrigger 
                value="features" 
                className="py-3 px-6 data-[state=active]:border-b-2 data-[state=active]:border-[#7c65f6] rounded-none data-[state=active]:text-[#7c65f6] data-[state=active]:bg-white data-[state=active]:shadow-none"
              >
                <Flag className="mr-2 h-4 w-4" />
                Feature Flags
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="py-3 px-6 data-[state=active]:border-b-2 data-[state=active]:border-[#7c65f6] rounded-none data-[state=active]:text-[#7c65f6] data-[state=active]:bg-white data-[state=active]:shadow-none"
              >
                <User className="mr-2 h-4 w-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="py-3 px-6 data-[state=active]:border-b-2 data-[state=active]:border-[#7c65f6] rounded-none data-[state=active]:text-[#7c65f6] data-[state=active]:bg-white data-[state=active]:shadow-none"
              >
                <Terminal className="mr-2 h-4 w-4" />
                System Logs
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="features" className="mt-0">
            <Card className="border-none shadow-md">
              <CardHeader className="border-b bg-[#f8f7fe] py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Feature Flags</CardTitle>
                    <CardDescription>Toggle features in the application</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      type="search" 
                      placeholder="Search features..." 
                      className="pl-10 max-w-xs focus-visible:ring-[#7c65f6]" 
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "New Dashboard", description: "Updated UI for analytics dashboard", enabled: false },
                    { name: "AI Assistant Pro", description: "Enhanced AI capabilities", enabled: true },
                    { name: "Advanced Analytics", description: "Statistical insights and reporting", enabled: false },
                    { name: "Beta Search", description: "New search algorithm implementation", enabled: false }
                  ].map((feature) => (
                    <div key={feature.name} className="bg-white border rounded-lg p-4 hover:border-[#d6d1fa] hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{feature.name}</h3>
                          <p className="text-sm text-gray-500">{feature.description}</p>
                        </div>
                        <Switch defaultChecked={feature.enabled} className="data-[state=checked]:bg-[#7c65f6]" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users" className="mt-0">
            <Card className="border-none shadow-md">
              <CardHeader className="border-b bg-[#f8f7fe] py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage test and admin accounts</CardDescription>
                  </div>
                  <Button size="sm" className="bg-[#7c65f6] hover:bg-[#6b56e3]">Add Test User</Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#f8f7fe]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[
                        { email: "admin@example.com", role: "Admin", status: "Active", lastLogin: "Today" },
                        { email: "tester1@example.com", role: "Tester", status: "Active", lastLogin: "Yesterday" },
                        { email: "tester2@example.com", role: "Tester", status: "Inactive", lastLogin: "3 days ago" }
                      ].map((user) => (
                        <tr key={user.email} className="hover:bg-[#f8f7fe]">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-[#f2effe] text-[#7c65f6]">
                                  {user.email.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={user.role === "Admin" ? "bg-[#f2effe] text-[#7c65f6] hover:bg-[#e4e0ff]" : "bg-blue-100 text-blue-800"}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.lastLogin}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button variant="outline" size="sm" className="mr-2 border-[#d6d1fa] text-[#7c65f6] hover:bg-[#f8f7fe] hover:text-[#6b56e3]">Edit</Button>
                            <Button variant="outline" size="sm" className="border-[#d6d1fa] text-[#7c65f6] hover:bg-[#f8f7fe] hover:text-[#6b56e3]">Reset</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="logs" className="mt-0">
            <Card className="border-none shadow-md">
              <CardHeader className="border-b bg-[#f8f7fe] py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>System Logs</CardTitle>
                    <CardDescription>Recent system activity</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="border-[#d6d1fa] text-[#7c65f6] hover:bg-[#f8f7fe] hover:text-[#6b56e3]">Clear Logs</Button>
                    <Button variant="outline" size="sm" className="border-[#d6d1fa] text-[#7c65f6] hover:bg-[#f8f7fe] hover:text-[#6b56e3]">Download</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-gray-900 text-gray-100 font-mono p-6 rounded-b-lg text-sm overflow-y-auto h-80 max-h-80">
                  <div className="space-y-2">
                    {[
                      { time: new Date().toISOString(), level: "INFO", message: "Server started" },
                      { time: new Date().toISOString(), level: "INFO", message: "Database connection established" },
                      { time: new Date().toISOString(), level: "INFO", message: "User admin@example.com logged in" },
                      { time: new Date().toISOString(), level: "DEBUG", message: "API request: GET /api/users" },
                      { time: new Date().toISOString(), level: "DEBUG", message: "API request: POST /api/projects" },
                      { time: new Date().toISOString(), level: "WARN", message: "Rate limit reached for IP 192.168.1.1" },
                      { time: new Date().toISOString(), level: "ERROR", message: "Failed to process payment for user_id: 342" },
                      { time: new Date().toISOString(), level: "INFO", message: "Background job completed: daily-backup" }
                    ].map((log, index) => (
                      <div key={index} className="flex">
                        <span className="text-gray-500 min-w-[200px]">{log.time}</span>
                        <span className={`min-w-[60px] ${
                          log.level === "ERROR" ? "text-red-400" : 
                          log.level === "WARN" ? "text-yellow-400" : 
                          log.level === "DEBUG" ? "text-[#9a8afa]" : 
                          "text-green-400"
                        }`}>
                          [{log.level}]
                        </span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DeveloperDashboard;

