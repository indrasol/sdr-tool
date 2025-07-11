import { Node, Edge, MarkerType } from '@xyflow/react';
import elk from './elkSingleton';

export interface LayoutOpts {
  direction?: 'LR' | 'TB' | 'BT' | 'RL';
  nodeWidth?: number;
  nodeHeight?: number;
  engine?: 'auto' | 'elk' | 'dagre' | 'basic';
  enablePerformanceMonitoring?: boolean;
}

export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
  engineUsed: string;
  executionTime: number;
  qualityScore: number;
  complexityMetrics?: ComplexityMetrics;
  success: boolean;
  errorMessage?: string;
}

export interface ComplexityMetrics {
  nodeCount: number;
  edgeCount: number;
  layerDepth: number;
  edgeDensity: number;
  hasCycles: boolean;
  complexityScore: number;
}

class EnhancedLayoutEngine {
  private performanceHistory: Array<{
    engine: string;
    executionTime: number;
    qualityScore: number;
    timestamp: number;
  }> = [];

  /**
   * Enhanced layout function with multi-engine support and intelligent fallback
   */
  async layoutWithEnhancedEngine(
    nodes: Node[],
    edges: Edge[],
    {
      direction = 'LR',
      nodeWidth = 172,
      nodeHeight = 36,
      engine = 'auto',
      enablePerformanceMonitoring = true
    }: LayoutOpts = {}
  ): Promise<LayoutResult> {
    const startTime = performance.now();

    // Early-out if no nodes to layout
    if (!nodes || nodes.length === 0) {
      return {
        nodes,
        edges,
        engineUsed: 'none',
        executionTime: performance.now() - startTime,
        qualityScore: 1.0,
        success: true
      };
    }

    console.log(`[Enhanced Layout] Starting layout with ${nodes.length} nodes, ${edges.length} edges, engine: ${engine}, direction: ${direction}`);

    try {
      // Analyze complexity for optimal engine selection
      const complexity = this.analyzeComplexity(nodes, edges);
      console.log('[Enhanced Layout] Complexity analysis:', complexity);

      // Determine engine selection strategy
      const selectedEngine = engine === 'auto' ? this.selectOptimalEngine(complexity) : engine;
      console.log(`[Enhanced Layout] Selected engine: ${selectedEngine}`);

      // Apply layout with selected engine
      let result: LayoutResult;

      if (selectedEngine === 'elk') {
        result = await this.layoutWithELK(nodes, edges, { direction, nodeWidth, nodeHeight });
      } else if (selectedEngine === 'dagre') {
        result = await this.layoutWithDagre(nodes, edges, { direction, nodeWidth, nodeHeight });
      } else {
        result = await this.layoutWithBasic(nodes, edges, { direction, nodeWidth, nodeHeight });
      }

      // Calculate execution time and quality
      const executionTime = performance.now() - startTime;
      const qualityScore = this.assessLayoutQuality(result.nodes, complexity);

      // Record performance metrics
      if (enablePerformanceMonitoring) {
        this.recordPerformance(selectedEngine, executionTime, qualityScore);
      }

      console.log(`[Enhanced Layout] Layout completed successfully with ${selectedEngine} in ${executionTime.toFixed(2)}ms, quality: ${qualityScore.toFixed(2)}`);

      return {
        ...result,
        engineUsed: selectedEngine,
        executionTime,
        qualityScore,
        complexityMetrics: complexity,
        success: true
      };

    } catch (error) {
      console.error('[Enhanced Layout] Layout failed:', error);
      
      // Fallback to basic layout on any error
      const basicResult = await this.layoutWithBasic(nodes, edges, { direction, nodeWidth, nodeHeight });
      
      return {
        ...basicResult,
        engineUsed: 'basic-fallback',
        executionTime: performance.now() - startTime,
        qualityScore: 0.5,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown layout error'
      };
    }
  }

