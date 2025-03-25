
import React from 'react';
import { Search, X } from 'lucide-react';
import { ToolbarSearchProps } from './ToolbarTypes';

const ToolbarSearch: React.FC<ToolbarSearchProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  handleClearSearch 
}) => {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
      <input
        type="text"
        placeholder="Search nodes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-securetrack-purple/20 focus:border-securetrack-purple"
      />
      {searchTerm && (
        <button 
          onClick={handleClearSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default ToolbarSearch;