import React, { useEffect, useRef } from 'react';

interface MermaidCanvasProps {
  code: string;
}

const MermaidCanvas: React.FC<MermaidCanvasProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!code) return;

    let mermaidInstance: any;

    const renderDiagram = async () => {
      if (!containerRef.current) return;

      // Dynamically import mermaid to avoid global side-effects on other pages
      const mermaid = (await import('mermaid')).default;

      // Ensure we configure only once per render
      if (!mermaidInstance) {
        mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });
        mermaidInstance = mermaid;
      }

      const id = `mermaid-seq-${Date.now()}`;
      try {
        const { svg } = await mermaid.render(id, code);
        containerRef.current!.innerHTML = svg;
      } catch (err) {
        console.error('Mermaid render error:', err);
        containerRef.current!.innerHTML = `<pre style="color:red;">Mermaid parse error</pre>`;
      }
    };

    renderDiagram();
  }, [code]);

  return <div ref={containerRef} className="w-full h-full overflow-auto bg-white p-4" />;
};

export default MermaidCanvas; 