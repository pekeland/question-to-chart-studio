import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { MessageSquare } from 'lucide-react';

interface SlackCanvasGeneratorProps {
  open: boolean;
  onClose: () => void;
  selectedChartIds: string[];
  onGenerate: (intent: string, recipients: string) => void;
}

export function SlackCanvasGenerator({ 
  open, 
  onClose, 
  selectedChartIds, 
  onGenerate 
}: SlackCanvasGeneratorProps) {
  const [intent, setIntent] = useState('');
  const [recipients, setRecipients] = useState('');
  const [generatedCanvas, setGeneratedCanvas] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const handleGenerate = () => {
    if (intent.trim() && recipients.trim()) {
      // Simulate canvas generation based on intent and selected charts
      const chartNames = selectedChartIds.map(id => `Chart ${id.split('-')[1]}`).join(', ');
      const mockCanvas = `📊 Data Canvas: ${recipients}

${intent}

📈 Interactive visualizations from: ${chartNames}

Canvas Features:
• Drag and drop chart arrangements
• Real-time collaborative editing  
• Comments and annotations
• Data filtering and exploration
• Export capabilities

Ready for team collaboration!`;
      
      setGeneratedCanvas(mockCanvas);
      setIsReviewing(true);
    }
  };

  const handleCreate = () => {
    onGenerate(intent, recipients);
    setIntent('');
    setRecipients('');
    setGeneratedCanvas('');
    setIsReviewing(false);
    onClose();
  };

  const handleBack = () => {
    setIsReviewing(false);
    setGeneratedCanvas('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Generate Slack Canvas
          </DialogTitle>
        </DialogHeader>
        
        {!isReviewing ? (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                Selected Charts: {selectedChartIds.length}
              </Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedChartIds.map((id) => (
                  <span key={id} className="text-xs bg-secondary px-2 py-1 rounded">
                    Chart {id.split('-')[1]}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recipients">Users to share canvas with</Label>
              <Input
                id="recipients"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="e.g., @john.smith, @sarah.jones, #marketing-team"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="intent">What is the purpose of this canvas?</Label>
              <Textarea
                id="intent"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="e.g., Collaborative workspace for reviewing quarterly metrics and planning next steps"
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Canvas Preview</Label>
              <div className="mt-2 p-4 bg-secondary/50 rounded-lg border">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {generatedCanvas}
                </pre>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-2 mt-6">
          {!isReviewing ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate}
                disabled={!intent.trim() || !recipients.trim()}
              >
                Generate Canvas
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleBack}>
                Back to Edit
              </Button>
              <Button onClick={handleCreate}>
                Create Canvas
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}