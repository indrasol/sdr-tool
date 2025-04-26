import React from 'react';
import { Search, X } from 'lucide-react';
import { ToolbarSearchProps } from './ToolbarTypes';

const ToolbarSearch: React.FC<ToolbarSearchProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  handleClearSearch 
}) => {
  return (
    <div className="relative flex-1 group">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors" size={16} />
      <input
        type="text"
        placeholder="Search components..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all shadow-sm hover:shadow-md group-hover:border-indigo-300"
      />
      {searchTerm && (
        <button 
          onClick={handleClearSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors hover:bg-indigo-50 hover:rounded-full p-1"
        >
          <X size={16} className="transition-transform hover:rotate-90" />
        </button>
      )}
    </div>
  );
};

export default ToolbarSearch;