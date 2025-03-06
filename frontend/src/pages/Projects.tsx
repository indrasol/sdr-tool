import React, { useCallback } from 'react';
import Layout from '@/components/layout/Layout';

// Component Imports
import ProjectsListHeader from '@/components/Projects/ProjectsListHeader';
import CreateProjectDialog from '@/components/Projects/CreateProjectDialog';
import { useProjectsPage } from '@/components/Projects/ProjectListPage/useProjectsPage';
import ProjectStats from '@/components/Projects/ProjectListPage/ProjectStats';
import ProjectContent from '@/components/Projects/ProjectListPage/ProjectContent';
import DeleteProjectDialog from '@/components/Projects/DeleteProjectDialog';
import EditProjectDialog from '@/components/Projects/EditProjectDialog';

const Projects = () => {
    const {
        viewType,
        setViewType,
        createDialogOpen,
        setCreateDialogOpen,
        deleteDialogOpen,
        setDeleteDialogOpen,
        editDialogOpen,
        setEditDialogOpen,
        projectToDelete,
        projectToEdit,
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
        handleEditProject,
        handleUpdateProject,
        handleDeleteProject,
        confirmDeleteProject,
        handleProjectCreation,
        handleExportProjects,
        handleStatusFilterChange,
      } = useProjectsPage();
    
      // Calculate project counts for header stats
      const activeProjectsCount = allProjects.filter(p => p.status === 'In Progress' || p.status === 'Started').length;
      const completedProjectsCount = allProjects.filter(p => p.status === 'Completed').length;
      const myProjectsCount = allProjects.filter(p => p.creator === 'testsdr').length;

      // Memoized callbacks for performance
      const memoizedHandleProjectClick = useCallback((projectId: string) => {
        handleProjectClick(projectId);
      }, [handleProjectClick]);

      const memoizedHandleCreateProject = useCallback(() => {
        handleCreateProject();
      }, [handleCreateProject]);

      const memoizedHandleEditProject = useCallback((projectId: string) => {
        handleEditProject(projectId);
      }, [handleEditProject]);

      const memoizedHandleDeleteProject = useCallback((projectId: string) => {
        handleDeleteProject(projectId);
      }, [handleDeleteProject]);

      const memoizedHandleExportProjects = useCallback(() => {
        handleExportProjects();
      }, [handleExportProjects]);

      const memoizedHandleStatusFilterChange = useCallback((status: string) => {
        handleStatusFilterChange(status);
      }, [handleStatusFilterChange]);
    
      
      
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
              onDeleteProject={handleDeleteProject}
              onEditProject={handleEditProject}
              viewType={viewType}
            />
    
            <CreateProjectDialog 
              open={createDialogOpen} 
              onOpenChange={setCreateDialogOpen}
              onCreateProject={handleProjectCreation}
            />

            {projectToDelete && (
              <DeleteProjectDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                projectName={projectToDelete.name}
                onConfirmDelete={confirmDeleteProject}
              />
            )}

            <EditProjectDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              project={projectToEdit}
              onUpdateProject={handleUpdateProject}
            />
          </div>
        </Layout>
      );
    };
    

export default React.memo(Projects);