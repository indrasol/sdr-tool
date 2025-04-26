import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import RemoteSvgIcon from './RemoteSvgIcon';
import clientIcons from './ClientIcons.json';
import { ToolbarItem } from '../toolbar/ToolbarTypes';
import styles from './ClientIcons.module.css';

export interface ClientIconItem {
  name: string;
  icon_url: string;
  description?: string;
}

// Create a component that renders the Client icon
const ClientIconComponent: React.FC<{ icon_url: string }> = ({ icon_url }) => {
  return (
    <div className={styles.clientIconContainer}>
      <div className={styles.clientIcon}>
        <RemoteSvgIcon url={icon_url} />
      </div>
    </div>
  );
};

// Helper function to format labels
const formatLabel = (name: string): string => {
  return name
    .replace(/^client_/, '') // Remove the 'client_' prefix
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Convert Client icons to toolbar items - this function signature needs to match other icon loaders
export const convertClientIconsToToolbarItems = (): ToolbarItem[] => {
  console.log("convertClientIconsToToolbarItems called");
  
  if (!clientIcons || !clientIcons.client || !Array.isArray(clientIcons.client)) {
    console.error('Invalid Client icons data format');
    return [];
  }

  // Include all Client icons from the JSON file
  const items = clientIcons.client.map((icon: ClientIconItem) => {
    console.log("Processing client icon:", icon.name);
    
    // Create a custom component for this specific icon
    const IconComponent = () => <ClientIconComponent icon_url={icon.icon_url} />;
    
    // Add the component as a property to make it work with the existing icon system
    (IconComponent as any).url = icon.icon_url;
    
    // Format the description to be more readable
    const enhancedDescription = icon.description || `Client ${formatLabel(icon.name)}`;
    
    // Also add the label for reference in the tooltip
    const label = formatLabel(icon.name);
    
    return {
      // Use the custom component as the icon
      icon: IconComponent as React.ElementType,
      label: label,
      category: 'Client' as const, // Use const assertion to fix type error
      color: '#FFFFFF',
      bgColor: '#4B5563', // Updated to match new grey theme
      provider: 'Generic' as const, // Use const assertion for provider type
      tags: ['client', icon.name.replace('client_', '')],
      // Add tooltip description
      description: enhancedDescription,
      // Store original label for tooltip
      tooltipTitle: label
    };
  });
  
  console.log("Generated client toolbar items:", items.length);
  return items;
};

// Section component for Client icons
export const ClientSection: React.FC<{
  children: React.ReactNode;
  initialExpanded?: boolean;
  onToggle?: (isExpanded: boolean) => void;
}> = ({ children, initialExpanded = true, onToggle }) => {
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
    <div className={styles.clientSection}>
      <div className={styles.clientSectionHeader}>
        <h3 className={styles.clientSectionTitle}>Client Components</h3>
        <button 
          className={styles.toggleButton}
          onClick={handleToggle}
          aria-label={isExpanded ? "Collapse Client Section" : "Expand Client Section"}
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