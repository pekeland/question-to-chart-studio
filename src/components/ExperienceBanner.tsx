import { memo, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MessageSquare, ExternalLink, Eye, Brain } from 'lucide-react';
import { ExperienceData } from './types';
import { Node } from '@xyflow/react';
import { ArgumentationViewer } from './ArgumentationViewer';

interface ExperienceBannerProps {
  experiences: Node[];
  onExperienceSelect: (experienceId: string) => void;
  onExperienceOpen: (experienceId: string) => void;
  selectedExperienceId?: string;
}

export const ExperienceBanner = memo(({ 
  experiences, 
  onExperienceSelect, 
  onExperienceOpen,
  selectedExperienceId 
}: ExperienceBannerProps) => {
  const [showArgumentation, setShowArgumentation] = useState<string | null>(null);
  
  const experienceNodes = experiences.filter(node => node.type === 'experience');

  if (experienceNodes.length === 0) {
    return (
      <div className="h-24 bg-muted/30 border-b border-border flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No experiences created yet</p>
      </div>
    );
  }

  return (
    <div className="h-24 bg-muted/30 border-b border-border p-3 overflow-x-auto">
      <div className="flex gap-3 h-full">
        {experienceNodes.map((node) => {
          const data = node.data as unknown as ExperienceData;
          const isSelected = selectedExperienceId === node.id;
          
          return (
            <Card 
              key={node.id} 
              className={`min-w-80 h-full cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
              }`}
              onClick={() => onExperienceSelect(node.id)}
            >
              <CardHeader className="pb-2 h-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3 w-3 text-accent-foreground" />
                    <CardTitle className="text-xs font-medium truncate flex-1">
                      {data.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowArgumentation(node.id);
                      }}
                      className="h-5 w-5 p-0 hover:bg-primary hover:text-primary-foreground"
                      title="View Argumentation Analysis"
                    >
                      <Brain className="h-2.5 w-2.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExperienceOpen(node.id);
                      }}
                      className="h-5 w-5 p-0 hover:bg-accent"
                      title="Open Experience Details"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-2 h-12 overflow-hidden">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    {data.type}
                  </Badge>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {data.sourceChartIds.length} charts
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground truncate">
                  {data.intent}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Argumentation Viewer */}
      {showArgumentation && (() => {
        const selectedNode = experienceNodes.find(node => node.id === showArgumentation);
        const selectedData = selectedNode?.data as unknown as ExperienceData;
        return selectedData ? (
          <ArgumentationViewer
            open={true}
            onClose={() => setShowArgumentation(null)}
            data={selectedData}
          />
        ) : null;
      })()}
    </div>
  );
});

ExperienceBanner.displayName = 'ExperienceBanner';