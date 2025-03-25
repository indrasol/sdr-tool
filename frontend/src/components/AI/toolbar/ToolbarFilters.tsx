
import React from 'react';
import { ScrollArea } from '../../ui/scroll-area';
import { Button } from '../../ui/button';
import { ChevronLeft, X } from 'lucide-react';
import { ToolbarFiltersProps } from './ToolbarTypes';

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
  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 bottom-0 w-64 border-l border-gray-200 bg-white h-full flex flex-col shadow-md z-20">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 h-8 w-8" 
            onClick={onClose}
          >
            <ChevronLeft size={18} />
          </Button>
          <h3 className="font-medium">Filters</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-gray-500 text-xs"
          onClick={resetFilters}
        >
          Clear
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Libraries</h4>
            {providers.map(provider => (
              <div key={provider} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`provider-${provider}`}
                  checked={selectedProviders.includes(provider)}
                  onChange={() => toggleProvider(provider)}
                  className="h-4 w-4 rounded border-gray-300 text-securetrack-purple focus:ring-securetrack-purple"
                />
                <label htmlFor={`provider-${provider}`} className="ml-2 text-sm text-gray-700">
                  {provider}
                </label>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Tags</h4>
            <input
              type="text"
              placeholder="Filter Tags..."
              className="w-full p-2 text-sm border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Other</h4>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="security-controls"
                className="h-4 w-4 rounded border-gray-300 text-securetrack-purple focus:ring-securetrack-purple"
              />
              <label htmlFor="security-controls" className="ml-2 text-sm text-gray-700">
                Security Controls
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="models"
                className="h-4 w-4 rounded border-gray-300 text-securetrack-purple focus:ring-securetrack-purple"
              />
              <label htmlFor="models" className="ml-2 text-sm text-gray-700">
                Models
              </label>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ToolbarFilters;