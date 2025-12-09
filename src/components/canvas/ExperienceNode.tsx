import { memo, useCallback, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { MessageSquare, Trash2, Brain } from 'lucide-react';
import { Button } from '../ui/button';
import { ExperienceData } from '../types';
import { useCanvasContext } from '../CanvasContext';
import { ArgumentationViewer } from '../ArgumentationViewer';

interface ExperienceNodeProps {
  id: string;
  data: ExperienceData;
  selected?: boolean;
}

export const ExperienceNode = memo(({ id, data, selected }: ExperienceNodeProps) => {
  const { getNode, setNodes, setEdges } = useReactFlow();
  const { highlightedChartIds } = useCanvasContext();
  const [showArgumentation, setShowArgumentation] = useState(false);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source === id || edge.target === id));
  }, [id, setNodes, setEdges]);

  return (
    <div className="w-80">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <Card className={`border-2 transition-all duration-300 ${
        selected ? 'border-primary shadow-lg scale-105' : 'border-accent'
      }`}>
        <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent-foreground" />
              <CardTitle className="text-sm font-medium">{data.title}</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowArgumentation(true);
                }}
                className="h-6 w-6 p-0 hover:bg-primary hover:text-primary-foreground"
                title="View Argumentation Analysis"
              >
                <Brain className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit text-xs">
            {data.type}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Intent:</p>
            <p className="text-sm">{data.intent}</p>
          </div>
          
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Message:</p>
            <div className="bg-muted/50 rounded-md p-2 text-xs leading-relaxed">
              {data.content}
            </div>
          </div>
          
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Source Charts ({data.sourceChartIds.length}):
            </p>
            <div className="flex flex-wrap gap-1">
              {data.sourceChartIds.map((chartId) => (
                <Badge 
                  key={chartId} 
                  variant="outline" 
                  className={`text-xs ${
                    highlightedChartIds.includes(chartId) 
                      ? 'border-primary text-primary' 
                      : ''
                  }`}
                >
                  Chart {chartId.split('-')[1]}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      
      <ArgumentationViewer
        open={showArgumentation}
        onClose={() => setShowArgumentation(false)}
        data={data}
      />
    </div>
  );
});

ExperienceNode.displayName = 'ExperienceNode';