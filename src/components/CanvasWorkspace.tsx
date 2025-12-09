import { useCallback, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ChartNode } from './canvas/ChartNode';
import { PromptNode } from './canvas/PromptNode';
import { ExperienceNode } from './canvas/ExperienceNode';
import { SemanticModelSidebar } from './SemanticModelSidebar';
import { SlackCanvasGenerator } from './canvas/SlackCanvasGenerator';
import { ExperienceBanner } from './ExperienceBanner';
import { ExperienceDetailDialog } from './ExperienceDetailDialog';
import { AgentForce, AgentAction } from './AgentForce';
import { LineageView } from './LineageView';
import { FieldType, ExperienceData } from './types';
import { CanvasProvider } from './CanvasContext';
import { Button } from './ui/button';
import { useRelationships } from '@/hooks/useRelationships';
import { RelationshipViewer } from './RelationshipViewer';
import { ensureUniqueTitle } from '@/utils/uniqueness';

const nodeTypes = {
  chart: ChartNode,
  prompt: PromptNode,
  // Remove experience from canvas - only show in banner
};

const initialNodes: Node[] = [
  {
    id: 'welcome',
    type: 'prompt',
    position: { x: 400, y: 200 },
    data: {
      prompt: 'Welcome to your Analytics Canvas! Double-click to add prompts or drag fields from the sidebar.',
      isActive: false,
    },
  },
];

const initialEdges: Edge[] = [];

