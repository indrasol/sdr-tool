import React from 'react';
import { Icon } from '@iconify/react';
import { useDiagramStyle, useResponsiveIconSize } from '../contexts/DiagramStyleContext';
import { getIconSize } from '../styles/diagramStyles';

interface SmartIconProps {
  nodeType: string;        // may already be an iconify id (contains ':')
  provider?: string;
  technology?: string;
  size?: number | 'responsive' | 'context';
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  fallbackIcon?: string;
  svgUrl?: string;         // optional remote SVG fallback
  title?: string;
  onClick?: () => void;
}

// Track missing icons globally to avoid duplicate reports
const reportedMissingIcons = new Set<string>();

// Missing icon tracking endpoint
const ICON_TRACKING_ENDPOINT = '/api/v1/telemetry/missing-icon';

/**
 * Send missing icon report to backend
 */
const reportMissingIcon = async (iconId: string, provider?: string) => {
  // Only report each icon once per session
  if (reportedMissingIcons.has(iconId)) {
    return;
  }

  // Mark as reported
  reportedMissingIcons.add(iconId);

  try {
    // Send telemetry to backend
    const response = await fetch(ICON_TRACKING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        iconId,
        provider,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
    });
    
    if (!response.ok) {
      console.warn(`Failed to report missing icon: ${iconId}`);
    }
  } catch (error) {
    // Silently fail - this is just telemetry
    console.debug('Failed to send icon telemetry', error);
  }
};

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
 * - Support for custom icons with 'custom:' prefix
 * - NEW: Missing icon tracking and reporting
 */
const SmartIcon: React.FC<SmartIconProps> = ({
  nodeType,
  provider: _provider,
  technology: _technology,
  size = 'context',
  className = '',
  style = {},
  color,
  fallbackIcon,
  svgUrl,
  title,
  onClick,
}) => {
  const { diagramStyle } = useDiagramStyle();
  const responsiveSize = useResponsiveIconSize();
  const [iconLoadError, setIconLoadError] = React.useState(false);

  // Ensure the svgUrl can actually be rendered in an <img>
  // const renderableSvgUrl = React.useMemo(() => toRenderableSupabaseUrl(svgUrl), [svgUrl]);
  const renderableSvgUrl = svgUrl;

  // Resolve the icon using the enhanced registry
  const resolvedIcon = React.useMemo(() => {
    // If the nodeType already contains the custom: prefix, use it directly
    if (nodeType && nodeType.startsWith('custom:')) {
      return nodeType;
    }

    // If the incoming nodeType already is an Iconify ID (contains ':') use it.
    if (nodeType && nodeType.includes(':')) {
      return nodeType;
    }

    // Try to form a cloud provider specific icon ID if provider is available
    if (_provider && nodeType) {
      const providerPrefix = _provider.toLowerCase();
      // For example: aws + dynamodb = custom:aws-dynamodb
      return `custom:${providerPrefix}-${nodeType.toLowerCase()}`;
    }

    return fallbackIcon || 'mdi:application';
  }, [nodeType, fallbackIcon, _provider]);

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
  const accessibleTitle = title || `${nodeType} ${_provider ? `(${_provider})` : ''}`.trim();

  // Handle click events
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  };

  // Handle icon loading error
  const handleIconLoadError = React.useCallback(() => {
    // Set state to trigger fallback rendering
    setIconLoadError(true);
    
    // Report missing icon for telemetry
    if (resolvedIcon.startsWith('custom:')) {
      // For cloud provider icons, extract the provider from the icon ID
      const match = resolvedIcon.match(/custom:([a-z]+)-([a-z0-9-]+)/);
      if (match) {
        const [_, provider, service] = match;
        reportMissingIcon(resolvedIcon, provider);
        
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[SmartIcon] Missing cloud icon: ${resolvedIcon} (provider: ${provider}, service: ${service})`);
        }
      } else {
        reportMissingIcon(resolvedIcon);
        
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[SmartIcon] Failed to load custom icon: ${resolvedIcon}, falling back to default`);
        }
      }
    }
  }, [resolvedIcon]);

  // Log icon loading in development mode
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && resolvedIcon.startsWith('custom:')) {
      console.log(`[SmartIcon] Rendering custom icon: ${resolvedIcon}`);
    }
  }, [resolvedIcon]);

  const renderIcon = () => {
    // Add debug logging to see what values we're working with
    const debugSvgUrl = svgUrl || '';
    
    console.log(`[SmartIcon] Rendering with SVG URL: ${debugSvgUrl.substring(0, 100)}${debugSvgUrl.length > 100 ? '...' : ''}`);

    // Prioritize using svgUrl for custom icons (convert to renderable URL first)
    if (renderableSvgUrl && resolvedIcon.startsWith('custom:')) {
      return (
        <img
          src={renderableSvgUrl}
          width={finalSize}
          height={finalSize}
          style={{
            cursor: onClick ? 'pointer' : 'default',
            ...style,
          }}
          onClick={handleClick}
          alt={accessibleTitle}
          loading="lazy"
          onError={handleIconLoadError}
        />
      );
    }

    // If previous icon loading failed and we have a SVG URL, use it
    if ((iconLoadError || !resolvedIcon.includes(':')) && renderableSvgUrl) {
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          src={renderableSvgUrl}
          width={finalSize}
          height={finalSize}
          style={{
            cursor: onClick ? 'pointer' : 'default',
            ...style,
          }}
          onClick={handleClick}
          alt={accessibleTitle}
          onError={handleIconLoadError}
        />
      );
    }

    // If the icon has the custom: prefix, we need to handle it
    // The custom prefix is registered in our iconify collection
    const iconId = resolvedIcon.startsWith('custom:') 
      ? resolvedIcon  // The prefix is part of our collection name
      : resolvedIcon;

    return (
      <Icon
        icon={iconId}
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
        onError={handleIconLoadError}
      />
    );
  };

  return (
    <div
      title={accessibleTitle}
      className="smart-icon-wrapper"
      style={{ display: 'inline-block' }}
    >
      {renderIcon()}
    </div>
  );
};

