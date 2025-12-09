export interface FieldType {
  id: string;
  name: string;
  type: 'dimension' | 'measure';
  dataType: 'string' | 'number' | 'date' | 'boolean';
  table: string;
  description?: string;
}

export interface ChartData {
  fields: FieldType[];
  chartType: 'bar' | 'line' | 'pie' | 'table' | 'scatter';
  title: string;
  isAIGenerated?: boolean;
  isHighlighted?: boolean;
  involvedAgents?: ('DataProPrep' | 'DataProFind' | 'DataProModel')[];
}

export interface PromptData {
  prompt: string;
  isActive: boolean;
  response?: string;
}

export interface SuggestedQuestion {
  id: string;
  question: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ExperienceData {
  type: 'slack-canvas';
  title: string;
  intent: string;
  content: string;
  sourceChartIds: string[];
}