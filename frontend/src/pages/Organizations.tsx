import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthContext from '@/components/Auth/AuthContext';
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
  LogOut
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
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

// Mock data for organizations
const mockOrganizations = [
  {
    id: 1,
    name: 'Acme Corporation',
    description: 'Leading technology solutions provider',
    members: 24,
    projects: 12,
    createdAt: '2024-01-15',
    status: 'active' as const,
    color: 'from-purple-500 to-blue-500',
  },
  {
    id: 2,
    name: 'TechStart Inc.',
    description: 'Innovative startup building the future',
    members: 8,
    projects: 5,
    createdAt: '2024-02-20',
    status: 'active' as const,
    color: 'from-green-500 to-teal-500',
  },
  {
    id: 3,
    name: 'Global Enterprises',
    description: 'Multinational business solutions',
    members: 156,
    projects: 45,
    createdAt: '2023-11-10',
    status: 'active' as const,
    color: 'from-orange-500 to-red-500',
  },
];

const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  description: z.string().min(1, 'Description is required'),
});

type CreateOrgFormValues = z.infer<typeof createOrgSchema>;

const Organizations = () => {
  const [organizations, setOrganizations] = useState(mockOrganizations);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useContext(AuthContext) || {} as any;

  const handleSignOut = () => {
    if (setIsAuthenticated) setIsAuthenticated(false);
    navigate('/login');
  };

  const form = useForm<CreateOrgFormValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const handleCreateOrg = async (values: CreateOrgFormValues) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newOrg = {
        id: Date.now(),
        name: values.name,
        description: values.description,
        members: 1,
        projects: 0,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active' as const,
        color: 'from-indigo-500 to-purple-500',
      };
      
      setOrganizations([...organizations, newOrg]);
      setIsCreateDialogOpen(false);
      form.reset();
      toast.success('Organization created successfully!');
    } catch (error) {
      toast.error('Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrgClick = (orgId: number) => {
    navigate(`/dashboard/${orgId}`);
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
                  Organizations
                  <div className="h-10 flex items-center">
                    <img src="/indrabot-mascot.png" alt="Indrabot Mascot" className="h-16 md:h-20 w-auto object-contain opacity-40 -ml-2 -my-8" />
                  </div>
                </CardTitle>
                <p className="text-sm md:text-base text-gray-600 mt-2">Manage your organizations and access dashboards</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 border-2 border-gray-200 rounded-xl focus:border-purple-500"
                />
              </div>
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
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Organization
              </Button>
            </div>
          </CardHeader>
        </Card>
        
      </div>

      {/* Organizations Grid */}
      <div className="container mx-auto px-4 sm:px-6 md:px-12 py-8 mt-20">
        {filteredOrgs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No organizations found' : 'No organizations yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Create your first organization to get started'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Organization
              </Button>
            )}
          </motion.div>
        ) : (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
            {filteredOrgs.map((org, index) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${org.color}`} />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${org.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <Building className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                            {org.name}
                          </CardTitle>
                          <p className="text-gray-600 text-sm mt-1">{org.description}</p>
                        </div>
                      </div>
                      {/* Settings button removed as per requirement */}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{formatDate(org.createdAt)}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {org.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {org.projects} active projects
                      </div>
                       <HoverCard openDelay={100} closeDelay={200}>
                         <HoverCardTrigger asChild>
                           <Button
                             onClick={() => handleOrgClick(org.id)}
                             variant="ghost"
                             size="icon"
                             className="cursor-pointer text-gray-700 hover:bg-transparent hover:text-gray-700 transition-transform duration-150 active:scale-95"
                           >
                             <ExternalLink className="w-5 h-5" />
                           </Button>
                         </HoverCardTrigger>
                         <HoverCardContent align="center" side="bottom" sideOffset={6} className="py-1 px-2 bg-gray-50/90 backdrop-blur border border-gray-200/50 text-gray-700 text-xs font-medium rounded-md shadow z-50">
                           Open Dashboard
                         </HoverCardContent>
                       </HoverCard>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Organization Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Create New Organization</DialogTitle>
            <DialogDescription className="text-gray-600">
              Set up a new organization to manage your projects and team members.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateOrg)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Organization Name</FormLabel>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <FormControl>
                        <Input
                          placeholder="Enter organization name"
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
                        placeholder="Brief description of your organization"
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
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    <>
                      Create Organization
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Organizations; 