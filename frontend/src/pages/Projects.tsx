
import Layout from '@/components/layout/Layout';
import ProjectsListHeader from '@/components/Projects/ProjectsListHeader';
import CreateProjectDialog from '@/components/Projects/CreateProjectDialog';
import DeleteProjectDialog from '@/components/Projects/DeleteProjectDialog';
import EditProjectDialog from '@/components/Projects/EditProjectDialog';
import ProjectStats from '@/components/Projects/ProjectListPage/ProjectStats';
import ProjectContent from '@/components/Projects/ProjectListPage/ProjectContent';
import { useProjectsPage } from '@/components/Projects/ProjectListPage/useProjectsPage';
import { motion } from 'framer-motion';

const Projects = () => {
  const {
    viewType,
    setViewType,
    createDialogOpen,
    setCreateDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    projectToDelete,
    editDialogOpen,
    setEditDialogOpen,
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
    handleStatusFilterChange
  } = useProjectsPage();

  // Calculate project counts for header stats
  const activeProjectsCount = allProjects.filter(p => p.status === 'In Progress' || p.status === 'Started').length;
  const completedProjectsCount = allProjects.filter(p => p.status === 'Completed').length;
  const myProjectsCount = allProjects.filter(p => p.creator === 'testsdr').length;

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  return (
    <Layout>
      <motion.div 
        className="space-y-6 mt-16"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <ProjectsListHeader 
          onCreateProject={handleCreateProject}
          onExportProjects={handleExportProjects}
          onViewTypeChange={setViewType}
          onStatusFilterChange={handleStatusFilterChange}
          totalProjects={allProjects.length}
          activeProjects={activeProjectsCount}
          completedProjects={completedProjectsCount}
          myProjects={myProjectsCount}
          currentViewType={viewType}
        />

        <motion.div variants={fadeIn}>
          <ProjectStats 
            allProjects={allProjects}
            onStatusFilterChange={handleStatusFilterChange}
          />
        </motion.div>

        <motion.div variants={fadeIn}>
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
        </motion.div>

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
      </motion.div>
    </Layout>
  );
};

export default Projects;