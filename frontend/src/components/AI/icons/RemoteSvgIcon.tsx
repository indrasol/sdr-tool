import React, { useEffect, useState } from 'react';

interface RemoteSvgIconProps {
  url: string;
  size?: number;
  className?: string;
}

const RemoteSvgIcon: React.FC<RemoteSvgIconProps> = ({ 
  url, 
  size = 48,
  className = ""
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPngImage, setIsPngImage] = useState(false);
  const [isDataUrl, setIsDataUrl] = useState(false);

  // Determine provider based on URL or className
  const getProvider = () => {
    if (className?.includes('aws')) return 'aws';
    if (className?.includes('gcp')) return 'gcp';
    if (className?.includes('network')) return 'network';
    if (className?.includes('azure')) return 'azure';
    if (className?.includes('client')) return 'client';
    if (className?.includes('application')) return 'application';
    if (className?.includes('database')) return 'database';
    if (className?.includes('databasetype')) return 'databasetype';
    
    if (url.includes('aws-icons')) return 'aws';
    if (url.includes('gcp-icons')) return 'gcp';
    if (url.includes('azure-icons')) return 'azure';
    if (url.includes('client-icons')) return 'client';
    if (url.includes('network-icons')) return 'network';
    if (url.includes('application-icons')) return 'application';
    if (url.includes('database-icons')) return 'database';
    if (url.includes('databasetype-icons')) return 'databasetype';
    
    return 'generic';
  };

  // Check if this is a special icon type
  const isMicroserviceIcon = className?.includes('microservice') || url.includes('microservice');
  const isDatabaseIcon = className?.includes('database') || url.includes('database-icons');
  const isDatabaseTypeIcon = className?.includes('databasetype') || url.includes('databasetype-icons');

  useEffect(() => {
    // Check if the URL is a data URL for SVG
    if (url.startsWith('data:image/svg+xml')) {
      setIsDataUrl(true);
      setIsLoading(false);
      return;
    }

    // Check if the URL is a PNG image
    if (url.toLowerCase().endsWith('.png')) {
      setIsPngImage(true);
      setIsLoading(false);
      return;
    }

    const fetchSvg = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch SVG: ${response.status} ${response.statusText}`);
        }
        
        const svgText = await response.text();
        
        // Process the SVG content based on provider
        const provider = getProvider();
        let processedSvg = svgText;

        // Remove any unwanted background or container elements from SVG
        // Look for rect or circle elements that might be backgrounds
        if (isMicroserviceIcon || provider === 'application') {
          // Replace any background rect with transparent fill
          processedSvg = processedSvg.replace(/<rect[^>]*fill=["'][^"']*["']/g, match => 
            match.replace(/fill=["'][^"']*["']/, 'fill="transparent"')
          );
          
          // Remove any container groups that might cause appearance issues
          processedSvg = processedSvg.replace(/<g[^>]*>(\s*)<rect[^>]*\/>/g, '$1');
        }

        // Ensure SVG has width and height attributes
        if (!svgText.includes('width=') && !svgText.includes('height=')) {
          processedSvg = processedSvg.replace(/<svg/, '<svg width="100%" height="100%"');
        } else {
          // Replace any fixed width/height with 100%
          processedSvg = processedSvg.replace(/width="[^"]*"/, 'width="100%"');
          processedSvg = processedSvg.replace(/height="[^"]*"/, 'height="100%"');
        }
        
        // Force viewBox to ensure proper scaling
        if (!processedSvg.includes('viewBox')) {
          processedSvg = processedSvg.replace(/<svg/, '<svg viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet"');
        } else {
          processedSvg = processedSvg.replace(/preserveAspectRatio="[^"]*"/, 'preserveAspectRatio="xMidYMid meet"');
          if (!processedSvg.includes('preserveAspectRatio')) {
            processedSvg = processedSvg.replace(/viewBox="[^"]*"/, '$& preserveAspectRatio="xMidYMid meet"');
          }
        }

        // Add appropriate fill color based on provider
        if (provider === 'aws') {
          // Force white fill for AWS icons
          processedSvg = processedSvg.replace(/<path/g, '<path fill="white"');
          processedSvg = processedSvg.replace(/<svg/, '<svg fill="white"');
        } else if (provider === 'gcp') {
          processedSvg = processedSvg.replace(/<svg/, '<svg fill="#4285F4"');
        } 
        // Apply coloring for database icons
        else if (provider === 'database' || isDatabaseIcon) {
          // Use blue color for database icons since they have no background
          processedSvg = processedSvg.replace(/<svg/, '<svg fill="#1976D2"');
          // Make sure paths have proper fill too if not already specified
          processedSvg = processedSvg.replace(/<path(?![^>]*fill=)/g, '<path fill="#1976D2"');
        } 
        // Apply coloring for database type icons
        else if (provider === 'databasetype' || isDatabaseTypeIcon) {
          // Use darker blue color for database type icons
          processedSvg = processedSvg.replace(/<svg/, '<svg fill="#0D47A1"');
          // Make sure paths have proper fill too if not already specified
          processedSvg = processedSvg.replace(/<path(?![^>]*fill=)/g, '<path fill="#0D47A1"');
        }
        // Apply coloring for application icons to ensure visibility
        else if (provider === 'application' && (!svgText.includes('fill=') || isMicroserviceIcon)) {
          processedSvg = processedSvg.replace(/<svg/, '<svg fill="currentColor"');
          // Make sure paths have proper fill too
          processedSvg = processedSvg.replace(/<path(?![^>]*fill=)/g, '<path fill="currentColor"');
        }
        // Removing forced coloring for network icons to preserve original colors
        else if (!svgText.includes('fill=') && !svgText.includes('style=')) {
          processedSvg = processedSvg.replace(/<svg/, '<svg fill="currentColor"');
        }

        setSvgContent(processedSvg);
        setError(null);
      } catch (err) {
        console.error("Error fetching SVG:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    if (url && !isPngImage && !isDataUrl) {
      fetchSvg();
    }
  }, [url, isPngImage, isDataUrl, className, isMicroserviceIcon, isDatabaseIcon, isDatabaseTypeIcon]);

  if (isLoading) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`inline-block animate-pulse bg-transparent ${className}`} 
      />
    );
  }

  if (isDataUrl) {
    // For all icons, preserve original colors without applying text color classes
    return (
      <div className={`inline-block ${className}`} style={{ 
        width: size, 
        height: size,
        background: 'transparent',
        border: 'none'
      }}>
        <img
          src={url}
          alt="Icon"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    );
  }

  if (isPngImage) {
    return (
      <img
        src={url}
        alt="Icon"
        style={{ 
          width: size, 
          height: size, 
          objectFit: 'contain',
          background: 'transparent' 
        }}
        className={`inline-block ${className}`}
      />
    );
  }

  if (error || !svgContent) {
    console.error("SVG loading error:", error);
    return (
      <div 
        style={{ width: size, height: size }}
        className={`inline-block bg-transparent ${className}`}
      />
    );
  }

  return (
    <div
      style={{ 
        width: size, 
        height: size,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none'
      }}
      className={`inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default RemoteSvgIcon; 