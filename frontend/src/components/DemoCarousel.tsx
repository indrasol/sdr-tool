import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";
import { Briefcase, ShieldCheck, Users, Clock } from "lucide-react";
import type { Project } from "@/interfaces/projectInterfaces";
import { getBorderColor, getStatusColor } from "@/components/Projects/utils/projectStyleUtils";
import { Badge } from "@/components/ui/badge";

// --- Component-based Preview Content ---------------------------------
// Recreate Dashboard and Projects previews using existing components

const DashboardPreview: React.FC = () => (
  <div className="p-4 grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
    <StatCard title="Projects" value={12} icon={<Briefcase size={16} />} description="Total Projects" />
    <StatCard title="Analyses" value={42} icon={<ShieldCheck size={16} />} description="Completed" />
    <StatCard title="Team" value={8} icon={<Users size={16} />} description="Members" />
    <StatCard title="Deadline" value="5d" icon={<Clock size={16} />} description="Next audit" />
  </div>
);

const sampleProjects: Project[] = [
  {
    id: "P-101",
    name: "E-Commerce App",
    description: "Secure online store platform",
    status: "IN_PROGRESS",
    priority: "HIGH",
    createdDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 1209600000).toISOString(),
    creator: "demo",
    tenantId: 1,
    templateType: "AI Assisted",
  },
  {
    id: "P-102",
    name: "Banking API",
    description: "Open banking compliance service",
    status: "COMPLETED",
    priority: "CRITICAL",
    createdDate: new Date().toISOString(),
    dueDate: new Date().toISOString(),
    creator: "demo",
    tenantId: 1,
    templateType: "Import Existing",
  },
  {
    id: "P-103",
    name: "IoT Platform",
    description: "Device management backend",
    status: "NOT_STARTED",
    priority: "MEDIUM",
    createdDate: new Date().toISOString(),
    creator: "demo",
    tenantId: 1,
    templateType: "From Template",
  },
  {
    id: "P-104",
    name: "Chat Analytics",
    description: "Real-time chat insights",
    status: "IN_PROGRESS",
    priority: "LOW",
    createdDate: new Date().toISOString(),
    creator: "demo",
    tenantId: 1,
    templateType: "AI Assisted",
  },
];

const MiniProjectCard: React.FC<{ proj: Project }> = ({ proj }) => {
  const statusCls = getStatusColor(proj.status as any);

  // Map status to a vivid border color
  const getStatusBorder = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
      case 'NOT STARTED':
        return '#94a3b8'; // slate-400
      case 'PLANNED':
        return '#fbbf24'; // amber-400
      case 'IN_PROGRESS':
      case 'IN PROGRESS':
        return '#60a5fa'; // blue-400
      case 'COMPLETED':
        return '#4ade80'; // green-400
      case 'ON_HOLD':
      case 'ON HOLD':
        return '#f87171'; // red-400
      default:
        return '#d1d5db'; // gray-300
    }
  };
  const borderColor = getStatusBorder(proj.status);

  // Derive light background color based on status
  const getStatusBg = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
      case 'NOT STARTED':
        return 'bg-slate-50';
      case 'PLANNED':
        return 'bg-amber-50';
      case 'IN_PROGRESS':
      case 'IN PROGRESS':
        return 'bg-blue-50';
      case 'COMPLETED':
        return 'bg-green-50';
      case 'ON_HOLD':
      case 'ON HOLD':
        return 'bg-red-50';
      default:
        return 'bg-white';
    }
  };

  return (
    <div
      className="flex flex-col rounded-lg border shadow hover:shadow-md transition-all duration-300 cursor-pointer bg-white h-32 p-3"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      {/* status color bar */}
      <div className={`${statusCls.split(' ')[0]} h-1 w-full -mt-3 -mx-3 rounded-t-lg`} />
      <div className="text-[11px] font-semibold text-gray-800 truncate mt-1">{proj.name}</div>
      <div className="flex flex-wrap gap-1 mt-1 mb-auto">
        <Badge variant="outline" className={`px-1 py-0 ${statusCls} font-normal text-[9px]`}>{proj.status.replace('_',' ')}</Badge>
        {proj.templateType && (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 font-normal text-[9px]">{proj.templateType}</Badge>
        )}
      </div>
      <div className="mt-auto flex flex-wrap gap-1">
        <Badge variant="outline" className="text-[9px] font-normal bg-gray-100 text-gray-700 border-gray-300">{proj.creator}</Badge>
        <Badge variant="outline" className="text-[9px] font-normal bg-gray-100 text-gray-700 border-gray-300">{new Date(proj.createdDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</Badge>
        <Badge variant="outline" className="text-[9px] font-normal bg-emerald-100 text-emerald-700 border-emerald-200">Demo</Badge>
      </div>
    </div>
  );
};

const ProjectsPreview: React.FC = () => (
  <div className="p-4 grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
    {sampleProjects.map((proj) => (
      <MiniProjectCard key={proj.id} proj={proj} />
    ))}
  </div>
);

const NodePlaceholder: React.FC<{ x: number; y: number; label: string }> = ({ x, y, label }) => (
  <motion.div
    className="absolute w-28 h-16 rounded-md bg-white border border-blue-300 shadow-sm flex items-center justify-center text-[10px] text-gray-700 select-none"
    style={{ top: y, left: x }}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, delay: x * 0.005 + y * 0.005 }}
  >
    {label}
  </motion.div>
);

