
import React from 'react';
import ProjectCardGridView from './ProjectCardGridView';
import ProjectCardListView from './ProjectCardListView';
import type { ProjectCardProps } from '../../interfaces/projectInterfaces';

const ProjectCard: React.FC<ProjectCardProps> = (props) => {
  const { viewType = 'grid' } = props;
  
  if (viewType === 'list') {
    return <ProjectCardListView {...props} />;
  }
  
  return <ProjectCardGridView {...props} />;
};

export default ProjectCard;