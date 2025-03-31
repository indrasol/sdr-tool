import React, { useState } from 'react';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { toolbarItems } from './toolbar/ToolbarItems';
import { dfdToolbarItems } from '@/components/AI/toolbar/DFDToolbarItems';
import { getCategoryStyle } from './utils/nodeStyles';
import ToolbarSearch from './toolbar/ToolbarSearch';
import ToolbarContent from './toolbar/ToolbarContent';
import ToolbarFilters from './toolbar/ToolbarFilters';
import { DiagramToolbarProps } from '@/components/AI/toolbar/ToolbarTypes';

interface ExtendedDiagramToolbarProps extends DiagramToolbarProps {
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
  viewMode?: 'AD' | 'DFD';
}

const DiagramToolbar: React.FC<ExtendedDiagramToolbarProps> = ({ 
  onAddNode, 
  isExpanded = true,
  onToggleExpand,
  viewMode = 'AD'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(!isExpanded);

  // Use appropriate toolbar items based on viewMode
  const items = viewMode === 'DFD' ? dfdToolbarItems : toolbarItems;

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const toggleFilters = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    if (onToggleExpand) {
      onToggleExpand(!newCollapsedState);
    }
  };

  const toggleProvider = (provider: string) => {
    setSelectedProviders(prev => 
      prev.includes(provider) 
        ? prev.filter(p => p !== provider) 
        : [...prev, provider]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const resetFilters = () => {
    setSelectedProviders([]);
    setSelectedCategories([]);
    setActiveCategory(null);
    setSearchTerm('');
  };

  const handleToolClick = (tool: typeof items[0]) => {
    const centerPosition = {
      x: 250,
      y: 150,
    };
    
    const IconComponent = tool.icon;
    
    let iconColor = tool.color;
    let iconBgColor = tool.bgColor;
    
    if (!iconColor || !iconBgColor) {
      const categoryStyle = getCategoryStyle(tool.category);
      iconColor = categoryStyle.color;
      iconBgColor = categoryStyle.bgColor;
    }
    
    const iconRenderer = () => {
      return {
        component: IconComponent,
        props: {
          size: 16,
          className: "text-white"
        },
        bgColor: iconBgColor
      };
    };
    
    onAddNode(tool.label, centerPosition, iconRenderer);
  };

  const filteredTools = items.filter(tool => {
    const matchesSearch = tool.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !activeCategory || tool.category === activeCategory;
    const matchesProvider = selectedProviders.length === 0 || 
      (tool.provider && selectedProviders.includes(tool.provider));
    const matchesSelectedCategory = selectedCategories.length === 0 ||
      selectedCategories.includes(tool.category);
    
    return matchesSearch && matchesCategory && matchesProvider && matchesSelectedCategory;
  });

  // Get categories and providers from the active items list
  const categories = ['All', ...Array.from(new Set(items.map(item => item.category)))] as string[];
  const providers = viewMode === 'DFD' 
    ? [] // No providers filtering for DFD
    : ['AWS', 'Azure', 'GCP', 'Generic'];

  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col border-l border-gray-200 bg-white w-12">
        <button 
          onClick={toggleCollapse}
          className="h-12 flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <div className="transform -rotate-90 whitespace-nowrap text-gray-500 text-xs font-medium tracking-wide">
            {viewMode === 'DFD' ? 'Threat Model Components' : 'Diagram Tool bar'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 flex flex-col h-full w-full bg-white shadow-sm overflow-hidden relative">
        <div className="border-b border-gray-100 p-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleCollapse}
              className="p-1 hover:bg-gray-100 rounded-md flex-shrink-0"
            >
              <ChevronRight size={16} className="text-gray-500" />
            </button>
            <div className="flex-1">
              <ToolbarSearch 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleClearSearch={handleClearSearch}
              />
            </div>
            {providers.length > 0 && (
              <button
                onClick={toggleFilters}
                className="p-1 hover:bg-gray-100 rounded-md flex-shrink-0"
              >
                <Filter size={16} />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          <ToolbarContent 
            filteredTools={filteredTools}
            handleToolClick={handleToolClick}
            isFiltersOpen={isFiltersOpen}
          />
          
          {isFiltersOpen && providers.length > 0 && (
            <ToolbarFilters 
              isOpen={isFiltersOpen}
              onClose={toggleFilters}
              providers={providers}
              selectedProviders={selectedProviders}
              toggleProvider={toggleProvider}
              categories={categories.filter(c => c !== 'All')}
              selectedCategories={selectedCategories}
              toggleCategory={toggleCategory}
              resetFilters={resetFilters}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagramToolbar;