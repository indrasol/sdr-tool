import { toPng } from 'html-to-image';

export interface DiagramCaptureOptions {
  backgroundColor?: string;
  pixelRatio?: number;
  quality?: number;
  padding?: number;
}

/**
 * Captures a diagram as PNG image with proper bounds calculation
 * Reuses the logic from DiagramActions for consistency
 */
export const captureDiagramImage = async (
  options: DiagramCaptureOptions = {}
): Promise<string> => {
  const {
    backgroundColor = '#ffffff',
    pixelRatio = 2,
    quality = 1.0,
    padding = 50
  } = options;

  // First, try to apply fit view to ensure all content is visible
  const reactFlowInstance = (window as any).__rf__?.getInstance?.();
  if (reactFlowInstance && reactFlowInstance.fitView) {
    try {
      console.log('Applying fit view before capture');
      reactFlowInstance.fitView({ padding: 0.2, duration: 0 }); // No animation for capture
      
      // Wait for fit view to take effect
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn('Could not apply fit view before capture:', error);
    }
  }

  const reactFlowWrapper = document.querySelector('.react-flow') as HTMLElement;
  const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
  
  if (!reactFlowWrapper || !viewport) {
    throw new Error('Could not find diagram elements');
  }
  
  // Get all nodes and edges to calculate proper bounds
  const nodes = viewport.querySelectorAll('.react-flow__node');
  const edges = viewport.querySelectorAll('.react-flow__edge');
  
  if (nodes.length === 0) {
    throw new Error('No diagram content found');
  }
  
  // Calculate the actual bounds of all content
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  // Process nodes to get their actual positions
  nodes.forEach(node => {
    const style = window.getComputedStyle(node);
    const transform = style.transform;
    
    if (transform && transform !== 'none') {
      // Parse transform matrix to get x, y coordinates
      const matrix = transform.match(/matrix.*\((.+)\)/);
      if (matrix) {
        const values = matrix[1].split(', ');
        const x = parseFloat(values[4]) || 0;
        const y = parseFloat(values[5]) || 0;
        
        // Get node dimensions with more robust size calculation
        const rect = node.getBoundingClientRect();
        const nodeWidth = parseFloat(style.width) || rect.width || 120; // Default width
        const nodeHeight = parseFloat(style.height) || rect.height || 60; // Default height
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + nodeWidth);
        maxY = Math.max(maxY, y + nodeHeight);
      }
    }
  });
  
  // Also check edges for complete bounds
  edges.forEach(edge => {
    const pathElement = edge.querySelector('path');
    if (pathElement) {
      try {
        const bbox = pathElement.getBBox();
        const edgeTransform = window.getComputedStyle(edge).transform;
        
        let edgeX = 0, edgeY = 0;
        if (edgeTransform && edgeTransform !== 'none') {
          const matrix = edgeTransform.match(/matrix.*\((.+)\)/);
          if (matrix) {
            const values = matrix[1].split(', ');
            edgeX = parseFloat(values[4]) || 0;
            edgeY = parseFloat(values[5]) || 0;
          }
        }
        
        minX = Math.min(minX, bbox.x + edgeX);
        minY = Math.min(minY, bbox.y + edgeY);
        maxX = Math.max(maxX, bbox.x + bbox.width + edgeX);
        maxY = Math.max(maxY, bbox.y + bbox.height + edgeY);
      } catch (error) {
        console.warn('Could not get edge bounds:', error);
      }
    }
  });
  
  // Ensure we have valid bounds
  if (minX === Infinity || maxX === -Infinity) {
    console.warn('Could not determine diagram bounds, using fallback');
    minX = 0;
    minY = 0;
    maxX = 800;
    maxY = 600;
  }
  
  // Add padding around the content with minimum size constraints
  const contentWidth = Math.max(maxX - minX + (padding * 2), 400); // Minimum 400px width
  const contentHeight = Math.max(maxY - minY + (padding * 2), 300); // Minimum 300px height
  
  console.log('Diagram capture bounds:', { minX, minY, maxX, maxY, contentWidth, contentHeight });
  
  // Store original styles
  const originalViewportTransform = viewport.style.transform;
  const originalWrapperStyles = {
    width: reactFlowWrapper.style.width,
    height: reactFlowWrapper.style.height,
    overflow: reactFlowWrapper.style.overflow
  };
  
  // Calculate new transform to center the content
  const newTranslateX = -minX + padding;
  const newTranslateY = -minY + padding;
  
  // Apply new transform to viewport
  viewport.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px) scale(1)`;
  
  // Adjust wrapper size to fit content
  reactFlowWrapper.style.width = contentWidth + 'px';
  reactFlowWrapper.style.height = contentHeight + 'px';
  reactFlowWrapper.style.overflow = 'hidden';
  
  // Hide UI elements that shouldn't be in the capture
  const elementsToHide = [
    '.react-flow__minimap',
    '.react-flow__controls',
    '.react-flow__attribution',
    '.react-flow__panel',
    '.react-flow__background', // Hide background pattern for cleaner capture
    '.threat-tooltip', // hide threat popovers
    '[data-radix-popper-content-wrapper]',
    '[role="tooltip"]'
  ];
  
  const hiddenElements: { element: HTMLElement, originalDisplay: string }[] = [];
  
  elementsToHide.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const element = el as HTMLElement;
      hiddenElements.push({
        element,
        originalDisplay: element.style.display
      });
      element.style.display = 'none';
    });
  });
  
  // Wait for layout changes and edge rendering to stabilize
  await new Promise(requestAnimationFrame);
  await new Promise(resolve => setTimeout(resolve, 300)); // additional buffer
  
  // Fix edge label backgrounds before capturing
  const edgeLabels = document.querySelectorAll('.react-flow__edge-text-bg');
  const edgeLabelStyles: { element: HTMLElement, originalFill: string }[] = [];
  
  // Make edge label backgrounds transparent for capture
  edgeLabels.forEach(labelBg => {
    const element = labelBg as HTMLElement;
    const originalFill = element.getAttribute('fill') || '#000';
    edgeLabelStyles.push({ element, originalFill });
    element.setAttribute('fill', 'transparent');
  });
  
  try {
    // Capture the image with exact dimensions and enhanced options
    const dataUrl = await toPng(reactFlowWrapper, {
      quality,
      backgroundColor,
      pixelRatio,
      width: contentWidth,
      height: contentHeight,
      skipAutoScale: true,
      cacheBust: true,
      includeQueryParams: true, // Include query params for better font loading
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif', // Ensure consistent fonts
      },
      filter: (node) => {
        if (node.getAttribute && node.getAttribute('role') === 'tooltip') return false;
        if (node.classList) {
          return !node.classList.contains('react-flow__minimap') &&
                 !node.classList.contains('react-flow__controls') &&
                 !node.classList.contains('react-flow__attribution') &&
                 !node.classList.contains('threat-tooltip');
        }
        return true;
      }
    });
    
    console.log('Successfully captured diagram image');
    
    // Restore all original styles
    viewport.style.transform = originalViewportTransform;
    reactFlowWrapper.style.width = originalWrapperStyles.width;
    reactFlowWrapper.style.height = originalWrapperStyles.height;
    reactFlowWrapper.style.overflow = originalWrapperStyles.overflow;
    
    // Restore hidden elements
    hiddenElements.forEach(({ element, originalDisplay }) => {
      element.style.display = originalDisplay;
    });
    
    // Restore edge label backgrounds
    edgeLabelStyles.forEach(({ element, originalFill }) => {
      element.setAttribute('fill', originalFill);
    });
    
    return dataUrl;
  } catch (error) {
    console.error('Error during diagram capture:', error);
    
    // Restore all original styles even if capture failed
    viewport.style.transform = originalViewportTransform;
    reactFlowWrapper.style.width = originalWrapperStyles.width;
    reactFlowWrapper.style.height = originalWrapperStyles.height;
    reactFlowWrapper.style.overflow = originalWrapperStyles.overflow;
    
    // Restore hidden elements
    hiddenElements.forEach(({ element, originalDisplay }) => {
      element.style.display = originalDisplay;
    });
    
    // Restore edge label backgrounds
    edgeLabelStyles.forEach(({ element, originalFill }) => {
      element.setAttribute('fill', originalFill);
    });
    
    throw error;
  }
}; 