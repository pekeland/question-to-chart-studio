import React, { memo, useCallback, useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { BarChart3, LineChart, PieChart, Table, MessageSquare, Database, Wrench, Search, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { ChartData } from '../types';
import { useCanvasContext } from '../CanvasContext';
import { generateUniqueSuggestedQuestions } from '@/utils/uniqueness';

interface ChartNodeProps {
  id?: string;
  data: ChartData;
  selected?: boolean;
}

const chartIcons = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  table: Table,
  scatter: BarChart3,
};

const agentIcons = {
  DataProPrep: Wrench,
  DataProFind: Search,
  DataProModel: Database,
};

export const ChartNode = memo(({ id, data, selected }: ChartNodeProps) => {
  const IconComponent = chartIcons[data.chartType];
  const { getNode } = useReactFlow();
  const { 
    onSuggestedQuestionSelect, 
    selectedChartIds, 
    onChartSelect, 
    highlightedChartIds 
  } = useCanvasContext();
  
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  
  const isSelected = selectedChartIds.includes(id || '');
  const isHighlighted = highlightedChartIds.includes(id || '');
  
  // Generate unique suggested questions for this chart
  useEffect(() => {
    if (selected && id) {
      // Get existing questions from other charts to avoid duplicates
      const existingQuestions: string[] = [];
      // Note: In a real app, you'd fetch existing questions from the database
      const uniqueQuestions = generateUniqueSuggestedQuestions(data, existingQuestions);
      setSuggestedQuestions(uniqueQuestions);
    }
  }, [selected, data, id]);
  
  const handleSuggestedQuestionClick = useCallback((question: string) => {
    if (id && onSuggestedQuestionSelect) {
      const node = getNode(id);
      if (node) {
        onSuggestedQuestionSelect(question, node.position, id);
      }
    }
  }, [id, onSuggestedQuestionSelect, getNode]);

  const handleCustomQuestionSubmit = useCallback(() => {
    if (customQuestion.trim() && id && onSuggestedQuestionSelect) {
      const node = getNode(id);
      if (node) {
        onSuggestedQuestionSelect(customQuestion.trim(), node.position, id);
        setCustomQuestion('');
      }
    }
  }, [customQuestion, id, onSuggestedQuestionSelect, getNode]);

  const handleCustomQuestionKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomQuestionSubmit();
    }
  }, [handleCustomQuestionSubmit]);

  const handleSelectionChange = useCallback((checked: boolean) => {
    if (id && onChartSelect) {
      onChartSelect(id, checked);
    }
  }, [id, onChartSelect]);

  return (
    <div className="w-80">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <Card className={`border-2 transition-all duration-300 ${
        isHighlighted 
          ? 'border-accent shadow-lg scale-105 ring-2 ring-accent/50' 
          : selected 
            ? 'border-primary shadow-lg scale-105' 
            : 'border-primary/20'
      } ${isSelected ? 'bg-primary/5' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleSelectionChange}
                className="h-4 w-4"
              />
              <IconComponent className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">{data.title}</CardTitle>
            </div>
            {data.isAIGenerated && data.involvedAgents && data.involvedAgents.length > 0 && (
              <div className="flex gap-1">
                {data.involvedAgents.map((agent) => {
                  const AgentIcon = agentIcons[agent];
                  return (
                    <div key={agent} className="w-5 h-5 bg-secondary rounded p-1 flex items-center justify-center">
                      <AgentIcon className="w-3 h-3 text-secondary-foreground" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {data.fields.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {data.fields.map((field) => (
                <Badge 
                  key={field.id} 
                  variant="outline" 
                  className="text-xs"
                >
                  {field.name}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Mock Chart Visualization */}
          <div className="h-32 bg-gradient-subtle rounded-lg mb-4 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <IconComponent className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-xs">{data.chartType.toUpperCase()} Chart</div>
            </div>
          </div>

          {/* Suggested Questions - Only show when selected */}
          {selected && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <MessageSquare className="w-3 h-3" />
                Suggested Questions
              </div>
              {suggestedQuestions.slice(0, 2).map((question, index) => (
                <Button
                  key={`${id}-question-${index}`}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-auto p-2 text-left hover:bg-accent/50"
                  onClick={() => handleSuggestedQuestionClick(question)}
                >
                  {question}
                </Button>
              ))}
              
              {/* Custom Question Input */}
              <div className="border-t border-border pt-2 mt-3">
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-2">
                  <Plus className="w-3 h-3" />
                  Ask Your Own Question
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter your question..."
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    onKeyPress={handleCustomQuestionKeyPress}
                    className="text-xs h-8 flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleCustomQuestionSubmit}
                    disabled={!customQuestion.trim()}
                    className="h-8 px-3 text-xs"
                  >
                    Ask
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Show hint when not selected */}
          {!selected && (
            <div className="text-xs text-muted-foreground text-center py-2 opacity-50">
              Click to see suggested questions
            </div>
          )}
        </CardContent>
      </Card>
      
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
});