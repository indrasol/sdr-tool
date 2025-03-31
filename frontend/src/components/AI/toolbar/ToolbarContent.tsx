
import React from 'react';
import { ScrollArea } from '../../ui/scroll-area';
import ToolbarItem from './ToolbarItem';
import { ToolbarContentProps } from './ToolbarTypes';

const ToolbarContent: React.FC<ToolbarContentProps> = ({ 
  filteredTools,
  handleToolClick,
  isFiltersOpen = false
}) => {
  // Group tools by category
  const toolsByCategory = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof filteredTools>);

  // Sort categories alphabetically
  const sortedCategories = Object.keys(toolsByCategory).sort();

  return (
    <ScrollArea className="h-full p-2">
      {sortedCategories.length > 0 ? (
        <div className="space-y-4">
          {sortedCategories.map((category) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-medium text-gray-500 px-1">{category}</h3>
              <div className="grid grid-cols-2 gap-2">
                {toolsByCategory[category].map((tool) => (
                  <ToolbarItem
                    key={`${tool.category}-${tool.label}`}
                    tool={tool}
                    onClick={handleToolClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          No nodes match your search or filters
        </div>
      )}
    </ScrollArea>
  );
};

export default ToolbarContent;