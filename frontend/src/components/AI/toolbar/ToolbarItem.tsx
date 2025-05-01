import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ToolbarItemProps } from './ToolbarTypes';
import { getCategoryStyle } from '../utils/nodeStyles';
import awsStyles from '../icons/AWSIcons.module.css';
import azureStyles from '../icons/AzureIcons.module.css';
import gcpStyles from '../icons/GCPIcons.module.css';
import applicationStyles from '../icons/ApplicationIcons.module.css';
import clientStyles from '../icons/ClientIcons.module.css';
import networkStyles from '../icons/NetworkIcons.module.css';
import ReactDOM from 'react-dom';

const ToolbarItem: React.FC<ToolbarItemProps> = ({ tool, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  
  // Ensure consistent access to bgColor
  const categoryStyle = getCategoryStyle(tool.category);
  const backgroundColorToUse = tool.bgColor || categoryStyle.bgColor;
  
  // Check if the icon is a remote SVG/PNG (cloud provider icon)
  const isRemoteIcon = typeof tool.icon === 'function' && (tool.icon as any).url;
  const IconComponent = tool.icon;
  
  // Special styling for cloud provider icons
  const isGCPIcon = tool.provider === 'GCP' && isRemoteIcon;
  const isAWSIcon = tool.provider === 'AWS' && isRemoteIcon;
  const isAzureIcon = tool.provider === 'Azure' && isRemoteIcon;
  const isApplicationIcon = tool.provider === 'Generic' && tool.category === 'Application' && isRemoteIcon;
  const isClientIcon = tool.provider === 'Generic' && tool.category === 'Client' && isRemoteIcon;
  const isNetworkIcon = tool.provider === 'Generic' && tool.category === 'Network' && isRemoteIcon;
  
  // Get the appropriate styles based on provider
  const getTooltipStyles = () => {
    if (isAWSIcon) return awsStyles;
    if (isAzureIcon) return azureStyles;
    if (isApplicationIcon) return applicationStyles;
    if (isClientIcon) return clientStyles;
    if (isNetworkIcon) return networkStyles;
    return gcpStyles; // Default to GCP styles
  };
  
  const tooltipStyles = getTooltipStyles();
  
  // Render a portal tooltip outside the toolbar
  const renderTooltip = () => {
    if (!isHovered || !tool.description) return null;
    
    const portalContainer = document.body;
    if (!portalContainer || !itemRef.current) return null;
    
    const rect = itemRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Determine if tooltip should be positioned on left or right
    // If icon is in the right third of the screen, position tooltip to the left
    const tooltipWidth = 350; // Must match max-width in CSS
    const isRightSide = rect.right > (viewportWidth * 0.7);
    
    // Calculate position based on which side to display the tooltip
    let leftPosition;
    if (isRightSide) {
      leftPosition = Math.max(rect.left - tooltipWidth - 20, 20); // Left of icon
    } else {
      leftPosition = Math.min(rect.right + 20, viewportWidth - tooltipWidth - 20); // Right of icon
    }
    
    // Calculate top position to ensure tooltip is not cut off at top/bottom
    let topPosition = rect.top + rect.height / 2;
    const tooltipHeight = 150; // Approximate height, adjust if needed
    const maxTop = viewportHeight - tooltipHeight / 2 - 20;
    const minTop = tooltipHeight / 2 + 20;
    
    if (topPosition > maxTop) topPosition = maxTop;
    if (topPosition < minTop) topPosition = minTop;
    
    const tooltipStyle = {
      position: 'fixed',
      left: `${leftPosition}px`,
      top: `${topPosition}px`,
      transform: 'translateY(-50%)',
      zIndex: 9999,
      opacity: 1
    } as React.CSSProperties;
    
    // For positioning the arrow correctly
    const arrowStyle = {
      top: `${(rect.top + rect.height / 2) - topPosition + 50}%`,
      // Set left/right based on tooltip position
      ...(isRightSide 
        ? { left: '100%', transform: 'rotate(180deg)' } 
        : { right: '100%' })
    } as React.CSSProperties;
    
    return ReactDOM.createPortal(
      <div className={tooltipStyles.tooltip} style={tooltipStyle}>
        <div 
          className={tooltipStyles.tooltipArrow} 
          style={arrowStyle}
        />
        <div className={tooltipStyles.tooltipTitle}>{tool.tooltipTitle || tool.label}</div>
        <div>{tool.description}</div>
      </div>,
      portalContainer
    );
  };
  
  return (
    <motion.div
      ref={itemRef}
      onClick={() => onClick(tool)}
      className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-center group relative"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`
          w-16 h-16 flex items-center justify-center rounded-lg shrink-0 mb-2 
          ${isGCPIcon || isAWSIcon || isAzureIcon || isApplicationIcon || isClientIcon || isNetworkIcon ? 'bg-white shadow-sm border border-gray-100' : ''} 
          transition-all duration-200 overflow-hidden
        `} 
        style={{ 
          backgroundColor: (isGCPIcon || isAWSIcon || isAzureIcon || isApplicationIcon || isClientIcon || isNetworkIcon) ? 'white' : (backgroundColorToUse !== 'transparent' ? backgroundColorToUse : undefined),
          boxShadow: (isGCPIcon || isAWSIcon || isAzureIcon || isApplicationIcon || isClientIcon || isNetworkIcon) ? '0 2px 5px rgba(0,0,0,0.08)' : undefined
        }}
      >
        {isRemoteIcon ? (
          <IconComponent />
        ) : (
          <IconComponent className="text-white" size={32} />
        )}
      </div>
      <span className="text-xs font-medium truncate max-w-full">{tool.label}</span>
      
      {/* External tooltip rendered via portal */}
      {renderTooltip()}
    </motion.div>
  );
};

export default ToolbarItem;