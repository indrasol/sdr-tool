import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
// Static import as fallback for dynamic import issues
import mermaidStatic from 'mermaid';

interface MermaidCanvasProps {
  code: string;
}

export interface MermaidCanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
  resetView: () => void;
}

const MermaidCanvas = forwardRef<MermaidCanvasRef, MermaidCanvasProps>(({ code }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });

  // Expose zoom controls to parent via ref
  useImperativeHandle(ref, () => ({
    zoomIn: () => setZoom(prev => Math.min(prev * 1.2, 3)),
    zoomOut: () => setZoom(prev => Math.max(prev / 1.2, 0.3)),
    fitView: () => {
      if (containerRef.current && contentRef.current) {
        const container = containerRef.current.getBoundingClientRect();
        const content = contentRef.current.getBoundingClientRect();
        
        const scaleX = container.width / originalDimensions.width;
        const scaleY = container.height / originalDimensions.height;
        const scale = Math.min(scaleX, scaleY, 1) * 0.9; // 90% of container
        
        setZoom(scale);
        setPanX(0);
        setPanY(0);
      }
    },
    resetView: () => {
      setZoom(1);
      setPanX(0);
      setPanY(0);
    }
  }));

  useEffect(() => {
    if (!code) return;

    let mermaidInstance: any;

    const renderDiagram = async () => {
      if (!containerRef.current || !contentRef.current) return;

      let mermaid;
      
      try {
        // Try dynamic import first
        const mermaidModule = await import('mermaid');
        mermaid = mermaidModule.default || mermaidModule;
      } catch (importErr) {
        console.warn('Dynamic mermaid import failed, using static import:', importErr);
        // Fallback to static import
        mermaid = mermaidStatic;
      }

      try {
        // Ensure we configure only once per render
        if (!mermaidInstance) {
          mermaid.initialize({ 
            startOnLoad: false, 
            securityLevel: 'loose',
            theme: 'default'
          });
          mermaidInstance = mermaid;
        }

        const id = `mermaid-seq-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        contentRef.current.innerHTML = svg;
        
        // Get original dimensions after rendering
        const svgElement = contentRef.current.querySelector('svg');
        if (svgElement) {
          const bbox = svgElement.getBBox();
          setOriginalDimensions({
            width: bbox.width || 800,
            height: bbox.height || 600
          });
          
          // Make SVG responsive
          svgElement.style.width = '100%';
          svgElement.style.height = '100%';
          svgElement.removeAttribute('width');
          svgElement.removeAttribute('height');
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        contentRef.current.innerHTML = `<pre style="color:red;">Mermaid diagram error: ${err.message || 'Invalid syntax'}</pre>`;
      }
    };

    renderDiagram();
  }, [code]);

  // Handle mouse events for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.3), 3));
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-white p-4 relative cursor-move"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div
        ref={contentRef}
        className="w-full h-full flex items-center justify-center"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: 'center',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      />
      
      {/* Zoom indicator */}
      <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
});

MermaidCanvas.displayName = 'MermaidCanvas';

export default MermaidCanvas; 