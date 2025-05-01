import React, { useState, useEffect } from 'react';
import { ToolbarContentProps } from './ToolbarTypes';
import ToolbarItem from './ToolbarItem';
import { GCPSection } from '../icons/GCPIconsLoader';
import { AWSSection } from '../icons/AWSIconsLoader';
import { 
  AzureSection, 
  ApplicationSection, 
  ClientSection, 
  NetworkSection 
} from '../icons/IconsLoader';

const ToolbarContent: React.FC<ToolbarContentProps> = ({ 
  filteredTools,
  handleToolClick,
  isFiltersOpen
}) => {
  // Keep track of collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    AWS: false,
    Azure: false,
    GCP: false,
    Application: false,
    Client: false,
    Network: false
  });
  
  // Group items by category
  const groupedTools = filteredTools.reduce((acc, tool) => {
    const category = tool.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, typeof filteredTools>);

  // Sort categories with cloud providers at the top
  const sortedCategories = Object.keys(groupedTools).sort((a, b) => {
    // Reordering to place Client after Application instead of at the top
    if (a === 'AWS') return -1;
    if (b === 'AWS') return 1;
    if (a === 'Azure') return -1;
    if (b === 'Azure') return 1;
    if (a === 'GCP') return -1;
    if (b === 'GCP') return 1;
    if (a === 'Application') return -1;
    if (b === 'Application') return 1;
    if (a === 'Network') return -1;
    if (b === 'Network') return 1;
    if (a === 'Client') return -1;
    if (b === 'Client') return 1;
    return a.localeCompare(b);
  });
  
  // Handle section toggle
  const handleSectionToggle = (section: string, isExpanded: boolean) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !isExpanded
    }));
  };

  // Try to load collapsed state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('toolbarCollapsedSections');
      if (savedState) {
        setCollapsedSections(JSON.parse(savedState));
      }
    } catch (e) {
      console.error('Failed to load collapsed sections state:', e);
    }
  }, []);

  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('toolbarCollapsedSections', JSON.stringify(collapsedSections));
    } catch (e) {
      console.error('Failed to save collapsed sections state:', e);
    }
  }, [collapsedSections]);

  return (
    <div 
      id="toolbar-content"
      className={`h-full overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent`}
      style={{ 
        maxHeight: 'calc(100vh - 120px)',
        width: isFiltersOpen ? 'calc(100% - 200px)' : '100%',
        transition: 'width 0.3s',
        position: 'relative'
      }}
    >
      {filteredTools.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
          <p>No matching tools found</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedCategories.map(category => (
            <div key={category} className="mb-4">
              {category === 'GCP' ? (
                <GCPSection 
                  initialExpanded={!collapsedSections.GCP}
                  onToggle={(isExpanded) => handleSectionToggle('GCP', isExpanded)}
                >
                  {groupedTools[category].map((tool, index) => (
                    <ToolbarItem 
                      key={`${category}-${tool.label}-${index}`}
                      tool={tool}
                      onClick={handleToolClick}
                    />
                  ))}
                </GCPSection>
              ) : category === 'AWS' ? (
                <AWSSection 
                  initialExpanded={!collapsedSections.AWS}
                  onToggle={(isExpanded) => handleSectionToggle('AWS', isExpanded)}
                >
                  {groupedTools[category].map((tool, index) => (
                    <ToolbarItem 
                      key={`${category}-${tool.label}-${index}`}
                      tool={tool}
                      onClick={handleToolClick}
                    />
                  ))}
                </AWSSection>
              ) : category === 'Azure' ? (
                <AzureSection 
                  initialExpanded={!collapsedSections.Azure}
                  onToggle={(isExpanded) => handleSectionToggle('Azure', isExpanded)}
                >
                  {groupedTools[category].map((tool, index) => (
                    <ToolbarItem 
                      key={`${category}-${tool.label}-${index}`}
                      tool={tool}
                      onClick={handleToolClick}
                    />
                  ))}
                </AzureSection>
              ) : category === 'Application' ? (
                <ApplicationSection 
                  initialExpanded={!collapsedSections.Application}
                  onToggle={(isExpanded) => handleSectionToggle('Application', isExpanded)}
                >
                  {groupedTools[category].map((tool, index) => (
                    <ToolbarItem 
                      key={`${category}-${tool.label}-${index}`}
                      tool={tool}
                      onClick={handleToolClick}
                    />
                  ))}
                </ApplicationSection>
              ) : category === 'Network' ? (
                <NetworkSection 
                  initialExpanded={!collapsedSections.Network}
                  onToggle={(isExpanded) => handleSectionToggle('Network', isExpanded)}
                >
                  {groupedTools[category].map((tool, index) => (
                    <ToolbarItem 
                      key={`${category}-${tool.label}-${index}`}
                      tool={tool}
                      onClick={handleToolClick}
                    />
                  ))}
                </NetworkSection>
              ) : category === 'Client' ? (
                <ClientSection 
                  initialExpanded={!collapsedSections.Client}
                  onToggle={(isExpanded) => handleSectionToggle('Client', isExpanded)}
                >
                  {groupedTools[category].map((tool, index) => (
                    <ToolbarItem 
                      key={`${category}-${tool.label}-${index}`}
                      tool={tool}
                      onClick={handleToolClick}
                    />
                  ))}
                </ClientSection>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 px-2">
                    {category}
                  </h3>
                  <div className="grid grid-cols-3 gap-1">
                    {groupedTools[category].map((tool, index) => (
                      <ToolbarItem 
                        key={`${category}-${tool.label}-${index}`}
                        tool={tool}
                        onClick={handleToolClick}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolbarContent;