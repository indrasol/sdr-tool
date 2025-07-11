import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutGrid, 
  Zap, 
  Settings, 
  Activity, 
  Clock, 
  Target, 
  TrendingUp,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { enhancedLayoutEngine } from '../utils/enhancedLayoutEngine';

export interface LayoutControlsProps {
  onLayout: (options: {
    direction: 'LR' | 'TB' | 'BT' | 'RL';
    engine: 'auto' | 'elk' | 'dagre' | 'basic';
    enablePerformanceMonitoring: boolean;
  }) => void;
  isLayouting: boolean;
  lastLayoutResult?: {
    engineUsed: string;
    executionTime: number;
    qualityScore: number;
    success: boolean;
    complexityMetrics?: {
      nodeCount: number;
      edgeCount: number;
      complexityScore: number;
    };
  };
}

const LayoutControls: React.FC<LayoutControlsProps> = ({
  onLayout,
  isLayouting,
  lastLayoutResult
}) => {
  const [direction, setDirection] = useState<'LR' | 'TB' | 'BT' | 'RL'>('LR');
  const [engine, setEngine] = useState<'auto' | 'elk' | 'dagre' | 'basic'>('auto');
  const [enablePerformanceMonitoring, setEnablePerformanceMonitoring] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<any>(null);

  // Update performance stats periodically
  useEffect(() => {
    const updateStats = () => {
      setPerformanceStats(enhancedLayoutEngine.getPerformanceStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleLayout = () => {
    onLayout({
      direction,
      engine,
      enablePerformanceMonitoring
    });
  };

  const handleResetStats = () => {
    enhancedLayoutEngine.resetPerformanceStats();
    setPerformanceStats(enhancedLayoutEngine.getPerformanceStats());
  };

  const getEngineDescription = (engineType: string) => {
    const descriptions = {
      auto: 'Automatically selects the best engine based on diagram complexity',
      elk: 'Advanced hierarchical layout with optimal node placement',
      dagre: 'Fast directed graph layout with good performance',
      basic: 'Simple grid-based layout for basic diagrams'
    };
    return descriptions[engineType as keyof typeof descriptions] || 'Unknown engine';
  };

  const getDirectionLabel = (dir: string) => {
    const labels = {
      LR: 'Left to Right',
      TB: 'Top to Bottom',
      BT: 'Bottom to Top',
      RL: 'Right to Left'
    };
    return labels[dir as keyof typeof labels] || dir;
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEngineColor = (engineType: string) => {
    const colors = {
      auto: 'bg-blue-100 text-blue-800',
      elk: 'bg-purple-100 text-purple-800',
      dagre: 'bg-green-100 text-green-800',
      basic: 'bg-gray-100 text-gray-800'
    };
    return colors[engineType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5" />
          Layout Controls
        </CardTitle>
        <CardDescription>
          Configure diagram layout with intelligent engine selection
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Layout Controls */}
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Direction</label>
            <Select value={direction} onValueChange={(value: any) => setDirection(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LR">Left to Right</SelectItem>
                <SelectItem value="TB">Top to Bottom</SelectItem>
                <SelectItem value="BT">Bottom to Top</SelectItem>
                <SelectItem value="RL">Right to Left</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Layout Engine</label>
            <Select value={engine} onValueChange={(value: any) => setEngine(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Auto (Recommended)
                  </div>
                </SelectItem>
                <SelectItem value="elk">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    ELK (Advanced)
                  </div>
                </SelectItem>
                <SelectItem value="dagre">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Dagre (Fast)
                  </div>
                </SelectItem>
                <SelectItem value="basic">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Basic (Simple)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {getEngineDescription(engine)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Performance Monitoring</label>
            <Switch
              checked={enablePerformanceMonitoring}
              onCheckedChange={setEnablePerformanceMonitoring}
            />
          </div>
        </div>

        {/* Apply Layout Button */}
        <Button 
          onClick={handleLayout} 
          disabled={isLayouting}
          className="w-full"
        >
          {isLayouting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Applying Layout...
            </>
          ) : (
            <>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Apply Layout
            </>
          )}
        </Button>

        {/* Last Layout Result */}
        {lastLayoutResult && (
          <div className="space-y-2">
            <Separator />
            <div className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Layout:</span>
                <Badge className={getEngineColor(lastLayoutResult.engineUsed)}>
                  {lastLayoutResult.engineUsed.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Execution Time:</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lastLayoutResult.executionTime.toFixed(2)}ms
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Quality Score:</span>
                <span className={`flex items-center gap-1 ${getQualityColor(lastLayoutResult.qualityScore)}`}>
                  <Target className="h-3 w-3" />
                  {(lastLayoutResult.qualityScore * 100).toFixed(0)}%
                </span>
              </div>

              {lastLayoutResult.complexityMetrics && (
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Nodes: {lastLayoutResult.complexityMetrics.nodeCount}</div>
                  <div>Edges: {lastLayoutResult.complexityMetrics.edgeCount}</div>
                  <div>Complexity: {lastLayoutResult.complexityMetrics.complexityScore.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Advanced Performance Stats */}
        {performanceStats && enablePerformanceMonitoring && (
          <div className="space-y-2">
            <Separator />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance Stats
              </span>
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showAdvanced && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium">{performanceStats.totalLayouts}</div>
                    <div className="text-xs text-gray-500">Total Layouts</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium">
                      {(performanceStats.overall.successRate * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">Success Rate</div>
                  </div>
                </div>

                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium">
                    {performanceStats.overall.avgExecutionTime?.toFixed(2) || 0}ms
                  </div>
                  <div className="text-xs text-gray-500">Avg Execution Time</div>
                </div>

                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium">
                    {(performanceStats.overall.avgQualityScore * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">Avg Quality Score</div>
                </div>

                {/* Engine Performance */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-600">Engine Performance</div>
                  {Object.entries(performanceStats.engines).map(([engineName, stats]: [string, any]) => (
                    <div key={engineName} className="flex items-center justify-between text-xs">
                      <Badge variant="outline" className={getEngineColor(engineName)}>
                        {engineName.toUpperCase()}
                      </Badge>
                      <span>{stats.count} uses</span>
                      <span>{stats.avgTime?.toFixed(2)}ms</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetStats}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Stats
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="space-y-2">
          <Separator />
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Auto mode</strong> analyzes diagram complexity and selects the optimal 
              layout engine automatically. For horizontal layouts, use LR direction.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LayoutControls; 