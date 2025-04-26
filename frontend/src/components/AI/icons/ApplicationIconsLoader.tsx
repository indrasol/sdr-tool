import React, { useState, useEffect } from 'react';
import RemoteSvgIcon from './RemoteSvgIcon';
import applicationIcons from './ApplicationIcons.json';
import { ToolbarItem } from '../toolbar/ToolbarTypes';
import styles from './ApplicationIcons.module.css';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Type for the Application icon item from the JSON
interface ApplicationIconItem {
  name: string;
  description: string;
  icon_url: string;
}

// Function to sanitize the name by removing prefixes and converting to title case
const formatLabel = (name: string): string => {
  // Remove application_ prefix
  const withoutPrefix = name.replace(/^(application_)/, '');
  
  // Convert to title case with spaces
  return withoutPrefix
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Create a component that renders the Application icon
const ApplicationIconComponent: React.FC<{ url: string }> = ({ url }) => {
  return (
    <div className={styles.applicationIconContainer}>
      <div className={styles.applicationIcon}>
        <RemoteSvgIcon url={url} size={46} />
      </div>
    </div>
  );
};

// Convert Application icons to toolbar items
export const convertApplicationIconsToToolbarItems = (): ToolbarItem[] => {
  if (!applicationIcons || !applicationIcons.application || !Array.isArray(applicationIcons.application)) {
    console.error('Invalid Application icons data format');
    return [];
  }

  // Include all services from the JSON file
  return applicationIcons.application.map((icon) => {
    // Create a custom component for this specific icon
    const IconComponent = () => <ApplicationIconComponent url={icon.icon_url} />;
    
    // Add the component as a property to make it work with the existing icon system
    (IconComponent as any).url = icon.icon_url;
    
    // Format the description to be more readable
    const enhancedDescription = icon.description || `Application ${formatLabel(icon.name)} service`;
    
    // Also add the label for reference in the tooltip
    const label = formatLabel(icon.name);
    
    return {
      // Use the custom component as the icon
      icon: IconComponent as React.ElementType,
      label: label,
      category: 'Application',
      color: 'white',
      bgColor: 'transparent', // No background
      provider: 'Generic',
      tags: ['application', 'service'],
      // Add tooltip description
      description: enhancedDescription,
      // Store original label for tooltip
      tooltipTitle: label
    };
  });
};

// Export an Application section component for use in ToolbarContent
interface ApplicationSectionProps {
  children: React.ReactNode;
  initialExpanded?: boolean;
  onToggle?: (isExpanded: boolean) => void;
}

export const ApplicationSection: React.FC<ApplicationSectionProps> = ({ 
  children, 
  initialExpanded = true,
  onToggle 
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

  return (
    <div className={styles.applicationSection}>
      <div className={styles.applicationSectionHeader}>
        <h3 className={styles.applicationSectionTitle}>Application Services</h3>
        <button 
          className={styles.toggleButton}
          onClick={handleToggle}
          aria-label={isExpanded ? "Collapse Application Section" : "Expand Application Section"}
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

export default ApplicationIconComponent; 