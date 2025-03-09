
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import ProjectCardBadges from './ProjectCardBadges';
import ProjectCardActions from './ProjectCardActions';
import ProjectCardMetadata from './ProjectCardMetadata';
import { getBorderColor } from './utils/projectStyleUtils';
import type { ProjectCardProps } from './types/projectTypes';
import { motion } from 'framer-motion';

const ProjectCardListView: React.FC<ProjectCardProps> = ({
  id,
  name,
  description,
  status,
  priority,
  createdDate,
  dueDate,
  creator,
  domain,
  templateType,
  importedFile,
  onClick,
  onDelete,
  onEdit
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1] // Custom spring-like ease curve
      }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
      }}
    >
      <Card 
        className="transition-all duration-300 cursor-pointer border-l-4 mb-2 hover:bg-gray-50/50"
        style={{ borderLeftColor: getBorderColor(priority) }}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-gray-100 rounded px-2 py-1">
                  {id}
                </span>
                <h3 className="font-semibold text-md">{name}</h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{description}</p>
            </div>
            
            <div className="flex items-center gap-3 ml-4">
              <div className="flex flex-wrap gap-1">
                <ProjectCardBadges 
                  status={status} 
                  priority={priority} 
                  domain={domain} 
                  templateType={templateType}
                  showPriorityText={false}
                />
              </div>
              
              <ProjectCardMetadata
                createdDate={createdDate}
                dueDate={dueDate}
                creator={creator}
                importedFile={importedFile}
                layout="list"
              />
              
              <ProjectCardActions 
                id={id}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProjectCardListView;