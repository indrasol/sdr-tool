import { useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useEffect, useState } from 'react';
import { Project } from '@/interfaces/projectInterfaces';
import { useProjects } from '@/hooks/useProjects';
import { Puzzle, Sparkles, Bot, ChevronRight, Search, Filter, Zap, Lock, Cloud, Shield, Server, Database, Globe, Star, X, Calendar, Users, ArrowRight, Clock, AlertCircle, ChevronDown, Check, ChevronsUpDown, GitBranchPlus, Workflow } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import React from 'react';
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Solution template interfaces
interface SolutionTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  popularity: number;
  image: string;
  icon: JSX.Element;
}

// Workflow task interface
interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  assignee: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  deadline: string;
  dependencies: string[];
  status: 'pending' | 'in-progress' | 'completed';
}

// Dummy data for solutions
const solutionTemplates: SolutionTemplate[] = [
  {
    id: "aws-security",
    title: "AWS Security Framework",
    description: "Comprehensive security architecture for AWS cloud environments with IAM, VPC, and KMS integration",
    category: "Cloud Security",
    tags: ["AWS", "IAM", "VPC", "KMS"],
    popularity: 95,
    image: "/templates/aws-security.jpg",
    icon: <Cloud className="h-8 w-8 text-blue-600" />
  },
  {
    id: "azure-compliance",
    title: "Azure Compliance Pack",
    description: "Pre-configured compliance templates for Azure deployments meeting GDPR, HIPAA, and PCI requirements",
    category: "Compliance",
    tags: ["Azure", "GDPR", "HIPAA", "PCI"],
    popularity: 87,
    image: "/templates/azure-compliance.jpg",
    icon: <Shield className="h-8 w-8 text-blue-500" />
  },
  {
    id: "gcp-security",
    title: "GCP Security Suite",
    description: "Secure your Google Cloud Platform infrastructure with layered security controls and monitoring",
    category: "Cloud Security",
    tags: ["GCP", "Cloud Security", "IAM"],
    popularity: 82,
    image: "/templates/gcp-security.jpg",
    icon: <Lock className="h-8 w-8 text-green-600" />
  },
  {
    id: "kubernetes-security",
    title: "Kubernetes Security Mesh",
    description: "Zero-trust security model for container orchestration with policy enforcement",
    category: "Container Security",
    tags: ["Kubernetes", "Containers", "Zero Trust"],
    popularity: 89,
    image: "/templates/k8s-security.jpg",
    icon: <Server className="h-8 w-8 text-blue-700" />
  },
  {
    id: "database-encryption",
    title: "Database Encryption Framework",
    description: "End-to-end encryption solution for relational and NoSQL databases with key rotation",
    category: "Data Security",
    tags: ["Encryption", "Databases", "Key Management"],
    popularity: 75,
    image: "/templates/db-encryption.jpg",
    icon: <Database className="h-8 w-8 text-purple-600" />
  },
  {
    id: "web-application-firewall",
    title: "Web Application Firewall Bundle",
    description: "Comprehensive WAF configuration with OWASP top 10 protection and bot mitigation",
    category: "Application Security",
    tags: ["WAF", "OWASP", "API Security"],
    popularity: 91,
    image: "/templates/waf-bundle.jpg",
    icon: <Globe className="h-8 w-8 text-orange-500" />
  }
];

// Recommended solutions based on mock AI analysis
const recommendedSolutions = [
  "kubernetes-security",
  "database-encryption",
  "web-application-firewall"
];

// Mock workflow tasks data based on solution ID
const mockWorkflowTasks: Record<string, WorkflowTask[]> = {
  "aws-security": [
    {
      id: "aws-1",
      title: "Set up IAM roles and policies",
      description: "Configure identity and access management roles with least privilege principle",
      assignee: { id: "user1", name: "John Doe", role: "Security Engineer" },
      deadline: "3 days",
      dependencies: [],
      status: 'pending'
    },
    {
      id: "aws-2",
      title: "Configure VPC security groups",
      description: "Set up network access controls for virtual private cloud",
      assignee: { id: "user2", name: "Jane Smith", role: "Network Engineer" },
      deadline: "2 days",
      dependencies: ["aws-1"],
      status: 'pending'
    },
    {
      id: "aws-3",
      title: "Enable CloudTrail audit logging",
      description: "Set up comprehensive API call logging across all AWS services",
      assignee: { id: "user1", name: "John Doe", role: "Security Engineer" },
      deadline: "1 day",
      dependencies: ["aws-1"],
      status: 'pending'
    },
    {
      id: "aws-4",
      title: "Configure KMS encryption keys",
      description: "Set up key management service for data encryption",
      assignee: { id: "user3", name: "Mike Johnson", role: "Security Architect" },
      deadline: "4 days",
      dependencies: ["aws-2"],
      status: 'pending'
    }
  ],
  "azure-compliance": [
    {
      id: "azure-1",
      title: "Configure Azure Policy",
      description: "Set up compliance policies across Azure resources",
      assignee: { id: "user2", name: "Jane Smith", role: "Compliance Specialist" },
      deadline: "2 days",
      dependencies: [],
      status: 'pending'
    },
    {
      id: "azure-2",
      title: "Set up Azure Security Center",
      description: "Enable unified security monitoring and threat protection",
      assignee: { id: "user1", name: "John Doe", role: "Security Engineer" },
      deadline: "3 days",
      dependencies: ["azure-1"],
      status: 'pending'
    }
  ],
  "gcp-security": [
    {
      id: "gcp-1",
      title: "Configure GCP IAM",
      description: "Set up identity and access management for GCP resources",
      assignee: { id: "user1", name: "John Doe", role: "Security Engineer" },
      deadline: "2 days",
      dependencies: [],
      status: 'pending'
    },
    {
      id: "gcp-2",
      title: "Enable Cloud Audit Logs",
      description: "Set up comprehensive audit logging for all GCP services",
      assignee: { id: "user3", name: "Mike Johnson", role: "Security Architect" },
      deadline: "1 day",
      dependencies: ["gcp-1"],
      status: 'pending'
    }
  ],
  "kubernetes-security": [
    {
      id: "k8s-1",
      title: "Set up Pod Security Policies",
      description: "Configure granular controls for pod execution",
      assignee: { id: "user4", name: "Alice Chen", role: "Kubernetes Specialist" },
      deadline: "3 days",
      dependencies: [],
      status: 'pending'
    },
    {
      id: "k8s-2",
      title: "Implement Network Policies",
      description: "Configure network access controls between pods",
      assignee: { id: "user2", name: "Jane Smith", role: "Network Engineer" },
      deadline: "2 days",
      dependencies: ["k8s-1"],
      status: 'pending'
    },
    {
      id: "k8s-3",
      title: "Set up Secret Management",
      description: "Configure secure storage and access for sensitive data",
      assignee: { id: "user1", name: "John Doe", role: "Security Engineer" },
      deadline: "4 days",
      dependencies: ["k8s-1"],
      status: 'pending'
    }
  ],
  "database-encryption": [
    {
      id: "db-1",
      title: "Generate encryption keys",
      description: "Create and securely store encryption keys",
      assignee: { id: "user3", name: "Mike Johnson", role: "Security Architect" },
      deadline: "1 day",
      dependencies: [],
      status: 'pending'
    },
    {
      id: "db-2",
      title: "Configure column-level encryption",
      description: "Set up encryption for sensitive data columns",
      assignee: { id: "user5", name: "Sarah Lee", role: "Database Administrator" },
      deadline: "3 days",
      dependencies: ["db-1"],
      status: 'pending'
    },
    {
      id: "db-3",
      title: "Implement key rotation policy",
      description: "Configure automated key rotation procedures",
      assignee: { id: "user3", name: "Mike Johnson", role: "Security Architect" },
      deadline: "2 days",
      dependencies: ["db-2"],
      status: 'pending'
    }
  ],
  "web-application-firewall": [
    {
      id: "waf-1",
      title: "Deploy WAF rules",
      description: "Configure rules to protect against OWASP Top 10 vulnerabilities",
      assignee: { id: "user1", name: "John Doe", role: "Security Engineer" },
      deadline: "2 days",
      dependencies: [],
      status: 'pending'
    },
    {
      id: "waf-2",
      title: "Set up API protection",
      description: "Configure API-specific security rules",
      assignee: { id: "user6", name: "Rob Williams", role: "API Security Specialist" },
      deadline: "3 days",
      dependencies: ["waf-1"],
      status: 'pending'
    },
    {
      id: "waf-3",
      title: "Configure rate limiting",
      description: "Set up protection against brute force and DoS attacks",
      assignee: { id: "user2", name: "Jane Smith", role: "Network Engineer" },
      deadline: "1 day",
      dependencies: ["waf-1"],
      status: 'pending'
    },
    {
      id: "waf-4",
      title: "Implement bot detection",
      description: "Configure rules to identify and block malicious bots",
      assignee: { id: "user1", name: "John Doe", role: "Security Engineer" },
      deadline: "4 days",
      dependencies: ["waf-2", "waf-3"],
      status: 'pending'
    }
  ]
};

// Add a consistent button style variable - similar to ProjectContent.tsx
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
  border-blue-200
  text-blue-700
