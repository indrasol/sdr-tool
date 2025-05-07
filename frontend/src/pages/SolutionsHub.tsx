import { useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useEffect, useState } from 'react';
import { Project } from '@/interfaces/projectInterfaces';
import { useProjects } from '@/hooks/useProjects';
import { Puzzle, Sparkles, Bot, ChevronRight, Search, Filter, Zap, Lock, Cloud, Shield, Server, Database, Globe, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import React from 'react';
import { cn } from "@/lib/utils";

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

const SolutionsHub = () => {
  const location = useLocation();
  const projectId = location.state?.projectId;
  const [project, setProject] = useState<Project | null>(null);
  const { allProjects } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredSolution, setHoveredSolution] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    if (projectId && allProjects) {
      const foundProject = allProjects.find(p => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
      }
    }
  }, [projectId, allProjects]);

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

  return (
    <Layout>
      <div className="space-y-6 mt-16 font-['Geneva','Segoe UI',sans-serif]">
        {/* Header Card similar to WelcomeCard */}
        <Card className="col-span-full bg-gradient-to-r from-blue-500/20 via-teal-500/20 to-emerald-500/20 border-none overflow-hidden animate-fade-in shadow-sm hover:shadow-md transition-all duration-300 relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2 opacity-75">
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
              <img 
                src="/indrabot-mascot.png" 
                alt="Indrasol Mascot" 
                className="h-20 w-auto object-contain"
              />
            </div>
          </div>
          
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-2 rounded-lg mr-3 shadow-inner">
                <Puzzle className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-3xl font-semibold font-['Geneva','Segoe UI',sans-serif] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-600">
                Solutions Hub
              </h3>
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
                        <Button className="w-full gap-1 bg-securetrack-purple/10 text-securetrack-purple hover:bg-securetrack-purple/20 border border-securetrack-purple/30 hover:border-securetrack-purple/50 transition-all duration-200 font-medium text-sm py-1">
                          Preview <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
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
                    Interactive Solutions Gallery
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
                        <Button className="gap-1 bg-securetrack-purple/10 text-securetrack-purple hover:bg-securetrack-purple/20 border border-securetrack-purple/30 hover:border-securetrack-purple/50 transition-all duration-200 font-medium text-sm py-1 px-3">
                          Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SolutionsHub; 