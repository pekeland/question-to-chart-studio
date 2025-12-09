import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Database, BarChart3, Monitor, FileText } from 'lucide-react';
import { Badge } from './ui/badge';
import { AgentForce, AgentAction } from './AgentForce';
import { useRelationships } from '@/hooks/useRelationships';

interface Asset {
  id: string;
  name: string;
  type: 'data-source' | 'semantic-model' | 'visualization' | 'dashboard' | 'prep' | 'data';
  description?: string;
  relatedAssets?: string[];
}

interface LineageViewProps {
  onBack: () => void;
  agentActions: AgentAction[];
  showAgentForce: boolean;
  onCloseAgentForce: () => void;
  onOpenAgentForce: () => void;
  canvasNodes: Node[]; // All nodes from canvas (charts, prompts, etc.)
  edges: Edge[]; // Add edges from canvas
  selectedVisualizationId?: string; // Pass down from parent
  onVisualizationSelect?: (id: string | undefined) => void; // Callback to update parent
}

const AssetNode = ({ data }: { data: Asset & { isSelected: boolean; isHighlighted: boolean; onSelect: (id: string) => void } }) => {
  const getIcon = () => {
    switch (data.type) {
      case 'data-source': return <Database className="h-4 w-4" />;
      case 'semantic-model': return <FileText className="h-4 w-4" />;
      case 'visualization': return <BarChart3 className="h-4 w-4" />;
      case 'dashboard': return <Monitor className="h-4 w-4" />;
      case 'prep': return <Database className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
    }
  };

  const getTypeColor = () => {
    switch (data.type) {
      case 'data-source': return 'bg-blue-500';
      case 'semantic-model': return 'bg-green-500';
      case 'visualization': return 'bg-purple-500';
      case 'dashboard': return 'bg-orange-500';
      case 'prep': return 'bg-yellow-500';
      case 'data': return 'bg-red-500';
    }
  };

  return (
    <Card 
      className={`w-64 cursor-pointer transition-all duration-300 ${
        data.isSelected ? 'ring-2 ring-primary shadow-lg' : ''
      } ${
        data.isHighlighted 
          ? 'ring-2 ring-primary/60 shadow-md bg-primary/5 border-primary/30' 
          : ''
      } hover:shadow-md relative`}
      onClick={() => data.onSelect(data.id)}
    >
      {/* Add connection handles for React Flow */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
      
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`${getTypeColor()} p-1.5 rounded text-white flex-shrink-0`}>
            {getIcon()}
          </div>
          <CardTitle className="text-sm font-medium">{data.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Badge variant="outline" className="text-xs">
          {data.type.replace('-', ' ')}
        </Badge>
        {data.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {data.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const nodeTypes = {
  asset: AssetNode,
};

export function LineageView({ 
  onBack, 
  agentActions, 
  showAgentForce, 
  onCloseAgentForce, 
  onOpenAgentForce, 
  canvasNodes, 
  edges: canvasEdges,
  selectedVisualizationId,
  onVisualizationSelect
}: LineageViewProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [highlightedAssetIds, setHighlightedAssetIds] = useState<string[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  
  const { getVisualizationsGeneratedByQuestion } = useRelationships();

  // Convert chart nodes from canvas to assets
  const assets: Asset[] = useMemo(() => {
    const semanticModels: Asset[] = [
      { 
        id: 'sm-1', 
        name: 'Sales Semantic Model', 
        type: 'semantic-model', 
        description: 'Sales metrics and KPIs',
        relatedAssets: ['prep-1'] // Points to Sales prep
      },
      { 
        id: 'sm-2', 
        name: 'Customer Semantic Model', 
        type: 'semantic-model', 
        description: 'Customer analytics and insights',
        relatedAssets: ['prep-2'] // Points to Customer prep
      },
    ];

    const prepAssets: Asset[] = [
      {
        id: 'prep-1',
        name: 'Sales Data Prep',
        type: 'prep',
        description: 'Data preparation and transformation for sales data',
        relatedAssets: ['data-1', 'data-2'] // Points to Sales and Revenue databases
      },
      {
        id: 'prep-2', 
        name: 'Customer Data Prep',
        type: 'prep',
        description: 'Data preparation and transformation for customer data',
        relatedAssets: ['data-3'] // Points to Customer database
      },
    ];

    const dataAssets: Asset[] = [
      {
        id: 'data-1',
        name: 'Sales Database',
        type: 'data',
        description: 'Primary sales transactions database',
        relatedAssets: [] // Bottom layer - no children
      },
      {
        id: 'data-2',
        name: 'Revenue Database', 
        type: 'data',
        description: 'Revenue and financial data warehouse',
        relatedAssets: [] // Bottom layer - no children
      },
      {
        id: 'data-3',
        name: 'Customer Database',
        type: 'data', 
        description: 'Customer profiles and behavior data',
        relatedAssets: [] // Bottom layer - no children
      },
    ];
    
    const visualizations: Asset[] = canvasNodes
      .filter(node => node.type === 'chart')
      .map(node => {
        // Determine which semantic model this visualization belongs to
        const title = String(node.data.title || '').toLowerCase();
        const semanticModelId = (title.includes('sales') || title.includes('revenue')) ? 'sm-1' : 'sm-2';
        
        return {
          id: node.id,
          name: (node.data.title as string) || `Chart ${node.id}`,
          type: 'visualization' as const,
          description: `${node.data.chartType} chart with ${(node.data.fields as any[])?.length || 0} fields`,
          relatedAssets: [semanticModelId], // Visualization points to its semantic model
        };
      });
    
    return [...semanticModels, ...prepAssets, ...dataAssets, ...visualizations];
  }, [canvasNodes]);

  const swimlanes = useMemo(() => {
    const typeOrder = ['visualization', 'semantic-model', 'prep', 'data'];

    return typeOrder.map((type, typeIndex) => {
      const typeAssets = assets.filter(asset => asset.type === type);
      return {
        type,
        assets: typeAssets,
        y: typeIndex * 400 + 100,
      };
    });
  }, [assets]);

  const handleAssetSelect = useCallback((assetId: string) => {
    console.log('🎯 Asset selected:', assetId);
    
    // If clicking the same asset, deselect it
    if (selectedAssetId === assetId) {
      setSelectedAssetId(null);
      onVisualizationSelect?.(undefined);
      setHighlightedAssetIds([]);
      setSelectedPrompt(null);
      return;
    }
    
    setSelectedAssetId(assetId);
    setSelectedPrompt(null);
    
    // If selecting a visualization, get its database ID for AgentForce filtering
    const selectedAsset = assets.find(a => a.id === assetId);
    if (selectedAsset?.type === 'visualization') {
      // Find the canvas node to get the database ID
      const canvasNode = canvasNodes.find(node => 
        node.type === 'chart' && 
        node.data?.title === selectedAsset.name
      );
      if (canvasNode?.data?.dbId && typeof canvasNode.data.dbId === 'string') {
        onVisualizationSelect?.(canvasNode.data.dbId);
      }
    } else {
      onVisualizationSelect?.(undefined);
    }
    
    // Clear highlights when selecting an asset
    setHighlightedAssetIds([]);
  }, [assets, canvasNodes, selectedAssetId]);

  const handlePromptSelect = useCallback(async (prompt: string, agentType: AgentAction['agentType']) => {
    console.log('🎯 Prompt selected:', prompt, 'Agent type:', agentType);
    
    // If empty prompt (deselection), clear everything
    if (!prompt || prompt === '') {
      setSelectedPrompt(null);
      setSelectedAssetId(null);
      onVisualizationSelect?.(undefined);
      setHighlightedAssetIds([]);
      console.log('🧹 Cleared all selections and highlights');
      return;
    }
    
    setSelectedPrompt(prompt);
    setSelectedAssetId(null);
    onVisualizationSelect?.(undefined);
    
    // Check if this question only has DataProModel agent actions
    const questionAgentActions = agentActions.filter(action => action.relatedPrompt === prompt);
    const isDataProModelOnly = questionAgentActions.length > 0 && 
                              questionAgentActions.every(action => action.agentType === 'ModelAgent');
    
    if (isDataProModelOnly) {
      // Highlight the Customer Semantic Model specifically
      const customerSemanticModel = assets.find(asset => 
        asset.type === 'semantic-model' && asset.name === 'Customer Semantic Model'
      );
      
      if (customerSemanticModel) {
        console.log('🎯 Highlighting Customer Semantic Model for DataProModel-only question');
        setHighlightedAssetIds([customerSemanticModel.id]);
        return;
      }
    }
    
    try {
      // Get only visualizations with "generates" relationship to this question
      const data = await getVisualizationsGeneratedByQuestion(prompt);
      console.log('📊 Generated visualizations data:', data);
      
      if (data && data.length > 0) {
        const visualizationIds: string[] = [];
        
        // Extract visualization IDs and map them to asset IDs
        data.forEach(questionData => {
          questionData.question_visualization_relationships?.forEach(rel => {
            if (rel.relationship_type === 'generates' && rel.visualizations) {
              // Find the corresponding asset by matching visualization title
              const matchingAsset = assets.find(asset => 
                asset.type === 'visualization' && 
                asset.name === rel.visualizations.title
              );
              if (matchingAsset) {
                visualizationIds.push(matchingAsset.id);
              }
            }
          });
        });
        
        console.log('🎯 Visualizations to highlight (with generates relationship):', visualizationIds);
        
        // Find semantic models connected to highlighted visualizations
        const relatedSemanticModels = assets.filter(asset => {
          if (asset.type !== 'semantic-model') return false;
          return visualizationIds.some(vizId => {
            const viz = assets.find(a => a.id === vizId);
            return viz?.relatedAssets?.includes(asset.id);
          });
        });
        
        console.log('🏗️ Related semantic models:', relatedSemanticModels.map(sm => sm.name));
        
        // Combine visualization and semantic model IDs for highlighting
        const allRelatedAssets = [
          ...visualizationIds,
          ...relatedSemanticModels.map(model => model.id)
        ];
        
        console.log('✨ Final highlighted assets (generates only):', allRelatedAssets);
        setHighlightedAssetIds(allRelatedAssets);
      } else {
        console.log('🚫 No visualizations with "generates" relationship found');
        setHighlightedAssetIds([]);
      }
    } catch (error) {
      console.error('❌ Error fetching generated visualizations:', error);
      setHighlightedAssetIds([]);
    }
  }, [assets, getVisualizationsGeneratedByQuestion, agentActions]);

  // Generate nodes and edges for React Flow
  const { nodes, edges: lineageEdges } = useMemo(() => {
    const flowNodes: Node[] = [];
    const lineageEdges: Edge[] = [];

    // Calculate total width available for positioning
    const containerWidth = typeof window !== 'undefined' ? window.innerWidth - (showAgentForce ? 384 : 0) : 1200;
    const cardSpacing = 320; // Width of card (256px) + spacing
    
    swimlanes.forEach((swimlane, swimlaneIndex) => {
        swimlane.assets.forEach((asset, assetIndex) => {
          // Calculate center position and distribute cards evenly
          const totalWidth = (swimlane.assets.length - 1) * cardSpacing;
          const startX = (containerWidth - totalWidth) / 2;
          
          const node: Node = {
            id: asset.id,
            type: 'asset',
            position: { 
              x: startX + assetIndex * cardSpacing,
              y: swimlane.y 
            },
          data: {
            ...asset,
            isSelected: selectedAssetId === asset.id,
            isHighlighted: highlightedAssetIds.includes(asset.id),
            onSelect: handleAssetSelect,
          },
        };
        
        // Debug logging for highlighting
        if (highlightedAssetIds.includes(asset.id)) {
          console.log(`🎯 Asset ${asset.name} (${asset.id}) should be highlighted`);
        }
        flowNodes.push(node);

        // Create edges from all asset types to their related assets
        // This will handle: visualizations → semantic models, semantic models → prep, prep → data
        const currentAsset = assets.find(a => a.id === asset.id);
        if (currentAsset?.relatedAssets) {
          currentAsset.relatedAssets.forEach(relatedId => {
            // Only create edge if both source and target nodes exist
            const sourceExists = assets.some(a => a.id === currentAsset.id);
            const targetExists = assets.some(a => a.id === relatedId);
            
            if (sourceExists && targetExists) {
              console.log(`Creating edge: ${currentAsset.id} (${currentAsset.name}) -> ${relatedId}`);
              lineageEdges.push({
                id: `${currentAsset.id}-${relatedId}`,
                source: currentAsset.id,
                target: relatedId,
                type: 'default',
                style: { 
                  stroke: selectedAssetId === asset.id || selectedAssetId === relatedId ? 'hsl(var(--primary))' : 'hsl(var(--foreground))', 
                  strokeWidth: selectedAssetId === asset.id || selectedAssetId === relatedId ? 3 : 2,
                  opacity: 1,
                },
                animated: selectedAssetId === asset.id || selectedAssetId === relatedId,
              });
            } else {
              console.log(`Skipping edge - missing nodes: source ${currentAsset.id} exists: ${sourceExists}, target ${relatedId} exists: ${targetExists}`);
            }
          });
        }
      });
    });

    return { nodes: flowNodes, edges: lineageEdges };
  }, [swimlanes, selectedAssetId, highlightedAssetIds, handleAssetSelect, assets, showAgentForce]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState(lineageEdges);

  // Update nodes when selectedAssetId changes
  useEffect(() => {
    setFlowNodes(nodes);
    setReactFlowEdges(lineageEdges);
  }, [nodes, lineageEdges, setFlowNodes, setReactFlowEdges]);

  return (
    <div className="flex-1 flex">
      {/* Main lineage view */}
      <div className={`flex flex-col bg-background ${showAgentForce ? 'flex-1' : 'w-full'}`}>
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Canvas
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Lineage View</h1>
                <p className="text-sm text-muted-foreground">
                  Select an asset to view its lineage relationships
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onOpenAgentForce}
                className="shadow-lg"
              >
                AgentForce ({agentActions.length})
              </Button>
            </div>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={flowNodes}
            edges={reactFlowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView={true}
            fitViewOptions={{ padding: 0.1, minZoom: 0.1, maxZoom: 4 }}
            minZoom={0.1}
            maxZoom={4}
            className="bg-transparent"
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
          >
            <Background 
              gap={24} 
              size={1} 
              className="opacity-20"
            />
            <Controls className="bg-card border border-border shadow-lg" />
            <MiniMap 
              className="bg-card border border-border shadow-lg"
              nodeColor="#3b82f6"
              maskColor="rgb(240, 240, 240, 0.8)"
            />
          </ReactFlow>
        </div>
      </div>

      {/* AgentForce panel */}
      {showAgentForce && (
        <AgentForce
          actions={agentActions}
          isOpen={true}
          onClose={onCloseAgentForce}
          onOpenLineageView={() => {}}
          selectedAssetId={selectedAssetId}
          selectedAssetName={selectedAssetId ? assets.find(a => a.id === selectedAssetId)?.name : undefined}
          selectedVisualizationDbId={selectedVisualizationId}
          onPromptSelect={handlePromptSelect}
          selectedPrompt={selectedPrompt}
        />
      )}
    </div>
  );
}