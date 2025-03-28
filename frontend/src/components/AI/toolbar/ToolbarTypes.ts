
import { Node } from '@xyflow/react';
import { CustomNodeData } from '../types/diagramTypes';

export interface ToolbarItem {
  icon: React.ElementType;
  label: string;
  category: 'General' | 'AWS' | 'Network' | 'Security' | 'Azure' | 'GCP' | 'DevOps' | 'Infrastructure' | 'IoT' | 'Containers' | 'Database' | 'Analytics' | 'Storage' | 'Compute' | 'Serverless' | 'Messaging';
  color?: string;
  bgColor?: string;
  provider?: 'AWS' | 'Azure' | 'GCP' | 'Generic';
  tags?: string[];
}

export interface DiagramToolbarProps {
  onAddNode: (nodeType: string, position: { x: number, y: number }, iconRenderer?: () => { component: React.ElementType; props: any; bgColor: string }) => void;
}

export interface ToolbarItemProps {
  tool: ToolbarItem;
  onClick: (tool: ToolbarItem) => void;
}

export interface ToolbarSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  handleClearSearch: () => void;
}

export interface ToolbarCategoryFilterProps {
  categories: string[];
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
}

export interface ToolbarContentProps {
  filteredTools: ToolbarItem[];
  handleToolClick: (tool: ToolbarItem) => void;
  isFiltersOpen?: boolean;
}

export interface ToolbarFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  providers: string[];
  selectedProviders: string[];
  toggleProvider: (provider: string) => void;
  categories: string[];
  selectedCategories: string[];
  toggleCategory: (category: string) => void;
  resetFilters: () => void;
}