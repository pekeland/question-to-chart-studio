import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Bot, Database, Wrench, Search, GitBranch } from 'lucide-react';
import { useRelationships } from '@/hooks/useRelationships';

export interface AgentAction {
  id: string;
  agentType: 'VizAgent' | 'ModelAgent' | 'DataProPrep' | 'FindDataAgent' | 'WorkspaceAgent';
  action: string;
  description: string;
  timestamp: Date;
  relatedPrompt?: string;
  status: 'pending' | 'completed' | 'failed';
}

interface AgentForceProps {
  actions: AgentAction[];
  isOpen: boolean;
  onClose: () => void;
  onOpenLineageView: () => void;
  selectedAssetId?: string | null;
  selectedAssetName?: string;
  onPromptSelect?: (prompt: string, agentType: AgentAction['agentType']) => void;
  selectedPrompt?: string | null;
  selectedVisualizationDbId?: string; // Database ID of selected visualization
  onCreateAgentAction?: (prompt: string, agentType: AgentAction['agentType']) => void;
}

const agentConfigs = {
  VizAgent: { icon: Bot, color: 'bg-blue-500', name: 'DataProViz' },
  ModelAgent: { icon: Database, color: 'bg-green-500', name: 'DataProModel' },
  DataProPrep: { icon: Wrench, color: 'bg-orange-500', name: 'DataProPrep' },
  FindDataAgent: { icon: Search, color: 'bg-purple-500', name: 'DataProFind' },
  WorkspaceAgent: { icon: GitBranch, color: 'bg-red-500', name: 'WorkspaceAgent' },
};