`;

// Define the available assignees
const assigneeOptions = [
  { id: "user1", name: "John Doe", role: "Security Engineer" },
  { id: "user2", name: "Jane Smith", role: "Network Engineer" },
  { id: "user3", name: "Mike Johnson", role: "Security Architect" },
  { id: "user4", name: "Alice Chen", role: "Kubernetes Specialist" },
  { id: "user5", name: "Sarah Lee", role: "Database Administrator" },
  { id: "user6", name: "Rob Williams", role: "API Security Specialist" }
];

// Calendar custom styles
const calendarStyles = {
  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
  day_selected: "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-700 hover:text-white focus:bg-gradient-to-r focus:from-blue-600 focus:to-purple-700 focus:text-white",
  day_today: "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700",
  day_range_middle: "aria-selected:bg-gradient-to-r aria-selected:from-blue-400/80 aria-selected:to-purple-400/80 aria-selected:text-white",
  day_hidden: "invisible",
  caption: "flex justify-center pt-1 relative items-center",
  caption_label: "text-sm font-medium text-blue-800",
  nav: "flex items-center gap-1",
  nav_button: "border border-blue-100 bg-gradient-to-r from-blue-50/80 to-purple-50/80 hover:from-blue-100 hover:to-purple-100 text-blue-600 hover:text-blue-700 rounded-md p-1 opacity-90 hover:opacity-100",
  table: "w-full border-collapse space-y-1",
  head_row: "flex",
  head_cell: "text-blue-600 rounded-md w-9 font-normal text-[0.8rem]",
  row: "flex w-full mt-2",
  cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-gradient-to-r [&:has([aria-selected])]:from-blue-100/50 [&:has([aria-selected])]:to-purple-100/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
  footer: "mt-2 pt-2 border-t border-blue-100",
  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
};

const SolutionsHub = () => {
  const location = useLocation();
  const projectId = location.state?.projectId;
  const [project, setProject] = useState<Project | null>(null);
  const { allProjects } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredSolution, setHoveredSolution] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Workflow sidebar state
  const [isWorkflowSidebarOpen, setIsWorkflowSidebarOpen] = useState(false);
  const [activeSolution, setActiveSolution] = useState<string | null>(null);
  const [workflowTasks, setWorkflowTasks] = useState<WorkflowTask[]>([]);
  const [selectedOrchestrator, setSelectedOrchestrator] = useState("jira");
  const [orchestratorOpen, setOrchestratorOpen] = useState(false);
  
  // Task edit states
  const [taskAssignees, setTaskAssignees] = useState<Record<string, string>>({});
  const [taskDeadlines, setTaskDeadlines] = useState<Record<string, string>>({});
  
  // Popover states for different elements
  const [assigneePopovers, setAssigneePopovers] = useState<Record<string, boolean>>({});
  const [deadlinePopovers, setDeadlinePopovers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (projectId && allProjects) {
      const foundProject = allProjects.find(p => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
      }
    }
  }, [projectId, allProjects]);

  // Handle launching workflow
  const handleLaunchWorkflow = (solutionId: string) => {
    setActiveSolution(solutionId);
    const tasks = mockWorkflowTasks[solutionId] || [];
    setWorkflowTasks(tasks);
    
    // Initialize assignees and deadlines state
    const assignees: Record<string, string> = {};
    const deadlines: Record<string, string> = {};
    
    tasks.forEach(task => {
      assignees[task.id] = task.assignee.id;
      deadlines[task.id] = task.deadline;
    });
    
    setTaskAssignees(assignees);
    setTaskDeadlines(deadlines);
    setIsWorkflowSidebarOpen(true);
  };
  
  // Handle orchestrator change
  const handleOrchestratorChange = (value: string) => {
    setSelectedOrchestrator(value);
    setOrchestratorOpen(false);
  };
  
  // Handle assignee change
  const handleAssigneeChange = (taskId: string, assigneeId: string) => {
    setTaskAssignees(prev => ({
      ...prev,
      [taskId]: assigneeId
    }));
    // Auto-close the popover
    handleAssigneePopoverChange(taskId, false);
  };
  
  // Handle deadline change
  const handleDeadlineChange = (taskId: string, deadline: string) => {
    setTaskDeadlines(prev => ({
      ...prev,
      [taskId]: deadline
    }));
    // Auto-close the popover
    handleDeadlinePopoverChange(taskId, false);
  };

  // Handle Assignee Popover state
  const handleAssigneePopoverChange = (taskId: string, isOpen: boolean) => {
    setAssigneePopovers(prev => ({
      ...prev,
      [taskId]: isOpen
    }));
  };

  // Handle Deadline Popover state
  const handleDeadlinePopoverChange = (taskId: string, isOpen: boolean) => {
    setDeadlinePopovers(prev => ({
      ...prev,
      [taskId]: isOpen
    }));
  };

  // Filter solutions based on search term and category
  const filteredSolutions = solutionTemplates.filter((solution) => {
    const matchesSearch = solution.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         solution.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         solution.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || solution.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(solutionTemplates.map(s => s.category)));

  // Get active solution details
  const activeSolutionDetails = activeSolution ? 
    solutionTemplates.find(s => s.id === activeSolution) : null;

  // Function to parse deadline string to date
  const parseDeadlineToDate = (deadline: string): Date => {
    const today = new Date();
    
    // If deadline is in format "X days", convert to actual date
    if (deadline.includes('day')) {
      const days = parseInt(deadline.split(' ')[0], 10);
      const result = new Date(today);
      result.setDate(today.getDate() + days);
      return result;
    }
    
    // For any other format, try to parse or return today
    return new Date(deadline) || today;
  };
  
  // Function to convert date to deadline string
  const formatDateToDeadline = (date: Date): string => {
    const today = new Date();
    const diffTime = Math.abs(date.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Always return the formatted date
    return format(date, 'MMM d, yyyy');
  };

  return (
    <Layout>
      <div className="space-y-6 mt-16 font-['Geneva','Segoe UI',sans-serif]">
        {/* Header Card similar to WelcomeCard */}
        <Card className="col-span-full bg-gradient-to-r from-blue-500/20 via-teal-500/20 to-emerald-500/20 border-none overflow-hidden animate-fade-in shadow-sm hover:shadow-md transition-all duration-300 relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 opacity-75">
              <img 
                src="/keys_image.png" 
                alt="Security Keys" 
                className="h-40 w-auto object-contain"
              />
            </div>
            
            {/* Subtle solution icons with animation */}
            <div className="absolute inset-0 flex justify-center items-center pointer-events-none overflow-hidden">
              <div className="flex translate-x-60">
                <motion.div 
                  className="mx-8" 
                  animate={{ 
                    y: [0, -2, 0]
                  }} 
                  transition={{ 
                    duration: 20, 
                    repeat: Infinity, 
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                >
                  <Shield className="h-14 w-14 text-blue-500/20" />
                </motion.div>
                
                <motion.div 
                  className="mx-14" 
                  animate={{ 
                    y: [0, -1.5, 0]
                  }} 
                  transition={{ 
                    duration: 25, 
                    repeat: Infinity, 
                    repeatType: "reverse",
                    delay: 1.5,
                    ease: "easeInOut"
                  }}
                >
                  <Database className="h-12 w-12 text-teal-500/20" />
                </motion.div>
                
                <motion.div 
                  className="mx-10" 
                  animate={{ 
                    y: [0, -1, 0]
                  }} 
                  transition={{ 
                    duration: 18, 
                    repeat: Infinity, 
                    repeatType: "reverse",
                    delay: 0.8,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="h-10 w-10 text-emerald-500/20" />
                </motion.div>
              </div>
            </div>
            
            <div className="absolute right-0 top-1/2 transform -translate-y-1/4 opacity-10">
              {/* Placeholder for the mascot image */}
            </div>
          </div>
          
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-2 rounded-lg mr-3 shadow-inner">
                <Puzzle className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center">
                <h3 className="text-3xl font-semibold font-['Geneva','Segoe UI',sans-serif] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-600">
                  Solutions Hub
                </h3>
                <div className="h-10 flex items-center">
                  <img 
                    src="/indrabot-mascot.png" 
                    alt="Indrasol Mascot" 
                    className="h-20 w-auto object-contain opacity-35 ml-2 -my-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-sm text-gray-600 mt-3 font-medium max-w-3xl">
              Browse our library of pre-configured security solutions and templates for common use cases.
            </p>
          </CardContent>
        </Card>

        {/* Search and Filter Bar - Updated to match ProjectContent styling */}
        <div className="bg-transparent p-6 font-['Geneva','Segoe UI',sans-serif]">
          <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
            {/* Updated Search Bar with ProjectContent styling */}
            <div className={`relative flex-1 transition-all duration-300 ease-in-out ${isSearchFocused ? 'md:flex-grow-[1.2]' : ''}`}>
              <div className={`bg-gradient-to-r from-blue-50/70 to-purple-50/70 border border-blue-100 hover:border-blue-200 rounded-xl transition-all duration-300 shadow-sm ${isSearchFocused ? 'shadow-md border-blue-200' : 'hover:shadow-md'} flex items-center overflow-hidden`}>
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-all duration-300 ${isSearchFocused ? 'text-blue-600 left-3 scale-110' : 'text-blue-500'}`} />
                <Input 
                  placeholder="Search solutions..." 
                  className={`pl-12 py-6 w-full border-0 ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-light text-base placeholder:text-gray-400 bg-transparent transition-all duration-300 ${isSearchFocused ? 'pl-10' : ''}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                {searchTerm && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                    onClick={() => setSearchTerm("")}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 self-start md:self-auto min-w-[250px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {/* Updated filter buttons with ProjectContent styling */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "text-xs rounded-full px-4",
                    filterButtonStyles, 
                    selectedCategory === null ? activeButtonStyles : ""
                  )}
                >
                  All
                </Button>
                {categories.map(category => (
                  <Button 
                    key={category}
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "text-xs rounded-full px-4",
                      filterButtonStyles,
                      selectedCategory === category ? activeButtonStyles : ""
                    )}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Recommendations Section */}
          <div className="mb-12">
            <div className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-6 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg mr-3 shadow-inner">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold font-['Geneva','Segoe UI',sans-serif] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    AI-Powered Recommendations
                  </h3>
                </div>
                <div className="ml-0 sm:ml-2 bg-gradient-to-r from-blue-600/90 to-blue-400/90 text-white text-xs px-3 py-1 rounded-full flex items-center self-start sm:self-auto">
                  <Zap className="h-3 w-3 mr-1" />
                  <span className="font-medium">Personalized</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3 font-medium max-w-3xl">
                Based on your project requirements and previous activities, our AI suggests these security solutions:
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {solutionTemplates
                .filter(solution => recommendedSolutions.includes(solution.id))
                .map((solution, index) => (
                  <motion.div
                    key={solution.id}
                    className="relative group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ 
                      scale: 1.02,
                      y: -5
                    }}
                  >
                    {/* Glowing background effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-500 rounded-xl opacity-0 group-hover:opacity-70 blur-lg transition-all duration-300 -z-10"></div>
                    
                    {/* Star badge */}
                    <motion.div 
                      className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-1 rounded-full z-10 shadow-lg"
                      animate={{ rotate: [0, 10, 0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Star className="h-3.5 w-3.5 text-white" fill="white" />
                    </motion.div>
                    
                    {/* AI recommendation indicator */}
                    <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-xs font-medium py-0.5 px-2 rounded-full z-10 flex items-center gap-1 backdrop-blur-sm">
                      <Bot className="h-2.5 w-2.5" />
                      <span>AI Recommended</span>
                    </div>
                    
                    {/* Main card */}
                    <div className="bg-white backdrop-blur-xl border-0 rounded-xl overflow-hidden shadow-md h-full flex flex-col relative">
                      {/* Card top background gradient */}
                      <div className="h-20 bg-gradient-to-r from-indigo-500/90 via-purple-500/90 to-pink-500/90 relative flex items-center justify-center">
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute inset-0 bg-grid-pattern"></div>
                        </div>
                        <div className="relative z-10 flex items-center justify-center p-4">
                          {React.cloneElement(solution.icon as React.ReactElement, { className: "h-10 w-10 text-white" })}
                        </div>
                      </div>
                      
                      {/* Card content */}
                      <div className="p-4 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-base tracking-tight">{solution.title}</h4>
                          <div className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                            {solution.category}
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{solution.description}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {solution.tags.map(tag => (
                            <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Card footer */}
                      <div className="p-3 border-t border-gray-100">
                        <div className="flex gap-2">
                          <Button className="flex-1 gap-1 bg-securetrack-purple/10 text-securetrack-purple hover:bg-securetrack-purple/20 border border-securetrack-purple/30 hover:border-securetrack-purple/50 transition-all duration-200 font-medium text-sm py-1">
                            Preview <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            className="flex-1 gap-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-400/30 hover:border-blue-500/50 transition-all duration-200 font-medium text-sm py-1"
                            onClick={() => handleLaunchWorkflow(solution.id)}
                          >
                            Launch <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>

          {/* Interactive Solutions Gallery */}
          <div className="mt-14">
            <div className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-6 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg mr-3 shadow-inner">
                    <Puzzle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold font-['Geneva','Segoe UI',sans-serif] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Solutions Gallery
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3 font-medium max-w-3xl">
                Explore our comprehensive collection of security solutions designed for various cloud platforms and use cases.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSolutions.map((solution) => (
                <motion.div
                  key={solution.id}
                  className="relative perspective-1000"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ 
                    z: 10,
                    transition: { duration: 0.2 }
                  }}
                  onHoverStart={() => setHoveredSolution(solution.id)}
                  onHoverEnd={() => setHoveredSolution(null)}
                >
                  <div 
                    className={`
                      bg-white rounded-xl overflow-hidden border transform transition-all duration-300
                      ${hoveredSolution === solution.id ? 'shadow-xl rotate-y-10 scale-105 border-securetrack-purple' : 'shadow-md'}
                    `}
                  >
                    {/* Simulated 3D Preview - Would be replaced with actual 3D/WebGL in production */}
                    <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600 overflow-hidden flex items-center justify-center">
                      <div className={`
                        absolute inset-0 transition-transform duration-500 ease-out 
                        ${hoveredSolution === solution.id ? 'scale-110' : 'scale-100'}
                      `}>
                        <div className="absolute inset-0 bg-black/20"></div>
                        {/* Placeholder 3D graphics - would be replaced with WebGL/Three.js */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`
                            text-white p-5 transform transition-all duration-500
                            ${hoveredSolution === solution.id ? 'scale-110 rotate-3' : 'scale-100'}
                          `}>
                            {solution.icon}
                          </div>
                        </div>
                        
                        {/* Animated elements to simulate 3D movement */}
                        <div 
                          className={`
                            absolute grid grid-cols-4 grid-rows-4 gap-2 w-full h-full p-3
                            transition-transform duration-300
                            ${hoveredSolution === solution.id ? 'scale-110' : 'scale-100'}
                          `}
                        >
                          {[...Array(16)].map((_, i) => (
                            <div 
                              key={i} 
                              className="opacity-30 bg-white/10 rounded-sm"
                              style={{
                                transform: hoveredSolution === solution.id ? 
                                  `translateZ(${Math.random() * 20}px) rotate(${Math.random() * 10 - 5}deg)` : 
                                  'none',
                                transition: `transform ${0.2 + Math.random() * 0.3}s ease-out`
                              }}
                            ></div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="relative z-10 text-white text-xl font-bold">
                        {solution.title}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{solution.title}</h3>
                        <div className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                          {solution.category}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{solution.description}</p>
                      
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {solution.tags.map(tag => (
                          <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1">
                          <div className="bg-blue-100 rounded-full h-2 w-32 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full" 
                              style={{ width: `${solution.popularity}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{solution.popularity}% match</span>
                        </div>
                        <div className="flex gap-2">
                          <Button className="gap-1 bg-securetrack-purple/10 text-securetrack-purple hover:bg-securetrack-purple/20 border border-securetrack-purple/30 hover:border-securetrack-purple/50 transition-all duration-200 font-medium text-sm py-1 px-3">
                            Preview
                          </Button>
                          <Button 
                            className="gap-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-400/30 hover:border-blue-500/50 transition-all duration-200 font-medium text-sm py-1 px-3"
                            onClick={() => handleLaunchWorkflow(solution.id)}
                          >
                            Launch
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Sidebar */}
      <AnimatePresence>
        {isWorkflowSidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setIsWorkflowSidebarOpen(false)}
            />
            
            {/* Sidebar */}
            <motion.div 
              className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-2/5 max-w-3xl bg-white shadow-xl z-50 overflow-hidden flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Sidebar Header */}
              <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    {activeSolutionDetails?.icon && (
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2.5 rounded-lg">
                        {React.cloneElement(activeSolutionDetails.icon as React.ReactElement, { className: "h-5 w-5 text-white" })}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-medium text-gray-800">
                        {activeSolutionDetails?.title}
                      </h2>
                      <p className="text-sm text-gray-500">Workflow Configuration</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsWorkflowSidebarOpen(false)}
                    className="rounded-full hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </Button>
                </div>
                
                {/* Progress Bar */}
                <div className="px-5 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">Workflow Progress</span>
                    <span className="text-xs font-medium text-blue-600">0%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                </div>
              </div>
              
              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto px-4 pb-20">
                {/* Introduction */}
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-indigo-100/50 rounded-lg p-4 my-4">
                  <h3 className="font-medium text-indigo-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Getting Started</span>
                  </h3>
                  <p className="text-sm text-indigo-700/80">
                    This workflow contains {workflowTasks.length} tasks to complete the implementation of{' '}
                    <span className="font-medium">{activeSolutionDetails?.title}</span>. Review and assign tasks, then launch the workflow.
                  </p>
                </div>
                
                {/* Orchestrator Section */}
                <div className="mt-6 mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-100 p-1.5 rounded">
                      <GitBranchPlus className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-gray-800">Tracker&nbsp;: </h3>
                    <Popover open={orchestratorOpen} onOpenChange={setOrchestratorOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          role="combobox" 
                          className="h-7 w-auto justify-between px-3 rounded-md bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-blue-200 hover:from-blue-100/80 hover:to-purple-100/80 hover:border-blue-300 text-left transition-all duration-200 -ml-1"
                        >
                          <div className="flex items-center gap-2">
                            {selectedOrchestrator === "jira" ? (
                              <>
                                <div className="w-5 h-5 rounded-sm bg-blue-600 flex items-center justify-center">
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="white" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005Z"/>
                                    <path d="M16.807 6.299h-2.13V4.243A5.215 5.215 0 0 0 9.46 0v11.478a1.005 1.005 0 0 0 1.004 1.005h11.572A5.218 5.218 0 0 0 16.807 6.3Z" fill="#2684FF"/>
                                  </svg>
                                </div>
                                <span className="font-medium text-sm text-blue-700">Jira</span>
                              </>
                            ) : (
                              <>
                                <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                                  <svg viewBox="0 0 16 16" width="12" height="12" fill="white" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                                  </svg>
                                </div>
                                <span className="font-medium text-sm text-gray-700">GitHub</span>
                              </>
                            )}
                          </div>
                          <ChevronDown className="h-3.5 w-3.5 text-blue-500 shrink-0 opacity-70 ml-2" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0 border-blue-200 shadow-md">
                        <Command className="rounded-lg border-0 overflow-hidden bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                          <CommandList className="py-2">
                            <CommandGroup>
                              <CommandItem
                                value="jira"
                                onSelect={() => handleOrchestratorChange("jira")}
                                className="text-sm flex items-center gap-2 py-2 px-3 mx-1 rounded-md data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-blue-100/40 data-[selected=true]:to-purple-100/40 data-[selected=true]:text-blue-700 group transition-all duration-200 cursor-pointer hover:cursor-pointer"
                              >
                                <div className="w-5 h-5 rounded-sm bg-blue-600 flex items-center justify-center">
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="white" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005Z"/>
                                    <path d="M16.807 6.299h-2.13V4.243A5.215 5.215 0 0 0 9.46 0v11.478a1.005 1.005 0 0 0 1.004 1.005h11.572A5.218 5.218 0 0 0 16.807 6.3Z" fill="#2684FF"/>
                                  </svg>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium leading-none text-blue-800 group-hover:text-blue-900 transition-colors duration-200">Jira</span>
                                  <span className="text-[10px] text-blue-600/80 group-hover:text-blue-700/90 transition-colors duration-200">Atlassian issue tracking</span>
                                </div>
                                {selectedOrchestrator === "jira" && (
                                  <Check className="h-4 w-4 text-blue-600 ml-auto" />
                                )}
                              </CommandItem>
                              <CommandItem
                                value="github"
                                onSelect={() => handleOrchestratorChange("github")}
                                className="text-sm flex items-center gap-2 py-2 px-3 mx-1 rounded-md data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-blue-100/40 data-[selected=true]:to-purple-100/40 data-[selected=true]:text-blue-700 group transition-all duration-200 cursor-pointer hover:cursor-pointer"
                              >
                                <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                                  <svg viewBox="0 0 16 16" width="12" height="12" fill="white" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                                  </svg>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium leading-none text-gray-800 group-hover:text-gray-900 transition-colors duration-200">GitHub</span>
                                  <span className="text-[10px] text-gray-600/80 group-hover:text-gray-700/90 transition-colors duration-200">Project board & issues</span>
                                </div>
                                {selectedOrchestrator === "github" && (
                                  <Check className="h-4 w-4 text-blue-600 ml-auto" />
                                )}
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="px-3">
                    <div className="mt-4 text-xs text-blue-600 px-4 py-3 bg-blue-50/50 rounded-md border border-blue-100/80">
                      <p className="flex items-center gap-1.5">
                        <Workflow className="h-3.5 w-3.5 text-blue-500" />
                        <span>Tasks will be synchronized with {selectedOrchestrator === "jira" ? "Jira issues" : "GitHub issues"} for tracking</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Tasks Section */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-100 p-1.5 rounded">
                      <Puzzle className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-gray-800">Workflow Tasks</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {workflowTasks.map((task) => {
                      // Find dependent tasks
                      const dependencyTasks = task.dependencies.map(depId => 
                        workflowTasks.find(t => t.id === depId)?.title
                      ).filter(Boolean);
                      
                      // Get current assignee from state or task default
                      const currentAssigneeId = taskAssignees[task.id] || task.assignee.id;
                      const currentAssignee = assigneeOptions.find(a => a.id === currentAssigneeId) || task.assignee;
                      
                      // Get current deadline from state or task default
                      const currentDeadline = taskDeadlines[task.id] || task.deadline;
                      
                      return (
                        <div key={task.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-all duration-200 bg-white">
                          <div className="flex items-start p-4">
                            <Checkbox id={task.id} className="mt-1 h-4 w-4 text-blue-600 rounded-sm" />
                            <div className="ml-3 flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <label htmlFor={task.id} className="font-medium text-gray-800 cursor-pointer">{task.title}</label>
                                
                                {/* Deadline Popover */}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 bg-gradient-to-r from-blue-50/80 to-purple-50/80 text-blue-700 border-blue-200 text-xs flex items-center gap-1 hover:from-blue-100/80 hover:to-purple-100/80 hover:border-blue-300">
                                      <Clock className="h-3 w-3" />
                                      <span>{currentDeadline}</span>
                                      <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="end">
                                    <CalendarComponent
                                      mode="single"
                                      selected={parseDeadlineToDate(currentDeadline)}
                                      onSelect={(date) => {
                                        if (date) {
                                          handleDeadlineChange(task.id, formatDateToDeadline(date));
                                        }
                                      }}
                                      initialFocus
                                      className="rounded-md border-0"
                                      classNames={calendarStyles}
                                    />
                                    <div className="p-3 border-t border-blue-100 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                                      <Button 
                                        className="w-full text-xs h-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                        onClick={() => {
                                          const today = new Date();
                                          handleDeadlineChange(task.id, formatDateToDeadline(today));
                                        }}
                                      >
                                        Set to Today
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                              
                              {/* Assignee Dropdown */}
                              <div className="flex items-start mt-3 gap-2">
                                <span className="text-xs text-black mt-1 font-medium">Assignee:</span>
                                <div className="flex-1">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        role="combobox" 
                                        className="h-8 w-auto justify-between px-3 rounded-md bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-blue-200 hover:from-blue-100/80 hover:to-purple-100/80 hover:border-blue-300 text-left transition-all duration-200"
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <Avatar className="h-5 w-5">
                                            <AvatarFallback className="text-[10px] bg-gradient-to-r from-blue-200 to-purple-200 text-blue-700">
                                              {currentAssignee.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-xs font-medium text-blue-700">{currentAssignee.name}</span>
                                          <Badge variant="outline" className="h-5 text-[10px] px-1.5 bg-blue-100/50 text-blue-600 border-blue-200">
                                            {currentAssignee.role}
                                          </Badge>
                                        </div>
                                        <ChevronDown className="h-3.5 w-3.5 text-blue-500 shrink-0 opacity-70 ml-2" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0 border-blue-200 shadow-md">
                                      <Command className="rounded-lg border-0 overflow-hidden bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                                        <div className="bg-gradient-to-r from-blue-100/60 to-purple-100/60 px-2 py-2 border-b border-blue-100/80">
                                          <div className="relative">
                                            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-blue-400" />
                                            <CommandInput 
                                              placeholder="Search assignee..." 
                                              className="h-8 text-sm bg-white/80 backdrop-blur-sm rounded-md text-blue-700 placeholder:text-blue-400/80 border-blue-200/80 pl-8 transition-all duration-300 w-[97%] focus:w-full focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-300/50" 
                                            />
                                          </div>
                                        </div>
                                        <CommandList className="max-h-[200px] overflow-y-auto py-2">
                                          <CommandEmpty className="py-3 text-sm text-center text-blue-500/80 italic">
                                            No assignee found...
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {assigneeOptions.map((assignee) => (
                                              <CommandItem
                                                key={assignee.id}
                                                value={assignee.name}
                                                onSelect={() => {
                                                  handleAssigneeChange(task.id, assignee.id);
                                                }}
                                                className="text-sm flex items-center gap-2 py-2 px-2 mx-1 rounded-md data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-blue-100/40 data-[selected=true]:to-purple-100/40 data-[selected=true]:text-blue-700 group transition-all duration-200 cursor-pointer hover:cursor-pointer"
                                              >
                                                <Avatar className="h-6 w-6 transition-transform duration-300 group-hover:scale-105">
                                                  <AvatarFallback className="text-[10px] bg-gradient-to-r from-blue-200/80 to-purple-200/80 text-blue-700">
                                                    {assignee.name.split(' ').map(n => n[0]).join('')}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                  <span className="font-medium leading-none text-blue-800 group-hover:text-blue-900 transition-colors duration-200">{assignee.name}</span>
                                                  <span className="text-[10px] text-blue-600/80 group-hover:text-blue-700/90 transition-colors duration-200">{assignee.role}</span>
                                                </div>
                                                {currentAssigneeId === assignee.id ? (
                                                  <Check className="h-4 w-4 text-blue-600 ml-auto" />
                                                ) : (
                                                  <div className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-70 transition-opacity duration-200">
                                                    <Check className="h-4 w-4 text-blue-500/60" />
                                                  </div>
                                                )}
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                              
                              {/* Dependencies */}
                              {dependencyTasks.length > 0 && (
                                <div className="mt-3">
                                  <span className="text-xs text-black block mb-1 font-medium">Dependencies:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {dependencyTasks.map((depTask, index) => (
                                      <Badge key={index} variant="outline" className="bg-gradient-to-r from-blue-50/70 to-purple-50/70 text-blue-700 border-blue-200 text-xs">
                                        <ArrowRight className="h-2.5 w-2.5 mr-1 text-blue-500" /> {depTask}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="border-t border-gray-100 p-4 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    className="border-gray-200 text-gray-600 hover:text-gray-800"
                    onClick={() => setIsWorkflowSidebarOpen(false)}
                  >
                    Cancel
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white transition-all duration-200"
                    >
                      Launch Workflow
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default SolutionsHub; 