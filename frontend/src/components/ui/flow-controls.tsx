
// FlowControls.tsx - Logic wrapper component
import { Edge, Node, useReactFlow } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { CustomControls, type CustomControlsProps } from './custom-controls';

import { useState } from 'react';

const FlowControls = (props: Omit<CustomControlsProps, 'onGenerateReport'>) => {
    const reactFlowInstance = useReactFlow();
    const [loading, setLoading] = useState(false);
    const [reportContent, setReportContent] = useState('');
    const [reportUrl, setReportUrl] = useState('');
    const [showReportDialog, setShowReportDialog] = useState(false);

    const formatNodes = (nodes: Node[]) => {
        return nodes.map(node => ({
          id: node.id,
          type: node.type || 'default',
          properties: node.data?.properties || {},
          position: [node.position.x, node.position.y] as [number, number]
        }));
      };
    
    const formatEdges = (edges: Edge[]) => {
    return edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default'
    }));
    };

    const captureFlow = async (): Promise<Blob> => {
        const flowElement = document.querySelector('.react-flow');
        if (!flowElement) throw new Error('Flow element not found');

        try {
        // Filter out problematic fonts and elements
        const filter = (node: HTMLElement) => {
            const exclusionClasses = ['react-flow__minimap', 'react-flow__controls'];
            return !exclusionClasses.some(className => 
            node.classList?.contains(className)
            );
        };

        const dataUrl = await toPng(flowElement as HTMLElement, {
            backgroundColor: '#ffffff',
            quality: 1,
            pixelRatio: 2,
            filter,
            fontEmbedCSS: '', // Disable font embedding
            style: {
            // Add any default styles needed
            },
        });

        const res = await fetch(dataUrl);
        return res.blob();
        } catch (error) {
        console.error('Error capturing flow:', error);
        throw error;
        }
    };
  
    const handleGenerateReport = async () => {
      try {
        console.log('Generating report...');
        setLoading(true);

        // Format nodes and edges according to the backend model
        const formattedNodes = formatNodes(reactFlowInstance.getNodes());
        const formattedEdges = formatEdges(reactFlowInstance.getEdges());
        // const nodesForBackend = reactFlowInstance.getNodes().map(node => ({
        //   id: node.id,
        //   type: node.type,
        //   properties: node.data.properties,
        //   position: [node.position.x, node.position.y],
        // }));
        
        // const edgesForBackend = reactFlowInstance.getEdges().map(edge => [edge.source, edge.target]);

        // Get diagram screenshot
        const imageBlob = await captureFlow();

        // Prepare form data
        const formData = new FormData();
        formData.append('image', imageBlob, 'diagram.png');
        formData.append('context', JSON.stringify({
          nodes: formattedNodes,
          edges: formattedEdges,
        }));
  
        // Generate report
        const reportResponse = await fetch('http://localhost:8000/api/routes/generate_report', {
          method: 'POST',
          body: formData
        });
  
        if (!reportResponse.ok) {
          throw new Error('Failed to generate report');
        }
  
        const data = await reportResponse.json();
        return data

        // Fetch the report content
        // const reportContentResponse = await fetch(data.report_url);
        // if (!reportContentResponse.ok) {
        // throw new Error('Failed to fetch report content');
        // }
        
        // const reportContent = await reportContentResponse.text();
        
        // Set the report content and URL in state
        // setReportContent(reportContent);
        // setReportUrl(data.report_url);
        // setShowReportDialog(true);

        // console.log('Report generated:', data);
        
        // Handle the response
        // window.open(data.report_url, '_blank');
  
      } catch (error) {
        console.error('Error generating report:', error);
        throw error;
      }
    };
  
    return <CustomControls {...props} onGenerateReport={handleGenerateReport} />;
  };
  
  export { FlowControls };