export function CanvasWorkspace() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedFields, setSelectedFields] = useState<FieldType[]>([]);
  const [selectedChartIds, setSelectedChartIds] = useState<string[]>([]);
  const [highlightedChartIds, setHighlightedChartIds] = useState<string[]>([]);
  const [showSlackGenerator, setShowSlackGenerator] = useState(false);
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | undefined>();
  const [showExperienceDetail, setShowExperienceDetail] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceData | null>(null);
  const [agentActions, setAgentActions] = useState<AgentAction[]>([]);
  const [showAgentForce, setShowAgentForce] = useState(false);
  const [showLineageView, setShowLineageView] = useState(false);
  const [showRelationshipViewer, setShowRelationshipViewer] = useState(false);
  const [selectedVisualizationId, setSelectedVisualizationId] = useState<string | undefined>();
  
  const { 
    saveQuestion, 
    saveVisualization, 
    linkQuestionToVisualization,
    getQuestionsByVisualization 
  } = useRelationships();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleFieldDrop = useCallback(
    async (event: React.DragEvent) => {
      console.log('handleFieldDrop called', event);
      event.preventDefault();
      event.stopPropagation();

      const dragData = event.dataTransfer.getData('application/json');
      console.log('dragData:', dragData);
      if (!dragData) return;

      const field = JSON.parse(dragData);
      console.log('parsed field:', field);
      
      // Get the ReactFlow bounds for proper position calculation
      const reactFlowBounds = (event.currentTarget as Element).getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 150,
        y: event.clientY - reactFlowBounds.top - 100,
      };
      console.log('drop position:', position);

      // Use selected fields if any, otherwise use the dropped field
      const fieldsToUse = selectedFields.length > 0 ? selectedFields : [field];
      console.log('fields to use:', fieldsToUse);
      
      // Generate unique title
      const baseTitle = generateChartTitle(fieldsToUse);
      const existingTitles = nodes.map(node => node.data?.title).filter((title): title is string => Boolean(title));
      const uniqueTitle = await ensureUniqueTitle(baseTitle, existingTitles);
      
      // Auto-generate chart based on field types
      const newNode: Node = {
        id: `chart-${Date.now()}`,
        type: 'chart',
        position,
        data: {
          fields: fieldsToUse,
          chartType: determineChartType(fieldsToUse),
          title: uniqueTitle,
        },
      };
      console.log('creating new node:', newNode);

      setNodes((nds) => [...nds, newNode]);
      setSelectedFields([]); // Clear selection after use
      console.log('Node added to canvas');
    },
    [setNodes, selectedFields, nodes]
  );

  const generateAgentActions = useCallback((prompt: string) => {
    const actions: AgentAction[] = [];
    const timestamp = new Date();
    
    // VizAgent always creates visualization
    actions.push({
      id: `action-${Date.now()}-viz`,
      agentType: 'VizAgent',
      action: 'Create Visualization',
      description: 'Generated charts based on user prompt',
      timestamp,
      relatedPrompt: prompt,
      status: 'completed',
    });
    
    // 40% chance each for other agents
    if (Math.random() < 0.4) {
      actions.push({
        id: `action-${Date.now()}-model`,
        agentType: 'ModelAgent',
        action: 'Create Calculation',
        description: 'Added calculated fields to semantic model',
        timestamp: new Date(timestamp.getTime() + 1000),
        relatedPrompt: prompt,
        status: 'completed',
      });
    }
    
    if (Math.random() < 0.4) {
      actions.push({
        id: `action-${Date.now()}-prep`,
        agentType: 'DataProPrep',
        action: 'Reshape Data',
        description: 'Transformed and materialized data changes',
        timestamp: new Date(timestamp.getTime() + 2000),
        relatedPrompt: prompt,
        status: 'completed',
      });
    }
    
    if (Math.random() < 0.4) {
      actions.push({
        id: `action-${Date.now()}-find`,
        agentType: 'FindDataAgent',
        action: 'Discover Data Source',
        description: 'Found additional relevant datasets',
        timestamp: new Date(timestamp.getTime() + 3000),
        relatedPrompt: prompt,
        status: 'completed',
      });
    }
    
    // WorkspaceAgent coordinates behind the scenes but doesn't show in logs
    
    return actions;
  }, []);

  const handleCreateAgentAction = useCallback((prompt: string, agentType: AgentAction['agentType']) => {
    const timestamp = new Date();
    const actionDescriptions = {
      VizAgent: 'Create visualization from user prompt',
      ModelAgent: 'Build semantic model calculation',
      DataProPrep: 'Transform and prepare data',
      FindDataAgent: 'Discover relevant data sources',
      WorkspaceAgent: 'Coordinate workspace actions'
    };

    const newAction: AgentAction = {
      id: `action-${Date.now()}`,
      agentType,
      action: actionDescriptions[agentType],
      description: `Processing: "${prompt}"`,
      timestamp,
      relatedPrompt: prompt,
      status: 'completed',
    };

    setAgentActions(prev => [...prev, newAction]);
  }, []);

  const handlePromptSubmit = useCallback(
    async (prompt: string, position: { x: number; y: number }, existingPromptId?: string) => {
      let promptId = existingPromptId;
      let promptNode: Node | undefined;
      let questionDbId: string | undefined;
      
      // Always create nodes immediately to ensure UI responsiveness
      if (!existingPromptId) {
        promptId = `prompt-${Date.now()}`;
        promptNode = {
          id: promptId,
          type: 'prompt',
          position,
          data: { prompt, isActive: false },
        };
      }

      // Generate agent actions
      const newAgentActions = generateAgentActions(prompt);
      setAgentActions(prev => [...prev, ...newAgentActions]);

      // Generate 1-3 mock chart responses
      const numCharts = Math.floor(Math.random() * 3) + 1;
      const chartNodes: Node[] = [];
      const newEdges: Edge[] = [];

      for (let i = 0; i < numCharts; i++) {
        const chartId = `chart-${Date.now()}-${i}`;
        const chartTitle = `${['Revenue Trends', 'Sales by Region', 'Customer Distribution'][i % 3]}`;
        const chartType = ['line', 'bar', 'pie'][i % 3] as any;
        
        const chartNode: Node = {
          id: chartId,
          type: 'chart',
          position: { 
            x: position.x + (i * 350), 
            y: position.y + 300
          },
          data: {
            fields: [],
            chartType: chartType as 'line' | 'bar' | 'pie',
            title: chartTitle,
            isAIGenerated: true,
            involvedAgents: newAgentActions
              .filter(action => ['DataProPrep', 'FindDataAgent', 'ModelAgent'].includes(action.agentType))
              .map(action => {
                if (action.agentType === 'ModelAgent') return 'DataProModel';
                if (action.agentType === 'FindDataAgent') return 'DataProFind';
                return action.agentType as 'DataProPrep';
              }) as ('DataProPrep' | 'DataProModel' | 'DataProFind')[],
          },
        };
        chartNodes.push(chartNode);

        // Create edge from prompt to chart
        newEdges.push({
          id: `edge-${promptId}-${chartId}`,
          source: promptId!,
          target: chartId,
          type: 'default',
          style: { stroke: 'hsl(var(--primary))' },
        });
      }

      // Add nodes and edges to canvas immediately
      if (promptNode) {
        setNodes((nds) => [...nds, promptNode, ...chartNodes]);
      } else {
        setNodes((nds) => [...nds, ...chartNodes]);
      }
      setEdges((eds) => [...eds, ...newEdges]);

      // Handle database operations in background, with proper error handling for each step
      try {
        // Save question to database and get ID
        questionDbId = await saveQuestion(prompt, 'medium');
        
        // Update prompt node with database ID
        if (promptNode) {
          setNodes((nds) => nds.map(n => 
            n.id === promptId 
              ? { ...n, data: { ...n.data, dbId: questionDbId } }
              : n
          ));
        }

        // Save visualizations and create relationships
        for (let i = 0; i < chartNodes.length; i++) {
          try {
            const chartNode = chartNodes[i];
            const vizDbId = await saveVisualization({
              fields: [],
              chartType: chartNode.data.chartType as 'line' | 'bar' | 'pie' | 'scatter' | 'table',
              title: chartNode.data.title as string,
              isAIGenerated: true,
              involvedAgents: chartNode.data.involvedAgents as ('DataProPrep' | 'DataProModel' | 'DataProFind')[],
            });

            // Update chart node with database ID
            setNodes((nds) => nds.map(n => 
              n.id === chartNode.id 
                ? { ...n, data: { ...n.data, dbId: vizDbId } }
                : n
            ));

            // Link question to visualization (with constraint error handling)
            try {
              await linkQuestionToVisualization(questionDbId!, vizDbId, 'generates');
            } catch (linkError: any) {
              if (linkError?.code !== '23505') {
                console.error('Error linking question to visualization:', linkError);
              }
              // Ignore duplicate constraint errors, continue with other operations
            }
          } catch (vizError) {
            console.error('Error saving visualization:', vizError);
            // Continue with other visualizations even if one fails
          }
        }
      } catch (error) {
        console.error('Error saving question:', error);
        // Continue - nodes are already on canvas
      }
    },
    [setNodes, setEdges, generateAgentActions, saveQuestion, saveVisualization, linkQuestionToVisualization]
  );

  const handleSuggestedQuestionSelect = useCallback(
    async (question: string, sourceChartPosition: { x: number; y: number }, sourceChartId: string) => {
      // Position new prompt further away from the source chart
      const promptPosition = {
        x: sourceChartPosition.x,
        y: sourceChartPosition.y + 350,
      };
      
      const promptId = `prompt-${Date.now()}`;
      let questionDbId: string;
      
      // Generate agent actions for the suggested question
      const newAgentActions = generateAgentActions(question);
      setAgentActions(prev => [...prev, ...newAgentActions]);

      // Generate 1-3 mock chart responses related to the source chart
      const numCharts = Math.floor(Math.random() * 3) + 1;
      const chartNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // Add edge from source chart to new prompt to show relationship
      newEdges.push({
        id: `edge-${sourceChartId}-${promptId}`,
        source: sourceChartId,
        target: promptId,
        type: 'default',
        style: { stroke: 'hsl(var(--secondary))', strokeDasharray: '5,5' },
      });

      try {
        // Save question to database
        questionDbId = await saveQuestion(question, 'high');
      } catch (error) {
        console.error('Error saving question:', error);
        questionDbId = `temp-${Date.now()}`; // Use temp ID if database save fails
      }
      
      // Create prompt node
      const promptNode: Node = {
        id: promptId,
        type: 'prompt',
        position: promptPosition,
        data: { prompt: question, isActive: false, dbId: questionDbId },
      };

      for (let i = 0; i < numCharts; i++) {
        const chartId = `chart-${Date.now()}-${i}`;
        const chartTitle = `${['Detailed Analysis', 'Breakdown View', 'Comparative Study'][i % 3]}`;
        const chartType = ['line', 'bar', 'pie'][i % 3] as any;
        let vizDbId: string;
        
        try {
          // Save visualization to database
          vizDbId = await saveVisualization({
            fields: [],
            chartType,
            title: chartTitle,
            isAIGenerated: true,
            involvedAgents: newAgentActions
              .filter(action => ['DataProPrep', 'FindDataAgent', 'ModelAgent'].includes(action.agentType))
              .map(action => {
                if (action.agentType === 'ModelAgent') return 'DataProModel';
                if (action.agentType === 'FindDataAgent') return 'DataProFind';
                return action.agentType as 'DataProPrep';
              }),
          });

          // Try to link question to new visualization and show relationship to source chart
          try {
            await linkQuestionToVisualization(questionDbId, vizDbId, 'generates');
          } catch (linkError: any) {
            if (linkError?.code !== '23505') {
              console.error('Error linking question to visualization:', linkError);
            }
            // Ignore duplicate constraint errors, continue with other operations
          }
          
          // Try to link to source chart
          try {
            const sourceChartNode = nodes.find(n => n.id === sourceChartId);
            if (sourceChartNode?.data?.dbId && typeof sourceChartNode.data.dbId === 'string') {
              await linkQuestionToVisualization(questionDbId, sourceChartNode.data.dbId, 'suggested_by');
            }
          } catch (linkError: any) {
            if (linkError?.code !== '23505') {
              console.error('Error linking question to source chart:', linkError);
            }
            // Ignore duplicate constraint errors, continue with other operations
          }
        } catch (error) {
          console.error('Error saving visualization:', error);
          vizDbId = `temp-viz-${Date.now()}-${i}`; // Use temp ID if database save fails
        }
        
        const chartNode: Node = {
          id: chartId,
          type: 'chart',
          position: { 
            x: promptPosition.x + (i * 350), 
            y: promptPosition.y + 300
          },
          data: {
            fields: [],
            chartType,
            title: chartTitle,
            isAIGenerated: true,
            dbId: vizDbId,
            involvedAgents: newAgentActions
              .filter(action => ['DataProPrep', 'FindDataAgent', 'ModelAgent'].includes(action.agentType))
              .map(action => {
                if (action.agentType === 'ModelAgent') return 'DataProModel';
                if (action.agentType === 'FindDataAgent') return 'DataProFind';
                return action.agentType as 'DataProPrep';
              }),
          },
        };
        chartNodes.push(chartNode);

        // Create edge from prompt to chart
        newEdges.push({
          id: `edge-${promptId}-${chartId}`,
          source: promptId,
          target: chartId,
          type: 'default',
          style: { stroke: 'hsl(var(--primary))' },
        });
      }

      // Always add nodes and edges to canvas, regardless of database save status
      setNodes((nds) => [...nds, promptNode, ...chartNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
    },
    [setNodes, setEdges, generateAgentActions, saveQuestion, saveVisualization, linkQuestionToVisualization, nodes]
  );

  // Helper functions
  const determineChartType = (fields: FieldType[]) => {
    const measures = fields.filter(f => f.type === 'measure');
    const dimensions = fields.filter(f => f.type === 'dimension');
    
    if (measures.length === 0) return 'table';
    if (dimensions.length === 0) return 'bar';
    if (dimensions.some(d => d.dataType === 'date')) return 'line';
    if (dimensions.length === 1 && measures.length === 1) return 'bar';
    return 'scatter';
  };

  const generateChartTitle = (fields: FieldType[]) => {
    if (fields.length === 1) return `${fields[0].name} Analysis`;
    if (fields.length === 2) return `${fields[0].name} by ${fields[1].name}`;
    return `Multi-field Analysis (${fields.length} fields)`;
  };

  const handleChartSelect = useCallback((chartId: string, isSelected: boolean) => {
    setSelectedChartIds(prev => 
      isSelected 
        ? [...prev, chartId]
        : prev.filter(id => id !== chartId)
    );
    
    // Update selected visualization ID for relationship viewer
    if (isSelected) {
      const selectedNode = nodes.find(n => n.id === chartId);
      if (selectedNode?.data?.dbId && typeof selectedNode.data.dbId === 'string') {
        setSelectedVisualizationId(selectedNode.data.dbId);
      }
    } else {
      // If deselecting the currently viewed chart, clear the relationship viewer
      const deselectedNode = nodes.find(n => n.id === chartId);
      if (deselectedNode?.data?.dbId === selectedVisualizationId) {
        setSelectedVisualizationId(undefined);
      }
    }
  }, [nodes, selectedVisualizationId]);

  const handleGenerateSlackCanvas = useCallback((chartIds: string[]) => {
    if (chartIds.length === 0) return;
    setShowSlackGenerator(true);
  }, []);

  const handleSlackCanvasGenerate = useCallback((intent: string, title: string) => {
    // Generate mock Slack canvas content
    const content = `📊 ${title}\n\n${intent}\n\nKey insights from ${selectedChartIds.length} charts:\n• Revenue trending upward\n• Customer acquisition stable\n• Regional performance varies\n\nLet's collaborate on this canvas!`;
    
    const experienceId = `experience-${Date.now()}`;
    
    // Create experience node (but don't add to canvas - only for banner)
    const experienceNode: Node = {
      id: experienceId,
      type: 'experience',
      position: { x: 0, y: 0 }, // Position doesn't matter since it won't be rendered
      data: {
        type: 'slack-canvas' as const,
        title,
        intent,
        content,
        sourceChartIds: [...selectedChartIds],
      },
    };

    // Add experience to nodes but don't show on canvas
    setNodes((nds) => [experienceNode, ...nds]);
    setSelectedChartIds([]);
  }, [selectedChartIds, setNodes]);

  const handleExperienceSelect = useCallback((experienceId: string) => {
    const previouslySelected = selectedExperienceId === experienceId;
    
    if (previouslySelected) {
      // Deselect - remove relationships
      setSelectedExperienceId(undefined);
      setHighlightedChartIds([]);
      setEdges((eds) => eds.filter(edge => !edge.id.startsWith(`temp-exp-${experienceId}`)));
    } else {
      // Select - show relationships
      setSelectedExperienceId(experienceId);
      
      // Find the experience node and highlight its connected charts
      const experienceNode = nodes.find(node => node.id === experienceId);
      if (experienceNode && experienceNode.type === 'experience') {
        const data = experienceNode.data as unknown as ExperienceData;
        setHighlightedChartIds(data.sourceChartIds);
        
        // Create temporary edges to show relationships
        const tempEdges: Edge[] = data.sourceChartIds.map(chartId => ({
          id: `temp-exp-${experienceId}-${chartId}`,
          source: chartId,
          target: chartId, // Self-connecting for visual effect
          type: 'default',
          style: { 
            stroke: 'hsl(var(--accent))', 
            strokeDasharray: '5,5',
            strokeWidth: 3,
          },
        }));
        
        // Remove any existing temp edges first
        setEdges((eds) => {
          const filtered = eds.filter(edge => !edge.id.startsWith('temp-exp-'));
          return [...filtered, ...tempEdges];
        });
      }
    }
  }, [nodes, selectedExperienceId, setEdges]);

  const handleExperienceOpen = useCallback((experienceId: string) => {
    const experienceNode = nodes.find(node => node.id === experienceId);
    if (experienceNode && experienceNode.type === 'experience') {
      const data = experienceNode.data as unknown as ExperienceData;
      setSelectedExperience(data);
      setShowExperienceDetail(true);
    }
  }, [nodes]);

  // Filter out experience nodes from canvas rendering
  const canvasNodes = nodes.filter(node => node.type !== 'experience');

  // Handle experience node selection to highlight connected charts
  const handleNodeSelectionChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  return (
    <CanvasProvider value={{ 
      onSuggestedQuestionSelect: handleSuggestedQuestionSelect,
      onPromptSubmit: handlePromptSubmit,
      selectedChartIds,
      onChartSelect: handleChartSelect,
      onGenerateSlackCanvas: handleGenerateSlackCanvas,
      highlightedChartIds,
    }}>
      <div className="h-screen flex flex-col">
        <ExperienceBanner
          experiences={nodes}
          onExperienceSelect={handleExperienceSelect}
          onExperienceOpen={handleExperienceOpen}
          selectedExperienceId={selectedExperienceId}
        />
        
        <div className="flex-1 flex">
          {showLineageView ? (
            <LineageView 
              onBack={() => setShowLineageView(false)}
              agentActions={agentActions}
              showAgentForce={showAgentForce}
              onCloseAgentForce={() => setShowAgentForce(false)}
              onOpenAgentForce={() => setShowAgentForce(true)}
              canvasNodes={nodes}
              edges={edges}
              selectedVisualizationId={selectedVisualizationId}
              onVisualizationSelect={setSelectedVisualizationId}
            />
          ) : (
            <>
              <SemanticModelSidebar 
                selectedFields={selectedFields}
                onFieldSelectionChange={setSelectedFields}
              />
              
              <div 
                className="flex-1 canvas-background relative"
              >
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowLineageView(true)}
                  className="shadow-lg"
                >
                  Lineage View
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAgentForce(!showAgentForce)}
                  className="shadow-lg"
                >
                  AgentForce ({agentActions.length})
                </Button>
                {selectedChartIds.length > 0 && (
                  <Button
                    onClick={() => handleGenerateSlackCanvas(selectedChartIds)}
                    className="shadow-lg"
                  >
                    Generate Slack Canvas ({selectedChartIds.length})
                  </Button>
                )}
              </div>
              
              {showRelationshipViewer && (
                <div className="absolute top-16 right-4 z-20">
                  <RelationshipViewer
                    selectedVisualizationId={selectedVisualizationId}
                    onClose={() => setShowRelationshipViewer(false)}
                  />
                </div>
              )}
              <ReactFlow
                nodes={canvasNodes}
                edges={edges}
                onNodesChange={handleNodeSelectionChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
                minZoom={0.1}
                maxZoom={4}
                className="bg-transparent"
                onDrop={handleFieldDrop}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'copy';
                }}
                onPaneClick={(event) => {
                  if (event.detail === 2) { // Double click
                    const reactFlowBounds = (event.target as Element).closest('.react-flow')?.getBoundingClientRect();
                    if (reactFlowBounds) {
                      const position = {
                        x: event.clientX - reactFlowBounds.left - 150,
                        y: event.clientY - reactFlowBounds.top - 50,
                      };
                      
                      const promptNode: Node = {
                        id: `prompt-${Date.now()}`,
                        type: 'prompt',
                        position,
                        data: { prompt: '', isActive: true },
                      };
                      
                      setNodes((nds) => [...nds, promptNode]);
                    }
                  }
                }}
            >
              <Background 
                gap={24} 
                size={1} 
                className="opacity-30"
              />
              <Controls className="bg-card border border-border shadow-lg" />
              <MiniMap 
                className="bg-card border border-border shadow-lg"
                nodeColor="#3b82f6"
                maskColor="rgb(240, 240, 240, 0.8)"
              />
              </ReactFlow>
              </div>
            </>
          )}
        </div>
        
        <SlackCanvasGenerator
          open={showSlackGenerator}
          onClose={() => setShowSlackGenerator(false)}
          selectedChartIds={selectedChartIds}
          onGenerate={handleSlackCanvasGenerate}
        />
        
        <ExperienceDetailDialog
          open={showExperienceDetail}
          onOpenChange={setShowExperienceDetail}
          experience={selectedExperience}
        />
        
        {!showLineageView && (
          <AgentForce
            actions={agentActions}
            isOpen={showAgentForce}
            onClose={() => setShowAgentForce(false)}
            onOpenLineageView={() => {
              setShowLineageView(true);
              setShowAgentForce(true);
            }}
            selectedAssetId={null}
            selectedAssetName={undefined}
            selectedVisualizationDbId={selectedVisualizationId}
            onPromptSelect={(prompt, agentType) => {
              // Find a chart position for the new prompt - use default center position
              const position = { x: 400, y: 200 };
              handlePromptSubmit(prompt, position);
            }}
            selectedPrompt={undefined}
            onCreateAgentAction={handleCreateAgentAction}
          />
        )}
      </div>
    </CanvasProvider>
  );
}