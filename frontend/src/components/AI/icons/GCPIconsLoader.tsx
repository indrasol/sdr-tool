import React, { useState, useEffect } from 'react';
import RemoteSvgIcon from './RemoteSvgIcon';
import gcpIcons from './GCPIcons.json';
import { ToolbarItem } from '../toolbar/ToolbarTypes';
import styles from './GCPIcons.module.css';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Type for the GCP icon item from the JSON
export interface GCPIconItem {
  name: string;
  icon_url: string;
  description?: string;
}

// Function to sanitize the name by removing the gcp_ prefix and converting to title case
const formatLabel = (name: string): string => {
  // First, replace underscores with spaces
  let formattedName = name.replace(/_/g, ' ');
  
  // Capitalize first letter of each word
  return formattedName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Create a component that renders the GCP icon
const GCPIconComponent: React.FC<{ url: string }> = ({ url }) => {
  return (
    <div className={styles.gcpIconContainer}>
      <div className={styles.gcpIcon}>
        <RemoteSvgIcon url={url} size={46} />
      </div>
    </div>
  );
};

// Convert GCP icons to toolbar items
export const convertGCPIconsToToolbarItems = (): ToolbarItem[] => {
  if (!gcpIcons || !gcpIcons.gcp || !Array.isArray(gcpIcons.gcp)) {
    console.error('Invalid GCP icons data format');
    return [];
  }

  return gcpIcons.gcp.map((icon: GCPIconItem) => {
    // Create a custom component for this specific icon
    const IconComponent = () => <GCPIconComponent url={icon.icon_url} />;
    
    // Add the url as a property to make it work with the existing icon system
    (IconComponent as any).url = icon.icon_url;
    
    // Format the description to be more readable
    const enhancedDescription = icon.description || `Google Cloud ${formatLabel(icon.name)} service`;
    
    // Also add the label for reference in the tooltip
    const label = formatLabel(icon.name);
    
    return {
      // Use the custom component as the icon
      icon: IconComponent as React.ElementType,
      label: label,
      category: 'GCP',
      color: 'white',
      bgColor: 'transparent', // No background
      provider: 'GCP',
      tags: ['gcp', 'cloud', 'google cloud'],
      // Add tooltip description
      description: enhancedDescription,
      // Store original label for tooltip
      tooltipTitle: label
    };
  });
};

// Export a GCP section component for use in ToolbarContent
interface GCPSectionProps {
  children: React.ReactNode;
  initialExpanded?: boolean;
  onToggle?: (isExpanded: boolean) => void;
}

export const GCPSection: React.FC<GCPSectionProps> = ({ 
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
    <div className={styles.gcpSection}>
      <div className={styles.gcpSectionHeader}>
        <h3 className={styles.gcpSectionTitle}>Google Cloud Platform</h3>
        <button 
          className={styles.toggleButton}
          onClick={handleToggle}
          aria-label={isExpanded ? "Collapse GCP Section" : "Expand GCP Section"}
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

export default GCPIconComponent; 