  /**
   * Analyze diagram complexity to determine optimal layout engine
   */
  private analyzeComplexity(nodes: Node[], edges: Edge[]): ComplexityMetrics {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;

    // Calculate edge density
    const maxPossibleEdges = nodeCount * (nodeCount - 1) / 2;
    const edgeDensity = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;

    // Estimate layer depth using topological analysis
    const layerDepth = this.estimateLayerDepth(nodes, edges);

    // Check for cycles
    const hasCycles = this.detectCycles(nodes, edges);

    // Calculate overall complexity score
    const complexityScore = this.calculateComplexityScore(
      nodeCount, edgeCount, edgeDensity, layerDepth, hasCycles
    );

    return {
      nodeCount,
      edgeCount,
      layerDepth,
      edgeDensity,
      hasCycles,
      complexityScore
    };
  }

  /**
   * Calculate overall complexity score for engine selection
   */
  private calculateComplexityScore(
    nodeCount: number,
    edgeCount: number,
    edgeDensity: number,
    layerDepth: number,
    hasCycles: boolean
  ): number {
    let score = 0;

    // Node count factor (logarithmic scaling)
    if (nodeCount > 0) {
      score += Math.min(2.0, nodeCount / 20.0);
    }

    // Edge density factor
    score += edgeDensity * 1.5;

    // Layer depth factor
    score += Math.min(1.0, layerDepth / 5.0);

    // Cycle penalty
    if (hasCycles) {
      score += 0.5;
    }

    return score;
  }

  /**
   * Select optimal engine based on complexity metrics
   */
  private selectOptimalEngine(complexity: ComplexityMetrics): string {
    const score = complexity.complexityScore;

    // Complex diagrams (score >= 2.0) - use ELK
    if (score >= 2.0) {
      return 'elk';
    }
    // Medium complexity (score >= 1.0) - use Dagre  
    else if (score >= 1.0) {
      return 'dagre';
    }
    // Simple diagrams - use Basic
    else {
      return 'basic';
    }
  }

  /**
   * Layout with ELK algorithm (enhanced version)
   */
  async layoutWithELK(
    nodes: Node[],
    edges: Edge[],
    { direction = 'LR', nodeWidth = 172, nodeHeight = 36 }: LayoutOpts = {}
  ): Promise<LayoutResult> {
    console.log('[ELK Layout] Starting ELK layout...');

    try {
      // Build ELK compatible graph structure with enhanced options
      const graph: any = {
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': direction,
          'elk.edgeRouting': 'ORTHOGONAL',
          
          // Enhanced node placement for beautiful horizontal flow
          'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
          'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
          'elk.layered.crossingMinimization.semiInteractive': 'true',
          'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
          
          // Optimized spacing for clean architecture visualization
          'elk.spacing.nodeNode': '120',                        
          'elk.layered.spacing.nodeNodeBetweenLayers': '200',  
          'elk.spacing.edgeNode': '50',                        
          'elk.spacing.edgeEdge': '30',                        
          
          // Layer assignment and ranking
          'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
          'elk.layered.cycleBreaking.strategy': 'GREEDY',
          'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
          
          // Port placement for cleaner edge routing
          'elk.portConstraints': 'FIXED_SIDE',
          'elk.layered.unnecessaryBendpoints': 'true',
          'elk.layered.edgeLabels.sideSelection': 'SMART_DOWN',
          
          // Hierarchical layout enhancements
          'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
          'elk.layered.nodePlacement.favorStraightEdges': 'true',
          'elk.layered.compaction.postCompaction.strategy': 'LEFT',
          
          // Enhanced sizing and positioning
          'elk.padding': '[top=80,left=100,bottom=80,right=100]',
          'elk.separateConnectedComponents': 'true',
          'elk.layered.thoroughness': '50',
        },
        children: nodes.map((n) => {
          const isPinned = n.data?.pinned === true;
          const child: any = {
            id: n.id,
            width: n.width ?? nodeWidth,
            height: n.height ?? nodeHeight,
          };
          if (isPinned && n.position) {
            child.layoutOptions = {
              'elk.fixed': 'true',
              'elk.x': `${n.position.x}`,
              'elk.y': `${n.position.y}`,
            };
          }
          return child;
        }),
        edges: edges.map((e) => ({
          id: e.id,
          sources: [e.source],
          targets: [e.target],
        })),
      };

      // Execute ELK layout
      const res = await elk.layout(graph);

      // Map ELK positions back onto React Flow nodes
      const positionedNodes: Node[] = nodes.map((n) => {
        const ln = res.children?.find((c: any) => c.id === n.id);
        if (!ln) return n;
        return {
          ...n,
          position: {
            x: ln.x ?? n.position?.x ?? 0,
            y: ln.y ?? n.position?.y ?? 0,
          },
        };
      });

      // Update edge styling
      const positionedEdges: Edge[] = edges.map((e) => ({
        ...e,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: '#333',
        },
        style: {
          strokeWidth: 1.5,
          stroke: '#333',
          ...e.style,
        },
      }));

