import { useEffect } from 'react'; 
import Layout from '@/components/layout/Layout';
import ProjectsListHeader from '@/components/Projects/ProjectsListHeader';
import CreateProjectDialog from '@/components/Projects/CreateProjectDialog';
import DeleteProjectDialog from '@/components/Projects/DeleteProjectDialog';
import EditProjectDialog from '@/components/Projects/EditProjectDialog';
import ProjectStats from '@/components/Projects/ProjectListPage/ProjectStats';
import ProjectContent from '@/components/Projects/ProjectListPage/ProjectContent';
import { useProjectsPage } from '@/components/Projects/ProjectListPage/useProjectsPage';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/Auth/AuthContext';
import { useProjectCRUD } from '@/components/Projects/ProjectListPage/hooks/useProjectCRUD'

const Projects = () => {
  const { user } = useAuth();
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
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    templateFilter,
    setTemplateFilter,
    clearFilters,
    hasActiveFilters,
    pagination,
    handleProjectClick,
    handleCreateProject,
    handleEditProject,
    handleUpdateProject,
    handleDeleteProject,
    confirmDeleteProject,
    handleProjectCreation,
    handleStatusFilterChange,
    refreshProjects,
    goToNextPage,
    goToPreviousPage,
    changePageSize,
    isSubmitting
  } = useProjectsPage();

  // Load user projects on component mount
  useEffect(() => {
    if (user) {
      console.log("user : ",user)
      refreshProjects();
    }
  }, [user]);

  // Create a wrapped version of handleProjectCreation that refreshes the projects list
  // const handleCreateNewProject = async (projectData) => {
  //   await handleProjectCreation(projectData);
  //   // After project creation, refresh the project list
  //   refreshProjects();
  // };

  // Calculate project counts for header stats
  const activeProjectsCount = allProjects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'NOT_STARTED').length;
  const completedProjectsCount = allProjects.filter(p => p.status === 'COMPLETED').length;
  const myProjectsCount = user ? allProjects.filter(p => p.creator === user.username || p.creator === user.email || p.creator === user.id).length : 0;

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
            onViewTypeChange={setViewType}
          />
        </motion.div>

        <CreateProjectDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen}
          onCreateProject={handleProjectCreation}
          isSubmitting={isSubmitting}
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