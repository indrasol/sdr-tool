import React from 'react';
import { Icon } from '@iconify/react';
import { resolveIcon } from '../utils/enhancedIconifyRegistry';
import { useDiagramStyle, useResponsiveIconSize } from '../contexts/DiagramStyleContext';
import { getIconSize } from '../styles/diagramStyles';

interface SmartIconProps {
  nodeType: string;
  provider?: string;
  technology?: string;
  size?: number | 'responsive' | 'context';
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  fallbackIcon?: string;
  title?: string;
  onClick?: () => void;
}

/**
 * Smart Icon Component with Enhanced Iconify Integration
 * 
 * Features:
 * - Intelligent icon resolution with fallback chain
 * - Provider-specific icons (AWS, Azure, GCP)
 * - Technology-specific icons (Docker, Kubernetes, etc.)
 * - Responsive sizing based on screen size and diagram style
 * - Context-aware sizing for different UI elements
 * - Automatic fallback to category icons
 */
const SmartIcon: React.FC<SmartIconProps> = ({
  nodeType,
  provider,
  technology,
  size = 'context',
  className = '',
  style = {},
  color,
  fallbackIcon,
  title,
  onClick,
}) => {
  const { diagramStyle } = useDiagramStyle();
  const responsiveSize = useResponsiveIconSize();

  // Resolve the icon using the enhanced registry
  const resolvedIcon = React.useMemo(() => {
    const resolved = resolveIcon(nodeType, provider, technology);
    return resolved || fallbackIcon || 'mdi:application';
  }, [nodeType, provider, technology, fallbackIcon]);

  // Calculate the final icon size
  const finalSize = React.useMemo(() => {
    if (typeof size === 'number') {
      return size;
    }
    
    if (size === 'responsive') {
      return responsiveSize;
    }
    
    // Context-aware sizing
    if (size === 'context') {
      return getIconSize(diagramStyle, 'node');
    }
    
    return 24; // Default fallback
  }, [size, responsiveSize, diagramStyle]);

  // Generate accessible title
  const accessibleTitle = title || `${nodeType} ${provider ? `(${provider})` : ''}`.trim();

  // Handle click events
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div
      title={accessibleTitle}
      className="smart-icon-wrapper"
      style={{ display: 'inline-block' }}
    >
      <Icon
        icon={resolvedIcon}
        width={finalSize}
        height={finalSize}
        className={`smart-icon ${className}`}
        style={{
          color,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.2s ease-in-out',
          ...style,
        }}
        aria-label={accessibleTitle}
        onClick={handleClick}
        role={onClick ? 'button' : 'img'}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
      />
    </div>
  );
};

export default SmartIcon;

// Utility component for node-specific icons
export const NodeIcon: React.FC<{
  nodeType: string;
  provider?: string;
  technology?: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ nodeType, provider, technology, className = '', style = {} }) => {
  const { diagramStyle } = useDiagramStyle();
  
  // Get node-specific styling
  const nodeIconStyle = React.useMemo(() => {
    const baseStyle = {
      filter: diagramStyle === 'sketch' ? 'url(#rough-paper)' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
      ...style,
    };
    
    return baseStyle;
  }, [diagramStyle, style]);

  return (
    <SmartIcon
      nodeType={nodeType}
      provider={provider}
      technology={technology}
      size="context"
      className={`node-icon ${className}`}
      style={nodeIconStyle}
    />
  );
};

// Utility component for toolbar icons
export const ToolbarIcon: React.FC<{
  nodeType: string;
  provider?: string;
  technology?: string;
  className?: string;
  onClick?: () => void;
}> = ({ nodeType, provider, technology, className = '', onClick }) => {
  const { diagramStyle } = useDiagramStyle();
  
  const toolbarSize = getIconSize(diagramStyle, 'toolbar');
  
  return (
    <SmartIcon
      nodeType={nodeType}
      provider={provider}
      technology={technology}
      size={toolbarSize}
      className={`toolbar-icon ${className}`}
      onClick={onClick}
      style={{
        opacity: 0.8,
        transition: 'opacity 0.2s ease-in-out',
      }}
    />
  );
};

// Utility component for header icons
export const HeaderIcon: React.FC<{
  nodeType: string;
  provider?: string;
  technology?: string;
  className?: string;
}> = ({ nodeType, provider, technology, className = '' }) => {
  const { diagramStyle } = useDiagramStyle();
  
  const headerSize = getIconSize(diagramStyle, 'header');
  
  return (
    <SmartIcon
      nodeType={nodeType}
      provider={provider}
      technology={technology}
      size={headerSize}
      className={`header-icon ${className}`}
      style={{
        opacity: 0.9,
      }}
    />
  );
}; 