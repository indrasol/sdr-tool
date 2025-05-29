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
  const [retryCount, setRetryCount] = useState(0);
  const [useFallback, setUseFallback] = useState(false);

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
  const provider = getProvider();
  const isMicroserviceIcon = className?.includes('microservice') || url.includes('microservice');
  const isDatabaseIcon = className?.includes('database') || url.includes('database-icons');
  const isDatabaseTypeIcon = className?.includes('databasetype') || url.includes('databasetype-icons');
  const isNetworkIcon = className?.includes('network') || url.includes('network-icons');
  const isWafIcon = className?.includes('waf') || url.toLowerCase().includes('waf');

  // Generate a fallback SVG for when loading fails
  const generateFallbackSvg = () => {
    let color = '#808080'; // Default gray
    let icon = '⬛'; // Default square
    
    // Choose color and symbol based on provider
    if (provider === 'network' || isNetworkIcon) {
      color = '#DC3545'; // Network red
      icon = isWafIcon ? '🛡️' : '🔌';
    } else if (provider === 'database' || isDatabaseIcon) {
      color = '#1976D2'; // Database blue
      icon = '💾';
    } else if (provider === 'application') {
      color = '#34A853'; // Application green
      icon = isMicroserviceIcon ? '⚙️' : '📱';
    } else if (provider === 'client') {
      color = '#7C65F6'; // Client purple
      icon = '🖥️';
    }
    
    // Create a simple SVG with the icon text
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">
      <rect width="100%" height="100%" fill="${color}" opacity="0.1" rx="8" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="32">${icon}</text>
    </svg>`;
  };

  useEffect(() => {
    // Reset states when URL changes
    if (retryCount === 0) {
      setIsLoading(true);
      setError(null);
      setIsPngImage(false);
      setIsDataUrl(false);
      setUseFallback(false);
    }

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
        const controller = new AbortController();
        
        // Set a timeout to abort the fetch if it takes too long
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        console.log(`Fetching SVG (attempt ${retryCount + 1}):`, url);
        const response = await fetch(url, { signal: controller.signal });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch SVG: ${response.status} ${response.statusText}`);
        }
        
        const svgText = await response.text();
        
        // Detect if the SVG content is valid - it should contain <svg tag
        if (!svgText.includes('<svg') && !svgText.includes('<SVG')) {
          throw new Error('Invalid SVG content');
        }
        
        // Process the SVG content based on provider
        let processedSvg = svgText;

        // Ensure SVG has width and height attributes
        if (!svgText.includes('width=') && !svgText.includes('height=')) {
          processedSvg = processedSvg.replace(/<svg/, '<svg width="100%" height="100%"');
        } else {
          // Replace any fixed width/height with 100%
          processedSvg = processedSvg.replace(/width="[^"]*"/, 'width="100%"');
          processedSvg = processedSvg.replace(/height="[^"]*"/, 'height="100%"');
        }
        
        // Force viewBox to ensure proper scaling if not present
        if (!processedSvg.includes('viewBox')) {
          processedSvg = processedSvg.replace(/<svg/, '<svg viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet"');
        } else {
          processedSvg = processedSvg.replace(/preserveAspectRatio="[^"]*"/, 'preserveAspectRatio="xMidYMid meet"');
          if (!processedSvg.includes('preserveAspectRatio')) {
            processedSvg = processedSvg.replace(/viewBox="[^"]*"/, '$& preserveAspectRatio="xMidYMid meet"');
          }
        }

        // Remove any unwanted background or container elements from SVG
        if (isMicroserviceIcon || provider === 'application') {
          // Replace any background rect with transparent fill
          processedSvg = processedSvg.replace(/<rect[^>]*fill=["'][^"']*["']/g, match => 
            match.replace(/fill=["'][^"']*["']/, 'fill="transparent"')
          );
          
          // Remove any container groups that might cause appearance issues
          processedSvg = processedSvg.replace(/<g[^>]*>(\s*)<rect[^>]*\/>/g, '$1');
        }

        // Add appropriate fill color based on provider
        if (provider === 'aws') {
          // Force white fill for AWS icons
          processedSvg = processedSvg.replace(/<path(?![^>]*fill=)/g, '<path fill="white"');
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
        // Apply coloring for network icons to ensure visibility
        else if (provider === 'network' || isNetworkIcon) {
          // Ensure network icons have proper coloring, especially WAF
          const networkColor = isWafIcon ? "#DC3545" : "#DC3545"; // Default to red for network icons
          
          // Only apply fill if the SVG doesn't already have specific fill attributes
          if (!svgText.includes('fill=') || svgText.includes('fill="none"')) {
            processedSvg = processedSvg.replace(/<svg/, `<svg fill="${networkColor}"`);
            processedSvg = processedSvg.replace(/<path(?![^>]*fill=)/g, `<path fill="${networkColor}"`);
          }
        }
        // Apply coloring for application icons to ensure visibility
        else if (provider === 'application' && (!svgText.includes('fill=') || isMicroserviceIcon)) {
          processedSvg = processedSvg.replace(/<svg/, '<svg fill="currentColor"');
          // Make sure paths have proper fill too
          processedSvg = processedSvg.replace(/<path(?![^>]*fill=)/g, '<path fill="currentColor"');
        }
        // For other icons without specific fill
        else if (!svgText.includes('fill=') && !svgText.includes('style=')) {
          processedSvg = processedSvg.replace(/<svg/, '<svg fill="currentColor"');
        }

        setSvgContent(processedSvg);
        setError(null);
        console.log(`Successfully processed SVG for ${provider}:`, url);
      } catch (err) {
        console.error("Error fetching SVG:", err, url);
        setError(err instanceof Error ? err.message : "Unknown error");
        
        // Retry logic for network errors or timeouts
        if (retryCount < 2) {
          setTimeout(() => {
            setRetryCount(retryCount + 1);
          }, 1000); // Wait 1 second before retry
        } else {
          // After retries, use fallback
          console.warn(`Failed to load SVG after ${retryCount} retries, using fallback:`, url);
          setUseFallback(true);
          setSvgContent(generateFallbackSvg());
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (url && !isPngImage && !isDataUrl && !useFallback) {
      fetchSvg();
    }
  }, [url, retryCount, isPngImage, isDataUrl, useFallback, className, isMicroserviceIcon, isDatabaseIcon, isDatabaseTypeIcon, isNetworkIcon, isWafIcon, provider]);

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
          onError={(e) => {
            console.error("Image load error, using fallback:", url);
            setUseFallback(true);
            setSvgContent(generateFallbackSvg());
          }}
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
        onError={(e) => {
          console.error("PNG image load error, using fallback:", url);
          setUseFallback(true);
          setSvgContent(generateFallbackSvg());
        }}
      />
    );
  }

  if (useFallback) {
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
        dangerouslySetInnerHTML={{ __html: svgContent || generateFallbackSvg() }}
      />
    );
  }

  if (error || !svgContent) {
    console.error("SVG loading error, using fallback:", error, url);
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
        dangerouslySetInnerHTML={{ __html: generateFallbackSvg() }}
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