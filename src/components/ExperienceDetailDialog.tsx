import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { MessageSquare } from 'lucide-react';
import { ExperienceData } from './types';

interface ExperienceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience: ExperienceData | null;
}

export const ExperienceDetailDialog = memo(({ 
  open, 
  onOpenChange, 
  experience 
}: ExperienceDetailDialogProps) => {
  if (!experience) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-accent-foreground" />
            {experience.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Badge variant="secondary">
              {experience.type}
            </Badge>
            <Badge variant="outline">
              {experience.sourceChartIds.length} source charts
            </Badge>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Intent:</h4>
            <p className="text-sm">{experience.intent}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Message Content:</h4>
            <Card>
              <CardContent className="pt-4">
                <pre className="text-sm whitespace-pre-wrap leading-relaxed">
                  {experience.content}
                </pre>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Connected Charts ({experience.sourceChartIds.length}):
            </h4>
            <div className="flex flex-wrap gap-2">
              {experience.sourceChartIds.map((chartId) => (
                <Badge key={chartId} variant="outline" className="text-xs">
                  Chart {chartId.split('-')[1]}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ExperienceDetailDialog.displayName = 'ExperienceDetailDialog';