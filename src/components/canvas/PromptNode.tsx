import { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Send, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { PromptData } from '../types';
import { useCanvasContext } from '../CanvasContext';

interface PromptNodeProps {
  id?: string;
  data: PromptData;
}

export const PromptNode = memo(({ id, data }: PromptNodeProps) => {
  const [prompt, setPrompt] = useState(data.prompt);
  const [isActive, setIsActive] = useState(data.isActive);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { getNode } = useReactFlow();
  const { onPromptSubmit } = useCanvasContext();

  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isActive]);

  const handleSubmit = () => {
    if (prompt.trim() && id && onPromptSubmit) {
      const node = getNode(id);
      if (node) {
        onPromptSubmit(prompt, node.position, id);
        setIsActive(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isActive && !prompt) {
    return (
      <div className="w-72">
        <Card 
          className="glass shadow-lg border-dashed border-primary/50 cursor-pointer hover:border-primary transition-colors"
          onClick={() => setIsActive(true)}
        >
          <CardContent className="p-4 text-center">
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-sm text-muted-foreground">
              Click to add a prompt
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-80">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <Card className="glass shadow-lg border-secondary bg-secondary/5">
        <CardContent className="p-4">
          {isActive ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                <Sparkles className="w-4 h-4" />
                Ask Question
              </div>
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What insights would you like to explore?"
                className="min-h-[80px] resize-none border-border"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmit}
                  size="sm" 
                  className="flex-1"
                  disabled={!prompt.trim()}
                >
                  <Send className="w-3 h-3 mr-1" />
                  Generate
                </Button>
                <Button 
                  onClick={() => setIsActive(false)}
                  variant="outline" 
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="cursor-pointer p-2 rounded hover:bg-accent/50 transition-colors"
              onClick={() => setIsActive(true)}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-secondary mb-2">
                <Sparkles className="w-4 h-4" />
                Question
              </div>
              <div className="text-sm text-foreground line-clamp-3">
                {prompt}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
});