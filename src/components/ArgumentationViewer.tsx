import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Brain, Lightbulb, AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface ArgumentationViewerProps {
  open: boolean;
  onClose: () => void;
  data: {
    title: string;
    intent: string;
    content: string;
    sourceChartIds: string[];
  };
}

interface ArgumentNode {
  id: string;
  type: 'outcome' | 'reason' | 'objection' | 'claim';
  title: string;
  description: string;
  chartIds?: string[];
  strength: 'high' | 'medium' | 'low';
  isExpanded?: boolean;
  parentId?: string;
}

export function ArgumentationViewer({ open, onClose, data }: ArgumentationViewerProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['outcome']));
  
  // Generate argumentation structure following proper information architecture
  const generateArgumentStructure = (): ArgumentNode[] => {
    const chartCount = data.sourceChartIds.length;
    
    // Calculate 80% reasons, 20% objections with minimum 1 of each if charts available
    const totalParents = Math.max(2, Math.min(chartCount, 6)); // Limit to reasonable number
    const reasonCount = Math.max(1, Math.floor(totalParents * 0.8));
    const objectionCount = Math.max(chartCount > 1 ? 1 : 0, totalParents - reasonCount);
    
    // Distribute charts among parents, ensuring each has at least one claim
    const shuffledCharts = [...data.sourceChartIds].sort(() => Math.random() - 0.5);
    
    // Generate creative reasoning content
    const reasoningTemplates = [
      "Performance metrics demonstrate a clear upward trajectory",
      "Cross-functional data reveals strong operational efficiency", 
      "Market indicators validate strategic positioning",
      "Customer behavior patterns support growth assumptions",
      "Financial data confirms sustainable revenue streams",
      "Collaborative outcomes show improved team dynamics",
      "Resource allocation efficiency exceeds baseline expectations",
      "Stakeholder engagement metrics indicate strong buy-in"
    ];
    
    const objectionTemplates = [
      "Market volatility introduces uncertainty to projections",
      "Seasonal variations may impact consistency",
      "External factors could influence future performance", 
      "Data sampling limitations require careful interpretation",
      "Competitive dynamics may shift market conditions",
      "Implementation complexity may affect timeline adherence",
      "Resource constraints could limit scalability potential",
      "Regulatory changes might influence operational feasibility"
    ];

    const claimTemplates = [
      "Evidence from visualization confirms hypothesis",
      "Data patterns support strategic direction", 
      "Quantitative analysis validates approach",
      "Metrics demonstrate clear correlation",
      "Statistical insights reinforce conclusion",
      "Performance indicators align with expectations",
      "Comparative analysis reveals competitive advantage",
      "Trend analysis supports long-term viability"
    ];

    const nodes: ArgumentNode[] = [];
    
    // Create outcome node
    nodes.push({
      id: 'outcome',
      type: 'outcome',
      title: data.intent,
      description: 'The strategic decision derived from comprehensive data analysis',
      strength: 'high'
    });

    let chartIndex = 0;
    
    // Create reason nodes with their claims
    for (let i = 0; i < reasonCount; i++) {
      const reasonId = `reason-${i + 1}`;
      const reasonTemplate = reasoningTemplates[Math.floor(Math.random() * reasoningTemplates.length)];
      
      // Assign 1-3 charts to this reason
      const chartsForReason = Math.min(3, Math.max(1, Math.floor((shuffledCharts.length - chartIndex) / (reasonCount + objectionCount - i))));
      const reasonCharts = shuffledCharts.slice(chartIndex, chartIndex + chartsForReason);
      chartIndex += chartsForReason;
      
      nodes.push({
        id: reasonId,
        type: 'reason',
        title: reasonTemplate,
        description: `Supporting evidence from ${reasonCharts.length} key visualization${reasonCharts.length > 1 ? 's' : ''} demonstrates strong alignment with strategic objectives`,
        chartIds: reasonCharts,
        strength: 'high'
      });

      // Create claim nodes for this reason
      reasonCharts.forEach((chartId, claimIndex) => {
        const claimTemplate = claimTemplates[Math.floor(Math.random() * claimTemplates.length)];
        nodes.push({
          id: `claim-${reasonId}-${claimIndex}`,
          type: 'claim',
          title: `Evidence: Chart ${chartId.split('-')[1]}`,
          description: claimTemplate,
          chartIds: [chartId],
          strength: 'high',
          parentId: reasonId
        });
      });
    }

    // Create objection nodes with their claims
    for (let i = 0; i < objectionCount; i++) {
      const objectionId = `objection-${i + 1}`;
      const objectionTemplate = objectionTemplates[Math.floor(Math.random() * objectionTemplates.length)];
      
      // Assign remaining charts to objections
      const chartsForObjection = Math.min(3, Math.max(1, Math.floor((shuffledCharts.length - chartIndex) / (objectionCount - i))));
      const objectionCharts = shuffledCharts.slice(chartIndex, chartIndex + chartsForObjection);
      chartIndex += chartsForObjection;
      
      if (objectionCharts.length > 0) {
        nodes.push({
          id: objectionId,
          type: 'objection',
          title: objectionTemplate,
          description: `Critical considerations from ${objectionCharts.length} data point${objectionCharts.length > 1 ? 's' : ''} that warrant careful evaluation before final implementation`,
          chartIds: objectionCharts,
          strength: 'medium'
        });

        // Create claim nodes for this objection
        objectionCharts.forEach((chartId, claimIndex) => {
          const claimTemplate = claimTemplates[Math.floor(Math.random() * claimTemplates.length)];
          nodes.push({
            id: `claim-${objectionId}-${claimIndex}`,
            type: 'claim',
            title: `Consideration: Chart ${chartId.split('-')[1]}`,
            description: claimTemplate,
            chartIds: [chartId],
            strength: 'medium',
            parentId: objectionId
          });
        });
      }
    }
    
    return nodes;
  };

  const argumentNodes = generateArgumentStructure();
  
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'outcome': return <Brain className="h-5 w-5" />;
      case 'reason': return <Lightbulb className="h-5 w-5" />;
      case 'objection': return <AlertTriangle className="h-5 w-5" />;
      case 'claim': return <div className="h-5 w-5 rounded-full bg-primary/20 border-2 border-primary" />;
      default: return null;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'outcome': return 'bg-primary/10 border-primary';
      case 'reason': return 'bg-green-50 border-green-500 dark:bg-green-950 dark:border-green-400';
      case 'objection': return 'bg-orange-50 border-orange-500 dark:bg-orange-950 dark:border-orange-400';
      case 'claim': return 'bg-secondary/50 border-accent';
      default: return 'bg-background border-border';
    }
  };

  const getStrengthLineStyle = (strength: string) => {
    const styles = {
      high: 'border-t-4 border-primary',
      medium: 'border-t-2 border-orange-500', 
      low: 'border-t-1 border-muted-foreground'
    };
    return styles[strength as keyof typeof styles] || styles.medium;
  };

  const getConnectionLineStyle = (strength: string) => {
    const styles = {
      high: 'h-2 bg-primary',
      medium: 'h-1 bg-orange-500',
      low: 'h-0.5 bg-muted-foreground'
    };
    return styles[strength as keyof typeof styles] || styles.medium;
  };

  const outcome = argumentNodes.find(node => node.type === 'outcome');
  const reasons = argumentNodes.filter(node => node.type === 'reason');
  const objections = argumentNodes.filter(node => node.type === 'objection');
  const claims = argumentNodes.filter(node => node.type === 'claim');
  
  // Helper function to get claims for a specific parent
  const getClaimsForParent = (parentId: string) => 
    claims.filter(claim => claim.parentId === parentId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Argumentation Analysis: {data.title}
            <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-4">
            {/* Header explanation */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  This visualization shows the logical structure of your Slack canvas argumentation, 
                  helping you understand how different data visualizations support or challenge your conclusion.
                </p>
              </CardContent>
            </Card>

            {/* Argumentation Structure */}
            <div className="space-y-8">
              {/* Outcome */}
              {outcome && (
                <div className="flex justify-center">
                  <Card className={`w-80 ${getNodeColor(outcome.type)} border-2`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {getNodeIcon(outcome.type)}
                        Outcome
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-medium mb-1">{outcome.title}</h4>
                      <p className="text-sm text-muted-foreground">{outcome.description}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Connection Lines with Thickness */}
              <div className="flex justify-center">
                <div className={`grid gap-16 ${objections.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="flex flex-col items-center">
                    <div className={`w-px h-8 ${getConnectionLineStyle('high')}`}></div>
                    <span className="text-xs text-muted-foreground bg-background px-2 border rounded">
                      Because
                    </span>
                    <div className={`w-px h-8 ${getConnectionLineStyle('high')}`}></div>
                  </div>
                  {objections.length > 0 && (
                    <div className="flex flex-col items-center">
                      <div className={`w-px h-8 ${getConnectionLineStyle('medium')}`}></div>
                      <span className="text-xs text-muted-foreground bg-background px-2 border rounded">
                        However
                      </span>
                      <div className={`w-px h-8 ${getConnectionLineStyle('medium')}`}></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reasons and Objections */}
              <div className={`grid gap-8 ${objections.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {/* Reasons Column */}
                <div className="space-y-4">
                  {reasons.map((reason) => (
                    <Collapsible 
                      key={reason.id} 
                      open={expandedNodes.has(reason.id)}
                      onOpenChange={() => toggleNode(reason.id)}
                    >
                      <Card className={`${getNodeColor(reason.type)} border-2 ${getStrengthLineStyle(reason.strength)}`}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/20">
                            <CardTitle className="flex items-center justify-between text-lg">
                              <div className="flex items-center gap-2">
                                {getNodeIcon(reason.type)}
                                Reason
                              </div>
                              {expandedNodes.has(reason.id) ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                              }
                            </CardTitle>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent>
                            <h4 className="font-medium mb-1">{reason.title}</h4>
                            <p className="text-sm text-muted-foreground mb-3">{reason.description}</p>
                            
                            {/* Claims for this reason */}
                            <div className="space-y-2 mt-4">
                              {getClaimsForParent(reason.id).map((claim) => (
                                <Card key={claim.id} className={`${getNodeColor(claim.type)} border ${getStrengthLineStyle(claim.strength)}`}>
                                  <CardContent className="pt-3 pb-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      {getNodeIcon(claim.type)}
                                      <h5 className="text-sm font-medium">{claim.title}</h5>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">{claim.description}</p>
                                    {claim.chartIds && (
                                      <div className="flex flex-wrap gap-1">
                                        {claim.chartIds.map((chartId) => (
                                          <Badge key={chartId} variant="outline" className="text-xs">
                                            Chart {chartId.split('-')[1]}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>

                {/* Objections Column */}
                {objections.length > 0 && (
                  <div className="space-y-4">
                    {objections.map((objection) => (
                      <Collapsible 
                        key={objection.id} 
                        open={expandedNodes.has(objection.id)}
                        onOpenChange={() => toggleNode(objection.id)}
                      >
                        <Card className={`${getNodeColor(objection.type)} border-2 ${getStrengthLineStyle(objection.strength)}`}>
                          <CollapsibleTrigger asChild>
                            <CardHeader className="pb-2 cursor-pointer hover:bg-muted/20">
                              <CardTitle className="flex items-center justify-between text-lg">
                                <div className="flex items-center gap-2">
                                  {getNodeIcon(objection.type)}
                                  Objection
                                </div>
                                {expandedNodes.has(objection.id) ? 
                                  <ChevronUp className="h-4 w-4" /> : 
                                  <ChevronDown className="h-4 w-4" />
                                }
                              </CardTitle>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent>
                              <h4 className="font-medium mb-1">{objection.title}</h4>
                              <p className="text-sm text-muted-foreground mb-3">{objection.description}</p>
                              
                              {/* Claims for this objection */}
                              <div className="space-y-2 mt-4">
                                {getClaimsForParent(objection.id).map((claim) => (
                                  <Card key={claim.id} className={`${getNodeColor(claim.type)} border ${getStrengthLineStyle(claim.strength)}`}>
                                    <CardContent className="pt-3 pb-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        {getNodeIcon(claim.type)}
                                        <h5 className="text-sm font-medium">{claim.title}</h5>
                                      </div>
                                      <p className="text-xs text-muted-foreground mb-2">{claim.description}</p>
                                      {claim.chartIds && (
                                        <div className="flex flex-wrap gap-1">
                                          {claim.chartIds.map((chartId) => (
                                            <Badge key={chartId} variant="outline" className="text-xs">
                                              Chart {chartId.split('-')[1]}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}