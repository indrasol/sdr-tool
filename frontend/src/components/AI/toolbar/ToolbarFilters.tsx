import React, { useState } from 'react';
import { ScrollArea } from '../../ui/scroll-area';
import { Button } from '../../ui/button';
import { ChevronLeft, X, Search, Check } from 'lucide-react';
import { ToolbarFiltersProps } from './ToolbarTypes';
import styles from './ToolbarFilters.module.css';

const ToolbarFilters: React.FC<ToolbarFiltersProps> = ({
  isOpen,
  onClose,
  providers,
  selectedProviders,
  toggleProvider,
  categories,
  selectedCategories,
  toggleCategory,
  resetFilters
}) => {
  const [tagFilter, setTagFilter] = useState('');
  
  if (!isOpen) return null;

  return (
    <div className={`absolute top-0 right-0 bottom-0 w-[240px] border-l border-gray-200 bg-white h-full flex flex-col shadow-lg z-20 animate-slideInRight`}>
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 h-8 w-8 hover:bg-gray-100 rounded-full" 
            onClick={onClose}
          >
            <ChevronLeft size={16} />
          </Button>
          <h3 className="font-medium text-sm text-gray-800">Filters</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`text-purple-600 text-xs hover:bg-purple-50 hover:text-purple-700 ${styles.resetButton}`}
          onClick={resetFilters}
        >
          Reset
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3 text-gray-700">Provider</h4>
            <div className="grid grid-cols-2 gap-2">
              {providers.map(provider => (
                <button
                  key={provider}
                  onClick={() => toggleProvider(provider)}
                  className={`px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-all ${styles.buttonHover} ${
                    selectedProviders.includes(provider)
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-purple-200 text-purple-700'
                      : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{provider}</span>
                  {selectedProviders.includes(provider) && (
                    <Check size={14} className={`text-purple-600 ${styles.checkIcon}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3 text-gray-700">Component Type</h4>
            <div className="space-y-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-2 text-sm rounded-lg w-full flex items-center justify-between transition-all ${styles.buttonHover} ${
                    selectedCategories.includes(category)
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-purple-200 text-purple-700'
                      : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{category}</span>
                  {selectedCategories.includes(category) && (
                    <Check size={14} className={`text-purple-600 ${styles.checkIcon}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3 text-gray-700">Tags</h4>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search tags..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-full pl-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['network', 'security', 'database', 'compute', 'storage', 'serverless'].map(tag => (
                <span 
                  key={tag} 
                  className={`px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200 hover:bg-gray-200 cursor-pointer ${styles.tagItem}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ToolbarFilters;