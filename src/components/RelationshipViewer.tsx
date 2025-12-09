import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useRelationships } from '@/hooks/useRelationships';
import { Loader2, ArrowRight, MessageCircle, BarChart3 } from 'lucide-react';

interface RelationshipViewerProps {
  selectedVisualizationId?: string;
  onClose: () => void;
}

export function RelationshipViewer({ selectedVisualizationId, onClose }: RelationshipViewerProps) {
  const { getQuestionsByVisualization, loading } = useRelationships();
  const [relationships, setRelationships] = useState<any[]>([]);

  useEffect(() => {
    if (selectedVisualizationId) {
      loadRelationships();
    }
  }, [selectedVisualizationId]);

  const loadRelationships = async () => {
    if (!selectedVisualizationId) return;
    
    try {
      const data = await getQuestionsByVisualization(selectedVisualizationId);
      setRelationships(data);
    } catch (error) {
      console.error('Error loading relationships:', error);
    }
  };

  if (!selectedVisualizationId) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relationships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Select a visualization to view its related questions and relationships.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Visualization Relationships
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading relationships...</span>
          </div>
        ) : relationships.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              No questions associated with this visualization yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Related Questions ({relationships.length})
            </h3>
            {relationships.map((rel, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm leading-relaxed">
                      {rel.questions?.text}
                    </p>
                  </div>
                  <Badge 
                    variant={rel.questions?.confidence === 'high' ? 'default' : 'secondary'}
                    className="shrink-0"
                  >
                    {rel.questions?.confidence}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageCircle className="h-3 w-3" />
                  <span>Question</span>
                  <ArrowRight className="h-3 w-3" />
                  <Badge variant="outline" className="text-xs">
                    {rel.relationship_type.replace('_', ' ')}
                  </Badge>
                  <ArrowRight className="h-3 w-3" />
                  <BarChart3 className="h-3 w-3" />
                  <span>Visualization</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}