             console.log('[ELK Layout] ELK layout completed successfully');
       return { 
         nodes: positionedNodes, 
         edges: positionedEdges,
         engineUsed: 'elk',
         executionTime: 0, // Will be set by caller
         qualityScore: 0, // Will be set by caller
         success: true
       };

    } catch (error) {
      console.error('[ELK Layout] ELK layout failed:', error);
      throw error;
    }
  }

  /**
   * Layout with Dagre algorithm (fallback implementation)
   */
  async layoutWithDagre(
    nodes: Node[],
    edges: Edge[],
    { direction = 'LR', nodeWidth = 172, nodeHeight = 36 }: LayoutOpts = {}
  ): Promise<LayoutResult> {
    console.log('[Dagre Layout] Starting Dagre layout...');
    
         // For now, fallback to ELK since Dagre isn't implemented
     // In production, this would use a Dagre implementation
     console.log('[Dagre Layout] Falling back to ELK (Dagre not implemented)');
     const result = await this.layoutWithELK(nodes, edges, { direction, nodeWidth, nodeHeight });
     return { ...result, engineUsed: 'dagre' };
  }

  /**
   * Basic grid-based layout implementation
   */
  async layoutWithBasic(
    nodes: Node[],
    edges: Edge[],
    { direction = 'LR', nodeWidth = 172, nodeHeight = 36 }: LayoutOpts = {}
  ): Promise<LayoutResult> {
    console.log('[Basic Layout] Starting basic grid layout...');

         if (!nodes || nodes.length === 0) {
       return { 
         nodes, 
         edges,
         engineUsed: 'basic',
         executionTime: 0,
         qualityScore: 1.0,
         success: true
       };
     }

    const nodeSpacing = 180;
    const layerSpacing = 220;

    // Calculate grid dimensions based on direction
    const nodeCount = nodes.length;
    let cols: number, rows: number;

    if (direction === 'LR' || direction === 'RL') {
      // Horizontal layout - more columns
      cols = Math.max(1, Math.ceil(Math.sqrt(nodeCount * 1.5)));
      rows = Math.ceil(nodeCount / cols);
    } else {
      // Vertical layout - more rows  
      rows = Math.max(1, Math.ceil(Math.sqrt(nodeCount * 1.5)));
      cols = Math.ceil(nodeCount / rows);
    }

    const positionedNodes: Node[] = nodes.map((node, idx) => {
      let x: number, y: number;

      if (direction === 'LR') {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        x = 100 + col * (nodeWidth + nodeSpacing);
        y = 100 + row * (nodeHeight + layerSpacing);
      } else if (direction === 'RL') {
        const row = Math.floor(idx / cols);
        const col = cols - 1 - (idx % cols);
        x = 100 + col * (nodeWidth + nodeSpacing);
        y = 100 + row * (nodeHeight + layerSpacing);
      } else if (direction === 'TB') {
        const col = Math.floor(idx / rows);
        const row = idx % rows;
        x = 100 + col * (nodeWidth + nodeSpacing);
        y = 100 + row * (nodeHeight + layerSpacing);
      } else { // BT
        const col = Math.floor(idx / rows);
        const row = rows - 1 - (idx % rows);
        x = 100 + col * (nodeWidth + nodeSpacing);
        y = 100 + row * (nodeHeight + layerSpacing);
      }

      return {
        ...node,
        position: { x, y },
      };
    });

    // Update edge styling for basic layout
    const positionedEdges: Edge[] = edges.map((e) => ({
      ...e,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: '#333',
      },
      style: {
        strokeWidth: 1.5,
        stroke: '#333',
        ...e.style,
      },
    }));

         console.log('[Basic Layout] Basic layout completed');
     return { 
       nodes: positionedNodes, 
       edges: positionedEdges,
       engineUsed: 'basic',
       executionTime: 0, // Will be set by caller
       qualityScore: 0, // Will be set by caller  
       success: true
     };
  }

  /**
   * Estimate layer depth using topological analysis
   */
  private estimateLayerDepth(nodes: Node[], edges: Edge[]): number {
    if (!nodes.length || !edges.length) return 1;

    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize graph
    nodes.forEach(node => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    // Build adjacency list
    edges.forEach(edge => {
      if (graph.has(edge.source) && graph.has(edge.target)) {
        graph.get(edge.source)!.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    });

    // Topological sort to find layer depth
    let queue = Array.from(inDegree.entries())
      .filter(([_, degree]) => degree === 0)
      .map(([nodeId, _]) => nodeId);
    
    let layers = 0;

    while (queue.length > 0) {
      const nextQueue: string[] = [];
      layers++;

      queue.forEach(nodeId => {
        const neighbors = graph.get(nodeId) || [];
        neighbors.forEach(neighbor => {
          const newDegree = (inDegree.get(neighbor) || 0) - 1;
          inDegree.set(neighbor, newDegree);
          if (newDegree === 0) {
            nextQueue.push(neighbor);
          }
        });
      });

      queue = nextQueue;
    }

    return Math.max(1, layers);
  }

  /**
   * Detect cycles in the graph
   */
  private detectCycles(nodes: Node[], edges: Edge[]): boolean {
    if (!nodes.length || !edges.length) return false;

    const graph = new Map<string, string[]>();
    
    // Initialize graph
    nodes.forEach(node => graph.set(node.id, []));
    
    // Build adjacency list
    edges.forEach(edge => {
      if (graph.has(edge.source) && graph.has(edge.target)) {
        graph.get(edge.source)!.push(edge.target);
      }
    });

    const white = new Set(nodes.map(n => n.id));
    const gray = new Set<string>();
    const black = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (black.has(nodeId)) return false;
      if (gray.has(nodeId)) return true;

      gray.add(nodeId);
      white.delete(nodeId);

      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) return true;
      }

      gray.delete(nodeId);
      black.add(nodeId);
      return false;
    };

    for (const nodeId of Array.from(white)) {
      if (hasCycle(nodeId)) return true;
    }

    return false;
  }

  /**
   * Assess the quality of a layout result
   */
  private assessLayoutQuality(nodes: Node[], complexity: ComplexityMetrics): number {
    if (!nodes.length) return 1.0;

    let qualityScore = 1.0;

    // Check for overlapping nodes
    const overlapPenalty = this.calculateOverlapPenalty(nodes);
    qualityScore -= overlapPenalty * 0.3;

    // Check for reasonable spacing
    const spacingScore = this.calculateSpacingScore(nodes);
    qualityScore *= spacingScore;

    // Check for alignment
    const alignmentScore = this.calculateAlignmentScore(nodes);
    qualityScore *= alignmentScore;

    return Math.max(0.0, Math.min(1.0, qualityScore));
  }

  /**
   * Calculate penalty for overlapping nodes
   */
  private calculateOverlapPenalty(nodes: Node[]): number {
    if (nodes.length < 2) return 0.0;

    let overlaps = 0;
    let totalPairs = 0;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        totalPairs++;
        
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        const x1 = node1.position.x;
        const y1 = node1.position.y;
        const w1 = node1.width || 172;
        const h1 = node1.height || 36;
        
        const x2 = node2.position.x;
        const y2 = node2.position.y;
        const w2 = node2.width || 172;
        const h2 = node2.height || 36;

        // Check if nodes overlap
        if (x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2) {
          overlaps++;
        }
      }
    }

    return totalPairs > 0 ? overlaps / totalPairs : 0.0;
  }

  /**
   * Calculate spacing score based on consistency
   */
  private calculateSpacingScore(nodes: Node[]): number {
    if (nodes.length < 2) return 1.0;

    const distances: number[] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].position.x - nodes[i].position.x;
        const dy = nodes[j].position.y - nodes[i].position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        distances.push(distance);
      }
    }

    if (!distances.length) return 1.0;

    const meanDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    const variance = distances.reduce((acc, d) => acc + Math.pow(d - meanDistance, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);
    
    const cv = meanDistance > 0 ? stdDev / meanDistance : 1.0;
    
    return Math.max(0.1, 1.0 - Math.min(1.0, cv));
  }

  /**
   * Calculate alignment score based on node positioning
   */
  private calculateAlignmentScore(nodes: Node[]): number {
    if (nodes.length < 3) return 1.0;

    const xPositions = nodes.map(n => n.position.x);
    const yPositions = nodes.map(n => n.position.y);

    const xGroups = this.groupSimilarValues(xPositions, 10);
    const yGroups = this.groupSimilarValues(yPositions, 10);

    const maxXGroup = Math.max(...xGroups.map(g => g.length));
    const maxYGroup = Math.max(...yGroups.map(g => g.length));

    return Math.max(maxXGroup, maxYGroup) / nodes.length;
  }

  /**
   * Group similar values within tolerance
   */
  private groupSimilarValues(values: number[], tolerance: number): number[][] {
    if (!values.length) return [];

    const sortedValues = [...values].sort((a, b) => a - b);
    const groups: number[][] = [];
    let currentGroup = [sortedValues[0]];

    for (let i = 1; i < sortedValues.length; i++) {
      if (Math.abs(sortedValues[i] - currentGroup[currentGroup.length - 1]) <= tolerance) {
        currentGroup.push(sortedValues[i]);
      } else {
        groups.push(currentGroup);
        currentGroup = [sortedValues[i]];
      }
    }

    groups.push(currentGroup);
    return groups;
  }

  /**
   * Record performance metrics
   */
  private recordPerformance(engine: string, executionTime: number, qualityScore: number) {
    this.performanceHistory.push({
      engine,
      executionTime,
      qualityScore,
      timestamp: Date.now()
    });

    // Keep only recent performance data (last 100 entries)
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-50);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const stats = {
      totalLayouts: this.performanceHistory.length,
      engines: {} as Record<string, any>,
      overall: {
        avgExecutionTime: 0,
        avgQualityScore: 0,
        successRate: 0
      }
    };

    if (this.performanceHistory.length === 0) {
      return stats;
    }

    // Group by engine
    const byEngine = this.performanceHistory.reduce((acc, entry) => {
      if (!acc[entry.engine]) acc[entry.engine] = [];
      acc[entry.engine].push(entry);
      return acc;
    }, {} as Record<string, typeof this.performanceHistory>);

    // Calculate stats per engine
    Object.entries(byEngine).forEach(([engine, entries]) => {
      const times = entries.map(e => e.executionTime);
      const qualities = entries.map(e => e.qualityScore);
      
      stats.engines[engine] = {
        count: entries.length,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
        avgQuality: qualities.reduce((a, b) => a + b, 0) / qualities.length,
        successRate: qualities.filter(q => q > 0.5).length / qualities.length
      };
    });

    // Overall stats
    const allTimes = this.performanceHistory.map(e => e.executionTime);
    const allQualities = this.performanceHistory.map(e => e.qualityScore);
    
    stats.overall = {
      avgExecutionTime: allTimes.reduce((a, b) => a + b, 0) / allTimes.length,
      avgQualityScore: allQualities.reduce((a, b) => a + b, 0) / allQualities.length,
      successRate: allQualities.filter(q => q > 0.5).length / allQualities.length
    };

    return stats;
  }

  /**
   * Reset performance statistics
   */
  resetPerformanceStats() {
    this.performanceHistory = [];
    console.log('[Enhanced Layout] Performance statistics reset');
  }
}

// Create singleton instance
export const enhancedLayoutEngine = new EnhancedLayoutEngine();

// Export the main layout function
export async function layoutWithEnhancedEngine(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOpts = {}
): Promise<LayoutResult> {
  return enhancedLayoutEngine.layoutWithEnhancedEngine(nodes, edges, options);
} 