export function AgentForce({ 
  actions, 
  isOpen, 
  onClose, 
  onOpenLineageView, 
  selectedAssetId, 
  selectedAssetName,
  onPromptSelect,
  selectedPrompt,
  selectedVisualizationDbId,
  onCreateAgentAction
}: AgentForceProps) {
  console.log('🎭 AgentForce rendering - onPromptSelect:', !!onPromptSelect, typeof onPromptSelect);
  
  const { getQuestionsGeneratingVisualization } = useRelationships();
  const [allowedQuestions, setAllowedQuestions] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentAction['agentType'] | null>(null);

  const handleAgentAction = (agentType: AgentAction['agentType']) => {
    if (inputText.trim() && onCreateAgentAction) {
      onCreateAgentAction(inputText.trim(), agentType);
      setInputText('');
      setSelectedAgent(null);
    }
  };

  // When a visualization is selected, fetch only questions that have "generates" relationship
  useEffect(() => {
    if (selectedVisualizationDbId) {
      console.log('🔍 Fetching questions for visualization:', selectedVisualizationDbId);
      getQuestionsGeneratingVisualization(selectedVisualizationDbId)
        .then(data => {
          const questionTexts = data.map(item => item.questions?.text).filter(Boolean);
          console.log('📋 Database questions found:', questionTexts);
          console.log('🎭 Current agent actions prompts:', actions.map(a => a.relatedPrompt));
          setAllowedQuestions(questionTexts);
        })
        .catch(error => {
          console.error('Error fetching generating questions:', error);
          setAllowedQuestions([]);
        });
    } else {
      setAllowedQuestions([]);
    }
  }, [selectedVisualizationDbId, getQuestionsGeneratingVisualization]);

  if (!isOpen) return null;

  // Filter actions based on visualization selection
  const filteredActions = selectedVisualizationDbId
    ? actions.filter(action => {
        // When visualization is selected, show questions that generate it
        // If no database relationships exist yet (allowedQuestions is empty), 
        // show all questions as a fallback for sample data
        if (!action.relatedPrompt || action.relatedPrompt === 'Standalone') {
          return false;
        }
        
        if (allowedQuestions.length === 0) {
          return true; // Show all when no DB relationships exist
        }
        
        // Check if any allowed question matches after removing suffixes like " (3)"
        return allowedQuestions.some(allowedQuestion => {
          const cleanAllowedQuestion = allowedQuestion.replace(/\s*\(\d+\)\s*$/, '').trim();
          const cleanActionPrompt = action.relatedPrompt.trim();
          return cleanAllowedQuestion === cleanActionPrompt;
        });
      })
    : selectedAssetId && !selectedVisualizationDbId
    ? actions.filter(action => {
        return action.relatedPrompt && action.relatedPrompt !== 'Standalone';
      })
    : actions; // Show all actions when no specific filtering is applied

  const groupedActions = filteredActions.reduce((acc, action) => {
    const key = action.relatedPrompt || 'Standalone';
    if (!acc[key]) acc[key] = [];
    acc[key].push(action);
    return acc;
  }, {} as Record<string, AgentAction[]>);

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border shadow-lg z-50">
      <Card className="h-full rounded-none border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">AgentForce</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onOpenLineageView}>
              View Lineage
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col h-[calc(100vh-80px)]">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {selectedAssetId && (
                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                  <p className="text-sm font-medium text-foreground">
                    Filtered by: {selectedAssetName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Showing {filteredActions.length} related actions
                  </p>
                </div>
              )}
              
              {Object.entries(groupedActions).map(([promptKey, promptActions]) => (
                <div key={promptKey} className="space-y-2">
                  <div 
                    className={`text-sm font-medium cursor-pointer transition-all duration-200 rounded-lg p-3 border ${
                      selectedPrompt === promptKey 
                        ? 'text-primary bg-primary/20 border-primary shadow-sm ring-2 ring-primary/30' 
                        : 'text-muted-foreground hover:text-foreground bg-card hover:bg-accent/50 border-border hover:border-primary/50 hover:shadow-sm'
                    }`}
                    onClick={() => {
                      console.log('🚨 AGENTFORCE CLICK!', promptKey, promptActions[0]?.agentType);
                      console.log('🔧 onPromptSelect function exists?', !!onPromptSelect);
                      try {
                        // If clicking the same prompt, deselect it
                        if (selectedPrompt === promptKey) {
                          onPromptSelect?.('', 'VizAgent'); // Pass empty string to clear selection
                          console.log('✅ Prompt deselected');
                        } else {
                          onPromptSelect?.(promptKey, promptActions[0]?.agentType);
                          console.log('✅ onPromptSelect called successfully');
                        }
                      } catch (error) {
                        console.error('❌ Error calling onPromptSelect:', error);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {promptKey === 'Standalone' ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                          <span>Standalone Actions</span>
                        </>
                      ) : (
                        <>
                          <div className={`w-2 h-2 rounded-full ${selectedPrompt === promptKey ? 'bg-primary' : 'bg-blue-500'}`} />
                          <span className="font-semibold">Question:</span>
                          <span className="truncate">{promptKey.slice(0, 40)}...</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Click to highlight related assets
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {promptActions.map((action) => {
                      const config = agentConfigs[action.agentType];
                      const Icon = config.icon;
                      
                      return (
                        <Card key={action.id} className="p-3">
                          <div className="flex items-start gap-3">
                            <div className={`${config.color} p-1.5 rounded text-white flex-shrink-0`}>
                              <Icon className="h-3 w-3" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{config.name}</span>
                                <Badge 
                                  variant={action.status === 'completed' ? 'default' : 
                                          action.status === 'failed' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {action.status}
                                </Badge>
                              </div>
                              
                              <div className="text-sm font-medium text-foreground mb-1">
                                {action.action}
                              </div>
                              
                              <div className="text-xs text-muted-foreground mb-2">
                                {action.description}
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                {action.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {filteredActions.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No agent actions yet.</p>
                  <p className="text-sm">Create a visualization to see agents in action!</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Input and Agent Buttons */}
          <div className="p-4 border-t border-border space-y-3">
            <Input
              placeholder="Ask a question or describe what you need..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full"
            />
            
            <div className="grid grid-cols-2 gap-2">
              {(['VizAgent', 'ModelAgent', 'DataProPrep', 'FindDataAgent'] as const).map((agentType) => {
                const config = agentConfigs[agentType];
                const Icon = config.icon;
                const isSelected = selectedAgent === agentType;
                const canSubmit = inputText.trim().length > 0;
                
                return (
                  <Button
                    key={agentType}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    disabled={!canSubmit}
                    onClick={() => {
                      if (canSubmit) {
                        handleAgentAction(agentType);
                      } else {
                        setSelectedAgent(isSelected ? null : agentType);
                      }
                    }}
                    className="flex items-center gap-2 text-xs"
                  >
                    <div className={`${config.color} p-1 rounded text-white flex-shrink-0`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    {config.name}
                  </Button>
                );
              })}
            </div>
            
            {selectedAgent && (
              <Card className="p-3 bg-muted/50">
                <div className="flex items-start gap-3">
                  <div className={`${agentConfigs[selectedAgent].color} p-1.5 rounded text-white flex-shrink-0`}>
                    {React.createElement(agentConfigs[selectedAgent].icon, { className: "h-3 w-3" })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium mb-1">
                      {agentConfigs[selectedAgent].name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedAgent === 'VizAgent' && 'Creates charts and visualizations based on your data'}
                      {selectedAgent === 'ModelAgent' && 'Builds and modifies semantic models and calculations'}
                      {selectedAgent === 'DataProPrep' && 'Transforms and prepares data for analysis'}
                      {selectedAgent === 'FindDataAgent' && 'Discovers and connects relevant data sources'}
                    </div>
                    {inputText.trim() && (
                      <Button 
                        size="sm" 
                        className="mt-2 w-full"
                        onClick={() => handleAgentAction(selectedAgent)}
                      >
                        Submit to {agentConfigs[selectedAgent].name}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}