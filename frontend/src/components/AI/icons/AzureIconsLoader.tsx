import React, { useState, useEffect } from 'react';
import RemoteSvgIcon from './RemoteSvgIcon';
import azureIcons from './AzureIcons.json';
import { ToolbarItem } from '../toolbar/ToolbarTypes';
import styles from './AzureIcons.module.css';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Type for the Azure icon item from the JSON
export interface AzureIconItem {
  name: string;
  icon_url: string;
  description?: string;
}

// Function to sanitize the name by removing the azure_ prefix and converting to title case
const formatLabel = (name: string): string => {
  // Remove azure_ prefix
  const withoutPrefix = name.replace(/^azure_/, '');
  
  // Convert to title case with spaces
  return withoutPrefix
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Create a component that renders the Azure icon
const AzureIconComponent: React.FC<{ url: string }> = ({ url }) => {
  return (
    <div className={styles.azureIconContainer}>
      <div className={styles.azureIcon}>
        <RemoteSvgIcon url={url} size={46} />
      </div>
    </div>
  );
};

// Convert Azure icons to toolbar items
export const convertAzureIconsToToolbarItems = (): ToolbarItem[] => {
  if (!azureIcons || !azureIcons.azure || !Array.isArray(azureIcons.azure)) {
    console.error('Invalid Azure icons data format');
    return [];
  }

  // Include all Azure icons from the JSON file
  return azureIcons.azure.map((icon: AzureIconItem) => {
    // Create a custom component for this specific icon
    const IconComponent = () => <AzureIconComponent url={icon.icon_url} />;
    
    // Add the component as a property to make it work with the existing icon system
    (IconComponent as any).url = icon.icon_url;
    
    // Format the description to be more readable
    const enhancedDescription = icon.description || `Azure ${formatLabel(icon.name)} service`;
    
    // Also add the label for reference in the tooltip
    const label = formatLabel(icon.name);
    
    return {
      // Use the custom component as the icon
      icon: IconComponent as React.ElementType,
      label: label,
      category: 'Azure',
      color: 'white',
      bgColor: 'transparent', // No background
      provider: 'Azure',
      tags: ['azure', 'cloud'],
      // Add tooltip description
      description: enhancedDescription,
      // Store original label for tooltip
      tooltipTitle: label
    };
  });
};

// Export an Azure section component for use in ToolbarContent
interface AzureSectionProps {
  children: React.ReactNode;
  initialExpanded?: boolean;
  onToggle?: (isExpanded: boolean) => void;
}

export const AzureSection: React.FC<AzureSectionProps> = ({ 
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
    <div className={styles.azureSection}>
      <div className={styles.azureSectionHeader}>
        <h3 className={styles.azureSectionTitle}>Microsoft Azure</h3>
        <button 
          className={styles.toggleButton}
          onClick={handleToggle}
          aria-label={isExpanded ? "Collapse Azure Section" : "Expand Azure Section"}
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

export default AzureIconComponent; 