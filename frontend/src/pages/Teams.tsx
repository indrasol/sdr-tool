import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/Auth/AuthContext';
import { 
  Plus, 
  Building, 
  Calendar, 
  ArrowRight, 
  Search,
  Grid3X3,
  List,
  Route,
  ExternalLink,
  LogOut,
  Loader2,
  ArrowUp,
  ArrowDown,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';

// Import team interfaces and service
import { Team, CreateTeamPayload } from '@/interfaces/teamInterfaces';
import teamService from '@/services/teamService';
import tokenService from '@/services/tokenService';

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().min(1, 'Description is required'),
});

type CreateTeamFormValues = z.infer<typeof createTeamSchema>;

// Add custom CSS for filter buttons
const filterButtonStyles = `
  bg-gradient-to-r from-blue-50/70 to-purple-50/70
  border-blue-100 hover:border-blue-200
  text-blue-600 hover:text-blue-700
  hover:from-blue-100/80 hover:to-purple-100/80
  hover:shadow-sm
  transition-all duration-300
`;

const activeButtonStyles = `
  bg-gradient-to-r from-blue-100/90 to-purple-100/90
  text-blue-700
  border-blue-200
  font-medium
`;

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Sorting state
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | 'none'>('none');
  // Delete confirmation state
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Handle sort field change
  const handleSortFieldChange = (field: string) => {
    if (sortField === field) {
      // Cycle through sort states: desc -> asc -> none -> desc
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('none');
      } else {
        setSortDirection('desc');
      }
    } else {
      setSortField(field);
      // Default to descending for dates, ascending for text
      const isDateField = field === 'created_at' || field === 'due_date';
      setSortDirection(isDateField ? 'desc' : 'asc');
    }
  };

  // Helper function to get correct arrow icon for sort buttons
  const getSortArrows = (field: string) => {
    if (sortField !== field) {
      // Not sorting by this field - show both arrows side by side
      return (
        <div className="flex items-center ml-1">
          <ArrowUp className="h-3 w-3 text-blue-400" />
          <ArrowDown className="h-3 w-3 text-blue-400" />
        </div>
      );
    } else if (sortDirection === 'asc') {
      // Ascending order
      return <ArrowUp className="h-3.5 w-3.5 ml-1 text-blue-600" />;
    } else if (sortDirection === 'desc') {
      // Descending order
      return <ArrowDown className="h-3.5 w-3.5 ml-1 text-blue-600" />;
    } else {
      // No sort (reset state) - show both arrows side by side
      return (
        <div className="flex items-center ml-1">
          <ArrowUp className="h-3 w-3 text-blue-400" />
          <ArrowDown className="h-3 w-3 text-blue-400" />
        </div>
      );
    }
  };

  // Fetch teams on component mount
  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoadingTeams(true);
      setError(null);
      
      try {
        // Try getting the tenant ID from multiple sources
        let tenantId: number | undefined;
        
        // Try getting tenant ID from the user object in AuthContext first
        if (user?.tenantId) {
          tenantId = user.tenantId;
        } 
        // Fallback to getting tenant ID from token service
        else {
          const userData = tokenService.getUser();
          if (userData?.tenantId) {
            console.log("Tenant ID found in token service:", userData.tenantId);
            tenantId = userData.tenantId;
          }
        }
        
        // If we still don't have a valid tenant ID, use a default value or show an error
        if (!tenantId) {
          // Use a default tenant ID (only if your system has a concept of a default tenant)
          // Or show an error if tenant ID is absolutely required
          console.warn("No tenant ID found, trying to use default tenant");
          // Try to continue with refresh flow - at worst it will return an empty array
          tenantId = 1; // Default tenant ID if applicable
        }

        const teamsData = await teamService.getTeams({
          tenant_id: tenantId,
          include_private: true // Include private teams the user is a member of
        });
        setTeams(teamsData);
        setError(null);
      } catch (error) {
        console.error('Error fetching teams:', error);
        setError('Failed to load teams. Please try again later.');
      } finally {
        setIsLoadingTeams(false);
      }
    };

    fetchTeams();
  }, [user, sortField, sortDirection]);

  // Sorted teams
  const sortedTeams = [...teams].sort((a, b) => {
    if (!sortField || sortDirection === 'none') return 0;
    
    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } 
    else if (sortField === 'created_at') {
      return sortDirection === 'asc'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const form = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const handleCreateTeam = async (values: CreateTeamFormValues) => {
    // Get tenant ID from multiple sources, with fallbacks
    let tenantId: number | undefined;
    
    // Try getting tenant ID from the user object in AuthContext first
    if (user?.tenantId) {
      tenantId = user.tenantId;
    } 
    // Fallback to getting tenant ID from token service
    else {
      const userData = tokenService.getUser();
      if (userData?.tenantId) {
        tenantId = userData.tenantId;
      }
    }
    
    if (!tenantId) {
      toast.error('No tenant ID found. Please log in again.');
      return;
    }

    setIsLoading(true);
    try {
      const payload: CreateTeamPayload = {
        name: values.name,
        description: values.description,
        tenant_id: tenantId,
      };
      
      const newTeam = await teamService.createTeam(payload);
      
      setTeams([...teams, newTeam]);
      setIsCreateDialogOpen(false);
      form.reset();
      toast.success('Team created successfully!');
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamClick = (teamId: number) => {
    navigate(`/dashboard/${teamId}`);
  };

  const filteredTeams = sortedTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Function to retry fetching teams
  const retryFetchTeams = () => {
    setIsLoadingTeams(true);
    setError(null);
    
    // Force authentication check before retrying
    if (!user) {
      navigate('/login', { state: { returnUrl: '/teams' } });
      return;
    }
    
    // Wait a moment to ensure any auth state updates have completed
    setTimeout(async () => {
      try {
        // Try getting the tenant ID from multiple sources
        let tenantId: number | undefined;
        
        // Try getting tenant ID from the user object in AuthContext first
        if (user?.tenantId) {
          tenantId = user.tenantId;
        } 
        // Fallback to getting tenant ID from token service
        else {
          const userData = tokenService.getUser();
          if (userData?.tenantId) {
            tenantId = userData.tenantId;
          }
        }
        
        if (!tenantId) {
          setError("No tenant ID found. Please log in again.");
          return;
        }

        const teamsData = await teamService.getTeams({
          tenant_id: tenantId,
          include_private: true
        });
        setTeams(teamsData);
        setError(null);
      } catch (error) {
        console.error('Error retrying team fetch:', error);
        setError('Failed to load teams. Please try again later.');
      } finally {
        setIsLoadingTeams(false);
      }
    }, 500);
  };

  // Handle team deletion
  const handleDeleteClick = (e: React.MouseEvent, team: Team) => {
    e.stopPropagation(); // Prevent card click from triggering
    setTeamToDelete(team);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    setIsDeletingTeam(true);
    try {
      await teamService.deleteTeam(teamToDelete.id);
      setTeams(teams.filter(t => t.id !== teamToDelete.id));
      toast.success(`Team "${teamToDelete.name}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    } finally {
      setIsDeletingTeam(false);
      setTeamToDelete(null);
    }
  };

  const cancelDeleteTeam = () => {
    setTeamToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      {/* Blended Navigation Bar (brand only) */}
      <motion.nav 
        className="absolute top-0 left-0 right-0 z-50 px-6 md:px-12 py-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8">
              <Route className="w-6 h-6" style={{ color: '#3ECF8E' }} />
            </div>
            <div className="flex items-baseline space-x-2">
              <Link to="/" className="text-xl font-semibold text-gray-900 hover:opacity-90 transition-opacity">
                Secure<span style={{ color: '#3ECF8E' }}>Track</span>
              </Link>
              <a
                href="https://indrasol.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 font-normal hover:text-gray-700 transition-colors duration-200 cursor-pointer"
              >
                by Indrasol
              </a>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-sm font-medium transition-all duration-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </motion.nav>

      {/* Header */}
      <div className="sticky top-[72px] z-40 bg-transparent px-6 md:px-12 py-6">
        <Card className="w-full bg-gradient-to-r from-blue-500/15 via-teal-500/15 to-emerald-500/15 border-none overflow-hidden animate-fade-in shadow-sm hover:shadow-md transition-all duration-300 relative">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between pb-2 relative z-10 p-6">
            <div className="flex items-start">
              <div>
                <CardTitle className="text-3xl md:text-4xl font-semibold font-['Geneva','Segoe UI',sans-serif] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-600 flex items-center gap-2">
                  Teams
                  <div className="h-10 flex items-center">
                    <img src="/indrabot-mascot.png" alt="Indrabot Mascot" className="h-16 md:h-20 w-auto object-contain opacity-40 -ml-2 -my-8" />
                  </div>
                </CardTitle>
                <p className="text-sm md:text-base text-gray-600 mt-2">Manage your teams and access dashboards</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
      
      {/* Controls Section */}
      <div className="container mx-auto px-4 sm:px-6 md:px-12 py-4 mt-24 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-4 md:mb-0">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-64 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 focus:w-full md:focus:w-80"
            />
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            variant="outline"
            size="sm"
            className={`${filterButtonStyles} h-9 text-sm whitespace-nowrap px-3 font-inter`}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Sort buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm text-gray-600 font-medium whitespace-nowrap">Sort by : </span>
            <div className="flex flex-wrap gap-1 mr-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSortFieldChange('name')}
                className={cn(
                  "h-9 gap-1 px-2",
                  filterButtonStyles,
                  sortField === 'name' && sortDirection !== 'none' ? activeButtonStyles : ""
                )}
              >
                Name
                {getSortArrows('name')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSortFieldChange('created_at')}
                className={cn(
                  "h-9 gap-1 px-2 hidden md:flex",
                  filterButtonStyles,
                  sortField === 'created_at' && sortDirection !== 'none' ? activeButtonStyles : ""
                )}
              >
                Created
                {getSortArrows('created_at')}
              </Button>
            </div>
          </div>
          
          {/* Vertical divider */}
          <div className="h-7 border-l border-gray-200 mx-1 hidden sm:block"></div>
          
          <div className="flex items-center">
            <span className="text-xs md:text-sm text-gray-600 font-medium whitespace-nowrap mr-1">View : </span>
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-8 w-8 p-0 ${viewMode==='grid' ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-8 w-8 p-0 ${viewMode==='list' ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className={`container mx-auto px-4 sm:px-6 md:px-12 py-8`}>
        {isLoadingTeams ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Loader2 className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Loading teams...
            </h3>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {error}
            </h3>
            <Button onClick={retryFetchTeams}>
              Try Again
            </Button>
          </motion.div>
        ) : filteredTeams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No teams found' : 'No teams yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Create your first team to get started'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                variant="outline"
                size="sm"
                className={`${filterButtonStyles} h-9 text-sm whitespace-nowrap px-3 font-inter`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            )}
          </motion.div>
        ) : (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
            {sortedTeams.map((team, index) => {
              // Generate a consistent color based on team name
              const colors = [
                'from-purple-500 to-blue-500',
                'from-green-500 to-teal-500',
                'from-orange-500 to-red-500',
                'from-indigo-500 to-purple-500',
                'from-blue-500 to-teal-500'
              ];
              const colorIndex = (team.name.charCodeAt(0) + team.id) % colors.length;
              const color = colors[colorIndex];

              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm overflow-hidden" onClick={() => handleTeamClick(team.id)}>
                    <div className={`h-2 bg-gradient-to-r ${color}`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            {team.avatar_url ? (
                              <img src={team.avatar_url} alt={team.name} className="w-6 h-6 rounded-lg object-cover" />
                            ) : (
                              <Building className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {team.name}
                            </CardTitle>
                            <p className="text-gray-600 text-sm mt-1">{team.description}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(team.created_at)}
                        </Badge>
                        <Badge variant="secondary" className={`${team.is_private ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {team.is_private ? 'Private' : 'Public'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          {team.projects_count || 0} active projects
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <HoverCard openDelay={100} closeDelay={200}>
                            <HoverCardTrigger asChild>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(e, team);
                                }}
                                variant="ghost"
                                size="icon"
                                className="cursor-pointer text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 active:scale-95"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </HoverCardTrigger>
                            <HoverCardContent align="center" side="bottom" sideOffset={6} className="py-1 px-2 bg-gray-50/90 backdrop-blur border border-gray-200/50 text-gray-700 text-xs font-medium rounded-md shadow z-50">
                              Delete Team
                            </HoverCardContent>
                          </HoverCard>
                          <HoverCard openDelay={100} closeDelay={200}>
                            <HoverCardTrigger asChild>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTeamClick(team.id);
                                }}
                                variant="ghost"
                                size="icon"
                                className="cursor-pointer text-gray-700 hover:bg-transparent hover:text-blue-600 transition-transform duration-150 active:scale-95"
                              >
                                <ExternalLink className="w-5 h-5" />
                              </Button>
                            </HoverCardTrigger>
                            <HoverCardContent align="center" side="bottom" sideOffset={6} className="py-1 px-2 bg-gray-50/90 backdrop-blur border border-gray-200/50 text-gray-700 text-xs font-medium rounded-md shadow z-50">
                              Open Dashboard
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Team Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Create New Team</DialogTitle>
            <DialogDescription className="text-gray-600">
              Set up a new team to manage your projects and members.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateTeam)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Team Name</FormLabel>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <FormControl>
                        <Input
                          placeholder="Enter team name"
                          className="pl-10 h-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Description</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Brief description of your team"
                        className="w-full min-h-[100px] p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className={`flex-1 ${filterButtonStyles} h-9 text-sm whitespace-nowrap px-3 font-inter flex items-center justify-center`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Team
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && cancelDeleteTeam()}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the team "{teamToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTeam}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTeam}
              disabled={isDeletingTeam}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
            >
              {isDeletingTeam ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </div>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Teams; 