const Edge: React.FC<{ x1: number; y1: number; x2: number; y2: number }> = ({ x1, y1, x2, y2 }) => (
  <line
    x1={x1 + 56}
    y1={y1 + 16}
    x2={x2 + 56}
    y2={y2 + 16}
    stroke="#3b82f6"
    strokeWidth="1.5"
    markerEnd="url(#arrow)"
  />
);

const ModelPlaceholder: React.FC = () => {
  const nodes = [
    { x: 30, y: 40, label: 'Web App' },
    { x: 190, y: 40, label: 'API Server' },
    { x: 30, y: 120, label: 'Auth Service' },
    { x: 190, y: 120, label: 'Database' },
  ];
  const edges = [
    [0, 1],
    [1, 3],
    [0, 2],
    [2, 3],
  ];
  return (
    <div className="relative w-full h-60 bg-indigo-50 rounded-xl border border-indigo-200 overflow-hidden mx-auto max-w-md">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0 0 L6 3 L0 6 Z" fill="#3b82f6" />
          </marker>
        </defs>
        {edges.map(([s, t], idx) => (
          <Edge key={idx} x1={nodes[s].x} y1={nodes[s].y} x2={nodes[t].x} y2={nodes[t].y} />
        ))}
      </svg>
      {nodes.map((n, idx) => (
        <NodePlaceholder key={idx} x={n.x} y={n.y} label={n.label} />
      ))}
    </div>
  );
};

// --------------------------------------------------------------------

type Slide = { title: string; element: React.ReactNode };

const slides: Slide[] = [
  { title: "Dashboard Overview", element: <DashboardPreview /> },
  { title: "Projects Workspace", element: <ProjectsPreview /> },
  { title: "AI Design Experience", element: <ModelPlaceholder /> },
];

const DemoCarousel: React.FC = () => {
  const [api, setApi] = React.useState<any | null>(null);

  // Autoplay every 4 seconds
  React.useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <motion.div
      className="relative max-w-lg mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <Carousel opts={{ loop: true }} setApi={setApi} className="w-full">
        <CarouselContent>
          {slides.map((slide, idx) => (
            <CarouselItem
              key={idx}
              className="flex items-center justify-center p-4"
            >
              {slide.element}
              <span className="sr-only">{slide.title}</span>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="bg-white/80 backdrop-blur-md hover:bg-white" />
        <CarouselNext className="bg-white/80 backdrop-blur-md hover:bg-white" />
      </Carousel>
    </motion.div>
  );
};

export default DemoCarousel; 