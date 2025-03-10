
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import ProjectCardBadges from './ProjectCardBadges';
import ProjectCardActions from './ProjectCardActions';
import ProjectCardMetadata from './ProjectCardMetadata';
import { getBorderColor } from './utils/projectStyleUtils';
import type { ProjectCardProps } from '../../interfaces/projectInterfaces';
import { motion } from 'framer-motion';

const ProjectCardGridView: React.FC<ProjectCardProps> = ({
  id,
  name,
  description,
  status,
  priority,
  createdDate,
  dueDate,
  creator,
  assignedTo,
  domain,
  templateType,
  importedFile,
  onClick,
  onDelete,
  onEdit
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1] // Customize for elegant motion
      }}
      whileHover={{ 
        scale: 1.03,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
      }}
      className="h-full"
    >
      <Card 
        className="transition-colors duration-300 cursor-pointer h-full border-l-4 hover:bg-gray-50/50"
        style={{ borderLeftColor: getBorderColor(priority) }}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg mb-1">{name}</h3>
              <ProjectCardBadges 
                status={status} 
                priority={priority} 
                domain={domain} 
                templateType={templateType}
                showPriorityText={false}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground bg-gray-100 rounded px-2 py-1 w-16 text-center">
                {id}
              </div>
              <ProjectCardActions 
                id={id}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>
          
          <ProjectCardMetadata
            createdDate={createdDate}
            dueDate={dueDate}
            creator={creator}
            assignedTo={assignedTo}
            importedFile={importedFile}
            layout="grid"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProjectCardGridView;