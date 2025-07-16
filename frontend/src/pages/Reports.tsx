import React, { useState, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { FileText, Filter, FileBarChart2, ArrowUp, ArrowDown, ArrowUpDown, Grid as GridIcon, List as ListIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";

interface Report {
  id: string;
  title: string;
  project: string;
  generatedAt: string; // ISO
  high: number;
  medium: number;
  low: number;
}

const mockReports: Report[] = [
  { id: "r1", title: "Quarterly Security Report", project: "Acme Corp", generatedAt: "2025-03-24T14:12:00Z", high: 3, medium: 5, low: 2 },
  { id: "r2", title: "API Gateway Penetration Test", project: "Acme Corp", generatedAt: "2025-03-18T09:30:00Z", high: 2, medium: 4, low: 1 },
  { id: "r3", title: "GDPR Compliance Checklist", project: "TechStart Inc.", generatedAt: "2025-03-10T11:15:00Z", high: 0, medium: 2, low: 5 },
];

const ReportsPage: React.FC = () => {
  const [projectFilter, setProjectFilter] = useState<string>("All Projects");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(""); // ISO date string (yyyy-mm-dd)
  // Sorting state (three-state: desc → asc → none)
  const [sortField, setSortField] = useState<string>("generatedAt");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | 'none'>("desc");
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  // Fetch all projects to populate the dropdown dynamically
  const { allProjects } = useProjects();
  const projectOptions = useMemo(
    () => [
      "All Projects",
      ...Array.from(new Set(allProjects.map((p) => p.name)))
    ],
    [allProjects]
  );

  // Handle sort field cycling
  const handleSortFieldChange = (field: string) => {
    if (sortField === field) {
      // Cycle desc → asc → none → desc
      if (sortDirection === 'desc') setSortDirection('asc');
      else if (sortDirection === 'asc') setSortDirection('none');
      else setSortDirection('desc');
    } else {
      setSortField(field);
      const isDateField = field === 'generatedAt';
      setSortDirection(isDateField ? 'desc' : 'asc');
    }
  };

  // Helper to render arrows
  const getSortArrows = (field: string) => {
    if (sortField !== field || sortDirection === 'none') return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-blue-600" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1 text-blue-600" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1 text-blue-600" />
    );
  };

  // Unified button style vars (copied from Projects page)
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

  const processedReports = useMemo(() => {
    // Filter first
    const filtered = mockReports.filter(r => {
      const matchesProject = projectFilter === "All Projects" || r.project === projectFilter;
      const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
      const matchesDate = selectedDate ? new Date(r.generatedAt).toISOString().slice(0,10) === selectedDate : true;
      return matchesProject && matchesSearch && matchesDate;
    });

    // Sort next
    const sorted = [...filtered].sort((a, b) => {
      if (sortDirection === 'none') return 0;
      if (sortField === 'title') {
        return sortDirection === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      } else if (sortField === 'project') {
        return sortDirection === 'asc' ? a.project.localeCompare(b.project) : b.project.localeCompare(a.project);
      } else if (sortField === 'generatedAt') {
        return sortDirection === 'asc'
          ? new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime()
          : new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
      }
      return 0;
    });

    return sorted;
  }, [projectFilter, search, sortField, sortDirection]);

  return (
    <Layout>
      <style>{`
        .dropdown-item:hover {
          background: linear-gradient(to right, rgba(219, 234, 254, 0.7), rgba(233, 213, 255, 0.7)) !important;
          color: #1e40af !important;
        }
      `}</style>
      <div className="space-y-8 mt-0 animate-fade-in">
        {/* Header card */}
        <Card className="col-span-full bg-gradient-to-r from-blue-500/15 via-teal-500/15 to-emerald-500/15 border-none overflow-hidden animate-fade-in shadow-sm hover:shadow-md transition-all duration-300 relative">
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-2 rounded-lg mr-3 shadow-inner">
                <FileBarChart2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center">
                <h3 className="text-3xl font-semibold font-['Geneva','Segoe UI',sans-serif] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-600">
                  Reports
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
            {/* Removed filters from header */}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mt-3 font-medium max-w-3xl">Browse, search, and download all generated reports in one place.</p>
          </CardContent>
        </Card>

        {/* Controls bar */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          {/* Left: Search & Project filter */}
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              placeholder="Search reports…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 bg-white w-full sm:w-56 md:w-64 lg:w-72 transition-all duration-300 ease-in-out focus:ring-2 focus:ring-blue-500 focus:shadow-md"
            />
            {/* Date picker */}
            <Input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="h-9 bg-white w-full sm:w-40 md:w-48 lg:w-52 transition-all duration-300 ease-in-out focus:ring-2 focus:ring-blue-500 focus:shadow-md text-blue-600"
            />
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="h-9 w-full sm:w-[160px] md:w-[180px] bg-gradient-to-r from-blue-50/70 to-purple-50/70 border-blue-100 text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all duration-300" >
                <SelectValue>{projectFilter}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white shadow-lg border border-blue-100 rounded-lg">
                {projectOptions.map(p => (
                  <SelectItem
                    key={p}
                    value={p}
                    style={{
                      background: projectFilter === p ? 'linear-gradient(to right, rgba(219, 234, 254, 0.9), rgba(233, 213, 255, 0.9))' : 'transparent',
                      color: projectFilter === p ? '#2563eb' : undefined
                    }}
                    className="font-inter text-blue-600 dropdown-item cursor-pointer"
                  >
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right: Sort buttons + View type */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs md:text-sm text-gray-600 font-medium whitespace-nowrap">Sort by : </span>
            <div className="flex flex-wrap gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSortFieldChange('title')}
                className={cn("h-9 gap-1 px-2", filterButtonStyles, sortField === 'title' && sortDirection !== 'none' ? activeButtonStyles : "")}
              >
                Title {getSortArrows('title')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSortFieldChange('project')}
                className={cn("h-9 gap-1 px-2", filterButtonStyles, sortField === 'project' && sortDirection !== 'none' ? activeButtonStyles : "")}
              >
                Project {getSortArrows('project')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSortFieldChange('generatedAt')}
                className={cn("h-9 gap-1 px-2", filterButtonStyles, sortField === 'generatedAt' && sortDirection !== 'none' ? activeButtonStyles : "")}
              >
                Date {getSortArrows('generatedAt')}
              </Button>
            </div>

            {/* Vertical divider */}
            <div className="h-7 border-l border-gray-200 mx-1 hidden sm:block"></div>

            {/* View type buttons */}
            <div className="flex items-center">
              <span className="text-xs md:text-sm text-gray-600 font-medium whitespace-nowrap mr-1">View : </span>
              <div className="flex rounded-md border border-input overflow-hidden h-9">
                <Button
                  variant={viewType === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('grid')}
                  className={`rounded-none px-1 ${viewType === 'grid' ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' : 'text-blue-600 hover:bg-gradient-to-r from-blue-50/70 to-purple-50/70 hover:text-blue-700 transition-colors duration-300'}`}
                >
                  <GridIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewType === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('list')}
                  className={`rounded-none px-1 ${viewType === 'list' ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' : 'text-blue-600 hover:bg-gradient-to-r from-blue-50/70 to-purple-50/70 hover:text-blue-700 transition-colors duration-300'}`}
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className={`grid gap-4 ${viewType === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {processedReports.map(r => (
            <Card key={r.id} className="hover:shadow-md transition-all duration-300">
              <CardHeader className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600"/>
                <CardTitle className="truncate text-md">{r.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-red-50/70 to-amber-50/70 text-amber-700 border border-amber-200">
                    {r.project}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    {new Date(r.generatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"> High: {r.high} </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"> Medium: {r.medium} </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100"> Low: {r.low} </span>
                </div>
                <Button size="sm" variant="outline" className="self-start mt-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                  View Report
                </Button>
              </CardContent>
            </Card>
          ))}
          {processedReports.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-12">
              <Filter className="h-6 w-6 mx-auto mb-2"/>
              No reports found for the selected filters.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage; 