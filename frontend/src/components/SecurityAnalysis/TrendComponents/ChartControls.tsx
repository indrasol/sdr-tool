
import React from 'react';
import { Button } from '@/components/ui/button';
import { Activity, BarChart2, TrendingUp, Calendar } from 'lucide-react';

interface ChartControlsProps {
  chartType: 'line' | 'bar' | 'area';
  setChartType: (type: 'line' | 'bar' | 'area') => void;
  timeRange: 'all' | '6months' | '3months';
  setTimeRange: (range: 'all' | '6months' | '3months') => void;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  chartType,
  setChartType,
  timeRange,
  setTimeRange
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex bg-white/80 backdrop-blur-sm rounded-md p-1 border border-gray-100">
        <Button 
          size="sm" 
          variant={chartType === 'line' ? 'default' : 'ghost'} 
          onClick={() => setChartType('line')}
          className={`h-8 px-3 ${chartType === 'line' ? 'bg-securetrack-purple hover:bg-securetrack-darkpurple' : ''}`}
        >
          <Activity className="h-4 w-4 mr-1" />
          Line
        </Button>
        <Button 
          size="sm" 
          variant={chartType === 'bar' ? 'default' : 'ghost'} 
          onClick={() => setChartType('bar')}
          className={`h-8 px-3 ${chartType === 'bar' ? 'bg-securetrack-purple hover:bg-securetrack-darkpurple' : ''}`}
        >
          <BarChart2 className="h-4 w-4 mr-1" />
          Bar
        </Button>
        <Button 
          size="sm" 
          variant={chartType === 'area' ? 'default' : 'ghost'} 
          onClick={() => setChartType('area')}
          className={`h-8 px-3 ${chartType === 'area' ? 'bg-securetrack-purple hover:bg-securetrack-darkpurple' : ''}`}
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          Area
        </Button>
      </div>
      
      <div className="flex bg-white/80 backdrop-blur-sm rounded-md p-1 border border-gray-100">
        <Button 
          size="sm" 
          variant={timeRange === 'all' ? 'default' : 'ghost'} 
          onClick={() => setTimeRange('all')}
          className={`h-8 px-3 ${timeRange === 'all' ? 'bg-securetrack-purple hover:bg-securetrack-darkpurple' : ''}`}
        >
          <Calendar className="h-4 w-4 mr-1" />
          All Time
        </Button>
        <Button 
          size="sm" 
          variant={timeRange === '6months' ? 'default' : 'ghost'} 
          onClick={() => setTimeRange('6months')}
          className={`h-8 px-3 ${timeRange === '6months' ? 'bg-securetrack-purple hover:bg-securetrack-darkpurple' : ''}`}
        >
          6 Months
        </Button>
        <Button 
          size="sm" 
          variant={timeRange === '3months' ? 'default' : 'ghost'} 
          onClick={() => setTimeRange('3months')}
          className={`h-8 px-3 ${timeRange === '3months' ? 'bg-securetrack-purple hover:bg-securetrack-darkpurple' : ''}`}
        >
          3 Months
        </Button>
      </div>
    </div>
  );
};

export default ChartControls;