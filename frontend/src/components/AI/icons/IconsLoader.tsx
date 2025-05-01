import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import RemoteSvgIcon from './RemoteSvgIcon';
import allIcons from './icons.json';
import { ToolbarItem } from '../toolbar/ToolbarTypes';

// Import style modules except for AWS and GCP
import azureStyles from './AzureIcons.module.css';
import applicationStyles from './ApplicationIcons.module.css';
import clientStyles from './ClientIcons.module.css';
import networkStyles from './NetworkIcons.module.css';

// Generic icon item interface
export interface IconItem {
  name: string;
  icon_url: string;
  description?: string;
}

// Function to sanitize icon names by removing prefixes and converting to title case
export const formatLabel = (name: string, prefix: string): string => {
  // Remove prefix (e.g., 'azure_', 'client_', etc.)
  const withoutPrefix = name.replace(new RegExp(`^${prefix}_`), '');
  
  // Convert to title case with spaces
  return withoutPrefix
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Generic icon component creator
const createIconComponent = (
  url: string, 
  category: string, 
  size: number = 46
): React.FC => {
  const IconComponent = () => {
    // Determine which style to use based on category
    let styleClass = '';
    switch(category) {
      case 'azure':
        styleClass = azureStyles.azureIconContainer;
        break;
      case 'application':
        styleClass = applicationStyles.applicationIconContainer;
        break;
      case 'client':
        styleClass = clientStyles.clientIconContainer;
        break;
      case 'network':
        styleClass = networkStyles.networkIconContainer;
        break;
      default:
        styleClass = '';
    }

    return (
      <div className={styleClass}>
        <div className={`${category}Icon`}>
          <RemoteSvgIcon url={url} size={size} />
        </div>
      </div>
    );
  };
  
  // Add URL as a property to make it work with the existing icon system
  (IconComponent as any).url = url;
  
  return IconComponent as React.FC;
};

// Map of provider names to their allowed ToolbarItem provider values
const providerMap: Record<string, string> = {
  'azure': 'Azure',
  'application': 'Generic',
  'client': 'Generic',
  'network': 'Generic'
};

// Map of provider names to their colors
const colorMap: Record<string, { color: string, bgColor: string }> = {
  'azure': { color: 'white', bgColor: 'transparent' },
  'network': { color: '#FFFFFF', bgColor: '#4B5563' },
  'client': { color: '#FFFFFF', bgColor: '#4B5563' },
  'application': { color: '#FFFFFF', bgColor: '#4B5563' }
};

// Create toolbar items for a specific icon category
export const createToolbarItems = (category: string): ToolbarItem[] => {
  const icons = (allIcons as Record<string, IconItem[]>)[category] || [];
  
  if (!icons || !Array.isArray(icons)) {
    console.error(`Invalid ${category} icons data format`);
    return [];
  }

  return icons.map((icon: IconItem) => {
    // Create a custom component for this specific icon
    const IconComponent = createIconComponent(icon.icon_url, category);
    
    // Format the label
    const label = formatLabel(icon.name, category);
    
    // Get the appropriate colors for this category
    const { color, bgColor } = colorMap[category] || { color: 'white', bgColor: 'transparent' };
    
    // Get the provider value from the map or default to 'Generic'
    const provider = providerMap[category] || 'Generic';
    
    // Format the description
    const enhancedDescription = icon.description || `${category.charAt(0).toUpperCase() + category.slice(1)} ${label}`;
    
    return {
      icon: IconComponent as React.ElementType,
      label: label,
      category: category.charAt(0).toUpperCase() + category.slice(1) as any,
      color: color,
      bgColor: bgColor,
      provider: provider as any,
      tags: [category, icon.name.replace(`${category}_`, '')],
      description: enhancedDescription,
      tooltipTitle: label
    };
  });
};

// Export helper functions for each icon category (except AWS and GCP)
export const getAzureIcons = (): ToolbarItem[] => createToolbarItems('azure');
export const getNetworkIcons = (): ToolbarItem[] => createToolbarItems('network');
export const getClientIcons = (): ToolbarItem[] => createToolbarItems('client');
export const getApplicationIcons = (): ToolbarItem[] => createToolbarItems('application');

// Get all icons combined (except AWS and GCP)
export const getAllIcons = (): ToolbarItem[] => {
  return [
    ...getAzureIcons(),
    ...getNetworkIcons(),
    ...getClientIcons(),
    ...getApplicationIcons()
  ];
};

// Generic section component that adapts styling based on category
interface SectionProps {
  children: React.ReactNode;
  initialExpanded?: boolean;
  onToggle?: (isExpanded: boolean) => void;
  category: string;
  title: string;
}

export const IconSection: React.FC<SectionProps> = ({ 
  children, 
  initialExpanded = true,
  onToggle,
  category,
  title
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  // Update expanded state when initialExpanded prop changes
  useEffect(() => {
    setIsExpanded(initialExpanded);
  }, [initialExpanded]);

  const handleToggle = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (onToggle) {
      onToggle(newExpandedState);
    }
  };

  // Determine which style to use based on category
  let sectionStyle = '';
  let sectionHeaderStyle = '';
  let sectionTitleStyle = '';
  let toggleButtonStyle = '';

  switch(category) {
    case 'azure':
    case 'Azure':
      sectionStyle = azureStyles.azureSection;
      sectionHeaderStyle = azureStyles.azureSectionHeader;
      sectionTitleStyle = azureStyles.azureSectionTitle;
      toggleButtonStyle = azureStyles.toggleButton;
      break;
    case 'application':
    case 'Application':
      sectionStyle = applicationStyles.applicationSection;
      sectionHeaderStyle = applicationStyles.applicationSectionHeader;
      sectionTitleStyle = applicationStyles.applicationSectionTitle;
      toggleButtonStyle = applicationStyles.toggleButton;
      break;
    case 'client':
    case 'Client':
      sectionStyle = clientStyles.clientSection;
      sectionHeaderStyle = clientStyles.clientSectionHeader;
      sectionTitleStyle = clientStyles.clientSectionTitle;
      toggleButtonStyle = clientStyles.toggleButton;
      break;
    case 'network':
    case 'Network':
      sectionStyle = networkStyles.networkSection;
      sectionHeaderStyle = networkStyles.networkSectionHeader;
      sectionTitleStyle = networkStyles.networkSectionTitle;
      toggleButtonStyle = networkStyles.toggleButton;
      break;
    default:
      sectionStyle = '';
      sectionHeaderStyle = '';
      sectionTitleStyle = '';
      toggleButtonStyle = '';
  }

  return (
    <div className={sectionStyle}>
      <div className={sectionHeaderStyle}>
        <h3 className={sectionTitleStyle}>{title}</h3>
        <button 
          className={toggleButtonStyle}
          onClick={handleToggle}
          aria-label={isExpanded ? `Collapse ${title} Section` : `Expand ${title} Section`}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      {isExpanded && (
        <div className="grid grid-cols-3 gap-2">
          {children}
        </div>
      )}
    </div>
  );
};

// Specific section components for convenience (except AWS and GCP)
export const AzureSection: React.FC<Omit<SectionProps, 'category' | 'title'>> = (props) => (
  <IconSection {...props} category="Azure" title="Azure" />
);

export const ApplicationSection: React.FC<Omit<SectionProps, 'category' | 'title'>> = (props) => (
  <IconSection {...props} category="application" title="Application Services" />
);

export const ClientSection: React.FC<Omit<SectionProps, 'category' | 'title'>> = (props) => (
  <IconSection {...props} category="client" title="Client Components" />
);

export const NetworkSection: React.FC<Omit<SectionProps, 'category' | 'title'>> = (props) => (
  <IconSection {...props} category="network" title="Network Components" />
);

// Helper function to create components from icons for each category
export const createIconComponents = (category: string): React.FC<{ url: string }>[] => {
  const icons = (allIcons as Record<string, IconItem[]>)[category] || [];
  
  if (!icons || !Array.isArray(icons)) {
    console.error(`Invalid ${category} icons data format`);
    return [];
  }

  return icons.map((icon: IconItem) => {
    const IconComponent: React.FC<{ url: string }> = ({ url }) => {
      // Determine which style to use based on category
      let containerClass = '';
      let iconClass = '';
      
      switch(category) {
        case 'azure':
          containerClass = azureStyles.azureIconContainer;
          iconClass = azureStyles.azureIcon;
          break;
        case 'application':
          containerClass = applicationStyles.applicationIconContainer;
          iconClass = applicationStyles.applicationIcon;
          break;
        case 'client':
          containerClass = clientStyles.clientIconContainer;
          iconClass = clientStyles.clientIcon;
          break;
        case 'network':
          containerClass = networkStyles.networkIconContainer;
          iconClass = networkStyles.networkIcon;
          break;
        default:
          containerClass = '';
          iconClass = '';
      }

      return (
        <div className={containerClass}>
          <div className={iconClass}>
            <RemoteSvgIcon url={url || icon.icon_url} size={46} />
          </div>
        </div>
      );
    };
    
    // Add the URL as a property to make it work with the existing icon system
    (IconComponent as any).url = icon.icon_url;
    
    return IconComponent;
  });
};

// Export for each category (except AWS and GCP)
export const createAzureIconComponents = (): React.FC<{ url: string }>[] => createIconComponents('azure');
export const createApplicationIconComponents = (): React.FC<{ url: string }>[] => createIconComponents('application');
export const createClientIconComponents = (): React.FC<{ url: string }>[] => createIconComponents('client');
export const createNetworkIconComponents = (): React.FC<{ url: string }>[] => createIconComponents('network'); 