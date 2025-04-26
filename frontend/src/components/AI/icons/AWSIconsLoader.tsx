import React, { useState, useEffect } from 'react';
import RemoteSvgIcon from './RemoteSvgIcon';
import awsIcons from './AWSIcons.json';
import { ToolbarItem } from '../toolbar/ToolbarTypes';
import styles from './AWSIcons.module.css';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Type for the AWS icon item from the JSON
interface AWSIconItem {
  name: string;
  description: string;
  icon_url: string;
}

// Function to sanitize the name by removing prefixes and converting to title case
const formatLabel = (name: string): string => {
  // Remove aws_ or amazon_ prefix
  const withoutPrefix = name.replace(/^(aws_|amazon_)/, '');
  
  // Convert to title case with spaces
  return withoutPrefix
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Create a component that renders the AWS icon
const AWSIconComponent: React.FC<{ url: string }> = ({ url }) => {
  return (
    <div className={styles.awsIconContainer}>
      <div className={styles.awsIcon}>
        <RemoteSvgIcon url={url} size={46} />
      </div>
    </div>
  );
};

// Convert AWS icons to toolbar items
export const convertAWSIconsToToolbarItems = (): ToolbarItem[] => {
  if (!awsIcons || !awsIcons.aws || !Array.isArray(awsIcons.aws)) {
    console.error('Invalid AWS icons data format');
    return [];
  }

  // Include all services from the JSON file
  return awsIcons.aws.map((icon) => {
    // Create a custom component for this specific icon
    const IconComponent = () => <AWSIconComponent url={icon.icon_url} />;
    
    // Add the component as a property to make it work with the existing icon system
    (IconComponent as any).url = icon.icon_url;
    
    // Format the description to be more readable
    const enhancedDescription = icon.description || `AWS ${formatLabel(icon.name)} service`;
    
    // Also add the label for reference in the tooltip
    const label = formatLabel(icon.name);
    
    return {
      // Use the custom component as the icon
      icon: IconComponent as React.ElementType,
      label: label,
      category: 'AWS',
      color: 'white',
      bgColor: 'transparent', // No background
      provider: 'AWS',
      tags: ['aws', 'cloud'],
      // Add tooltip description
      description: enhancedDescription,
      // Store original label for tooltip
      tooltipTitle: label
    };
  });
};

// Export an AWS section component for use in ToolbarContent
interface AWSSectionProps {
  children: React.ReactNode;
  initialExpanded?: boolean;
  onToggle?: (isExpanded: boolean) => void;
}

export const AWSSection: React.FC<AWSSectionProps> = ({ 
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
    <div className={styles.awsSection}>
      <div className={styles.awsSectionHeader}>
        <h3 className={styles.awsSectionTitle}>Amazon Web Services</h3>
        <button 
          className={styles.toggleButton}
          onClick={handleToggle}
          aria-label={isExpanded ? "Collapse AWS Section" : "Expand AWS Section"}
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

export default AWSIconComponent; 