
import React from 'react';
import { ScrollArea } from '../../ui/scroll-area';
import { ToolbarCategoryFilterProps } from './ToolbarTypes';

const ToolbarCategoryFilter: React.FC<ToolbarCategoryFilterProps> = ({ 
  categories, 
  activeCategory, 
  setActiveCategory 
}) => {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2 overflow-x-auto whitespace-nowrap">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category === 'All' ? null : category)}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
              (category === 'All' && !activeCategory) || category === activeCategory
                ? 'bg-securetrack-purple text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ToolbarCategoryFilter;