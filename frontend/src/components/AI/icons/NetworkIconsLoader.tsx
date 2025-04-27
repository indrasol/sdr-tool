import React, { useState, useEffect } from 'react';
import RemoteSvgIcon from './RemoteSvgIcon';
import networkIcons from './NetworkIcons.json';
import { ToolbarItem } from '../toolbar/ToolbarTypes';
import styles from './NetworkIcons.module.css';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Type for the Network icon item from the JSON
interface NetworkIconItem {
  name: string;
  description: string;
  icon_url: string;
}

// Function to sanitize the name by removing prefixes and converting to title case
const formatLabel = (name: string): string => {
  // Remove network_ prefix
  const withoutPrefix = name.replace(/^(network_)/, '');
  
  // Convert to title case with spaces
  return withoutPrefix
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Create a component that renders the Network icon
const NetworkIconComponent: React.FC<{ url: string, name?: string }> = ({ url, name }) => {
  return (
    <div className={styles.networkIconContainer}>
      <div className={styles.networkIcon} data-icon-name={name}>
        <RemoteSvgIcon url={url} size={46} className="network" />
      </div>
    </div>
  );
};

// Convert Network icons to toolbar items
export const convertNetworkIconsToToolbarItems = (): ToolbarItem[] => {
  if (!networkIcons || !networkIcons.network || !Array.isArray(networkIcons.network)) {
    console.error('Invalid Network icons data format');
    return [];
  }

  // Include all services from the JSON file
  return networkIcons.network.map((icon) => {
    // Create a custom component for this specific icon
    const IconComponent = () => <NetworkIconComponent url={icon.icon_url} name={icon.name} />;
    
    // Add the component as a property to make it work with the existing icon system
    (IconComponent as any).url = icon.icon_url;
    
    // Format the description to be more readable
    const enhancedDescription = icon.description || `Network ${formatLabel(icon.name)} service`;
    
    // Also add the label for reference in the tooltip
    const label = formatLabel(icon.name);
    
    return {
      // Use the custom component as the icon
      icon: IconComponent as React.ElementType,
      label: label,
      category: 'Network',
      color: 'white',
      bgColor: 'transparent', // No background
      provider: 'Generic',
      tags: ['network', 'service'],
      // Add tooltip description
      description: enhancedDescription,
      // Store original label for tooltip
      tooltipTitle: label
    };
  });
};

// Export a Network section component for use in ToolbarContent
interface NetworkSectionProps {
  children: React.ReactNode;
  initialExpanded?: boolean;
  onToggle?: (isExpanded: boolean) => void;
}

export const NetworkSection: React.FC<NetworkSectionProps> = ({ 
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
    <div className={styles.networkSection}>
      <div className={styles.networkSectionHeader}>
        <h3 className={styles.networkSectionTitle}>Network Services</h3>
        <button 
          className={styles.toggleButton}
          onClick={handleToggle}
          aria-label={isExpanded ? "Collapse Network Section" : "Expand Network Section"}
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

export default NetworkIconComponent; 