export default SmartIcon;

// Utility component for node-specific icons
export const NodeIcon: React.FC<{
  nodeType: string;
  provider?: string;
  technology?: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  svgUrl?: string;
}> = ({ nodeType, provider, technology, color, className = '', style = {}, svgUrl }) => {
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
      color={color}
      size="context"
      className={`node-icon ${className}`}
      style={nodeIconStyle}
      svgUrl={svgUrl}
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
  svgUrl?: string;
}> = ({ nodeType, provider, technology, className = '', onClick, svgUrl }) => {
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
      svgUrl={svgUrl}
    />
  );
};

// Utility component for header icons
export const HeaderIcon: React.FC<{
  nodeType: string;
  provider?: string;
  technology?: string;
  className?: string;
  svgUrl?: string;
}> = ({ nodeType, provider, technology, className = '', svgUrl }) => {
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
      svgUrl={svgUrl}
    />
  );
}; 

// Utility: ensure Supabase Storage URLs are display-friendly
// By default, the "Content-Disposition: attachment" endpoint sets the response header
// which causes browsers to download the file instead of rendering it
// inside an <img> tag. Replacing it with the "Content-Disposition: inline" endpoint
// forces an inline response that is safe to embed.  This logic converts
// URLs returned by the backend so icons can display correctly.
const toRenderableSupabaseUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  try {
    const OBJECT_MARKER = "/storage/v1/object/";
    const RENDER_MARKER = "/storage/v1/render/image/";
    // Only transform once
    if (url.includes(OBJECT_MARKER)) {
      return url.replace(OBJECT_MARKER, RENDER_MARKER);
    }
  } catch (_e) {
    // Fallback – just return original URL if anything goes wrong
  }
  return url;
}; 