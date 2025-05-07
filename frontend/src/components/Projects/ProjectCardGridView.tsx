import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import ProjectCardBadges from './ProjectCardBadges';
import ProjectCardActions from './ProjectCardActions';
import ProjectCardMetadata from './ProjectCardMetadata';
import { getBorderColor } from './utils/projectStyleUtils';
import type { ProjectCardProps } from '../../interfaces/projectInterfaces';
import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';

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
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-poppins font-semibold text-lg mb-2 text-gray-800">{name}</h3>
              <ProjectCardBadges 
                status={status} 
                priority={priority} 
                domain={domain} 
                templateType={templateType}
                showPriorityText={false}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-inter text-muted-foreground bg-gray-100 rounded px-2 py-1 w-16 text-center">
                {id}
              </div>
              <ProjectCardActions 
                id={id}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 font-inter">{description}</p>
          
          {dueDate && (
            <div className="mb-3 flex items-center text-xs font-inter text-gray-500">
              <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
              <span>Due: {new Date(dueDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}</span>
            </div>
          )}
          
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