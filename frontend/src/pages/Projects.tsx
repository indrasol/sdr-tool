
import Layout from '@/components/layout/Layout';

// Component Imports
import ProjectsListHeader from '@/components/Projects/ProjectsListHeader';
import CreateProjectDialog from '@/components/Projects/CreateProjectDialog';
import { useProjectsPage } from '@/components/Projects/ProjectListPage/useProjectsPage';
import ProjectStats from '@/components/Projects/ProjectListPage/ProjectStats';
import ProjectContent from '@/components/Projects/ProjectListPage/ProjectContent';

const Projects = () => {
    const {
        viewType,
        setViewType,
        createDialogOpen,
        setCreateDialogOpen,
        projects,
        allProjects,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        priorityFilter,
        setPriorityFilter,
        clearFilters,
        hasActiveFilters,
        handleProjectClick,
        handleCreateProject,
        handleProjectCreation,
        handleExportProjects,
        handleStatusFilterChange
      } = useProjectsPage();
    
      // Calculate project counts for header stats
      const activeProjectsCount = allProjects.filter(p => p.status === 'In Progress' || p.status === 'Started').length;
      const completedProjectsCount = allProjects.filter(p => p.status === 'Completed').length;
      const myProjectsCount = allProjects.filter(p => p.creator === 'testsdr').length;
    
      return (
        <Layout>
          <div className="space-y-6 mt-16">
            <ProjectsListHeader 
              onCreateProject={handleCreateProject}
              onExportProjects={handleExportProjects}
              onViewTypeChange={setViewType}
              onStatusFilterChange={handleStatusFilterChange}
              totalProjects={allProjects.length}
              activeProjects={activeProjectsCount}
              completedProjects={completedProjectsCount}
              myProjects={myProjectsCount}
            />
    
            <ProjectStats 
              allProjects={allProjects}
              onStatusFilterChange={handleStatusFilterChange}
            />
    
            <ProjectContent
              projects={projects}
              allProjects={allProjects}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              clearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              onProjectClick={handleProjectClick}
              onCreateProject={handleCreateProject}
            />
    
            <CreateProjectDialog 
              open={createDialogOpen} 
              onOpenChange={setCreateDialogOpen}
              onCreateProject={handleProjectCreation}
            />
          </div>
        </Layout>
      );
    };
    

export default Projects;